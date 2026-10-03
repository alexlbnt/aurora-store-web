"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createOrder } from "../actions";
import { formatPhone } from "@/lib/formatters";

interface Product {
  id: string;
  name: string;
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

export default function OrderForm({ products, customers = [] }: { products: Product[], customers?: Customer[] }) {
  const [isPending, setIsPending] = useState(false);
  const [stockLocation, setStockLocation] = useState<"ESTOQUE_A" | "ESTOQUE_V">("ESTOQUE_A");
  
  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === "") {
       setCustomerName("");
       setCustomerEmail("");
       setCustomerPhone("");
    } else {
       const cus = customers.find(c => c.id === id);
       if (cus) {
         setCustomerName(cus.name);
         setCustomerEmail(cus.email || "");
         setCustomerPhone(formatPhone(cus.phone));
       }
    }
  };

  // Order Items
  const [items, setItems] = useState<{ id: string, productId: string, variantId: string, quantity: number | string, price: string }[]>([]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: "", variantId: "", quantity: 1, price: "0" }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const [discountType, setDiscountType] = useState<"NONE" | "FIXED" | "PERCENTAGE">("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [shippingType, setShippingType] = useState<"SEM_FRETE" | "PAGO_AURORA" | "PAGO_CLIENTE">("SEM_FRETE");
  const [notes, setNotes] = useState("");


  const updateItem = (id: string, field: string, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;

      const nextItem = { ...item, [field]: value };
      
      // Auto-fill price if product or variant is selected
      if (field === "productId") {
        const product = products.find(p => p.id === value);
        nextItem.variantId = ""; // reset variant when product changes
        if (product) {
          nextItem.price = product.basePrice.toString();
        }
      }

      if (field === "variantId") {
        const product = products.find(p => p.id === nextItem.productId);
        const variant = product?.variants.find(v => v.id === value);
        if (variant && variant.price) {
           nextItem.price = variant.price.toString();
        } else if (product) {
           nextItem.price = product.basePrice.toString();
        }
      }

      return nextItem;
    }));
  };

  const subTotalAmount = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (Number(item.quantity) || 0), 0);
  
  let discountAmount = 0;
  const numDiscountValue = parseFloat(discountValue.replace(',', '.')) || 0;
  if (discountType === "FIXED") {
    discountAmount = numDiscountValue;
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (subTotalAmount * numDiscountValue) / 100;
  }
  const totalAmount = Math.max(0, subTotalAmount - discountAmount);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Por favor, preencha o Nome e o Telefone do cliente.");
      return;
    }

    // Filter out items that are incomplete
    const validItems = items.filter(item => item.productId && Number(item.quantity) > 0).map(item => ({
      ...item,
      quantity: Number(item.quantity)
    }));

    if (validItems.length === 0) {
      alert("Por favor, adicione pelo menos um produto com quantidade válida ao pedido.");
      return;
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
        alert(result.error);
        setIsPending(false);
      } else {
        setSuccessOrder(result);
        setIsPending(false);
      }
    } catch (error: any) {
      alert(error?.message || "Erro crítico ao criar pedido.");
      setIsPending(false);
    }
  };

  if (successOrder) {
    const itemsText = items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      const itemSubtotal = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
      return `▫️ ${item.quantity}x ${p ? p.name : 'Produto'} - R$ ${itemSubtotal.toFixed(2).replace('.', ',')}`;
    }).join('\n');
    
    let receiptText = `*Resumo do Pedido:*\n${itemsText}\n\n`;
    
    if (discountAmount > 0) {
      receiptText += `Subtotal: R$ ${subTotalAmount.toFixed(2).replace('.', ',')}\n`;
      receiptText += `Desconto: - R$ ${discountAmount.toFixed(2).replace('.', ',')}\n`;
    }
    receiptText += `*Total: R$ ${totalAmount.toFixed(2).replace('.', ',')}*\n`;

    const shippingLabels: Record<string, string> = {
      SEM_FRETE: "Sem Frete",
      PAGO_AURORA: "Pago Aurora",
      PAGO_CLIENTE: "Pago pelo Cliente"
    };
    receiptText += `Frete: ${shippingLabels[shippingType] || "Sem Frete"}\n`;

    if (notes) {
      receiptText += `Observações: ${notes}\n`;
    }

    const textMessage = `Olá, ${customerName}! Seu pedido #${successOrder.orderNumber} foi criado com sucesso.\n\n${receiptText}\nEm breve enviaremos atualizações sobre o envio. Muito obrigado(a) pela preferência!`;

    const waLink = `https://wa.me/55${successOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(textMessage)}`;

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pedido Criado!</h2>
        <p className="text-slate-500 mb-8 max-w-md text-center">
          O pedido <span className="font-bold text-slate-700 dark:text-slate-300">#{successOrder.orderNumber}</span> foi registrado com sucesso. O que você deseja fazer agora?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md px-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm order-1 sm:order-2">
             <span className="material-symbols-outlined text-xl">forum</span>
             Compartilhar no WhatsApp
          </a>
          <Link href={`/admin/sales/${successOrder.orderId}`} className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-center transition-colors order-2 sm:order-1">
            Ver detalhes do pedido
          </Link>
        </div>
        <button onClick={() => window.location.href = '/admin/sales/new'} className="mt-6 text-sm text-primary hover:underline font-semibold cursor-pointer">
          + Criar outro pedido manual
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/admin/sales" className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium truncate">
            <Link href="/admin/sales" className="text-slate-500 hover:text-primary transition-colors shrink-0">Pedidos</Link>
            <span className="material-symbols-outlined text-[10px] sm:text-xs text-slate-400 shrink-0">chevron_right</span>
            <span className="text-slate-900 dark:text-white border-b-2 border-primary pb-0.5 truncate font-bold">Novo Pedido</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
           <button type="submit" disabled={isPending || items.length === 0} className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'check_circle'}</span>
              <span>{isPending ? 'Salvando...' : 'Finalizar'}</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente Info */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Dados do Cliente</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Informações para faturamento e contato</p>
                </div>
             </div>

             {customers && customers.length > 0 && (
               <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Selecionar Cliente Cadastrado</label>
                  <select 
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Cadastrar Novo Cliente --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
               </div>
             )}
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Maria Alice Fontes" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">E-mail <span className="text-slate-400 font-normal">(Opcional)</span></label>
                  <input 
                    type="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="cliente@email.com" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Telefone</label>
                  <input 
                    type="tel" 
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000" 
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white" 
                  />
                </div>
             </div>
          </div>

          {/* Dados da Venda */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">storefront</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Dados da Venda</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Selecione o estoque de origem</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Origem do Estoque</label>
                  <select 
                    value={stockLocation}
                    onChange={(e) => setStockLocation(e.target.value as any)}
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="ESTOQUE_A">Estoque-A</option>
                    <option value="ESTOQUE_V">Estoque-V</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Método de Pagamento</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="DEBIT_CARD">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="CASH">Dinheiro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
                    Frete
                  </label>
                  <select 
                    value={shippingType}
                    onChange={(e) => setShippingType(e.target.value as any)}
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="SEM_FRETE">1 - Sem Frete</option>
                    <option value="PAGO_AURORA">2 - Pago Aurora</option>
                    <option value="PAGO_CLIENTE">3 - Cliente (Pago pelo Cliente)</option>
                  </select>
                </div>
             </div>

             <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
                  Observações do Pedido <span className="text-slate-400 font-normal text-xs">(Particularidades do pedido)</span>
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escreva aqui particularidades, instruções de entrega, embalagem de presente ou observações gerais..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-2"
                />
             </div>
          </div>

          {/* Itens do Pedido */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center justify-between mb-6 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">shopping_cart</span>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Produtos</h3>
                    <p className="text-xs sm:text-sm text-slate-500">Adicione os itens do pedido</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="bg-primary/10 hover:bg-primary/20 text-primary dark:text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar
                </button>
             </div>

             {items.length === 0 ? (
               <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
                 <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                   <span className="material-symbols-outlined text-2xl">inventory_2</span>
                 </div>
                 <p className="text-slate-500 text-sm mb-3">Nenhum produto adicionado ainda.</p>
                 <button type="button" onClick={addItem} className="text-primary font-bold hover:underline text-sm inline-flex items-center gap-1">
                   <span className="material-symbols-outlined text-sm">add</span> Adicionar o primeiro produto
                 </button>
               </div>
             ) : (
               <div className="space-y-4">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(p => p.id === item.productId);
                    const variants = selectedProduct?.variants || [];
                    const itemSubtotal = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
                    
                    return (
                      <div key={item.id} className="relative group p-3.5 sm:p-4 border border-slate-200 dark:border-slate-700/60 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/40 pb-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="size-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            Item #{index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              Subtotal: R$ {itemSubtotal.toFixed(2).replace('.', ',')}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => removeItem(item.id)}
                              className="size-8 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                              title="Remover Item"
                              aria-label="Remover Item"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="w-full flex flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Produto</label>
                            <select 
                              value={item.productId}
                              onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                              className="w-full h-11 rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                            >
                              <option value="">Selecione um produto</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {variants.length > 0 && (
                            <div className="w-full md:w-4/12">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Variação</label>
                              <select 
                                value={item.variantId}
                                onChange={(e) => updateItem(item.id, "variantId", e.target.value)}
                                className="w-full h-11 rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                              >
                                <option value="">Nenhuma</option>
                                {variants.map(v => {
                                  const currentStock = stockLocation === "ESTOQUE_A" ? v.stockA : v.stockV;
                                  return (
                                  <option key={v.id} value={v.id}>
                                    {v.size} - {v.color} {currentStock <= 0 ? '(Sem Estoque)' : `(${currentStock} unid)`}
                                  </option>
                                  )
                                })}
                              </select>
                            </div>
                          )}
                          
                          <div className="w-full md:w-auto flex gap-3">
                            <div className="w-1/2 md:w-[80px]">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qtd</label>
                              <input 
                                type="number" 
                                min="1"
                                value={item.quantity === '' ? '' : item.quantity}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  updateItem(item.id, "quantity", rawVal === '' ? '' : parseInt(rawVal) || 0);
                                }}
                                className="w-full h-11 rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-center text-sm"
                              />
                            </div>
                            
                            <div className="w-1/2 md:w-[120px]">
                               <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-right">Preço (R$)</label>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 value={item.price}
                                 onChange={(e) => updateItem(item.id, "price", e.target.value)}
                                 className="w-full h-11 rounded-lg border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-right font-mono text-sm"
                               />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>

          {/* Desconto */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">loyalty</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Descontos e Acréscimos</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Aplique descontos ao valor total</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tipo de Desconto</label>
                  <select 
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="NONE">Sem desconto</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                  </select>
                </div>
                {discountType !== "NONE" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Valor do Desconto {discountType === 'PERCENTAGE' ? '(%)' : '(R$)'}
                    </label>
                    <input 
                      type="number" 
                      step={discountType === 'PERCENTAGE' ? "1" : "0.01"}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'PERCENTAGE' ? "10" : "50.00"}
                      className="w-full h-12 rounded-xl border-slate-200 focus:border-primary focus:ring-primary/20 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Resumo Column */}
        <div className="space-y-6">
           <div className="bg-slate-800 text-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl sticky top-6">
              <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-light">receipt_long</span>
                Resumo do Pedido
              </h3>
              
              <div className="space-y-4 mb-6">
                {items.length === 0 ? (
                  <div className="text-slate-400 text-sm italic">Adicione produtos para ver o resumo.</div>
                ) : (
                  items.map((item, i) => {
                    const p = products.find(prod => prod.id === item.productId);
                    const subTotalItem = (parseFloat(item.price) || 0) * (Number(item.quantity) || 0);
                    if (!p) return null;
                    return (
                      <div key={item.id} className="flex justify-between text-sm items-center pb-3 border-b border-white/10 last:border-0 last:pb-0">
                         <div className="flex-1 pr-3 truncate text-slate-300 text-xs sm:text-sm">
                           {item.quantity}x {p.name}
                         </div>
                         <div className="font-medium whitespace-nowrap text-xs sm:text-sm">
                           R$ {subTotalItem.toFixed(2).replace('.', ',')}
                         </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 sm:pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-slate-300">Subtotal</span>
                  <span className="text-base sm:text-lg font-bold">R$ {subTotalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between mb-3 text-emerald-400 text-sm">
                    <span>Desconto</span>
                    <span className="font-bold">- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-2">
                  <span className="text-slate-300 font-medium">Total a Cobrar</span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-300">R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              
              {/* Botão no Resumo */}
              <button
                type="submit"
                disabled={isPending || items.length === 0}
                className="w-full mt-6 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">{isPending ? 'sync' : 'check_circle'}</span>
                {isPending ? 'Processando Pedido...' : 'Finalizar Pedido'}
              </button>

              <p className="text-[11px] text-slate-400 mt-4 text-center">
                Ao finalizar, o pedido ficará com status <span className="font-bold text-white">PENDENTE</span> e deduzirá instantaneamente do estoque.
              </p>
           </div>
        </div>
      </div>

      {/* Barra Fixa Flutuante Inferior no Mobile (acima da Bottom Nav) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total</p>
          <p className="text-lg font-black text-primary dark:text-rose-300 truncate">R$ {totalAmount.toFixed(2).replace('.', ',')}</p>
        </div>
        <button
          type="submit"
          disabled={isPending || items.length === 0}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <span className="material-symbols-outlined text-sm">{isPending ? 'sync' : 'check_circle'}</span>
          {isPending ? 'Criando...' : 'Finalizar Pedido'}
        </button>
      </div>
    </form>
  )
}
