"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, CircleDot, CircleCheck } from "lucide-react";
import { updateConversation, deleteConversation } from "@/lib/conversations/actions";
import type { ConversationStatus } from "@/lib/conversations/types";

export function ConversationActions({
  conversationId,
  supplierId,
  status,
}: {
  conversationId: string;
  supplierId: string;
  status: ConversationStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    await updateConversation(conversationId, supplierId, {
      status: status === "abierta" ? "cerrada" : "abierta",
    });
    setLoading(false);
    router.refresh();
  }

  async function onDelete() {
    if (
      !window.confirm(
        "¿Eliminar esta conversación y todas sus notas? Esta acción no se puede deshacer.",
      )
    )
      return;
    setLoading(true);
    const res = await deleteConversation(conversationId, supplierId);
    if (!res.ok) {
      setLoading(false);
      window.alert("No se pudo eliminar: " + res.error);
      return;
    }
    router.push(`/proveedores/${supplierId}`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleStatus}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-60"
      >
        {status === "abierta" ? (
          <>
            <CircleCheck className="h-4 w-4 text-green-600" /> Marcar como cerrada
          </>
        ) : (
          <>
            <CircleDot className="h-4 w-4 text-brand-600" /> Reabrir
          </>
        )}
      </button>
      <button
        onClick={onDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Eliminar
      </button>
    </div>
  );
}
