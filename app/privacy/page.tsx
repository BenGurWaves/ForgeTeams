import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ForgeTeams",
  description:
    "How ForgeTeams collects, uses, and protects your data. Shopify OAuth, AI processing disclosure, and encryption details.",
};

export default function PrivacyPage() {
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

      {/* Content */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold leading-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-forge-muted text-sm mb-16">
            Last updated: March 2026
          </p>

          <div className="space-y-12 text-sm text-forge-muted leading-relaxed">
            {/* 1 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Information We Collect
              </h2>
              <p className="mb-3">
                We collect the following categories of information when you use
                ForgeTeams:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong className="text-forge-text">Account information</strong>{" "}
                  — your email address and display name, collected at
                  registration.
                </li>
                <li>
                  <strong className="text-forge-text">Shopify store data</strong>{" "}
                  — products, orders, and analytics accessed via OAuth with the
                  scopes you authorize.
                </li>
                <li>
                  <strong className="text-forge-text">Usage data</strong> — agent
                  run logs, model selections, and feature interactions used to
                  operate and improve the service.
                </li>
                <li>
                  <strong className="text-forge-text">Payment information</strong>{" "}
                  — processed entirely by Stripe. We do not store credit card
                  numbers or banking details.
                </li>
              </ul>
            </div>

            {/* 2 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                How We Use Your Data
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  To run autonomous AI agent teams on your behalf, using the
                  Shopify data and goals you provide.
                </li>
                <li>
                  To improve service reliability, performance, and the accuracy
                  of agent outputs.
                </li>
                <li>To process subscription payments through Stripe.</li>
                <li>
                  To send transactional emails such as account confirmations,
                  billing receipts, and agent run summaries.
                </li>
              </ul>
            </div>

            {/* 3 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                AI Processing Disclosure
              </h2>
              <p className="mb-3">
                Your Shopify data is processed by AI models to execute agent
                runs. Depending on your configuration, processing occurs through
                local Ollama instances or cloud providers you select (Anthropic,
                OpenAI, xAI).
              </p>
              <p className="mb-3">
                When using Bring Your Own Key (BYOK) mode, your data is sent
                directly to the respective AI provider under their terms of
                service. You are responsible for reviewing those terms.
              </p>
              <p>
                We do not use your Shopify data or agent run outputs to train
                any AI models.
              </p>
            </div>

            {/* 4 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Data Security
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Shopify OAuth tokens and API keys are encrypted at rest using
                  AES-256-GCM.
                </li>
                <li>All data in transit is protected by TLS encryption.</li>
                <li>
                  Supabase Row Level Security (RLS) enforces strict tenant
                  isolation — users can only access their own data.
                </li>
                <li>
                  Application logic runs on Cloudflare Workers at the edge for
                  low-latency, isolated execution.
                </li>
              </ul>
            </div>

            {/* 5 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Shopify Data
              </h2>
              <p className="mb-3">
                We access only the Shopify API scopes you explicitly authorize
                during the OAuth connection flow. You may revoke access at any
                time by disconnecting your store in Settings.
              </p>
              <p>
                We do not sell, share, or disclose your Shopify data to third
                parties, except as required to operate the AI agents you
                configure (see AI Processing Disclosure above).
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Data Retention
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  Account data is retained for the duration of your active
                  account.
                </li>
                <li>
                  Agent run logs are retained for 90 days, then automatically
                  purged.
                </li>
                <li>
                  You may delete your account at any time to remove all
                  associated data permanently.
                </li>
              </ul>
            </div>

            {/* 7 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal
                data at any time. To exercise these rights, contact us at{" "}
                <a
                  href="mailto:support@forgeteams.com"
                  className="text-forge-accent hover:text-forge-accent-hover transition-colors"
                >
                  support@forgeteams.com
                </a>
                .
              </p>
            </div>

            {/* 8 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Contact
              </h2>
              <p>
                For questions about this privacy policy or your data, reach us
                at{" "}
                <a
                  href="mailto:support@forgeteams.com"
                  className="text-forge-accent hover:text-forge-accent-hover transition-colors"
                >
                  support@forgeteams.com
                </a>
                .
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-20 pt-8 border-t border-forge-border">
            <Link
              href="/"
              className="text-forge-muted text-sm hover:text-forge-text transition-colors"
            >
              &larr; Back to ForgeTeams
            </Link>
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
