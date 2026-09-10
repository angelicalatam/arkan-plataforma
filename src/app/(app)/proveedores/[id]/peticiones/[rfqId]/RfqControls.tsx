"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, PackageCheck, Trash2 } from "lucide-react";
import { setFollowUpDate, markRfqReceived, deleteRfq } from "@/lib/rfq/actions";
import { inputClass } from "@/components/ui/Form";

export function RfqControls({
  rfqId,
  supplierId,
  status,
  followUpDate,
}: {
  rfqId: string;
  supplierId: string;
  status: string;
  followUpDate: string | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(followUpDate ?? "");
  const [savingDate, setSavingDate] = useState(false);
  const [marking, setMarking] = useState(false);

  async function onSaveDate() {
    setSavingDate(true);
    await setFollowUpDate(rfqId, supplierId, date || null);
    setSavingDate(false);
    router.refresh();
  }

  async function onReceived() {
    setMarking(true);
    await markRfqReceived(rfqId, supplierId);
    setMarking(false);
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm("¿Eliminar esta petición de oferta y todos sus archivos?")) return;
    const res = await deleteRfq(rfqId, supplierId);
    if (!res.ok) {
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
          <CalendarClock className="h-3.5 w-3.5" /> Fecha de seguimiento
        </label>
        <div className="flex items-center gap-2">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          <button
            onClick={onSaveDate}
            disabled={savingDate}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
          >
            {savingDate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">
          Mientras la petición esté “Enviada”, aparecerá en las alertas del panel principal en esta fecha.
        </p>
      </div>

      {status !== "recibida" && (
        <button
          onClick={onReceived}
          disabled={marking}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
          Marcar oferta recibida
        </button>
      )}

      <button
        onClick={onDelete}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" /> Eliminar petición
      </button>
    </div>
  );
}
