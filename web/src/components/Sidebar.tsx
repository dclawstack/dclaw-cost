"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Cloud, Receipt, PiggyBank, Lightbulb, Bot,
  DollarSign, Landmark, Tag, Container, BarChart3,
  Zap, ShoppingCart, Leaf, Trash2,
} from "lucide-react";

const GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/dashboard",       label: "Dashboard",        icon: LayoutDashboard },
      { href: "/cloud-accounts",  label: "Cloud Accounts",   icon: Cloud },
      { href: "/billing",         label: "Billing",          icon: Receipt },
    ],
  },
  {
    label: "P0 — Optimization",
    items: [
      { href: "/budgets",         label: "Budgets & Alerts",     icon: PiggyBank },
      { href: "/recommendations", label: "Recommendations",      icon: Lightbulb },
    ],
  },
  {
    label: "P1 — Platform",
    items: [
      { href: "/ri-planner",      label: "RI Planner",           icon: Landmark },
      { href: "/waste",           label: "Waste Detection",      icon: Trash2 },
      { href: "/cost-allocation", label: "Cost Allocation",      icon: Tag },
      { href: "/container-costs", label: "Container Costs",      icon: Container },
    ],
  },
  {
    label: "P2 — Scale",
    items: [
      { href: "/reports",         label: "FinOps Reports",       icon: BarChart3 },
      { href: "/spot-strategy",   label: "Spot Strategy",        icon: Zap },
      { href: "/saas",            label: "SaaS Spend",           icon: ShoppingCart },
      { href: "/carbon",          label: "Carbon & Green",       icon: Leaf },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/copilot",         label: "AI Copilot",           icon: Bot },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-56 flex-shrink-0 flex-col bg-white overflow-y-auto"
      style={{ borderRight: "1px solid #ededed", boxShadow: "2px 0 15px rgba(0,0,0,0.04)" }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2 px-4 py-4 sticky top-0 bg-white z-10"
        style={{ borderBottom: "1px solid #ededed" }}
      >
        <DollarSign className="h-5 w-5 flex-shrink-0" style={{ color: "#7030A0" }} />
        <span
          className="font-bold tracking-tight text-[#333333]"
          style={{ fontFamily: "'Raleway', sans-serif" }}
        >
          DClaw Cost
        </span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 space-y-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p
              className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#aaaaaa]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-[#7030A0] text-white shadow-sm"
                        : "text-[#555555] hover:bg-[#f5eefb] hover:text-[#7030A0]"
                    )}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-4 py-2 text-[10px] text-[#aaaaaa]"
        style={{ borderTop: "1px solid #ededed", fontFamily: "'Poppins', sans-serif" }}
      >
        v1.0 · All P0–P2 features
      </div>
    </aside>
  );
}
