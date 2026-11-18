// Origens de foto que passam pelo otimizador de imagens do site (next/image).
// Fonte única: o next.config.ts lê esta lista. Foto de outra origem não quebra a página:
// é carregada direto pelo navegador (sem o servidor da loja baixar nada) e, se falhar,
// o card mostra o espaço neutro.

export const OPTIMIZED_IMAGE_HOSTS = [
  "i.ibb.co", // ImgBB: envio de fotos pelo painel
  "d2qs1z4gndokv4.cloudfront.net", // fotos antigas de parte do catálogo
  "images.unsplash.com", // produtos de exemplo do banco de testes
] as const;

const hosts = new Set<string>(OPTIMIZED_IMAGE_HOSTS);

/** true quando o otimizador aceita a foto: arquivo do próprio site ("/...") ou https de origem liberada. */
export function canOptimizeImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && hosts.has(url.hostname);
  } catch {
    return false;
  }
}
