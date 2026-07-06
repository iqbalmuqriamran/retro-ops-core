export interface StaffRow {
  STAFF_ID: string;
  STAFF_FNAME: string;
  STAFF_LNAME: string;
  STAFF_PHONENUMBER: string;
  STAFF_EMAIL: string | null;
  STAFF_ROLE: string;
  STAFF_HIREDATE: string;
  STAFF_SALARY: number;
  STAFF_OVERTIMERATE: number;
  STAFF_MONTHLYBONUS: number;
  STAFF_BANKNAME: string | null;
  STAFF_BANKACCOUNTNUMBER: string | null;
  STAFF_ADDRESS: string | null;
  STAFF_CITY: string | null;
  STAFF_POSTCODE: string | null;
  STAFF_STATE: string | null;
  STAFF_EMERGENCYCONTACTNAME: string | null;
  STAFF_EMERGENCYCONTACTNUMBER: string | null;
  STAFF_STATUS: string;
  STAFF_NOTES: string | null;
}

export const STAFF_ROLES = ["Owner", "Branch Manager", "Technician", "Senior Staff", "Cashier"] as const;
export const STAFF_STATUSES = ["Active", "Inactive", "Resigned", "On Leave"] as const;

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchStaff(): Promise<StaffRow[]> {
  const res = await fetch(`${API_BASE}/staff.php`);
  if (!res.ok) throw new Error("Failed to fetch staff");
  return res.json();
}

export interface StaffPayload {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  role: string;
  hiredate: string; // YYYY-MM-DD
  salary: number;
  overtime: number;
  bonus: number;
  bankname: string;
  bankacc: string;
  address: string;
  city: string;
  postcode: string;
  state: string;
  ecname: string;
  ecnumber: string;
  notes: string;
}

export async function createStaff(payload: StaffPayload) {
  const res = await fetch(`${API_BASE}/staff.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create staff");
  return data as { success: true; STAFF_ID: string };
}

export async function updateStaff(id: string, payload: StaffPayload & { status: string }) {
  const res = await fetch(`${API_BASE}/staff.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update staff");
  return data;
}

export async function deleteStaffApi(id: string) {
  const res = await fetch(`${API_BASE}/staff.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete staff");
  return data;
}