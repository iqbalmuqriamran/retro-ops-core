export interface PartRow {
  PART_ID: string;
  SUPPLIER_ID: string;
  PART_NAME: string;
  PART_CATEGORY: string;
  PART_COMPATIBLEDEVICE: string | null;
  PART_BRAND: string | null;
  PART_STOCK: number;
  PART_UNITPRICE: number;
  PART_STATUS: string;
  PART_RESTOCKDATE: string | null;
  PART_NOTES: string | null;
}

const API = "http://localhost/gadgetworld-api/part.php";

export async function fetchParts(): Promise<PartRow[]> {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Failed to fetch parts");
  return res.json();
}