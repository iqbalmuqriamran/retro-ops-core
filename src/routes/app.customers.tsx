import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid } from "@/lib/store";
import { PageHeader, Block, Btn, Drawer, Modal, Field, inputCls, Badge, Empty } from "@/components/brutalist";
import { Plus, Search, Smartphone } from "lucide-react";

export const Route = createFileRoute("/app/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, devices, tickets, update } = useStore();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deviceModal, setDeviceModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [deviceForm, setDeviceForm] = useState({ brand: "", model: "", serial: "", condition: "Good", issue: "" });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return customers.filter(c => !s || c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s));
  }, [customers, q]);

  const selected = customers.find(c => c.id === selectedId);
  const selectedDevices = devices.filter(d => d.customerId === selectedId);

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("NAME + PHONE REQUIRED"); return; }
    update("customers", prev => [...prev, { id: uid("c"), ...form, createdAt: new Date().toISOString().slice(0, 10) }]);
    toast.success("CUSTOMER REGISTERED");
    setForm({ name: "", phone: "", email: "", address: "" });
    setModalOpen(false);
  };
  const submitDevice = () => {
    if (!selectedId || !deviceForm.brand.trim() || !deviceForm.model.trim()) { toast.error("BRAND + MODEL REQUIRED"); return; }
    update("devices", prev => [...prev, { id: uid("d"), customerId: selectedId, ...deviceForm }]);
    toast.success("DEVICE LINKED");
    setDeviceForm({ brand: "", model: "", serial: "", condition: "Good", issue: "" });
    setDeviceModal(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sector 02 · CRM"
        title="Customers & Devices"
        action={<Btn variant="primary" onClick={() => setModalOpen(true)}><Plus className="inline w-4 h-4 mr-1" /> New Customer</Btn>}
      />

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 shrink-0 ml-2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH NAME / PHONE / EMAIL" className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2" />
        <Badge tone="ink">{filtered.length} RESULTS</Badge>
      </Block>

      <Block className="overflow-hidden brutal-shadow-sm">
        <table className="w-full">
          <thead className="bg-ink text-cream">
            <tr className="text-left font-display text-[11px] uppercase tracking-widest">
              <th className="p-3">#</th><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3 hidden md:table-cell">Email</th><th className="p-3 hidden lg:table-cell">Address</th><th className="p-3 text-right">Devices</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const count = devices.filter(d => d.customerId === c.id).length;
              return (
                <tr key={c.id} onClick={() => setSelectedId(c.id)} className="border-t-2 border-ink cursor-pointer hover:bg-accent transition-colors">
                  <td className="p-3 font-mono text-xs">{String(i + 1).padStart(2, "0")}</td>
                  <td className="p-3 font-display text-sm uppercase">{c.name}</td>
                  <td className="p-3 font-mono text-xs">{c.phone}</td>
                  <td className="p-3 font-mono text-xs hidden md:table-cell">{c.email}</td>
                  <td className="p-3 font-mono text-xs hidden lg:table-cell truncate">{c.address}</td>
                  <td className="p-3 text-right"><Badge tone={count ? "red" : "muted"}>{count} DEV</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-10"><Empty>No customers match the query.</Empty></div>}
      </Block>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-5">
            <Block className="p-4 bg-ink text-cream">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">PROFILE</p>
              <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">
                <div><span className="opacity-60">PHONE</span><br/>{selected.phone}</div>
                <div><span className="opacity-60">EMAIL</span><br/>{selected.email}</div>
                <div className="col-span-2"><span className="opacity-60">ADDRESS</span><br/>{selected.address}</div>
                <div><span className="opacity-60">JOINED</span><br/>{selected.createdAt}</div>
                <div><span className="opacity-60">ID</span><br/>{selected.id.toUpperCase()}</div>
              </div>
            </Block>

            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg uppercase">Registered Devices</h3>
              <Btn variant="dark" onClick={() => setDeviceModal(true)}><Plus className="inline w-3 h-3 mr-1"/> Link Device</Btn>
            </div>

            {selectedDevices.length === 0 ? <Empty>No devices registered.</Empty> : (
              <div className="space-y-3">
                {selectedDevices.map(d => {
                  const activeTickets = tickets.filter(t => t.deviceId === d.id && t.status !== "Completed").length;
                  return (
                    <Block key={d.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-accent grid place-items-center brutal-border shrink-0"><Smartphone className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display uppercase">{d.brand} {d.model}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">S/N: {d.serial}</div>
                          <div className="font-mono text-xs mt-1">⚙ {d.condition}</div>
                          <div className="font-mono text-xs">⚠ {d.issue}</div>
                        </div>
                        {activeTickets > 0 && <Badge tone="red">{activeTickets} OPEN</Badge>}
                      </div>
                    </Block>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* New customer modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Customer Intake">
        <div className="space-y-3">
          <Field label="Full Name"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="Address"><input className={inputCls} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={submit}>Register</Btn></div>
        </div>
      </Modal>

      <Modal open={deviceModal} onClose={() => setDeviceModal(false)} title="Link Device">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand"><input className={inputCls} value={deviceForm.brand} onChange={e => setDeviceForm({ ...deviceForm, brand: e.target.value })} /></Field>
            <Field label="Model"><input className={inputCls} value={deviceForm.model} onChange={e => setDeviceForm({ ...deviceForm, model: e.target.value })} /></Field>
          </div>
          <Field label="Serial / IMEI"><input className={inputCls} value={deviceForm.serial} onChange={e => setDeviceForm({ ...deviceForm, serial: e.target.value })} /></Field>
          <Field label="Condition"><input className={inputCls} value={deviceForm.condition} onChange={e => setDeviceForm({ ...deviceForm, condition: e.target.value })} /></Field>
          <Field label="Reported Issue"><textarea className={inputCls} rows={3} value={deviceForm.issue} onChange={e => setDeviceForm({ ...deviceForm, issue: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setDeviceModal(false)}>Cancel</Btn><Btn variant="primary" onClick={submitDevice}>Save Device</Btn></div>
        </div>
      </Modal>
    </div>
  );
}
