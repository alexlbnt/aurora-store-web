import type { NextConfig } from "next";

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
  // Origens de foto aceitas pelo otimizador de imagens. Antes era qualquer site (até sem HTTPS),
  // o que deixava o servidor da loja baixar e redimensionar imagens de qualquer endereço.
  // Foto de outra origem não quebra a página: o card mostra o espaço neutro no lugar.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co' }, // ImgBB: envio de fotos pelo painel
      { protocol: 'https', hostname: 'd2qs1z4gndokv4.cloudfront.net' }, // fotos atuais de parte do catálogo
      { protocol: 'https', hostname: 'images.unsplash.com' }, // produtos de exemplo do banco de testes
    ],
  },
};

export default nextConfig;
