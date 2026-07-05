export interface JobServiceRow {
  JOB_SERVICE_ID: string;
  JOB_ID: string;
  SERVICE_ID: string;
}

const API = "http://localhost/gadgetworld-api/job_services.php";

export async function fetchJobServices(jobId: string): Promise<JobServiceRow[]> {
  const res = await fetch(`${API}?job_id=${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error("Failed to fetch job services");
  return res.json();
}

// Replaces whatever service is linked to this job with serviceId (or clears it if null)
export async function setJobService(jobId: string, serviceId: string | null) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ job_id: jobId, service_id: serviceId }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to set service");
  return data;
}