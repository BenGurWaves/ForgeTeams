import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — ForgeTeams",
  description:
    "Simple, transparent pricing for autonomous AI teams. Start with a 14-day free trial. Cancel anytime.",
};

const plans = [
  {
    name: "Starter",
    price: "$99",
    highlighted: false,
    features: [
      "50 agent runs per month",
      "1 Shopify store",
      "Ollama + BYOK models",
      "Email support",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    ctaStyle:
      "border border-forge-border rounded-xl px-6 py-3 text-sm font-medium hover:border-forge-accent transition-colors w-full text-center",
  },
  {
    name: "Pro",
    price: "$299",
    highlighted: true,
    features: [
      "200 agent runs per month",
      "3 Shopify stores",
      "All AI providers",
      "Priority support",
      "Advanced analytics",
      "Custom agent goals",
    ],
    cta: "Start Free Trial",
    ctaStyle:
      "bg-forge-accent text-forge-bg rounded-xl px-6 py-3 text-sm font-semibold hover:bg-forge-accent-hover transition-colors w-full text-center",
  },
  {
    name: "Enterprise",
    price: "$599",
    highlighted: false,
    features: [
      "Unlimited agent runs",
      "Unlimited stores",
      "All AI providers",
      "Dedicated support",
      "White-label reports",
      "API access",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    ctaStyle:
      "border border-forge-border rounded-xl px-6 py-3 text-sm font-medium hover:border-forge-accent transition-colors w-full text-center",
  },
];

const faqs = [
  {
    q: "Can I change plans later?",
    a: "Yes, upgrade or downgrade anytime.",
  },
  {
    q: "What happens after the trial?",
    a: "Auto-converts to paid. Cancel before to avoid charges.",
  },
  {
    q: "Which AI models are supported?",
    a: "Ollama (local), Anthropic Claude, OpenAI GPT-4, xAI Grok.",
  },
  {
    q: "Is my Shopify data secure?",
    a: "Yes. Tokens encrypted with AES-256-GCM, RLS on all tables.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-forge-bg/80 backdrop-blur-md border-b border-forge-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-lg font-medium tracking-tight"
          >
            ForgeTeams
          </Link>
          <div className="flex items-center gap-8 text-sm text-forge-muted">
            <Link
              href="/"
              className="hidden md:inline hover:text-forge-text transition-colors"
            >
              Home
            </Link>
            <Link
              href="/auth"
              className="bg-forge-accent text-forge-bg px-5 py-2 rounded-xl text-sm font-medium hover:bg-forge-accent-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-6">
            Choose Your Plan
          </h1>
          <p className="text-forge-muted text-lg max-w-xl mx-auto">
            Start with a 14-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="pb-32 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className="relative flex flex-col">
              {plan.highlighted && (
                <div className="flex justify-center -mb-3 relative z-10">
                  <span className="bg-forge-accent text-forge-bg text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <div
                className={`bg-forge-surface border rounded-2xl p-8 flex flex-col flex-1 ${
                  plan.highlighted
                    ? "border-forge-accent"
                    : "border-forge-border"
                }`}
              >
                <p className="text-sm text-forge-muted font-medium tracking-widest uppercase mb-4">
                  {plan.name}
                </p>
                <div className="mb-8">
                  <span className="font-heading text-4xl font-bold">
                    {plan.price}
                  </span>
                  <span className="text-forge-muted text-sm">/mo</span>
                </div>
                <ul className="space-y-3 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-forge-muted"
                    >
                      <svg
                        className="w-4 h-4 text-forge-accent shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className={plan.ctaStyle}>
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-32 px-6 border-t border-forge-border pt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-forge-surface border border-forge-border rounded-2xl p-8"
              >
                <h3 className="font-heading text-lg font-medium mb-2">
                  {faq.q}
                </h3>
                <p className="text-forge-muted text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-forge-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-forge-muted text-xs">
          <span>ForgeTeams. Last updated: March 2026.</span>
          <span className="mt-2 sm:mt-0">
            Forge Your Autonomous AI Teams for eCommerce.
          </span>
        </div>
      </footer>
    </main>
  );
}
