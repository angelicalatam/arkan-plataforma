"use client";

import { Download } from "lucide-react";

/** Botón que descarga una tabla como CSV (se abre en Excel, con acentos). */
export function CsvExportButton({
  filename,
  headers,
  rows,
  label = "Exportar a Excel",
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
}) {
  function toCsvValue(v: string | number) {
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  function onExport() {
    const lines = [headers, ...rows].map((r) => r.map(toCsvValue).join(";"));
    // BOM (acentos) + "sep=;" para que Excel separe en columnas sea cual sea
    // la configuración regional del equipo.
    const csv = "﻿" + "sep=;\r\n" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={onExport}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
