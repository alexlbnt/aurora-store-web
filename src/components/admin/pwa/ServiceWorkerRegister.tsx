"use client";

import { useEffect } from "react";

const SW_URL = "/admin-sw.js";

/**
 * Registra o service worker do painel (escopo /admin). Só em produção: em desenvolvimento
 * o cache de /_next/static serviria código antigo entre uma edição e outra, então lá
 * o registro é removido se existir.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations
          .filter((r) => r.active?.scriptURL.endsWith(SW_URL))
          .forEach((r) => r.unregister());
      });
      return;
    }

    navigator.serviceWorker.register(SW_URL, { scope: "/admin" }).catch((err) => {
      console.warn("Não foi possível registrar o service worker do painel:", err);
    });
  }, []);

  return null;
}
