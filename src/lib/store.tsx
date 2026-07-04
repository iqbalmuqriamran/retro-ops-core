import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Owner" | "Branch Manager" | "Cashier" | "Technician";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export const PRESET_USERS: User[] = [
  { id: "u1", name: "Mohd Kamarulhelmy", email: "owner@gw666.my", role: "Owner" },
  { id: "u2", name: "Putera Danial Isaac", email: "manager@gw666.my", role: "Branch Manager" },
  { id: "u3", name: "Aisyah Rahman", email: "cashier@gw666.my", role: "Cashier" },
  { id: "u4", name: "Hafiz Tan", email: "tech@gw666.my", role: "Technician" },
];

export const DEVICE_CONDITIONS = ["Good", "Used - Minor Issues", "Damaged"] as const;
export type DeviceCondition = typeof DEVICE_CONDITIONS[number];

export interface Customer { id: string; name: string; phone: string; email: string; address: string; createdAt: string; }
export interface Device { id: string; customerId: string; brand: string; model: string; serial: string; condition: DeviceCondition; issue: string; }
export interface Ticket {
  id: string; customerId: string; deviceId: string; issue: string;
  priority: "Normal" | "High";
  status: "Open" | "Diagnosing" | "Approved" | "Completed";
  createdAt: string; assignedTo?: string;
}
export interface JobPartLine { partId: string; qty: number; }
export interface Job {
  id: string; ticketId: string; diagnosis: string; actions: string[];
  assignedTo: string; serviceId: string; partLines: JobPartLine[];
  status: "In Progress" | "Awaiting Parts" | "Completed";
}
export interface Part { id: string; name: string; sku: string; stock: number; lowStock: number; price: number; compatibility: string; supplierId: string; }
export interface Supplier { id: string; name: string; contact: string; phone: string; email: string; }
export interface Service { id: string; name: string; basePrice: number; durationHrs: number; warrantyDays: number; description: string; }
export interface Invoice {
  id: string; jobId: string; customerId: string; subtotal: number; tax: number; total: number;
  status: "Unpaid" | "Paid"; method?: "Cash" | "Card" | "E-Wallet"; createdAt: string; paidAt?: string;
}
export interface Staff {
  id: string; name: string; email: string; role: Role; phone: string;
  joinedAt: string; salary: number; ic: string;
}

