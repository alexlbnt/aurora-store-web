import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/admin/ui/PageHeader";
import MetricCard from "@/components/admin/ui/MetricCard";
import { formatBRL, formatDate } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/order-meta";
import { monthKeyOf, monthLabel, normalizeMonthKey, shiftMonth } from "@/lib/finance";
import { loadMonthlyClosing, type MonthlyClosing } from "./data";

export const revalidate = 0;

const cardClass = "rounded-lg border border-primary/10 bg-white p-4 sm:p-6";
const titleClass = "mb-4 text-lg font-semibold text-primary";

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = (await searchParams) || {};
  const monthKey = normalizeMonthKey(month);
  const currentKey = monthKeyOf(new Date());
  const isCurrent = monthKey === currentKey;
  const label = monthLabel(monthKey);

  let data: MonthlyClosing | null = null;
  try {
    data = await loadMonthlyClosing(monthKey);
  } catch (err) {
    console.error("Error loading monthly closing:", err);
  }

  return (
    <AdminLayout pageTitle="Financeiro">
      <PageHeader
        description="Fechamento do mês: quanto foi vendido, quanto entrou e o que ainda falta receber."
        actions={
          <a
            href={`/api/admin/export/finance?month=${monthKey}`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-white px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">download</span>
            Baixar fechamento (CSV)
          </a>
        }
      />

      {/* Navegação entre meses */}
      <nav aria-label="Escolher o mês" className="mb-6 flex items-center justify-between gap-2 rounded-lg border border-primary/10 bg-white p-2">
        <Link
          href={`/admin/finance?month=${shiftMonth(monthKey, -1)}`}
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_left</span>
          <span className="hidden sm:inline">Mês anterior</span>
        </Link>
        <p className="text-center">
          <span className="block text-lg font-semibold text-primary">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
          {!isCurrent && (
            <Link href="/admin/finance" className="text-xs text-accent-blue underline-offset-4 hover:underline">
              Voltar para o mês atual
            </Link>
          )}
          {isCurrent && <span className="text-xs text-primary/60">Mês em andamento</span>}
        </p>
        {isCurrent ? (
          <span className="min-h-11 w-11 sm:w-32" aria-hidden="true" />
        ) : (
          <Link
            href={`/admin/finance?month=${shiftMonth(monthKey, 1)}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            <span className="hidden sm:inline">Próximo mês</span>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
          </Link>
        )}
      </nav>

      {!data ? (
        <p className={`${cardClass} text-sm text-primary/70`}>
          Não foi possível carregar o financeiro agora. Verifique a conexão e recarregue a página.
        </p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricCard
              label="Vendido no mês"
              value={formatBRL(data.sold.total)}
              hint={`${data.sold.orders} ${data.sold.orders === 1 ? "pedido" : "pedidos"} · ${data.sold.pieces} ${data.sold.pieces === 1 ? "peça" : "peças"}`}
            />
            <MetricCard label="Recebido no mês" value={formatBRL(data.received.total)} hint="Pela data em que o dinheiro entrou" />
            <MetricCard
              label="Pendente do mês"
              value={formatBRL(data.pendingFromMonth)}
              hint="Das vendas deste mês, falta receber"
              attention={data.pendingFromMonth > 0}
            />
            <MetricCard
              label="Total a receber"
              value={formatBRL(data.pendingOverall)}
              hint={`${data.openOrders.length} ${data.openOrders.length === 1 ? "pedido em aberto" : "pedidos em aberto"}, de qualquer mês`}
              href={data.openOrders.length > 0 ? "#em-aberto" : undefined}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className={cardClass} aria-labelledby="entradas">
              <h2 id="entradas" className={titleClass}>Entradas por forma de pagamento</h2>
              {data.received.byMethod.length === 0 ? (
                <p className="text-sm text-primary/60">Nenhum recebimento neste mês.</p>
              ) : (
                <ul className="space-y-3">
                  {data.received.byMethod.map((m) => {
                    const pct = data.received.total > 0 ? Math.round((m.amount / data.received.total) * 100) : 0;
                    return (
                      <li key={m.method}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-medium text-primary">
                            {PAYMENT_LABEL[m.method] ?? m.method}{" "}
                            <span className="font-normal text-primary/60">({m.count})</span>
                          </span>
                          <span className="font-semibold text-primary">
                            {formatBRL(m.amount)} <span className="font-normal text-primary/60">· {pct}%</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
                          <div className="h-full rounded-full bg-accent-blue" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={cardClass} aria-labelledby="resumo-fechamento">
              <h2 id="resumo-fechamento" className={titleClass}>Resumo do fechamento</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Vendas do mês (sem cancelados)" value={formatBRL(data.sold.total)} />
                {data.sold.discount > 0 && <Row label="Descontos dados" value={`− ${formatBRL(data.sold.discount)}`} muted />}
                <Row label="Recebido de vendas deste mês" value={formatBRL(data.received.fromThisMonth)} />
                <Row label="Recebido de vendas de outros meses" value={formatBRL(data.received.fromEarlierMonths)} />
                <div className="border-t border-primary/10 pt-2">
                  <Row label="Total que entrou no mês" value={formatBRL(data.received.total)} strong />
                </div>
                <Row label="Ainda falta receber das vendas do mês" value={formatBRL(data.pendingFromMonth)} />
              </dl>
            </section>
          </div>

          <section className={`${cardClass} mb-6`} aria-labelledby="producao-vendas">
            <h2 id="producao-vendas" className={titleClass}>Produzido x vendido no mês</h2>
            {data.products.length === 0 ? (
              <p className="text-sm text-primary/60">
                Nenhuma produção lançada nem venda neste mês. A produção é lançada em Produtos, no menu de cada produto.
              </p>
            ) : (
              <div className="-mx-4 overflow-x-auto sm:mx-0">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead className="border-b border-primary/10 text-primary/70">
                    <tr>
                      <th className="px-4 py-2 font-medium sm:px-2">Produto</th>
                      <th className="px-2 py-2 text-right font-medium">Produzido</th>
                      <th className="px-2 py-2 text-right font-medium">Vendido</th>
                      <th className="px-2 py-2 text-right font-medium">Em estoque</th>
                      <th className="px-4 py-2 text-right font-medium sm:px-2">Faturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {data.products.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 font-medium text-primary sm:px-2">{p.name}</td>
                        <td className="px-2 py-2.5 text-right text-primary">{p.produced}</td>
                        <td className="px-2 py-2.5 text-right text-primary">{p.sold}</td>
                        <td className="px-2 py-2.5 text-right text-primary/70">{p.stock}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-primary sm:px-2">{formatBRL(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-primary/15 font-semibold text-primary">
                    <tr>
                      <td className="px-4 py-2.5 sm:px-2">Total</td>
                      <td className="px-2 py-2.5 text-right">{data.products.reduce((a, p) => a + p.produced, 0)}</td>
                      <td className="px-2 py-2.5 text-right">{data.products.reduce((a, p) => a + p.sold, 0)}</td>
                      <td className="px-2 py-2.5" />
                      <td className="px-4 py-2.5 text-right sm:px-2">
                        {formatBRL(data.products.reduce((a, p) => a + p.revenue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <p className="mt-2 px-4 text-xs text-primary/60 sm:px-2">
                  Faturado é o valor das peças antes do desconto do pedido.
                </p>
              </div>
            )}
          </section>

          <section id="em-aberto" className={cardClass} aria-labelledby="pedidos-em-aberto">
            <h2 id="pedidos-em-aberto" className={titleClass}>
              Pedidos com valor a receber ({data.openOrders.length})
            </h2>
            {data.openOrders.length === 0 ? (
              <p className="text-sm text-primary/60">Nenhum pedido com valor em aberto. Tudo recebido.</p>
            ) : (
              <ul className="divide-y divide-primary/10">
                {data.openOrders.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/sales/${o.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-accent-cream"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-primary">{o.customerName}</p>
                        <p className="text-xs text-primary/60">
                          {o.orderNumber} · {formatDate(o.createdAt)}
                          {o.paid > 0 ? ` · pago ${formatBRL(o.paid)} de ${formatBRL(o.total)}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs text-primary/60">Falta</span>
                        <span className="font-semibold text-amber-900">{formatBRL(o.remaining)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={muted ? "text-primary/60" : "text-primary/80"}>{label}</dt>
      <dd className={strong ? "text-lg font-semibold text-primary" : muted ? "text-primary/60" : "font-medium text-primary"}>
        {value}
      </dd>
    </div>
  );
}
