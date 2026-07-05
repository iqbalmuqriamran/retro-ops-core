import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Btn, Modal, Drawer, Field, inputCls, Badge, Empty, Combobox, RowActions } from "@/components/brutalist";
import { Plus, Search } from "lucide-react";
import { fetchTickets, createTicket, updateTicket, deleteTicketApi, TICKET_PRIORITIES, TICKET_STATUSES, type TicketRow } from "@/lib/api/tickets";
import { fetchCustomers, type CustomerRow } from "@/lib/api/customers";
import { fetchDevices, type DeviceRow } from "@/lib/api/device";

export const Route = createFileRoute("/app/tickets")({
  component: TicketsPage,
});

type TicketForm = {
  customerId: string;
  deviceId: string;
  issue: string;
  priority: string;
  status: string;
  estimatedCost: string;
  estimatedCompleteTime: string;
  notes: string;
};
const blankForm: TicketForm = {
  customerId: "",
  deviceId: "",
  issue: "",
  priority: TICKET_PRIORITIES[1], // "Normal"
  status: TICKET_STATUSES[0], // "Pending"
  estimatedCost: "",
  estimatedCompleteTime: "",
  notes: "",
};

function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TicketRow | null>(null);
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [form, setForm] = useState<TicketForm>(blankForm);

  const loadAll = () => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchCustomers(), fetchDevices()])
      .then(([t, c, d]) => {
        setTickets(t);
        setCustomers(c);
        setDevices(d);
      })
      .catch((err) => toast.error(err.message ?? "Failed to load tickets"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return tickets
      .filter((t) => {
        const cus = customers.find((c) => c.CUST_ID === t.CUST_ID);
        const cusName = cus ? `${cus.CUST_FNAME} ${cus.CUST_LNAME}` : "";
        return (
          (status === "all" || t.TICKET_STATUS === status) &&
          (!s ||
            t.TICKET_ISSUE.toLowerCase().includes(s) ||
            t.TICKET_ID.toLowerCase().includes(s) ||
            cusName.toLowerCase().includes(s))
        );
      })
      .slice()
      .sort((a, b) => (b.TICKET_DATE ?? "").localeCompare(a.TICKET_DATE ?? ""));
  }, [tickets, q, status, customers]);

  const cusDevices = devices.filter((d) => d.CUST_ID === form.customerId);

  const openNew = () => {
    setEditing(null);
    setForm(blankForm);
    setOpen(true);
  };

  const openEdit = (t: TicketRow) => {
    setEditing(t);
    setForm({
      customerId: t.CUST_ID,
      deviceId: t.DEVICE_ID,
      issue: t.TICKET_ISSUE,
      priority: t.TICKET_PRIORITYLEVEL,
      status: t.TICKET_STATUS,
      estimatedCost: t.TICKET_ESTIMATEDCOST != null ? String(t.TICKET_ESTIMATEDCOST) : "",
      estimatedCompleteTime: t.TICKET_ESTIMATEDCOMPLETETIME ?? "",
      notes: t.TICKET_NOTES ?? "",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.customerId || !form.deviceId || !form.issue.trim()) {
      toast.error("CUSTOMER + DEVICE + ISSUE REQUIRED");
      return;
    }

    const payload = {
      device_id: form.deviceId,
      cust_id: form.customerId,
      issue: form.issue,
      priority: form.priority,
      estimatedcost: form.estimatedCost || undefined,
      estimatedcompletetime: form.estimatedCompleteTime || undefined,
      notes: form.notes || undefined,
    };

    try {
      if (editing) {
        await updateTicket(editing.TICKET_ID, { ...payload, status: form.status });
        toast.success("TICKET UPDATED");
      } else {
        await createTicket(payload);
        toast.success("TICKET LOGGED // QUEUE OPEN");
      }
      setForm(blankForm);
      setEditing(null);
      setOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save ticket");
    }
  };

  const removeTicket = async (t: TicketRow) => {
    try {
      await deleteTicketApi(t.TICKET_ID);
      toast.success(`TICKET ${t.TICKET_ID.toUpperCase()} REMOVED`);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete ticket");
    }
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
          {["all", ...TICKET_STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`brutal-border px-3 py-2 font-display uppercase text-[11px] tracking-widest ${status === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <Empty>Loading tickets…</Empty>
      ) : filtered.length === 0 ? (
        <Empty>No tickets in this view.</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => {
            const cus = customers.find(c => c.CUST_ID === t.CUST_ID);
            const dev = devices.find(d => d.DEVICE_ID === t.DEVICE_ID);
            const statusTone =
              t.TICKET_STATUS === "Completed" ? "navy" :
              t.TICKET_STATUS === "Approved" ? "yellow" :
              t.TICKET_STATUS === "In Progress" ? "ink" :
              t.TICKET_STATUS === "Cancelled" ? "muted" : "red";
            return (
              <Block key={t.TICKET_ID} className="p-4 brutal-shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px]">#{t.TICKET_ID.toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.TICKET_PRIORITYLEVEL === "High" || t.TICKET_PRIORITYLEVEL === "Urgent" ? "red" : "muted"}>{t.TICKET_PRIORITYLEVEL}</Badge>
                    <RowActions onEdit={() => openEdit(t)} onDelete={() => removeTicket(t)} />
                  </div>
                </div>
                <div className="cursor-pointer" onClick={() => setSelected(t)}>
                  <h3 className="font-display text-lg uppercase mt-2 leading-tight">{t.TICKET_ISSUE}</h3>
                  <div className="font-mono text-xs mt-2 text-muted-foreground">
                    {cus ? `${cus.CUST_FNAME} ${cus.CUST_LNAME}` : "—"} · {dev?.DEVICE_BRAND} {dev?.DEVICE_MODEL}
                  </div>
                  <div className="font-mono text-[10px] uppercase mt-1">Filed {t.TICKET_DATE}</div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t-2 border-ink pt-2">
                  <span className="font-mono text-[10px] uppercase opacity-70">Status</span>
                  <Badge tone={statusTone as any}>{t.TICKET_STATUS}</Badge>
                </div>
              </Block>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Ticket · ${editing.TICKET_ID.toUpperCase()}` : "New Ticket Intake"}>
        <div className="space-y-3">
          <Field label="Customer">
            <Combobox
              value={form.customerId}
              onChange={v => setForm({ ...form, customerId: v, deviceId: "" })}
              options={customers.map(c => ({ id: c.CUST_ID, label: `${c.CUST_FNAME} ${c.CUST_LNAME}`, meta: c.CUST_PHONENUMBER }))}
              placeholder="SEARCH CUSTOMER"
            />
          </Field>
          <Field label="Device">
            <Combobox
              value={form.deviceId}
              onChange={v => setForm({ ...form, deviceId: v })}
              options={cusDevices.map(d => ({ id: d.DEVICE_ID, label: `${d.DEVICE_BRAND} ${d.DEVICE_MODEL}`, meta: d.DEVICE_SERIALNUMBER }))}
              placeholder={form.customerId ? "SEARCH DEVICE" : "SELECT CUSTOMER FIRST"}
              disabled={!form.customerId}
            />
          </Field>
          <Field label="Issue Description">
            <textarea rows={3} className={inputCls} value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            {editing && (
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated Cost (RM)">
              <input type="number" step="0.01" className={inputCls} value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} />
            </Field>
            <Field label="Estimated Completion">
              <input type="date" className={inputCls} value={form.estimatedCompleteTime} onChange={e => setForm({ ...form, estimatedCompleteTime: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={submit}>{editing ? "Save Changes" : "Log Ticket"}</Btn>
          </div>
        </div>
      </Modal>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `Ticket ${selected.TICKET_ID.toUpperCase()}` : ""}>
        {selected && (() => {
          const cus = customers.find(c => c.CUST_ID === selected.CUST_ID);
          const dev = devices.find(d => d.DEVICE_ID === selected.DEVICE_ID);
          return (
            <div className="space-y-4">
              <Block className="p-4 bg-primary text-primary-foreground">
                <p className="font-mono text-[10px] uppercase tracking-widest">PRIORITY · {selected.TICKET_PRIORITYLEVEL}</p>
                <h3 className="font-display text-2xl uppercase leading-tight mt-1">{selected.TICKET_ISSUE}</h3>
              </Block>
              <Block className="p-4">
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div><span className="opacity-60 uppercase text-[10px]">Customer</span><br/>{cus ? `${cus.CUST_FNAME} ${cus.CUST_LNAME}` : "—"}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Phone</span><br/>{cus?.CUST_PHONENUMBER}</div>
                  <div className="col-span-2"><span className="opacity-60 uppercase text-[10px]">Device</span><br/>{dev?.DEVICE_BRAND} {dev?.DEVICE_MODEL} · {dev?.DEVICE_SERIALNUMBER}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Status</span><br/><Badge tone="red">{selected.TICKET_STATUS}</Badge></div>
                  <div><span className="opacity-60 uppercase text-[10px]">Filed</span><br/>{selected.TICKET_DATE}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Est. Cost</span><br/>{selected.TICKET_ESTIMATEDCOST != null ? `RM ${selected.TICKET_ESTIMATEDCOST}` : "—"}</div>
                  <div><span className="opacity-60 uppercase text-[10px]">Est. Completion</span><br/>{selected.TICKET_ESTIMATEDCOMPLETETIME ?? "—"}</div>
                </div>
              </Block>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}