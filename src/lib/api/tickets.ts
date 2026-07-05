export interface TicketRow {
  TICKET_ID: string;
  DEVICE_ID: string;
  CUST_ID: string;
  TICKET_DATE: string;
  TICKET_ISSUE: string;
  TICKET_PRIORITYLEVEL: string;
  TICKET_STATUS: string;
  TICKET_ESTIMATEDCOST: number | null;
  TICKET_ESTIMATEDCOMPLETETIME: string | null;
  TICKET_NOTES: string | null;
}

export const TICKET_PRIORITIES = ["Low", "Normal", "High", "Urgent"];
export const TICKET_STATUSES = ["Pending", "Approved", "In Progress", "Completed", "Cancelled", "On Hold"];

const API = "http://localhost/gadgetworld-api/tickets.php";

export async function fetchTickets(): Promise<TicketRow[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function createTicket(payload: {
  device_id: string;
  cust_id: string;
  issue: string;
  priority: string;
  estimatedcost?: string;
  estimatedcompletetime?: string;
  notes?: string;
}) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create ticket");
  return data as { success: true; TICKET_ID: string };
}

export async function updateTicket(id: string, payload: {
  device_id: string;
  cust_id: string;
  issue: string;
  priority: string;
  status: string;
  estimatedcost?: string;
  estimatedcompletetime?: string;
  notes?: string;
}) {
  const res = await fetch(API, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update ticket");
  return data;
}

export async function deleteTicketApi(id: string) {
  const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to delete ticket");
  return data;
}