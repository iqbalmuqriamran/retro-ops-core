import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Badge, Modal, Empty } from "@/components/brutalist";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from "recharts";
import { Activity, AlertTriangle, Wallet, TicketIcon as TI, Maximize2 } from "lucide-react";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import { fetchTickets, type TicketRow } from "@/lib/api/tickets";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const COLORS = ["var(--blood)", "var(--ink)", "var(--industrial)", "var(--navy)", "#888"];

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartOpen, setChartOpen] = useState<null | "bar" | "pie">(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDashboardStats(), fetchTickets()])
      .then(([s, t]) => { setStats(s); setTickets(t); })
      .catch((err) => toast.error(err.message ?? "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const latestTickets = useMemo(
  () => tickets.slice().sort((a, b) => new Date(b.TICKET_DATE ?? 0).getTime() - new Date(a.TICKET_DATE ?? 0).getTime()).slice(0, 5),
  [tickets]
);

  const monthlyRevenue = stats?.monthlyRevenue ?? [];
  const serviceBreakdown = stats?.serviceBreakdown ?? [];
  const monthlyTotal = monthlyRevenue.reduce((s, m) => s + m.NET_REVENUE, 0);
  const peakMonth = monthlyRevenue.length
    ? monthlyRevenue.reduce((a, b) => (a.NET_REVENUE > b.NET_REVENUE ? a : b))
    : null;
  const serviceTotal = serviceBreakdown.reduce((s, r) => s + r.TOTAL_SERVICE_VALUE, 0) || 1;

  const Stat = ({ icon: Icon, label, value, tone, onClick }: any) => (
    <Block
      onClick={onClick}
      className={`p-5 ${tone === "red" ? "bg-primary text-primary-foreground" : tone === "yellow" ? "bg-accent" : tone === "ink" ? "bg-ink text-cream" : ""} brutal-shadow-sm ${onClick ? "cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">{label}</p>
        <Icon className="w-5 h-5 shrink-0" />
      </div>
      <div className="font-display text-5xl mt-3 leading-none">{value}</div>
      <div className="mt-3 h-1 w-12 bg-current opacity-60" />
      {onClick && <div className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-70">▶ OPEN MODULE</div>}
    </Block>
  );

  if (loading || !stats) {
    return (
      <div>
        <PageHeader eyebrow="Sector 01 · Overview" title="Operations Console" />
        <Empty>Loading dashboard…</Empty>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Sector 01 · Overview" title="Operations Console" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Activity} label="Active Jobs" value={stats.activeJobs} tone="ink" onClick={() => navigate({ to: "/app/workshop" })} />
        <Stat icon={TI} label="Pending Tickets" value={stats.pendingTickets} tone="red" onClick={() => navigate({ to: "/app/tickets" })} />
        <Stat icon={AlertTriangle} label="Low Stock Parts" value={stats.lowStockParts} tone="yellow" onClick={() => navigate({ to: "/app/inventory" })} />
        <Stat icon={Wallet} label="Revenue Settled" value={`RM${stats.revenueSettled}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block onClick={() => setChartOpen("bar")} className="lg:col-span-2 p-5 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 01</p>
              <h3 className="font-display text-xl uppercase">Monthly Revenue</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="red">YTD</Badge>
              <Maximize2 className="w-4 h-4 opacity-60" />
            </div>
          </div>
          {monthlyRevenue.length === 0 ? (
            <Empty>No completed payments yet.</Empty>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue}>
                <XAxis dataKey="MONTH_LABEL" tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
                <YAxis tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
                <Bar dataKey="NET_REVENUE">
                  {monthlyRevenue.map((_, i) => <Cell key={i} fill={i === monthlyRevenue.length - 1 ? "var(--blood)" : "var(--ink)"} stroke="var(--ink)" strokeWidth={2} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-70">▶ Click chart for detail breakdown</div>
        </Block>

        <Block onClick={() => setChartOpen("pie")} className="p-5 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 02</p>
              <h3 className="font-display text-xl uppercase mb-2">Revenue By Service</h3>
            </div>
            <Maximize2 className="w-4 h-4 opacity-60" />
          </div>
          {serviceBreakdown.length === 0 ? (
            <Empty>No completed jobs with services yet.</Empty>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={serviceBreakdown} dataKey="TOTAL_SERVICE_VALUE" nameKey="SERVICE_NAME" innerRadius={40} outerRadius={80} stroke="var(--ink)" strokeWidth={2}>
                    {serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {serviceBreakdown.map((r, i) => (
                  <div key={r.SERVICE_NAME} className="flex justify-between font-mono text-[11px] uppercase">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 border border-ink" style={{ background: COLORS[i % COLORS.length] }} />{r.SERVICE_NAME}</span>
                    <span>RM{r.TOTAL_SERVICE_VALUE}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Block>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Block className="p-5 brutal-shadow-sm">
          <h3 className="font-display text-lg uppercase mb-3 border-b-4 border-ink pb-2">Latest Tickets</h3>
          {latestTickets.length === 0 ? (
            <Empty>No tickets yet.</Empty>
          ) : (
            <div className="space-y-2">
              {latestTickets.map(t => {
                const isPriority = t.TICKET_PRIORITYLEVEL === "High" || t.TICKET_PRIORITYLEVEL === "Urgent";
                return (
                  <div key={t.TICKET_ID} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center brutal-border p-2.5 bg-background">
                    <span className="font-mono text-[11px]">#{t.TICKET_ID.toUpperCase()}</span>
                    <span className="font-mono text-xs truncate">{t.TICKET_ISSUE}</span>
                    <Badge tone={isPriority ? "red" : "muted"}>{t.TICKET_PRIORITYLEVEL}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-ink text-cream">
          <h3 className="font-display text-lg uppercase mb-3 border-b-4 border-cream pb-2">System Bulletin</h3>
          <ul className="space-y-2 font-mono text-xs">
            <li>► {stats.lowStockParts} part(s) below threshold — restock advised.</li>
            <li>► {stats.pendingTickets} ticket(s) awaiting workshop pickup.</li>
            <li>► {stats.unpaidInvoices} invoice(s) pending settlement.</li>
            <li>► Branch up-time: 99.6% · last sync {new Date().toLocaleTimeString()}.</li>
          </ul>
        </Block>
      </div>

      <Modal open={chartOpen === "bar"} onClose={() => setChartOpen(null)} title="Monthly Revenue · Detail Breakdown" width={720}>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyRevenue}>
              <XAxis dataKey="MONTH_LABEL" tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
              <YAxis tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--ink)", color: "var(--cream)", border: "2px solid var(--blood)", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase" }} />
              <Bar dataKey="NET_REVENUE">
                {monthlyRevenue.map((_, i) => <Cell key={i} fill={i === monthlyRevenue.length - 1 ? "var(--blood)" : "var(--ink)"} stroke="var(--ink)" strokeWidth={2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2">
            {monthlyRevenue.map(m => (
              <div key={m.SORT_KEY} className="brutal-border bg-background p-3 text-center">
                <div className="font-mono text-[10px] uppercase opacity-70">{m.MONTH_LABEL}</div>
                <div className="font-display text-2xl">RM{m.NET_REVENUE}</div>
              </div>
            ))}
          </div>
          {peakMonth && (
            <div className="brutal-border p-3 bg-ink text-cream font-mono text-xs uppercase">
              ▶ YTD Total: RM{monthlyTotal} · Peak: {peakMonth.MONTH_LABEL} (RM{peakMonth.NET_REVENUE})
            </div>
          )}
        </div>
      </Modal>

      <Modal open={chartOpen === "pie"} onClose={() => setChartOpen(null)} title="Revenue By Service · Detail" width={640}>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={serviceBreakdown} dataKey="TOTAL_SERVICE_VALUE" nameKey="SERVICE_NAME" innerRadius={60} outerRadius={110} stroke="var(--ink)" strokeWidth={2} label>
                {serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--ink)", color: "var(--cream)", border: "2px solid var(--blood)", fontFamily: "var(--font-mono)", fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {serviceBreakdown.map((r, i) => {
              const pct = Math.round((r.TOTAL_SERVICE_VALUE / serviceTotal) * 100);
              return (
                <div key={r.SERVICE_NAME} className="brutal-border p-3 grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center">
                  <span className="w-4 h-4 border-2 border-ink" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-display uppercase text-sm">{r.SERVICE_NAME}</span>
                  <Badge tone="ink">{pct}%</Badge>
                  <span className="font-display text-lg">RM{r.TOTAL_SERVICE_VALUE}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}