"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-hosts";
import { whatsappLink } from "@/lib/contact";
import { customerOrderStatus, ORDER_STEPS, shippingLabel as describeShipping } from "@/lib/order-status";

interface OrderItemData {
  id: string;
  quantity: number;
  price: number | string;
  product: {
    id: string;
    slug?: string | null;
    name: string;
    images?: { url: string }[];
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string | Date;
  status: string;
  shippingType: string;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCep?: string | null;
  notes?: string | null;
  totalAmount: number | string;
  items: OrderItemData[];
}

export default function OrderCard({ order }: { order: OrderData }) {
  const [expanded, setExpanded] = useState(false);

  const status = customerOrderStatus(order.status);
  const statusColor = status.tone;
  const statusText = status.label;
  const shippingLabel = describeShipping(order.shippingType);
  const whatsapp = whatsappLink(`Olá! Quero falar sobre o meu pedido ${order.orderNumber}.`);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-bold text-slate-900 text-lg">Pedido #{order.orderNumber}</span>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                statusColor === "emerald"
                  ? "bg-emerald-100 text-emerald-700"
                  : statusColor === "amber"
                  ? "bg-amber-100 text-amber-700"
                  : statusColor === "blue"
                  ? "bg-blue-100 text-blue-700"
                  : statusColor === "rose"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {statusText}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Realizado em {new Date(order.createdAt).toLocaleDateString("pt-BR")} às{" "}
            {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {status.hint && <p className="text-sm text-slate-700 mb-3 max-w-md">{status.hint}</p>}
          {status.step >= 0 && (
            <ol className="flex flex-wrap items-center gap-x-1 gap-y-1.5 mb-4 text-[11px] font-semibold" aria-label="Andamento do pedido">
              {ORDER_STEPS.map((step, i) => {
                const done = i <= status.step;
                return (
                  <li key={step.code} className="flex items-center gap-1" aria-current={i === status.step ? "step" : undefined}>
                    <span
                      className={`px-2 py-1 rounded-full ${done ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {step.label}
                    </span>
                    {i < ORDER_STEPS.length - 1 && <span className={`w-3 h-px ${done ? "bg-primary" : "bg-slate-300"}`} aria-hidden="true" />}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="flex -space-x-2">
            {(order.items || []).slice(0, 4).map((item) => {
              const imgUrl = item.product?.images?.[0]?.url;
              return (
                <div
                  key={item.id}
                  className="relative w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                  title={item.product?.name || "Produto"}
                >
                  {imgUrl ? (
                    <Image src={imgUrl} alt={item.product?.name || "Produto"} fill sizes="40px" unoptimized={!canOptimizeImage(imgUrl)} className="object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-slate-400">inventory_2</span>
                  )}
                </div>
              );
            })}
            {(order.items || []).length > 4 && (
              <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold text-slate-500">
                +{order.items.length - 4}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-3 md:gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div className="text-left md:text-right">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</p>
            <p className="text-xl font-extrabold text-primary">
              R$ {Number(order.totalAmount).toFixed(2).replace(".", ",")}
            </p>
          </div>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-10 px-4 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Falar sobre este pedido
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {expanded ? "Ocultar detalhes" : "Ver detalhes"}
            <span className="material-symbols-outlined text-[16px] transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      {expanded && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-fadeIn">
          {/* Informações de Entrega e Envio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
            <div>
              <p className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
                Endereço de Entrega
              </p>
              {order.shippingAddress ? (
                <p className="text-slate-600">
                  {order.shippingAddress}
                  {order.shippingCity && `, ${order.shippingCity}`}
                  {order.shippingState && ` - ${order.shippingState}`}
                  {order.shippingCep && ` (CEP: ${order.shippingCep})`}
                </p>
              ) : (
                <p className="text-slate-400 italic">Endereço não informado / Retirada</p>
              )}
            </div>

            <div>
              <p className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-primary text-base">package_2</span>
                Tipo de Frete
              </p>
              <p className="text-slate-600">{shippingLabel}</p>
              {/* As observações do pedido não aparecem aqui: o painel também anota nelas informações internas. */}
            </div>
          </div>

          {/* Lista de Itens do Pedido */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">Produtos Comprados</h4>
            <div className="space-y-3">
              {(order.items || []).map((item) => {
                const imgUrl = item.product?.images?.[0]?.url;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {imgUrl ? (
                          <Image src={imgUrl} alt={item.product?.name || "Produto"} fill sizes="56px" unoptimized={!canOptimizeImage(imgUrl)} className="object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">image</span>
                        )}
                      </div>
                      <div>
                        {item.product ? (
                          <Link
                            href={`/product/${item.product.slug || item.product.id}`}
                            className="font-bold text-slate-900 text-sm hover:underline underline-offset-4"
                          >
                            {item.product.name.trim()}
                          </Link>
                        ) : (
                          <p className="font-bold text-slate-900 text-sm">Produto</p>
                        )}
                        <p className="text-xs text-slate-500">Qtd: {item.quantity} un.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">
                        R$ {(Number(item.price) * item.quantity).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-xs text-slate-400">
                        (R$ {Number(item.price).toFixed(2).replace(".", ",")} cada)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
