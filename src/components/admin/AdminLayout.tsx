import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AdminLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title={pageTitle} />
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
