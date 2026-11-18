// Frete, prazo de entrega, troca e pagamento são combinados caso a caso com a equipe.
// O site não promete valores nem prazos: leva o cliente ao atendimento.
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5562999742701";

export const whatsappLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_PHONE}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";

/** Mensagem padrão do botão flutuante de WhatsApp. */
export const DEFAULT_WHATSAPP_MESSAGE = "Olá! Vim pelo site da Aurora e gostaria de ajuda.";

const MAX_NAME_IN_MESSAGE = 80;

/** Mensagem pronta para quem chama no WhatsApp a partir de um produto. */
export function productWhatsappMessage(productName: string, productUrl?: string): string {
  const name = productName.replace(/\s+/g, " ").trim();
  if (!name) return DEFAULT_WHATSAPP_MESSAGE;
  const shortName = name.length > MAX_NAME_IN_MESSAGE ? `${name.slice(0, MAX_NAME_IN_MESSAGE - 1).trimEnd()}…` : name;
  const base = `Olá! Tenho interesse no produto "${shortName}". Pode me ajudar?`;
  return productUrl ? `${base}\n${productUrl}` : base;
}
