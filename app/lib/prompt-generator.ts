
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

    // Format keywords for natural language (e.g., "AI, Analytics, and Data")
    const keywordStr = keywords.length > 0 ? keywords.join(', ') : 'industry solutions';
    const mainKeyword = keywords.length > 0 ? keywords[0] : 'solutions';

    return [
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
}
