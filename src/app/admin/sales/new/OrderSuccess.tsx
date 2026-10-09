"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { formatBRL, whatsappToCustomer } from "@/lib/format";
import { PAYMENT_LABEL, SHIPPING_LABEL } from "@/lib/order-meta";

export interface SuccessSnapshot {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { label: string; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paid: boolean;
  shippingType: string;
  notes: string;
}

export default function OrderSuccess({ order, onNewOrder }: { order: SuccessSnapshot; onNewOrder: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Leva o foco ao título: quem usa leitor de tela fica sabendo que a venda foi registrada.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const lines = [
    `Olá, ${order.customerName}! Obrigada pela compra na Aurora.`,
    "",
    `*Pedido ${order.orderNumber}*`,
    ...order.items.map((i) => `▫️ ${i.label}: ${formatBRL(i.total)}`),
    "",
  ];
  if (order.discount > 0) {
    lines.push(`Subtotal: ${formatBRL(order.subtotal)}`, `Desconto: − ${formatBRL(order.discount)}`);
  }
  lines.push(`*Total: ${formatBRL(order.total)}*`);
  lines.push(`Pagamento: ${PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}${order.paid ? " (recebido)" : ""}`);
  if (order.shippingType !== "SEM_FRETE") lines.push(`Frete: ${SHIPPING_LABEL[order.shippingType]}`);
  if (order.notes) lines.push(`Observações: ${order.notes}`);

  const waLink = whatsappToCustomer(order.customerPhone, lines.join("\n"));

  return (
    <div className="mx-auto max-w-lg py-10 sm:py-16">
      <span className="material-symbols-outlined mb-4 block text-5xl text-primary" aria-hidden="true">
        check_circle
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="mb-2 font-serif text-4xl text-primary focus:outline-none">
        Pedido registrado
      </h2>
      <p className="mb-6 text-primary/80">
        Pedido <strong className="font-semibold text-primary">{order.orderNumber}</strong> de {order.customerName},{" "}
        {formatBRL(order.total)}. {order.paid ? "Entrou como pago." : "Entrou como pendente: marque como pago quando receber."} As
        peças já saíram do estoque.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onNewOrder}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-accent-blue"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
          Registrar outro pedido
        </button>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-white px-5 font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">forum</span>
            Enviar comprovante no WhatsApp
          </a>
        )}
        <Link
          href={`/admin/sales/${order.orderId}`}
          className="flex min-h-12 items-center justify-center rounded-lg px-5 font-semibold text-accent-blue underline underline-offset-4 hover:text-primary"
        >
          Ver o pedido
        </Link>
      </div>
    </div>
  );
}
