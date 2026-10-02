"use client";

import { Printer, Download } from "lucide-react";

export function ReportActions({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  function toCsvValue(v: string | number) {
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  }

  function onExport() {
    const lines = [headers, ...rows].map((r) => r.map(toCsvValue).join(";"));
    // BOM para que Excel respete los acentos.
    const csv = "﻿" + lines.join("\r\n");
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
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
      >
        <Download className="h-4 w-4" />
        Exportar a Excel (CSV)
      </button>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </button>
    </div>
  );
}
