"use client";

import { useState } from "react";
import { DollarSign } from "lucide-react";
import { api, CostReport } from "@/lib/api";

export default function DashboardPage() {
  const [accountId, setAccountId] = useState("");
  const [report, setReport] = useState<CostReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!accountId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<CostReport>("/cost/reports", {
        method: "POST",
        body: JSON.stringify({ account_id: accountId }),
      });
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-brand" />
          <h1 className="text-2xl font-bold text-brand">DClaw Cost</h1>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Cloud account ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. aws-123456"
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="rounded-md bg-brand px-6 py-2 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Spending"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {report && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">Monthly spend</h2>
              <p className="text-2xl font-bold text-gray-900">
                ${report.monthly_spend.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">Top services</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {report.top_services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">Savings opportunities</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {report.savings_opportunities.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">Anomaly alerts</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {report.anomaly_alerts.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
