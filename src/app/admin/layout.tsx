import React from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import ServiceWorkerRegister from "@/components/admin/pwa/ServiceWorkerRegister";
import SidebarClient from "@/components/admin/SidebarClient";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { isAdminUser } from "@/lib/roles";

// O app instalável (PWA) é só do painel: com o manifesto global, quem instalasse a loja
// no celular abriria o /admin.
export const metadata: Metadata = {
  title: "Aurora Vendas",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aurora",
    statusBarStyle: "default",
  },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not authenticated as admin (such as on /admin/login),
  // render children directly so login renders cleanly without layout shell
  if (!session?.user || !isAdminUser(session.user)) {
    return (
      <>
        <ServiceWorkerRegister />
        {children}
      </>
    );
  }

  return (
    <>
      <ServiceWorkerRegister />
      <AdminLayoutClient
        sidebar={<SidebarClient session={session} />}
        user={{ name: session.user.name || "Administrador", email: session.user.email || "" }}
      >
        {children}
      </AdminLayoutClient>
    </>
  );
}
