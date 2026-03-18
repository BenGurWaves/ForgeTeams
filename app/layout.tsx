import type { Metadata } from "next";
import "./globals.css";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ForgeTeams",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Multi-agent autonomous AI teams for Shopify store owners. Five specialized agents collaborate to research, plan, execute, and optimize your eCommerce strategy.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free during beta",
  },
};

export const metadata: Metadata = {
  title: "ForgeTeams — Autonomous AI Teams for Shopify",
  description:
    "Forge your autonomous AI teams for eCommerce. Planner, Researcher, Executor, Reviewer & Supervisor working together 24/7 to grow your Shopify revenue.",
  keywords: [
    "AI agents for Shopify",
    "autonomous ecommerce AI",
    "multi-agent AI team",
    "Shopify automation",
    "AI revenue optimization",
  ],
  openGraph: {
    title: "ForgeTeams — Autonomous AI Teams for Shopify",
    description:
      "Five AI agents working together 24/7 to grow your Shopify revenue.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD structured data — static content, safe for inline script */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          // Safe: jsonLd is a compile-time constant with no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
