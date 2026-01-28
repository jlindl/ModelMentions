
export interface PromptStrategy {
    type: 'Discovery' | 'Market' | 'Problem';
    text: string;
}

export interface UserProfile {
    industry?: string;
    keywords?: string[];
    competitors?: string[];
    company_name?: string;
}

export function generatePrompts(profile: UserProfile): PromptStrategy[] {
    const { industry = 'Software', keywords = [], company_name = 'Brand' } = profile;

    // Format keywords for natural language
    const keywordStr = keywords.length > 0 ? keywords.join(', ') : 'industry solutions';
    const mainKeyword = keywords.length > 0 ? keywords[0] : 'solutions';

    const basePrompts: { type: 'Discovery' | 'Market' | 'Problem'; text: string }[] = [
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

    // Wrap in System Constraints for JSON output
    return basePrompts.map(p => ({
        type: p.type,
        text: `
SYSTEM CONTEXT: You are an expert market analyst simulator.
USER QUERY: "${p.text}"

TASK:
1. Simulate the likely response of a helpful AI assistant.
2. Check if the brand "${company_name}" is present in that response.

OUTPUT FORMAT:
Return a JSON object (no markdown, no thinking):
{
  "is_mentioned": boolean,
  "rank": number | null,
  "sentiment": number (-1.0 to 1.0),
  "response_text": "The simulated response content..."
}`.trim()
    }));
}
