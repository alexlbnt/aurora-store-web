"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/admin/settings/push-actions";

type Location = "" | "ESTOQUE_A" | "ESTOQUE_V";
const SW_URL = "/admin-sw.js";
const LOCATION_KEY = "aurora_push_location";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function readLocation(): Location {
  try {
    const v = localStorage.getItem(LOCATION_KEY);
    return v === "ESTOQUE_A" || v === "ESTOQUE_V" ? v : "";
  } catch {
    return "";
  }
}

function writeLocation(v: Location) {
  try {
    localStorage.setItem(LOCATION_KEY, v);
  } catch {
    /* sem armazenamento: só não lembra a escolha */
  }
}

type PushEnv = "checking" | "unsupported" | "ios-install" | "dev" | "supported";

/** O que este aparelho permite (lido do navegador; no servidor fica "checking"). */
function detectPushEnv(): PushEnv {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    // iPhone só aceita aviso com o painel instalado na tela de início.
    return isIOS && !standalone ? "ios-install" : "unsupported";
  }
  return process.env.NODE_ENV !== "production" ? "dev" : "supported";
}

const noopSubscribe = () => () => {};

/**
 * Ativa, neste aparelho, o aviso de pedido novo do site.
 * Cada vendedora escolhe o estoque que acompanha (A, V ou os dois).
 */
export default function PushSettingsCard({ publicKey }: { publicKey: string | null }) {
  const env = useSyncExternalStore(noopSubscribe, detectPushEnv, () => "checking" as const);
  const [subscription, setSubscription] = useState<"checking" | "off" | "on">("checking");
  const status = env === "supported" ? subscription : env;
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const savedLocation = useSyncExternalStore(noopSubscribe, readLocation, () => "" as Location);
  const [chosenLocation, setLocation] = useState<Location | null>(null);
  const location = chosenLocation ?? savedLocation;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Só quando o aparelho aceita aviso: confere se já está inscrito.
  useEffect(() => {
    if (env !== "supported") return;
    navigator.serviceWorker
      .getRegistration("/admin")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => {
        setEndpoint(sub?.endpoint ?? null);
        setSubscription(sub ? "on" : "off");
      })
      .catch(() => setSubscription("off"));
  }, [env]);

  const enable = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({
          tone: "error",
          text: "O aparelho não permitiu notificações. Libere nas configurações do navegador para este site e tente de novo.",
        });
        return;
      }
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/admin" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await savePushSubscription(json, location || null);
      if (!res.success) {
        setMessage({ tone: "error", text: res.error });
        return;
      }
      writeLocation(location);
      setEndpoint(sub.endpoint);
      setSubscription("on");
      setMessage({ tone: "ok", text: "Avisos ativados neste aparelho." });
    } catch (e) {
      console.error(e);
      setMessage({ tone: "error", text: "Não foi possível ativar os avisos neste aparelho." });
    } finally {
      setBusy(false);
    }
  };

  const saveLocation = async (next: Location) => {
    setLocation(next);
    if (status !== "on" || !endpoint) return;
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      const res = await savePushSubscription(sub.toJSON() as never, next || null);
      if (res.success) {
        writeLocation(next);
        setMessage({ tone: "ok", text: "Preferência salva." });
      } else {
        setMessage({ tone: "error", text: res.error });
      }
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      const ep = sub?.endpoint ?? endpoint;
      await sub?.unsubscribe();
      if (ep) await removePushSubscription(ep);
      setEndpoint(null);
      setSubscription("off");
      setMessage({ tone: "ok", text: "Avisos desativados neste aparelho." });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    if (!endpoint) return;
    setBusy(true);
    setMessage(null);
    const res = await sendTestPush(endpoint);
    setBusy(false);
    setMessage(
      res.success
        ? { tone: "ok", text: "Aviso de teste enviado. Ele deve aparecer em alguns segundos." }
        : { tone: "error", text: res.error }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-primary/10 shadow-sm space-y-5 max-w-5xl">
      <div className="pb-3 border-b border-primary/10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">notifications_active</span>
          Aviso de pedido novo
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Receba uma notificação neste aparelho sempre que um cliente fizer um pedido pelo site. Ative em cada
          celular ou computador que deve avisar.
        </p>
      </div>

      {!publicKey ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
          Os avisos ainda não estão configurados no servidor (chaves VAPID). Avise quem cuida do sistema.
        </p>
      ) : status === "checking" ? (
        <p className="text-sm text-slate-500">Verificando este aparelho…</p>
      ) : status === "ios-install" ? (
        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
          No iPhone, os avisos só funcionam com o painel instalado: no Safari, toque em <strong>Compartilhar</strong>{" "}
          → <strong>Adicionar à Tela de Início</strong>, abra o app pelo ícone e volte a esta tela.
        </p>
      ) : status === "unsupported" ? (
        <p className="text-sm text-slate-700 dark:text-slate-300">Este navegador não aceita notificações. Use o Chrome, Edge ou o app instalado.</p>
      ) : status === "dev" ? (
        <p className="text-sm text-slate-700 dark:text-slate-300">Os avisos funcionam no site publicado. Em desenvolvimento, o app do painel fica desligado.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="push-location" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Avisar pedidos de
            </label>
            <select
              id="push-location"
              value={location}
              disabled={busy}
              onChange={(e) => saveLocation(e.target.value as Location)}
              className="w-full sm:w-72 min-h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            >
              <option value="">Os dois estoques</option>
              <option value="ESTOQUE_A">Só Estoque A</option>
              <option value="ESTOQUE_V">Só Estoque V</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {status === "off" ? (
              <button
                type="button"
                onClick={enable}
                disabled={busy}
                className="min-h-11 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Ativando…" : "Ativar avisos neste aparelho"}
              </button>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  Ativo neste aparelho
                </span>
                <button
                  type="button"
                  onClick={test}
                  disabled={busy}
                  className="min-h-11 px-4 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 disabled:opacity-60"
                >
                  Enviar aviso de teste
                </button>
                <button
                  type="button"
                  onClick={disable}
                  disabled={busy}
                  className="min-h-11 px-4 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
                >
                  Desativar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`text-sm rounded-xl p-3 ${message.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
