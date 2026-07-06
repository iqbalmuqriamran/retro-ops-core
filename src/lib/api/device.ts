export interface DeviceRow {
  DEVICE_ID: string;
  CUST_ID: string;
  DEVICE_BRAND: string;
  DEVICE_MODEL: string;
  DEVICE_MODELYEAR: string;
  DEVICE_TYPE: string;
  DEVICE_SERIALNUMBER: string;
  DEVICE_CONDITION: string;
  DEVICE_ISSUE: string;
  DEVICE_NOTES: string | null;
}

export const DEVICE_TYPES = [
  "Smartphone",
  "Tablet",
  "Laptop",
  "Smartwatch",
  "Console",
  "Camera",
  "Earphone",
  "Other",
] as const;

export const DEVICE_CONDITIONS_DB = ["Excellent", "Good", "Fair", "Poor", "Damaged"] as const;

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchDevices(custId?: string): Promise<DeviceRow[]> {
  const url = custId ? `${API_BASE}/device.php?cust_id=${encodeURIComponent(custId)}` : `${API_BASE}/device.php`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch devices");
  return res.json();
}

export interface DevicePayload {
  cust_id: string;
  brand: string;
  model: string;
  modelyear: string;
  type: string;
  serial: string;
  condition: string;
  issue: string;
  notes: string;
}

export async function createDevice(payload: DevicePayload) {
  const res = await fetch(`${API_BASE}/device.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create device");
  return data as { success: true; DEVICE_ID: string };
}

export async function updateDevice(id: string, payload: Omit<DevicePayload, "cust_id">) {
  const res = await fetch(`${API_BASE}/device.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update device");
  return data;
}

export async function deleteDeviceApi(id: string) {
  const res = await fetch(`${API_BASE}/device.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete device");
  return data;
}
