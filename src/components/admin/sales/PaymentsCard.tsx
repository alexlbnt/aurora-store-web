"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addOrderPayment, deleteOrderPayment } from "@/app/admin/sales/actions";
import { showToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/admin/ui/ConfirmDialog";
import ChoiceChips from "@/components/admin/ui/ChoiceChips";
import { formatBRL, formatDate, parseBRL, toBRLInput } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/order-meta";
import { todayInput } from "@/lib/finance";

type Method = "PIX" | "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO";

export interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  notes: string | null;
}

interface PaymentsCardProps {
  orderId: string;
  status: string;
  total: number;
  paid: number;
  remaining: number;
  defaultMethod: Method;
  payments: PaymentRow[];
}

/** Recebimentos do pedido: baixa parcial ou total, com histórico e estorno. */
export default function PaymentsCard({ orderId, status, total, paid, remaining, defaultMethod, payments }: PaymentsCardProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>(defaultMethod);
  const [paidAt, setPaidAt] = useState(() => todayInput());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canceled = status === "CANCELED";
  const settled = remaining <= 0;
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  const openForm = (fill?: number) => {
    setAmount(fill ? toBRLInput(fill) : "");
    setMethod(defaultMethod);
    setPaidAt(todayInput());
    setNotes("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseBRL(amount);
    if (!Number.isFinite(n) || n <= 0) {
      showToast("Informe o valor recebido.", "warning");
      return;
    }
    if (n > remaining + 0.001) {
      showToast(`O valor passa do que falta receber (${formatBRL(remaining)}).`, "warning");
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("method", method);
    formData.append("paidAt", paidAt);
    formData.append("notes", notes);
    try {
      const res = await addOrderPayment(orderId, formData);
      if (!("settled" in res)) {
        showToast(res.error ?? "Não foi possível registrar o recebimento.", "error");
        return;
      }
      showToast(
        res.settled ? "Pedido quitado." : `Recebimento lançado. Falta ${formatBRL(res.remaining ?? 0)}.`,
        "success"
      );
      setOpen(false);
      router.refresh();
    } catch {
      showToast("A conexão falhou. Recarregue a página para conferir se o recebimento entrou.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: PaymentRow) => {
    const ok = await confirm({
      title: "Excluir este recebimento?",
      description: `${formatBRL(p.amount)} de ${formatDate(p.paidAt)} volta a ficar pendente neste pedido.`,
      confirmLabel: "Excluir recebimento",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteOrderPayment(p.id);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    showToast("Recebimento excluído.", "success");
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-primary/10 bg-white p-4 sm:p-6" aria-labelledby="recebimentos">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="recebimentos" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">payments</span>
          Recebimentos
        </h2>
        {!canceled && !settled && !open && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openForm()}
              className="min-h-11 rounded-lg border border-primary/25 bg-white px-4 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Pagamento parcial
            </button>
            <button
              type="button"
              onClick={() => openForm(remaining)}
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-accent-blue"
            >
              Receber {formatBRL(remaining)}
            </button>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-accent-cream p-3">
          <dt className="text-xs text-primary/60">Total</dt>
          <dd className="font-semibold text-primary">{formatBRL(total)}</dd>
        </div>
        <div className="rounded-lg bg-accent-cream p-3">
          <dt className="text-xs text-primary/60">Recebido</dt>
          <dd className="font-semibold text-primary">{formatBRL(paid)}</dd>
        </div>
        <div className={`rounded-lg p-3 ${!canceled && !settled ? "bg-amber-50 ring-1 ring-amber-300" : "bg-accent-cream"}`}>
          <dt className="text-xs text-primary/60">Falta</dt>
          <dd className={`font-semibold ${!canceled && !settled ? "text-amber-900" : "text-primary"}`}>{formatBRL(remaining)}</dd>
        </div>
      </dl>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10"
        role="progressbar"
        aria-label="Quanto do pedido já foi recebido"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-dew" style={{ width: `${percent}%` }} />
      </div>
      {canceled && (
        <p className="mt-3 text-sm text-primary/70">Pedido cancelado: não entra no financeiro.</p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-lg border border-primary/15 p-4" noValidate>
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="payment-amount" className="mb-1.5 block text-sm font-semibold text-primary">
                Valor recebido (R$)
              </label>
              <input
                id="payment-amount"
                type="text"
                inputMode="decimal"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d,.]/g, ""))}
                placeholder={toBRLInput(remaining)}
                className="min-h-12 w-40 rounded-lg border border-primary/20 bg-accent-cream px-3.5 text-base text-primary"
              />
              <p className="mt-1 text-xs text-primary/60">Falta {formatBRL(remaining)}</p>
            </div>
            <div>
              <label htmlFor="payment-date" className="mb-1.5 block text-sm font-semibold text-primary">
                Data
              </label>
              <input
                id="payment-date"
                type="date"
                value={paidAt}
                max={todayInput()}
                onChange={(e) => setPaidAt(e.target.value)}
                className="min-h-12 rounded-lg border border-primary/20 bg-accent-cream px-3.5 text-base text-primary"
              />
            </div>
          </div>
          <ChoiceChips<Method>
            name="paymentMethodReceived"
            legend="Forma de pagamento"
            value={method}
            onChange={setMethod}
            options={(["PIX", "CASH", "CREDIT_CARD", "DEBIT_CARD", "BOLETO"] as Method[]).map((v) => ({
              value: v,
              label: PAYMENT_LABEL[v],
            }))}
          />
          <div>
            <label htmlFor="payment-notes" className="mb-1.5 block text-sm font-semibold text-primary">
              Observação <span className="font-normal text-primary/60">(opcional)</span>
            </label>
            <input
              id="payment-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="1ª parcela, sinal, comprovante…"
              className="min-h-11 w-full rounded-lg border border-primary/20 bg-accent-cream px-3 text-base text-primary placeholder:text-primary/40"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-primary/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-accent-blue disabled:opacity-50"
            >
              {saving && (
                <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>
              )}
              {saving ? "Lançando…" : "Dar baixa"}
            </button>
          </div>
        </form>
      )}

      {payments.length > 0 ? (
        <ul className="mt-5 divide-y divide-primary/10 rounded-lg border border-primary/15 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold text-primary">{formatBRL(p.amount)}</p>
                <p className="truncate text-xs text-primary/60">
                  {formatDate(p.paidAt)} · {PAYMENT_LABEL[p.method] ?? p.method}
                  {p.notes ? ` · ${p.notes}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(p)}
                aria-label={`Excluir recebimento de ${formatBRL(p.amount)}`}
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-primary/50 hover:bg-dawn/20 hover:text-dawn-ink"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !open && <p className="mt-4 text-sm text-primary/60">Nenhum valor recebido ainda.</p>
      )}
    </section>
  );
}
