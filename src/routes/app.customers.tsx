import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { PageHeader, Block, Btn, Drawer, Modal, Field, inputCls, Badge, Empty, RowActions } from "@/components/brutalist";
import { Plus, Search, Smartphone, Pencil } from "lucide-react";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomerApi,
  type CustomerRow,
} from "@/lib/api/customers";
import {
  fetchDevices,
  createDevice,
  updateDevice,
  deleteDeviceApi,
  DEVICE_TYPES,
  DEVICE_CONDITIONS_DB,
  type DeviceRow,
} from "@/lib/api/device";

export const Route = createFileRoute("/app/customers")({
  component: CustomersPage,
});

type DeviceForm = {
  brand: string;
  model: string;
  modelyear: string;
  type: string;
  serial: string;
  condition: string;
  issue: string;
  notes: string;
};
const blankDevice: DeviceForm = {
  brand: "",
  model: "",
  modelyear: "",
  type: DEVICE_TYPES[0],
  serial: "",
  condition: DEVICE_CONDITIONS_DB[1],
  issue: "",
  notes: "",
};

type CustomerForm = { fname: string; lname: string; phone: string; email: string; notes: string };
const blankCustomer: CustomerForm = { fname: "", lname: "", phone: "", email: "", notes: "" };

function CustomersPage() {
  const { tickets } = useStore();

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [deviceModal, setDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceRow | null>(null);
  const [form, setForm] = useState<CustomerForm>(blankCustomer);
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(blankDevice);
  const [linkTarget, setLinkTarget] = useState<string | null>(null);

  const loadCustomers = () => {
    setLoading(true);
    fetchCustomers()
      .then(setCustomers)
      .catch((err) => toast.error(err.message ?? "Failed to load customers"))
      .finally(() => setLoading(false));
  };

  const loadDevicesForCustomer = (custId: string) => {
    setDevicesLoading(true);
    fetchDevices(custId)
      .then(setDevices)
      .catch((err) => toast.error(err.message ?? "Failed to load devices"))
      .finally(() => setDevicesLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadDevicesForCustomer(selectedId);
    } else {
      setDevices([]);
    }
  }, [selectedId]);

  // device counts per customer, loaded once for the whole list
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    fetchDevices()
      .then((all) => {
        const counts: Record<string, number> = {};
        all.forEach((d) => {
          counts[d.CUST_ID] = (counts[d.CUST_ID] ?? 0) + 1;
        });
        setDeviceCounts(counts);
      })
      .catch(() => {
        // non-fatal, counts just won't show
      });
  }, [customers]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return customers
      .filter(
        (c) =>
          !s ||
          `${c.CUST_FNAME} ${c.CUST_LNAME}`.toLowerCase().includes(s) ||
          c.CUST_PHONENUMBER.includes(s) ||
          c.CUST_EMAIL.toLowerCase().includes(s)
      )
      .slice()
      .sort((a, b) => (b.CUST_REGISTRATIONDATE ?? "").localeCompare(a.CUST_REGISTRATIONDATE ?? ""));
  }, [customers, q]);

  const selected = customers.find((c) => c.CUST_ID === selectedId);

  const openNew = () => {
    setEditingCustomer(null);
    setForm(blankCustomer);
    setModalOpen(true);
  };

  const openEditCustomer = (c: CustomerRow) => {
    setEditingCustomer(c);
    setForm({
      fname: c.CUST_FNAME,
      lname: c.CUST_LNAME,
      phone: c.CUST_PHONENUMBER,
      email: c.CUST_EMAIL,
      notes: c.CUST_NOTES ?? "",
    });
    setModalOpen(true);
  };

  const deleteCustomer = async (c: CustomerRow) => {
    try {
      await deleteCustomerApi(c.CUST_ID);
      toast.success(`CUSTOMER ${c.CUST_FNAME.toUpperCase()} REMOVED`);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete customer");
    }
  };

  const submitCustomer = async () => {
    if (!form.fname.trim() || !form.phone.trim()) {
      toast.error("NAME + PHONE REQUIRED");
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.CUST_ID, form);
        toast.success("CUSTOMER UPDATED");
        setEditingCustomer(null);
        setForm(blankCustomer);
        setModalOpen(false);
        loadCustomers();
        return;
      }

      const result = await createCustomer(form);
      toast.success("CUSTOMER REGISTERED // LINK DEVICE");
      setForm(blankCustomer);
      setModalOpen(false);
      loadCustomers();

      setLinkTarget(result.CUST_ID);
      setEditingDevice(null);
      setDeviceForm(blankDevice);
      setDeviceModal(true);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save customer");
    }
  };

  const openLinkDeviceForSelected = () => {
    if (!selectedId) return;
    setLinkTarget(selectedId);
    setEditingDevice(null);
    setDeviceForm(blankDevice);
    setDeviceModal(true);
  };

  const openEditDevice = (d: DeviceRow) => {
    setEditingDevice(d);
    setLinkTarget(d.CUST_ID);
    setDeviceForm({
      brand: d.DEVICE_BRAND,
      model: d.DEVICE_MODEL,
      modelyear: d.DEVICE_MODELYEAR ?? "",
      type: d.DEVICE_TYPE,
      serial: d.DEVICE_SERIALNUMBER,
      condition: d.DEVICE_CONDITION,
      issue: d.DEVICE_ISSUE,
      notes: d.DEVICE_NOTES ?? "",
    });
    setDeviceModal(true);
  };

  const submitDevice = async () => {
    const targetCustomer = linkTarget;
    if (!targetCustomer || !deviceForm.brand.trim() || !deviceForm.model.trim()) {
      toast.error("BRAND + MODEL REQUIRED");
      return;
    }

    try {
      if (editingDevice) {
        await updateDevice(editingDevice.DEVICE_ID, {
          brand: deviceForm.brand,
          model: deviceForm.model,
          modelyear: deviceForm.modelyear,
          type: deviceForm.type,
          serial: deviceForm.serial,
          condition: deviceForm.condition,
          issue: deviceForm.issue,
          notes: deviceForm.notes,
        });
        toast.success("DEVICE UPDATED");
      } else {
        await createDevice({ cust_id: targetCustomer, ...deviceForm });
        toast.success("DEVICE LINKED");
      }
      setDeviceForm(blankDevice);
      setEditingDevice(null);
      setDeviceModal(false);
      if (selectedId === targetCustomer) loadDevicesForCustomer(targetCustomer);
      fetchDevices().then((all) => {
        const counts: Record<string, number> = {};
        all.forEach((d) => {
          counts[d.CUST_ID] = (counts[d.CUST_ID] ?? 0) + 1;
        });
        setDeviceCounts(counts);
      });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save device");
    }
  };

  const deleteDevice = async (d: DeviceRow) => {
    try {
      await deleteDeviceApi(d.DEVICE_ID);
      toast.success("DEVICE REMOVED");
      if (selectedId) loadDevicesForCustomer(selectedId);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete device");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sector 02 · CRM"
        title="Customers & Devices"
        action={
          <Btn variant="primary" onClick={openNew}>
            <Plus className="inline w-4 h-4 mr-1" /> New Customer
          </Btn>
        }
      />

      <Block className="p-3 mb-4 brutal-shadow-sm flex items-center gap-2">
        <Search className="w-4 h-4 shrink-0 ml-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH NAME / PHONE / EMAIL"
          className="flex-1 bg-transparent font-mono text-sm uppercase focus:outline-none py-2"
        />
        <Badge tone="ink">{filtered.length} RESULTS</Badge>
      </Block>

      <Block className="overflow-hidden brutal-shadow-sm">
        <table className="w-full">
          <thead className="bg-ink text-cream">
            <tr className="text-left font-display text-[11px] uppercase tracking-widest">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3 hidden md:table-cell">Email</th>
              <th className="p-3 hidden lg:table-cell">Joined</th>
              <th className="p-3 text-right">Devices</th>
              <th className="p-3 text-right w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const count = deviceCounts[c.CUST_ID] ?? 0;
              return (
                <tr
                  key={c.CUST_ID}
                  onClick={() => setSelectedId(c.CUST_ID)}
                  className="border-t-2 border-ink cursor-pointer hover:bg-accent transition-colors"
                >
                  <td className="p-3 font-mono text-xs">{c.CUST_ID}</td>
                  <td className="p-3 font-display text-sm uppercase">
                    {c.CUST_FNAME} {c.CUST_LNAME}
                  </td>
                  <td className="p-3 font-mono text-xs">{c.CUST_PHONENUMBER}</td>
                  <td className="p-3 font-mono text-xs hidden md:table-cell">{c.CUST_EMAIL}</td>
                  <td className="p-3 font-mono text-xs hidden lg:table-cell">{c.CUST_REGISTRATIONDATE}</td>
                  <td className="p-3 text-right">
                    <Badge tone={count ? "red" : "muted"}>{count} DEV</Badge>
                  </td>
                  <td className="p-3 text-right">
                    <RowActions onEdit={() => openEditCustomer(c)} onDelete={() => deleteCustomer(c)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="p-10">
            <Empty>No customers match the query.</Empty>
          </div>
        )}
        {loading && (
          <div className="p-10">
            <Empty>Loading customers…</Empty>
          </div>
        )}
      </Block>

      {/* Detail Drawer */}
      <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `${selected.CUST_FNAME} ${selected.CUST_LNAME}` : ""}>
        {selected && (
          <div className="space-y-5">
            <Block className="p-4 bg-ink text-cream">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">PROFILE</p>
              <div className="mt-2 grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="opacity-60">PHONE</span>
                  <br />
                  {selected.CUST_PHONENUMBER}
                </div>
                <div>
                  <span className="opacity-60">EMAIL</span>
                  <br />
                  {selected.CUST_EMAIL}
                </div>
                <div className="col-span-2">
                  <span className="opacity-60">NOTES</span>
                  <br />
                  {selected.CUST_NOTES || "—"}
                </div>
                <div>
                  <span className="opacity-60">JOINED</span>
                  <br />
                  {selected.CUST_REGISTRATIONDATE}
                </div>
                <div>
                  <span className="opacity-60">ID</span>
                  <br />
                  {selected.CUST_ID}
                </div>
              </div>
            </Block>

            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg uppercase">Registered Devices</h3>
              <Btn variant="dark" onClick={openLinkDeviceForSelected}>
                <Plus className="inline w-3 h-3 mr-1" /> Link Device
              </Btn>
            </div>

            {devicesLoading ? (
              <Empty>Loading devices…</Empty>
            ) : devices.length === 0 ? (
              <Empty>No devices registered.</Empty>
            ) : (
              <div className="space-y-3">
                {devices.map((d) => {
                  const activeTickets = tickets.filter((t) => t.deviceId === d.DEVICE_ID && t.status !== "Completed").length;
                  return (
                    <Block key={d.DEVICE_ID} className="p-4 hover:bg-accent transition-colors">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 bg-accent grid place-items-center brutal-border shrink-0 cursor-pointer"
                          onClick={() => openEditDevice(d)}
                        >
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditDevice(d)}>
                          <div className="font-display uppercase">
                            {d.DEVICE_BRAND} {d.DEVICE_MODEL} {d.DEVICE_MODELYEAR ? `(${d.DEVICE_MODELYEAR})` : ""}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {d.DEVICE_TYPE} · S/N: {d.DEVICE_SERIALNUMBER}
                          </div>
                          <div className="font-mono text-xs mt-1">⚙ {d.DEVICE_CONDITION}</div>
                          <div className="font-mono text-xs">⚠ {d.DEVICE_ISSUE}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {activeTickets > 0 && <Badge tone="red">{activeTickets} OPEN</Badge>}
                          <Pencil className="w-4 h-4 opacity-50 cursor-pointer" onClick={() => openEditDevice(d)} />
                          <button
                            className="font-mono text-[10px] uppercase text-red-600 hover:underline"
                            onClick={() => deleteDevice(d)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </Block>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* New/edit customer modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? `Edit · ${editingCustomer.CUST_FNAME} ${editingCustomer.CUST_LNAME}` : "New Customer Intake"}
      >
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
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {!editingCustomer && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              ▶ Device intake will open immediately after registration.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Btn
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setEditingCustomer(null);
              }}
            >
              Cancel
            </Btn>
            <Btn variant="primary" onClick={submitCustomer}>
              {editingCustomer ? "Save Changes" : "Register & Link Device"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Link / edit device modal */}
      <Modal open={deviceModal} onClose={() => setDeviceModal(false)} title={editingDevice ? "Edit Device" : "Link Device"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <input className={inputCls} value={deviceForm.brand} onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })} />
            </Field>
            <Field label="Model">
              <input className={inputCls} value={deviceForm.model} onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Model Year">
              <input className={inputCls} value={deviceForm.modelyear} onChange={(e) => setDeviceForm({ ...deviceForm, modelyear: e.target.value })} />
            </Field>
            <Field label="Device Type">
              <select className={inputCls} value={deviceForm.type} onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}>
                {DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Serial / IMEI">
            <input className={inputCls} value={deviceForm.serial} onChange={(e) => setDeviceForm({ ...deviceForm, serial: e.target.value })} />
          </Field>
          <Field label="Condition">
            <select
              className={inputCls}
              value={deviceForm.condition}
              onChange={(e) => setDeviceForm({ ...deviceForm, condition: e.target.value })}
            >
              {DEVICE_CONDITIONS_DB.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reported Issue">
            <textarea className={inputCls} rows={3} value={deviceForm.issue} onChange={(e) => setDeviceForm({ ...deviceForm, issue: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={deviceForm.notes} onChange={(e) => setDeviceForm({ ...deviceForm, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="ghost" onClick={() => setDeviceModal(false)}>
              {editingDevice ? "Cancel" : "Skip"}
            </Btn>
            <Btn variant="primary" onClick={submitDevice}>
              {editingDevice ? "Save Changes" : "Save Device"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
