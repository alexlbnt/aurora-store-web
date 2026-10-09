import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aurora Store Admin",
    short_name: "Aurora Admin",
    description: "Painel de Gestão Comercial e Vendas da Aurora Store",
    start_url: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141826",
    theme_color: "#232a3e",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
