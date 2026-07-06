import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Badge, Empty, RowActions } from "@/components/brutalist";
import { Plus, ShieldAlert, UserCog, Wallet } from "lucide-react";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaffApi,
  STAFF_ROLES,
  STAFF_STATUSES,
  type StaffRow,
  type StaffPayload,
} from "@/lib/api/staff";

export const Route = createFileRoute("/app/staff")({
  component: StaffPage,
});

const blank: StaffPayload = {
  fname: "",
  lname: "",
  phone: "",
  email: "",
  role: "Technician",
  hiredate: new Date().toISOString().slice(0, 10),
  salary: 0,
  overtime: 0,
  bonus: 0,
  bankname: "",
  bankacc: "",
  address: "",
  city: "",
  postcode: "",
  state: "",
  ecname: "",
  ecnumber: "",
  notes: "",
};

function StaffPage() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [form, setForm] = useState<StaffPayload>(blank);
  const [status, setStatus] = useState<string>(STAFF_STATUSES[0]);

  // Owner gate — redirect non-owners to dashboard
  useEffect(() => {
    if (user && user.role !== "Owner") navigate({ to: "/app" });
  }, [user, navigate]);

  const loadStaff = () => {
    setLoading(true);
    fetchStaff()
      .then(setStaff)
      .catch((err) => toast.error(err.message ?? "Failed to load staff"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === "Owner") loadStaff();
  }, [user]);

  const sorted = useMemo(
    () => staff.slice().sort((a, b) => new Date(b.STAFF_HIREDATE ?? 0).getTime() - new Date(a.STAFF_HIREDATE ?? 0).getTime()),
    [staff]
  );
  const payroll = useMemo(() => staff.reduce((s, x) => s + (x.STAFF_SALARY || 0), 0), [staff]);

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

  const openAdd = () => {
    setEditing(null);
    setForm(blank);
    setStatus(STAFF_STATUSES[0]);
    setOpen(true);
  };

  const openEdit = (s: StaffRow) => {
    setEditing(s);
    setForm({
      fname: s.STAFF_FNAME,
      lname: s.STAFF_LNAME,
      phone: s.STAFF_PHONENUMBER,
      email: s.STAFF_EMAIL ?? "",
      role: s.STAFF_ROLE,
      hiredate: s.STAFF_HIREDATE,
      salary: s.STAFF_SALARY,
      overtime: s.STAFF_OVERTIMERATE,
      bonus: s.STAFF_MONTHLYBONUS,
      bankname: s.STAFF_BANKNAME ?? "",
      bankacc: s.STAFF_BANKACCOUNTNUMBER ?? "",
      address: s.STAFF_ADDRESS ?? "",
      city: s.STAFF_CITY ?? "",
      postcode: s.STAFF_POSTCODE ?? "",
      state: s.STAFF_STATE ?? "",
      ecname: s.STAFF_EMERGENCYCONTACTNAME ?? "",
      ecnumber: s.STAFF_EMERGENCYCONTACTNUMBER ?? "",
      notes: s.STAFF_NOTES ?? "",
    });
    setStatus(s.STAFF_STATUS);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.fname.trim() || !form.phone.trim()) {
      toast.error("NAME + PHONE REQUIRED");
      return;
    }
    if (!/^[a-zA-Z\s'\-]+$/.test(form.fname.trim())) {
      toast.error("FIRST NAME MUST CONTAIN LETTERS ONLY");
      return;
    }
    if (form.lname?.trim() && !/^[a-zA-Z\s'\-]+$/.test(form.lname.trim())) {
      toast.error("LAST NAME MUST CONTAIN LETTERS ONLY");
      return;
    }
    if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
      toast.error("PHONE MUST BE 7-15 DIGITS");
      return;
    }
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("INVALID EMAIL FORMAT");
      return;
    }
    if (form.salary === undefined || form.salary === null || Number(form.salary) < 0) {
      toast.error("SALARY MUST BE 0 OR MORE");
      return;
    }

    try {
      if (editing) {
        await updateStaff(editing.STAFF_ID, { ...form, status });
        toast.success(`STAFF UPDATED · SALARY RM${form.salary}`);
      } else {
        await createStaff(form);
        toast.success("STAFF ADDED TO ROSTER");
      }
      setForm(blank);
      setEditing(null);
      setOpen(false);
      loadStaff();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save staff");
    }
  };

  const remove = async () => {
    if (!editing) return;
    try {
      await deleteStaffApi(editing.STAFF_ID);
      toast.success("STAFF REMOVED");
      setEditing(null);
      setOpen(false);
      loadStaff();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete staff — they may be linked to existing jobs/payments");
    }
  };

  const removeRow = async (s: StaffRow) => {
    try {
      await deleteStaffApi(s.STAFF_ID);
      toast.success("STAFF REMOVED");
      loadStaff();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete staff — they may be linked to existing jobs/payments");
    }
  };

  const roleTone = (r: string) => (r === "Owner" ? "red" : r === "Branch Manager" ? "yellow" : r === "Technician" ? "navy" : "ink");

  return (
    <div>
      <PageHeader
        eyebrow="Sector 07 · HR · Restricted"
        title="Staff Directory"
        action={
          <Btn variant="primary" onClick={openAdd}>
            <Plus className="inline w-4 h-4 mr-1" /> Add Staff
          </Btn>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Block className="p-5 brutal-shadow-sm bg-ink text-cream">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">Headcount</p>
            <UserCog className="w-5 h-5" />
          </div>
          <div className="font-display text-5xl mt-3">{staff.length}</div>
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest">Monthly Payroll</p>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="font-display text-5xl mt-3">RM{payroll.toLocaleString()}</div>
        </Block>
        <Block className="p-5 brutal-shadow-sm bg-accent">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-widest">Clearance</p>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="font-display text-3xl mt-3 leading-none">
            OWNER
            <br />
            ACCESS
          </div>
        </Block>
      </div>

      {loading ? (
        <Empty>Loading staff…</Empty>
      ) : sorted.length === 0 ? (
        <Empty>No staff registered.</Empty>
      ) : (
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
              {sorted.map((s) => (
                <tr key={s.STAFF_ID} onClick={() => openEdit(s)} className="border-t-2 border-ink cursor-pointer hover:bg-accent transition-colors">
                  <td className="p-3">
                    <div className="font-display text-sm uppercase">
                      {s.STAFF_FNAME} {s.STAFF_LNAME}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.STAFF_EMAIL}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge tone={roleTone(s.STAFF_ROLE) as any}>{s.STAFF_ROLE}</Badge>
                    {s.STAFF_STATUS !== "Active" && (
                      <Badge tone="red" className="ml-1">
                        {s.STAFF_STATUS}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 hidden lg:table-cell font-mono text-xs">
                    {s.STAFF_PHONENUMBER}
                    <br />
                    <span className="opacity-60">ID {s.STAFF_ID}</span>
                  </td>
                  <td className="p-3 hidden md:table-cell font-mono text-xs">{s.STAFF_HIREDATE}</td>
                  <td className="p-3 text-right font-display text-lg">RM{s.STAFF_SALARY.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => removeRow(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit · ${editing.STAFF_FNAME} ${editing.STAFF_LNAME}` : "New Staff Intake"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input className={inputCls} value={form.fname} onChange={(e) => setForm({ ...form, fname: e.target.value })} />
            </Field>
            <Field label="Last Name">
              <input className={inputCls} value={form.lname} onChange={(e) => setForm({ ...form, lname: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3, 11)}` : digits;
                  setForm({ ...form, phone: formatted });
                }}
                placeholder="012-3456789"
                maxLength={12}
              />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Hire Date">
              <input type="date" className={inputCls} value={form.hiredate} onChange={(e) => setForm({ ...form, hiredate: e.target.value })} />
            </Field>
          </div>
          {editing && (
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STAFF_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Monthly Salary (RM)">
              <input type="number" className={inputCls} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Overtime Rate">
              <input type="number" className={inputCls} value={form.overtime} onChange={(e) => setForm({ ...form, overtime: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Monthly Bonus">
              <input type="number" className={inputCls} value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank Name">
              <input className={inputCls} value={form.bankname} onChange={(e) => setForm({ ...form, bankname: e.target.value })} />
            </Field>
            <Field label="Bank Account Number">
              <input className={inputCls} value={form.bankacc} onChange={(e) => setForm({ ...form, bankacc: e.target.value })} />
            </Field>
          </div>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Postcode">
              <input className={inputCls} value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
            </Field>
            <Field label="State">
              <input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency Contact Name">
              <input className={inputCls} value={form.ecname} onChange={(e) => setForm({ ...form, ecname: e.target.value })} />
            </Field>
            <Field label="Emergency Contact Number">
              <input
                className={inputCls}
                value={form.ecnumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3, 11)}` : digits;
                  setForm({ ...form, ecnumber: formatted });
                }}
                placeholder="012-3456789"
                maxLength={12}
              />
            </Field>
          </div>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-between items-center pt-2">
            {editing ? (
              <Btn variant="dark" onClick={remove}>
                Remove
              </Btn>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={submit}>
                {editing ? "Save Changes" : "Register"}
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
