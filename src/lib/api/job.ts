export interface JobRow {
  JOB_ID: string;
  TICKET_ID: string;
  STAFF_ID: string;
  JOB_STARTDATE: string | null;
  JOB_FINISHDATE: string | null;
  JOB_DIAGNOSIS: string | null;
  JOB_ACTION: string | null;
  JOB_STATUS: string;
  JOB_TOTALLABORCOST: number;
  JOB_TOTALCOST: number;
  JOB_NOTES: string | null;
  PARTS_TOTAL: number;
  SERVICES_TOTAL: number;
}

export const JOB_STATUSES = ["Pending", "In Progress", "Completed", "Failed", "Cancelled"];

const API = "http://localhost/gadgetworld-api/jobs.php";

export async function fetchJobs(): Promise<JobRow[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function createJob(payload: { ticket_id: string; staff_id: string }) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to open job");
  return data as { success: true; JOB_ID: string };
}

export async function updateJob(id: string, payload: {
  staff_id: string;
  diagnosis: string;
  action: string;
  status: string;
}) {
  const res = await fetch(API, { method: "PUT", body: JSON.stringify({ id, ...payload }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update job");
  return data;
}

export async function closeJob(id: string) {
  const res = await fetch(`${API}?action=close`, { method: "PUT", body: JSON.stringify({ id }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to close job");
  return data as { success: true; total: number };
}