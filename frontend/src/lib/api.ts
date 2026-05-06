export interface CostReport {
  id: string;
  account_id: string;
  monthly_spend: number;
  top_services: string[];
  savings_opportunities: string[];
  anomaly_alerts: string[];
  created_at: string;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `/api/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}
