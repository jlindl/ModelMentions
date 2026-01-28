import { createClient } from '@supabase/supabase-js';

export interface LLMResponse {
    text: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost?: number; // Estimated or actual cost in USD
    model: string;
    cached?: boolean;
}

export interface LLMRequest {
    model: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    jsonMode?: boolean;
}

const API_KEY = process.env.OPENAI_API_KEY || process.env.OpenRouter_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || (process.env.OpenRouter_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

// Cache Client (Service Role for backend ops) - Lazy Init
export function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

async function toHash(str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    if (!API_KEY) {
        throw new Error('Missing API Key. Please set OPENAI_API_KEY or OpenRouter_API_KEY in .env.local');
    }

    // 1. Check Cache
    const supabase = getSupabaseAdmin();
    const hashKey = JSON.stringify({ model: request.model, messages: request.messages });
    const hash = await toHash(hashKey);

    const { data: cached } = await supabase
        .from('llm_cache')
        .select('*')
        .eq('hash', hash)
        .single();

    // Cache valid for 7 days
    if (cached) {
        const age = Date.now() - new Date(cached.created_at).getTime();
        if (age < 7 * 24 * 60 * 60 * 1000) {
            return {
                text: cached.response_text,
                usage: cached.usage,
                cost: 0,
                model: cached.model,
                cached: true
            };
        }
    }

    try {
        const body: {
            model: string;
            messages: { role: string; content: string }[];
            temperature: number;
            response_format?: { type: 'json_object' };
        } = {
            model: request.model,
            messages: request.messages,
            temperature: request.temperature || 0.7,
        };

        if (request.jsonMode) {
            body.response_format = { type: 'json_object' };
        }

        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                // OpenRouter specific headers (optional, good for rankings)
                'HTTP-Referer': 'https://modelmentions.com',
                'X-Title': 'ModelMentions',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API Error (${response.status}): ${errorText}`);
        }

        let cost = 0;
        // Try to parse OpenRouter cost header if available
        // Note: fetch headers are case-insensitive
        const costHeader = response.headers.get('x-openrouter-cost');
        if (costHeader) {
            cost = parseFloat(costHeader);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // 2. Save to Cache
        if (content) {
            await supabase.from('llm_cache').upsert({
                hash,
                model: request.model,
                response_text: content,
                usage: data.usage || {},
            });
        }

        return {
            text: content,
            usage: data.usage,
            cost: cost, // Add cost to return type
            model: data.model || request.model,
            cached: false
        };

    } catch (error) {
        console.error('LLM Call Failed:', error);
        throw error;
    }
}
