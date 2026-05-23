"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import {
  listCloudAccounts, createCloudAccount, deleteCloudAccount,
  type CloudAccount,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PROVIDER_BADGE: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  gcp: "bg-blue-100 text-blue-700",
  azure: "bg-sky-100 text-sky-700",
  on_prem: "bg-gray-100 text-gray-700",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "secondary",
  error: "destructive",
};

export default function CloudAccountsPage() {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "aws", external_account_id: "" });

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await listCloudAccounts(100));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const connect = async () => {
    if (!form.name.trim() || !form.external_account_id.trim()) return;
    setSaving(true);
    try {
      const account = await createCloudAccount({
        name: form.name,
        provider: form.provider as CloudAccount["provider"],
        external_account_id: form.external_account_id,
        status: "active",
      });
      setAccounts((prev) => [account, ...prev]);
      setOpen(false);
      setForm({ name: "", provider: "aws", external_account_id: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to connect account");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this cloud account? Associated billing records will also be deleted.")) return;
    await deleteCloudAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cloud Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Connect Account
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{accounts.length} account{accounts.length !== 1 ? "s" : ""} connected</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400 py-4">Loading…</p>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 mb-3">No accounts connected yet.</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Connect your first account
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PROVIDER_BADGE[a.provider] ?? "bg-gray-100 text-gray-700"}`}>
                        {a.provider.toUpperCase().replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{a.external_account_id}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[a.status] ?? "outline"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(a.id)}>
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Connect dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Cloud Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Account Name</Label>
              <Input
                placeholder="e.g. Production AWS"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Cloud Provider</Label>
              <Select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              >
                <option value="aws">Amazon Web Services (AWS)</option>
                <option value="gcp">Google Cloud Platform (GCP)</option>
                <option value="azure">Microsoft Azure</option>
                <option value="on_prem">On-Premises</option>
              </Select>
            </div>
            <div>
              <Label>Account / Project ID</Label>
              <Input
                placeholder="e.g. 123456789012"
                value={form.external_account_id}
                onChange={(e) => setForm((f) => ({ ...f, external_account_id: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={connect} disabled={saving}>
                {saving ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
