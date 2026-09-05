"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateItemProgress } from "@/lib/projects/actions";
import {
  ITEM_STATUSES,
  itemStatusInfo,
  statusFromPct,
  pctFromStatus,
  type ItemStatus,
  type ProjectItem,
} from "@/lib/projects/types";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { inputClass } from "@/components/ui/Form";

export function ProjectItemProgress({
  projectId,
  item,
}: {
  projectId: string;
  item: ProjectItem;
}) {
  const router = useRouter();
  const [pct, setPct] = useState<number>(Number(item.pct_done) || 0);
  const [status, setStatus] = useState<ItemStatus>(item.item_status);
  const [saving, setSaving] = useState(false);

  async function save(next: { pct_done?: number; item_status?: ItemStatus }) {
    setSaving(true);
    await updateItemProgress(item.id, projectId, next);
    setSaving(false);
    router.refresh();
  }

  // Al cambiar el %, ajusta el estado en consecuencia (y guarda ambos).
  function onPctCommit(value: number) {
    const nextStatus = statusFromPct(value, status);
    setStatus(nextStatus);
    save({ pct_done: value, item_status: nextStatus });
  }

  // Al cambiar el estado, ajusta el % en consecuencia (y guarda ambos).
  function onStatusChange(value: ItemStatus) {
    const nextPct = pctFromStatus(value, pct);
    setStatus(value);
    setPct(nextPct);
    save({ item_status: value, pct_done: nextPct });
  }

  const si = itemStatusInfo(status);

  return (
    <div className="border-b border-ink-50 px-4 py-3 last:border-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-800">
            {item.code && <span className="mr-1.5 text-ink-400">{item.code}</span>}
            {item.description}
          </p>
          <p className="text-xs text-ink-400">
            {item.quantity} {item.unit}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
          <Badge tone={si.tone}>{si.label}</Badge>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2">
          <ProgressBar value={pct} className="flex-1" />
          <span className="w-10 text-right text-xs font-medium text-ink-600">{Math.round(pct)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            onBlur={() => {
              if ((Number(item.pct_done) || 0) !== pct) onPctCommit(pct);
            }}
            className={`${inputClass} w-20 text-right`}
            title="% ejecutado"
          />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ItemStatus)}
            className={`${inputClass} max-w-[11rem]`}
          >
            {ITEM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
