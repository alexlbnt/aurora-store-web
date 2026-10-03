"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, RefreshCw, AlertTriangle, Clock, CheckCircle2, ChevronRight, PackageX } from "lucide-react";

interface AlertItem {
  id: string;
  category: "order" | "stock" | "sale";
  type: "pending_order" | "low_stock" | "recent_sale";
  severity: "warning" | "danger" | "success";
  title: string;
  description: string;
  timeAgo: string;
  createdAt: string;
  href: string;
}

interface NotificationData {
  alerts: AlertItem[];
  counts: {
    total: number;
    unread: number;
    pending: number;
    stock: number;
    recent: number;
  };
  updatedAt: string;
}

export default function AdminNotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "order" | "stock">("all");
  const [data, setData] = useState<NotificationData>({
    alerts: [],
    counts: { total: 0, unread: 0, pending: 0, stock: 0, recent: 0 },
    updatedAt: "",
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Falha ao buscar alertas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca inicial e polling a cada 35 segundos para alertas em tempo real
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 35000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredAlerts = data.alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.category === filter;
  });

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botão de Notificação */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Abrir central de alertas e notificações"
        title="Alertas e Notificações"
        className={`relative size-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
          isOpen
            ? "bg-primary/20 text-primary dark:text-primary"
            : "hover:bg-primary/10 text-slate-600 dark:text-slate-400 hover:text-primary active:scale-95"
        }`}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />

        {/* Badge Indicador de Alertas Não Lidos */}
        {data.counts.unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {data.counts.unread > 9 ? "9+" : data.counts.unread}
          </span>
        )}
      </button>

      {/* Backdrop invisível no mobile para facilitar toque fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover / Card Suspenso */}
      {isOpen && (
        <div
          className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-18 sm:top-full sm:mt-2 z-50 w-auto sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Cabeçalho do Popover */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  Central de Alertas
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.counts.unread > 0
                    ? `${data.counts.unread} ${data.counts.unread === 1 ? "alerta requer" : "alertas requerem"} atenção`
                    : "Tudo atualizado e em ordem"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              title="Atualizar alertas agora"
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {/* Abas de Filtro Rápidas */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-3 pt-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`pb-2 px-1 font-semibold border-b-2 transition-all cursor-pointer ${
                filter === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Todos ({data.counts.total})
            </button>
            <button
              type="button"
              onClick={() => setFilter("order")}
              className={`pb-2 px-1 font-semibold border-b-2 transition-all cursor-pointer ${
                filter === "order"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Pedidos ({data.counts.pending})
            </button>
            <button
              type="button"
              onClick={() => setFilter("stock")}
              className={`pb-2 px-1 font-semibold border-b-2 transition-all cursor-pointer ${
                filter === "stock"
                  ? "border-rose-500 text-rose-600 dark:text-rose-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Estoque ({data.counts.stock})
            </button>
          </div>

          {/* Lista de Alertas */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nenhum alerta nesta categoria
                </p>
                <p className="text-[11px] mt-0.5 text-slate-400">
                  Novos pedidos e avisos de estoque surgirão aqui automaticamente.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 p-3 sm:p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                >
                  {/* Ícone por tipo de severidade */}
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.severity === "danger"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        : alert.severity === "warning"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {alert.type === "low_stock" ? (
                      <PackageX className="w-4 h-4" />
                    ) : alert.type === "pending_order" ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  {/* Detalhes do Alerta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                        {alert.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {alert.timeAgo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {alert.description}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <Link
              href="/admin/sales"
              onClick={() => setIsOpen(false)}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Ver Vendas</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/admin/products"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1"
            >
              <span>Ver Produtos</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
