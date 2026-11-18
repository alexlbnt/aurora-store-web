"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import {
  deleteAnnouncement,
  saveAnnouncement,
  setAnnouncementActive,
  type AnnouncementActionState,
} from "@/app/admin/settings/announcement-actions";
import {
  ANNOUNCEMENT_MAX_LENGTH,
  ANNOUNCEMENT_STATUS_LABEL,
  announcementStatus,
  type AnnouncementStatus,
  type AnnouncementView,
} from "@/lib/announcement";
import { AnnouncementContent } from "@/components/storefront/AnnouncementBar";

type Draft = { id: string | null; message: string; linkUrl: string; active: boolean; startsAt: string; endsAt: string };

const EMPTY: Draft = { id: null, message: "", linkUrl: "", active: true, startsAt: "", endsAt: "" };

const noopSubscribe = () => () => {};

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → valor do campo datetime-local, no horário deste aparelho. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Campo datetime-local (horário deste aparelho) → ISO, que o servidor entende sem ambiguidade de fuso. */
function toIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "invalid" : d.toISOString();
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const STATUS_STYLE: Record<AnnouncementStatus, string> = {
  live: "bg-emerald-50 text-emerald-800 border-emerald-200",
  scheduled: "bg-sky-50 text-sky-800 border-sky-200",
  ended: "bg-slate-100 text-slate-600 border-slate-200",
  off: "bg-slate-100 text-slate-600 border-slate-200",
};

function period(a: AnnouncementView): string {
  if (a.startsAt && a.endsAt) return `${formatDateTime(a.startsAt)} até ${formatDateTime(a.endsAt)}`;
  if (a.startsAt) return `A partir de ${formatDateTime(a.startsAt)}`;
  if (a.endsAt) return `Até ${formatDateTime(a.endsAt)}`;
  return "Sem data de fim";
}

/** Painel → Configurações: texto da faixa que aparece no topo da loja. */
export default function AnnouncementSettingsCard({ announcements }: { announcements: AnnouncementView[] }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [state, formAction, saving] = useActionState<AnnouncementActionState, FormData>(async (prev, formData) => {
    const result = await saveAnnouncement(prev, formData);
    if (result?.success) setDraft(EMPTY);
    return result;
  }, null);
  const [listError, setListError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Status calculado só no navegador (o horário do servidor e o do aparelho podem diferir).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const now = mounted ? new Date() : null;


  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const edit = (a: AnnouncementView) => {
    setDraft({
      id: a.id,
      message: a.message,
      linkUrl: a.linkUrl ?? "",
      active: a.active,
      startsAt: toLocalInput(a.startsAt),
      endsAt: toLocalInput(a.endsAt),
    });
    document.getElementById("announcement-message")?.focus();
  };

  const run = (fn: () => Promise<AnnouncementActionState>) => {
    setListError(null);
    startTransition(async () => {
      const r = await fn();
      if (r && !r.success) setListError(r.error ?? "Não foi possível concluir.");
    });
  };

  const remaining = ANNOUNCEMENT_MAX_LENGTH - draft.message.length;
  const inputClass =
    "w-full min-h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm";
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-primary/10 shadow-sm space-y-5 max-w-5xl">
      <div className="pb-3 border-b border-primary/10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">campaign</span>
          Faixa de aviso da loja
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Uma frase curta no topo de todas as páginas da loja, como uma promoção ou coleção nova. Aparece o aviso
          ligado e dentro do período; se houver mais de um, vale o alterado por último.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {draft.id && <input type="hidden" name="id" value={draft.id} />}
        <input type="hidden" name="startsAt" value={toIso(draft.startsAt)} />
        <input type="hidden" name="endsAt" value={toIso(draft.endsAt)} />

        <div>
          <label htmlFor="announcement-message" className={labelClass}>
            Texto do aviso
          </label>
          <input
            id="announcement-message"
            name="message"
            required
            maxLength={ANNOUNCEMENT_MAX_LENGTH}
            value={draft.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Ex.: Frete grátis para Goiânia nesta semana"
            aria-describedby="announcement-count"
            className={inputClass}
          />
          <p id="announcement-count" className="text-xs text-slate-500 mt-1">
            {remaining} caracteres restantes
          </p>
        </div>

        <div>
          <label htmlFor="announcement-link" className={labelClass}>
            Link (opcional)
          </label>
          <input
            id="announcement-link"
            name="linkUrl"
            value={draft.linkUrl}
            onChange={(e) => set("linkUrl", e.target.value)}
            placeholder="/catalog ou https://..."
            aria-describedby="announcement-link-hint"
            className={inputClass}
          />
          <p id="announcement-link-hint" className="text-xs text-slate-500 mt-1">
            Página da loja (começando com /) ou endereço https://. Aparece um &quot;Ver&quot; ao lado do texto.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="announcement-start" className={labelClass}>
              Começa em (opcional)
            </label>
            <input
              id="announcement-start"
              type="datetime-local"
              value={draft.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="announcement-end" className={labelClass}>
              Termina em (opcional)
            </label>
            <input
              id="announcement-end"
              type="datetime-local"
              value={draft.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 min-h-11 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            name="active"
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
            className="size-5 rounded border-slate-300 text-primary"
          />
          Ligado
        </label>

        {draft.message.trim() && (
          <div>
            <p className={labelClass}>Prévia</p>
            <div className="bg-primary text-white text-sm text-center rounded-xl px-4 py-2.5">
              <AnnouncementContent
                preview
                announcement={{ id: "preview", message: draft.message.trim(), linkUrl: draft.linkUrl.trim() || null, updatedAt: "" }}
              />
            </div>
          </div>
        )}

        <div aria-live="polite">
          {state?.error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{state.error}</p>}
          {state?.success && <p className="text-sm text-emerald-800">Aviso salvo. A loja já mostra a versão nova.</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Salvando…" : draft.id ? "Salvar alterações" : "Publicar aviso"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY)}
              className="min-h-11 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      {announcements.length > 0 && (
        <div className="pt-4 border-t border-primary/10 space-y-3">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Avisos recentes</h4>
          {listError && <p className="text-sm text-red-700">{listError}</p>}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {announcements.map((a) => {
              const status = now ? announcementStatus(a, now) : null;
              return (
                <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white break-words">{a.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {now ? period(a) : ""}
                      {a.linkUrl ? ` · Link: ${a.linkUrl}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {status && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_STYLE[status]}`}>
                        {ANNOUNCEMENT_STATUS_LABEL[status]}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setAnnouncementActive(a.id, !a.active))}
                      className="min-h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {a.active ? "Desligar" : "Ligar"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => edit(a)}
                      className="min-h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Excluir este aviso? Não dá para desfazer.")) run(() => deleteAnnouncement(a.id));
                      }}
                      className="min-h-10 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
