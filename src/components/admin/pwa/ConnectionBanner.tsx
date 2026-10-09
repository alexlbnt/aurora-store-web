"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Aviso fixo quando o celular perde a internet. Quem vende na rua precisa saber disso
 * antes de preencher uma venda: sem conexão, nada é salvo.
 */
export default function ConnectionBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;

  return (
    <div
      role="alert"
      className="sticky top-16 z-20 flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 lg:px-8"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">wifi_off</span>
      <p>
        <strong className="font-semibold">Sem internet.</strong> Vendas, clientes e produtos não serão salvos até a
        conexão voltar. Anote o que precisar e registre depois.
      </p>
    </div>
  );
}
