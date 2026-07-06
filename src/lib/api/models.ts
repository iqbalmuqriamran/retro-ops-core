export interface ModelRow {
  MODEL_ID: string;
  BRAND_ID: string;
  MODEL_NAME: string;
  MODEL_ACTIVE: number;
}

const API = "http://localhost/gadgetworld-api/models.php";

export async function fetchModels(brandId?: string): Promise<ModelRow[]> {
  const url = brandId ? `${API}?brand_id=${encodeURIComponent(brandId)}` : API;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function createModel(brandId: string, modelName: string) {
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ brand_id: brandId, model_name: modelName }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create model");
  return data as { success: true; MODEL_ID: string; existed: boolean };
}