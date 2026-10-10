"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder, updateOrder } from "../actions";
import { formatPhone } from "@/lib/formatters";
import { formatBRL, parseBRL, toBRLInput } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_LABEL, STOCK_LABEL, type OrderStatusKey } from "@/lib/order-meta";
import { showToast } from "@/components/ui/Toast";
import ChoiceChips from "@/components/admin/ui/ChoiceChips";
import AdminProductImage from "@/components/admin/AdminProductImage";
import ProductPicker from "./ProductPicker";
import CustomerPicker from "./CustomerPicker";
import OrderSuccess, { type SuccessSnapshot } from "./OrderSuccess";
import {
  stockOf,
  type CustomerDraft,
  type DiscountType,
  type OrderLine,
  type PaymentMethod,
  type PickerCustomer,
  type PickerProduct,
  type PickerVariant,
  type ShippingType,
  type StockLocation,
} from "./types";

// Preferências por aparelho: quem vende na rua costuma usar sempre o mesmo estoque e pagamento.
const PREFS_KEY = "aurora-order-prefs";
// Rascunho: se o app fechar no meio da venda (ligação, tela bloqueada, sem sinal), nada se perde.
const DRAFT_KEY = "aurora-order-draft";

interface Draft {
  savedAt: number;
  lines: OrderLine[];
  customer: CustomerDraft;
  shippingType: ShippingType;
  discountType: DiscountType;
  discountValue: string;
  notes: string;
  paid: boolean;
}

const EMPTY_CUSTOMER: CustomerDraft = { id: "", name: "", phone: "", email: "", socialMedia: "" };

/** Pedido já registrado, para abrir o formulário em modo de edição. */
export interface EditableOrder {
  id: string;
  orderNumber: string;
  status: string;
  lines: OrderLine[];
  customer: CustomerDraft;
  stockLocation: StockLocation;
  paymentMethod: PaymentMethod;
  shippingType: ShippingType;
  discountType: DiscountType;
  discountValue: string;
  notes: string;
  /** Peças que o pedido devolve ao estoque ao ser salvo (por variação), se não estiver cancelado. */
  returnedStock: Record<string, number>;
}

const noopSubscribe = () => () => {};
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // sem armazenamento (aba anônima): segue sem rascunho
  }
}
function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const sectionClass = "rounded-lg border border-primary/10 bg-white p-4 sm:p-6";

function SectionTitle({ step, children, aside }: { step: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-3 text-lg font-semibold text-primary">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm text-white" aria-hidden="true">
          {step}
        </span>
        {children}
      </h2>
      {aside}
    </div>
  );
}

