import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore, uid, type Staff, type Role } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Badge, Empty, RowActions } from "@/components/brutalist";
import { Plus, ShieldAlert, UserCog, Wallet } from "lucide-react";

export const Route = createFileRoute("/app/staff")({
  component: StaffPage,
});

const ROLES: Role[] = ["Owner", "Branch Manager", "Cashier", "Technician"];
const blank = { name: "", email: "", role: "Technician" as Role, phone: "", joinedAt: new Date().toISOString().slice(0, 10), salary: 0, ic: "" };

function StaffPage() {
  const { staff, user, update } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(blank);

  // Owner gate — redirect non-owners to dashboard
  useEffect(() => {
    if (user && user.role !== "Owner") navigate({ to: "/app" });
  }, [user, navigate]);

  const sorted = useMemo(
    () => staff.slice().sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? "")),
    [staff]
  );
  const payroll = useMemo(() => staff.reduce((s, x) => s + (x.salary || 0), 0), [staff]);

  if (!user || user.role !== "Owner") {
    return (
      <div>
        <PageHeader eyebrow="Sector 07 · Restricted" title="Staff Directory" />
        <Block className="p-10 bg-ink text-cream brutal-shadow text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-primary" />
          <h3 className="font-display text-2xl uppercase mt-3">Owner Clearance Required</h3>
          <p className="font-mono text-xs mt-2 opacity-70">This sector is restricted to Owner level personnel only.</p>
        </Block>
      </div>
    );
  }

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, role: s.role, phone: s.phone, joinedAt: s.joinedAt, salary: s.salary, ic: s.ic });
    setOpen(true);
  };
  const submit = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("NAME + EMAIL REQUIRED"); return; }
    if (editing) {
      update("staff", prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      toast.success(`STAFF UPDATED · SALARY RM${form.salary}`);
    } else {
      update("staff", prev => [...prev, { id: uid("u"), ...form }]);
      toast.success("STAFF ADDED TO ROSTER");
    }
    setForm(blank);
    setEditing(null);
    setOpen(false);
  };
  const remove = () => {
    if (!editing) return;
    update("staff", prev => prev.filter(s => s.id !== editing.id));
    toast.success("STAFF REMOVED");
    setEditing(null);
    setOpen(false);
  };

  const roleTone = (r: Role) => r === "Owner" ? "red" : r === "Branch Manager" ? "yellow" : r === "Technician" ? "navy" : "ink";

  return (
    <div>
      <PageHeader
        eyebrow="Sector 07 · HR · Restricted"
        title="Staff Directory"
        action={<Btn variant="primary" onClick={openAdd}><Plus className="inline w-4 h-4 mr-1" /> Add Staff</Btn>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Block className="p-5 brutal-shadow-sm bg-ink text-cream">
          <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Headcount</p><UserCog className="w-5 h-5" /></div>
          <div className="font-display text-5xl mt-3">{staff.length}</div>
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-primary text-primary-foreground">
          <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-widest">Monthly Payroll</p><Wallet className="w-5 h-5" /></div>
          <div className="font-display text-5xl mt-3">RM{payroll.toLocaleString()}</div>
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-accent">
          <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-widest">Clearance</p><ShieldAlert className="w-5 h-5" /></div>
          <div className="font-display text-3xl mt-3 leading-none">OWNER<br/>ACCESS</div>
        </Block>
      </div>

      {sorted.length === 0 ? <Empty>No staff registered.</Empty> : (
        <Block className="overflow-hidden brutal-shadow-sm">
          <table className="w-full">
            <thead className="bg-ink text-cream">
              <tr className="text-left font-display text-[11px] uppercase tracking-widest">
                <th className="p-3">Name</th>
                <th className="p-3 hidden md:table-cell">Role</th>
                <th className="p-3 hidden lg:table-cell">Contact</th>
                <th className="p-3 hidden md:table-cell">Joined</th>
                <th className="p-3 text-right">Salary</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} onClick={() => openEdit(s)} className="border-t-2 border-ink cursor-pointer hover:bg-accent transition-colors">
                  <td className="p-3">
                    <div className="font-display text-sm uppercase">{s.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell"><Badge tone={roleTone(s.role) as any}>{s.role}</Badge></td>
                  <td className="p-3 hidden lg:table-cell font-mono text-xs">{s.phone}<br/><span className="opacity-60">IC {s.ic}</span></td>
                  <td className="p-3 hidden md:table-cell font-mono text-xs">{s.joinedAt}</td>
                  <td className="p-3 text-right font-display text-lg">RM{s.salary.toLocaleString()}</td>
                  <td className="p-3 text-right"><RowActions onEdit={() => openEdit(s)} onDelete={() => { update("staff", prev => prev.filter(x => x.id !== s.id)); toast.success("STAFF REMOVED"); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit · ${editing.name}` : "New Staff Intake"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="IC Number"><input className={inputCls} value={form.ic} onChange={e => setForm({ ...form, ic: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><input className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select className={inputCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Joined Date"><input type="date" className={inputCls} value={form.joinedAt} onChange={e => setForm({ ...form, joinedAt: e.target.value })} /></Field>
          </div>
          <Field label="Monthly Salary (RM)">
            <input type="number" className={inputCls} value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) || 0 })} />
          </Field>
          <div className="flex justify-between items-center pt-2">
            {editing ? <Btn variant="dark" onClick={remove}>Remove</Btn> : <span />}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={submit}>{editing ? "Save Changes" : "Register"}</Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
