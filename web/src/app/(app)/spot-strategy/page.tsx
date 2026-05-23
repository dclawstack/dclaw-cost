"use client";

import { useEffect, useState } from "react";
import { Zap, CheckCircle, XCircle } from "lucide-react";
import { listCloudAccounts, analyzeSpotOpportunities, listSpotStrategies, getSpotSummary, updateSpotStatus, type CloudAccount, type SpotStrategy, type SpotStrategySummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RISK_COLOR: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};
const REC_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  suitable: "default", partial: "secondary", not_suitable: "outline",
};

export default function SpotStrategyPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [strategies, setStrategies] = useState<SpotStrategy[]>([]);
  const [summary, setSummary] = useState<SpotStrategySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { listCloudAccounts(100).then(setAccounts).catch(() => {}); }, []);

  const load = async (acct = accountId) => {
    if (!acct) return;
    setLoading(true);
    try {
      const [s, sum] = await Promise.all([listSpotStrategies(acct), getSpotSummary(acct)]);
      setStrategies(s); setSummary(sum);
    } finally { setLoading(false); }
  };

  const analyze = async () => {
    if (!accountId) return;
    setAnalyzing(true);
    try {
      const res = await analyzeSpotOpportunities(accountId);
      alert(`Analyzed ${res.resources_analyzed} resources, generated ${res.strategies_created} strategies.`);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setAnalyzing(false); }
  };

  const update = async (id: string, status: string) => {
    const updated = await updateSpotStatus(id, status);
    setStrategies((p) => p.map((s) => (s.id === id ? updated : s)));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">Spot Instance Strategy</h1>
        </div>
        <div className="flex gap-2">
          <Select value={accountId} onChange={(e) => { setAccountId(e.target.value); load(e.target.value); }}>
            <option value="">Select Account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Button onClick={analyze} disabled={analyzing || !accountId} variant="outline">
            <Zap className="h-4 w-4 mr-2" />{analyzing ? "Analyzing…" : "Analyze"}
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {[
            { label: "Analyzed", value: summary.total_resources_analyzed },
            { label: "Suitable", value: summary.suitable_count, color: "text-green-600" },
            { label: "Partial", value: summary.partial_count, color: "text-yellow-600" },
            { label: "Not Suitable", value: summary.not_suitable_count, color: "text-gray-500" },
            { label: "Potential Savings/mo", value: `$${summary.total_potential_savings_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "text-green-600" },
          ].map(({ label, value, color }) => (
            <Card key={label}><CardContent className="pt-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color ?? "text-gray-900"}`}>{value}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Spot Recommendations</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400 text-sm py-6">Loading…</p> :
            strategies.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Select an account and run analysis to identify spot candidates.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Current/mo</TableHead>
                    <TableHead>Spot/mo</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Interruption Risk</TableHead>
                    <TableHead>Verdict</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategies.map((s) => (
                    <TableRow key={s.id} className={s.status !== "open" ? "opacity-40" : ""}>
                      <TableCell><div className="font-mono text-xs">{s.resource_id}</div><div className="text-xs text-gray-400">{s.resource_type}</div></TableCell>
                      <TableCell className="text-sm capitalize">{s.workload_type.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-gray-500">{s.region}</TableCell>
                      <TableCell>${s.current_monthly_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-green-600">${s.spot_monthly_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="font-semibold text-green-600">${s.estimated_savings_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span className="text-xs text-gray-400 ml-1">({s.savings_pct}%)</span></TableCell>
                      <TableCell><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLOR[s.interruption_risk]}`}>{s.interruption_risk}</span></TableCell>
                      <TableCell><Badge variant={REC_VARIANT[s.recommendation]}>{s.recommendation.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        {s.status === "open" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => update(s.id, "accepted")}><CheckCircle className="h-3.5 w-3.5 text-green-500" /></Button>
                            <Button size="sm" variant="outline" onClick={() => update(s.id, "rejected")}><XCircle className="h-3.5 w-3.5 text-gray-400" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
