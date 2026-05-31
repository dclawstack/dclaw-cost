"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Data ─────────────────────────────────────────────────────────── */

const features = [
  { n: "01", title: "AI Cost Copilot",           desc: "Ask anything about your cloud spend. Reads live billing, alerts, and open recommendations — returns specific numbered next steps. No generic advice.", tag: "P0 · Kimi K2" },
  { n: "02", title: "Multi-Cloud Billing",        desc: "Unified ingest from AWS, GCP, Azure, and on-prem. Auto-tag untagged resources, split by team, generate chargeback reports in one view.", tag: "P0 · 5 providers" },
  { n: "03", title: "Resource right-sizing",      desc: "30 days of utilisation data, analysed by AI. Recommends optimal instance types with projected savings before you commit to anything.", tag: "P0 · AI analysis" },
  { n: "04", title: "Budget alerts",              desc: "Set per-team and per-service budgets. AI forecasts overspend 7 days ahead and fires Slack or email alerts — before the month closes.", tag: "P0 · 7-day forecast" },
  { n: "05", title: "Reserved Instance Planner",  desc: "Model 6 commitment types. Break-even analysis, 12-month savings forecast, and automated purchase triggers when thresholds are hit.", tag: "P1 · RI/SP/CUD" },
  { n: "06", title: "Waste detection",            desc: "Scan 1,000+ resources for idle instances, orphaned volumes, stale snapshots, unused IPs and forgotten load balancers. Estimate the savings.", tag: "P1 · 5 waste types" },
  { n: "07", title: "Cost allocation",            desc: "Tag-based showback and chargeback. Allocate 100% of spend to teams and projects, enforce tagging policy, export per-team dashboards.", tag: "P1 · tag-enforced" },
  { n: "08", title: "Container cost analysis",    desc: "Per-pod and per-namespace cost breakdown for Kubernetes. Right-size resource requests and limits before they hit your bill.", tag: "P1 · K8s native" },
  { n: "09", title: "FinOps reports",             desc: "Executive dashboards with cost-per-customer, cost-per-feature, and cost-per-team unit economics. AI spots trends and flags anomalies.", tag: "P2 · unit economics" },
  { n: "10", title: "Spot instance strategy",     desc: "Classify workloads and surface spot candidates with interruption-risk scores. Plan on-demand fallback automatically, per workload.", tag: "P2 · risk-scored" },
  { n: "11", title: "SaaS spend management",      desc: "Discover 100+ SaaS tools. Track per-seat licence costs, flag duplicate subscriptions, and surface renewals before auto-renew fires.", tag: "P2 · licence-aware" },
  { n: "12", title: "Carbon cost",                desc: "Estimate CO₂ per service and region. Get suggestions to shift workloads to lower-carbon regions and track offset progress over time.", tag: "P2 · green regions" },
];

const stackBadges = [
  "Next.js 14", "FastAPI", "PostgreSQL 16", "SQLAlchemy 2.0",
  "Kimi K2 · OpenRouter", "Ollama fallback", "Tailwind CSS",
  "Alembic", "Docker", "Helm / Kubernetes", "Pydantic v2",
  "pytest-asyncio", "shadcn/ui", "CloudNativePG",
];

const rotatingWords = [
  "engineering teams.",
  "platform leads.",
  "FinOps analysts.",
  "cloud operators.",
];

const GITHUB = "https://github.com/dclawstack/dclaw-cost";

const footerLinks: Record<string, { label: string; href: string }[]> = {
  "App": [
    { label: "Dashboard",       href: "/dashboard" },
    { label: "Cloud accounts",  href: "/cloud-accounts" },
    { label: "Billing",         href: "/billing" },
    { label: "Budgets & alerts",href: "/budgets" },
    { label: "Recommendations", href: "/recommendations" },
    { label: "Waste detection", href: "/waste" },
    { label: "Cost allocation", href: "/cost-allocation" },
    { label: "AI Copilot",      href: "/copilot" },
  ],
  "Features": [
    { label: "RI Planner",          href: "/ri-planner" },
    { label: "Container costs",     href: "/container-costs" },
    { label: "FinOps reports",      href: "/reports" },
    { label: "Spot strategy",       href: "/spot-strategy" },
    { label: "SaaS spend",          href: "/saas" },
    { label: "Carbon & green",      href: "/carbon" },
  ],
  "GitHub": [
    { label: "Repository",  href: GITHUB },
    { label: "Backend",     href: `${GITHUB}/tree/main/backend` },
    { label: "Frontend",    href: `${GITHUB}/tree/main/web` },
    { label: "Helm chart",  href: `${GITHUB}/tree/main/helm` },
    { label: "Issues",      href: `${GITHUB}/issues` },
    { label: "Releases",    href: `${GITHUB}/releases` },
  ],
  "Docs": [
    { label: "README",        href: `${GITHUB}/blob/main/README.md` },
    { label: "Product spec",  href: `${GITHUB}/blob/main/PRODUCT-SPEC.md` },
    { label: "Run locally",   href: `${GITHUB}/blob/main/RUN.md` },
    { label: "PLAN v1.2",     href: `${GITHUB}/blob/main/PLAN-v1.2.md` },
    { label: "REVISED PRD",   href: `${GITHUB}/blob/main/REVISED-PRD.md` },
  ],
};

