"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createOrder } from "../actions";
import { formatPhone } from "@/lib/formatters";
import { showToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  name: string;
  sku?: string;
  basePrice: any; // Decimal
  variants: any[];
  images: any[];
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
}

export default function OrderForm({
  products,
  customers = [],
  initialCustomerId = "",
}: {
  products: Product[];
  customers?: Customer[];
  initialCustomerId?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [stockLocation, setStockLocation] = useState<"ESTOQUE_A" | "ESTOQUE_V">("ESTOQUE_A");

  // Customer state & search
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Auto-fill customer if initialCustomerId is given
  useEffect(() => {
    if (initialCustomerId) {
      const found = customers.find((c) => c.id === initialCustomerId);
      if (found) {
        setSelectedCustomerId(found.id);
        setCustomerName(found.name);
        setCustomerEmail(found.email || "");
        setCustomerPhone(formatPhone(found.phone));
      }
    }
  }, [initialCustomerId, customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.trim().toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      )
      .slice(0, 8);
  }, [customers, customerSearch]);

  const selectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerEmail(c.email || "");
    setCustomerPhone(formatPhone(c.phone));
    setIsCustomerDropdownOpen(false);
    setCustomerSearch("");
    showToast(`Cliente "${c.name}" selecionado`, "info");
  };

  const clearCustomer = () => {
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerSearch("");
  };

  // Order Items
  const [items, setItems] = useState<
    {
      id: string;
      productId: string;
      variantId: string;
      quantity: number | string;
      price: string;
    }[]
  >([]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: "", variantId: "", quantity: 1, price: "0" },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [discountType, setDiscountType] = useState<"NONE" | "FIXED" | "PERCENTAGE">("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [shippingType, setShippingType] = useState<"SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE">(
    "SEM_FRETE"
  );
  const [notes, setNotes] = useState("");

  const updateItem = (id: string, field: string, value: any) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== id) return item;

        const nextItem = { ...item, [field]: value };

        // Auto-fill price if product changes
        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          nextItem.variantId = "";
          if (product) {
            nextItem.price = product.basePrice.toString();
          }
        }

        // Auto-fill price if variant changes
        if (field === "variantId") {
          const product = products.find((p) => p.id === nextItem.productId);
          const variant = product?.variants.find((v) => v.id === value);
          if (variant && variant.price) {
            nextItem.price = variant.price.toString();
          } else if (product) {
            nextItem.price = product.basePrice.toString();
          }
        }

        return nextItem;
      })
    );
  };

  const subTotalAmount = items.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );

  let discountAmount = 0;
  const numDiscountValue = parseFloat(discountValue.replace(/\./g, "").replace(",", ".")) || 0;
  if (discountType === "FIXED") {
    discountAmount = numDiscountValue;
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (subTotalAmount * numDiscountValue) / 100;
  }
  const totalAmount = Math.max(0, subTotalAmount - discountAmount);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast("Por favor, preencha o Nome e o Telefone do cliente.", "warning");
      return;
    }

    const validItems = items
      .filter((item) => item.productId && Number(item.quantity) > 0)
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity),
      }));

    if (validItems.length === 0) {
      showToast("Adicione pelo menos um produto com quantidade válida ao pedido.", "warning");
      return;
    }

    // Validate variants and stock availability strictly
    for (const item of validItems) {
      const p = products.find((prod) => prod.id === item.productId);
      if (p && p.variants.length > 0 && !item.variantId) {
        showToast(`Por favor, selecione o tamanho e a cor para o produto "${p.name}".`, "warning");
        return;
      }

      const v = p?.variants.find((varnt) => varnt.id === item.variantId);
      if (v) {
        const availableStock = stockLocation === "ESTOQUE_A" ? v.stockA : v.stockV;
        if (availableStock < item.quantity) {
          const stockName = stockLocation === "ESTOQUE_A" ? "Estoque Principal (A)" : "Estoque Secundário (V)";
          showToast(
            `Estoque insuficiente no ${stockName} para "${p?.name}" (${v.color} - ${v.size}). Disponível: ${availableStock} un., Solicitado: ${item.quantity} un.`,
            "error"
          );
          return;
        }
      }
    }

    setIsPending(true);

    const formData = new FormData();
    formData.append("customerId", selectedCustomerId);
    formData.append("customerName", customerName);
    formData.append("customerEmail", customerEmail);
    formData.append("customerPhone", customerPhone);
    formData.append("stockLocation", stockLocation);
    formData.append("paymentMethod", paymentMethod);
    formData.append("shippingType", shippingType);
    formData.append("notes", notes);
    formData.append("items", JSON.stringify(validItems));

    if (discountType !== "NONE") {
      formData.append("discountType", discountType);
      formData.append("discountValue", discountValue);
    }

    try {
      const result = await createOrder(formData);
      if (result.error) {
        showToast(result.error, "error");
        setIsPending(false);
      } else {
        showToast(`Pedido #${result.orderNumber} criado com sucesso!`, "success");
        setSuccessOrder(result);
        setIsPending(false);
      }
    } catch (error: any) {
      showToast(error?.message || "Erro crítico ao criar pedido.", "error");
      setIsPending(false);
    }
  };

  if (successOrder) {
    const itemsText = items
      .map((item) => {
        const p = products.find((prod) => prod.id === item.productId);
        const itemSubtotal = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
        return `▫️ ${item.quantity}x ${p ? p.name : "Produto"} - R$ ${itemSubtotal
          .toFixed(2)
          .replace(".", ",")}`;
      })
      .join("\n");

    let receiptText = `*Resumo do Pedido:*\n${itemsText}\n\n`;

    if (discountAmount > 0) {
      receiptText += `Subtotal: R$ ${subTotalAmount.toFixed(2).replace(".", ",")}\n`;
      receiptText += `Desconto: - R$ ${discountAmount.toFixed(2).replace(".", ",")}\n`;
    }
    receiptText += `*Total: R$ ${totalAmount.toFixed(2).replace(".", ",")}*\n`;

    const shippingLabels: Record<string, string> = {
      SEM_FRETE: "Sem Frete",
      PAGO_AURORA: "Pago Aurora",
      PAGO_CLIENTE: "Pago pelo Cliente",
    };
    receiptText += `Frete: ${shippingLabels[shippingType] || "Sem Frete"}\n`;

    if (notes) {
      receiptText += `Observações: ${notes}\n`;
    }

    const textMessage = `Olá, ${customerName}! Seu pedido #${successOrder.orderNumber} foi criado com sucesso na Aurora Store.\n\n${receiptText}\nEm breve enviaremos atualizações sobre o envio. Muito obrigado(a) pela preferência!`;
    const cleanPhone = (successOrder.customerPhone || customerPhone).replace(/\D/g, "");
    const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(textMessage)}` : null;

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in max-w-lg mx-auto text-center px-4">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-md">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Pedido Criado com Sucesso!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          O pedido <span className="font-bold text-primary">#{successOrder.orderNumber}</span> foi registrado no sistema e já deduziu do estoque.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-5 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined text-lg">forum</span>
              Enviar Comprovante WhatsApp
            </a>
          )}
          <Link
            href={`/admin/sales/${successOrder.orderId}`}
            className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-center transition-colors text-sm"
          >
            Ver Pedido
          </Link>
        </div>

        <button
          type="button"
          onClick={() => (window.location.href = "/admin/sales/new")}
          className="mt-6 text-sm text-primary hover:underline font-semibold cursor-pointer"
        >
          + Registrar outra venda rápida
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/admin/sales"
            className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium truncate">
            <Link href="/admin/sales" className="text-slate-500 hover:text-primary transition-colors shrink-0">
              Vendas
            </Link>
            <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-400 shrink-0">
              chevron_right
            </span>
            <span className="text-slate-900 dark:text-white border-b-2 border-primary pb-0.5 truncate font-bold">
              Nova Venda Rápida
            </span>
          </nav>
        </div>
        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="bg-primary hover:bg-primary/90 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">{isPending ? "sync" : "check_circle"}</span>
          <span>{isPending ? "Salvando..." : "Finalizar Pedido"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente Info com Busca e Autocomplete */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Dados do Cliente
                  </h3>
                  <p className="text-xs text-slate-500">Busque um cliente cadastrado ou preencha para novo</p>
                </div>
              </div>

              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Trocar Cliente
                </button>
              )}
            </div>

            {/* Combobox de Busca do Cliente */}
            {!selectedCustomerId ? (
              <div className="mb-6 relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Buscar Cliente Cadastrado (Nome, Telefone ou E-mail)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="Digite para buscar ex: Maria ou 1198888..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Dropdown com Resultados Filtrados */}
                {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full p-3 text-left hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formatPhone(c.phone)} {c.email ? `• ${c.email}` : ""}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-3.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                    {customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      Cliente Selecionado da Base
                    </span>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{customerName}</p>
                    <p className="text-xs text-slate-500">
                      {customerPhone} {customerEmail ? `• ${customerEmail}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Alterar
                </button>
              </div>
            )}

            {/* Inputs Diretos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Maria Alice Fontes"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  E-mail <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dados da Venda & Origem de Estoque */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Parâmetros da Venda
                </h3>
                <p className="text-xs text-slate-500">Selecione o estoque e método de pagamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Origem do Estoque
                </label>
                <select
                  value={stockLocation}
                  onChange={(e) => setStockLocation(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  <option value="ESTOQUE_A">Estoque-A (Loja Principal)</option>
                  <option value="ESTOQUE_V">Estoque-V (Showroom / Externo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão de Crédito</option>
                  <option value="DEBIT_CARD">Cartão de Débito</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="CASH">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipo de Frete
                </label>
                <select
                  value={shippingType}
                  onChange={(e) => setShippingType(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:border-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="SEM_FRETE">Sem Frete (Retirada)</option>
                  <option value="PAGO_AURORA">Pago pela Aurora (Grátis)</option>
                  <option value="PAGO_CLIENTE">Pago pelo Cliente</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Observações do Pedido
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instruções de entrega, detalhes de presente ou observações do cliente..."
                rows={2}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Itens do Pedido com Seletor Visual de Produto e Estoque */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">shopping_cart</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Produtos ({items.length})
                  </h3>
                  <p className="text-xs text-slate-500">Adicione os produtos do pedido</p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                + Adicionar Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">add_shopping_cart</span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mb-3">Nenhum produto adicionado ao pedido ainda.</p>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Adicionar Primeiro Item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const selectedProduct = products.find((p) => p.id === item.productId);
                  const variants = selectedProduct?.variants || [];
                  const selectedVariant = variants.find((v) => v.id === item.variantId);
                  const availableStock = selectedVariant
                    ? stockLocation === "ESTOQUE_A"
                      ? selectedVariant.stockA
                      : selectedVariant.stockV
                    : null;
                  const itemSubtotal = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
                  const isStockInsufficient = availableStock !== null && Number(item.quantity) > availableStock;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-3 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/50 pb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="size-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          Item #{index + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Subtotal: R$ {itemSubtotal.toFixed(2).replace(".", ",")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="size-7 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remover Item"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Seletor de Produto */}
                        <div className="md:col-span-5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Produto
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm px-2.5 font-medium"
                          >
                            <option value="">Selecione o produto...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.sku ? `(${p.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Seletor de Variação com Indicador de Estoque */}
                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Variação (Cor / Tam)
                          </label>
                          <select
                            value={item.variantId}
                            disabled={!item.productId || variants.length === 0}
                            onChange={(e) => updateItem(item.id, "variantId", e.target.value)}
                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm px-2.5 disabled:opacity-50"
                          >
                            <option value="">{variants.length === 0 ? "Sem variações" : "Selecione a variação..."}</option>
                            {variants.map((v) => {
                              const stock = stockLocation === "ESTOQUE_A" ? v.stockA : v.stockV;
                              return (
                                <option key={v.id} value={v.id}>
                                  {v.size} - {v.color} {stock <= 0 ? "⚠️ (Esgotado)" : `(${stock} un. em estoque)`}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Qtd */}
                        <div className="md:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Qtd
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === "" ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateItem(item.id, "quantity", val === "" ? "" : parseInt(val) || 1);
                            }}
                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-sm font-bold"
                          />
                        </div>

                        {/* Preço Unitário */}
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-right">
                            Preço Unit. (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, "price", e.target.value)}
                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono text-sm px-2.5"
                          />
                        </div>
                      </div>

                      {/* Alerta de Estoque Baixo ou Insuficiente */}
                      {isStockInsufficient && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg p-2 flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                          <span className="material-symbols-outlined text-base">warning</span>
                          <span>
                            Atenção: A quantidade informada ({item.quantity}) é maior que o saldo em estoque ({availableStock} un.).
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desconto */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined">loyalty</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Descontos e Promoções
                </h3>
                <p className="text-xs text-slate-500">Aplique desconto por porcentagem ou valor fixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipo de Desconto
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="NONE">Nenhum</option>
                  <option value="FIXED">Valor Fixo (R$)</option>
                  <option value="PERCENTAGE">Porcentagem (%)</option>
                </select>
              </div>

              {discountType !== "NONE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor do Desconto {discountType === "PERCENTAGE" ? "(%)" : "(R$)"}
                  </label>
                  <input
                    type="number"
                    step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "10%" : "25,00"}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumo Lateral Flutuante */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl sticky top-20 border border-slate-800">
            <h3 className="text-base sm:text-lg font-bold mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Resumo da Venda
            </h3>

            <div className="space-y-3 mb-5 max-h-48 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-slate-400 text-xs italic">Nenhum item adicionado.</div>
              ) : (
                items.map((item) => {
                  const p = products.find((prod) => prod.id === item.productId);
                  const subTotalItem = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
                  if (!p) return null;
                  return (
                    <div key={item.id} className="flex justify-between text-xs items-center pb-2 border-b border-slate-800">
                      <span className="truncate flex-1 pr-2 text-slate-300">
                        {item.quantity}x {p.name}
                      </span>
                      <span className="font-bold whitespace-nowrap text-white">
                        R$ {subTotalItem.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-bold text-slate-200">
                  R$ {subTotalAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Desconto</span>
                  <span>- R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-slate-300 font-bold text-sm">Total da Venda</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  R$ {totalAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || items.length === 0}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">{isPending ? "sync" : "check_circle"}</span>
              {isPending ? "Criando Pedido..." : "Finalizar Pedido"}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total</p>
          <p className="text-lg font-black text-primary truncate">R$ {totalAmount.toFixed(2).replace(".", ",")}</p>
        </div>
        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">{isPending ? "sync" : "check_circle"}</span>
          {isPending ? "Criando..." : "Finalizar Pedido"}
        </button>
      </div>
    </form>
  );
}
