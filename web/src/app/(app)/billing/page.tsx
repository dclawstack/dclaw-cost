"use client";

import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import {
  listBillingRecords, listCloudAccounts,
  type BillingRecord, type CloudAccount,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 25;

export default function BillingPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [accountId, setAccountId] = useState("");
  const [service, setService] = useState("");
  const [region, setRegion] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    listCloudAccounts(100).then(setAccounts).catch(() => {});
  }, []);

  const load = useCallback(async (newOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: String(PAGE_SIZE + 1), offset: String(newOffset) };
      if (accountId) params.cloud_account_id = accountId;
      if (service) params.service = service;
      if (region) params.region = region;
      if (start) params.start = start;
      if (end) params.end = end;
      const data = await listBillingRecords(params as Parameters<typeof listBillingRecords>[0]);
      setHasMore(data.length > PAGE_SIZE);
      setRecords(data.slice(0, PAGE_SIZE));
      setOffset(newOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [accountId, service, region, start, end]);

  useEffect(() => { load(0); }, [load]);

  const totalSpend = records.reduce((s, r) => s + r.cost_usd, 0);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Cost Explorer</h1>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">All Accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
            <Input
              placeholder="Service (e.g. EC2)"
              value={service}
              onChange={(e) => setService(e.target.value)}
            />
            <Input
              placeholder="Region (e.g. us-east-1)"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              title="Period start"
            />
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              title="Period end"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={() => load(0)}>
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAccountId(""); setService(""); setRegion(""); setStart(""); setEnd("");
              }}
            >
              Clear
            </Button>
            {!loading && (
              <span className="ml-auto text-sm text-gray-500">
                Showing {records.length} record{records.length !== 1 ? "s" : ""} ·{" "}
                <span className="font-semibold text-gray-800">
                  ${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 2 })} total
                </span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400 py-6">Loading…</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No billing records found. Use the ingest endpoint to import cloud bills.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Cost (USD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-mono text-xs text-gray-700">{r.resource_id}</div>
                        <div className="text-xs text-gray-400">{r.resource_type}</div>
                      </TableCell>
                      <TableCell className="font-medium">{r.service}</TableCell>
                      <TableCell className="text-sm text-gray-500">{r.region}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {r.billing_period_start} → {r.billing_period_end}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {r.usage_quantity.toLocaleString()} {r.usage_unit}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        ${r.cost_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={offset === 0}
                  onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
                <Button variant="outline" disabled={!hasMore} onClick={() => load(offset + PAGE_SIZE)}>
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
