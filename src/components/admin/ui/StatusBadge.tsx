import React from "react";
import { ORDER_STATUS, STOCK_LABEL, type OrderStatusKey } from "@/lib/order-meta";

export function StatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS[status as OrderStatusKey];
  if (!meta) {
    return <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{status}</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function StockBadge({ location }: { location: string }) {
  return (
    <span className="inline-flex rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-primary">
      {STOCK_LABEL[location] ?? location}
    </span>
  );
}
