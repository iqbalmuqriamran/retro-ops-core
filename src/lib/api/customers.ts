export interface CustomerRow {
  CUST_ID: string;
  CUST_FNAME: string;
  CUST_LNAME: string;
  CUST_PHONENUMBER: string;
  CUST_EMAIL: string;
  CUST_REGISTRATIONDATE: string;
  CUST_NOTES: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchCustomers(): Promise<CustomerRow[]> {
  const res = await fetch(`${API_BASE}/customers.php`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function createCustomer(payload: { fname: string; lname: string; phone: string; email: string; notes: string; }) {
  const res = await fetch(`${API_BASE}/customers.php`, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create customer");
  return data as { success: true; CUST_ID: string };
}

export async function updateCustomer(id: string, payload: { fname: string; lname: string; phone: string; email: string; notes: string; }) {
  const res = await fetch(`${API_BASE}/customers.php`, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update customer");
  return data;
}

export async function deleteCustomerApi(id: string) {
  const res = await fetch(`${API_BASE}/customers.php?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete customer");
  return data;
}