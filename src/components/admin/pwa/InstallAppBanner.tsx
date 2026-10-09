"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { showToast } from "@/components/ui/Toast";

// Evento do Chrome/Edge/Samsung Internet que permite abrir o pedido de instalação nativo.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "aurora-admin-install-dismissed";
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// iPhone/iPad não têm o pedido nativo: a instalação é pelo menu Compartilhar.
function isIosNotInstalled() {
  try {
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return ios && !isStandalone() && !recentlyDismissed();
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

export default function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const iosInstallable = useSyncExternalStore(noopSubscribe, isIosNotInstalled, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // guarda o evento para abrir pelo nosso botão
      if (!isStandalone() && !recentlyDismissed()) setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDismissed(true);
      showToast("App instalado. Abra a Aurora pela tela inicial do celular.", "success");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || (!deferred && !iosInstallable)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // sem armazenamento: o aviso volta na próxima visita, sem problema
    }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "dismissed") dismiss();
  };

  return (
    <section
      aria-labelledby="install-title"
      className="mb-6 rounded-lg border border-primary/10 bg-white p-4 sm:flex sm:items-center sm:gap-4"
    >
      <div className="flex items-start gap-3 sm:flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-11 shrink-0 rounded-lg" />
        <div className="min-w-0">
          <h2 id="install-title" className="font-semibold text-primary">
            Instale o app da Aurora no celular
          </h2>
          <p className="mt-0.5 text-sm text-primary/70">
            Fica na tela inicial e abre em tela cheia, pronto para registrar vendas na hora.
          </p>
          {iosInstallable && showIosSteps && (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-primary">
              <li>
                Toque em <strong>Compartilhar</strong>{" "}
                <span className="material-symbols-outlined align-middle text-[18px]" aria-hidden="true">ios_share</span>{" "}
                na barra do navegador.
              </li>
              <li>
                Escolha <strong>Adicionar à Tela de Início</strong>.
              </li>
              <li>
                Toque em <strong>Adicionar</strong>.
              </li>
            </ol>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
        {deferred ? (
          <button
            type="button"
            onClick={install}
            className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-blue sm:flex-none"
          >
            Instalar app
          </button>
        ) : (
          !showIosSteps && (
            <button
              type="button"
              onClick={() => setShowIosSteps(true)}
              className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-blue sm:flex-none"
            >
              Ver como instalar
            </button>
          )
        )}
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 flex-1 rounded-lg border border-primary/25 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 sm:flex-none"
        >
          Agora não
        </button>
      </div>
    </section>
  );
}
