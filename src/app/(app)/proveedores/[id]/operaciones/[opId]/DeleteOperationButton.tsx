"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteOperation } from "@/lib/operations/actions";

export function DeleteOperationButton({
  id,
  supplierId,
  reference,
}: {
  id: string;
  supplierId: string;
  reference: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (
      !window.confirm(
        `¿Eliminar la operación "${reference}" y todos sus documentos? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setLoading(true);
    const res = await deleteOperation(id, supplierId);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}`);
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
