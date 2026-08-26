"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/projects/actions";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/projects/types";
import { inputClass } from "@/components/ui/Form";

export function ProjectStatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ProjectStatus>(status);
  const [saving, setSaving] = useState(false);

  async function onChange(v: ProjectStatus) {
    setValue(v);
    setSaving(true);
    await updateProject(projectId, { status: v });
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
        Estado de la obra {saving && <span className="text-ink-400">· guardando…</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectStatus)}
        className={inputClass}
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-ink-400">
        Al marcar “En ejecución” o “Finalizada” se registra la fecha real automáticamente.
      </p>
    </div>
  );
}
