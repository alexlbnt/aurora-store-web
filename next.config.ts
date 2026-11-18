import type { NextConfig } from "next";
import { OPTIMIZED_IMAGE_HOSTS } from "./src/lib/image-hosts";

const nextConfig: NextConfig = {
  // App instalável do painel: o service worker não pode ficar em cache no navegador,
  // senão uma versão nova demora a chegar nos celulares das vendedoras.
  async headers() {
    return [
      {
        source: "/admin-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/admin.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json; charset=utf-8" }],
      },
    ];
  },
  // Origens de foto aceitas pelo otimizador de imagens (lista em src/lib/image-hosts.ts).
  // Antes era qualquer site, o que deixava o servidor da loja baixar imagens de qualquer endereço.
  images: {
    remotePatterns: OPTIMIZED_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  },

};

export default nextConfig;
