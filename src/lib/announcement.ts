// Regras da faixa de aviso da vitrine. Sem banco aqui: tudo testável.

export const ANNOUNCEMENT_MAX_LENGTH = 140;
export const ANNOUNCEMENT_LINK_MAX_LENGTH = 300;
export const ANNOUNCEMENT_CACHE_TAG = "announcement";

/** Aviso como a vitrine e o painel enxergam (datas em ISO, para atravessar o cache). */
export interface AnnouncementView {
  id: string;
  message: string;
  linkUrl: string | null;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
}

export type AnnouncementStatus = "live" | "scheduled" | "ended" | "off";

export const ANNOUNCEMENT_STATUS_LABEL: Record<AnnouncementStatus, string> = {
  live: "No ar",
  scheduled: "Agendado",
  ended: "Encerrado",
  off: "Desligado",
};

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : null);

export function announcementStatus(a: Pick<AnnouncementView, "active" | "startsAt" | "endsAt">, now: Date): AnnouncementStatus {
  if (!a.active) return "off";
  const t = now.getTime();
  const end = time(a.endsAt);
  if (end !== null && end <= t) return "ended";
  const start = time(a.startsAt);
  if (start !== null && start > t) return "scheduled";
  return "live";
}

/** O aviso que aparece agora: o ligado, dentro do período, alterado por último. */
export function pickLiveAnnouncement<T extends AnnouncementView>(list: readonly T[], now: Date): T | null {
  return (
    list
      .filter((a) => announcementStatus(a, now) === "live")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
  );
}

/** Caminho da própria loja ("/catalog") ou endereço https. Bloqueia javascript:, data:, http: e "//outro-site". */
export function isSafeAnnouncementLink(url: string): boolean {
  if (url.startsWith("/")) return !url.startsWith("//") && !url.startsWith("/\\") && !/\s/.test(url);
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !!parsed.hostname;
  } catch {
    return false;
  }
}

export const isInternalLink = (url: string) => url.startsWith("/");

export interface AnnouncementInput {
  message: string;
  linkUrl: string | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

const parseDate = (raw: string): Date | null | "invalid" => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "invalid" : d;
};

/** Valida o formulário do painel. Datas chegam em ISO (o navegador converte do horário local). */
export function parseAnnouncementInput(raw: {
  message: unknown;
  linkUrl: unknown;
  active: unknown;
  startsAt: unknown;
  endsAt: unknown;
}): { ok: true; data: AnnouncementInput } | { ok: false; error: string } {
  const message = String(raw.message ?? "").replace(/\s+/g, " ").trim();
  if (!message) return { ok: false, error: "Escreva o texto do aviso." };
  if (message.length > ANNOUNCEMENT_MAX_LENGTH) {
    return { ok: false, error: `O aviso pode ter até ${ANNOUNCEMENT_MAX_LENGTH} caracteres.` };
  }

  const link = String(raw.linkUrl ?? "").trim();
  if (link.length > ANNOUNCEMENT_LINK_MAX_LENGTH) return { ok: false, error: "O link está longo demais." };
  if (link && !isSafeAnnouncementLink(link)) {
    return { ok: false, error: 'Use um caminho da loja (ex.: "/catalog") ou um endereço que comece com https://' };
  }

  const startsAt = parseDate(String(raw.startsAt ?? "").trim());
  const endsAt = parseDate(String(raw.endsAt ?? "").trim());
  if (startsAt === "invalid" || endsAt === "invalid") return { ok: false, error: "Confira as datas do aviso." };
  if (startsAt && endsAt && endsAt <= startsAt) return { ok: false, error: "O fim precisa ser depois do início." };

  const active = raw.active === true || raw.active === "on" || raw.active === "true";
  return { ok: true, data: { message, linkUrl: link || null, active, startsAt, endsAt } };
}

/** Chave para lembrar que a cliente fechou este aviso. Mudou o texto, o aviso volta a aparecer. */
export const dismissKey = (a: Pick<AnnouncementView, "id" | "updatedAt">) => `${a.id}:${a.updatedAt}`;
