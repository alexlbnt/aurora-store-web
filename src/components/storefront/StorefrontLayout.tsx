import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { auth } from "@/auth";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header isAdmin={isAdmin} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 @container">
        {children}
      </main>
      <Footer />
    </div>
  );
}
