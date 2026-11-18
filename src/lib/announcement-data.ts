import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ANNOUNCEMENT_CACHE_TAG, pickLiveAnnouncement, type AnnouncementView } from "@/lib/announcement";

type Row = {
  id: string;
  message: string;
  linkUrl: string | null;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  updatedAt: Date;
};

export const toAnnouncementView = (a: Row): AnnouncementView => ({
  id: a.id,
  message: a.message,
  linkUrl: a.linkUrl,
  active: a.active,
  startsAt: a.startsAt?.toISOString() ?? null,
  endsAt: a.endsAt?.toISOString() ?? null,
  updatedAt: a.updatedAt.toISOString(),
});

const select = { id: true, message: true, linkUrl: true, active: true, startsAt: true, endsAt: true, updatedAt: true } as const;

// A faixa aparece em todas as páginas da vitrine: a consulta fica em cache e só volta ao banco
// quando o painel salva um aviso (updateTag) ou depois de 1 hora. Os candidatos ligados e ainda não
// encerrados ficam no cache; o período (início/fim) é conferido a cada página, então o agendamento
// funciona mesmo com o cache.
const loadCandidates = unstable_cache(
  async (): Promise<AnnouncementView[]> => {
    const rows = await prisma.announcement.findMany({
      where: { active: true, OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select,
    });
    return rows.map(toAnnouncementView);
  },
  ["announcement-candidates"],
  { tags: [ANNOUNCEMENT_CACHE_TAG], revalidate: 3600 },
);

/** Aviso que deve aparecer agora, ou null. Nunca derruba a página: sem banco, fica sem faixa. */
export async function getLiveAnnouncement(now = new Date()): Promise<AnnouncementView | null> {
  try {
    return pickLiveAnnouncement(await loadCandidates(), now);
  } catch (err) {
    console.warn("Aviso: não foi possível carregar a faixa de aviso.", err);
    return null;
  }
}

/** Para o painel: todos os avisos recentes, sem cache. */
export async function listAnnouncementsForAdmin(limit = 10): Promise<AnnouncementView[]> {
  const rows = await prisma.announcement.findMany({ orderBy: { updatedAt: "desc" }, take: limit, select });
  return rows.map(toAnnouncementView);
}
