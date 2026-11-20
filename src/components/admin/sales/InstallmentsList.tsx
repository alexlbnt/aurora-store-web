import React from "react";
import { formatBRL } from "@/lib/format";
import { installmentsLabel, type InstallmentStatus, type InstallmentView } from "@/lib/installments";

const STATUS: Record<InstallmentStatus, { label: string; className: string }> = {
  PAID: { label: "Paga", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  PARTIAL: { label: "Parcial", className: "bg-sky-50 text-sky-800 ring-sky-200" },
  OVERDUE: { label: "Atrasada", className: "bg-amber-50 text-amber-900 ring-amber-300" },
  OPEN: { label: "Em aberto", className: "bg-accent-cream text-primary/80 ring-primary/15" },
};
const NEUTRAL = "bg-accent-cream text-primary/70 ring-primary/15";

/** Data "AAAA-MM-DD" como "20/12/2026", sem passar por fuso. */
const showDate = (s: string) => s.split("-").reverse().join("/");

/** Parcelas do pedido com a situação de cada uma (calculada a partir das baixas). */
export default function InstallmentsList({ views, canceled }: { views: InstallmentView[]; canceled: boolean }) {
  return (
    <section className="rounded-lg border border-primary/10 bg-white p-4 sm:p-6" aria-labelledby="parcelas">
      <h2 id="parcelas" className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
        <span className="material-symbols-outlined text-primary" aria-hidden="true">calendar_month</span>
        Parcelas ({installmentsLabel(views)})
      </h2>
      <ol className="divide-y divide-primary/10">
        {views.map((v) => {
          const status = STATUS[v.status];
          return (
            <li
              key={v.number}
              data-testid={`installment-${v.number}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <span className="min-w-0 text-sm text-primary">
                <span className="font-semibold">
                  {v.number}/{views.length}
                </span>
                <span className="text-primary/70"> · vence {showDate(v.dueDate)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primary">{formatBRL(v.amount)}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${canceled ? NEUTRAL : status.className}`}
                >
                  {status.label}
                  {v.status === "PARTIAL" || (v.status === "OVERDUE" && v.paid > 0)
                    ? ` · faltam ${formatBRL(v.remaining)}`
                    : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
