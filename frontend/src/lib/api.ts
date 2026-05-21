const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(`API error ${response.status}: ${error}`, response.status);
  }
  return response.json();
}

export const api = fetchJson;

// ── Types ────────────────────────────────────────────────────────────────────

export interface CloudAccount {
  id: string;
  name: string;
  provider: "aws" | "gcp" | "azure" | "on_prem";
  external_account_id: string;
  status: "active" | "inactive" | "error";
  created_at: string;
  updated_at: string;
}

export interface BillingRecord {
  id: string;
  cloud_account_id: string;
  resource_id: string;
  resource_type: string;
  service: string;
  region: string;
  cost_usd: number;
  usage_quantity: number;
  usage_unit: string;
  billing_period_start: string;
  billing_period_end: string;
  tags: Record<string, string> | null;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  amount_usd: number;
  period: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  scope: "account" | "service" | "tag" | "team";
  scope_value: string;
  alert_threshold_pct: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CostAlert {
  id: string;
  budget_id: string;
  alert_type: "threshold" | "anomaly" | "forecast";
  current_spend_usd: number;
  projected_spend_usd: number | null;
  message: string;
  severity: "info" | "warning" | "critical";
  acknowledged: boolean;
  created_at: string;
}

export interface ResourceRecommendation {
  id: string;
  cloud_account_id: string;
  resource_id: string;
  resource_type: string;
  recommendation_type: "right_size" | "reserved_instance" | "spot" | "delete" | "schedule";
  current_cost_usd: number;
  estimated_savings_usd: number;
  confidence: number;
  details: Record<string, unknown> | null;
  status: "open" | "applied" | "dismissed";
  created_at: string;
  updated_at: string;
}

export interface WasteItem {
  id: string;
  cloud_account_id: string;
  resource_id: string;
  resource_type: string;
  waste_type: "idle" | "orphaned" | "unused_ip" | "unattached_volume" | "old_snapshot";
  estimated_monthly_waste_usd: number;
  last_used_at: string | null;
  status: "open" | "remediated" | "ignored";
  created_at: string;
}

export interface TopService {
  service: string;
  cost_usd: number;
}

export interface BudgetUtilization {
  budget_id: string;
  name: string;
  amount_usd: number;
  spent_usd: number;
  used_pct: number;
}

export interface DashboardStats {
  total_monthly_spend: number;
  projected_monthly_spend: number;
  total_savings_opportunities: number;
  active_alerts_count: number;
  top_services: TopService[];
  budget_utilization: BudgetUtilization[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export const getHealth = () =>
  fetchJson<{ status: string }>("/health/");

// Cloud Accounts
export const listCloudAccounts = (limit = 20, offset = 0) =>
  fetchJson<CloudAccount[]>(`/api/v1/cloud-accounts/?limit=${limit}&offset=${offset}`);

export const getCloudAccount = (id: string) =>
  fetchJson<CloudAccount>(`/api/v1/cloud-accounts/${id}`);

export const createCloudAccount = (data: Omit<CloudAccount, "id" | "created_at" | "updated_at">) =>
  fetchJson<CloudAccount>("/api/v1/cloud-accounts/", { method: "POST", body: JSON.stringify(data) });

export const updateCloudAccount = (id: string, data: Partial<CloudAccount>) =>
  fetchJson<CloudAccount>(`/api/v1/cloud-accounts/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteCloudAccount = (id: string) =>
  fetchJson<void>(`/api/v1/cloud-accounts/${id}`, { method: "DELETE" });

// Billing Records
export const listBillingRecords = (params: {
  cloud_account_id?: string; service?: string; region?: string;
  start?: string; end?: string; limit?: number; offset?: number;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
  return fetchJson<BillingRecord[]>(`/api/v1/billing-records/?${q}`);
};

export const ingestBillingRecords = (records: Omit<BillingRecord, "id" | "created_at">[]) =>
  fetchJson<{ created: number }>("/api/v1/billing-records/ingest", {
    method: "POST",
    body: JSON.stringify({ records }),
  });

// Budgets
export const listBudgets = (limit = 20, offset = 0) =>
  fetchJson<Budget[]>(`/api/v1/budgets/?limit=${limit}&offset=${offset}`);

export const createBudget = (data: Omit<Budget, "id" | "created_at" | "updated_at">) =>
  fetchJson<Budget>("/api/v1/budgets/", { method: "POST", body: JSON.stringify(data) });

export const updateBudget = (id: string, data: Partial<Budget>) =>
  fetchJson<Budget>(`/api/v1/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteBudget = (id: string) =>
  fetchJson<void>(`/api/v1/budgets/${id}`, { method: "DELETE" });

// Cost Alerts
export const listCostAlerts = (params: {
  severity?: string; acknowledged?: boolean; budget_id?: string;
  limit?: number; offset?: number;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
  return fetchJson<CostAlert[]>(`/api/v1/cost-alerts/?${q}`);
};

export const acknowledgeAlert = (id: string) =>
  fetchJson<CostAlert>(`/api/v1/cost-alerts/${id}/acknowledge`, { method: "PUT" });

// Recommendations
export const listRecommendations = (params: {
  recommendation_type?: string; status?: string; cloud_account_id?: string;
  limit?: number; offset?: number;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
  return fetchJson<ResourceRecommendation[]>(`/api/v1/recommendations/?${q}`);
};

export const updateRecommendationStatus = (id: string, status: string) =>
  fetchJson<ResourceRecommendation>(`/api/v1/recommendations/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// Waste Items
export const listWasteItems = (params: {
  waste_type?: string; status?: string; cloud_account_id?: string;
  limit?: number; offset?: number;
} = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
  return fetchJson<WasteItem[]>(`/api/v1/waste-items/?${q}`);
};

export const updateWasteItemStatus = (id: string, status: string) =>
  fetchJson<WasteItem>(`/api/v1/waste-items/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// Dashboard
export const getDashboard = () =>
  fetchJson<DashboardStats>("/api/v1/dashboard/");

// ── P1 / P2 Types ────────────────────────────────────────────────────────────

export interface RIPlan {
  id: string; cloud_account_id: string;
  service: string; resource_type: string; commitment_type: string; term_years: number;
  monthly_on_demand_cost: number; monthly_ri_cost: number; upfront_cost: number;
  monthly_savings: number; annual_savings: number; break_even_months: number;
  discount_pct: number; status: string; created_at: string; updated_at: string;
}

export interface TagAllocation {
  id: string; tag_key: string; tag_value: string; team: string; project: string | null;
  created_at: string; updated_at: string;
}
export interface ShowbackRow { team: string; project: string | null; total_spend_usd: number; record_count: number; pct_of_total: number; }
export interface ShowbackReport { period_start: string; period_end: string; total_spend_usd: number; allocated_spend_usd: number; unallocated_spend_usd: number; allocation_pct: number; rows: ShowbackRow[]; }

export interface NamespaceSummary { namespace: string; cluster: string; total_cost_usd: number; cpu_cost_usd: number; memory_cost_usd: number; pod_count: number; avg_cost_per_pod: number; }
export interface ContainerCostRecord { id: string; cloud_account_id: string; cluster: string; namespace: string; pod_name: string | null; cpu_cores_requested: number; memory_gb_requested: number; cpu_cost_usd: number; memory_cost_usd: number; total_cost_usd: number; period_start: string; period_end: string; created_at: string; }

export interface SaasSubscription { id: string; name: string; vendor: string; category: string; monthly_cost_usd: number; annual_cost_usd: number; seat_count: number | null; cost_per_seat_usd: number | null; renewal_date: string | null; owner: string | null; status: string; notes: string | null; created_at: string; updated_at: string; }
export interface SaasSummary { total_monthly_usd: number; total_annual_usd: number; active_count: number; renewing_soon: number; by_category: Record<string, number>; }

export interface SpotStrategy { id: string; cloud_account_id: string; resource_id: string; resource_type: string; service: string; region: string; workload_type: string; current_monthly_cost: number; spot_monthly_cost: number; estimated_savings_usd: number; savings_pct: number; interruption_risk: string; recommendation: string; status: string; created_at: string; updated_at: string; }
export interface SpotStrategySummary { total_resources_analyzed: number; suitable_count: number; partial_count: number; not_suitable_count: number; total_potential_savings_usd: number; }

export interface CarbonRecord { id: string; cloud_account_id: string; service: string; region: string; estimated_kwh: number; carbon_intensity_gco2_kwh: number; co2_kg: number; cost_usd: number; period_start: string; period_end: string; created_at: string; }
export interface CarbonSummary { total_co2_kg: number; total_kwh: number; by_service: { service: string; co2_kg: number; kwh: number }[]; by_region: { region: string; co2_kg: number; avg_intensity: number }[]; greenest_region: string | null; dirtiest_region: string | null; green_region_suggestions: string[]; }

export interface MonthlyTrend { month: string; total_spend_usd: number; record_count: number; }
export interface UnitEconomic { name: string; description: string; value: number; unit: string; }
export interface FinOpsReport { generated_at: string; period_months: number; monthly_trends: MonthlyTrend[]; unit_economics: UnitEconomic[]; insights: string[]; }

// ── P1/P2 API functions ───────────────────────────────────────────────────────

// RI Plans
export const analyzeRIOpportunities = (accountId: string) =>
  fetchJson<{ plans_created: number; resources_analyzed: number }>(`/api/v1/ri-plans/analyze/${accountId}`, { method: "POST" });
export const listRIPlans = (accountId: string, status?: string) => {
  const q = status ? `?status=${status}` : "";
  return fetchJson<RIPlan[]>(`/api/v1/ri-plans/${accountId}${q}`);
};
export const updateRIPlanStatus = (planId: string, status: string) =>
  fetchJson<RIPlan>(`/api/v1/ri-plans/${planId}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// Enhanced waste scan
export const scanWaste = (accountId: string) =>
  fetchJson<{ resources_scanned: number; waste_items_created: number; by_type: Record<string, number> }>(`/api/v1/waste-scan/scan/${accountId}`, { method: "POST" });

// Cost Allocation
export const listAllocationRules = () => fetchJson<TagAllocation[]>("/api/v1/cost-allocation/rules");
export const createAllocationRule = (data: { tag_key: string; tag_value: string; team: string; project?: string }) =>
  fetchJson<TagAllocation>("/api/v1/cost-allocation/rules", { method: "POST", body: JSON.stringify(data) });
export const deleteAllocationRule = (id: string) =>
  fetchJson<void>(`/api/v1/cost-allocation/rules/${id}`, { method: "DELETE" });
export const getShowback = (periodStart: string, periodEnd: string) =>
  fetchJson<ShowbackReport>(`/api/v1/cost-allocation/showback?period_start=${periodStart}&period_end=${periodEnd}`);

// Container Costs
export const getNamespaceSummary = (accountId: string, periodStart: string, periodEnd: string) =>
  fetchJson<NamespaceSummary[]>(`/api/v1/container-costs/namespaces/${accountId}?period_start=${periodStart}&period_end=${periodEnd}`);
export const ingestContainerCosts = (records: Omit<ContainerCostRecord, "id" | "created_at">[]) =>
  fetchJson<{ created: number }>("/api/v1/container-costs/ingest", { method: "POST", body: JSON.stringify({ records }) });

// SaaS
export const listSaasSubscriptions = (params: { status?: string; category?: string } = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as [string, string][]);
  return fetchJson<SaasSubscription[]>(`/api/v1/saas/?${q}`);
};
export const getSaasSummary = () => fetchJson<SaasSummary>("/api/v1/saas/summary");
export const createSaasSubscription = (data: Record<string, unknown>) =>
  fetchJson<SaasSubscription>("/api/v1/saas/", { method: "POST", body: JSON.stringify(data) });
export const updateSaasSubscription = (id: string, data: Partial<SaasSubscription>) =>
  fetchJson<SaasSubscription>(`/api/v1/saas/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSaasSubscription = (id: string) =>
  fetchJson<void>(`/api/v1/saas/${id}`, { method: "DELETE" });

// Spot Strategy
export const analyzeSpotOpportunities = (accountId: string) =>
  fetchJson<{ resources_analyzed: number; strategies_created: number }>(`/api/v1/spot-strategy/analyze/${accountId}`, { method: "POST" });
export const listSpotStrategies = (accountId: string, status?: string) => {
  const q = status ? `?status=${status}` : "";
  return fetchJson<SpotStrategy[]>(`/api/v1/spot-strategy/${accountId}${q}`);
};
export const getSpotSummary = (accountId: string) =>
  fetchJson<SpotStrategySummary>(`/api/v1/spot-strategy/${accountId}/summary`);
export const updateSpotStatus = (id: string, status: string) =>
  fetchJson<SpotStrategy>(`/api/v1/spot-strategy/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// Carbon
export const calculateCarbon = (accountId: string) =>
  fetchJson<{ records_created: number }>(`/api/v1/carbon/calculate/${accountId}`, { method: "POST" });
export const getCarbonSummary = (accountId: string) =>
  fetchJson<CarbonSummary>(`/api/v1/carbon/${accountId}/summary`);

// FinOps Reports
export const getFinOpsReport = (months = 12) =>
  fetchJson<FinOpsReport>(`/api/v1/reports/finops?months=${months}`);

// Copilot
export interface CopilotMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const getCopilotHistory = (sessionId: string) =>
  fetchJson<CopilotMessage[]>(`/api/v1/copilot/history/${sessionId}`);
