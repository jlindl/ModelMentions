import { callLLM } from './llm';

export interface PromptStrategy {
    type: 'Discovery' | 'Market' | 'Problem' | 'Custom';
    text: string;
}

export interface UserProfile {
    industry?: string;
    keywords?: string[];
    competitors?: string[];
    company_name?: string;
}

export async function generateVariations(basePrompt: string, count: number): Promise<string[]> {
    let retries = 3;

    while (retries > 0) {
        try {
            const completion = await callLLM({
                model: 'openai/gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert prompt engineer. Generate ${count} distinct search queries based on the user's base intent.
          
          Format: Return valid JSON array of strings.
          Example: ["query 1", "query 2"]
          
          Rules:
          - Variations should explore different angles (e.g. "Best tools for...", "Comparison of...", "How to solve...").
          - Keep them natural and realistic for a user searching on an AI model.
          - Do NOT range far from the original intent.`
                    },
                    {
                        role: 'user',
                        content: `Base Intent: "${basePrompt}". Generate ${count} variations.`
                    }
                ],
                jsonMode: true
            });

            let cleanedText = completion.text.trim();
            // Remove Markdown code blocks if present
            if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
            }

            let parsed;
            try {
                parsed = JSON.parse(cleanedText);
            } catch (e) {
                console.warn(`Attempt ${4 - retries}: JSON Parse failed. Raw: ${completion.text.substring(0, 100)}...`);
                // Force throw to trigger retry
                throw e;
            }

            let result: string[] | undefined;

            if (Array.isArray(parsed)) {
                result = parsed;
            } else if (parsed && typeof parsed === 'object') {
                // Try known keys or any array value
                if (Array.isArray(parsed.variations)) result = parsed.variations;
                else if (Array.isArray(parsed.prompts)) result = parsed.prompts;
                else {
                    // Fallback: find first array value
                    const firstArray = Object.values(parsed).find(v => Array.isArray(v));
                    if (firstArray) result = firstArray as string[];
                }
            }

            if (Array.isArray(result) && result.length > 0) {
                return result;
            }

            console.warn(`Attempt ${4 - retries}: Parsed JSON did not contain a valid array. Raw: ${cleanedText}`);

            console.warn(`Attempt ${4 - retries}: LLM returned empty variations.`);
        } catch (e) {
            console.error(`Attempt ${4 - retries}: Failed to generate variations`, e);
        }

        retries--;
        if (retries > 0) await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
    }

    console.warn("All retry attempts failed. Using base prompt fallback.");
    return [basePrompt];
}

export interface GenerateOptions {
    basePrompt?: string;
    variationCount?: number;
    fixedVariations?: string[];
}

export async function generatePrompts(profile: UserProfile, options?: GenerateOptions): Promise<PromptStrategy[]> {
    const { industry = 'Software', keywords = [], company_name = 'Brand' } = profile;
    const { basePrompt, variationCount = 3, fixedVariations } = options || {};

    let queries: string[] = [];

    // 1. Use Fixed Variations if provided
    if (fixedVariations && fixedVariations.length > 0) {
        queries = fixedVariations;
    }
    // 2. Or Generate from Base Prompt
    else if (basePrompt) {
        queries = await generateVariations(basePrompt, variationCount);
    }
    // 3. Or use Default Static Strategy
    else {
        // Format keywords for natural language
        const keywordStr = keywords.length > 0 ? keywords.join(', ') : 'industry solutions';
        const mainKeyword = keywords.length > 0 ? keywords[0] : 'solutions';

        const basePrompts = [
            {
                type: 'Discovery',
                text: `What are the best ${keywordStr} tools available in 2025? Please list the top 5 recommendations and explain why they are leaders.`
            },
            {
                type: 'Market',
                text: `Who are the leading providers in the ${industry} industry for ${mainKeyword}? Provide a market overview.`
            },
            {
                type: 'Problem',
                text: `I need a reliable enterprise solution for ${keywordStr} that scales well. What do you recommend?`
            }
        ];
        // Return immediately for legacy/default path to preserve specific "types"
        return basePrompts.map(p => ({
            type: p.type as any,
            text: formatSystemPrompt(p.text, company_name)
        }));
    }

    // Map simple queries to strategies
    return queries.slice(0, variationCount).map(text => ({
        type: 'Custom',
        text: formatSystemPrompt(text, company_name)
    }));
}

// Helper to just clean the query if needed, but no system wrapper anymore.
function formatSystemPrompt(query: string, companyName: string): string {
    return query;
}
