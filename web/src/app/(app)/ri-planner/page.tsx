"use client";

import { useEffect, useState } from "react";
import { Landmark, Zap, CheckCircle, XCircle } from "lucide-react";
import { listCloudAccounts, analyzeRIOpportunities, listRIPlans, updateRIPlanStatus, type CloudAccount, type RIPlan } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TERM_LABELS: Record<string, string> = {
  "1yr_no_upfront": "1-Year · No Upfront",
  "1yr_partial":    "1-Year · Partial Upfront",
  "1yr_all_upfront":"1-Year · All Upfront",
  "3yr_no_upfront": "3-Year · No Upfront",
  "3yr_partial":    "3-Year · Partial Upfront",
  "3yr_all_upfront":"3-Year · All Upfront",
};

export default function RIPlannerPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [plans, setPlans] = useState<RIPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { listCloudAccounts(100).then(setAccounts).catch(() => {}); }, []);

  const load = async (acct = accountId) => {
    if (!acct) return;
    setLoading(true);
    try { setPlans(await listRIPlans(acct)); } finally { setLoading(false); }
  };

  const analyze = async () => {
    if (!accountId) return;
    setAnalyzing(true);
    try {
      const res = await analyzeRIOpportunities(accountId);
      alert(`Generated ${res.plans_created} RI plans from ${res.resources_analyzed} resources.`);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setAnalyzing(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const updated = await updateRIPlanStatus(id, status);
    setPlans((p) => p.map((pl) => (pl.id === id ? updated : pl)));
  };

  const proposed = plans.filter((p) => p.status === "proposed");
  const accepted = plans.filter((p) => p.status === "accepted");
  const totalAcceptedSavings = accepted.reduce((s, p) => s + p.annual_savings, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Reserved Instance Planner</h1>
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

      {accepted.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <p className="text-sm text-green-700">
              <strong>{accepted.length} plans accepted</strong> — estimated annual savings:{" "}
              <strong>${totalAcceptedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="proposed">
        <TabsList>
          <TabsTrigger value="proposed">Proposed ({proposed.length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({accepted.length})</TabsTrigger>
        </TabsList>
        {(["proposed", "accepted"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardContent className="pt-4">
                {loading ? <p className="text-gray-400 text-sm py-6">Loading…</p> :
                  plans.filter((p) => p.status === tab).length === 0 ? (
                    <p className="text-gray-400 text-sm py-8 text-center">
                      {tab === "proposed" ? "Select an account and run analysis to generate plans." : "No accepted plans yet."}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service / Resource</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>On-Demand/mo</TableHead>
                          <TableHead>RI Cost/mo</TableHead>
                          <TableHead>Savings/yr</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Break-even</TableHead>
                          {tab === "proposed" && <TableHead>Action</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.filter((p) => p.status === tab).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <div className="font-medium">{p.service}</div>
                              <div className="text-xs text-gray-400">{p.resource_type}</div>
                            </TableCell>
                            <TableCell className="text-sm">{TERM_LABELS[p.commitment_type] ?? p.commitment_type}</TableCell>
                            <TableCell>${p.monthly_on_demand_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell>${p.monthly_ri_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              ${p.annual_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{p.discount_pct}%</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {p.break_even_months === 0 ? "Immediate" : `${p.break_even_months}mo`}
                            </TableCell>
                            {tab === "proposed" && (
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "accepted")}>
                                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "rejected")}>
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
