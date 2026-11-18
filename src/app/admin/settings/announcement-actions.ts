"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/require-admin";
import { ANNOUNCEMENT_CACHE_TAG, parseAnnouncementInput } from "@/lib/announcement";

export type AnnouncementActionState = { success: boolean; error?: string; savedAt?: number } | null;

const GENERIC_ERROR = "Não foi possível salvar o aviso. Tente de novo.";

/** Vitrine e painel passam a mostrar o aviso novo já na próxima página aberta. */
function refresh() {
  updateTag(ANNOUNCEMENT_CACHE_TAG);
  revalidatePath("/admin/settings");
}

const validId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 64;

/** Cria um aviso, ou altera o aviso indicado no campo "id". */
export async function saveAnnouncement(_prev: AnnouncementActionState, formData: FormData): Promise<AnnouncementActionState> {
  const denied = await adminGuard();
  if (denied) return denied;

  const parsed = parseAnnouncementInput({
    message: formData.get("message"),
    linkUrl: formData.get("linkUrl"),
    active: formData.get("active"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.ok) return { success: false, error: parsed.error };

  const id = formData.get("id");
  try {
    if (validId(id)) {
      await prisma.announcement.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.announcement.create({ data: parsed.data });
    }
  } catch (err) {
    console.error("Erro ao salvar a faixa de aviso:", err);
    return { success: false, error: GENERIC_ERROR };
  }
  refresh();
  return { success: true, savedAt: Date.now() };
}

export async function setAnnouncementActive(id: string, active: boolean): Promise<AnnouncementActionState> {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!validId(id)) return { success: false, error: GENERIC_ERROR };
  try {
    await prisma.announcement.update({ where: { id }, data: { active: active === true } });
  } catch (err) {
    console.error("Erro ao ligar/desligar a faixa de aviso:", err);
    return { success: false, error: GENERIC_ERROR };
  }
  refresh();
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionState> {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!validId(id)) return { success: false, error: GENERIC_ERROR };
  try {
    await prisma.announcement.delete({ where: { id } });
  } catch (err) {
    console.error("Erro ao excluir a faixa de aviso:", err);
    return { success: false, error: "Não foi possível excluir o aviso." };
  }
  refresh();
  return { success: true };
}
