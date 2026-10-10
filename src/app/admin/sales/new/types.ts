export type StockLocation = "ESTOQUE_A" | "ESTOQUE_V";
export type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH" | "BOLETO";
export type ShippingType = "SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE";
export type DiscountType = "NONE" | "FIXED" | "PERCENTAGE";

export interface PickerVariant {
  id: string;
  color: string;
  size: string;
  price: string | null;
  stockA: number;
  stockV: number;
}

export interface PickerProduct {
  id: string;
  name: string;
  sku?: string | null;
  basePrice: string;
  variants: PickerVariant[];
  images: { url: string }[];
}

export interface PickerCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  socialMedia: string | null;
}

/** Uma linha da venda. `price` fica no formato digitado (pt-BR, "389,90"). */
export interface OrderLine {
  key: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: string;
}

export interface CustomerDraft {
  id: string;
  name: string;
  phone: string;
  email: string;
  /** Instagram, TikTok etc. Rascunhos antigos podem não ter o campo. */
  socialMedia?: string;
}

export const stockOf = (v: PickerVariant, location: StockLocation) =>
  location === "ESTOQUE_A" ? v.stockA : v.stockV;

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
