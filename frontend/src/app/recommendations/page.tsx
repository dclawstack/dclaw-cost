"use client";

import { useEffect, useState } from "react";
import { Zap, Trash2, CheckCircle, XCircle } from "lucide-react";
import {
  listRecommendations, updateRecommendationStatus,
  listWasteItems, updateWasteItemStatus,
  listCloudAccounts,
  type ResourceRecommendation, type WasteItem, type CloudAccount,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const REC_TYPE_LABEL: Record<string, string> = {
  right_size: "Right-Size",
  reserved_instance: "Reserved Instance",
  spot: "Spot",
  delete: "Delete",
  schedule: "Schedule",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  applied: "secondary",
  dismissed: "outline",
};

const WASTE_LABEL: Record<string, string> = {
  idle: "Idle",
  orphaned: "Orphaned",
  unused_ip: "Unused IP",
  unattached_volume: "Unattached Volume",
  old_snapshot: "Old Snapshot",
};

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${value >= 80 ? "bg-green-500" : value >= 60 ? "bg-yellow-500" : "bg-red-400"}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{value}%</span>
    </div>
  );
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<ResourceRecommendation[]>([]);
  const [waste, setWaste] = useState<WasteItem[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const reload = async (acctId = accountFilter) => {
    setLoading(true);
    const params = acctId ? { cloud_account_id: acctId, limit: 100 } : { limit: 100 };
    const [r, w, a] = await Promise.all([
      listRecommendations(params),
      listWasteItems(params),
      listCloudAccounts(100),
    ]);
    setRecs(r); setWaste(w); setAccounts(a); setLoading(false);
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line

  const runAnalysis = async () => {
    if (!accountFilter) { alert("Select an account to analyze first."); return; }
    setAnalyzing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/recommendations/analyze/${accountFilter}`,
        { method: "POST" }
      );
      const data = await res.json();
      alert(`Analysis complete: ${data.recommendations_created} recommendations, ${data.waste_items_created} waste items created.`);
      reload(accountFilter);
    } catch { alert("Analysis failed."); }
    finally { setAnalyzing(false); }
  };

  const updateRecStatus = async (id: string, status: string) => {
    const updated = await updateRecommendationStatus(id, status);
    setRecs((p) => p.map((r) => (r.id === id ? updated : r)));
  };

  const updateWasteStatus = async (id: string, status: string) => {
    const updated = await updateWasteItemStatus(id, status);
    setWaste((p) => p.map((w) => (w.id === id ? updated : w)));
  };

  const openRecs = recs.filter((r) => r.status === "open");
  const totalSavings = openRecs.reduce((s, r) => s + r.estimated_savings_usd, 0);
  const openWaste = waste.filter((w) => w.status === "open");
  const totalWaste = openWaste.reduce((s, w) => s + w.estimated_monthly_waste_usd, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
        <div className="flex gap-2">
          <Select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); reload(e.target.value); }}
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Button onClick={runAnalysis} disabled={analyzing || !accountFilter} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            {analyzing ? "Analyzing…" : "Run Analysis"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500">Potential Monthly Savings</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              ${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">{openRecs.length} open recommendations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-gray-500">Monthly Waste Identified</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              ${totalWaste.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">{openWaste.length} open waste items</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations ({recs.length})</TabsTrigger>
          <TabsTrigger value="waste">Waste Items ({waste.length})</TabsTrigger>
        </TabsList>

        {/* Recommendations tab */}
        <TabsContent value="recommendations" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <p className="text-sm text-gray-400 py-6">Loading…</p>
              ) : recs.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No recommendations yet. Select an account and run analysis.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Current Cost</TableHead>
                      <TableHead>Est. Savings</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recs.map((r) => (
                      <TableRow key={r.id} className={r.status !== "open" ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="font-mono text-xs">{r.resource_id}</div>
                          <div className="text-xs text-gray-400">{r.resource_type}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{REC_TYPE_LABEL[r.recommendation_type] ?? r.recommendation_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${r.current_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${r.estimated_savings_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell><ConfidenceBar value={r.confidence} /></TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {r.status === "open" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline"
                                onClick={() => updateRecStatus(r.id, "applied")}
                                title="Mark applied">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button size="sm" variant="outline"
                                onClick={() => updateRecStatus(r.id, "dismissed")}
                                title="Dismiss">
                                <XCircle className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
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
        </TabsContent>

        {/* Waste items tab */}
        <TabsContent value="waste" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <p className="text-sm text-gray-400 py-6">Loading…</p>
              ) : waste.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">
                  No waste items found. Run analysis to detect orphaned or idle resources.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resource</TableHead>
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Monthly Waste</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waste.map((w) => (
                      <TableRow key={w.id} className={w.status !== "open" ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="font-mono text-xs">{w.resource_id}</div>
                          <div className="text-xs text-gray-400">{w.resource_type}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{WASTE_LABEL[w.waste_type] ?? w.waste_type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-red-500">
                          ${w.estimated_monthly_waste_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {w.last_used_at ? new Date(w.last_used_at).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[w.status]}>{w.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {w.status === "open" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline"
                                onClick={() => updateWasteStatus(w.id, "remediated")}
                                title="Mark remediated">
                                <Trash2 className="h-3.5 w-3.5 text-green-500" />
                              </Button>
                              <Button size="sm" variant="outline"
                                onClick={() => updateWasteStatus(w.id, "ignored")}
                                title="Ignore">
                                <XCircle className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
