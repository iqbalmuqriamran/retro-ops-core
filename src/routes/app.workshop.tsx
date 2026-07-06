import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Btn, Drawer, Field, inputCls, Badge, Empty, Combobox } from "@/components/brutalist";
import { Wrench, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { fetchTickets, type TicketRow } from "@/lib/api/tickets";
import { fetchCustomers, type CustomerRow } from "@/lib/api/customers";
import { fetchDevices, type DeviceRow } from "@/lib/api/device";
import { fetchStaff, type StaffRow } from "@/lib/api/staff";
import { fetchParts, type PartRow } from "@/lib/api/part";
import { fetchServices, type ServiceRow } from "@/lib/api/service";
import { fetchJobs, createJob as createJobApi, updateJob, closeJob as closeJobApi, JOB_STATUSES, type JobRow } from "@/lib/api/job";
import { fetchJobParts, addJobPart, updateJobPartQty, removeJobPart, type JobPartRow } from "@/lib/api/jobPart";
import { fetchJobServices, setJobService, type JobServiceRow } from "@/lib/api/jobService";

export const Route = createFileRoute("/app/workshop")({
  component: WorkshopPage,
});

const TECH_ROLES = ["Technician", "Branch Manager", "Owner"];
// Status buttons exclude "Completed" — that's only reachable via "Close Job" below,
// since closing also finalizes the ticket + invoice.
const STATUS_BUTTONS = JOB_STATUSES.filter(s => s !== "Completed");

function WorkshopPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [jobParts, setJobParts] = useState<JobPartRow[]>([]);
  const [jobServices, setJobServices] = useState<JobServiceRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [partPick, setPartPick] = useState("");

  const [jobForm, setJobForm] = useState({ staffId: "", diagnosis: "", action: "", status: "Pending" });

  const techs = useMemo(
    () => staff.filter(s => TECH_ROLES.includes(s.STAFF_ROLE) && s.STAFF_STATUS === "Active"),
    [staff]
  );

  const loadAll = () => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchJobs(), fetchCustomers(), fetchDevices(), fetchStaff(), fetchParts(), fetchServices()])
      .then(([t, j, c, d, s, p, sv]) => {
        setTickets(t); setJobs(j); setCustomers(c); setDevices(d); setStaff(s); setParts(p); setServices(sv);
      })
      .catch(err => toast.error(err.message ?? "Failed to load workshop data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const loadJobDetail = (jobId: string) => {
    setDetailLoading(true);
    Promise.all([fetchJobParts(jobId), fetchJobServices(jobId)])
      .then(([jp, js]) => { setJobParts(jp); setJobServices(js); })
      .catch(err => toast.error(err.message ?? "Failed to load job detail"))
      .finally(() => setDetailLoading(false));
  };

  useEffect(() => {
    if (selectedId) {
      loadJobDetail(selectedId);
    } else {
      setJobParts([]); setJobServices([]);
    }
  }, [selectedId]);

  const selected = jobs.find(j => j.JOB_ID === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setJobForm({
        staffId: selected.STAFF_ID,
        diagnosis: selected.JOB_DIAGNOSIS ?? "",
        action: selected.JOB_ACTION ?? "",
        status: selected.JOB_STATUS,
      });
    }
  }, [selected?.JOB_ID]);

  const ticketForSelected = tickets.find(t => t.TICKET_ID === selected?.TICKET_ID);
  const cus = customers.find(c => c.CUST_ID === ticketForSelected?.CUST_ID);
  const dev = devices.find(d => d.DEVICE_ID === ticketForSelected?.DEVICE_ID);

  const detailTotal = useMemo(() => {
  const partsTotal = jobParts.reduce((s, jp) => s + Number(jp.JOB_PART_TOTALPARTPRICE), 0);
  const svcTotal = jobServices.reduce(
    (s, js) => s + Number(services.find(sv => sv.SERVICE_ID === js.SERVICE_ID)?.SERVICE_BASEPRICE ?? 0),
    0
  );
  return partsTotal + svcTotal;
}, [jobParts, jobServices, services]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return jobs
      .filter(j => statusFilter === "all" || j.JOB_STATUS === statusFilter)
      .filter(j => {
        const t = tickets.find(tt => tt.TICKET_ID === j.TICKET_ID);
        return !s || j.JOB_ID.toLowerCase().includes(s) || (t?.TICKET_ISSUE.toLowerCase().includes(s));
      })
      .slice()
      .sort((a, b) => {
        const ta = tickets.find(t => t.TICKET_ID === a.TICKET_ID)?.TICKET_DATE ?? "";
        const tb = tickets.find(t => t.TICKET_ID === b.TICKET_ID)?.TICKET_DATE ?? "";
        return new Date(tb ?? 0).getTime() - new Date(ta ?? 0).getTime();
      });
  }, [jobs, tickets, q, statusFilter]);

  const openTicketsNoJob = useMemo(
    () => tickets
      .filter(t => t.TICKET_STATUS !== "Completed" && !jobs.some(j => j.TICKET_ID === t.TICKET_ID))
      .slice()
      .sort((a, b) => (b.TICKET_DATE ?? "").localeCompare(a.TICKET_DATE ?? "")),
    [tickets, jobs]
  );

  const createJob = async (ticketId: string) => {
    const defaultTech = techs[0];
    if (!defaultTech) { toast.error("NO ACTIVE TECHNICIAN AVAILABLE"); return; }
    try {
      const result = await createJobApi({ ticket_id: ticketId, staff_id: defaultTech.STAFF_ID });
      toast.success("JOB OPENED IN WORKSHOP");
      loadAll();
      setPartPick("");
      setSelectedId(result.JOB_ID);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to open job");
    }
  };

  const persistJob = async (patch: Partial<typeof jobForm>) => {
    if (!selected) return;
    const next = { ...jobForm, ...patch };
    setJobForm(next);
    try {
      await updateJob(selected.JOB_ID, { staff_id: next.staffId, diagnosis: next.diagnosis, action: next.action, status: next.status });
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update job");
    }
  };

  const addAction = (txt: string) => {
    if (!txt.trim()) return;
    const next = jobForm.action ? `${jobForm.action}\n${txt.trim()}` : txt.trim();
    persistJob({ action: next });
  };

  const addPartLine = async (partId: string) => {
    if (!selected || !partId) return;
    if (jobParts.some(jp => jp.PART_ID === partId)) {
      toast.error("PART ALREADY LINKED · ADJUST QTY");
      return;
    }
    const part = parts.find(p => p.PART_ID === partId);
    if (!part || part.PART_STOCK < 1) { toast.error("OUT OF STOCK"); return; }
    try {
      await addJobPart(selected.JOB_ID, partId, 1);
      toast.success(`PART LINKED · -1 ${part.PART_NAME.toUpperCase()}`);
      loadJobDetail(selected.JOB_ID);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to link part");
    }
  };

  const setPartQty = async (jobPartRow: JobPartRow, newQty: number) => {
    if (!selected) return;
    const clean = Math.max(1, Math.floor(newQty || 0));
    if (clean === jobPartRow.JOB_PART_QUANTITYUSED) return;
    try {
      await updateJobPartQty(jobPartRow.JOB_PART_ID, clean);
      loadJobDetail(selected.JOB_ID);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update quantity");
    }
  };

  const removePartLine = async (jobPartRow: JobPartRow) => {
    if (!selected) return;
    try {
      await removeJobPart(jobPartRow.JOB_PART_ID);
      toast.success("PART REMOVED · STOCK RETURNED");
      loadJobDetail(selected.JOB_ID);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove part");
    }
  };

  const onServiceChange = async (serviceId: string) => {
    if (!selected) return;
    try {
      await setJobService(selected.JOB_ID, serviceId || null);
      loadJobDetail(selected.JOB_ID);
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to set service");
    }
  };

  const closeJob = async () => {
    if (!selected) return;
    try {
      const result = await closeJobApi(selected.JOB_ID);
      toast.success(`JOB ${selected.JOB_ID.toUpperCase()} CLOSED // INVOICE PAID · RM${result.total}`);
      loadAll();
      loadJobDetail(selected.JOB_ID);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to close job");
    }
  };

  const currentServiceId = jobServices[0]?.SERVICE_ID ?? "";

  return (
    <div>
      <PageHeader eyebrow="Sector 04 · Workshop" title="Technician Job Floor" />

      <div className="flex gap-2 flex-wrap mb-4">
        {["all", ...STATUS_BUTTONS, "Completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`brutal-border px-3 py-2 font-display uppercase text-[11px] tracking-widest ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,1.1fr)_1fr] gap-4">
        <Block className="p-5 brutal-shadow bg-ink text-cream h-fit">
          <div className="flex items-center justify-between border-b-4 border-primary pb-3 mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">PRIORITY · QUEUE</p>
              <h3 className="font-display text-2xl uppercase leading-none mt-1">Awaiting Workshop</h3>
            </div>
            <div className="brutal-border border-cream bg-primary px-3 py-2 font-display text-lg">{openTicketsNoJob.length}</div>
          </div>
          {loading ? (
            <p className="font-mono text-xs opacity-70">Loading queue…</p>
          ) : openTicketsNoJob.length === 0 ? (
            <p className="font-mono text-xs opacity-70">▢ Queue empty. All clear.</p>
          ) : (
            <div className="space-y-3">
              {openTicketsNoJob.map(t => {
                const c = customers.find(cc => cc.CUST_ID === t.CUST_ID);
                const d = devices.find(dd => dd.DEVICE_ID === t.DEVICE_ID);
                const isPriority = t.TICKET_PRIORITYLEVEL === "High" || t.TICKET_PRIORITYLEVEL === "Urgent";
                return (
                  <div key={t.TICKET_ID} className="brutal-border border-cream bg-cream/5 p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-display uppercase text-sm leading-tight truncate">{t.TICKET_ISSUE}</div>
                        <div className="font-mono text-[10px] opacity-70 mt-1 truncate">
                          {c ? `${c.CUST_FNAME} ${c.CUST_LNAME}` : "—"} · {d?.DEVICE_BRAND} {d?.DEVICE_MODEL}
                        </div>
                      </div>
                      <Badge tone={isPriority ? "red" : "muted"}>{isPriority && <AlertTriangle className="inline w-3 h-3 mr-1" />}{t.TICKET_PRIORITYLEVEL}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[10px] opacity-60">Filed {t.TICKET_DATE}</div>
                      <button onClick={() => createJob(t.TICKET_ID)} className="brutal-border border-cream bg-primary px-3 py-1.5 font-display text-[11px] uppercase tracking-widest">
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

          {loading ? (
            <Empty>Loading jobs…</Empty>
          ) : filtered.length === 0 ? (
            <Empty>No active jobs.</Empty>
          ) : (
            <div className="space-y-3">
              {filtered.map(j => {
                const t = tickets.find(x => x.TICKET_ID === j.TICKET_ID);
                const tech = staff.find(s => s.STAFF_ID === j.STAFF_ID);
                const total = j.PARTS_TOTAL + j.SERVICES_TOTAL;
                return (
                  <Block key={j.JOB_ID} onClick={() => { setPartPick(""); setSelectedId(j.JOB_ID); }} className="p-4 brutal-shadow-sm cursor-pointer hover:bg-accent transition-colors">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center">
                      <div className="w-12 h-12 grid place-items-center bg-ink text-cream"><Wrench className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <div className="font-display uppercase truncate">{t?.TICKET_ISSUE ?? "—"}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          #{j.JOB_ID.toUpperCase()} · TECH {tech ? `${tech.STAFF_FNAME} ${tech.STAFF_LNAME}` : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge tone={j.JOB_STATUS === "Completed" ? "navy" : j.JOB_STATUS === "Failed" || j.JOB_STATUS === "Cancelled" ? "muted" : "red"}>{j.JOB_STATUS}</Badge>
                        <div className="font-display text-lg mt-1">RM{total}</div>
                      </div>
                    </div>
                  </Block>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `Job ${selected.JOB_ID.toUpperCase()}` : ""} width={640}>
        {selected && (
          <div className="space-y-4">
            <Block className="p-4 bg-accent">
              <p className="font-mono text-[10px] uppercase tracking-widest">TARGET</p>
              <div className="font-display uppercase text-lg">{cus ? `${cus.CUST_FNAME} ${cus.CUST_LNAME}` : "—"} · {dev?.DEVICE_BRAND} {dev?.DEVICE_MODEL}</div>
              <div className="font-mono text-xs">{ticketForSelected?.TICKET_ISSUE}</div>
            </Block>

            <Field label="Diagnosis Notes">
              <textarea
                rows={3}
                className={inputCls}
                value={jobForm.diagnosis}
                onChange={e => setJobForm({ ...jobForm, diagnosis: e.target.value })}
                onBlur={() => persistJob({ diagnosis: jobForm.diagnosis })}
              />
            </Field>

            <Field label="Assigned Tech">
              <Combobox
                value={jobForm.staffId}
                onChange={v => persistJob({ staffId: v })}
                options={techs.map(s => ({ id: s.STAFF_ID, label: `${s.STAFF_FNAME} ${s.STAFF_LNAME}`, meta: s.STAFF_ROLE }))}
                placeholder="SELECT TECH"
              />
            </Field>

            <Field label="Service · fee auto-loaded">
              <Combobox
                value={currentServiceId}
                onChange={onServiceChange}
                options={services.map(s => ({ id: s.SERVICE_ID, label: s.SERVICE_NAME, meta: `RM${s.SERVICE_BASEPRICE} · ${s.SERVICE_ESTIMATEDDURATION ?? "?"}h` }))}
                placeholder="SEARCH SERVICE"
                allowClear
              />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-display text-[11px] uppercase tracking-widest">Parts Consumed</div>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Auto-deducts from inventory</span>
              </div>
              <div className="space-y-2">
                {detailLoading && <div className="font-mono text-[11px] uppercase text-muted-foreground">Loading…</div>}
                {!detailLoading && jobParts.length === 0 && (
                  <div className="brutal-border bg-background p-3 font-mono text-[11px] uppercase text-muted-foreground">▢ No parts linked yet.</div>
                )}
                {jobParts.map(jp => {
                  const p = parts.find(pp => pp.PART_ID === jp.PART_ID);
                  return (
                    <div key={jp.JOB_PART_ID} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center brutal-border bg-background p-2">
                      <div className="min-w-0">
                        <div className="font-display uppercase text-xs truncate">{p?.PART_NAME ?? "—"}</div>
                        <div className="font-mono text-[10px] opacity-70">RM{jp.JOB_PART_PRICEPERUNIT} · stock {p?.PART_STOCK ?? 0}</div>
                      </div>
                      <input type="number" min={1}
                        className={`${inputCls} w-20 text-center`}
                        value={jp.JOB_PART_QUANTITYUSED}
                        onChange={e => setPartQty(jp, Number(e.target.value))}
                      />
                      <button type="button" onClick={() => removePartLine(jp)} className="brutal-border bg-primary text-primary-foreground w-9 h-9 grid place-items-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <Combobox
                  value={partPick}
                  onChange={setPartPick}
                  options={parts
                    .filter(p => !jobParts.some(jp => jp.PART_ID === p.PART_ID))
                    .map(p => ({ id: p.PART_ID, label: p.PART_NAME, meta: `RM${p.PART_UNITPRICE} · stock ${p.PART_STOCK}` }))}
                  placeholder="SEARCH PART"
                />
                <Btn variant="dark" onClick={() => { if (partPick) { addPartLine(partPick); setPartPick(""); } }}>
                  <Plus className="inline w-3 h-3 mr-1" /> Add Another Part
                </Btn>
              </div>
            </div>

            <div>
              <div className="font-display text-[11px] uppercase tracking-widest mb-1.5">Action Log</div>
              <div className="brutal-border bg-background p-3 space-y-1 max-h-40 overflow-y-auto">
                {!jobForm.action && <div className="font-mono text-[11px] uppercase text-muted-foreground">▢ No actions recorded.</div>}
                {jobForm.action.split("\n").filter(Boolean).map((a, i) => <div key={i} className="font-mono text-xs">▶ {a}</div>)}
              </div>
              <ActionAdd onAdd={addAction} />
            </div>

            <Block className="p-4 bg-ink text-cream">
              <div className="flex justify-between items-center">
                <div className="font-display uppercase text-sm">Computed Total</div>
                <div className="font-display text-3xl text-accent">RM{detailTotal}</div>
              </div>
              <div className="font-mono text-[10px] uppercase opacity-70 mt-1">Service + Σ(Part × Qty)</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STATUS_BUTTONS.map(s => (
                  <button key={s} onClick={() => persistJob({ status: s })} className={`brutal-border border-cream py-2 font-display text-[10px] uppercase ${jobForm.status === s ? "bg-primary" : ""}`}>{s}</button>
                ))}
              </div>
              {selected.JOB_STATUS !== "Completed" && (
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