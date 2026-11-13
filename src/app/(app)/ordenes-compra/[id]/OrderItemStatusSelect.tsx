"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderItemStatus } from "@/lib/purchase-orders/actions";
import {
  ORDER_ITEM_STATUSES,
  orderItemStatusInfo,
  type OrderItemStatus,
} from "@/lib/purchase-orders/types";

const TONE_CLASS: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  green: "border-green-200 bg-green-50 text-green-700",
  ink: "border-ink-200 bg-ink-100 text-ink-700",
  red: "border-red-200 bg-red-50 text-red-700",
};

/** Selector de estado de un producto de la orden, con guardado al cambiar. */
export function OrderItemStatusSelect({
  itemId,
  orderId,
  status,
}: {
  itemId: string;
  orderId: string;
  status: OrderItemStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderItemStatus>(status);
  const [pending, startTransition] = useTransition();
  const tone = orderItemStatusInfo(value).tone;

  function onChange(next: OrderItemStatus) {
    setValue(next);
    startTransition(async () => {
      await setOrderItemStatus(itemId, orderId, next);
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OrderItemStatus)}
      disabled={pending}
      className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-60 ${TONE_CLASS[tone] ?? TONE_CLASS.ink}`}
    >
      {ORDER_ITEM_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
