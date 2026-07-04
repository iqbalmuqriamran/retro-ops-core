import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid, type Ticket } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Drawer, Field, inputCls, Badge, Empty, Combobox, RowActions } from "@/components/brutalist";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/tickets")({
  component: TicketsPage,
});

const PRIORITIES: Ticket["priority"][] = ["Normal", "High"];
const STATUSES: Ticket["status"][] = ["Open", "Diagnosing", "Approved", "Completed"];
const blankForm = { customerId: "", deviceId: "", issue: "", priority: "Normal" as Ticket["priority"] };

function TicketsPage() {
  const { tickets, customers, devices, update } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [form, setForm] = useState(blankForm);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return tickets
      .filter(t => (status === "all" || t.status === status) &&
        (!s || t.issue.toLowerCase().includes(s) || t.id.includes(s) ||
         (customers.find(c => c.id === t.customerId)?.name.toLowerCase().includes(s))))
      .slice()
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [tickets, q, status, customers]);

  const cusDevices = devices.filter(d => d.customerId === form.customerId);

  const openNew = () => { setEditing(null); setForm(blankForm); setOpen(true); };
  const openEdit = (t: Ticket) => {
    setEditing(t);
    setForm({ customerId: t.customerId, deviceId: t.deviceId, issue: t.issue, priority: t.priority });
    setOpen(true);
  };

  const submit = () => {
    if (!form.customerId || !form.deviceId || !form.issue.trim()) { toast.error("CUSTOMER + DEVICE + ISSUE REQUIRED"); return; }
    if (editing) {
      update("tickets", prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
      toast.success("TICKET UPDATED");
    } else {
      update("tickets", p => [...p, { id: uid("t"), ...form, status: "Open", createdAt: new Date().toISOString().slice(0, 10) }]);
      toast.success("TICKET LOGGED // QUEUE OPEN");
    }
    setForm(blankForm); setEditing(null); setOpen(false);
  };

  const removeTicket = (t: Ticket) => {
    update("tickets", prev => prev.filter(x => x.id !== t.id));
    toast.success(`TICKET ${t.id.toUpperCase()} REMOVED`);
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 03 · Intake" title="Ticketing Center"
        action={<Btn variant="primary" onClick={openNew}><Plus className="inline w-4 h-4 mr-1" /> New Ticket Intake</Btn>}
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
            const statusTone = t.status === "Completed" ? "navy" : t.status === "Approved" ? "yellow" : t.status === "Diagnosing" ? "ink" : "red";
            return (
              <Block key={t.id} className="p-4 brutal-shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px]">#{t.id.toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.priority === "High" ? "red" : "muted"}>{t.priority}</Badge>
                    <RowActions onEdit={() => openEdit(t)} onDelete={() => removeTicket(t)} />
                  </div>
                </div>
                <div className="cursor-pointer" onClick={() => setSelected(t)}>
                  <h3 className="font-display text-lg uppercase mt-2 leading-tight">{t.issue}</h3>
                  <div className="font-mono text-xs mt-2 text-muted-foreground">{cus?.name} · {dev?.brand} {dev?.model}</div>
                  <div className="font-mono text-[10px] uppercase mt-1">Filed {t.createdAt}</div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-2">
                  <span className="font-mono text-[10px] uppercase opacity-70">Status</span>
                  <Badge tone={statusTone as any}>{t.status}</Badge>
                </div>
              </Block>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Ticket · ${editing.id.toUpperCase()}` : "New Ticket Intake"}>
        <div className="space-y-3">
          <Field label="Customer">
            <Combobox
              value={form.customerId}
              onChange={v => setForm({ ...form, customerId: v, deviceId: "" })}
              options={customers.map(c => ({ id: c.id, label: c.name, meta: c.phone }))}
              placeholder="SEARCH CUSTOMER"
            />
          </Field>
          <Field label="Device">
            <Combobox
              value={form.deviceId}
              onChange={v => setForm({ ...form, deviceId: v })}
              options={cusDevices.map(d => ({ id: d.id, label: `${d.brand} ${d.model}`, meta: d.serial }))}
              placeholder={form.customerId ? "SEARCH DEVICE" : "SELECT CUSTOMER FIRST"}
              disabled={!form.customerId}
            />
          </Field>
          <Field label="Issue Description"><textarea rows={3} className={inputCls} value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} /></Field>
          <Field label="Priority">
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 brutal-border py-2.5 font-display uppercase text-xs ${form.priority === p ? (p === "High" ? "bg-primary text-primary-foreground" : "bg-ink text-cream") : "bg-card"}`}>{p}</button>
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={submit}>{editing ? "Save Changes" : "Log Ticket"}</Btn></div>
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
              <div className="font-mono text-[11px] uppercase text-muted-foreground">Status advances automatically through the Workshop pipeline.</div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}

