import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid, type Part } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Badge, Empty, RowActions, Combobox } from "@/components/brutalist";
import { Plus, Search, AlertTriangle, Truck } from "lucide-react";

export const Route = createFileRoute("/app/inventory")({
  component: InventoryPage,
});

const blankPart = { name: "", sku: "", stock: 0, lowStock: 5, price: 0, compatibility: "", supplierId: "" };

function InventoryPage() {
  const { parts, suppliers, update } = useStore();
  const [tab, setTab] = useState<"parts" | "suppliers">("parts");
  const [q, setQ] = useState("");
  const [partOpen, setPartOpen] = useState(false);
  const [supOpen, setSupOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [pf, setPf] = useState(blankPart);
  const [sf, setSf] = useState({ name: "", contact: "", phone: "", email: "" });

  const filteredParts = useMemo(() => parts.filter(p => {
    const s = q.toLowerCase(); return !s || p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.compatibility.toLowerCase().includes(s);
  }), [parts, q]);
  const filteredSups = useMemo(() => suppliers.filter(s => {
    const v = q.toLowerCase(); return !v || s.name.toLowerCase().includes(v) || s.contact.toLowerCase().includes(v);
  }), [suppliers, q]);

  const openAddPart = () => {
    setEditingPart(null);
    setPf(blankPart);
    setPartOpen(true);
  };
  const openEditPart = (p: Part) => {
    setEditingPart(p);
    setPf({ name: p.name, sku: p.sku, stock: p.stock, lowStock: p.lowStock, price: p.price, compatibility: p.compatibility, supplierId: p.supplierId });
    setPartOpen(true);
  };
  const submitPart = () => {
    if (!pf.name.trim() || !pf.sku.trim()) { toast.error("NAME + SKU REQUIRED"); return; }
    if (editingPart) {
      update("parts", prev => prev.map(p => p.id === editingPart.id ? { ...p, ...pf } : p));
      toast.success("PART UPDATED");
    } else {
      update("parts", prev => [...prev, { id: uid("p"), ...pf }]);
      toast.success("PART ADDED TO INVENTORY");
    }
    setPf(blankPart);
    setEditingPart(null);
    setPartOpen(false);
  };
  const deletePart = () => {
    if (!editingPart) return;
    update("parts", prev => prev.filter(p => p.id !== editingPart.id));
    toast.success("PART REMOVED");
    setEditingPart(null);
    setPartOpen(false);
  };
  const submitSup = () => {
    if (!sf.name.trim()) { toast.error("SUPPLIER NAME REQUIRED"); return; }
    update("suppliers", prev => [...prev, { id: uid("sp"), ...sf }]);
    toast.success("SUPPLIER REGISTERED");
    setSf({ name: "", contact: "", phone: "", email: "" });
    setSupOpen(false);
  };
  const adjust = (e: React.MouseEvent, id: string, delta: number) => {
    e.stopPropagation();
    update("parts", prev => prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 05 · Inventory" title="Parts & Suppliers"
        action={tab === "parts"
          ? <Btn variant="primary" onClick={openAddPart}><Plus className="inline w-4 h-4 mr-1" /> Add Part</Btn>
          : <Btn variant="primary" onClick={() => setSupOpen(true)}><Plus className="inline w-4 h-4 mr-1" /> Add Supplier</Btn>}
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("parts")} className={`brutal-border px-4 py-2 font-display uppercase text-xs ${tab === "parts" ? "bg-ink text-cream brutal-shadow-sm" : "bg-card"}`}>▣ Parts</button>
        <button onClick={() => setTab("suppliers")} className={`brutal-border px-4 py-2 font-display uppercase text-xs ${tab === "suppliers" ? "bg-ink text-cream brutal-shadow-sm" : "bg-card"}`}>▣ Suppliers</button>
      </div>

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 ml-2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={`SEARCH ${tab.toUpperCase()}`} className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2" />
      </Block>

      {tab === "parts" ? (
        filteredParts.length === 0 ? <Empty>No parts in inventory.</Empty> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredParts.map(p => {
              const sup = suppliers.find(s => s.id === p.supplierId);
              const low = p.stock <= p.lowStock;
              return (
                <Block key={p.id} onClick={() => openEditPart(p)} className={`p-4 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform ${low ? "bg-primary text-primary-foreground" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase opacity-70">{p.sku}</div>
                      <h3 className="font-display text-lg uppercase leading-tight">{p.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {low && <AlertTriangle className="w-5 h-5" />}
                      <RowActions onEdit={() => openEditPart(p)} onDelete={() => { update("parts", prev => prev.filter(x => x.id !== p.id)); toast.success("PART REMOVED"); }} />
                    </div>
                  </div>
                  <div className="mt-3 font-mono text-xs">⚙ {p.compatibility}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                    <div>
                      <div className="font-mono text-[10px] uppercase opacity-70">Stock</div>
                      <div className="font-display text-4xl leading-none">{p.stock}</div>
                      <div className="font-mono text-[10px] uppercase opacity-70">min {p.lowStock}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-[10px] uppercase opacity-70">Unit Price</div>
                      <div className="font-display text-2xl">RM{p.price}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <button onClick={(e) => adjust(e, p.id, -1)} className="brutal-border bg-background text-ink px-3 py-1 font-display text-xs">−</button>
                    <button onClick={(e) => adjust(e, p.id, +1)} className="brutal-border bg-background text-ink px-3 py-1 font-display text-xs">+</button>
                    <div className="flex-1 text-right font-mono text-[10px] uppercase truncate self-center">▶ {sup?.name ?? "no supplier"}</div>
                  </div>
                </Block>
              );
            })}
          </div>
        )
      ) : (
        filteredSups.length === 0 ? <Empty>No suppliers registered.</Empty> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSups.map(s => (
              <Block key={s.id} className="p-4 brutal-shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 grid place-items-center bg-ink text-cream"><Truck className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg uppercase">{s.name}</h3>
                    <div className="font-mono text-xs text-muted-foreground">Contact · {s.contact}</div>
                    <div className="font-mono text-xs mt-2">☎ {s.phone}</div>
                    <div className="font-mono text-xs">✉ {s.email}</div>
                  </div>
                  <Badge tone="ink">{parts.filter(p => p.supplierId === s.id).length} SKU</Badge>
                </div>
              </Block>
            ))}
          </div>
        )
      )}

      <Modal open={partOpen} onClose={() => setPartOpen(false)} title={editingPart ? `Edit Part · ${editingPart.sku}` : "Add Spare Part"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Part Name"><input className={inputCls} value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} /></Field>
            <Field label="SKU"><input className={inputCls} value={pf.sku} onChange={e => setPf({ ...pf, sku: e.target.value })} /></Field>
          </div>
          <Field label="Compatibility"><input className={inputCls} value={pf.compatibility} onChange={e => setPf({ ...pf, compatibility: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Stock"><input type="number" className={inputCls} value={pf.stock} onChange={e => setPf({ ...pf, stock: Number(e.target.value) })} /></Field>
            <Field label="Min Threshold"><input type="number" className={inputCls} value={pf.lowStock} onChange={e => setPf({ ...pf, lowStock: Number(e.target.value) })} /></Field>
            <Field label="Unit Price"><input type="number" className={inputCls} value={pf.price} onChange={e => setPf({ ...pf, price: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Supplier">
            <Combobox
              value={pf.supplierId}
              onChange={v => setPf({ ...pf, supplierId: v })}
              options={suppliers.map(s => ({ id: s.id, label: s.name, meta: s.contact }))}
              placeholder="SEARCH SUPPLIER"
              allowClear
            />
          </Field>
          <div className="flex justify-between items-center pt-2">
            {editingPart ? <Btn variant="dark" onClick={deletePart}>Delete</Btn> : <span />}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setPartOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={submitPart}>{editingPart ? "Save Changes" : "Save Part"}</Btn>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={supOpen} onClose={() => setSupOpen(false)} title="Add Supplier">
        <div className="space-y-3">
          <Field label="Company Name"><input className={inputCls} value={sf.name} onChange={e => setSf({ ...sf, name: e.target.value })} /></Field>
          <Field label="Contact Person"><input className={inputCls} value={sf.contact} onChange={e => setSf({ ...sf, contact: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><input className={inputCls} value={sf.phone} onChange={e => setSf({ ...sf, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} value={sf.email} onChange={e => setSf({ ...sf, email: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setSupOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={submitSup}>Save Supplier</Btn></div>
        </div>
      </Modal>
    </div>
  );
}
