import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore, uid, type Service } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Empty, RowActions } from "@/components/brutalist";
import { Plus, Clock, Shield, Tag } from "lucide-react";

export const Route = createFileRoute("/app/services")({
  component: ServicesPage,
});

const blank = { name: "", basePrice: 0, durationHrs: 1, warrantyDays: 30, description: "" };

function ServicesPage() {
  const { services, update } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(blank);

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, basePrice: s.basePrice, durationHrs: s.durationHrs, warrantyDays: s.warrantyDays, description: s.description });
    setOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.error("SERVICE NAME REQUIRED"); return; }
    if (editing) {
      update("services", prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      toast.success("SERVICE UPDATED");
    } else {
      update("services", prev => [...prev, { id: uid("s"), ...form }]);
      toast.success("SERVICE ADDED TO CATALOG");
    }
    setForm(blank);
    setEditing(null);
    setOpen(false);
  };
  const remove = () => {
    if (!editing) return;
    update("services", prev => prev.filter(s => s.id !== editing.id));
    toast.success("SERVICE REMOVED");
    setEditing(null);
    setOpen(false);
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 06 · Catalog" title="Repair Services"
        action={<Btn variant="primary" onClick={openAdd}><Plus className="inline w-4 h-4 mr-1" /> Add Service</Btn>}
      />

      {services.length === 0 ? <Empty>No services in catalog.</Empty> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((s, i) => {
            const accent = i % 3 === 0 ? "bg-primary text-primary-foreground" : i % 3 === 1 ? "bg-accent" : "bg-ink text-cream";
            return (
              <Block key={s.id} onClick={() => openEdit(s)} className="brutal-shadow-sm overflow-hidden cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
                <div className={`${accent} p-4 border-b-4 border-ink`}>
                  <div className="flex items-start justify-between">
                    <Tag className="w-5 h-5" />
                    <div className="font-display text-3xl">RM{s.basePrice}</div>
                  </div>
                  <h3 className="font-display text-xl uppercase mt-2 leading-tight">{s.name}</h3>
                </div>
                <div className="p-4">
                  <p className="font-mono text-xs text-muted-foreground">{s.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="brutal-border p-2 text-center">
                      <Clock className="w-4 h-4 mx-auto" />
                      <div className="font-mono text-[10px] uppercase mt-1">DURATION</div>
                      <div className="font-display text-sm">{s.durationHrs}H</div>
                    </div>
                    <div className="brutal-border p-2 text-center">
                      <Shield className="w-4 h-4 mx-auto" />
                      <div className="font-mono text-[10px] uppercase mt-1">WARRANTY</div>
                      <div className="font-display text-sm">{s.warrantyDays}D</div>
                    </div>
                  </div>
                </div>
              </Block>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit · ${editing.name}` : "Add Service"}>
        <div className="space-y-3">
          <Field label="Service Name"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={2} className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Base Price"><input type="number" className={inputCls} value={form.basePrice} onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} /></Field>
            <Field label="Duration (h)"><input type="number" className={inputCls} value={form.durationHrs} onChange={e => setForm({ ...form, durationHrs: Number(e.target.value) })} /></Field>
            <Field label="Warranty (d)"><input type="number" className={inputCls} value={form.warrantyDays} onChange={e => setForm({ ...form, warrantyDays: Number(e.target.value) })} /></Field>
          </div>
          <div className="flex justify-between items-center pt-2">
            {editing ? <Btn variant="dark" onClick={remove}>Delete</Btn> : <span />}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={submit}>{editing ? "Save Changes" : "Save"}</Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
