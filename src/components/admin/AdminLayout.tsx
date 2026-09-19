import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SidebarClient from "./SidebarClient";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayoutClient
      sidebar={<SidebarClient session={session} />}
      pageTitle={pageTitle}
    >
      {children}
    </AdminLayoutClient>
  );
}
