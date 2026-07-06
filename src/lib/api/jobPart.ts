export interface JobPartRow {
  JOB_PART_ID: string;
  JOB_ID: string;
  PART_ID: string;
  JOB_PART_QUANTITYUSED: number;
  JOB_PART_PRICEPERUNIT: number;
  JOB_PART_TOTALPARTPRICE: number;
  JOB_PART_NOTES: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchJobParts(jobId: string): Promise<JobPartRow[]> {
  const res = await fetch(`${API_BASE}/job_parts.php?job_id=${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error("Failed to fetch job parts");
  return res.json();
}

export async function addJobPart(jobId: string, partId: string, qty: number) {
  const res = await fetch(`${API_BASE}/job_parts.php`, { method: "POST", body: JSON.stringify({ job_id: jobId, part_id: partId, qty }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to link part");
  return data;
}

export async function updateJobPartQty(jobPartId: string, qty: number) {
  const res = await fetch(`${API_BASE}/job_parts.php`, { method: "PUT", body: JSON.stringify({ id: jobPartId, qty }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to update part qty");
  return data;
}

export async function removeJobPart(jobPartId: string) {
  const res = await fetch(`${API_BASE}/job_parts.php?id=${encodeURIComponent(jobPartId)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to remove part");
  return data;
}