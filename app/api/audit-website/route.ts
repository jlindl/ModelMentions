import { createClient } from '../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { callLLM } from '../../lib/llm';

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // 1. Auth & Plan Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('website_url, plan')
        .eq('id', user.id)
        .single();

    if (!profile?.plan || profile.plan === 'free') {
        return NextResponse.json({
            error: 'This feature is only available on PRO plans and above.'
        }, { status: 403 });
    }

    // Check & Reset Monthly Usage
    const { error: rpcError } = await supabase.rpc('check_and_reset_usage', { user_id: user.id });
    if (rpcError) console.error('Reset RPC Error:', rpcError);

    // Re-fetch usage 
    const { data: freshProfile } = await supabase.from('profiles').select('audits_usage, plan').eq('id', user.id).single();

    const usage = freshProfile?.audits_usage || 0;
    const plan = freshProfile?.plan || 'pro';
    const LIMITS: Record<string, number> = { 'pro': 10, 'premium': 30, 'ultra': 200 };
    const limit = LIMITS[plan] || 10;

    if (usage >= limit) {
        return NextResponse.json({
            error: `Monthly Audit limit reached for ${plan.toUpperCase()} plan. (${usage}/${limit})`
        }, { status: 403 });
    }

    let { url } = await req.json().catch(() => ({}));
    if (!url) url = profile.website_url;
    if (!url) return NextResponse.json({ error: 'No website URL provided' }, { status: 400 });
    if (!url.startsWith('http')) url = `https://${url}`;

    try {
        // 2. Fetch & Parse with Cheerio
        const response = await fetch(url, {
            headers: { 'User-Agent': 'ModelMentions-Audit-Bot/1.0 (PRO; +http://modelmentions.com)' }
        });
        if (!response.ok) throw new Error(`Failed to fetch website: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        // 3. Extract Technical Signals
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content') || '';
        const h1 = $('h1').map((_, el) => $(el).text().trim()).get();
        const h2 = $('h2').map((_, el) => $(el).text().trim()).get();

        // Extract Schema.org
        const jsonLd: any[] = [];
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                jsonLd.push(JSON.parse($(el).html() || '{}'));
            } catch (e) { }
        });

        // Clean Text for LLM
        $('script, style, link, noscript, nav, footer, iframe, svg').remove();
        let mainContent = $('main, article, #content, .content, body').first().text();
        if (mainContent.length < 500) mainContent = $('body').text(); // Fallback
        mainContent = mainContent.replace(/\s+/g, ' ').trim().substring(0, 15000); // Token limit

        // 4. Advanced LLM Analysis
        const systemPrompt = `You are a Senior GEO (Generative Engine Optimization) Architect. 
        Analyze the provided website data to create a "Neural Capability Report".
        
        Your Goal: Determine if this brand serves clear, cited, structured facts that an LLM can easily retrieve.
        
        Input Data:
        - Title: ${title}
        - H1: ${h1.join(', ')}
        - JSON-LD Found: ${jsonLd.length > 0 ? 'Yes' : 'No'} (${jsonLd.map(i => i['@type']).join(', ')})
        - Content Sample: "${mainContent.substring(0, 2000)}..."
        `;

        const userPrompt = `
        Perform a Deep Neural Audit.
        
        1. **Entity Extraction**: Identify top 5 key entities (Product, Person, Service) found in the text.
        2. **Knowledge Graph Gaps**: What entities are MISSING that are expected for this industry?
        3. **Technical Schema**: Review the JSON-LD. If missing or weak, generate a valid JSON-LD snippet for this brand (Organization/Product).
        4. **Scoring**: Rate 0-100 on "Machine Legibility".

        Return EXACT JSON:
        {
            "score": <number>,
            "summary": "<1 sentence summary>",
            "tech_check": {
                "has_schema": <boolean>,
                "schema_type": "<string or null>",
                "missing_meta": ["<list of missing technical tags>"]
            },
            "knowledge_graph": {
                "entities": [
                    { "name": "<Entity Name>", "type": "Concept|Product|Organization", "confidence": "High|Medium|Low" }
                ],
                "missing_topics": ["<Topic A>", "<Topic B>"]
            },
            "schema_suggestion": {
                "code": "<Valid JSON-LD String here>",
                "explanation": "<Why this schema helps>"
            },
            "recommendations": [
                { "title": "<Action>", "description": "<Detail>", "priority": "high|medium" }
            ]
        }
        `;

        const llmResponse = await callLLM({
            model: 'openai/gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
        });

        let result;
        try {
            // Clean markdown code blocks if present
            const cleanJson = llmResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanJson);
        } catch (e) {
            console.error("LLM JSON Parse Error", llmResponse.text);
            throw new Error("Failed to parse Neural Report");
        }

        // Increment Usage
        await supabase
            .from('profiles')
            .update({ audits_usage: (usage || 0) + 1 })
            .eq('id', user.id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Audit Error:", error);
        return NextResponse.json({
            error: error.message || 'Deep Audit failed',
            details: error.toString()
        }, { status: 500 });
    }
}
