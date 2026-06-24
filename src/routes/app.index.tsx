import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Block, Badge } from "@/components/brutalist";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Activity, AlertTriangle, Wallet, TicketIcon as TI } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const MONTHLY = [
  { m: "JAN", v: 18 }, { m: "FEB", v: 24 }, { m: "MAR", v: 31 },
  { m: "APR", v: 27 }, { m: "MAY", v: 38 }, { m: "JUN", v: 44 },
];

function Dashboard() {
  const { tickets, jobs, parts, invoices, services } = useStore();
  const activeJobs = jobs.filter(j => j.status !== "Completed").length;
  const pending = tickets.filter(t => t.status === "Open" || t.status === "Diagnosing").length;
  const lowStock = parts.filter(p => p.stock <= p.lowStock).length;
  const today = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.total, 0);

  const revenueByService = useMemo(() => services.map((s, idx) => ({
    name: s.name.split(" ")[0],
    v: Math.round(s.basePrice * (3 + idx)),
  })), [services]);

  const COLORS = ["var(--blood)", "var(--ink)", "var(--industrial)", "var(--navy)", "#888"];

  const Stat = ({ icon: Icon, label, value, tone }: any) => (
    <Block className={`p-5 ${tone === "red" ? "bg-primary text-primary-foreground" : tone === "yellow" ? "bg-accent" : tone === "ink" ? "bg-ink text-cream" : ""} brutal-shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">{label}</p>
        <Icon className="w-5 h-5 shrink-0" />
      </div>
      <div className="font-display text-5xl mt-3 leading-none">{value}</div>
      <div className="mt-3 h-1 w-12 bg-current opacity-60" />
    </Block>
  );

  return (
    <div>
      <PageHeader eyebrow="Sector 01 · Overview" title="Operations Console" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Activity} label="Active Jobs" value={activeJobs} tone="ink" />
        <Stat icon={TI} label="Pending Tickets" value={pending} tone="red" />
        <Stat icon={AlertTriangle} label="Low Stock Parts" value={lowStock} tone="yellow" />
        <Stat icon={Wallet} label="Revenue Settled" value={`RM${today}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Block className="lg:col-span-2 p-5 brutal-shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 01</p>
              <h3 className="font-display text-xl uppercase">Monthly Repairs</h3>
            </div>
            <Badge tone="red">YTD</Badge>
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
        </Block>

        <Block className="p-5 brutal-shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Series 02</p>
          <h3 className="font-display text-xl uppercase mb-2">Revenue Breakdown</h3>
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
            {tickets.slice(0, 5).map(t => (
              <div key={t.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center brutal-border p-2.5 bg-background">
                <span className="font-mono text-[11px]">#{t.id.toUpperCase()}</span>
                <span className="font-mono text-xs truncate">{t.issue}</span>
                <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "yellow" : "muted"}>{t.priority}</Badge>
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