const seedCustomers: Customer[] = [
  { id: "c1", name: "Nurul Aiman", phone: "012-3456789", email: "nurul@mail.my", address: "Seksyen 7, Shah Alam", createdAt: "2025-06-01" },
  { id: "c2", name: "Lim Wei Jie", phone: "017-8889991", email: "weijie@mail.my", address: "Seksyen 13, Shah Alam", createdAt: "2025-06-10" },
  { id: "c3", name: "Ravi Kumar", phone: "019-4441122", email: "ravi@mail.my", address: "Setia Alam", createdAt: "2025-06-15" },
  { id: "c4", name: "Siti Hajar", phone: "013-7770001", email: "siti@mail.my", address: "Subang Jaya", createdAt: "2025-06-18" },
];
const seedDevices: Device[] = [
  { id: "d1", customerId: "c1", brand: "iPhone", model: "13 Pro", serial: "F2LXQ19PMN", condition: "Damaged", issue: "Screen replacement" },
  { id: "d2", customerId: "c2", brand: "Samsung", model: "S22 Ultra", serial: "R58N40ABCD", condition: "Good", issue: "Battery draining fast" },
  { id: "d3", customerId: "c3", brand: "Xiaomi", model: "Mi 11", serial: "MI11XX2024", condition: "Damaged", issue: "Won't power on" },
  { id: "d4", customerId: "c1", brand: "iPad", model: "Air 4", serial: "DMPCJ5XPQR", condition: "Used - Minor Issues", issue: "Charging port loose" },
];
const seedTickets: Ticket[] = [
  { id: "t1", customerId: "c1", deviceId: "d1", issue: "Cracked screen replacement", priority: "High", status: "Diagnosing", createdAt: "2025-06-20", assignedTo: "u4" },
  { id: "t2", customerId: "c2", deviceId: "d2", issue: "Battery replacement", priority: "Normal", status: "Approved", createdAt: "2025-06-21", assignedTo: "u4" },
  { id: "t3", customerId: "c3", deviceId: "d3", issue: "Water damage diagnostics", priority: "High", status: "Open", createdAt: "2025-06-23" },
  { id: "t4", customerId: "c1", deviceId: "d4", issue: "Charging port repair", priority: "Normal", status: "Open", createdAt: "2025-06-24" },
];
const seedJobs: Job[] = [
  { id: "j1", ticketId: "t1", diagnosis: "LCD assembly cracked, digitizer non-responsive.", actions: ["Disassembled device", "Ordered OEM screen"], assignedTo: "u4", serviceId: "s1", partLines: [{ partId: "p1", qty: 1 }], status: "In Progress" },
  { id: "j2", ticketId: "t2", diagnosis: "Battery health 62%. Recommend replacement.", actions: ["Battery diagnostic complete"], assignedTo: "u4", serviceId: "s2", partLines: [{ partId: "p2", qty: 1 }], status: "Awaiting Parts" },
];
const seedParts: Part[] = [
  { id: "p1", name: "iPhone 13 Pro OLED", sku: "IP13P-SCR", stock: 4, lowStock: 5, price: 420, compatibility: "iPhone 13 Pro", supplierId: "sp1" },
  { id: "p2", name: "Samsung S22 Ultra Battery", sku: "S22U-BAT", stock: 12, lowStock: 5, price: 180, compatibility: "Galaxy S22 Ultra", supplierId: "sp2" },
  { id: "p3", name: "USB-C Charging Port", sku: "UC-PORT", stock: 2, lowStock: 8, price: 35, compatibility: "Universal USB-C", supplierId: "sp1" },
  { id: "p4", name: "iPad Air 4 Battery", sku: "IPA4-BAT", stock: 7, lowStock: 4, price: 220, compatibility: "iPad Air 4", supplierId: "sp1" },
  { id: "p5", name: "Tempered Glass Universal", sku: "TG-UNI", stock: 1, lowStock: 10, price: 15, compatibility: "Most phones", supplierId: "sp3" },
];
const seedSuppliers: Supplier[] = [
  { id: "sp1", name: "MobiParts Sdn Bhd", contact: "Encik Razali", phone: "03-55119988", email: "sales@mobiparts.my" },
  { id: "sp2", name: "Galaxy Wholesale", contact: "Ms. Tan", phone: "03-77881122", email: "tan@galaxyws.my" },
  { id: "sp3", name: "Shenzhen Direct", contact: "Wang Liu", phone: "+86 755 9090", email: "liu@szdirect.cn" },
];
const seedServices: Service[] = [
  { id: "s1", name: "Screen Replacement", basePrice: 150, durationHrs: 2, warrantyDays: 90, description: "Full LCD/OLED assembly swap incl. calibration." },
  { id: "s2", name: "Battery Replacement", basePrice: 100, durationHrs: 1, warrantyDays: 180, description: "OEM-grade battery installation with health test." },
  { id: "s3", name: "Water Damage Recovery", basePrice: 250, durationHrs: 6, warrantyDays: 30, description: "Ultrasonic board cleaning, component test, recovery." },
  { id: "s4", name: "Charging Port Repair", basePrice: 90, durationHrs: 1.5, warrantyDays: 60, description: "Port desolder + replacement with reflow." },
  { id: "s5", name: "Software Reflash", basePrice: 60, durationHrs: 1, warrantyDays: 14, description: "Full firmware reflash and data recovery attempt." },
];
const seedInvoices: Invoice[] = [
  { id: "inv1", jobId: "j1", customerId: "c1", subtotal: 650, tax: 39, total: 689, status: "Unpaid", createdAt: "2025-06-22" },
];
const seedStaff: Staff[] = [
  { id: "u1", name: "Mohd Kamarulhelmy", email: "owner@gw666.my", role: "Owner", phone: "012-9000001", joinedAt: "2020-01-15", salary: 12000, ic: "850101-10-0001" },
  { id: "u2", name: "Putera Danial Isaac", email: "manager@gw666.my", role: "Branch Manager", phone: "013-9000002", joinedAt: "2021-04-22", salary: 6500, ic: "900202-14-0002" },
  { id: "u3", name: "Aisyah Rahman", email: "cashier@gw666.my", role: "Cashier", phone: "017-9000003", joinedAt: "2023-07-10", salary: 2800, ic: "010303-10-0003" },
  { id: "u4", name: "Hafiz Tan", email: "tech@gw666.my", role: "Technician", phone: "019-9000004", joinedAt: "2022-09-05", salary: 3800, ic: "980404-08-0004" },
];

interface DataState {
  customers: Customer[]; devices: Device[]; tickets: Ticket[]; jobs: Job[];
  parts: Part[]; suppliers: Supplier[]; services: Service[]; invoices: Invoice[];
  staff: Staff[];
}

const SEED: DataState = {
  customers: seedCustomers, devices: seedDevices, tickets: seedTickets, jobs: seedJobs,
  parts: seedParts, suppliers: seedSuppliers, services: seedServices, invoices: seedInvoices,
  staff: seedStaff,
};

interface Store extends DataState {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  update: <K extends keyof DataState>(key: K, fn: (prev: DataState[K]) => DataState[K]) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);
const LS_KEY = "gw666_data_v3";
const LS_USER = "gw666_user_v1";

function migrate(parsed: any): DataState {
  if (!parsed.staff) parsed.staff = seedStaff;
  if (Array.isArray(parsed.jobs)) {
    parsed.jobs = parsed.jobs.map((j: any) => {
      if (j.partLines && j.serviceId !== undefined) return j;
      const partLines = Array.isArray(j.partLines)
        ? j.partLines
        : (j.partIds ?? []).map((id: string) => ({ partId: id, qty: 1 }));
      const serviceId = j.serviceId ?? (j.serviceIds?.[0] ?? "");
      const { partIds: _a, serviceIds: _b, laborCost: _c, ...rest } = j;
      return { ...rest, partLines, serviceId };
    });
  }
  return parsed as DataState;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataState>(() => {
    if (typeof window === "undefined") return SEED;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return SEED;
      return migrate(JSON.parse(raw));
    } catch { return SEED; }
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LS_USER);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }, [user]);

  const update: Store["update"] = (key, fn) => setData(prev => ({ ...prev, [key]: fn(prev[key]) }));
  const reset = () => setData(SEED);

  return (
    <Ctx.Provider value={{ ...data, user, login: setUser, logout: () => setUser(null), update, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const uid = (p = "x") => `${p}${Math.random().toString(36).slice(2, 8)}`;
