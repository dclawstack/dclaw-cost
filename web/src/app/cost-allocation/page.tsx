"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { listAllocationRules, createAllocationRule, deleteAllocationRule, getShowback, type TagAllocation, type ShowbackReport } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = today.slice(0, 7) + "-01";

export default function CostAllocationPage() {
  const [rules, setRules] = useState<TagAllocation[]>([]);
  const [report, setReport] = useState<ShowbackReport | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tag_key: "", tag_value: "", team: "", project: "" });
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [saving, setSaving] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadRules = async () => setRules(await listAllocationRules());

  const loadReport = async () => {
    setLoadingReport(true);
    try { setReport(await getShowback(periodStart, periodEnd)); }
    catch { setReport(null); }
    finally { setLoadingReport(false); }
  };

  useEffect(() => { loadRules(); loadReport(); }, []); // eslint-disable-line

  const saveRule = async () => {
    if (!form.tag_key || !form.tag_value || !form.team) return;
    setSaving(true);
    try {
      const rule = await createAllocationRule({ tag_key: form.tag_key, tag_value: form.tag_value, team: form.team, project: form.project || undefined });
      setRules((p) => [...p, rule]);
      setOpen(false); setForm({ tag_key: "", tag_value: "", team: "", project: "" });
    } finally { setSaving(false); }
  };

  const deleteRule = async (id: string) => {
    await deleteAllocationRule(id);
    setRules((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900">Cost Allocation</h1>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
      </div>

      <Tabs defaultValue="showback">
        <TabsList>
          <TabsTrigger value="showback">Showback Report</TabsTrigger>
          <TabsTrigger value="rules">Allocation Rules ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="showback" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-3 items-end">
                <div><Label>Period Start</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
                <div><Label>Period End</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
                <Button onClick={loadReport} disabled={loadingReport}>{loadingReport ? "Loading…" : "Generate Report"}</Button>
              </div>
            </CardContent>
          </Card>

          {report && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Spend", value: `$${report.total_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  { label: "Allocated", value: `$${report.allocated_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${report.allocation_pct}%)` },
                  { label: "Unallocated", value: `$${report.unallocated_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                ].map(({ label, value }) => (
                  <Card key={label}><CardContent className="pt-4"><p className="text-xs text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></CardContent></Card>
                ))}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Team Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Team</TableHead><TableHead>Project</TableHead><TableHead>Records</TableHead><TableHead>Spend</TableHead><TableHead>% of Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {report.rows.map((row, i) => (
                        <TableRow key={i} className={row.team === "unallocated" ? "text-gray-400" : ""}>
                          <TableCell className="font-medium">{row.team}</TableCell>
                          <TableCell className="text-gray-500">{row.project ?? "—"}</TableCell>
                          <TableCell>{row.record_count}</TableCell>
                          <TableCell className="font-semibold">${row.total_spend_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${row.pct_of_total}%` }} /></div>
                              <span className="text-xs">{row.pct_of_total}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {rules.length === 0 ? <p className="text-sm text-gray-400 py-6 text-center">No allocation rules yet. Add rules to map tags to teams.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Tag Key</TableHead><TableHead>Tag Value</TableHead><TableHead>Team</TableHead><TableHead>Project</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {rules.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.tag_key}</TableCell>
                        <TableCell className="font-mono text-sm">{r.tag_value}</TableCell>
                        <TableCell className="font-medium">{r.team}</TableCell>
                        <TableCell className="text-gray-500">{r.project ?? "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Allocation Rule</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tag Key</Label><Input placeholder="env" value={form.tag_key} onChange={(e) => setForm((f) => ({ ...f, tag_key: e.target.value }))} /></div>
              <div><Label>Tag Value</Label><Input placeholder="production" value={form.tag_value} onChange={(e) => setForm((f) => ({ ...f, tag_value: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Team</Label><Input placeholder="Platform" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} /></div>
              <div><Label>Project (optional)</Label><Input placeholder="Infra" value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={saveRule} disabled={saving}>{saving ? "Saving…" : "Add Rule"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
