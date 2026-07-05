export interface InvoiceRow {
  INVOICE_ID: string;
  JOB_ID: string;
  INVOICE_DATE: string;
  INVOICE_SUBTOTAL: number;
  INVOICE_DISCOUNT: number | null;
  INVOICE_TAX: number;
  INVOICE_TOTALAMOUNT: number;
  INVOICE_STATUS: string;
  INVOICE_NOTES: string | null;

  CUST_ID: string;
  CUST_FNAME: string;
  CUST_LNAME: string;
  CUST_PHONENUMBER: string;

  DEVICE_BRAND: string;
  DEVICE_MODEL: string;

  TICKET_ID: string;
  TICKET_ISSUE: string;

  JOB_DIAGNOSIS: string | null;
  JOB_ACTION: string | null;
  JOB_TOTALLABORCOST: number;
  PARTS_TOTAL: number;
  SERVICES_TOTAL: number;
}

export interface PaymentInfo {
  PAYMENT_ID: string;
  INVOICE_ID: string;
  STAFF_ID: string;
  STAFF_FNAME: string;
  STAFF_LNAME: string;
  PAYMENT_DATE: string;
  PAYMENT_TOTALPAID: number;
  PAYMENT_METHOD: string;
  PAYMENT_STATUS: string;
  RECEIPT_ID: string | null;
  RECEIPT_NUMBER: string | null;
  RECEIPT_DATE: string | null;
  RECEIPT_CHANGEAMOUNT: number | null;
}

export interface StaffRow {
  STAFF_ID: string;
  STAFF_FNAME: string;
  STAFF_LNAME: string;
  STAFF_ROLE: string;
}

export const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Online Transfer",
  "DuitNow QR",
  "Touch N Go",
  "Boost",
] as const;

const INVOICE_API = "http://localhost/gadgetworld-api/invoice.php";
const PAYMENT_API = "http://localhost/gadgetworld-api/payment.php";
const STAFF_API = "http://localhost/gadgetworld-api/staff.php";

export async function fetchInvoices(): Promise<InvoiceRow[]> {
  const res = await fetch(INVOICE_API);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function fetchStaffList(): Promise<StaffRow[]> {
  const res = await fetch(STAFF_API);
  if (!res.ok) throw new Error("Failed to fetch staff");
  return res.json();
}

export async function fetchPaymentInfo(invoiceId: string): Promise<PaymentInfo | null> {
  const res = await fetch(`${PAYMENT_API}?invoice_id=${encodeURIComponent(invoiceId)}`);
  if (!res.ok) throw new Error("Failed to fetch payment info");
  return res.json();
}

export async function settleInvoice(invoiceId: string, staffId: string, method: string) {
  const res = await fetch(PAYMENT_API, {
    method: "POST",
    body: JSON.stringify({ invoice_id: invoiceId, staff_id: staffId, method }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to settle invoice");
  return data as { success: true; PAYMENT_ID: string; RECEIPT_ID: string; RECEIPT_NUMBER: string; total: number };
}
