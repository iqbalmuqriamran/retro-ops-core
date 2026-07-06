import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Badge, Empty, RowActions, Combobox } from "@/components/brutalist";
import { Plus, Search, AlertTriangle, Truck } from "lucide-react";
import {
  fetchParts,
  createPart,
  updatePart,
  deletePartApi,
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplierApi,
  PART_CATEGORIES,
  SUPPLIER_STATUSES,
  type PartRow,
  type SupplierRow,
  type PartPayload,
  type SupplierPayload,
} from "@/lib/api/inventory";

export const Route = createFileRoute("/app/inventory")({
  component: InventoryPage,
});

const blankPart: PartPayload = {
  supplier_id: "",
  name: "",
  category: PART_CATEGORIES[0],
  compatible: "",
  brand: "",
  stock: 0,
  price: 0,
  notes: "",
};

const blankSupplier: SupplierPayload = {
  name: "",
  fname: "",
  lname: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
  state: "",
  status: SUPPLIER_STATUSES[0],
  notes: "",
};

function InventoryPage() {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"parts" | "suppliers">("parts");
  const [q, setQ] = useState("");
  const [partOpen, setPartOpen] = useState(false);
  const [supOpen, setSupOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartRow | null>(null);
  const [editingSup, setEditingSup] = useState<SupplierRow | null>(null);
  const [pf, setPf] = useState<PartPayload>(blankPart);
  const [sf, setSf] = useState<SupplierPayload>(blankSupplier);

  const loadAll = () => {
    setLoading(true);
    Promise.all([fetchParts(), fetchSuppliers()])
      .then(([p, s]) => {
        setParts(p);
        setSuppliers(s);
      })
      .catch((err) => toast.error(err.message ?? "Failed to load inventory"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

const filteredParts = useMemo(
  () =>
    parts
      .filter((p) => {
        const s = q.toLowerCase();
        return (
          !s ||
          p.PART_NAME.toLowerCase().includes(s) ||
          p.PART_ID.toLowerCase().includes(s) ||
          (p.PART_COMPATIBLEDEVICE ?? "").toLowerCase().includes(s)
        );
      })
      .slice()
      .sort((a, b) => b.PART_ID.localeCompare(a.PART_ID)),
  [parts, q]
);

const filteredSups = useMemo(
  () =>
    suppliers
      .filter((s) => {
        const v = q.toLowerCase();
        return !v || s.SUPPLIER_NAME.toLowerCase().includes(v) || (s.SUPPLIER_CONTACTPERSONFNAME ?? "").toLowerCase().includes(v);
      })
      .slice()
      .sort((a, b) => b.SUPPLIER_ID.localeCompare(a.SUPPLIER_ID)),
  [suppliers, q]
);

  const openAddPart = () => {
    setEditingPart(null);
    setPf({ ...blankPart, supplier_id: suppliers[0]?.SUPPLIER_ID ?? "" });
    setPartOpen(true);
  };

  const openEditPart = (p: PartRow) => {
    setEditingPart(p);
    setPf({
      supplier_id: p.SUPPLIER_ID,
      name: p.PART_NAME,
      category: p.PART_CATEGORY,
      compatible: p.PART_COMPATIBLEDEVICE ?? "",
      brand: p.PART_BRAND ?? "",
      stock: p.PART_STOCK,
      price: p.PART_UNITPRICE,
      notes: p.PART_NOTES ?? "",
    });
    setPartOpen(true);
  };

  const submitPart = async () => {
    if (!pf.name.trim() || !pf.supplier_id) {
      toast.error("NAME + SUPPLIER REQUIRED");
      return;
    }
    if (pf.stock < 0 || pf.price < 0) {
      toast.error("STOCK + PRICE MUST BE 0 OR MORE");
      return;
    }
    try {
      if (editingPart) {
        await updatePart(editingPart.PART_ID, pf);
        toast.success("PART UPDATED");
      } else {
        await createPart(pf);
        toast.success("PART ADDED TO INVENTORY");
      }
      setPf(blankPart);
      setEditingPart(null);
      setPartOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save part");
    }
  };

  const deletePart = async () => {
    if (!editingPart) return;
    try {
      await deletePartApi(editingPart.PART_ID);
      toast.success("PART REMOVED");
      setEditingPart(null);
      setPartOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete part");
    }
  };

  const removePartRow = async (p: PartRow) => {
    try {
      await deletePartApi(p.PART_ID);
      toast.success("PART REMOVED");
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete part");
    }
  };

  const openAddSup = () => {
    setEditingSup(null);
    setSf(blankSupplier);
    setSupOpen(true);
  };

  const openEditSup = (s: SupplierRow) => {
    setEditingSup(s);
    setSf({
      name: s.SUPPLIER_NAME,
      fname: s.SUPPLIER_CONTACTPERSONFNAME ?? "",
      lname: s.SUPPLIER_CONTACTPERSONLNAME ?? "",
      phone: s.SUPPLIER_PHONENUMBER,
      email: s.SUPPLIER_EMAIL ?? "",
      address: s.SUPPLIER_ADDRESS ?? "",
      city: s.SUPPLIER_CITY ?? "",
      postcode: s.SUPPLIER_POSTCODE ?? "",
      state: s.SUPPLIER_STATE ?? "",
      status: s.SUPPLIER_STATUS,
      notes: s.SUPPLIER_NOTES ?? "",
    });
    setSupOpen(true);
  };

  const submitSup = async () => {
    const errors: string[] = [];
    if (!sf.name.trim()) {
      errors.push("Supplier name is required");
    } else if (!/[a-zA-Z]/.test(sf.name.trim())) {
      errors.push("Supplier name must contain letters");
    }

    if (!sf.phone.trim()) {
      errors.push("Phone is required");
    }

    if (sf.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sf.email.trim())) {
      errors.push("Invalid email format");
    }

    if (errors.length > 0) {
      toast.error(errors.join(". "));
      return;
    }

    try {
      if (editingSup) {
        await updateSupplier(editingSup.SUPPLIER_ID, sf);
        toast.success("SUPPLIER UPDATED");
      } else {
        await createSupplier(sf);
        toast.success("SUPPLIER REGISTERED");
      }
      setSf(blankSupplier);
      setEditingSup(null);
      setSupOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save supplier");
    }
  };

  const deleteSup = async () => {
    if (!editingSup) return;
    try {
      await deleteSupplierApi(editingSup.SUPPLIER_ID);
      toast.success("SUPPLIER REMOVED");
      setEditingSup(null);
      setSupOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete supplier");
    }
  };

  const adjust = async (e: React.MouseEvent, p: PartRow, delta: number) => {
    e.stopPropagation();
    const newStock = Math.max(0, p.PART_STOCK + delta);
    try {
      await updatePart(p.PART_ID, {
        supplier_id: p.SUPPLIER_ID,
        name: p.PART_NAME,
        category: p.PART_CATEGORY,
        compatible: p.PART_COMPATIBLEDEVICE ?? "",
        brand: p.PART_BRAND ?? "",
        stock: newStock,
        price: p.PART_UNITPRICE,
        notes: p.PART_NOTES ?? "",
      });
      // update local state directly instead of refetching everything
      setParts((prev) =>
        prev.map((row) =>
          row.PART_ID === p.PART_ID
            ? {
                ...row,
                PART_STOCK: newStock,
                PART_STATUS: newStock <= 0 ? "Out of Stock" : newStock <= 5 ? "Low Stock" : "Available",
              }
            : row
        )
      );
    } catch (err: any) {
      toast.error(err.message ?? "Failed to adjust stock");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sector 05 · Inventory"
        title="Parts & Suppliers"
        action={
          tab === "parts" ? (
            <Btn variant="primary" onClick={openAddPart}>
              <Plus className="inline w-4 h-4 mr-1" /> Add Part
            </Btn>
          ) : (
            <Btn variant="primary" onClick={openAddSup}>
              <Plus className="inline w-4 h-4 mr-1" /> Add Supplier
            </Btn>
          )
        }
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("parts")}
          className={`brutal-border px-4 py-2 font-display uppercase text-xs ${tab === "parts" ? "bg-ink text-cream brutal-shadow-sm" : "bg-card"}`}
        >
          ▣ Parts
        </button>
        <button
          onClick={() => setTab("suppliers")}
          className={`brutal-border px-4 py-2 font-display uppercase text-xs ${tab === "suppliers" ? "bg-ink text-cream brutal-shadow-sm" : "bg-card"}`}
        >
          ▣ Suppliers
        </button>
      </div>

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 ml-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`SEARCH ${tab.toUpperCase()}`}
          className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2"
        />
      </Block>

      {loading ? (
        <Empty>Loading inventory…</Empty>
      ) : tab === "parts" ? (
        filteredParts.length === 0 ? (
          <Empty>No parts in inventory.</Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredParts.map((p) => {
              const low = p.PART_STATUS === "Low Stock" || p.PART_STATUS === "Out of Stock";
              return (
                <Block
                  key={p.PART_ID}
                  onClick={() => openEditPart(p)}
                  className={`p-4 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform ${low ? "bg-primary text-primary-foreground" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase opacity-70">{p.PART_ID}</div>
                      <h3 className="font-display text-lg uppercase leading-tight">{p.PART_NAME}</h3>
                      <Badge tone={low ? "red" : "muted"}>{p.PART_STATUS}</Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {low && <AlertTriangle className="w-5 h-5" />}
                      <RowActions onEdit={() => openEditPart(p)} onDelete={() => removePartRow(p)} />
                    </div>
                  </div>
                  <div className="mt-3 font-mono text-xs">⚙ {p.PART_CATEGORY} · {p.PART_COMPATIBLEDEVICE || "—"}</div>
                  {p.PART_BRAND && <div className="font-mono text-[11px] opacity-70">Brand: {p.PART_BRAND}</div>}
                  <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                    <div>
                      <div className="font-mono text-[10px] uppercase opacity-70">Stock</div>
                      <div className="font-display text-4xl leading-none">{p.PART_STOCK}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase opacity-70">Unit Price</div>
                      <div className="font-display text-2xl">RM{p.PART_UNITPRICE.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <button onClick={(e) => adjust(e, p, -1)} className="brutal-border bg-background text-ink px-3 py-1 font-display text-xs">
                      −
                    </button>
                    <button onClick={(e) => adjust(e, p, +1)} className="brutal-border bg-background text-ink px-3 py-1 font-display text-xs">
                      +
                    </button>
                    <div className="flex-1 text-right font-mono text-[10px] uppercase truncate self-center">▶ {p.SUPPLIER_NAME}</div>
                  </div>
                </Block>
              );
            })}
          </div>
        )
      ) : filteredSups.length === 0 ? (
        <Empty>No suppliers registered.</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSups.map((s) => (
            <Block
              key={s.SUPPLIER_ID}
              onClick={() => openEditSup(s)}
              className="p-4 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 grid place-items-center bg-ink text-cream">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg uppercase">{s.SUPPLIER_NAME}</h3>
                  <div className="font-mono text-xs text-muted-foreground">
                    Contact · {s.SUPPLIER_CONTACTPERSONFNAME} {s.SUPPLIER_CONTACTPERSONLNAME}
                  </div>
                  <div className="font-mono text-xs mt-2">☎ {s.SUPPLIER_PHONENUMBER}</div>
                  <div className="font-mono text-xs">✉ {s.SUPPLIER_EMAIL}</div>
                  {s.SUPPLIER_CITY && (
                    <div className="font-mono text-xs mt-1 opacity-70">
                      {s.SUPPLIER_CITY}, {s.SUPPLIER_STATE}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={s.SUPPLIER_STATUS === "Active" ? "navy" : "red"}>{s.SUPPLIER_STATUS}</Badge>
                  <Badge tone="ink">{parts.filter((p) => p.SUPPLIER_ID === s.SUPPLIER_ID).length} SKU</Badge>
                </div>
              </div>
            </Block>
          ))}
        </div>
      )}

      {/* Add/edit part modal */}
      <Modal open={partOpen} onClose={() => setPartOpen(false)} title={editingPart ? `Edit Part · ${editingPart.PART_ID}` : "Add Spare Part"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Part Name">
              <input className={inputCls} value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={pf.category} onChange={(e) => setPf({ ...pf, category: e.target.value })}>
                {PART_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Compatible Device">
              <input className={inputCls} value={pf.compatible} onChange={(e) => setPf({ ...pf, compatible: e.target.value })} />
            </Field>
            <Field label="Brand">
              <input className={inputCls} value={pf.brand} onChange={(e) => setPf({ ...pf, brand: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <input type="number" className={inputCls} value={pf.stock} onChange={(e) => setPf({ ...pf, stock: Number(e.target.value) })} />
            </Field>
            <Field label="Unit Price">
              <input type="number" className={inputCls} value={pf.price} onChange={(e) => setPf({ ...pf, price: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Supplier">
            <Combobox
              value={pf.supplier_id}
              onChange={(v) => setPf({ ...pf, supplier_id: v })}
              options={suppliers.map((s) => ({ id: s.SUPPLIER_ID, label: s.SUPPLIER_NAME, meta: s.SUPPLIER_CONTACTPERSONFNAME ?? "" }))}
              placeholder="SEARCH SUPPLIER"
            />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={pf.notes} onChange={(e) => setPf({ ...pf, notes: e.target.value })} />
          </Field>
          {editingPart && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              ▶ Status auto-updates from stock: 0 = Out of Stock, ≤5 = Low Stock, else Available.
            </p>
          )}
          <div className="flex justify-between items-center pt-2">
            {editingPart ? (
              <Btn variant="dark" onClick={deletePart}>
                Delete
              </Btn>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setPartOpen(false)}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={submitPart}>
                {editingPart ? "Save Changes" : "Save Part"}
              </Btn>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add/edit supplier modal */}
      <Modal
        open={supOpen}
        onClose={() => setSupOpen(false)}
        title={editingSup ? `Edit Supplier · ${editingSup.SUPPLIER_ID}` : "Add Supplier"}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company Name">
              <input className={inputCls} value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={sf.status} onChange={(e) => setSf({ ...sf, status: e.target.value })}>
                {SUPPLIER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact First Name">
              <input className={inputCls} value={sf.fname} onChange={(e) => setSf({ ...sf, fname: e.target.value })} />
            </Field>
            <Field label="Contact Last Name">
              <input className={inputCls} value={sf.lname} onChange={(e) => setSf({ ...sf, lname: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                className={inputCls}
                value={sf.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3, 11)}` : digits;
                  setSf({ ...sf, phone: formatted });
                }}
                placeholder="012-3456789"
                maxLength={12}
              />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={sf.email} onChange={(e) => setSf({ ...sf, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <input className={inputCls} value={sf.address} onChange={(e) => setSf({ ...sf, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input className={inputCls} value={sf.city} onChange={(e) => setSf({ ...sf, city: e.target.value })} />
            </Field>
            <Field label="Postcode">
              <input className={inputCls} value={sf.postcode} onChange={(e) => setSf({ ...sf, postcode: e.target.value })} />
            </Field>
            <Field label="State">
              <input className={inputCls} value={sf.state} onChange={(e) => setSf({ ...sf, state: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <input className={inputCls} value={sf.notes} onChange={(e) => setSf({ ...sf, notes: e.target.value })} />
          </Field>
          <div className="flex justify-between items-center pt-2">
            {editingSup ? (
              <Btn variant="dark" onClick={deleteSup}>
                Delete
              </Btn>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setSupOpen(false)}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={submitSup}>
                {editingSup ? "Save Changes" : "Save Supplier"}
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}