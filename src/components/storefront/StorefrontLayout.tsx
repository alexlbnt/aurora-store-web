import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { auth } from "@/auth";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

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
