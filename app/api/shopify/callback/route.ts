import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const hmac = searchParams.get("hmac");

  // --- Validate required params ---
  if (!shop || !code || !state || !hmac) {
    return NextResponse.json(
      { error: "Missing required OAuth callback parameters" },
      { status: 400 }
    );
  }

  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const apiKey = process.env.SHOPIFY_API_KEY;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiSecret || !apiKey || !encryptionKey || !appUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  // --- Validate HMAC ---
  const queryParams = new URL(request.url).searchParams;
  const paramsForHmac = new URLSearchParams();

  // Sort and include all params except hmac
  const sortedKeys = Array.from(queryParams.keys())
    .filter((key) => key !== "hmac")
    .sort();

  for (const key of sortedKeys) {
    paramsForHmac.set(key, queryParams.get(key)!);
  }

  const message = paramsForHmac.toString();
  const generatedHmac = crypto
    .createHmac("sha256", apiSecret)
    .update(message)
    .digest("hex");

  const hmacValid = crypto.timingSafeEqual(
    Buffer.from(generatedHmac, "hex"),
    Buffer.from(hmac, "hex")
  );

  if (!hmacValid) {
    return NextResponse.json(
      { error: "HMAC validation failed" },
      { status: 403 }
    );
  }

  // --- Validate state nonce ---
  const storedNonce = request.cookies.get("shopify_state_nonce")?.value;

  if (!storedNonce || storedNonce !== state) {
    return NextResponse.json(
      { error: "State nonce mismatch — possible CSRF attack" },
      { status: 403 }
    );
  }

  // --- Exchange code for access token ---
  let accessToken: string;

  try {
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("Shopify token exchange failed:", errorBody);
      return NextResponse.json(
        { error: "Failed to exchange authorization code for access token" },
        { status: 502 }
      );
    }

    const tokenData = await tokenResponse.json();
    accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access_token in Shopify response" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Shopify token exchange error:", err);
    return NextResponse.json(
      { error: "Network error during token exchange" },
      { status: 502 }
    );
  }

  // --- Get authenticated user ---
  const authHeader = request.headers.get("authorization");
  const supabase = createServerClient();

  // Try Bearer token first, fall back to cookie-based session
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (!error && user) {
      userId = user.id;
    }
  }

  // Fall back: check for supabase auth cookie
  if (!userId) {
    const supabaseToken =
      request.cookies.get("sb-access-token")?.value ??
      request.cookies.get("sb-ldyevnrsucjdmjvvpvet-auth-token")?.value;

    if (supabaseToken) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(supabaseToken);
      if (!error && user) {
        userId = user.id;
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // --- Encrypt access token using AES-256-GCM ---
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey, "hex"),
    iv
  );

  let encrypted = cipher.update(accessToken, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Store as iv:authTag:ciphertext
  const encryptedToken = `${iv.toString("hex")}:${authTag}:${encrypted}`;

  // --- Upsert to Supabase ---
  const { error: dbError } = await supabase
    .from("shopify_connections")
    .upsert(
      {
        user_id: userId,
        shop_domain: shop,
        encrypted_access_token: encryptedToken,
        scopes:
          "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_draft_orders,write_draft_orders",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,shop_domain" }
    );

  if (dbError) {
    console.error("Failed to store Shopify connection:", dbError);
    return NextResponse.json(
      { error: "Failed to save Shopify connection" },
      { status: 500 }
    );
  }

  // --- Redirect to dashboard ---
  const response = NextResponse.redirect(
    `${appUrl}/dashboard?shopify=connected`
  );

  // Clear the state nonce cookie
  response.cookies.delete("shopify_state_nonce");

  return response;
}
