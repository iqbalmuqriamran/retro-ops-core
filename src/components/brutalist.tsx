import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, X } from "lucide-react";

/* ---------- Page title ---------- */
export function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h1 className="font-display text-3xl sm:text-4xl uppercase leading-none mt-2 truncate">{title}</h1>
        <div className="mt-3 h-[6px] bg-ink w-24" />
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ---------- Card ---------- */
export function Block({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`brutal-border bg-card ${className}`}>{children}</div>;
}

/* ---------- Button ---------- */
export function Btn({
  children, onClick, variant = "primary", type = "button", className = "", disabled,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "dark" | "ghost" | "accent"; className?: string; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground brutal-shadow-sm",
    dark: "bg-ink text-cream brutal-shadow-sm",
    accent: "bg-accent text-ink brutal-shadow-sm",
    ghost: "bg-card text-ink",
  }[variant];
  return (
    <motion.button
      whileTap={{ x: 2, y: 2 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`brutal-border px-4 py-2.5 font-display uppercase text-xs tracking-widest ${styles} disabled:opacity-40 ${className}`}
    >{children}</motion.button>
  );
}

/* ---------- Drawer ---------- */
export function Drawer({ open, onClose, title, children, width = 520 }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/60 z-40"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            style={{ width }}
            className="fixed top-0 right-0 h-screen bg-cream z-50 border-l-4 border-ink flex flex-col max-w-full"
          >
            <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between border-b-4 border-primary">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">DETAIL · DRAWER</p>
                <h2 className="font-display text-xl uppercase">{title}</h2>
              </div>
              <button onClick={onClose} className="brutal-border border-cream w-10 h-10 grid place-items-center hover:bg-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, width = 560 }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-ink/70 z-40" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
            style={{ width }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[95vw] z-50 brutal-border brutal-shadow bg-cream"
          >
            <div className="bg-ink text-cream px-5 py-4 flex items-center justify-between border-b-4 border-primary">
              <h2 className="font-display text-lg uppercase">{title}</h2>
              <button onClick={onClose} className="brutal-border border-cream w-9 h-9 grid place-items-center hover:bg-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- Field ---------- */
export function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block">
      <div className="font-display text-[11px] uppercase tracking-widest mb-1.5">{label}</div>
      {children}
      {error && <div className="mt-1 font-mono text-[11px] text-primary uppercase">⚠ {error}</div>}
    </label>
  );
}

export const inputCls = "w-full brutal-border bg-background px-3 py-2.5 font-mono text-sm focus:outline-none focus:bg-accent focus:shadow-[4px_4px_0_0_var(--blood)] transition-shadow";

/* ---------- Badge ---------- */
export function Badge({ tone = "ink", children }: { tone?: "ink" | "red" | "yellow" | "navy" | "muted"; children: ReactNode }) {
  const map = {
    ink: "bg-ink text-cream",
    red: "bg-primary text-primary-foreground",
    yellow: "bg-accent text-ink",
    navy: "bg-navy text-cream",
    muted: "bg-muted text-ink",
  } as const;
  return <span className={`inline-block px-2 py-1 font-display text-[10px] uppercase tracking-widest border-2 border-ink ${map[tone]}`}>{children}</span>;
}

/* ---------- Empty ---------- */
export function Empty({ children }: { children: ReactNode }) {
  return <div className="brutal-border bg-card p-10 text-center font-mono text-sm uppercase tracking-widest text-muted-foreground">▢ {children}</div>;
}
