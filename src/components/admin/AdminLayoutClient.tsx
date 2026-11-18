"use client";

import React from "react";
import Header from "./Header";
import { AdminSidebarProvider } from "./AdminSidebarContext";

import AdminMobileNav from "./AdminMobileNav";
import RouteProgressBar from "./RouteProgressBar";
import ToastContainer from "@/components/ui/Toast";
import { ConfirmProvider } from "./ui/ConfirmDialog";
import ConnectionBanner from "./pwa/ConnectionBanner";
import InstallAppBanner from "./pwa/InstallAppBanner";

export interface AdminUserSummary {
  name: string;
  email: string;
}

function AdminLayoutInner({
  sidebar,
  pageTitle,
  user,
  children,
}: {
  sidebar: React.ReactNode;
  pageTitle?: string;
  user: AdminUserSummary;
  children: React.ReactNode;
}) {
  return (
    <ConfirmProvider>
    {/* overflow-clip (e não hidden): a casca do painel nunca pode ser rolada por foco ou scrollIntoView. */}
    <div className="flex h-[100dvh] overflow-clip bg-background-light text-primary font-display relative w-full">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100000] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <RouteProgressBar />
      <ToastContainer />
      {/* Barra lateral: só no computador. No celular a navegação é a barra inferior. */}
      <div className="hidden lg:flex h-full shrink-0">
        {sidebar}
      </div>

      {/* Conteúdo Principal */}
      <main id="conteudo" tabIndex={-1} className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full lg:w-auto transition-all duration-300 focus:outline-none">
        <Header title={pageTitle} />
        <ConnectionBanner />
        <div className="flex-1 p-3.5 sm:p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          <InstallAppBanner />
          {children}
        </div>
      </main>

      {/* Barra de Navegação Inferior Mobile */}
      <AdminMobileNav user={user} />
    </div>
    </ConfirmProvider>
  );
}

export default function AdminLayoutClient({
  sidebar,
  pageTitle,
  user,
  children,
}: {
  sidebar: React.ReactNode;
  pageTitle?: string;
  user: AdminUserSummary;
  children: React.ReactNode;
}) {
  return (
    <AdminSidebarProvider>
      <AdminLayoutInner sidebar={sidebar} pageTitle={pageTitle} user={user}>
        {children}
      </AdminLayoutInner>
    </AdminSidebarProvider>
  );
}
