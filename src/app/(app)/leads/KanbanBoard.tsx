"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { GripVertical } from "lucide-react";
import type { Customer, CrmStage } from "@/lib/crm/types";
import { updateCustomerStage } from "@/lib/crm/actions";
import { formatCurrency } from "@/lib/format";
import { stageTone } from "@/components/ui/Badge";

const dotColor: Record<string, string> = {
  brand: "bg-brand-500",
  ink: "bg-ink-400",
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

export function KanbanBoard({
  stages,
  customers: initial,
}: {
  stages: CrmStage[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  async function moveTo(customerId: string, stageId: string) {
    const current = customers.find((c) => c.id === customerId);
    if (!current || current.stage_id === stageId) return;

    // Actualización optimista
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, stage_id: stageId, stage: stages.find((s) => s.id === stageId) ?? null }
          : c,
      ),
    );
    const res = await updateCustomerStage(customerId, stageId);
    if (!res.ok) {
      setCustomers(initial); // revertir
      window.alert("No se pudo mover: " + res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const items = customers.filter((c) => c.stage_id === stage.id);
        const total = items.reduce((sum, c) => sum + (c.potential_value ?? 0), 0);
        const isOver = overStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOverStage(null);
              if (dragId) moveTo(dragId, stage.id);
              setDragId(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-ink-50/60 ${
              isOver ? "border-brand-400 ring-2 ring-brand-400/30" : "border-ink-200"
            }`}
          >
            {/* Cabecera de columna */}
            <div className="flex items-center justify-between gap-2 border-b border-ink-200 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor[stageTone(stage.color)]}`} />
                <span className="text-sm font-semibold text-ink-800">{stage.label}</span>
                <span className="rounded-full bg-ink-200 px-1.5 text-xs font-medium text-ink-600">
                  {items.length}
                </span>
              </div>
            </div>

            {/* Tarjetas */}
            <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: 120 }}>
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`group rounded-lg border border-ink-200 bg-white p-3 shadow-sm transition ${
                    dragId === c.id ? "opacity-50" : "hover:shadow"
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-ink-300 group-hover:text-ink-400" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/clientes/${c.id}` as Route}
                        className="block truncate text-sm font-medium text-ink-900 hover:text-brand-700"
                      >
                        {c.name}
                      </Link>
                      {c.city && <p className="truncate text-xs text-ink-400">{c.city}</p>}
                      {c.potential_value ? (
                        <p className="mt-1 text-xs font-semibold text-brand-700">
                          {formatCurrency(c.potential_value)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-ink-300">
                  Arrastra aquí
                </p>
              )}
            </div>

            {/* Pie con total */}
            {total > 0 && (
              <div className="border-t border-ink-200 px-3 py-2 text-right text-xs font-medium text-ink-500">
                {formatCurrency(total)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
