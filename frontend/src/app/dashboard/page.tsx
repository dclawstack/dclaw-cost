"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Lightbulb, Bell, AlertTriangle } from "lucide-react";
import { getDashboard, listCostAlerts, type DashboardStats, type CostAlert } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function StatCard({
  title, value, sub, icon: Icon, accent,
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-lg p-3 ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const SEV_COLOR: Record<string, string> = {
  critical: "destructive",
  warning: "default",
  info: "secondary",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getDashboard(), listCostAlerts({ acknowledged: false, limit: 5 })])
      .then(([s, a]) => { setStats(s); setAlerts(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading dashboard…</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!stats) return null;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly Spend"
          value={`$${stats.total_monthly_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="current month to date"
          icon={DollarSign}
          accent="bg-blue-500"
        />
        <StatCard
          title="Projected Spend"
          value={`$${stats.projected_monthly_spend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="end-of-month forecast"
          icon={TrendingUp}
          accent="bg-indigo-500"
        />
        <StatCard
          title="Savings Available"
          value={`$${stats.total_savings_opportunities.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="open recommendations"
          icon={Lightbulb}
          accent="bg-green-500"
        />
        <StatCard
          title="Active Alerts"
          value={String(stats.active_alerts_count)}
          sub="unacknowledged"
          icon={Bell}
          accent={stats.active_alerts_count > 0 ? "bg-red-500" : "bg-gray-400"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Cost Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top_services.length === 0 ? (
              <p className="text-sm text-gray-400">No billing data yet. Ingest some records to see cost drivers.</p>
            ) : (
              <div className="space-y-3">
                {stats.top_services.map((s) => {
                  const max = stats.top_services[0].cost_usd;
                  const pct = max > 0 ? (s.cost_usd / max) * 100 : 0;
                  return (
                    <div key={s.service} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{s.service}</span>
                        <span className="text-gray-500">
                          ${s.cost_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.budget_utilization.length === 0 ? (
              <p className="text-sm text-gray-400">No budgets configured yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.budget_utilization.map((b) => (
                  <div key={b.budget_id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{b.name}</span>
                      <span className={b.used_pct >= 100 ? "text-red-600 font-bold" : "text-gray-500"}>
                        {b.used_pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${b.used_pct >= 100 ? "bg-red-500" : b.used_pct >= 80 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(b.used_pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      ${b.spent_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })} of ${b.amount_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={SEV_COLOR[a.severity] as "default" | "secondary" | "destructive" | "outline"}>
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
