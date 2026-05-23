"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getFinOpsReport, type FinOpsReport } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [report, setReport] = useState<FinOpsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState("12");

  const load = async (m = parseInt(months)) => {
    setLoading(true);
    try { setReport(await getFinOpsReport(m)); } catch { setReport(null); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const maxSpend = report ? Math.max(...report.monthly_trends.map((t) => t.total_spend_usd), 1) : 1;

  const MoMIcon = ({ current, prev }: { current: number; prev: number }) => {
    if (!prev) return <Minus className="h-3 w-3 text-gray-400" />;
    const pct = ((current - prev) / prev) * 100;
    if (pct > 5) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (pct < -5) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900">FinOps Reports</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={months} onChange={(e) => setMonths(e.target.value)}>
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </Select>
          <Button onClick={() => load(parseInt(months))} disabled={loading} variant="outline">Refresh</Button>
        </div>
      </div>

      {loading ? <p className="text-gray-400 text-sm">Generating report…</p> : !report ? (
        <p className="text-red-500 text-sm">Failed to load report.</p>
      ) : (
        <>
          {/* Insights */}
          {report.insights.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader><CardTitle className="text-sm text-blue-700">AI Insights</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {report.insights.map((ins, i) => <li key={i} className="text-sm text-blue-800">• {ins}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Unit Economics */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Unit Economics</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {report.unit_economics.map((ue) => (
                <Card key={ue.name}>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500 leading-tight">{ue.name}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {ue.unit.startsWith("USD") ? `$${ue.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${ue.value}${ue.unit.includes("%") ? "%" : ""}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{ue.unit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Monthly trend chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Spend Trend</CardTitle></CardHeader>
            <CardContent>
              {report.monthly_trends.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No billing data for this period.</p>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-40">
                    {report.monthly_trends.map((t, i) => {
                      const h = Math.round((t.total_spend_usd / maxSpend) * 100);
                      const prev = i > 0 ? report.monthly_trends[i - 1].total_spend_usd : 0;
                      return (
                        <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex items-center gap-0.5 text-xs text-gray-400">
                            <MoMIcon current={t.total_spend_usd} prev={prev} />
                          </div>
                          <div
                            className="w-full rounded-t bg-indigo-500 hover:bg-indigo-600 transition-colors cursor-default"
                            style={{ height: `${h}%`, minHeight: "4px" }}
                            title={`${t.month}: $${t.total_spend_usd.toLocaleString()}`}
                          />
                          <span className="text-[10px] text-gray-400 rotate-45 origin-left whitespace-nowrap">
                            {t.month.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <table className="mt-8 w-full text-sm">
                    <thead className="text-xs text-gray-500 border-b">
                      <tr><th className="pb-1 text-left">Month</th><th className="pb-1 text-right">Spend</th><th className="pb-1 text-right">Records</th><th className="pb-1 text-right">MoM</th></tr>
                    </thead>
                    <tbody>
                      {report.monthly_trends.map((t, i) => {
                        const prev = i > 0 ? report.monthly_trends[i - 1].total_spend_usd : null;
                        const mom = prev ? ((t.total_spend_usd - prev) / prev) * 100 : null;
                        return (
                          <tr key={t.month} className="border-b last:border-0">
                            <td className="py-1.5 text-gray-700">{t.month}</td>
                            <td className="py-1.5 text-right font-medium">${t.total_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td className="py-1.5 text-right text-gray-500">{t.record_count}</td>
                            <td className={`py-1.5 text-right text-xs ${mom === null ? "text-gray-400" : mom > 0 ? "text-red-500" : "text-green-600"}`}>
                              {mom === null ? "—" : `${mom > 0 ? "+" : ""}${mom.toFixed(1)}%`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
