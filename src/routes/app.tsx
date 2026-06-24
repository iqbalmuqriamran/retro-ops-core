import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import {
  LayoutGrid, Users, Ticket as TicketIcon, Wrench, Package, BookOpen,
  Receipt, LogOut, Menu, Power, RefreshCcw,
} from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/app/customers", label: "Customers", icon: Users },
  { to: "/app/tickets", label: "Tickets", icon: TicketIcon },
  { to: "/app/workshop", label: "Workshop", icon: Wrench },
  { to: "/app/inventory", label: "Inventory", icon: Package },
  { to: "/app/services", label: "Services", icon: BookOpen },
  { to: "/app/finance", label: "Finance", icon: Receipt },
] as const;

function AppLayout() {
  const { user, logout, reset } = useStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [open, setOpen] = useState(true);

  useEffect(() => { if (!user) navigate({ to: "/" }); }, [user, navigate]);
  if (!user) return null;

  const sidebarW = open ? 260 : 72;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="sticky top-0 h-screen bg-ink text-cream flex flex-col border-r-4 border-ink overflow-hidden"
      >
        {/* Top brand + toggle */}
        <div className="border-b-4 border-cream/20 p-3 flex items-center gap-3">
          <button
            onClick={() => setOpen(o => !o)}
            className="shrink-0 w-12 h-12 grid place-items-center bg-primary text-primary-foreground brutal-border border-cream hover:bg-accent hover:text-ink transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <div className="font-display text-lg uppercase leading-none truncate">GW <span className="text-primary">666</span></div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">Shah Alam Branch</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV.map(item => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to) && item.to !== "/app";
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-3 brutal-border border-transparent font-display uppercase text-sm tracking-wider transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-cream"
                    : "hover:bg-cream/10 hover:border-cream/30"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="truncate"
                    >{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {active && open && <span className="ml-auto w-2 h-2 bg-accent" />}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="border-t-4 border-cream/20 p-3 space-y-2">
          {open ? (
            <div className="brutal-border border-cream/40 bg-cream/5 p-3">
              <div className="font-display text-xs uppercase text-accent">{user.role}</div>
              <div className="font-mono text-xs truncate">{user.name}</div>
            </div>
          ) : (
            <div className="w-12 h-12 grid place-items-center bg-cream text-ink font-display text-base">
              {user.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={reset} title="Reset demo data" className="flex-1 brutal-border border-cream/40 py-2 grid place-items-center hover:bg-accent hover:text-ink">
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button onClick={() => { logout(); navigate({ to: "/" }); }} title="Sign out" className="flex-1 brutal-border border-cream/40 py-2 grid place-items-center hover:bg-primary">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-cream border-b-4 border-ink px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-3 h-3 bg-primary shrink-0" />
            <div className="w-3 h-3 bg-accent shrink-0" />
            <span className="font-mono text-xs uppercase tracking-widest truncate">CONSOLE // {pathname}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block font-mono text-[11px] uppercase tracking-widest">
              <span className="text-primary">●</span> LIVE · {new Date().toLocaleDateString("en-GB")}
            </div>
            <div className="font-display text-xs uppercase bg-ink text-cream px-3 py-1.5 flex items-center gap-2">
              <Power className="w-3 h-3 text-primary" /> {user.role}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
