"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCustomer } from "@/lib/crm/actions";

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = window.confirm(
      `¿Seguro que quieres eliminar a "${name}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setLoading(true);
    const res = await deleteCustomer(id);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.push("/clientes");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Eliminar
    </button>
  );
}
