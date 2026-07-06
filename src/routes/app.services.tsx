import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader, Block, Btn, Modal, Field, inputCls, Empty, RowActions, Badge } from "@/components/brutalist";
import { Plus, Clock, Shield, Tag } from "lucide-react";

import {
  fetchServices,
  createService,
  updateService,
  deleteServiceApi,
  SERVICE_CATEGORIES,
  SERVICE_STATUSES,
  type ServiceRow,
  type ServicePayload,
} from "@/lib/api/service";

export const Route = createFileRoute("/app/services")({
  component: ServicesPage,
});

const blank: ServicePayload = {
  name: "",
  category: SERVICE_CATEGORIES[0],
  description: "",
  price: 0,
  duration: 1,
  warranty: 30,
};

function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState<ServicePayload>(blank);
  const [status, setStatus] = useState<string>(SERVICE_STATUSES[0]);

  const loadServices = () => {
    setLoading(true);
    fetchServices()
      .then(setServices)
      .catch((err) => toast.error(err.message ?? "Failed to load services"))
      .finally(() => setLoading(false));
  };

  const sortedServices = useMemo(
    () => services.slice().sort((a, b) => b.SERVICE_ID.localeCompare(a.SERVICE_ID)),
    [services]
  );

  useEffect(() => {
    loadServices();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(blank);
    setStatus(SERVICE_STATUSES[0]);
    setOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setEditing(s);
    setForm({
      name: s.SERVICE_NAME,
      category: s.SERVICE_CATEGORY,
      description: s.SERVICE_DESCRIPTION ?? "",
      price: s.SERVICE_BASEPRICE,
      duration: s.SERVICE_ESTIMATEDDURATION ?? 1,
      warranty: s.SERVICE_WARRANTYDAYS,
    });
    setStatus(s.SERVICE_STATUS);
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("SERVICE NAME IS REQUIRED");
      return;
    }
    if (!/[a-zA-Z]/.test(form.name.trim())) {
      toast.error("SERVICE NAME MUST CONTAIN LETTERS");
      return;
    }
    if (!form.category?.trim()) {
      toast.error("CATEGORY IS REQUIRED");
      return;
    }
    if (form.price === undefined || form.price === null || Number(form.price) < 0) {
      toast.error("BASE PRICE MUST BE 0 OR MORE");
      return;
    }
    if (form.duration === undefined || form.duration === null || Number(form.duration) < 0) {
      toast.error("ESTIMATED DURATION MUST BE 0 OR MORE");
      return;
    }
    if (form.warranty === undefined || form.warranty === null || Number(form.warranty) < 0) {
      toast.error("WARRANTY DAYS MUST BE 0 OR MORE");
      return;
    }

    try {
      if (editing) {
        await updateService(editing.SERVICE_ID, { ...form, status });
        toast.success("SERVICE UPDATED");
      } else {
        await createService(form);
        toast.success("SERVICE ADDED TO CATALOG");
      }
      setForm(blank);
      setEditing(null);
      setOpen(false);
      loadServices();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save service");
    }
  };

  const remove = async () => {
    if (!editing) return;
    try {
      await deleteServiceApi(editing.SERVICE_ID);
      toast.success("SERVICE REMOVED");
      setEditing(null);
      setOpen(false);
      loadServices();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete service — it may be linked to existing jobs");
    }
  };

  const removeRow = async (s: ServiceRow) => {
    try {
      await deleteServiceApi(s.SERVICE_ID);
      toast.success("SERVICE REMOVED");
      loadServices();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete service — it may be linked to existing jobs");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Sector 06 · Catalog"
        title="Repair Services"
        action={
          <Btn variant="primary" onClick={openAdd}>
            <Plus className="inline w-4 h-4 mr-1" /> Add Service
          </Btn>
        }
      />

      {loading ? (
        <Empty>Loading services…</Empty>
      ) : services.length === 0 ? (
        <Empty>No services in catalog.</Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedServices.map((s, i) => {
            const accent = i % 3 === 0 ? "bg-primary text-primary-foreground" : i % 3 === 1 ? "bg-accent" : "bg-ink text-cream";
            return (
              <Block key={s.SERVICE_ID} className="brutal-shadow-sm overflow-hidden">
                <div className={`${accent} p-4 border-b-4 border-ink relative`}>
                  <div className="absolute top-3 right-3">
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => removeRow(s)} />
                  </div>
                  <div className="flex items-start justify-between pr-10">
                    <Tag className="w-5 h-5" />
                    <div className="font-display text-3xl">RM{s.SERVICE_BASEPRICE.toFixed(2)}</div>
                  </div>
                  <h3 className="font-display text-xl uppercase mt-2 leading-tight cursor-pointer" onClick={() => openEdit(s)}>
                    {s.SERVICE_NAME}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase opacity-80">{s.SERVICE_CATEGORY}</span>
                    {s.SERVICE_STATUS !== "Active" && <Badge tone="red">{s.SERVICE_STATUS}</Badge>}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-mono text-xs text-muted-foreground">{s.SERVICE_DESCRIPTION}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="brutal-border p-2 text-center">
                      <Clock className="w-4 h-4 mx-auto" />
                      <div className="font-mono text-[10px] uppercase mt-1">DURATION</div>
                      <div className="font-display text-sm">{s.SERVICE_ESTIMATEDDURATION ?? "—"}H</div>
                    </div>
                    <div className="brutal-border p-2 text-center">
                      <Shield className="w-4 h-4 mx-auto" />
                      <div className="font-mono text-[10px] uppercase mt-1">WARRANTY</div>
                      <div className="font-display text-sm">{s.SERVICE_WARRANTYDAYS}D</div>
                    </div>
                  </div>
                </div>
              </Block>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit · ${editing.SERVICE_NAME}` : "Add Service"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Service Name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Base Price">
              <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </Field>
            <Field label="Duration (h)">
              <input
                type="number"
                step="0.5"
                className={inputCls}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </Field>
            <Field label="Warranty (d)">
              <input type="number" className={inputCls} value={form.warranty} onChange={(e) => setForm({ ...form, warranty: Number(e.target.value) })} />
            </Field>
          </div>
          {editing && (
            <Field label="Status">
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {SERVICE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="flex justify-between items-center pt-2">
            {editing ? (
              <Btn variant="dark" onClick={remove}>
                Delete
              </Btn>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={submit}>
                {editing ? "Save Changes" : "Save"}
              </Btn>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
