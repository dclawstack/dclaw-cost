import Link from "next/link";
import {
  DollarSign, Cloud, PiggyBank, Lightbulb, Bot,
  Landmark, Tag, Container, BarChart3, Zap, ShoppingCart,
  Leaf, Trash2, ArrowRight, Sparkles, ShieldCheck,
  TrendingDown, Github, Cpu, Database, GitBranch,
  Boxes, Radio, CheckCircle2,
} from "lucide-react";

const FEATURES = [
  { icon: Bot,          title: "AI Cost Copilot",           desc: "Ask anything about your cloud spend. The copilot reads live billing data and surfaces specific next steps — not generic advice.", tag: "P0" },
  { icon: Cloud,        title: "Multi-Cloud Billing",        desc: "Unified view of AWS, GCP, Azure, and on-prem costs. Auto-tag untagged resources and generate chargeback reports.", tag: "P0" },
  { icon: Lightbulb,   title: "Resource Right-Sizing",      desc: "AI analyzes 30 days of utilization patterns and recommends optimal instance types with estimated savings.", tag: "P0" },
  { icon: PiggyBank,   title: "Budget Alerts",              desc: "Set per-team and per-service budgets. AI forecasts overspend 7 days ahead and alerts via Slack or email.", tag: "P0" },
  { icon: Landmark,    title: "Reserved Instance Planner",  desc: "Model 6 commitment types with break-even analysis, 12-month forecasts, and automated purchase triggers.", tag: "P1" },
  { icon: Trash2,      title: "Waste Detection",            desc: "Scan 1,000+ resources for idle instances, orphaned volumes, unused IPs, old snapshots, and stale load balancers.", tag: "P1" },
  { icon: Tag,         title: "Cost Allocation",            desc: "Tag-based showback and chargeback. Allocate 100% of spend to teams and projects with policy enforcement.", tag: "P1" },
  { icon: Container,   title: "Container Cost Analysis",    desc: "Per-pod and per-namespace cost breakdown for Kubernetes. Right-size resource requests automatically.", tag: "P1" },
  { icon: BarChart3,   title: "FinOps Reports",             desc: "Executive dashboards with cost-per-customer, per-feature, per-team unit economics and AI trend analysis.", tag: "P2" },
  { icon: Zap,         title: "Spot Instance Strategy",     desc: "Match workloads to spot pools with interruption-risk scoring and automatic on-demand fallback planning.", tag: "P2" },
  { icon: ShoppingCart,title: "SaaS Spend Management",      desc: "Discover 100+ SaaS apps, track licenses, identify duplicates, and flag upcoming renewals.", tag: "P2" },
  { icon: Leaf,        title: "Carbon Cost",                desc: "Estimate CO₂ per service and region. Get suggestions to shift workloads to greener regions and track offsets.", tag: "P2" },
];

const STEPS = [
  { n: "01", title: "Connect",  desc: "Link your AWS, GCP, Azure, or on-prem account in under a minute. Billing data ingested via API instantly." },
  { n: "02", title: "Analyze",  desc: "AI scans 30+ days of utilization, identifies waste, and forecasts spend across teams and services in real time." },
  { n: "03", title: "Save",     desc: "Apply recommendations with one click. Track savings, set budgets, and chat with the AI copilot anytime." },
];

const STATS = [
  { value: "30%",  label: "Average cloud spend reduction" },
  { value: "5+",   label: "Cloud providers supported" },
  { value: "12",   label: "FinOps features across P0–P2" },
  { value: "60+",  label: "Production API endpoints" },
];

const STACK = [
  { icon: Cpu,       name: "FastAPI + Pydantic v2",  desc: "Async Python backend" },
  { icon: Database,  name: "PostgreSQL 16 (CNPG)",   desc: "CloudNativePG operator" },
  { icon: Boxes,     name: "Next.js 14 App Router",  desc: "Tailwind + shadcn/ui" },
  { icon: GitBranch, name: "GitHub Actions CI/CD",   desc: "Build, test, and deploy" },
  { icon: Radio,     name: "Ollama + OpenRouter",    desc: "Local + cloud LLM fallback" },
  { icon: Landmark,  name: "Helm + Kubernetes",      desc: "Self-hostable via Helm" },
];

