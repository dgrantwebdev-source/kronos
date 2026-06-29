import Link from "next/link";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const stats = [
  { value: "15,000+", label: "MCP Servers" },
  { value: "<5%", label: "Monetized" },
  { value: "97M+", label: "SDK Downloads" },
  { value: "The Gap", label: "Kronos" },
];

const steps = [
  {
    number: "01",
    title: "Publish your agent's capability",
    description:
      "Register your MCP tool, set a price per call, and define your input schema. Your endpoint becomes discoverable instantly.",
  },
  {
    number: "02",
    title: "Other agents discover it via MCP",
    description:
      "Your capability appears in the Kronos directory. Any agent connected to the Model Context Protocol can find and call it.",
  },
  {
    number: "03",
    title: "You earn credits when they use it",
    description:
      "Every third-party call to your agent pays you. No middleman, no platform lock-in. Pure agent-to-agent commerce.",
  },
];

const featuredCapabilities = [
  {
    name: "WebScraper Pro",
    description:
      "Extract structured data from any web page. Returns clean Markdown or JSON.",
    category: "data-extraction",
    price: 5,
    rating: 4.8,
    calls: 12400,
  },
  {
    name: "CodeReview Bot",
    description:
      "AI-powered code review for PRs. Supports 30+ languages and frameworks.",
    category: "developer-tools",
    price: 10,
    rating: 4.6,
    calls: 8700,
  },
  {
    name: "EmailGenius",
    description:
      "Draft, summarize, and respond to emails. Integrates with any inbox via MCP.",
    category: "communication",
    price: 3,
    rating: 4.9,
    calls: 21500,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-transparent" />
          <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="heading-1 text-5xl sm:text-6xl">
                The Agent Marketplace
              </h1>
              <p className="mt-4 bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-xl font-semibold text-transparent sm:text-2xl">
                Dropshipping for the AI Economy
              </p>
              <p className="mt-6 text-lg text-zinc-400">
                A marketplace where AI agents discover, transact, and resell
                each other&apos;s capabilities. No silos. No lock-in. Pure
                agent-to-agent commerce.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="btn-primary px-6 py-3 text-base"
                >
                  Join as Creator
                  <span className="ml-2 inline-block">&rarr;</span>
                </Link>
                <Link
                  href="/explore"
                  className="btn-secondary px-6 py-3 text-base"
                >
                  Explore Agents
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="heading-1 text-3xl sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-800 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="heading-1 text-center text-3xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
              Three steps to join the agent economy.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="card relative">
                  <span className="text-5xl font-bold text-primary-500/20">
                    {step.number}
                  </span>
                  <h3 className="heading-3 mt-2">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-800 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="heading-1 text-center text-3xl">
              Featured Capabilities
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-400">
              Top-performing agent capabilities on the Kronos network.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featuredCapabilities.map((cap) => (
                <div
                  key={cap.name}
                  className="card cursor-pointer transition hover:border-primary-500/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="heading-3">{cap.name}</h3>
                      <span className="mt-1 inline-block rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-400">
                        {cap.category}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-accent-500">
                      {cap.price} cr
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">
                    {cap.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                    <span>&starf; {cap.rating}</span>
                    <span>{cap.calls.toLocaleString()} calls</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="card mx-auto max-w-2xl text-center">
              <h2 className="heading-2">Built for Developers</h2>
              <p className="mt-4 text-sm text-zinc-400">
                Every capability on Kronos exposes a standard MCP endpoint URL.
                Your agent can discover and call any capability using the Model
                Context Protocol &mdash; no custom SDKs, no wrappers, just a URL
                and an API key.
              </p>
              <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-left font-mono text-sm text-zinc-300">
                <span className="text-zinc-500">
                  # MCP Endpoint
                  <br />
                </span>
                https://mcp.kronos.market/v1/capabilities/&lt;id&gt;
              </div>
              <Link href="/docs" className="btn-secondary mt-6 inline-flex">
                Read the docs
                <span className="ml-2 inline-block">&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
