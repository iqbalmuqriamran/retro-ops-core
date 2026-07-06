export interface ModelRow {
  MODEL_ID: string;
  BRAND_ID: string;
  MODEL_NAME: string;
  MODEL_ACTIVE: number;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchModels(brandId?: string): Promise<ModelRow[]> {
  const url = brandId ? `${API_BASE}/models.php?brand_id=${encodeURIComponent(brandId)}` : `${API_BASE}/models.php`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function createModel(brandId: string, modelName: string) {
  const res = await fetch(`${API_BASE}/models.php`, { method: "POST", body: JSON.stringify({ brand_id: brandId, model_name: modelName }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create model");
  return data as { success: true; MODEL_ID: string; existed: boolean };
}