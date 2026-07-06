export interface JobServiceRow {
  JOB_SERVICE_ID: string;
  JOB_ID: string;
  SERVICE_ID: string;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchJobServices(jobId: string): Promise<JobServiceRow[]> {
  const res = await fetch(`${API_BASE}/job_services.php?job_id=${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error("Failed to fetch job services");
  return res.json();
}

// Replaces whatever service is linked to this job with serviceId (or clears it if null)
export async function setJobService(jobId: string, serviceId: string | null) {
  const res = await fetch(`${API_BASE}/job_services.php`, { method: "POST", body: JSON.stringify({ job_id: jobId, service_id: serviceId }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to set service");
  return data;
}