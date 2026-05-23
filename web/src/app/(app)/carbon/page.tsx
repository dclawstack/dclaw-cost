"use client";

import { useEffect, useState } from "react";
import { Leaf, Zap } from "lucide-react";
import { listCloudAccounts, calculateCarbon, getCarbonSummary, type CloudAccount, type CarbonSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const GREEN_THRESHOLD = 200; // gCO2eq/kWh

export default function CarbonPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [summary, setSummary] = useState<CarbonSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => { listCloudAccounts(100).then(setAccounts).catch(() => {}); }, []);

  const load = async (acct = accountId) => {
    if (!acct) return;
    setLoading(true);
    try { setSummary(await getCarbonSummary(acct)); } catch { setSummary(null); } finally { setLoading(false); }
  };

  const calculate = async () => {
    if (!accountId) return;
    setCalculating(true);
    try {
      const res = await calculateCarbon(accountId);
      alert(`Carbon calculation complete: ${res.records_created} new records created.`);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setCalculating(false); }
  };

  const maxRegionCO2 = summary ? Math.max(...summary.by_region.map((r) => r.co2_kg), 1) : 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Leaf className="h-6 w-6 text-green-500" /><h1 className="text-2xl font-bold text-gray-900">Carbon & Sustainability</h1></div>
        <div className="flex gap-2">
          <Select value={accountId} onChange={(e) => { setAccountId(e.target.value); load(e.target.value); }}>
            <option value="">Select Account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Button onClick={calculate} disabled={calculating || !accountId} variant="outline">
            <Zap className="h-4 w-4 mr-2" />{calculating ? "Calculating…" : "Calculate CO₂"}
          </Button>
        </div>
      </div>

      {!accountId ? (
        <Card><CardContent className="py-12 text-center text-gray-400 text-sm">Select a cloud account to view carbon footprint estimates.</CardContent></Card>
      ) : loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : !summary || (summary.total_co2_kg === 0 && summary.by_service.length === 0) ? (
        <Card><CardContent className="py-12 text-center text-gray-400 text-sm">No carbon data yet. Click <strong>Calculate CO₂</strong> to estimate emissions from billing records.</CardContent></Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total CO₂ (kg)", value: summary.total_co2_kg.toLocaleString(undefined, { maximumFractionDigits: 1 }), color: "text-red-500" },
              { label: "Estimated kWh", value: summary.total_kwh.toLocaleString(undefined, { maximumFractionDigits: 0 }), color: "text-gray-900" },
              { label: "Cleanest Region", value: summary.greenest_region ?? "—", color: "text-green-600" },
              { label: "Dirtiest Region", value: summary.dirtiest_region ?? "—", color: "text-red-600" },
            ].map(({ label, value, color }) => (
              <Card key={label}><CardContent className="pt-4"><p className="text-xs text-gray-500">{label}</p><p className={`text-xl font-bold truncate ${color}`}>{value}</p></CardContent></Card>
            ))}
          </div>

          {/* Green region suggestions */}
          {summary.green_region_suggestions.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-green-700 mb-1">🌱 Greener Region Suggestions</p>
                <p className="text-sm text-green-600">
                  Consider migrating workloads to: <strong>{summary.green_region_suggestions.join(", ")}</strong> — these regions have significantly lower carbon intensity.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By service */}
            <Card>
              <CardHeader><CardTitle className="text-base">CO₂ by Service (kg)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.by_service.map((s) => {
                    const maxSvc = summary.by_service[0]?.co2_kg ?? 1;
                    return (
                      <div key={s.service}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="font-medium text-gray-700">{s.service}</span>
                          <span className="text-gray-500">{s.co2_kg.toFixed(2)} kg</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${(s.co2_kg / maxSvc) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* By region */}
            <Card>
              <CardHeader><CardTitle className="text-base">CO₂ by Region</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.by_region.map((r) => {
                    const isGreen = r.avg_intensity < GREEN_THRESHOLD;
                    return (
                      <div key={r.region}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${isGreen ? "bg-green-500" : "bg-red-400"}`} />
                            <span className="font-medium text-gray-700">{r.region}</span>
                          </span>
                          <span className="text-gray-500">{r.co2_kg.toFixed(2)} kg · {r.avg_intensity.toFixed(0)} gCO₂/kWh</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div className={`h-2 rounded-full ${isGreen ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${(r.co2_kg / maxRegionCO2) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
