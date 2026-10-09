import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Finalizar pedido | Aurora",
  description: "Envie seu pedido e a equipe da Aurora combina pagamento e entrega com você.",
};

export default function CheckoutPage() {
  return (
    <StorefrontLayout>
      <CheckoutClient />
    </StorefrontLayout>
  );
}
