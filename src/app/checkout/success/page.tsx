import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CheckoutSuccessClient from "./CheckoutSuccessClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido Confirmado | Aurora Store",
  description: "Seu pedido foi realizado com sucesso.",
};

export default function CheckoutSuccessPage() {
  return (
    <StorefrontLayout>
      <CheckoutSuccessClient />
    </StorefrontLayout>
  );
}