const SCAFFOLD = [
  "Next.js 14 frontend with Tailwind + shadcn/ui",
  "FastAPI backend, Pydantic v2, SQLAlchemy 2.0",
  "Alembic migrations + PostgreSQL 16 via CloudNativePG",
  "Helm chart with ingress, CloudNativePG, and secrets templates",
  "GitHub Actions: build-backend, build-frontend, deploy workflows",
  "55+ backend tests with pytest-asyncio",
  "AI Copilot with OpenRouter (Kimi K2) + Ollama local fallback",
  "DPanel manifest, health endpoint, and non-root Docker containers",
];

const TAG_COLOR: Record<string, string> = {
  P0: "bg-blue-100 text-blue-700",
  P1: "bg-purple-100 text-purple-700",
  P2: "bg-green-100 text-green-700",
};

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-900">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold tracking-tight">DClaw Cost</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features"     className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#copilot"      className="text-gray-600 hover:text-gray-900">AI Copilot</a>
            <a href="#stack"        className="text-gray-600 hover:text-gray-900">Stack</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a
              href="https://github.com/dclawstack/dclaw-cost"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
          </nav>
          <Link
            href="/dashboard"
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Open App
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute -top-40 -right-40 -z-10 h-96 w-96 rounded-full bg-blue-200 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 -z-10 h-96 w-96 rounded-full bg-purple-200 opacity-20 blur-3xl" />

        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              AI-powered FinOps · P0 + P1 + P2 complete · OSS
            </div>

            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Cut cloud spend by{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                30% in 30 days
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
              Unified multi-cloud billing, AI-driven right-sizing, real-time budget alerts,
              per-team cost allocation, and an AI copilot that understands your live spend —
              all 12 FinOps features production-ready out of the box.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800 transition-all"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-900 hover:border-gray-300 transition-colors"
              >
                Explore features
              </a>
            </div>

            <p className="mt-6 text-xs text-gray-500">
              No credit card required · Self-hostable via Helm · Local-first with Ollama
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="mt-20 mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
              <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-3 text-xs text-gray-400">dclaw-cost.vercel.app/dashboard</div>
              </div>
              <div className="grid grid-cols-12 gap-4 p-6">
                <div className="col-span-3 rounded-lg border border-gray-100 p-4">
                  <div className="text-xs text-gray-500">Monthly Spend</div>
                  <div className="mt-1 text-2xl font-bold">$48,235</div>
                  <div className="mt-1 text-xs text-gray-400">↑ 18% MoM</div>
                </div>
                <div className="col-span-3 rounded-lg border border-gray-100 p-4">
                  <div className="text-xs text-gray-500">Projected</div>
                  <div className="mt-1 text-2xl font-bold text-indigo-600">$72,400</div>
                  <div className="mt-1 text-xs text-gray-400">7-day forecast</div>
                </div>
                <div className="col-span-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="text-xs text-green-700">Savings Available</div>
                  <div className="mt-1 text-2xl font-bold text-green-700">$14,820</div>
                  <div className="mt-1 text-xs text-green-600">9 recommendations</div>
                </div>
                <div className="col-span-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="text-xs text-red-700">Active Alerts</div>
                  <div className="mt-1 text-2xl font-bold text-red-700">3</div>
                  <div className="mt-1 text-xs text-red-500">2 budget breaches</div>
                </div>
                <div className="col-span-8 rounded-lg border border-gray-100 p-4">
                  <div className="text-xs text-gray-500 mb-3">Top Cost Drivers</div>
                  <div className="space-y-2">
                    {[
                      { s: "EC2",     v: 100, cost: "$21,400" },
                      { s: "RDS",     v: 65,  cost: "$13,900" },
                      { s: "S3",      v: 40,  cost: "$8,600"  },
                      { s: "Lambda",  v: 22,  cost: "$4,700"  },
                    ].map((d) => (
                      <div key={d.s} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-gray-600">{d.s}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${d.v}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-gray-500">{d.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <div className="text-xs font-medium text-blue-700">AI Copilot</div>
                    <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">LIVE</span>
                  </div>
                  <div className="text-xs leading-relaxed text-gray-600">
                    &ldquo;EC2 up 18% MoM. 3 t3.xlarge idle — downsize to save $420/mo. NAT egress jumped 240%, audit recommended.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-gray-900 sm:text-4xl">{s.value}</div>
                <div className="mt-2 text-sm text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">All-in-one FinOps</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Every cloud cost lever, in one place
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              12 production-ready features — P0 foundations, P1 platform depth, and P2 vertical scale — all implemented and tested.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-2.5">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_COLOR[tag]}`}>{tag}</span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Copilot Spotlight ── */}
      <section id="copilot" className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-24 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2%, transparent 0%)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                YC S25/W26 AI mandate — fully implemented
              </div>
              <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Your AI Cost Copilot,<br />trained on your live data.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-blue-100">
                Ask anything about your cloud spend. The copilot reads your live billing records,
                budget status, alerts, and open recommendations — then suggests specific, numbered
                next steps. No hallucinations, no generic advice.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Context-aware: knows current spend, top drivers, and active alerts",
                  "Streaming SSE responses — token-by-token, never blocks",
                  "Conversation history persisted per session in PostgreSQL",
                  "OpenRouter (Kimi K2) with automatic Ollama fallback when offline",
                  "Accessible from every page via floating widget",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-blue-100">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/copilot"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Try the Copilot
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm">
                  What&apos;s driving my EC2 cost increase this month?
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/30">
                    <Bot className="h-4 w-4 text-blue-200" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed">
                    Your EC2 spend grew $4,820 (18%) MoM. Top contributors:
                    <br /><br />
                    1. <strong>3 new r5.4xlarge instances</strong> in us-east-1 (+$1,890)<br />
                    2. <strong>Spot interruptions</strong> shifted load to on-demand (+$1,640)<br />
                    3. <strong>NAT Gateway egress</strong> jumped 240% (+$1,290)
                    <br /><br />
                    Next steps: convert r5.4xlarge to 1-year reserved (~40% savings),
                    review spot fallback config, audit NAT egress source.
                  </div>
                </div>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm">
                  Open the RI planner for r5.4xlarge
                </div>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/30">
                    <Bot className="h-4 w-4 text-blue-200" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-relaxed">
                    Navigating to RI Planner with r5.4xlarge pre-selected.
                    Break-even in <strong>7 months</strong>, saving $756/mo after that.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="stack" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Sacred architecture</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Production-grade from day one
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Every layer chosen for reliability, not convenience. Non-negotiable DClaw stack.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map(({ icon: Icon, name, desc }) => (
              <div key={name} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-2.5">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{name}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scaffold checklist */}
          <div className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <h3 className="text-lg font-semibold text-gray-900">Scaffold checklist — all complete</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {SCAFFOLD.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">3-step setup</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              From signup to savings in under an hour
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-12 top-12 hidden h-0.5 w-full bg-gradient-to-r from-blue-200 to-transparent md:block" />
                )}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                  {s.n}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why DClaw ── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: TrendingDown,
                title: "Stop spend leaks",
                desc: "Automatic alerts when budgets hit threshold or AI forecasts an overage — 7 days ahead, not end-of-month.",
              },
              {
                icon: ShieldCheck,
                title: "Production-ready infrastructure",
                desc: "55+ backend tests, 60+ API endpoints, Postgres-backed, CloudNativePG operator, Helm chart, and GitHub Actions CI/CD.",
              },
              {
                icon: Leaf,
                title: "Carbon-aware by default",
                desc: "Estimate CO₂ per service and region. Get suggestions to migrate workloads to greener regions and track offsets over time.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <Icon className="h-8 w-8 text-blue-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Ready to optimize your cloud spend?
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Connect your first cloud account in under a minute. See savings opportunities instantly.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-gray-900/20 hover:bg-gray-800 transition-all"
            >
              Open the App
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/dclawstack/dclaw-cost"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 hover:border-gray-300 transition-colors"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">DClaw Cost</span>
              <span className="ml-2 text-xs text-gray-400">v1.0 · OSS · FinOps</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-900">App</Link>
              <a href="#features"     className="hover:text-gray-900">Features</a>
              <a href="#copilot"      className="hover:text-gray-900">Copilot</a>
              <a href="#stack"        className="hover:text-gray-900">Stack</a>
              <a
                href="https://github.com/dclawstack/dclaw-cost"
                target="_blank" rel="noreferrer"
                className="hover:text-gray-900"
              >
                GitHub
              </a>
            </div>
            <div className="text-xs text-gray-400">© 2026 DClaw Stack</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
