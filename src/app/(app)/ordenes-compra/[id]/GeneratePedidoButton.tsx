"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { FileText, Loader2 } from "lucide-react";
import { createOrderRequestFromOrder } from "@/lib/order-requests/actions";

/** Genera un pedido a proveedor a partir de la orden y abre su editor. */
export function GeneratePedidoButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    const res = await createOrderRequestFromOrder(orderId);
    if (!res.ok) {
      setLoading(false);
      setError(res.error);
      return;
    }
    router.push(`/ordenes-compra/${orderId}/pedidos/${res.id}` as Route);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Generar pedido a proveedor
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
