import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Pagamento Seguro | Aurora",
  description: "Finalize seu pedido com segurança na Aurora.",
};

export default function CheckoutPage() {
  return (
    <StorefrontLayout>
      <CheckoutClient />
    </StorefrontLayout>
  );
}
