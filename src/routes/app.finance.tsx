import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Badge, Empty } from "@/components/brutalist";
import { Search } from "lucide-react";
import {
  fetchInvoices,
  fetchStaffList,
  fetchPaymentInfo,
  settleInvoice,
  PAYMENT_METHODS,
  type InvoiceRow,
  type StaffRow,
  type PaymentInfo,
} from "@/lib/api/finance";

export const Route = createFileRoute("/app/finance")({
  component: FinancePage,
});

function FinancePage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffRow[]>([]);

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);

  const [settleModalId, setSettleModalId] = useState<string | null>(null);
  const [settleStaffId, setSettleStaffId] = useState("");
  const [settleMethod, setSettleMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [settling, setSettling] = useState(false);

  const loadInvoices = () => {
    setLoading(true);
    fetchInvoices()
      .then(setInvoices)
      .catch((err) => toast.error(err.message ?? "Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
    fetchStaffList()
      .then(setStaff)
      .catch(() => {
        // non-fatal; settle modal just won't have a staff list
      });
  }, []);

      const filtered = useMemo(() => {
      const s = q.toLowerCase();
      return invoices
        .filter((i) => {
          const name = `${i.CUST_FNAME} ${i.CUST_LNAME}`.toLowerCase();
          return !s || i.INVOICE_ID.toLowerCase().includes(s) || name.includes(s);
        })
        .slice()
        .sort((a, b) => new Date(b.INVOICE_DATE ?? 0).getTime() - new Date(a.INVOICE_DATE ?? 0).getTime());
    }, [invoices, q]);

  const totals = {
    paid: invoices.filter((i) => i.INVOICE_STATUS === "Paid").reduce((s, i) => s + i.INVOICE_TOTALAMOUNT, 0),
    unpaid: invoices.filter((i) => i.INVOICE_STATUS === "Unpaid").reduce((s, i) => s + i.INVOICE_TOTALAMOUNT, 0),
    count: invoices.length,
  };

  const selected = invoices.find((i) => i.INVOICE_ID === selectedId);

  const openView = (i: InvoiceRow) => {
    setSelectedId(i.INVOICE_ID);
    setPayment(null);
    if (i.INVOICE_STATUS === "Paid") {
      fetchPaymentInfo(i.INVOICE_ID)
        .then(setPayment)
        .catch(() => {
          // non-fatal, receipt section just won't show payment details
        });
    }
  };

  const openSettle = (i: InvoiceRow) => {
    setSettleModalId(i.INVOICE_ID);
    setSettleStaffId(staff[0]?.STAFF_ID ?? "");
    setSettleMethod(PAYMENT_METHODS[0]);
  };

  const confirmSettle = async () => {
    if (!settleModalId || !settleStaffId) {
      toast.error("SELECT STAFF MEMBER");
      return;
    }
    setSettling(true);
    try {
      await settleInvoice(settleModalId, settleStaffId, settleMethod);
      toast.success(`INVOICE ${settleModalId.toUpperCase()} // PAID · ${settleMethod.toUpperCase()}`);
      setSettleModalId(null);
      loadInvoices();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to settle invoice");
    } finally {
      setSettling(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Sector 07 · Finance" title="Billing & Ledger" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Block className="p-4 bg-ink text-cream brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Settled</p>
          <div className="font-display text-4xl mt-2">RM{totals.paid.toFixed(2)}</div>
        </Block>
        <Block className="p-4 bg-primary text-primary-foreground brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-90">Outstanding</p>
          <div className="font-display text-4xl mt-2">RM{totals.unpaid.toFixed(2)}</div>
        </Block>
        <Block className="p-4 bg-accent brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest">Total Invoices</p>
          <div className="font-display text-4xl mt-2">{totals.count}</div>
        </Block>
      </div>

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 ml-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH INVOICES"
          className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2"
        />
      </Block>

      {loading ? (
        <Empty>Loading invoices…</Empty>
      ) : filtered.length === 0 ? (
        <Empty>No invoices.</Empty>
      ) : (
        <Block className="overflow-hidden brutal-shadow-sm">
          <table className="w-full">
            <thead className="bg-ink text-cream">
              <tr className="text-left font-display text-[11px] uppercase tracking-widest">
                <th className="p-3">Invoice</th>
                <th className="p-3">Customer</th>
                <th className="p-3 hidden md:table-cell">Date</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.INVOICE_ID} className="border-t-2 border-ink hover:bg-accent transition-colors">
                  <td className="p-3 font-mono text-xs">#{i.INVOICE_ID}</td>
                  <td className="p-3 font-display uppercase text-sm">
                    {i.CUST_FNAME} {i.CUST_LNAME}
                  </td>
                  <td className="p-3 font-mono text-xs hidden md:table-cell">{i.INVOICE_DATE}</td>
                  <td className="p-3 font-display text-right">RM{i.INVOICE_TOTALAMOUNT.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <Badge tone={i.INVOICE_STATUS === "Paid" ? "navy" : "red"}>{i.INVOICE_STATUS}</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <button
                        onClick={() => openView(i)}
                        className="brutal-border bg-card px-2 py-1 font-display text-[10px] uppercase"
                      >
                        View
                      </button>
                      {i.INVOICE_STATUS === "Unpaid" && (
                        <button
                          onClick={() => openSettle(i)}
                          className="brutal-border bg-primary text-primary-foreground px-2 py-1 font-display text-[10px] uppercase"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}

      {/* Settle modal - pick staff + payment method */}
      <Modal open={!!settleModalId} onClose={() => setSettleModalId(null)} title="Settle Invoice">
        <div className="space-y-3">
          <Field label="Processed By">
            <select className={inputCls} value={settleStaffId} onChange={(e) => setSettleStaffId(e.target.value)}>
              {staff.length === 0 && <option value="">No staff loaded</option>}
              {staff.map((s) => (
                <option key={s.STAFF_ID} value={s.STAFF_ID}>
                  {s.STAFF_FNAME} {s.STAFF_LNAME} ({s.STAFF_ROLE})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Payment Method">
            <select className={inputCls} value={settleMethod} onChange={(e) => setSettleMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setSettleModalId(null)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={confirmSettle} disabled={settling}>
              {settling ? "Processing…" : "Confirm Payment"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Receipt view */}
      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Receipt" width={480}>
        {selected && (
          <div className="bg-ink text-accent font-mono text-xs p-5 brutal-border">
            <div className="text-center border-b border-dashed border-accent/50 pb-3">
              <div className="font-display text-2xl uppercase text-cream">GADGETS WORLD 666</div>
              <div className="text-[10px] uppercase opacity-80">SHAH ALAM BRANCH · TAX REG #GW666-SA</div>
            </div>
            <div className="py-3 border-b border-dashed border-accent/50 space-y-1">
              <div>INVOICE  : #{selected.INVOICE_ID}</div>
              <div>DATE     : {selected.INVOICE_DATE}</div>
              <div>CUSTOMER : {selected.CUST_FNAME} {selected.CUST_LNAME}</div>
              <div>DEVICE   : {selected.DEVICE_BRAND} {selected.DEVICE_MODEL}</div>
              <div>TICKET   : #{selected.TICKET_ID}</div>
              <div>
                STATUS   :{" "}
                <span className="text-cream">
                  {selected.INVOICE_STATUS}
                  {payment ? ` · ${payment.PAYMENT_METHOD}` : ""}
                </span>
              </div>
              {payment && (
                <>
                  <div>RECEIPT  : {payment.RECEIPT_NUMBER}</div>
                  <div>
                    CASHIER  : {payment.STAFF_FNAME} {payment.STAFF_LNAME}
                  </div>
                </>
              )}
            </div>
            <div className="py-3 border-b border-dashed border-accent/50 space-y-1">
              <div className="flex justify-between">
                <span>LABOR</span>
                <span>RM{selected.JOB_TOTALLABORCOST.toFixed(2)}</span>
              </div>
              {selected.SERVICES_TOTAL > 0 && (
                <div className="flex justify-between">
                  <span>SERVICES</span>
                  <span>RM{selected.SERVICES_TOTAL.toFixed(2)}</span>
                </div>
              )}
              {selected.PARTS_TOTAL > 0 && (
                <div className="flex justify-between">
                  <span>PARTS</span>
                  <span>RM{selected.PARTS_TOTAL.toFixed(2)}</span>
                </div>
              )}
              {selected.JOB_DIAGNOSIS && <div className="opacity-70 mt-1">DIAGNOSIS: {selected.JOB_DIAGNOSIS}</div>}
            </div>
            <div className="py-3 space-y-1">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span>RM{selected.INVOICE_SUBTOTAL.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SST 6%</span>
                <span>RM{selected.INVOICE_TAX.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-cream font-display text-base border-t border-accent/50 pt-2">
                <span>TOTAL</span>
                <span>RM{selected.INVOICE_TOTALAMOUNT.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center text-[10px] opacity-80 border-t border-dashed border-accent/50 pt-3">
              ▼ THANK YOU // POWER ON ▼<br />NO RETURNS WITHOUT RECEIPT
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <Btn variant="ghost" onClick={() => setSelectedId(null)}>
            Close
          </Btn>
          <Btn
            variant="primary"
            onClick={() => {
              window.print();
            }}
          >
            Print
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
