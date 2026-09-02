"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check, X, Pencil, Trash2, User, Phone, Mail } from "lucide-react";
import {
  addSupplierContact,
  updateSupplierContact,
  deleteSupplierContact,
  type SupplierContactInput,
} from "@/lib/crm/actions";
import type { SupplierContact } from "@/lib/crm/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/Form";

const EMPTY: SupplierContactInput = { name: "", role: "", phone: "", email: "", notes: "" };

export function SupplierContacts({
  supplierId,
  contacts,
}: {
  supplierId: string;
  contacts: SupplierContact[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader
        title={`Personas de contacto (${contacts.length})`}
        action={
          !adding ? (
            <button
              onClick={() => {
                setAdding(true);
                setEditingId(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Añadir contacto
            </button>
          ) : undefined
        }
      />

      {adding && (
        <div className="border-b border-ink-100 bg-brand-50/40 p-4">
          <ContactForm
            supplierId={supplierId}
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center px-6 py-8 text-center">
          <User className="h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm text-ink-400">
            Aún no hay personas de contacto. Añade las que necesites.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {contacts.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="bg-brand-50/40 p-4">
                <ContactForm
                  supplierId={supplierId}
                  contact={c}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={c.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">
                    {c.name}
                    {c.role && <span className="ml-2 text-sm font-normal text-ink-400">· {c.role}</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {c.email}
                      </span>
                    )}
                  </div>
                  {c.notes && <p className="mt-1 text-sm text-ink-500">{c.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(c.id);
                      setAdding(false);
                    }}
                    className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <DeleteContact id={c.id} supplierId={supplierId} name={c.name} />
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

function ContactForm({
  supplierId,
  contact,
  onDone,
  onCancel,
}: {
  supplierId: string;
  contact?: SupplierContact;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SupplierContactInput>(
    contact
      ? {
          name: contact.name,
          role: contact.role ?? "",
          phone: contact.phone ?? "",
          email: contact.email ?? "",
          notes: contact.notes ?? "",
        }
      : { ...EMPTY },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SupplierContactInput>(key: K, value: SupplierContactInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = contact
      ? await updateSupplierContact(contact.id, supplierId, form)
      : await addSupplierContact(supplierId, form);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre *" />
        <input className={inputClass} value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Cargo (ej. Comercial)" />
        <input className={inputClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="Teléfono" />
        <input type="email" className={inputClass} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="Email" />
      </div>
      <input className={inputClass} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Notas (opcional)" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50">
          <X className="h-4 w-4" /> Cancelar
        </button>
        <button type="submit" disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {contact ? "Guardar" : "Añadir"}
        </button>
      </div>
    </form>
  );
}

function DeleteContact({ id, supplierId, name }: { id: string; supplierId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function onDelete() {
    if (!window.confirm(`¿Eliminar el contacto "${name}"?`)) return;
    setLoading(true);
    const res = await deleteSupplierContact(id, supplierId);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.refresh();
  }
  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="rounded p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
      title="Eliminar"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
