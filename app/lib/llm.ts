export interface LLMResponse {
    text: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost?: number; // Estimated or actual cost in USD
    model: string;
}

export interface LLMRequest {
    model: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
}

const API_KEY = process.env.OPENAI_API_KEY || process.env.OpenRouter_API_KEY;
// If using OpenRouter Key, default to OpenRouter URL, otherwise OpenAI
const BASE_URL = process.env.LLM_BASE_URL || (process.env.OpenRouter_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    if (!API_KEY) {
        throw new Error('Missing API Key. Please set OPENAI_API_KEY or OpenRouter_API_KEY in .env.local');
    }

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                // OpenRouter specific headers (optional, good for rankings)
                'HTTP-Referer': 'https://modelmentions.com',
                'X-Title': 'ModelMentions',
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                temperature: request.temperature || 0.7,
            }),
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

        return {
            text: content,
            usage: data.usage,
            cost: cost, // Add cost to return type
            model: data.model || request.model,
        };

    } catch (error) {
        console.error('LLM Call Failed:', error);
        throw error;
    }
}
