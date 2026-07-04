import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Block, Badge, Modal } from "@/components/brutalist";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip } from "recharts";
import { Activity, AlertTriangle, Wallet, TicketIcon as TI, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const MONTHLY = [
  { m: "JAN", v: 18 }, { m: "FEB", v: 24 }, { m: "MAR", v: 31 },
  { m: "APR", v: 27 }, { m: "MAY", v: 38 }, { m: "JUN", v: 44 },
];

function Dashboard() {
  const { tickets, jobs, parts, invoices, services } = useStore();
  const [chartOpen, setChartOpen] = useState<null | "bar" | "pie">(null);
  const navigate = useNavigate();
  const activeJobs = jobs.filter(j => j.status !== "Completed").length;
  const pending = tickets.filter(t => t.status === "Open" || t.status === "Diagnosing").length;
  const lowStock = parts.filter(p => p.stock <= p.lowStock).length;
  const today = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.total, 0);

  const revenueByService = useMemo(() => services.map((s, idx) => ({
    name: s.name.split(" ")[0],
    v: Math.round(s.basePrice * (3 + idx)),
  })), [services]);

  const COLORS = ["var(--blood)", "var(--ink)", "var(--industrial)", "var(--navy)", "#888"];

  const latestTickets = useMemo(
    () => tickets.slice().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 5),
    [tickets]
  );

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

  return (
    <div>
      <PageHeader eyebrow="Sector 01 · Overview" title="Operations Console" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Activity} label="Active Jobs" value={activeJobs} tone="ink" onClick={() => navigate({ to: "/app/workshop" })} />
        <Stat icon={TI} label="Pending Tickets" value={pending} tone="red" onClick={() => navigate({ to: "/app/tickets" })} />
        <Stat icon={AlertTriangle} label="Low Stock Parts" value={lowStock} tone="yellow" onClick={() => navigate({ to: "/app/inventory" })} />
        <Stat icon={Wallet} label="Revenue Settled" value={`RM${today}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block onClick={() => setChartOpen("bar")} className="lg:col-span-2 p-5 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 01</p>
              <h3 className="font-display text-xl uppercase">Monthly Repairs</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="red">YTD</Badge>
              <Maximize2 className="w-4 h-4 opacity-60" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MONTHLY}>
              <XAxis dataKey="m" tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
              <YAxis tick={{ fill: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11 }} axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }} tickLine={false} />
              <Bar dataKey="v">
                {MONTHLY.map((_, i) => <Cell key={i} fill={i === MONTHLY.length - 1 ? "var(--blood)" : "var(--ink)"} stroke="var(--ink)" strokeWidth={2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-70">▶ Click chart for detail breakdown</div>
        </Block>

        <Block onClick={() => setChartOpen("pie")} className="p-5 brutal-shadow-sm cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 02</p>
              <h3 className="font-display text-xl uppercase mb-2">Revenue Breakdown</h3>
            </div>
            <Maximize2 className="w-4 h-4 opacity-60" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={revenueByService} dataKey="v" nameKey="name" innerRadius={40} outerRadius={80} stroke="var(--ink)" strokeWidth={2}>
                {revenueByService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {revenueByService.map((r, i) => (
              <div key={r.name} className="flex justify-between font-mono text-[11px] uppercase">
                <span className="flex items-center gap-2"><span className="w-3 h-3 border border-ink" style={{ background: COLORS[i % COLORS.length] }} />{r.name}</span>
                <span>RM{r.v}</span>
              </div>
            ))}
          </div>
        </Block>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Block className="p-5 brutal-shadow-sm">
          <h3 className="font-display text-lg uppercase mb-3 border-b-4 border-ink pb-2">Latest Tickets</h3>
          <div className="space-y-2">
            {latestTickets.map(t => (
              <div key={t.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center brutal-border p-2.5 bg-background">
                <span className="font-mono text-[11px]">#{t.id.toUpperCase()}</span>
                <span className="font-mono text-xs truncate">{t.issue}</span>
                <Badge tone={t.priority === "High" ? "red" : "muted"}>{t.priority}</Badge>
              </div>
            ))}
          </div>
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-ink text-cream">
          <h3 className="font-display text-lg uppercase mb-3 border-b-4 border-cream pb-2">System Bulletin</h3>
          <ul className="space-y-2 font-mono text-xs">
            <li>► {lowStock} part(s) below threshold — restock advised.</li>
            <li>► {pending} ticket(s) awaiting diagnosis assignment.</li>
            <li>► {invoices.filter(i => i.status === "Unpaid").length} invoice(s) pending settlement.</li>
            <li>► Branch up-time: 99.6% · last sync {new Date().toLocaleTimeString()}.</li>
          </ul>
        </Block>
      </div>
    </div>
  );
}
