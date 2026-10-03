import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  return <>{children}</>;
}

