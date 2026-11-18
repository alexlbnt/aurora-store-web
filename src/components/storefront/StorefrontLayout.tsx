import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFab from "./WhatsAppFab";
import AnnouncementBar from "./AnnouncementBar";
import { getLiveAnnouncement } from "@/lib/announcement-data";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function StorefrontLayout({
  children,
  whatsappMessage,
  hideWhatsApp = false,
}: {
  children: React.ReactNode;
  /** Mensagem pronta do botão de WhatsApp (ex.: citando o produto da página). */
  whatsappMessage?: string;
  /** Esconde o botão onde ele atrapalha (sacola e checkout, que já têm o contato na tela). */
  hideWhatsApp?: boolean;
}) {
  let isAdmin = false;
  try {
    const session = await auth();
    isAdmin = (session?.user as any)?.role === "ADMIN";
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.warn("Aviso ao recuperar sessão em StorefrontLayout:", err);
  }

  // Categorias e faixa de aviso em paralelo; nenhuma das duas derruba a página se falhar.
  const [categories, announcement] = await Promise.all([
    prisma.category
      .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } })
      .catch((err) => {
        console.warn("Aviso ao carregar categorias em StorefrontLayout:", err);
        return [] as { id: string; name: string; slug: string }[];
      }),
    getLiveAnnouncement(),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      {announcement && (
        <AnnouncementBar
          announcement={{ id: announcement.id, message: announcement.message, linkUrl: announcement.linkUrl, updatedAt: announcement.updatedAt }}
        />
      )}
      <Header isAdmin={isAdmin} categories={categories} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 @container">
        {children}
      </main>
      <Footer />
      {!hideWhatsApp && <WhatsAppFab message={whatsappMessage} />}
    </div>
  );
}
