export interface PartRow {
  PART_ID: string;
  SUPPLIER_ID: string;
  PART_NAME: string;
  PART_CATEGORY: string;
  PART_COMPATIBLEDEVICE: string | null;
  PART_BRAND: string | null;
  PART_STOCK: number;
  PART_UNITPRICE: number;
  PART_STATUS: string;
  PART_RESTOCKDATE: string | null;
  PART_NOTES: string | null;
  SUPPLIER_NAME: string;
}

export interface SupplierRow {
  SUPPLIER_ID: string;
  SUPPLIER_NAME: string;
  SUPPLIER_CONTACTPERSONFNAME: string | null;
  SUPPLIER_CONTACTPERSONLNAME: string | null;
  SUPPLIER_PHONENUMBER: string;
  SUPPLIER_EMAIL: string | null;
  SUPPLIER_ADDRESS: string | null;
  SUPPLIER_CITY: string | null;
  SUPPLIER_POSTCODE: string | null;
  SUPPLIER_STATE: string | null;
  SUPPLIER_STATUS: string;
  SUPPLIER_NOTES: string | null;
}

export const PART_CATEGORIES = [
  "Screen",
  "Battery",
  "Charging Port",
  "Camera Module",
  "Speaker",
  "Motherboard",
  "Back Cover",
  "Button",
  "SIM Tray",
  "Other",
] as const;

export const SUPPLIER_STATUSES = ["Active", "Inactive", "Blacklisted"] as const;

const API_BASE = import.meta.env.VITE_API_BASE;



export async function fetchParts(): Promise<PartRow[]> {
  const res = await fetch(`${API_BASE}/part.php`);
  if (!res.ok) throw new Error("Failed to fetch parts");
  return res.json();
}

export interface PartPayload {
  supplier_id: string;
  name: string;
  category: string;
  compatible: string;
  brand: string;
  stock: number;
  price: number;
  notes: string;
}

export async function createPart(payload: PartPayload) {
  const res = await fetch(`${API_BASE}/part.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create part");
  return data as { success: true; PART_ID: string };
}

export async function updatePart(id: string, payload: PartPayload) {
  const res = await fetch(`${API_BASE}/part.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update part");
  return data;
}

export async function deletePartApi(id: string) {
  const res = await fetch(`${API_BASE}/part.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete part");
  return data;
}

export async function fetchSuppliers(): Promise<SupplierRow[]> {
  const res = await fetch(`${API_BASE}/supplier.php`);
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
}

export interface SupplierPayload {
  name: string;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  state: string;
  status: string;
  notes: string;
}

export async function createSupplier(payload: SupplierPayload) {
  const res = await fetch(`${API_BASE}/supplier.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create supplier");
  return data as { success: true; SUPPLIER_ID: string };
}

export async function updateSupplier(id: string, payload: SupplierPayload) {
  const res = await fetch(`${API_BASE}/supplier.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update supplier");
  return data;
}

export async function deleteSupplierApi(id: string) {
  const res = await fetch(`${API_BASE}/supplier.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete supplier");
  return data;
}