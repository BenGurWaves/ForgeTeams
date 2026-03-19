import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ForgeTeams",
  description:
    "Terms of Service for ForgeTeams. Subscription billing, AI actions disclaimer, BYOK responsibilities, and liability limitations.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-forge-muted text-sm mb-16">
            Last updated: March 2026
          </p>

          <div className="space-y-12 text-sm text-forge-muted leading-relaxed">
            {/* 1 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Acceptance
              </h2>
              <p>
                By accessing or using ForgeTeams, you agree to be bound by these
                Terms of Service. If you do not agree with any part of these
                terms, you must not use the service.
              </p>
            </div>

            {/* 2 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Service Description
              </h2>
              <p>
                ForgeTeams provides autonomous AI agent teams for Shopify
                eCommerce optimization. The service includes research, planning,
                execution, and review capabilities delivered through
                coordinated multi-agent workflows. Agents may analyze your store
                data, generate strategic recommendations, and — when authorized
                — take direct actions on your Shopify store.
              </p>
            </div>

            {/* 3 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Account Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the security of your account
                credentials, the Shopify store connections you authorize, and
                any third-party API keys you provide. You agree to notify us
                immediately of any unauthorized access to your account.
              </p>
            </div>

            {/* 4 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                AI Actions Disclaimer
              </h2>
              <p className="mb-3">
                ForgeTeams agents may modify your Shopify store — including
                pricing, product listings, and draft orders — based on the goals
                you set. You acknowledge that AI-driven actions carry inherent
                risk and should be monitored.
              </p>
              <p>
                We are not liable for revenue changes, pricing errors, inventory
                discrepancies, or any unintended modifications made by agents
                acting on your behalf. You are solely responsible for reviewing
                and approving agent outputs.
              </p>
            </div>

            {/* 5 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Subscription &amp; Billing
              </h2>
              <p>
                Plans are billed monthly via Stripe. All new accounts begin with
                a 14-day free trial. You may cancel your subscription at any
                time before the trial ends to avoid charges. No refunds are
                issued for partial billing periods.
              </p>
            </div>

            {/* 6 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                BYOK (Bring Your Own Key)
              </h2>
              <p>
                When you provide third-party API keys (Anthropic, OpenAI, xAI,
                or others), you are responsible for all usage charges incurred
                through those providers. ForgeTeams is not liable for costs
                generated by agent runs using your API keys.
              </p>
            </div>

            {/* 7 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Limitations
              </h2>
              <p>
                The service is provided &ldquo;as is&rdquo; without warranties
                of any kind, express or implied. We do not guarantee specific
                business outcomes, revenue increases, or error-free operation.
                Our maximum aggregate liability is limited to the total fees you
                paid to ForgeTeams in the twelve months preceding any claim.
              </p>
            </div>

            {/* 8 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate accounts that
                engage in abuse, violate these terms, or use the service in a
                manner that harms other users or our infrastructure. You may
                delete your account at any time through your account settings.
              </p>
            </div>

            {/* 9 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Changes
              </h2>
              <p>
                We may update these Terms of Service from time to time.
                Continued use of ForgeTeams after changes are posted constitutes
                your acceptance of the revised terms.
              </p>
            </div>

            {/* 10 */}
            <div>
              <h2 className="font-heading text-xl font-medium text-forge-text mb-4">
                Contact
              </h2>
              <p>
                For questions about these terms, contact us at{" "}
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
