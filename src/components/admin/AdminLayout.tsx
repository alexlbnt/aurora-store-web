import React from "react";
import Sidebar from "./Sidebar";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  return (
    <AdminLayoutClient
      sidebar={<Sidebar />}
      pageTitle={pageTitle}
    >
      {children}
    </AdminLayoutClient>
  );
}
