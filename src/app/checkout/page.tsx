import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CheckoutClient from "./CheckoutClient";
import { auth } from "@/auth";

export const metadata = {
  title: "Finalizar pedido | Aurora",
  description: "Envie seu pedido e a equipe da Aurora combina pagamento e entrega com você.",
};

export default async function CheckoutPage() {
  // Cliente logado: o pedido fica no cadastro da conta, com o e-mail dela.
  const session = await auth();
  const account = session?.user?.email ? { email: session.user.email, name: session.user.name ?? null } : null;

  return (
    <StorefrontLayout hideWhatsApp>
      <CheckoutClient account={account} />
    </StorefrontLayout>
  );
}