/* ─── GitHub SVG ──────────────────────────────────────────────────── */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/* ─── Hooks ─────────────────────────────────────────────────────────── */
function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

/* ─── Sub-components ─────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function FeatureCard({ f, idx }: { f: typeof features[0]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(50px)",
        transition: `opacity 0.6s ease ${(idx % 3) * 120}ms, transform 0.6s ease ${(idx % 3) * 120}ms`,
      }}
      className="group relative bg-white border border-[#ece6f5] rounded-2xl p-7 hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#f3e8ff] to-transparent rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-mono text-[#9d6dc7] bg-[#f3e8ff] px-2 py-1 rounded-full">{f.n}</span>
          <span className="text-[10px] font-mono text-[#7030A0] border border-[#e2d4f0] px-2 py-1 rounded-full">{f.tag}</span>
        </div>
        <h3 className="text-lg font-bold text-[#1a0a2e] mb-2" style={{ fontFamily: "'Raleway', sans-serif" }}>
          {f.title}
        </h3>
        <p className="text-sm text-[#666] leading-relaxed">{f.desc}</p>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % rotatingWords.length);
        setWordVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(cycle);
  }, []);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #c084fc, #7030A0, #e879f9, #7030A0, #c084fc);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .float-card { animation: float 5s ease-in-out infinite; }
        .marquee-track { animation: marquee 40s linear infinite; }
        .dot-grid {
          background-image: radial-gradient(circle, rgba(160,100,220,0.25) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="bg-white text-[#1a0a2e] overflow-x-hidden">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen bg-[#0d0618] dot-grid flex flex-col justify-center overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#7030A0] opacity-20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#c084fc] opacity-15 rounded-full blur-[120px]" />

          {/* Nav */}
          <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-1" style={{ fontFamily: "'Raleway', sans-serif" }}>
              <span className="text-xl font-black text-[#7030A0]">DClaw</span>
              <span className="text-xl font-semibold text-white">&nbsp;Cost</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-white/60" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <a href="#features"     className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#stack"        className="hover:text-white transition-colors">Stack</a>
              <a href={GITHUB} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <GithubIcon className="w-4 h-4" /> GitHub
              </a>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="md:hidden w-9 h-9 rounded-full border border-white/20 inline-flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "#7030A0", fontFamily: "'Poppins', sans-serif" }}
              >
                Open App →
              </Link>
            </div>
          </nav>

          {/* Hero content */}
          <div className="relative mx-auto max-w-7xl px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c084fc] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c084fc]" />
                </span>
                <span className="text-xs text-white/70 font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  v1.0 · 12 FinOps features · Open source
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6" style={{ fontFamily: "'Raleway', sans-serif" }}>
                <span className="text-white">The AI</span>
                <br />
                <span className="shimmer-text">FinOps OS</span>
                <br />
                <span className="text-white/60 text-3xl md:text-4xl font-semibold mt-2 block">built for</span>
                <span
                  className="text-white text-3xl md:text-4xl font-semibold"
                  style={{
                    display: "inline-block",
                    opacity: wordVisible ? 1 : 0,
                    transform: wordVisible ? "translateY(0)" : "translateY(12px)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                >
                  {rotatingWords[wordIdx]}
                </span>
              </h1>

              <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Multi-cloud billing, AI right-sizing, budget alerts, waste detection,
                and an AI copilot that reads your live data — all 12 FinOps features,
                production-ready out of the box.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg hover:shadow-purple-900"
                  style={{ background: "#7030A0", fontFamily: "'Poppins', sans-serif" }}
                >
                  Open App →
                </Link>
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-bold text-sm border border-white/20 hover:bg-white/10 transition-all"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  <GithubIcon className="w-4 h-4" />
                  GitHub
                </a>
              </div>

              <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-white/10">
                {[["30%", "Cloud spend saved"], ["12", "FinOps features"], ["5+", "Cloud providers"], ["60+", "API endpoints"]].map(([val, label]) => (
                  <div key={label}>
                    <div className="text-2xl font-black text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>{val}</div>
                    <div className="text-xs text-white/40 mt-0.5" style={{ fontFamily: "'Poppins', sans-serif" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating dashboard mock */}
            <div className="float-card hidden lg:block">
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-white font-bold text-sm" style={{ fontFamily: "'Raleway', sans-serif" }}>Cost dashboard · May 2026</span>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/60" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
                    <span className="w-3 h-3 rounded-full bg-green-400/60" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Monthly spend",    val: "$48,235",  delta: "+18%",  up: false },
                    { label: "Projected",        val: "$72,400",  delta: "7-day",  up: false },
                    { label: "Savings found",    val: "$14,820",  delta: "9 recs", up: true },
                    { label: "Active alerts",    val: "3",        delta: "2 budget", up: false },
                  ].map(k => (
                    <div key={k.label} className="bg-white/8 rounded-xl p-3 border border-white/10">
                      <div className="text-white/40 text-[10px] mb-1">{k.label}</div>
                      <div className="text-white font-bold text-base" style={{ fontFamily: "'Raleway', sans-serif" }}>{k.val}</div>
                      <div className={`text-[10px] mt-0.5 ${k.up ? "text-green-400" : "text-red-400"}`}>{k.delta}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                  <div className="text-white/40 text-[10px] mb-2">Top cost drivers</div>
                  {[
                    { s: "EC2",    pct: 100 },
                    { s: "RDS",    pct: 65  },
                    { s: "S3",     pct: 40  },
                    { s: "Lambda", pct: 22  },
                  ].map(d => (
                    <div key={d.s} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] text-white/50 w-10">{d.s}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-[#7030A0]" style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-[#7030A0]/30 border border-[#7030A0]/40 rounded-full px-3 py-1.5">
                  <span className="text-[10px] text-[#c084fc]">✦ AI Copilot</span>
                  <span className="text-[10px] text-white/70">EC2 up 18% — 3 idle t3.xlarge, downsize saves $420/mo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 20C480 40 240 10 0 30L0 60Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ── MARQUEE ─────────────────────────────────────────────────── */}
        <section className="py-6 border-y border-[#f0e8fa] bg-[#faf6ff] overflow-hidden">
          <div className="flex whitespace-nowrap">
            <div className="marquee-track flex gap-10 pr-10">
              {[...features, ...features].map((f, i) => (
                <span key={i} className="flex items-center gap-2 text-sm font-semibold text-[#7030A0]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <span className="text-[#c084fc]">✦</span>
                  <span>{f.title}</span>
                  <span className="text-[#c084fc] mx-2">·</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────── */}
        <section id="features" className="py-32 px-6 bg-white relative overflow-hidden">
          <div
            className="absolute top-8 right-0 text-[20rem] font-black text-[#f3e8ff] select-none leading-none pointer-events-none"
            style={{ fontFamily: "'Raleway', sans-serif" }}
          >
            12
          </div>
          <div className="relative mx-auto max-w-7xl">
            <FadeUp className="text-center mb-20">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#7030A0] bg-[#f3e8ff] px-4 py-2 rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                FinOps Features
              </span>
              <h2 className="text-5xl md:text-6xl font-black mt-6 mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                Every cost lever,<br />
                <span className="shimmer-text">in one place.</span>
              </h2>
              <p className="text-[#666] text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                P0 foundations, P1 platform depth, and P2 vertical scale — all 12 features implemented,
                tested, and production-ready.
              </p>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => <FeatureCard key={f.n} f={f} idx={i} />)}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-32 px-6 bg-[#0d0618] relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#7030A0] opacity-15 blur-[100px] rounded-full" />
          <div className="relative mx-auto max-w-5xl text-center">
            <FadeUp>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#c084fc] bg-white/10 px-4 py-2 rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                How it works
              </span>
              <h2 className="text-5xl md:text-6xl font-black mt-6 mb-20 text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>
                Connect once.<br /><span className="shimmer-text">Save continuously.</span>
              </h2>
            </FadeUp>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-[#7030A0] via-[#c084fc] to-[#7030A0]" />
              {[
                { step: "01", title: "Connect your cloud", body: "Link AWS, GCP, Azure, or on-prem in under a minute. Billing data ingests via API automatically." },
                { step: "02", title: "AI finds the waste", body: "Right-sizing, idle resources, budget risks, reservation gaps — AI scans 30+ days and surfaces specifics." },
                { step: "03", title: "Act and track", body: "Apply recommendations in one click. Chat with the AI copilot. Watch savings accumulate in real time." },
              ].map((s, i) => (
                <FadeUp key={s.step} delay={i * 150}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 transition-colors">
                    <div className="text-[#c084fc] text-xs font-mono mb-3">{s.step}</div>
                    <h3 className="text-white font-bold text-lg mb-3" style={{ fontFamily: "'Raleway', sans-serif" }}>{s.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>{s.body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── MULTI-CLOUD ─────────────────────────────────────────────── */}
        <section className="py-32 px-6 bg-white">
          <div className="mx-auto max-w-7xl">
            <FadeUp className="text-center mb-20">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#7030A0] bg-[#f3e8ff] px-4 py-2 rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Multi-cloud
              </span>
              <h2 className="text-5xl md:text-6xl font-black mt-6 mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                One view.<br /><span className="shimmer-text">Every cloud.</span>
              </h2>
              <p className="text-[#666] text-lg max-w-xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Stop switching dashboards. Ingest bills from every provider, apply consistent tagging, and see your full spend picture in a single pane.
              </p>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { cloud: "AWS",       desc: "EC2, RDS, S3, Lambda, EKS, NAT Gateway — full service breakdown." },
                { cloud: "GCP",       desc: "Compute Engine, GKE, Cloud Storage, BigQuery — unified billing ingest." },
                { cloud: "Azure",     desc: "VMs, AKS, Blob Storage, Azure SQL — tag-enforced chargeback." },
                { cloud: "On-prem",   desc: "Self-hosted K8s clusters, bare-metal, and hybrid workloads." },
              ].map((c, i) => (
                <FadeUp key={c.cloud} delay={(i % 4) * 80}>
                  <div className="group bg-[#faf6ff] border border-[#ece6f5] rounded-2xl p-6 hover:bg-[#f3e8ff] hover:border-[#c084fc] hover:shadow-md transition-all duration-200 h-full">
                    <div className="text-2xl font-black text-[#7030A0] mb-3" style={{ fontFamily: "'Raleway', sans-serif" }}>{c.cloud}</div>
                    <p className="text-sm text-[#666] leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>{c.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI COPILOT SPOTLIGHT ─────────────────────────────────────── */}
        <section className="py-32 px-6 bg-gradient-to-br from-[#1a0a2e] via-[#2d0a4e] to-[#1a0a2e] relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-30" />
          <div className="relative mx-auto max-w-5xl">
            <FadeUp className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#c084fc] bg-white/10 px-4 py-2 rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                AI Copilot
              </span>
              <h2 className="text-5xl md:text-6xl font-black mt-6 mb-6 text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>
                Ask. Get specifics.<br />
                <span className="shimmer-text">Act immediately.</span>
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Poppins', sans-serif" }}>
                The copilot reads your live billing data, open alerts, and savings opportunities — then answers with numbered next steps, not generic advice. Powered by Kimi K2 via OpenRouter, with automatic Ollama fallback when offline.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: "🧠", title: "Context-aware",          body: "Knows your current spend, top cost drivers, active alerts, and open recommendations in real time." },
                { icon: "⚡", title: "Streaming responses",    body: "Token-by-token SSE streaming. No loading spinners, no waiting for a full response to appear." },
                { icon: "🔁", title: "Ollama fallback",        body: "When OpenRouter is unavailable, the copilot switches to your local Ollama instance automatically." },
              ].map((c, i) => (
                <FadeUp key={c.title} delay={i * 150}>
                  <div className="bg-white/8 border border-white/15 rounded-2xl p-8 text-left hover:bg-white/12 transition-colors">
                    <div className="text-3xl mb-4">{c.icon}</div>
                    <h3 className="text-white font-bold text-lg mb-3" style={{ fontFamily: "'Raleway', sans-serif" }}>{c.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>{c.body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

            {/* Chat demo */}
            <FadeUp>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div className="ml-auto max-w-[80%] bg-[#7030A0] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    What&apos;s driving my EC2 cost increase this month?
                  </div>
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#7030A0]/40 text-sm">✦</div>
                    <div className="max-w-[80%] bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-white/80" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      EC2 grew $4,820 (18%) MoM. Three causes:
                      <br /><br />
                      1. <strong className="text-white">3 r5.4xlarge added</strong> in us-east-1 (+$1,890)<br />
                      2. <strong className="text-white">Spot interruptions</strong> shifted to on-demand (+$1,640)<br />
                      3. <strong className="text-white">NAT Gateway egress</strong> jumped 240% (+$1,290)
                      <br /><br />
                      Next: convert r5.4xlarge to 1-year reserved (saves ~$756/mo), review spot fallback config, audit NAT source.
                    </div>
                  </div>
                  <div className="ml-auto max-w-[80%] bg-[#7030A0] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Open the RI planner for r5.4xlarge
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── TECH STACK ──────────────────────────────────────────────── */}
        <section id="stack" className="py-32 px-6 bg-white">
          <div className="mx-auto max-w-5xl text-center">
            <FadeUp>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#7030A0] bg-[#f3e8ff] px-4 py-2 rounded-full" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Tech stack
              </span>
              <h2 className="text-5xl font-black mt-6 mb-4" style={{ fontFamily: "'Raleway', sans-serif" }}>
                Modern. <span className="shimmer-text">Production-grade.</span>
              </h2>
              <p className="text-[#666] text-lg mb-14" style={{ fontFamily: "'Poppins', sans-serif" }}>
                FastAPI + Next.js 14 + PostgreSQL 16 — async all the way, CloudNativePG operator, Helm chart, GitHub Actions CI/CD.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {stackBadges.map(s => (
                  <span
                    key={s}
                    className="px-4 py-2 bg-[#faf6ff] border border-[#ece6f5] text-[#1a0a2e] rounded-full text-sm font-semibold hover:bg-[#f3e8ff] hover:border-[#c084fc] transition-colors cursor-default"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── OPEN SOURCE CTA ─────────────────────────────────────────── */}
        <section className="py-32 px-6 bg-[#0d0618] relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#7030A0] opacity-20 blur-[120px] rounded-full" />
          <FadeUp className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7030A0]/20 border border-[#7030A0]/40 mb-8">
              <GithubIcon className="w-8 h-8 text-[#c084fc]" />
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: "'Raleway', sans-serif" }}>
              100% <span className="shimmer-text">Open Source.</span>
            </h2>
            <p className="text-white/60 text-lg mb-10 leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Fork it, extend it, self-host it via Helm. Full FastAPI backend, Next.js frontend,
              CloudNativePG cluster, GitHub Actions pipelines — every line is on GitHub. PRs welcome.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href={GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "#7030A0", fontFamily: "'Poppins', sans-serif" }}
              >
                <GithubIcon className="w-5 h-5" />
                View on GitHub
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm border border-white/20 hover:bg-white/10 transition-all"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Open the App →
              </Link>
            </div>
          </FadeUp>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <footer className="bg-[#080410] border-t border-white/10 px-6 pt-20 pb-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
              <div className="max-w-xs">
                <div className="flex items-center gap-1 mb-4">
                  <span className="text-2xl font-black text-[#7030A0]" style={{ fontFamily: "'Raleway', sans-serif" }}>DClaw</span>
                  <span className="text-2xl font-semibold text-white" style={{ fontFamily: "'Raleway', sans-serif" }}>&nbsp;Cost</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  The AI FinOps OS for engineering teams. Multi-cloud billing, right-sizing, budget alerts, and AI copilot — all open source.
                </p>
                <a
                  href={GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/8 border border-white/15 inline-flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <GithubIcon className="w-4 h-4" />
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([col, links]) => (
                  <div key={col}>
                    <h4 className="text-white text-xs font-bold tracking-widest uppercase mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>{col}</h4>
                    <ul className="space-y-2.5">
                      {links.map(l => (
                        <li key={l.label}>
                          {l.href.startsWith("http") ? (
                            <a
                              href={l.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/40 hover:text-white/80 text-sm transition-colors"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {l.label}
                            </a>
                          ) : (
                            <Link
                              href={l.href}
                              className="text-white/40 hover:text-white/80 text-sm transition-colors"
                              style={{ fontFamily: "'Poppins', sans-serif" }}
                            >
                              {l.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/30 text-xs" style={{ fontFamily: "'Poppins', sans-serif" }}>
                © 2026 DClaw Cost · Built on the DClaw Stack · MIT License
              </p>
              <div className="flex gap-6">
                {[
                  { label: "REVISED PRD",  href: `${GITHUB}/blob/main/REVISED-PRD.md` },
                  { label: "Product Spec", href: `${GITHUB}/blob/main/PRODUCT-SPEC.md` },
                  { label: "Issues",       href: `${GITHUB}/issues` },
                ].map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/30 hover:text-white/60 text-xs transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
