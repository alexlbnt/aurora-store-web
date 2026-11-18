"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { dismissKey, isInternalLink, isSafeAnnouncementLink, type AnnouncementView } from "@/lib/announcement";

const STORAGE_KEY = "aurora_announcement_dismissed";

function readDismissed(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const CHANGE_EVENT = "aurora-announcement-dismissed";

function writeDismissed(key: string) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* sem armazenamento: o aviso some só até a próxima página */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // fechado em outra aba
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

type BarAnnouncement = Pick<AnnouncementView, "id" | "message" | "linkUrl" | "updatedAt">;

/** Conteúdo da faixa, usado também na prévia do painel. */
export function AnnouncementContent({ announcement, preview = false }: { announcement: BarAnnouncement; preview?: boolean }) {
  const { message, linkUrl } = announcement;
  const safeLink = linkUrl && isSafeAnnouncementLink(linkUrl) ? linkUrl : null;
  const text = <span className="font-medium">{message}</span>;
  if (!safeLink || preview) {
    return (
      <>
        {text}
        {safeLink && <span className="ml-2 underline underline-offset-4 font-semibold">Ver</span>}
      </>
    );
  }
  const className = "underline-offset-4 hover:underline focus-visible:underline";
  return isInternalLink(safeLink) ? (
    <Link href={safeLink} className={className}>
      {text} <span className="ml-1 underline font-semibold">Ver</span>
    </Link>
  ) : (
    <a href={safeLink} target="_blank" rel="noopener noreferrer" className={className}>
      {text} <span className="ml-1 underline font-semibold">Ver</span>
    </a>
  );
}

/** Faixa no topo da vitrine. A cliente pode fechar; um aviso novo (ou editado) volta a aparecer. */
export default function AnnouncementBar({ announcement }: { announcement: BarAnnouncement }) {
  const key = dismissKey(announcement);
  // No servidor a faixa sempre aparece; no navegador, some se a cliente já fechou este aviso.
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed() === key, () => false);
  const [closedNow, setClosedNow] = useState(false); // vale mesmo sem localStorage

  if (dismissed || closedNow) return null;

  return (
    <div role="region" aria-label="Aviso da loja" className="print:hidden bg-primary text-white text-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-2 pl-4 pr-1 sm:px-6 lg:px-8 min-h-10">
        <p className="flex-1 text-center py-2 leading-snug">
          <AnnouncementContent announcement={announcement} />
        </p>
        <button
          type="button"
          onClick={() => {
            setClosedNow(true);
            writeDismissed(key);
          }}
          aria-label="Fechar aviso"
          className="shrink-0 inline-flex items-center justify-center min-h-10 min-w-10 rounded-full hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
        </button>
      </div>
    </div>
  );
}
