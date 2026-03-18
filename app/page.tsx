import Link from "next/link";

const agents = [
  {
    name: "Planner",
    description:
      "Decomposes your high-level goal into actionable steps with priorities and dependencies.",
    icon: "01",
  },
  {
    name: "Researcher",
    description:
      "Analyzes competitors, pricing trends, and market data to inform every decision.",
    icon: "02",
  },
  {
    name: "Executor",
    description:
      "Takes direct action — adjusts pricing, triggers campaigns, updates your store.",
    icon: "03",
  },
  {
    name: "Reviewer",
    description:
      "Evaluates results against your goal. Approves or sends the team back for another pass.",
    icon: "04",
  },
  {
    name: "Supervisor",
    description:
      "Orchestrates the entire team. Routes work, manages iterations, ensures convergence.",
    icon: "05",
  },
];

const steps = [
  {
    step: "01",
    title: "Set Your Goal",
    description:
      "Describe what you want in plain language. \"Grow revenue 30% this quarter.\"",
  },
  {
    step: "02",
    title: "Watch Your Team Work",
    description:
      "Five agents collaborate autonomously. Stream their progress in real-time.",
  },
  {
    step: "03",
    title: "Review the Results",
    description:
      "Get a detailed report with every action taken, every decision explained.",
  },
];

const testimonials = [
  {
    quote:
      "We set a revenue target and walked away. Came back to a complete strategy executed across our entire catalog.",
    name: "Sarah Chen",
    role: "Founder, Meridian Goods",
  },
  {
    quote:
      "The research agent found a pricing gap none of us had noticed. That single insight paid for itself in a week.",
    name: "James Okafor",
    role: "Head of Growth, Studio Noire",
  },
  {
    quote:
      "It is like having a senior strategy team that works while you sleep. Quietly. No meetings.",
    name: "Elena Voss",
    role: "CEO, Atelier Home",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-heading text-lg font-medium tracking-tight">
            ForgeTeams
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#agents" className="hover:text-text-primary transition-colors">
              Agents
            </a>
            <a href="#how" className="hover:text-text-primary transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="hover:text-text-primary transition-colors">
              Testimonials
            </a>
            <Link
              href="/auth"
              className="bg-accent text-bg-primary px-5 py-2 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-6">
            Autonomous AI for eCommerce
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
            Your Autonomous AI Teams for Shopify
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Planner, Researcher, Executor, Reviewer & Supervisor working
            together 24/7 to grow your revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-1">
            <Link
              href="/auth"
              className="bg-accent text-bg-primary px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              Get Started
            </Link>
            <a
              href="#how"
              className="border border-border text-text-secondary px-8 py-3.5 rounded-xl text-sm font-medium hover:text-text-primary hover:border-text-secondary transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="py-32 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">
              The Team
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
              Five agents. One mission.
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              Each agent has a distinct role, specialized tools, and clear
              accountability. They collaborate through a shared state graph —
              no wasted effort, no dropped context.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-bg-secondary border border-border rounded-2xl p-8 hover:border-accent/30 transition-colors group"
              >
                <span className="text-accent text-xs font-medium tracking-widest">
                  {agent.icon}
                </span>
                <h3 className="font-heading text-xl font-medium mt-4 mb-3 group-hover:text-accent transition-colors">
                  {agent.name}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {agent.description}
                </p>
              </div>
            ))}
            <div className="bg-bg-secondary border border-border rounded-2xl p-8 hidden lg:flex items-center justify-center">
              <p className="text-text-secondary text-sm italic">
                More agents coming soon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">
              Process
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Three steps. Zero complexity.
            </h2>
          </div>
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-8 items-start bg-bg-secondary border border-border rounded-2xl p-8">
                <span className="text-accent font-heading text-4xl font-bold opacity-40 shrink-0 w-16">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-heading text-xl font-medium mb-2">
                    {s.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-32 px-6 border-t border-border"
      >
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4">
              From early users
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Quietly effective.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="border border-border rounded-2xl p-8 bg-bg-secondary"
              >
                <p className="text-text-secondary text-sm leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-text-secondary text-xs mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
            Ready to forge your team?
          </h2>
          <p className="text-text-secondary text-lg mb-10 leading-relaxed">
            Set a goal. Let five agents handle the rest.
          </p>
          <Link
            href="/auth"
            className="inline-block bg-accent text-bg-primary px-10 py-4 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-text-secondary text-xs">
          <span>ForgeTeams. Last updated: March 2026.</span>
          <span className="mt-2 sm:mt-0">
            Forge Your Autonomous AI Teams for eCommerce.
          </span>
        </div>
      </footer>
    </main>
  );
}
