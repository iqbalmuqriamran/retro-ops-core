import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, type Invoice } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Badge, Empty } from "@/components/brutalist";
import { Receipt, Search } from "lucide-react";

export const Route = createFileRoute("/app/finance")({
  component: FinancePage,
});

const METHODS: Invoice["method"][] = ["Cash", "Card", "E-Wallet"];

function FinancePage() {
  const { invoices, customers, jobs, parts, services, update } = useStore();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return invoices
      .filter(i => {
        const cus = customers.find(c => c.id === i.customerId);
        return !s || i.id.includes(s) || cus?.name.toLowerCase().includes(s);
      })
      .slice()
      .sort((a, b) => ((b.paidAt ?? b.createdAt) ?? "").localeCompare((a.paidAt ?? a.createdAt) ?? ""));
  }, [invoices, q, customers]);

  const totals = {
    paid: invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.total, 0),
    unpaid: invoices.filter(i => i.status === "Unpaid").reduce((s, i) => s + i.total, 0),
    count: invoices.length,
  };

  const settle = (id: string, method: NonNullable<Invoice["method"]>) => {
    update("invoices", prev => prev.map(i => i.id === id ? { ...i, status: "Paid", method, paidAt: new Date().toISOString().slice(0, 10) } : i));
    toast.success(`INVOICE ${id.toUpperCase()} // PAID · ${method.toUpperCase()}`);
  };

  const selected = invoices.find(i => i.id === selectedId);
  const sCus = customers.find(c => c.id === selected?.customerId);
  const sJob = jobs.find(j => j.id === selected?.jobId);

  return (
    <div>
      <PageHeader eyebrow="Sector 07 · Finance" title="Billing & Ledger" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Block className="p-4 bg-ink text-cream brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Settled</p>
          <div className="font-display text-4xl mt-2">RM{totals.paid}</div>
        </Block>
        <Block className="p-4 bg-primary text-primary-foreground brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-90">Outstanding</p>
          <div className="font-display text-4xl mt-2">RM{totals.unpaid}</div>
        </Block>
        <Block className="p-4 bg-accent brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest">Total Invoices</p>
          <div className="font-display text-4xl mt-2">{totals.count}</div>
        </Block>
      </div>

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 ml-2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH INVOICES" className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2" />
      </Block>

      {filtered.length === 0 ? <Empty>No invoices.</Empty> : (
        <Block className="overflow-hidden brutal-shadow-sm">
          <table className="w-full">
            <thead className="bg-ink text-cream">
              <tr className="text-left font-display text-[11px] uppercase tracking-widest">
                <th className="p-3">Invoice</th><th className="p-3">Customer</th><th className="p-3 hidden md:table-cell">Date</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Status</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const cus = customers.find(c => c.id === i.customerId);
                return (
                  <tr key={i.id} className="border-t-2 border-ink hover:bg-accent transition-colors">
                    <td className="p-3 font-mono text-xs">#{i.id.toUpperCase()}</td>
                    <td className="p-3 font-display uppercase text-sm">{cus?.name ?? "—"}</td>
                    <td className="p-3 font-mono text-xs hidden md:table-cell">{i.paidAt ?? i.createdAt}</td>
                    <td className="p-3 font-display text-right">RM{i.total}</td>
                    <td className="p-3 text-right">
                      <Badge tone={i.status === "Paid" ? "navy" : "red"}>{i.status}{i.method ? ` · ${i.method}` : ""}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <button onClick={() => setSelectedId(i.id)} className="brutal-border bg-card px-2 py-1 font-display text-[10px] uppercase">View</button>
                        {i.status === "Unpaid" && METHODS.map(m => (
                          <button key={m} onClick={() => settle(i.id, m!)} className="brutal-border bg-primary text-primary-foreground px-2 py-1 font-display text-[10px] uppercase">{m}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Block>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Receipt" width={480}>
        {selected && (
          <div className="bg-ink text-accent font-mono text-xs p-5 brutal-border">
            <div className="text-center border-b border-dashed border-accent/50 pb-3">
              <div className="font-display text-2xl uppercase text-cream">GADGETS WORLD 666</div>
              <div className="text-[10px] uppercase opacity-80">SHAH ALAM BRANCH · TAX REG #GW666-SA</div>
            </div>
            <div className="py-3 border-b border-dashed border-accent/50 space-y-1">
              <div>RECEIPT  : #{selected.id.toUpperCase()}</div>
              <div>DATE     : {selected.paidAt ?? selected.createdAt}</div>
              <div>CUSTOMER : {sCus?.name}</div>
              <div>JOB REF  : #{selected.jobId.toUpperCase()}</div>
              <div>STATUS   : <span className="text-cream">{selected.status} {selected.method ? `· ${selected.method}` : ""}</span></div>
            </div>
            <div className="py-3 border-b border-dashed border-accent/50 space-y-1">
              {sJob && (
                <>
                  {(() => {
                    const sv = services.find(s => s.id === sJob.serviceId);
                    return sv ? <div className="flex justify-between"><span>SVC · {sv.name.toUpperCase()}</span><span>RM{sv.basePrice}</span></div> : null;
                  })()}
                  {sJob.partLines.map(pl => {
                    const p = parts.find(pp => pp.id === pl.partId); if (!p) return null;
                    return <div key={pl.partId} className="flex justify-between"><span>PRT · {p.name.toUpperCase()} ×{pl.qty}</span><span>RM{p.price * pl.qty}</span></div>;
                  })}
                </>
              )}
            </div>
            <div className="py-3 space-y-1">
              <div className="flex justify-between"><span>SUBTOTAL</span><span>RM{selected.subtotal}</span></div>
              <div className="flex justify-between"><span>SST 6%</span><span>RM{selected.tax}</span></div>
              <div className="flex justify-between text-cream font-display text-base border-t border-accent/50 pt-2"><span>TOTAL</span><span>RM{selected.total}</span></div>
            </div>
            <div className="text-center text-[10px] opacity-80 border-t border-dashed border-accent/50 pt-3">
              ▼ THANK YOU // POWER ON ▼<br/>NO RETURNS WITHOUT RECEIPT
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <Btn variant="ghost" onClick={() => setSelectedId(null)}>Close</Btn>
          <Btn variant="primary" onClick={() => { window.print(); }}>Print</Btn>
        </div>
      </Modal>
    </div>
  );
}
