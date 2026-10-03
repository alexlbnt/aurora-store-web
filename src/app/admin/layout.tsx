import React from "react";
import { auth } from "@/auth";
import SidebarClient from "@/components/admin/SidebarClient";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not authenticated as admin (such as on /admin/login),
  // render children directly so login renders cleanly without layout shell
  if (!session?.user || (session.user as any)?.role !== "ADMIN") {
    return <>{children}</>;
  }

  return (
    <AdminLayoutClient sidebar={<SidebarClient session={session} />}>
      {children}
    </AdminLayoutClient>
  );
}
