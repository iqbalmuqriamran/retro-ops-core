import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid, PRESET_USERS, type Job } from "@/lib/store";
import { PageHeader, Block, Btn, Drawer, Field, inputCls, Badge, Empty } from "@/components/brutalist";
import { Wrench, Plus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/workshop")({
  component: WorkshopPage,
});

const TECHS = PRESET_USERS.filter(u => u.role === "Technician" || u.role === "Branch Manager" || u.role === "Owner");
const STATUSES: Job["status"][] = ["In Progress", "Awaiting Parts", "Completed"];

function WorkshopPage() {
  const { jobs, tickets, parts, services, customers, devices, invoices, update } = useStore();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return jobs
      .filter(j => {
        const t = tickets.find(tt => tt.id === j.ticketId);
        return !s || j.id.includes(s) || (t?.issue.toLowerCase().includes(s));
      })
      .slice()
      .sort((a, b) => {
        const ta = tickets.find(t => t.id === a.ticketId)?.createdAt ?? "";
        const tb = tickets.find(t => t.id === b.ticketId)?.createdAt ?? "";
        return tb.localeCompare(ta);
      });
  }, [jobs, tickets, q]);

  const selected = jobs.find(j => j.id === selectedId);
  const ticketForSelected = tickets.find(t => t.id === selected?.ticketId);
  const cus = customers.find(c => c.id === ticketForSelected?.customerId);
  const dev = devices.find(d => d.id === ticketForSelected?.deviceId);

  const computeTotal = (j: Job) => {
    const partsTotal = j.partIds.reduce((s, id) => s + (parts.find(p => p.id === id)?.price ?? 0), 0);
    const svcTotal = j.serviceIds.reduce((s, id) => s + (services.find(x => x.id === id)?.basePrice ?? 0), 0);
    return partsTotal + svcTotal + j.laborCost;
  };

  const setField = (k: keyof Job, v: any) => {
    if (!selected) return;
    update("jobs", prev => prev.map(j => j.id === selected.id ? { ...j, [k]: v } : j));
  };
  const addAction = (txt: string) => {
    if (!selected || !txt.trim()) return;
    update("jobs", prev => prev.map(j => j.id === selected.id ? { ...j, actions: [...j.actions, txt.trim()] } : j));
  };
  const closeJob = () => {
    if (!selected) return;
    const total = computeTotal(selected);
    update("jobs", prev => prev.map(j => j.id === selected.id ? { ...j, status: "Completed" } : j));
    if (ticketForSelected) {
      update("tickets", prev => prev.map(t => t.id === ticketForSelected.id ? { ...t, status: "Completed" } : t));
    }
    selected.partIds.forEach(pid => update("parts", prev => prev.map(p => p.id === pid ? { ...p, stock: Math.max(0, p.stock - 1) } : p)));
    const existing = invoices.find(i => i.jobId === selected.id);
    const subtotal = total; const tax = Math.round(total * 0.06); const grand = subtotal + tax;
    if (existing) {
      update("invoices", prev => prev.map(i => i.id === existing.id ? { ...i, subtotal, tax, total: grand, status: "Paid", method: i.method ?? "Cash", paidAt: new Date().toISOString().slice(0, 10) } : i));
    } else if (ticketForSelected) {
      update("invoices", prev => [...prev, { id: uid("inv"), jobId: selected.id, customerId: ticketForSelected.customerId, subtotal, tax, total: grand, status: "Paid", method: "Cash", createdAt: new Date().toISOString().slice(0, 10), paidAt: new Date().toISOString().slice(0, 10) }]);
    }
    toast.success(`JOB ${selected.id.toUpperCase()} CLOSED // INVOICE PAID`);
  };

  const openTicketsNoJob = useMemo(
    () => tickets
      .filter(t => t.status !== "Completed" && !jobs.some(j => j.ticketId === t.id))
      .slice()
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [tickets, jobs]
  );

  const createJob = (ticketId: string) => {
    const id = uid("j");
    update("jobs", prev => [...prev, { id, ticketId, diagnosis: "", actions: [], assignedTo: "u4", laborCost: 0, partIds: [], serviceIds: [], status: "In Progress" }]);
    toast.success("JOB OPENED IN WORKSHOP");
    setSelectedId(id);
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 04 · Workshop" title="Technician Job Floor" />

      {/* Awaiting Workshop on LEFT and bigger; jobs list on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,1.1fr)_1fr] gap-4">
        <Block className="p-5 brutal-shadow bg-ink text-cream h-fit">
          <div className="flex items-center justify-between border-b-4 border-primary pb-3 mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">PRIORITY · QUEUE</p>
              <h3 className="font-display text-2xl uppercase leading-none mt-1">Awaiting Workshop</h3>
            </div>
            <div className="brutal-border border-cream bg-primary px-3 py-2 font-display text-lg">{openTicketsNoJob.length}</div>
          </div>
          {openTicketsNoJob.length === 0 ? <p className="font-mono text-xs opacity-70">▢ Queue empty. All clear.</p> : (
            <div className="space-y-3">
              {openTicketsNoJob.map(t => {
                const c = customers.find(cc => cc.id === t.customerId);
                const d = devices.find(dd => dd.id === t.deviceId);
                return (
                  <div key={t.id} className="brutal-border border-cream bg-cream/5 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-display uppercase text-sm leading-tight truncate">{t.issue}</div>
                        <div className="font-mono text-[10px] opacity-70 mt-1 truncate">{c?.name} · {d?.brand} {d?.model}</div>
                      </div>
                      <Badge tone={t.priority === "High" ? "red" : "muted"}>{t.priority === "High" && <AlertTriangle className="inline w-3 h-3 mr-1" />}{t.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[10px] opacity-60">Filed {t.createdAt}</div>
                      <button onClick={() => createJob(t.id)} className="brutal-border border-cream bg-primary px-3 py-1.5 font-display text-[11px] uppercase tracking-widest">
                        <Plus className="inline w-3 h-3 mr-1" /> Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Block>

        <div>
          <Block className="p-3 mb-3 brutal-shadow-sm">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH JOBS" className="w-full bg-transparent font-mono text-sm uppercase focus:outline-none px-2 py-2" />
          </Block>

          {filtered.length === 0 ? <Empty>No active jobs.</Empty> : (
            <div className="space-y-3">
              {filtered.map(j => {
                const t = tickets.find(x => x.id === j.ticketId);
                const tech = PRESET_USERS.find(u => u.id === j.assignedTo);
                return (
                  <Block key={j.id} onClick={() => setSelectedId(j.id)} className="p-4 brutal-shadow-sm cursor-pointer hover:bg-accent transition-colors">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                      <div className="w-12 h-12 grid place-items-center bg-ink text-cream"><Wrench className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-display uppercase truncate">{t?.issue ?? "—"}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">#{j.id.toUpperCase()} · TECH {tech?.name ?? "—"}</div>
                      </div>
                      <div className="text-right">
                        <Badge tone={j.status === "Completed" ? "navy" : j.status === "Awaiting Parts" ? "yellow" : "red"}>{j.status}</Badge>
                        <div className="font-display text-lg mt-1">RM{computeTotal(j)}</div>
                      </div>
                    </div>
                  </Block>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Job ${selected.id.toUpperCase()}` : ""} width={620}>
        {selected && (
          <div className="space-y-4">
            <Block className="p-4 bg-accent">
              <p className="font-mono text-[10px] uppercase tracking-widest">TARGET</p>
              <div className="font-display uppercase text-lg">{cus?.name} · {dev?.brand} {dev?.model}</div>
              <div className="font-mono text-xs">{ticketForSelected?.issue}</div>
            </Block>

            <Field label="Diagnosis Notes">
              <textarea rows={3} className={inputCls} value={selected.diagnosis} onChange={e => setField("diagnosis", e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Assigned Tech">
                <select className={inputCls} value={selected.assignedTo} onChange={e => setField("assignedTo", e.target.value)}>
                  {TECHS.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
                </select>
              </Field>
              <Field label="Labor Cost (RM)">
                <input type="number" className={inputCls} value={selected.laborCost} onChange={e => setField("laborCost", Number(e.target.value) || 0)} />
              </Field>
            </div>

            <div>
              <div className="font-display text-[11px] uppercase tracking-widest mb-1.5">Action Log</div>
              <div className="brutal-border bg-background p-3 space-y-1 max-h-40 overflow-y-auto">
                {selected.actions.length === 0 && <div className="font-mono text-[11px] uppercase text-muted-foreground">▢ No actions recorded.</div>}
                {selected.actions.map((a, i) => <div key={i} className="font-mono text-xs">▶ {a}</div>)}
              </div>
              <ActionAdd onAdd={addAction} />
            </div>

            <Block className="p-4 bg-ink text-cream">
              <div className="flex justify-between items-center">
                <div className="font-display uppercase text-sm">Computed Total</div>
                <div className="font-display text-3xl text-accent">RM{computeTotal(selected)}</div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setField("status", s)} className={`brutal-border border-cream py-2 font-display text-[10px] uppercase ${selected.status === s ? "bg-primary" : ""}`}>{s}</button>
                ))}
              </div>
              {selected.status !== "Completed" && (
                <Btn variant="primary" className="w-full mt-3" onClick={closeJob}>▶ Close Job · Generate Receipt</Btn>
              )}
            </Block>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function ActionAdd({ onAdd }: { onAdd: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2 mt-2">
      <input className={inputCls} placeholder="ADD ACTION ENTRY" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { onAdd(v); setV(""); } }} />
      <Btn variant="dark" onClick={() => { onAdd(v); setV(""); }}>Add</Btn>
    </div>
  );
}
