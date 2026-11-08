"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileUp } from "lucide-react";
import { updateProjectCostsFromExcel } from "@/lib/projects/actions";

export function UpdateCostsFromExcel({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await updateProjectCostsFromExcel(projectId, fd);
    setBusy(false);
    e.target.value = "";
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMsg(
      `Costes actualizados: ${res.updated ?? 0} partida(s)` +
        (res.unmatched ? ` · ${res.unmatched} del Excel no coincidieron por código` : ""),
    );
    router.refresh();
  }

  return (
    <div className="border-t border-ink-100 px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-500">
          ¿La obra se importó antes y el presupuestado sale en 0? Vuelve a subir su Excel para
          actualizar los costes (no borra compras ni horas).
        </p>
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          Actualizar costes desde Excel
          <input
            type="file"
            accept=".xls,.xlsx,.xlsm"
            className="hidden"
            onChange={onFile}
            disabled={busy}
          />
        </label>
      </div>
      {msg && <p className="mt-2 text-xs text-green-700">{msg}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
