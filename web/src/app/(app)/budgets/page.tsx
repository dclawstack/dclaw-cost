"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle, AlertTriangle } from "lucide-react";
import {
  listBudgets, createBudget, deleteBudget,
  listCostAlerts, acknowledgeAlert,
  type Budget, type CostAlert,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SEV: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  critical: "destructive", warning: "default", info: "secondary",
};

const BLANK = {
  name: "", amount_usd: "", period: "monthly",
  scope: "service", scope_value: "", alert_threshold_pct: "80",
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);

  const reload = async () => {
    setLoading(true);
    const [b, a] = await Promise.all([listBudgets(100), listCostAlerts({ limit: 50 })]);
    setBudgets(b); setAlerts(a); setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!form.name || !form.amount_usd || !form.scope_value) return;
    setSaving(true);
    try {
      const b = await createBudget({
        name: form.name,
        amount_usd: parseFloat(form.amount_usd),
        period: form.period as Budget["period"],
        scope: form.scope as Budget["scope"],
        scope_value: form.scope_value,
        alert_threshold_pct: parseInt(form.alert_threshold_pct),
        status: "active",
      });
      setBudgets((prev) => [b, ...prev]);
      setOpen(false); setForm(BLANK);
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this budget?")) return;
    await deleteBudget(id);
    setBudgets((p) => p.filter((b) => b.id !== id));
    setAlerts((p) => p.filter((a) => a.budget_id !== id));
  };

  const ack = async (id: string) => {
    const updated = await acknowledgeAlert(id);
    setAlerts((p) => p.map((a) => (a.id === id ? updated : a)));
  };

  const unacked = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets & Alerts</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Budget
        </Button>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets ({budgets.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts{unacked.length > 0 ? ` (${unacked.length} active)` : ""}
          </TabsTrigger>
        </TabsList>

        {/* Budgets tab */}
        <TabsContent value="budgets" className="mt-4">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : budgets.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 mb-3">No budgets yet.</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create your first budget
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {budgets.map((b) => {
                const relatedAlerts = alerts.filter((a) => a.budget_id === b.id && !a.acknowledged);
                const latestAlert = relatedAlerts[0];
                const usedPct = latestAlert
                  ? Math.round((latestAlert.current_spend_usd / b.amount_usd) * 100)
                  : 0;
                return (
                  <Card key={b.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{b.name}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => remove(b.id)}
                          className="text-gray-400 hover:text-red-500 -mt-1 -mr-2 h-7 w-7 p-0">
                          ×
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        {b.period} · {b.scope}: {b.scope_value}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold text-gray-900">
                          ${b.amount_usd.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">limit</span>
                      </div>
                      {latestAlert ? (
                        <>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className={`h-2 rounded-full ${usedPct >= 100 ? "bg-red-500" : usedPct >= b.alert_threshold_pct ? "bg-yellow-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(usedPct, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            ${latestAlert.current_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent · {usedPct}%
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">No spend data yet</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant={b.status === "active" ? "default" : "secondary"}>{b.status}</Badge>
                        <span className="text-xs text-gray-400">Alert at {b.alert_threshold_pct}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Alerts tab */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {alerts.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No alerts generated yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>Projected</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((a) => (
                      <TableRow key={a.id} className={a.acknowledged ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {a.alert_type === "forecast"
                              ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              : <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <span className="text-xs capitalize">{a.alert_type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs">{a.message}</TableCell>
                        <TableCell>
                          <Badge variant={SEV[a.severity]}>{a.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          ${a.current_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {a.projected_spend_usd
                            ? `$${a.projected_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(a.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {a.acknowledged ? (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Acked
                            </span>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => ack(a.id)}>
                              Acknowledge
                            </Button>
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

      {/* Create budget dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Budget Name</Label>
              <Input placeholder="e.g. Monthly EC2 Budget"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limit (USD)</Label>
                <Input type="number" placeholder="5000"
                  value={form.amount_usd} onChange={(e) => setForm((f) => ({ ...f, amount_usd: e.target.value }))} />
              </div>
              <div>
                <Label>Period</Label>
                <Select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Scope</Label>
                <Select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
                  <option value="service">Service</option>
                  <option value="account">Account</option>
                  <option value="team">Team</option>
                  <option value="tag">Tag</option>
                </Select>
              </div>
              <div>
                <Label>Scope Value</Label>
                <Input placeholder="e.g. EC2"
                  value={form.scope_value} onChange={(e) => setForm((f) => ({ ...f, scope_value: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Alert Threshold (%)</Label>
              <Input type="number" min="1" max="100" placeholder="80"
                value={form.alert_threshold_pct}
                onChange={(e) => setForm((f) => ({ ...f, alert_threshold_pct: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Creating…" : "Create Budget"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
