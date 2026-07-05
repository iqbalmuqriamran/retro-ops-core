export interface MonthlyRevenuePoint {
  MONTH_LABEL: string;
  SORT_KEY: string;
  NET_REVENUE: number;
}

export interface ServiceRevenuePoint {
  SERVICE_NAME: string;
  TOTAL_SERVICE_VALUE: number;
}

export interface DashboardStats {
  activeJobs: number;
  pendingTickets: number;
  lowStockParts: number;
  revenueSettled: number;
  unpaidInvoices: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  serviceBreakdown: ServiceRevenuePoint[];
}

const API = "http://localhost/gadgetworld-api/dashboard.php";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}