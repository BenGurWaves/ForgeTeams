import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !customerId || !subscriptionId) {
          console.error("Missing data in checkout.session.completed:", {
            userId,
            customerId,
            subscriptionId,
          });
          break;
        }

        // Fetch the full subscription to get plan details
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const productId =
          typeof subscription.items.data[0]?.price?.product === "string"
            ? subscription.items.data[0].price.product
            : null;

        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              stripe_product_id: productId,
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          console.error(
            "Failed to upsert subscription on checkout:",
            upsertError
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (!userId) {
          // Try to find user by stripe_customer_id
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!existingSub) {
            console.error(
              "Could not find user for subscription update:",
              subscription.id
            );
            break;
          }

          const priceId = subscription.items.data[0]?.price?.id ?? null;
          const productId =
            typeof subscription.items.data[0]?.price?.product === "string"
              ? subscription.items.data[0].price.product
              : null;

          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              stripe_price_id: priceId,
              stripe_product_id: productId,
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", existingSub.user_id);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
          }
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const productId =
          typeof subscription.items.data[0]?.price?.product === "string"
            ? subscription.items.data[0].price.product
            : null;

        const { error: updateError } = await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
              stripe_product_id: productId,
              status: subscription.status,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (updateError) {
          console.error("Failed to update subscription:", updateError);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        // Find the subscription row by stripe_subscription_id or customer_id
        const { error: deleteError } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (deleteError) {
          // Fallback: try by customer ID
          const { error: fallbackError } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (fallbackError) {
            console.error(
              "Failed to mark subscription as canceled:",
              fallbackError
            );
          }
        }
        break;
      }

      default:
        // Unhandled event type — acknowledge receipt
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
