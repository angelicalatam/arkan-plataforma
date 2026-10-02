"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setIncidentStatus } from "@/lib/incidents/actions";
import { INCIDENT_STATUSES, type IncidentStatus } from "@/lib/incidents/types";
import { inputClass } from "@/components/ui/Form";

export function IncidentStatusControl({
  incidentId,
  status,
}: {
  incidentId: string;
  status: IncidentStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onChange(next: IncidentStatus) {
    setSaving(true);
    await setIncidentStatus(incidentId, next);
    setSaving(false);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink-600">
      Estado:
      <select
        className={`${inputClass} max-w-[12rem]`}
        value={status}
        onChange={(e) => onChange(e.target.value as IncidentStatus)}
      >
        {INCIDENT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
    </label>
  );
}
