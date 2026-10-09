// Frete, prazo de entrega, troca e pagamento são combinados caso a caso com a equipe.
// O site não promete valores nem prazos: leva o cliente ao atendimento.
export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "5562999742701";

export const whatsappLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_PHONE}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
