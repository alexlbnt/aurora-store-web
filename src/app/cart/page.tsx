import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import CartClient from "./CartClient";

export const metadata = {
  title: "Sua Sacola | Aurora",
  description: "Revise os itens da sua sacola de compras na Aurora.",
};

export default function CartPage() {
  return (
    <StorefrontLayout>
      <CartClient />
    </StorefrontLayout>
  );
}
