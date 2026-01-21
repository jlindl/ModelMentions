import { createClient } from '../../utils/supabase/server';
import { NextResponse } from 'next/server';
import { callLLM } from '../../lib/llm';

const BATTLE_COST_CREDITS = 1;

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { competitorName, topic, model } = await request.json();

        if (!competitorName || !topic) {
            return NextResponse.json({ error: 'Missing competitor or topic' }, { status: 400 });
        }

        // 1. Check & Deduct Credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error('Profile not found');

        // Check Monthly Usage Reset (Safety check)
        await supabase.rpc('check_and_reset_usage', { user_id: user.id });

        // Check Credit Balance 
        // Note: For now we assume a simple 'credits_used' model where unlimited isn't really a thing unless plan limit is high.
        // We actually need to check against the PLAN LIMIT.
        // Let's re-fetch profile after reset potential
        const { data: freshProfile } = await supabase
            .from('profiles')
            .select('credits_used, plan, company_name')
            .eq('id', user.id)
            .single();

        const currentUsage = freshProfile?.credits_used || 0;
        const plan = freshProfile?.plan || 'free';

        const PLAN_CREDITS: Record<string, number> = {
            'free': 0.25, // minimal
            'pro': 10,
            'premium': 30,
            'ultra': 100
        };
        const creditLimit = PLAN_CREDITS[plan] || 0.25;

        // Cost is 1 Credit ($0.50 value approx)
        if (currentUsage + BATTLE_COST_CREDITS > creditLimit) {
            return NextResponse.json({
                error: `Not enough credits. This battle costs ${BATTLE_COST_CREDITS} credit.`
            }, { status: 403 });
        }

        // 2. Perform Comparison
        const myBrand = freshProfile?.company_name || "My Brand";

        const systemPrompt = `You are an unbiased Industry Analyst conducting a head-to-head product "Battlecard" comparison.
        You must be objective, critical, and decisive.
        
        Participants:
        1. CHALLENGER: ${myBrand} (The User)
        2. DEFENDER: ${competitorName}
        
        Topic: ${topic}
        `;

        const userPrompt = `
        Compare the two brands specifically on: "${topic}".
        
        Analysis Rules:
        - Ignore marketing fluff. Focus on public capabilities, verified reviews, and known specs.
        - If you don't know a specific fact, state "Unknown" rather than hallucinating.
        - Be concise.
        
        Output JSON format:
        {
            "winner": "Challenger" | "Defender" | "Draw",
            "winner_name": "<Winning Brand Name>",
            "reason": "<1 sentence verdict>",
            "challenger_strengths": ["<Strength 1>", "<Strength 2>"],
            "defender_strengths": ["<Strength 1>", "<Strength 2>"],
            "detailed_analysis": "<Markdown paragraph explaining the nuance>"
        }
        `;

        console.log(`Running Battle: ${myBrand} vs ${competitorName} on ${topic}`);

        const llmResponse = await callLLM({
            model: model || 'openai/gpt-4o', // Default to 4o for reasoning
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.4
        });

        // Parse JSON
        let result;
        try {
            const cleanJson = llmResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error('JSON Parse Error', llmResponse.text);
            throw new Error('Failed to generate valid battlecard data');
        }

        // 3. Deduct Credits on Success
        await supabase
            .from('profiles')
            .update({ credits_used: currentUsage + BATTLE_COST_CREDITS })
            .eq('id', user.id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Battle Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
