import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid, type Ticket } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Drawer, Field, inputCls, Badge, Empty } from "@/components/brutalist";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/tickets")({
  component: TicketsPage,
});

const PRIORITIES: Ticket["priority"][] = ["Low", "Medium", "High"];
const STATUSES: Ticket["status"][] = ["Open", "Diagnosing", "Approved", "Completed"];

function TicketsPage() {
  const { tickets, customers, devices, update } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [form, setForm] = useState({ customerId: "", deviceId: "", issue: "", priority: "Medium" as Ticket["priority"] });

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return tickets.filter(t => (status === "all" || t.status === status) &&
      (!s || t.issue.toLowerCase().includes(s) || t.id.includes(s) ||
       (customers.find(c => c.id === t.customerId)?.name.toLowerCase().includes(s))));
  }, [tickets, q, status, customers]);

  const cusDevices = devices.filter(d => d.customerId === form.customerId);

  const submit = () => {
    if (!form.customerId || !form.deviceId || !form.issue.trim()) { toast.error("CUSTOMER + DEVICE + ISSUE REQUIRED"); return; }
    update("tickets", p => [...p, { id: uid("t"), ...form, status: "Open", createdAt: new Date().toISOString().slice(0, 10) }]);
    toast.success("TICKET LOGGED // QUEUE OPEN");
    setForm({ customerId: "", deviceId: "", issue: "", priority: "Medium" });
    setOpen(false);
  };

  const setStatusOf = (id: string, s: Ticket["status"]) => {
    update("tickets", prev => prev.map(t => t.id === id ? { ...t, status: s } : t));
    toast.success(`TICKET ${id.toUpperCase()} → ${s.toUpperCase()}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 03 · Intake" title="Ticketing Center"
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus className="inline w-4 h-4 mr-1" /> New Ticket Intake</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-4">
        <Block className="p-3 brutal-shadow-sm flex items-center gap-2">
          <Search className="w-4 h-4 ml-2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH TICKETS" className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2" />
        </Block>
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`brutal-border px-3 py-2 font-display uppercase text-[11px] tracking-widest ${status === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? <Empty>No tickets in this view.</Empty> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => {
            const cus = customers.find(c => c.id === t.customerId);
            const dev = devices.find(d => d.id === t.deviceId);
            return (
              <Block key={t.id} className="p-4 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform" >
                <div onClick={() => setSelected(t)}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px]">#{t.id.toUpperCase()}</span>
                    <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "yellow" : "muted"}>{t.priority}</Badge>
                  </div>
                  <h3 className="font-display text-lg uppercase mt-2 leading-tight">{t.issue}</h3>
                  <div className="font-mono text-xs mt-2 text-muted-foreground">{cus?.name} · {dev?.brand} {dev?.model}</div>
                  <div className="font-mono text-[10px] uppercase mt-1">Filed {t.createdAt}</div>
                </div>
                <div className="mt-3 flex gap-1 flex-wrap">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatusOf(t.id, s)} className={`px-2 py-1 brutal-border text-[10px] font-display uppercase ${t.status === s ? "bg-ink text-cream" : "bg-background"}`}>{s}</button>
                  ))}
                </div>
              </Block>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Ticket Intake">
        <div className="space-y-3">
          <Field label="Customer">
            <select className={inputCls} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, deviceId: "" })}>
              <option value="">— select —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
            </select>
          </Field>
          <Field label="Device">
            <select className={inputCls} value={form.deviceId} onChange={e => setForm({ ...form, deviceId: e.target.value })} disabled={!form.customerId}>
              <option value="">— select —</option>
              {cusDevices.map(d => <option key={d.id} value={d.id}>{d.brand} {d.model} · {d.serial}</option>)}
            </select>
          </Field>
          <Field label="Issue Description"><textarea rows={3} className={inputCls} value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} /></Field>
          <Field label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 brutal-border py-2.5 font-display uppercase text-xs ${form.priority === p ? (p === "High" ? "bg-primary text-primary-foreground" : p === "Medium" ? "bg-accent" : "bg-ink text-cream") : "bg-card"}`}>{p}</button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={submit}>Log Ticket</Btn></div>
        </div>
      </Modal>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Ticket ${selected.id.toUpperCase()}` : ""}>
        {selected && (() => {
          const cus = customers.find(c => c.id === selected.customerId);
          const dev = devices.find(d => d.id === selected.deviceId);
          return (
            <div className="space-y-4">
              <Block className="p-4 bg-primary text-primary-foreground">
                <p className="font-mono text-[10px] uppercase tracking-widest">PRIORITY · {selected.priority}</p>
                <h3 className="font-display text-2xl uppercase leading-tight mt-1">{selected.issue}</h3>
              </Block>
              <Block className="p-4">
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div><span className="opacity-60 uppercase text-[10px]">Customer</span><br/>{cus?.name}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Phone</span><br/>{cus?.phone}</div>
                  <div className="col-span-2"><span className="opacity-60 uppercase text-[10px]">Device</span><br/>{dev?.brand} {dev?.model} · {dev?.serial}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Status</span><br/><Badge tone="red">{selected.status}</Badge></div>
                  <div><span className="opacity-60 uppercase text-[10px]">Filed</span><br/>{selected.createdAt}</div>
                </div>
              </Block>
              <div className="font-mono text-[11px] uppercase text-muted-foreground">Transition status via the cards on the main grid.</div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
