"use client";

import { useState } from "react";

interface ConnectShopifyButtonProps {
  connected: boolean;
  shopDomain?: string;
}

export default function ConnectShopifyButton({
  connected,
  shopDomain,
}: ConnectShopifyButtonProps) {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  function handleConnect() {
    setError("");
    const trimmed = domain.trim();

    if (!trimmed.endsWith(".myshopify.com")) {
      setError("Domain must end with .myshopify.com");
      return;
    }

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(trimmed)) {
      setError("Invalid shop domain format");
      return;
    }

    window.location.href = `/api/shopify/authorize?shop=${encodeURIComponent(trimmed)}`;
  }

  if (connected && shopDomain) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-text-primary text-sm font-medium truncate">
          {shopDomain}
        </span>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Connected
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={domain}
        onChange={(e) => {
          setDomain(e.target.value);
          if (error) setError("");
        }}
        placeholder="your-store.myshopify.com"
        className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
      />
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
      <button
        onClick={handleConnect}
        className="w-full bg-accent text-bg-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
      >
        Connect Shopify
      </button>
    </div>
  );
}
