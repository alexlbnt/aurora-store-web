"use client";

import React, { useState } from "react";
import Image from "next/image";

interface OrderItemData {
  id: string;
  quantity: number;
  price: any;
  product: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: any;
  status: string;
  shippingType: string;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingCep?: string | null;
  notes?: string | null;
  totalAmount: any;
  items: OrderItemData[];
}

export default function OrderCard({ order }: { order: OrderData }) {
  const [expanded, setExpanded] = useState(false);

  let statusColor = "slate";
  let statusText = "Em processamento";
  switch (order.status) {
    case "PENDING":
      statusColor = "amber";
      statusText = "Aguardando Pagamento";
      break;
    case "PAID":
      statusColor = "emerald";
      statusText = "Pagamento Aprovado";
      break;
    case "SHIPPED":
      statusColor = "blue";
      statusText = "Enviado / Em Transporte";
      break;
    case "DELIVERED":
      statusColor = "emerald";
      statusText = "Entregue";
      break;
    case "CANCELED":
      statusColor = "rose";
      statusText = "Cancelado";
      break;
  }

  let shippingLabel = "Sem Frete";
  if (order.shippingType === "PAGO_AURORA") shippingLabel = "Frete Cortesia Aurora";
  if (order.shippingType === "PAGO_CLIENTE") shippingLabel = "Frete Pago pelo Cliente";

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
          <div className="flex -space-x-2">
            {(order.items || []).slice(0, 4).map((item) => {
              const imgUrl = item.product?.images?.[0]?.url;
              return (
                <div
                  key={item.id}
                  className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                  title={item.product?.name || "Produto"}
                >
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.product?.name || "Produto"} className="w-full h-full object-cover" />
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
              {order.notes && (
                <p className="text-xs text-slate-500 mt-2 bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold">Observação:</span> {order.notes}
                </p>
              )}
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
                      <div className="w-14 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {imgUrl ? (
                          <img src={imgUrl} alt={item.product?.name || "Produto"} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">image</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.product?.name || "Produto"}</p>
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
