import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_orders",
  "write_orders",
  "read_customers",
  "write_customers",
  "read_draft_orders",
  "write_draft_orders",
].join(",");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json(
      { error: "Missing required parameter: shop" },
      { status: 400 }
    );
  }

  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return NextResponse.json(
      { error: "Invalid shop domain. Must be a .myshopify.com domain." },
      { status: 400 }
    );
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !appUrl) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing Shopify credentials" },
      { status: 500 }
    );
  }

  // Generate state nonce for CSRF protection
  const nonce = crypto.randomBytes(16).toString("hex");
  const callbackUrl = `${appUrl}/api/shopify/callback`;

  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id", apiKey);
  authUrl.searchParams.set("scope", SHOPIFY_SCOPES);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("state", nonce);

  const response = NextResponse.redirect(authUrl.toString());

  // Store nonce in httpOnly cookie for validation in callback
  response.cookies.set("shopify_state_nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
