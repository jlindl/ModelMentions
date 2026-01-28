import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { getSupabaseAdmin } from '../../../lib/llm';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    const body = await request.text();
    const sig = (await headers()).get('stripe-signature');

    if (!endpointSecret || !sig) {
        return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    console.log(`🔔 Webhook received! Type: ${event.type}`);

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userId = session.metadata?.supabase_user_id;
            const planName = session.metadata?.plan_name;

            if (userId && planName) {
                console.log(`Processing upgrade for User: ${userId} to ${planName}`);
                // Update User Profile
                const { error: updateError } = await supabase.from('profiles').update({
                    plan: planName,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    subscription_status: 'active',
                    credits_used: 0
                }).eq('id', userId);

                if (updateError) {
                    console.error('❌ Supabase Update Failed:', updateError);
                } else {
                    console.log(`✅ User ${userId} successfully upgraded to ${planName}`);
                }
            } else {
                console.warn('⚠️ Missing metadata in webhook session object:', session.metadata);
            }
            break;

        case 'customer.subscription.deleted':
            const subscription = event.data.object;
            // Find user by stripe_customer_id and downgrade
            const { data: user } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', subscription.customer)
                .single();

            if (user) {
                await supabase.from('profiles').update({
                    plan: 'free',
                    subscription_status: 'canceled'
                }).eq('id', user.id);
                console.log(`User ${user.id} subscription canceled. Downgraded to free.`);
            }
            break;

        // Handle renewal/payment_succeeded to reset credits monthly?
        // Actually my "Lazy Reset" handles monthly resets based on time.
        // But maybe we should update billing_cycle_start on invoice.payment_succeeded?
        case 'invoice.payment_succeeded':
            // If this is a recurring payment (subscription renewal)
            const invoice = event.data.object;
            if (invoice.billing_reason === 'subscription_cycle') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', invoice.customer)
                    .single();

                if (profile) {
                    await supabase.from('profiles').update({
                        credits_used: 0,
                        billing_cycle_start: new Date().toISOString()
                    }).eq('id', profile.id);
                    console.log(`Refreshed credits for user ${profile.id} on billing cycle.`);
                }
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