export default function OrderForm({
  products,
  customers = [],
  initialCustomerId = "",
  editing,
}: {
  products: PickerProduct[];
  customers?: PickerCustomer[];
  initialCustomerId?: string;
  /** Quando presente, o formulário edita este pedido em vez de criar um novo. */
  editing?: EditableOrder;
}) {
  const isEdit = Boolean(editing);
  const router = useRouter();
  // ---------- preferências do aparelho ----------
  const prefsRaw = useSyncExternalStore(noopSubscribe, () => readStorage(PREFS_KEY), () => null);
  const prefs = useMemo(
    () => parseJSON<{ stockLocation?: StockLocation; paymentMethod?: PaymentMethod }>(prefsRaw) ?? {},
    [prefsRaw]
  );
  const [stockChoice, setStockChoice] = useState<StockLocation | null>(editing?.stockLocation ?? null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentMethod | null>(editing?.paymentMethod ?? null);
  const stockLocation: StockLocation = stockChoice ?? prefs.stockLocation ?? "ESTOQUE_A";
  const paymentMethod: PaymentMethod = paymentChoice ?? prefs.paymentMethod ?? "PIX";

  // ---------- dados da venda ----------
  const [lines, setLines] = useState<OrderLine[]>(editing?.lines ?? []);
  const [customer, setCustomer] = useState<CustomerDraft>(() => {
    if (editing) return editing.customer;
    const found = customers.find((c) => c.id === initialCustomerId);
    return found
      ? {
          id: found.id,
          name: found.name,
          phone: formatPhone(found.phone),
          email: found.email ?? "",
          socialMedia: found.socialMedia ?? "",
        }
      : EMPTY_CUSTOMER;
  });
  const [shippingType, setShippingType] = useState<ShippingType>(editing?.shippingType ?? "SEM_FRETE");
  const [discountType, setDiscountType] = useState<DiscountType>(editing?.discountType ?? "NONE");
  const [discountValue, setDiscountValue] = useState(editing?.discountValue ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [paid, setPaid] = useState(false);

  const [touched, setTouched] = useState(false);
  const [draftHandled, setDraftHandled] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState<SuccessSnapshot | null>(null);

  const touch = () => setTouched(true);

  // ---------- rascunho ----------
  const storedDraftRaw = useSyncExternalStore(noopSubscribe, () => readStorage(DRAFT_KEY), () => null);
  const storedDraft = useMemo(() => parseJSON<Draft>(storedDraftRaw), [storedDraftRaw]);
  const showDraftBanner =
    !isEdit &&
    !touched && !draftHandled && !success && !!storedDraft && (storedDraft.lines?.length > 0 || !!storedDraft.customer?.name);

  const formHasContent = lines.length > 0 || !!customer.name.trim() || !!customer.phone.trim() || !!notes.trim();

  useEffect(() => {
    if (isEdit) return; // a edição não usa rascunho: o pedido original continua salvo no sistema
    if (!touched && !draftHandled) return; // não sobrescreve um rascunho que ainda não foi decidido
    if (success || !formHasContent) {
      writeStorage(DRAFT_KEY, null);
      return;
    }
    const draft: Draft = { savedAt: Date.now(), lines, customer, shippingType, discountType, discountValue, notes, paid };
    writeStorage(DRAFT_KEY, JSON.stringify(draft));
  }, [isEdit, touched, draftHandled, success, formHasContent, lines, customer, shippingType, discountType, discountValue, notes, paid]);

  const resumeDraft = () => {
    if (!storedDraft) return;
    // Só retoma linhas de produtos que ainda existem.
    setLines((storedDraft.lines ?? []).filter((l) => products.some((p) => p.id === l.productId)));
    setCustomer(storedDraft.customer ?? EMPTY_CUSTOMER);
    setShippingType(storedDraft.shippingType ?? "SEM_FRETE");
    setDiscountType(storedDraft.discountType ?? "NONE");
    setDiscountValue(storedDraft.discountValue ?? "");
    setNotes(storedDraft.notes ?? "");
    setPaid(Boolean(storedDraft.paid));
    setDraftHandled(true);
  };
  const discardDraft = () => {
    writeStorage(DRAFT_KEY, null);
    setDraftHandled(true);
  };

  // ---------- helpers de produto ----------
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const findVariant = (line: OrderLine) => productById.get(line.productId)?.variants.find((v) => v.id === line.variantId);
  // Na edição, as peças do próprio pedido voltam ao estoque de origem antes da nova baixa.
  const effectiveStock = (v: PickerVariant) =>
    stockOf(v, stockLocation) +
    (editing && stockLocation === editing.stockLocation ? editing.returnedStock[v.id] ?? 0 : 0);
  const lineStock = (line: OrderLine) => {
    if (!line.variantId) return Infinity; // produto sem variações não controla estoque
    const v = findVariant(line);
    return v ? effectiveStock(v) : 0;
  };

  const addProduct = (product: PickerProduct, variant: PickerVariant | null) => {
    touch();
    const key = variant?.id ?? product.id;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      const price = Number(variant?.price ?? product.basePrice);
      return [...prev, { key, productId: product.id, variantId: variant?.id ?? "", quantity: 1, price: toBRLInput(price) }];
    });
  };

  const updateLine = (key: string, patch: Partial<OrderLine>) => {
    touch();
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  // Pedidos antigos podem ter itens sem cor/tamanho gravados: a pessoa escolhe aqui mesmo.
  const needsVariant = (line: OrderLine) =>
    !line.variantId && (productById.get(line.productId)?.variants.length ?? 0) > 0;
  const chooseVariant = (lineKey: string, variant: PickerVariant) => {
    touch();
    setLines((prev) => {
      const line = prev.find((l) => l.key === lineKey);
      if (!line) return prev;
      const twin = prev.find((l) => l.key === variant.id);
      if (twin) {
        // Já existe linha dessa variação: soma a quantidade nela.
        return prev
          .filter((l) => l.key !== lineKey)
          .map((l) => (l.key === variant.id ? { ...l, quantity: l.quantity + line.quantity } : l));
      }
      return prev.map((l) => (l.key === lineKey ? { ...l, key: variant.id, variantId: variant.id } : l));
    });
  };

  const removeLine = (key: string) => {
    touch();
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  // ---------- totais ----------
  const subtotal = lines.reduce((acc, l) => acc + (parseBRL(l.price) || 0) * l.quantity, 0);
  const discountNumber = parseBRL(discountValue);
  const discount =
    discountType === "FIXED"
      ? discountNumber || 0
      : discountType === "PERCENTAGE"
        ? (subtotal * (discountNumber || 0)) / 100
        : 0;
  const total = Math.max(0, subtotal - discount);
  const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);

  // ---------- o que falta para registrar ----------
  const missing: string[] = [];
  if (lines.length === 0) missing.push("Adicione ao menos um produto");
  for (const l of lines) {
    const name = productById.get(l.productId)?.name ?? "produto";
    const price = parseBRL(l.price);
    if (!Number.isFinite(price) || price < 0) missing.push(`Confira o preço de ${name}`);
    if (needsVariant(l)) missing.push(`Escolha a cor e o tamanho de ${name}`);
    else if (l.variantId && !findVariant(l)) missing.push(`Escolha de novo a cor e o tamanho de ${name}`);
    else if (l.quantity > lineStock(l)) missing.push(`Estoque insuficiente de ${name} no ${STOCK_LABEL[stockLocation]}`);
  }
  if (!customer.name.trim()) missing.push("Informe o nome do cliente");
  if (customer.phone.replace(/\D/g, "").length < 10) missing.push("Informe o telefone com DDD");
  if (discountType !== "NONE") {
    if (!Number.isFinite(discountNumber) || discountNumber <= 0) missing.push("Informe o valor do desconto");
    else if (discountType === "PERCENTAGE" && discountNumber > 100) missing.push("O desconto não pode passar de 100%");
    else if (discountType === "FIXED" && discountNumber > subtotal) missing.push("O desconto é maior que o valor das peças");
  }
  const canSubmit = missing.length === 0 && !isPending;

  // ---------- envio ----------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) {
      showToast(missing[0] ?? "Confira os dados do pedido.", "warning");
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showToast("Sem internet. O pedido continua salvo aqui; registre quando a conexão voltar.", "error");
      return;
    }

    setIsPending(true);
    const formData = new FormData();
    formData.append("customerId", customer.id);
    formData.append("customerName", customer.name.trim());
    formData.append("customerEmail", customer.email.trim());
    formData.append("customerSocialMedia", (customer.socialMedia ?? "").trim());
    formData.append("customerPhone", customer.phone);
    formData.append("stockLocation", stockLocation);
    formData.append("paymentMethod", paymentMethod);
    formData.append("shippingType", shippingType);
    formData.append("notes", notes);
    if (!isEdit) formData.append("paid", paid ? "true" : "false");
    formData.append(
      "items",
      JSON.stringify(
        lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: l.quantity,
          price: parseBRL(l.price).toFixed(2),
        }))
      )
    );
    if (discountType !== "NONE") {
      formData.append("discountType", discountType);
      formData.append("discountValue", discountValue);
    }

    if (editing) {
      try {
        const result = await updateOrder(editing.id, formData);
        if (result.error) {
          showToast(result.error, "error");
          return;
        }
        showToast(`Pedido ${editing.orderNumber} atualizado.`, "success");
        router.push(`/admin/sales/${editing.id}`);
        router.refresh();
      } catch {
        showToast("A conexão falhou no meio do envio. Abra o pedido para conferir se as alterações entraram.", "error");
      } finally {
        setIsPending(false);
      }
      return;
    }

    try {
      const result = await createOrder(formData);
      if (result.error || !result.orderId || !result.orderNumber) {
        showToast(result.error || "Não foi possível registrar o pedido. Tente de novo.", "error");
        return;
      }
      setSuccess({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        customerName: customer.name.trim(),
        customerPhone: customer.phone,
        items: lines.map((l) => {
          const p = productById.get(l.productId);
          const v = findVariant(l);
          return {
            label: `${l.quantity}x ${p?.name ?? "Produto"}${v ? ` (${v.color}, ${v.size})` : ""}`,
            total: (parseBRL(l.price) || 0) * l.quantity,
          };
        }),
        subtotal,
        discount,
        total,
        paymentMethod,
        paid,
        shippingType,
        notes: notes.trim(),
      });
      writeStorage(DRAFT_KEY, null);
      writeStorage(PREFS_KEY, JSON.stringify({ stockLocation, paymentMethod }));
      showToast(`Pedido ${result.orderNumber} registrado.`, "success");
    } catch {
      showToast("A conexão falhou no meio do envio. Confira em Vendas se o pedido entrou antes de tentar de novo.", "error");
    } finally {
      setIsPending(false);
    }
  };

  const startNewOrder = () => {
    setLines([]);
    setCustomer(EMPTY_CUSTOMER);
    setShippingType("SEM_FRETE");
    setDiscountType("NONE");
    setDiscountValue("");
    setNotes("");
    setPaid(false);
    setTouched(false);
    setDraftHandled(true);
    setSuccess(null);
    document.getElementById("conteudo")?.scrollTo({ top: 0 });
  };

  if (success) return <OrderSuccess order={success} onNewOrder={startNewOrder} />;

  const submitLabel = isEdit
    ? isPending
      ? "Salvando…"
      : "Salvar alterações"
    : isPending
      ? "Registrando…"
      : "Registrar pedido";

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-36 lg:pb-8">
      {editing && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/admin/sales/${editing.id}`}
              className="mb-1 inline-flex items-center gap-1 text-sm text-accent-blue underline-offset-4 hover:text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
              Voltar sem salvar
            </Link>
            <h2 className="text-2xl font-semibold text-primary">Editando o pedido {editing.orderNumber}</h2>
          </div>
          <p className="max-w-sm text-sm text-primary/70">
            {editing.status === "CANCELED"
              ? "Pedido cancelado: as alterações não mexem no estoque."
              : "Ao salvar, as peças antigas voltam ao estoque e as novas saem dele."}
          </p>
        </div>
      )}
      {showDraftBanner && storedDraft && (
        <div role="status" className="mb-6 flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            <strong className="font-semibold">Você tem um pedido não finalizado</strong>
            {storedDraft.customer?.name ? ` de ${storedDraft.customer.name}` : ""}, salvo às{" "}
            {new Date(storedDraft.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={resumeDraft} className="min-h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-accent-blue sm:flex-none">
              Continuar
            </button>
            <button type="button" onClick={discardDraft} className="min-h-11 flex-1 rounded-lg border border-primary/25 bg-white px-4 text-sm font-semibold text-primary hover:bg-primary/5 sm:flex-none">
              Descartar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Produtos */}
          <section className={sectionClass} aria-labelledby="sec-produtos">
            <SectionTitle step={1}>
              <span id="sec-produtos">Produtos</span>
            </SectionTitle>

            <div className="mb-4">
              <ChoiceChips<StockLocation>
                name="stockLocation"
                legend="Vender do estoque"
                value={stockLocation}
                onChange={(v) => {
                  touch();
                  setStockChoice(v);
                }}
                options={[
                  { value: "ESTOQUE_A", label: "Estoque A", hint: "Loja principal" },
                  { value: "ESTOQUE_V", label: "Estoque V", hint: "Showroom e externo" },
                ]}
              />
            </div>

            <ProductPicker products={products} location={stockLocation} getStock={effectiveStock} lines={lines} onAdd={addProduct} />

            {lines.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-primary">
                  Neste pedido ({itemCount} {itemCount === 1 ? "peça" : "peças"})
                </h3>
                <ul className="divide-y divide-primary/10 rounded-lg border border-primary/15">
                  {lines.map((line) => {
                    const product = productById.get(line.productId);
                    const variant = findVariant(line);
                    const stock = lineStock(line);
                    const over = line.quantity > stock;
                    const lineTotal = (parseBRL(line.price) || 0) * line.quantity;
                    const name = product?.name ?? "Produto";
                    return (
                      <li key={line.key} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-accent-soft">
                            <AdminProductImage src={product?.images[0]?.url ?? ""} alt={name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-primary">{name}</p>
                            {variant && (
                              <p className="text-sm text-primary/70">
                                {variant.color}, tamanho {variant.size}
                              </p>
                            )}
                            {needsVariant(line) && product && (
                              <div className="mt-2">
                                <p className="mb-1.5 text-sm font-medium text-dawn-ink">Escolha a cor e o tamanho:</p>
                                <div className="flex flex-wrap gap-2">
                                  {product.variants.map((v) => {
                                    const left = effectiveStock(v);
                                    return (
                                      <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => chooseVariant(line.key, v)}
                                        className="flex min-h-11 flex-col items-start justify-center rounded-lg border border-primary/25 bg-white px-3 py-1 text-left hover:border-primary"
                                      >
                                        <span className="text-sm font-semibold text-primary">
                                          {v.size} · {v.color}
                                        </span>
                                        <span className={`text-xs ${left <= 0 ? "text-dawn-ink" : "text-primary/60"}`}>
                                          {left <= 0 ? "Sem estoque" : `${left} disponíve${left === 1 ? "l" : "is"}`}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {line.variantId && !variant && (
                              <p className="text-sm font-medium text-dawn-ink">
                                Esta cor/tamanho foi removida do cadastro. Tire o item e adicione de novo.
                              </p>
                            )}
                            {Number.isFinite(stock) && variant && (
                              <p className={`text-sm ${over ? "font-medium text-dawn-ink" : "text-primary/60"}`}>
                                {over
                                  ? `Só ${stock} no ${STOCK_LABEL[stockLocation]}`
                                  : `${stock} no ${STOCK_LABEL[stockLocation]}`}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            aria-label={`Tirar ${name} do pedido`}
                            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-primary/60 hover:bg-dawn/20 hover:text-dawn-ink"
                          >
                            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <span className="mb-1 block text-xs text-primary/60" id={`qtd-${line.key}`}>
                              Quantidade
                            </span>
                            <div className="flex items-center rounded-lg border border-primary/20" role="group" aria-labelledby={`qtd-${line.key}`}>
                              <button
                                type="button"
                                onClick={() =>
                                  line.quantity <= 1 ? removeLine(line.key) : updateLine(line.key, { quantity: line.quantity - 1 })
                                }
                                aria-label={line.quantity <= 1 ? `Tirar ${name} do pedido` : `Diminuir quantidade de ${name}`}
                                className="flex size-11 items-center justify-center text-xl text-primary hover:bg-primary/5"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-semibold text-primary" aria-live="polite">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateLine(line.key, { quantity: line.quantity + 1 })}
                                disabled={line.quantity >= stock}
                                aria-label={`Aumentar quantidade de ${name}`}
                                className="flex size-11 items-center justify-center text-xl text-primary hover:bg-primary/5 disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <label htmlFor={`preco-${line.key}`} className="mb-1 block text-xs text-primary/60">
                              Preço por peça (R$)
                            </label>
                            <input
                              id={`preco-${line.key}`}
                              type="text"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(e) => updateLine(line.key, { price: e.target.value.replace(/[^\d,.]/g, "") })}
                              onBlur={(e) => {
                                const n = parseBRL(e.target.value);
                                if (Number.isFinite(n)) updateLine(line.key, { price: toBRLInput(n) });
                              }}
                              className="min-h-11 w-28 rounded-lg border border-primary/20 bg-accent-cream px-3 text-right text-base text-primary"
                            />
                          </div>

                          <p className="ml-auto text-right">
                            <span className="block text-xs text-primary/60">Total</span>
                            <span className="text-lg font-semibold text-primary">{formatBRL(lineTotal)}</span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* 2. Cliente */}
          <section className={sectionClass} aria-labelledby="sec-cliente">
            <SectionTitle step={2}>
              <span id="sec-cliente">Cliente</span>
            </SectionTitle>
            <CustomerPicker
              customers={customers}
              value={customer}
              onChange={(c) => {
                touch();
                setCustomer(c);
              }}
            />
          </section>

          {/* 3. Pagamento */}
          <section className={sectionClass} aria-labelledby="sec-pagamento">
            <SectionTitle step={3}>
              <span id="sec-pagamento">Pagamento e entrega</span>
            </SectionTitle>

            <div className="space-y-5">
              <ChoiceChips<PaymentMethod>
                name="paymentMethod"
                legend="Forma de pagamento"
                value={paymentMethod}
                onChange={(v) => {
                  touch();
                  setPaymentChoice(v);
                }}
                options={(["PIX", "CASH", "CREDIT_CARD", "DEBIT_CARD", "BOLETO"] as PaymentMethod[]).map((v) => ({
                  value: v,
                  label: PAYMENT_LABEL[v],
                }))}
              />

              {editing ? (
                <p className="rounded-lg border border-primary/15 bg-accent-cream p-3.5 text-sm text-primary/80">
                  Status atual:{" "}
                  <strong className="font-semibold text-primary">
                    {ORDER_STATUS[editing.status as OrderStatusKey]?.label ?? editing.status}
                  </strong>
                  . Para mudar o status, use a página do pedido.
                </p>
              ) : (
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-primary/15 bg-accent-cream p-3.5">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => {
                    touch();
                    setPaid(e.target.checked);
                  }}
                  className="mt-0.5 size-5 rounded border-primary/40 text-primary"
                />
                <span>
                  <span className="block font-semibold text-primary">Pagamento já recebido</span>
                  <span className="block text-sm text-primary/70">
                    O pedido entra como pago. Deixe desmarcado se a cliente vai pagar depois.
                  </span>
                </span>
              </label>
              )}

              <ChoiceChips<ShippingType>
                name="shippingType"
                legend="Frete"
                value={shippingType}
                onChange={(v) => {
                  touch();
                  setShippingType(v);
                }}
                options={[
                  { value: "SEM_FRETE", label: "Sem frete", hint: "Entregue na mão ou retirada" },
                  { value: "PAGO_AURORA", label: "Aurora paga" },
                  { value: "PAGO_CLIENTE", label: "Cliente paga" },
                ]}
              />

              <details className="group rounded-lg border border-primary/15" open={discountType !== "NONE" || !!notes}>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3.5 font-semibold text-primary">
                  Desconto e observações
                  <span className="material-symbols-outlined text-primary/60 transition-transform group-open:rotate-180" aria-hidden="true">
                    expand_more
                  </span>
                </summary>
                <div className="space-y-5 border-t border-primary/10 p-3.5">
                  <ChoiceChips<DiscountType>
                    name="discountType"
                    legend="Desconto"
                    value={discountType}
                    onChange={(v) => {
                      touch();
                      setDiscountType(v);
                    }}
                    options={[
                      { value: "NONE", label: "Sem desconto" },
                      { value: "FIXED", label: "Em reais" },
                      { value: "PERCENTAGE", label: "Em %" },
                    ]}
                  />
                  {discountType !== "NONE" && (
                    <div>
                      <label htmlFor="discount-value" className="mb-1.5 block text-sm font-semibold text-primary">
                        {discountType === "PERCENTAGE" ? "Desconto (%)" : "Desconto (R$)"}
                      </label>
                      <input
                        id="discount-value"
                        type="text"
                        inputMode="decimal"
                        value={discountValue}
                        onChange={(e) => {
                          touch();
                          setDiscountValue(e.target.value.replace(/[^\d,.]/g, ""));
                        }}
                        placeholder={discountType === "PERCENTAGE" ? "10" : "25,00"}
                        className="min-h-12 w-40 rounded-lg border border-primary/20 bg-accent-cream px-3.5 text-base text-primary"
                      />
                      {discount > 0 && <p className="mt-1.5 text-sm text-primary/70">− {formatBRL(discount)} no total</p>}
                    </div>
                  )}
                  <div>
                    <label htmlFor="order-notes" className="mb-1.5 block text-sm font-semibold text-primary">
                      Observações <span className="font-normal text-primary/60">(opcional)</span>
                    </label>
                    <textarea
                      id="order-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => {
                        touch();
                        setNotes(e.target.value);
                      }}
                      placeholder="Presente, combinado de entrega, troca de tamanho…"
                      className="w-full rounded-lg border border-primary/20 bg-accent-cream p-3.5 text-base text-primary placeholder:text-primary/40"
                    />
                  </div>
                </div>
              </details>
            </div>
          </section>
        </div>

        {/* Resumo (desktop) */}
        <aside className="hidden lg:block" aria-labelledby="resumo">
          <div className="sticky top-20 rounded-lg border border-primary/10 bg-white p-6">
            <h2 id="resumo" className="mb-4 text-lg font-semibold text-primary">
              Resumo
            </h2>
            {lines.length === 0 ? (
              <p className="text-sm text-primary/60">Nenhum produto ainda.</p>
            ) : (
              <ul className="mb-4 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
                {lines.map((l) => (
                  <li key={l.key} className="flex justify-between gap-3">
                    <span className="truncate text-primary/80">
                      {l.quantity}x {productById.get(l.productId)?.name}
                    </span>
                    <span className="whitespace-nowrap font-medium text-primary">
                      {formatBRL((parseBRL(l.price) || 0) * l.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="space-y-1.5 border-t border-primary/10 pt-4 text-sm">
              <div className="flex justify-between text-primary/70">
                <dt>Subtotal</dt>
                <dd>{formatBRL(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-primary/70">
                  <dt>Desconto</dt>
                  <dd>− {formatBRL(discount)}</dd>
                </div>
              )}
              <div className="flex items-end justify-between pt-2">
                <dt className="font-semibold text-primary">Total</dt>
                <dd className="text-3xl font-semibold text-primary">{formatBRL(total)}</dd>
              </div>
              <div className="flex justify-between text-primary/70">
                <dt>Pagamento</dt>
                <dd>
                  {PAYMENT_LABEL[paymentMethod]}
                  {!isEdit && paid ? ", recebido" : ""}
                </dd>
              </div>
            </dl>

            {missing.length > 0 && (
              <div className="mt-4 rounded-lg bg-accent-cream p-3">
                <p className="mb-1 text-sm font-semibold text-primary">Para registrar:</p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-primary/80">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white transition-colors hover:bg-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>}
              {submitLabel}
            </button>
          </div>
        </aside>
      </div>

      {/* Barra fixa (celular): total sempre à vista, acima do menu inferior */}
      <div
        className="fixed inset-x-0 z-30 border-t border-primary/10 bg-white px-4 py-3 lg:hidden"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      >
        {missing.length > 0 && lines.length > 0 && (
          <p className="mb-2 text-sm text-primary/70" aria-live="polite">
            Falta: {missing[0].charAt(0).toLowerCase() + missing[0].slice(1)}
            {missing.length > 1 ? ` (+${missing.length - 1})` : ""}
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-primary/70">
              {itemCount} {itemCount === 1 ? "peça" : "peças"}
            </p>
            <p className="truncate text-xl font-semibold text-primary">{formatBRL(total)}</p>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white transition-colors hover:bg-accent-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <span className="material-symbols-outlined animate-spin text-[20px]" aria-hidden="true">progress_activity</span>}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
