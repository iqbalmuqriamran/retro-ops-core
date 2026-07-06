export interface ServiceRow {
  SERVICE_ID: string;
  SERVICE_NAME: string;
  SERVICE_CATEGORY: string;
  SERVICE_DESCRIPTION: string | null;
  SERVICE_BASEPRICE: number;
  SERVICE_ESTIMATEDDURATION: number | null;
  SERVICE_WARRANTYDAYS: number;
  SERVICE_STATUS: string;
}

export const SERVICE_CATEGORIES = [
  "Screen Repair",
  "Battery Replacement",
  "Software Fix",
  "Water Damage",
  "Camera Repair",
  "Charging Port",
  "Speaker Repair",
  "Data Recovery",
  "General Repair",
  "Other",
] as const;

export const SERVICE_STATUSES = ["Active", "Inactive", "Discontinued"] as const;

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchServices(): Promise<ServiceRow[]> {
  const res = await fetch(`${API_BASE}/service.php`);
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
}

export interface ServicePayload {
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  warranty: number;
}

export async function createService(payload: ServicePayload) {
  const res = await fetch(`${API_BASE}/service.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create service");
  return data as { success: true; SERVICE_ID: string };
}

export async function updateService(id: string, payload: ServicePayload & { status: string }) {
  const res = await fetch(`${API_BASE}/service.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update service");
  return data;
}

export async function deleteServiceApi(id: string) {
  const res = await fetch(`${API_BASE}/service.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete service");
  return data;
}