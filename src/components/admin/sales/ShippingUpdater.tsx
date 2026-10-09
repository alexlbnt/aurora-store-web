"use client";

import { useState } from "react";
import { updateOrderShipping } from "@/app/admin/sales/actions";
import { showToast } from "@/components/ui/Toast";
import { SHIPPING_LABEL } from "@/lib/order-meta";

type Shipping = "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE";

interface ShippingUpdaterProps {
  orderId: string;
  currentShipping: Shipping;
}

export default function ShippingUpdater({ orderId, currentShipping }: ShippingUpdaterProps) {
  const [isPending, setIsPending] = useState(false);

  const handleShippingChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShipping = e.target.value as Shipping;
    setIsPending(true);
    const result = await updateOrderShipping(orderId, newShipping);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Frete atualizado.", "success");
    }
    setIsPending(false);
  };

  return (
    <div>
      <label htmlFor="order-shipping" className="mb-1.5 block text-sm text-primary/70">
        Quem paga o frete
      </label>
      <div className="flex items-center gap-2">
        <select
          id="order-shipping"
          value={currentShipping}
          onChange={handleShippingChange}
          disabled={isPending}
          className="min-h-11 w-full cursor-pointer rounded-lg border border-primary/25 bg-accent-cream py-2 pl-3 pr-8 text-sm font-medium text-primary disabled:opacity-60"
        >
          {(Object.keys(SHIPPING_LABEL) as Shipping[]).map((value) => (
            <option key={value} value={value}>
              {SHIPPING_LABEL[value]}
            </option>
          ))}
        </select>
        {isPending && (
          <span role="status" className="shrink-0 text-sm text-primary/60">
            Salvando…
          </span>
        )}
      </div>
    </div>
  );
}
