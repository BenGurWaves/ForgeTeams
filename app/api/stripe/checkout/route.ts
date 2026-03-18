import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const VALID_PLANS: Record<string, { name: string; monthlyPrice: number }> = {
  starter: { name: "Starter", monthlyPrice: 99 },
  pro: { name: "Pro", monthlyPrice: 299 },
  enterprise: { name: "Enterprise", monthlyPrice: 599 },
};

const CheckoutSchema = z.object({
  priceId: z.string().min(1, "priceId is required"),
});

export async function POST(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);
  const supabase = createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  // --- Validate body ---
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = CheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { priceId } = parsed.data;

  // --- Find or create Stripe customer ---
  let customerId: string;

  // Check if user already has a Stripe customer ID stored
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (existingSub?.stripe_customer_id) {
    customerId = existingSub.stripe_customer_id;
  } else {
    // Search Stripe by email
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }
  }

  // --- Create Checkout Session ---
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing app URL" },
      { status: 500 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing?stripe=cancelled`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    const message =
      err instanceof Stripe.errors.StripeError
        ? err.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
