"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Plus, AlertTriangle } from "lucide-react";
import { listSaasSubscriptions, getSaasSummary, createSaasSubscription, deleteSaasSubscription, type SaasSubscription, type SaasSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CATEGORIES = ["monitoring", "communication", "ci_cd", "security", "analytics", "productivity", "other"];
const STATUS_V: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", cancelled: "secondary", under_review: "outline", duplicate: "destructive",
};
const BLANK = { name: "", vendor: "", category: "monitoring", monthly_cost_usd: "", seat_count: "", owner: "", renewal_date: "", notes: "" };

export default function SaasPage() {
  const [subs, setSubs] = useState<SaasSubscription[]>([]);
  const [summary, setSummary] = useState<SaasSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [categoryFilter, setCategoryFilter] = useState("");

  const reload = async () => {
    setLoading(true);
    const [s, sum] = await Promise.all([
      listSaasSubscriptions(categoryFilter ? { category: categoryFilter } : {}),
      getSaasSummary(),
    ]);
    setSubs(s); setSummary(sum); setLoading(false);
  };

  useEffect(() => { reload(); }, [categoryFilter]); // eslint-disable-line

  const save = async () => {
    if (!form.name || !form.vendor || !form.monthly_cost_usd) return;
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name, vendor: form.vendor, category: form.category,
        monthly_cost_usd: parseFloat(form.monthly_cost_usd),
        seat_count: form.seat_count ? parseInt(form.seat_count) : null,
        owner: form.owner || null, notes: form.notes || null,
        renewal_date: form.renewal_date || null, status: "active",
      };
      const sub = await createSaasSubscription(data);
      setSubs((p) => [sub, ...p]); setOpen(false); setForm(BLANK);
      getSaasSummary().then(setSummary);
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    await deleteSaasSubscription(id);
    setSubs((p) => p.filter((s) => s.id !== id));
    getSaasSummary().then(setSummary);
  };

  const renewing30 = subs.filter((s) => {
    if (!s.renewal_date || s.status !== "active") return false;
    const days = (new Date(s.renewal_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-teal-500" /><h1 className="text-2xl font-bold text-gray-900">SaaS Spend Management</h1></div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Subscription</Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Monthly SaaS Spend", value: `$${summary.total_monthly_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
            { label: "Annual SaaS Spend", value: `$${summary.total_annual_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
            { label: "Active Subscriptions", value: String(summary.active_count) },
            { label: "Renewing Soon (90d)", value: String(summary.renewing_soon), color: summary.renewing_soon > 0 ? "text-yellow-600" : "text-gray-900" },
          ].map(({ label, value, color }) => (
            <Card key={label}><CardContent className="pt-4"><p className="text-xs text-gray-500">{label}</p><p className={`text-xl font-bold ${color ?? "text-gray-900"}`}>{value}</p></CardContent></Card>
          ))}
        </div>
      )}

      {renewing30.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Renewing within 30 days:</p>
              <p className="text-sm text-yellow-700">{renewing30.map((s) => `${s.name} (${s.renewal_date})`).join(" · ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Subscriptions ({subs.length})</CardTitle>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400 text-sm py-4">Loading…</p> : subs.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No subscriptions tracked yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Monthly</TableHead><TableHead>Annual</TableHead><TableHead>Seats</TableHead><TableHead>Renewal</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.vendor}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{s.category.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="font-semibold">${s.monthly_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-sm text-gray-500">${s.annual_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-sm">{s.seat_count ?? "—"}{s.cost_per_seat_usd && <span className="text-xs text-gray-400 ml-1">(${s.cost_per_seat_usd.toFixed(0)}/seat)</span>}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.renewal_date ?? "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.owner ?? "—"}</TableCell>
                    <TableCell><Badge variant={STATUS_V[s.status] ?? "outline"}>{s.status}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-500">✕</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add SaaS Subscription</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input placeholder="Datadog" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Vendor</Label><Input placeholder="Datadog Inc" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label><Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}</Select></div>
              <div><Label>Monthly Cost (USD)</Label><Input type="number" placeholder="500" value={form.monthly_cost_usd} onChange={(e) => setForm((f) => ({ ...f, monthly_cost_usd: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Seats (optional)</Label><Input type="number" placeholder="50" value={form.seat_count} onChange={(e) => setForm((f) => ({ ...f, seat_count: e.target.value }))} /></div>
              <div><Label>Owner (optional)</Label><Input placeholder="platform@company.com" value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} /></div>
            </div>
            <div><Label>Renewal Date (optional)</Label><Input type="date" value={form.renewal_date} onChange={(e) => setForm((f) => ({ ...f, renewal_date: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-1"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
