import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PRESET_USERS, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Authenticate — Gadgets World 666" },
      { name: "description", content: "Sign in to the Gadgets World 666 operations console." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@gw666.my");
  const [password, setPassword] = useState("666666");
  const [shake, setShake] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/app" }); }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = PRESET_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || password.length < 4) {
      setShake(true); setTimeout(() => setShake(false), 500);
      toast.error("ACCESS DENIED // INVALID CREDENTIALS");
      return;
    }
    login(found);
    toast.success(`AUTHENTICATED // ${found.role.toUpperCase()}`);
    navigate({ to: "/app" });
  };

  const quickLogin = (u: typeof PRESET_USERS[number]) => {
    setEmail(u.email);
    login(u);
    toast.success(`AUTHENTICATED // ${u.role.toUpperCase()}`);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Constructivist backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary rotate-12" />
        <div className="absolute top-20 right-10 w-64 h-64 brutal-border bg-accent" />
        <div className="absolute bottom-10 left-10 w-80 h-2 bg-ink" />
        <div className="absolute bottom-20 left-10 w-40 h-2 bg-ink" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-ink" />
        <div className="absolute bottom-0 right-0 w-1/3 h-12 diagonal-stripes" />
        <div className="absolute top-1/3 left-1/4 font-display text-[18rem] text-ink/5 leading-none select-none">666</div>
      </div>

      <motion.div
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="brutal-border brutal-shadow bg-card">
          {/* Header bar */}
          <div className="bg-ink text-cream px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary" />
              <div className="w-3 h-3 bg-accent" />
              <div className="w-3 h-3 bg-cream border border-cream" />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest">SECURE://AUTH</span>
          </div>

          <div className="p-8">
            <div className="border-b-4 border-ink pb-4 mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Branch · Shah Alam</p>
              <h1 className="font-display text-4xl uppercase leading-none mt-2">Gadgets<br/>World <span className="text-primary">666</span></h1>
              <p className="font-mono text-[11px] uppercase mt-3 tracking-widest text-muted-foreground">Operations Console // v1.0</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-display text-xs uppercase tracking-widest mb-1.5">Operator ID</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full brutal-border bg-background px-4 py-3 font-mono text-sm focus:outline-none focus:bg-accent focus:shadow-[4px_4px_0_0_var(--blood)] transition-shadow"
                  placeholder="operator@gw666.my"
                  required
                />
              </div>
              <div>
                <label className="block font-display text-xs uppercase tracking-widest mb-1.5">Pass Cipher</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full brutal-border bg-background px-4 py-3 font-mono text-sm focus:outline-none focus:bg-accent focus:shadow-[4px_4px_0_0_var(--blood)] transition-shadow"
                  required
                />
              </div>
              <motion.button
                whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0 0 var(--ink)" }}
                type="submit"
                className="w-full brutal-border bg-primary text-primary-foreground py-4 font-display uppercase tracking-widest text-lg brutal-shadow"
              >
                ▶ Authenticate
              </motion.button>
            </form>

            <div className="mt-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-[3px] flex-1 bg-ink" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Quick Switch</span>
                <div className="h-[3px] flex-1 bg-ink" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_USERS.map(u => (
                  <button
                    key={u.id}
                    onClick={() => quickLogin(u)}
                    className="brutal-border bg-background p-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="font-display text-[10px] uppercase tracking-wider text-primary">{u.role}</div>
                    <div className="font-mono text-[11px] truncate">{u.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t-4 border-ink bg-accent px-6 py-2 flex justify-between font-mono text-[10px] uppercase tracking-widest">
            <span>● ONLINE</span>
            <span>BRANCH-SA-01</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
