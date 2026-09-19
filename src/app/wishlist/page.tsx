import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import WishlistClient from "./WishlistClient";

export const metadata = {
  title: "Meus Favoritos | Aurora",
  description: "Veja os produtos que você salvou na sua lista de desejos.",
};

export default function WishlistPage() {
  return (
    <StorefrontLayout>
      <WishlistClient />
    </StorefrontLayout>
  );
}
