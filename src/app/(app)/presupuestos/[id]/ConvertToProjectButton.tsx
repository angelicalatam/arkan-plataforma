"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Loader2 } from "lucide-react";
import { convertQuoteToProject } from "@/lib/projects/actions";

export function ConvertToProjectButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (
      !window.confirm(
        "¿Convertir este presupuesto en una obra? Se copiarán los capítulos, las partidas y los costes.",
      )
    )
      return;
    setLoading(true);
    const res = await convertQuoteToProject(quoteId);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo convertir: " + res.error);
      return;
    }
    router.push(`/obras/${res.id}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardHat className="h-4 w-4" />}
      Convertir en obra
    </button>
  );
}
