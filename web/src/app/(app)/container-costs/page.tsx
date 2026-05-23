"use client";

import { useEffect, useState } from "react";
import { Container } from "lucide-react";
import { listCloudAccounts, getNamespaceSummary, type CloudAccount, type NamespaceSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const today = new Date().toISOString().split("T")[0];
const firstOfMonth = today.slice(0, 7) + "-01";

export default function ContainerCostsPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [namespaces, setNamespaces] = useState<NamespaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(today);

  useEffect(() => { listCloudAccounts(100).then(setAccounts).catch(() => {}); }, []);

  const load = async () => {
    if (!accountId) return;
    setLoading(true);
    try { setNamespaces(await getNamespaceSummary(accountId, periodStart, periodEnd)); }
    catch { setNamespaces([]); }
    finally { setLoading(false); }
  };

  const totalCost = namespaces.reduce((s, n) => s + n.total_cost_usd, 0);
  const maxCost = namespaces[0]?.total_cost_usd ?? 1;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Container className="h-6 w-6 text-cyan-500" />
        <h1 className="text-2xl font-bold text-gray-900">Container Cost Analysis</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label>Account</Label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Select Account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
            <div><Label>Period Start</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
            <div><Label>Period End</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
            <Button onClick={load} disabled={loading || !accountId}>{loading ? "Loading…" : "Load"}</Button>
          </div>
        </CardContent>
      </Card>

      {namespaces.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4"><p className="text-xs text-gray-500">Total Cost</p><p className="text-2xl font-bold">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-gray-500">Namespaces</p><p className="text-2xl font-bold">{namespaces.length}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-xs text-gray-500">Total Pods</p><p className="text-2xl font-bold">{namespaces.reduce((s, n) => s + n.pod_count, 0)}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Namespace Breakdown</CardTitle></CardHeader>
        <CardContent>
          {!accountId ? (
            <p className="text-sm text-gray-400 py-6 text-center">Select an account and date range to view namespace costs.</p>
          ) : loading ? (
            <p className="text-sm text-gray-400 py-6">Loading…</p>
          ) : namespaces.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No data. Use <code className="bg-gray-100 px-1 rounded">POST /api/v1/container-costs/ingest</code> to import K8s cost data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>CPU Cost</TableHead>
                  <TableHead>Memory Cost</TableHead>
                  <TableHead>Pods</TableHead>
                  <TableHead>Cost/Pod</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {namespaces.map((n, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium font-mono text-sm">{n.namespace}</TableCell>
                    <TableCell className="text-sm text-gray-500">{n.cluster}</TableCell>
                    <TableCell className="font-semibold">${n.total_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm">${n.cpu_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-sm">${n.memory_cost_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{n.pod_count}</TableCell>
                    <TableCell className="text-sm text-gray-500">${n.avg_cost_per_pod.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${(n.total_cost_usd / maxCost) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{((n.total_cost_usd / totalCost) * 100).toFixed(1)}%</span>
                      </div>
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
