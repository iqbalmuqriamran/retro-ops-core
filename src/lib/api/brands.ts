export interface BrandRow {
  BRAND_ID: string;
  BRAND_NAME: string;
  BRAND_ACTIVE: number;
}

const API_BASE = import.meta.env.VITE_API_BASE;

export async function fetchBrands(): Promise<BrandRow[]> {
  const res = await fetch(`${API_BASE}/brands.php`);
  if (!res.ok) throw new Error("Failed to fetch brands");
  return res.json();
}

export async function createBrand(brandName: string) {
  const res = await fetch(`${API_BASE}/brands.php`, { method: "POST", body: JSON.stringify({ brand_name: brandName }) });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to create brand");
  return data as { success: true; BRAND_ID: string; existed: boolean };
}