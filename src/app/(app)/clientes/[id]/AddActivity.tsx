"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { addActivity } from "@/lib/crm/actions";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/crm/types";
import { inputClass } from "@/components/ui/Form";

export function AddActivity({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [type, setType] = useState<ActivityType>("nota");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() && !body.trim()) return;
    setLoading(true);
    setError(null);
    const res = await addActivity({ type, subject, body, customer_id: customerId });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSubject("");
    setBody("");
    setType("nota");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ActivityType)}
          className={`${inputClass} max-w-[9rem]`}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto (ej. Llamada de seguimiento)"
          className={inputClass}
        />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        placeholder="Detalle de la actividad…"
        className={inputClass}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Registrar
        </button>
      </div>
    </form>
  );
}
