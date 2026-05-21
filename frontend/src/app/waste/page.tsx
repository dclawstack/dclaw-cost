"use client";

import { useEffect, useState } from "react";
import { Trash2, ScanLine } from "lucide-react";
import { listCloudAccounts, scanWaste, listWasteItems, updateWasteItemStatus, type CloudAccount, type WasteItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const WASTE_LABELS: Record<string, string> = {
  idle: "Idle", orphaned: "Orphaned", unused_ip: "Unused IP",
  unattached_volume: "Unattached Volume", old_snapshot: "Old Snapshot",
};
const WASTE_COLOR: Record<string, string> = {
  idle: "bg-yellow-100 text-yellow-700", orphaned: "bg-red-100 text-red-700",
  unused_ip: "bg-orange-100 text-orange-700", unattached_volume: "bg-purple-100 text-purple-700",
  old_snapshot: "bg-gray-100 text-gray-700",
};

export default function WastePage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [items, setItems] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ resources_scanned: number; waste_items_created: number; by_type: Record<string, number> } | null>(null);

  useEffect(() => { listCloudAccounts(100).then(setAccounts).catch(() => {}); }, []);

  const load = async (acct = accountId) => {
    if (!acct) { setItems(await listWasteItems({ limit: 200 })); return; }
    setLoading(true);
    try { setItems(await listWasteItems({ cloud_account_id: acct, limit: 200 })); }
    finally { setLoading(false); }
  };

  const scan = async () => {
    if (!accountId) { alert("Select an account to scan."); return; }
    setScanning(true);
    try {
      const res = await scanWaste(accountId);
      setLastScan(res);
      load();
    } catch (e) { alert(e instanceof Error ? e.message : "Scan failed"); }
    finally { setScanning(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    const updated = await updateWasteItemStatus(id, status);
    setItems((p) => p.map((w) => (w.id === id ? updated : w)));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const open = items.filter((i) => i.status === "open");
  const totalWaste = open.reduce((s, i) => s + i.estimated_monthly_waste_usd, 0);
  const byType = open.reduce<Record<string, number>>((acc, i) => {
    acc[i.waste_type] = (acc[i.waste_type] || 0) + 1; return acc;
  }, {});

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="h-6 w-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Waste Detection</h1>
        </div>
        <div className="flex gap-2">
          <Select value={accountId} onChange={(e) => { setAccountId(e.target.value); load(e.target.value); }}>
            <option value="">All Accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Button onClick={scan} disabled={scanning || !accountId} variant="outline">
            <ScanLine className="h-4 w-4 mr-2" />{scanning ? "Scanning…" : "Deep Scan"}
          </Button>
        </div>
      </div>

      {lastScan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 text-sm text-blue-700">
            Last scan: {lastScan.resources_scanned} resources analyzed,{" "}
            {lastScan.waste_items_created} new waste items found.{" "}
            {Object.entries(lastScan.by_type).map(([t, n]) => `${n} ${WASTE_LABELS[t] ?? t}`).join(", ")}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Total Monthly Waste</p>
            <p className="text-xl font-bold text-red-500">${totalWaste.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        {Object.entries(byType).map(([type, count]) => (
          <Card key={type}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500">{WASTE_LABELS[type] ?? type}</p>
              <p className="text-xl font-bold text-gray-800">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Open Waste Items ({open.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-gray-400 text-sm py-4">Loading…</p> :
            items.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">
                No waste items found. Select an account and run a Deep Scan.
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
                  {items.map((w) => (
                    <TableRow key={w.id} className={w.status !== "open" ? "opacity-40" : ""}>
                      <TableCell>
                        <div className="font-mono text-xs">{w.resource_id}</div>
                        <div className="text-xs text-gray-400">{w.resource_type}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${WASTE_COLOR[w.waste_type] ?? "bg-gray-100 text-gray-700"}`}>
                          {WASTE_LABELS[w.waste_type] ?? w.waste_type}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-red-500">
                        ${w.estimated_monthly_waste_usd.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {w.last_used_at ? new Date(w.last_used_at).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell><Badge variant={w.status === "open" ? "default" : "secondary"}>{w.status}</Badge></TableCell>
                      <TableCell>
                        {w.status === "open" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => updateStatus(w.id, "remediated")} title="Mark remediated">✓</Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(w.id, "ignored")} title="Ignore">✕</Button>
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
