"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { useActionState, useEffect, useState } from "react";
import { processPaymentAndCreateOrder } from "./actions";
import { formatPhone } from "@/lib/formatters";
import { useRouter } from "next/navigation";

export default function CheckoutClient() {
  const { items, cartTotal, isMounted } = useCart();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(processPaymentAndCreateOrder, null);
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [shippingType, setShippingType] = useState<"SEM_FRETE" | "PAGO_CLIENTE">("SEM_FRETE");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    // Redirecionar se carrinho vazio após montar
    if (isMounted && items.length === 0 && !isPending) {
       router.replace("/cart");
    }
  }, [items, isPending, router, isMounted]);

  const formattedSubtotal = `R$ ${cartTotal.toFixed(2).replace('.', ',')}`;

  if (!isMounted) {
    return (
      <div className="py-8 md:py-12 min-h-screen animate-pulse max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto mb-10" />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-[60%] h-96 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
          <div className="w-full lg:w-[40%] h-96 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="py-8 md:py-12 min-h-screen">
        <h1 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-10 text-center">Finalizar Compra</h1>

        <div className="flex flex-col-reverse lg:flex-row gap-12 max-w-6xl mx-auto items-start">
          
          {/* Checkout Form */}
          <div className="w-full lg:w-[60%]">
            <form action={formAction} className="space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-10 rounded-2xl shadow-sm">
              <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
              <input type="hidden" name="shippingType" value={shippingType} />
              
              {/* Identificação */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Seus Dados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                    <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" placeholder="Ex: Maria Oliveira" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail <span className="text-slate-400 font-normal">(Opcional)</span></label>
                    <input type="email" name="email" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" placeholder="maria@exemplo.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone / WhatsApp</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" 
                      placeholder="(00) 00000-0000" 
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 mt-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  Endereço de Entrega
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Rua, Número e Complemento</label>
                    <input type="text" name="address" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" placeholder="Av. Principal, 123, Apto 402" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                    <input type="text" name="cep" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                    <input type="text" name="city" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white" placeholder="Goiânia" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Estado (UF)</label>
                    <input type="text" name="state" required maxLength={2} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none uppercase text-slate-900 dark:text-white" placeholder="GO" />
                  </div>
                </div>

                {/* Opções de Frete */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Opção de Envio</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${shippingType === "SEM_FRETE" ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                      <input 
                        type="radio" 
                        name="_shippingTypeSelect" 
                        value="SEM_FRETE" 
                        checked={shippingType === "SEM_FRETE"} 
                        onChange={() => setShippingType("SEM_FRETE")}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Entrega Padrão Aurora</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">Grátis (3 a 7 dias úteis)</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${shippingType === "PAGO_CLIENTE" ? "border-primary bg-primary/5 text-primary" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                      <input 
                        type="radio" 
                        name="_shippingTypeSelect" 
                        value="PAGO_CLIENTE" 
                        checked={shippingType === "PAGO_CLIENTE"} 
                        onChange={() => setShippingType("PAGO_CLIENTE")}
                        className="mt-1 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Expressa / Transportadora</p>
                        <p className="text-xs text-slate-500 mt-0.5">A combinar via WhatsApp</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div className="mt-4">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Observações do Pedido <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea 
                    name="notes" 
                    rows={2} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-primary outline-none text-slate-900 dark:text-white text-sm" 
                    placeholder="Instruções de entrega, referências ou embalagem para presente..."
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 mt-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  Forma de Pagamento
                </h2>

                {/* Abas de Pagamento */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PIX")}
                    className={`p-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "PIX"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-emerald-600">qr_code_2</span>
                    PIX Instantâneo
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    className={`p-4 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentMethod === "CREDIT_CARD"
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary">credit_card</span>
                    Cartão de Crédito
                  </button>
                </div>

                {/* Conteúdo PIX */}
                {paymentMethod === "PIX" && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">bolt</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Aprovação Imediata via PIX</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Após clicar em confirmar, seu pedido será gerado e você receberá as instruções de transferência.</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">Chave PIX Aurora:</span>
                      <span className="font-mono font-bold text-primary dark:text-slate-100">pix@aurorastore.com.br</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-base">verified</span>
                      <span>Pagamento 100% seguro com confirmação automatizada.</span>
                    </div>
                  </div>
                )}

                {/* Conteúdo Cartão de Crédito */}
                {paymentMethod === "CREDIT_CARD" && (
                  <div className="bg-slate-50/70 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 gap-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Número do Cartão de Crédito</label>
                      <input 
                        type="text" 
                        maxLength={19} 
                        value={cardNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setCardNumber(formatted);
                        }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary font-mono text-slate-900 dark:text-white" 
                        placeholder="0000 0000 0000 0000" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome no Cartão</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary uppercase text-slate-900 dark:text-white" 
                        placeholder="NOME COMO NO CARTÃO" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Validade (MM/AA)</label>
                         <input 
                           type="text" 
                           maxLength={5} 
                           value={cardExpiry}
                           onChange={(e) => {
                             let v = e.target.value.replace(/\D/g, '').substring(0, 4);
                             if (v.length > 2) v = `${v.substring(0, 2)}/${v.substring(2)}`;
                             setCardExpiry(v);
                           }}
                           className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary font-mono text-slate-900 dark:text-white" 
                           placeholder="12/28" 
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">CVV</label>
                         <input 
                           type="text" 
                           maxLength={4} 
                           value={cardCvv}
                           onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                           className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary font-mono text-slate-900 dark:text-white" 
                           placeholder="123" 
                         />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Parcelamento</label>
                      <select className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary text-slate-900 dark:text-white text-sm">
                        <option value="1">1x de {formattedSubtotal} sem juros</option>
                        <option value="2">2x de R$ {(cartTotal / 2).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="3">3x de R$ {(cartTotal / 3).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="4">4x de R$ {(cartTotal / 4).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="6">6x de R$ {(cartTotal / 6).toFixed(2).replace('.', ',')} sem juros</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {state?.error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
                  <span className="material-symbols-outlined">error</span>
                  {state.error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending}
                className="w-full py-4 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl uppercase tracking-widest shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isPending ? (
                  <><span className="material-symbols-outlined animate-spin">refresh</span> Processando Pedido...</>
                ) : (
                  <><span className="material-symbols-outlined">lock</span> Confirmar Pedido ({formattedSubtotal})</>
                )}
              </button>

            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="w-full lg:w-[40%] bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-100 dark:border-slate-800 sticky top-28 shadow-sm">
             <h3 className="text-xl font-serif text-primary dark:text-white font-bold pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
               Resumo do Pedido
             </h3>
             <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2">
               {items.map(item => (
                 <div key={item.id} className="flex gap-4 items-center border-b border-primary/5 pb-4 last:border-0">
                    <div className="w-16 h-20 rounded bg-primary/5 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Tam: {item.size} | Cor: {item.color}</p>
                      <p className="text-xs text-slate-500">Qtd: {item.qty} un.</p>
                    </div>
                    <div className="font-bold text-primary dark:text-slate-100 text-sm whitespace-nowrap">
                       R$ {(item.numericPrice * item.qty).toFixed(2).replace('.', ',')}
                    </div>
                 </div>
               ))}
             </div>
             <div className="border-t border-primary/10 dark:border-slate-800 pt-6 mt-4 mb-8 flex flex-col gap-2">
                <div className="flex justify-between font-medium text-sm text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between font-medium text-sm text-slate-600 dark:text-slate-400">
                  <span>Frete</span>
                  <span className={shippingType === "SEM_FRETE" ? "text-emerald-600 font-bold" : "text-slate-700 dark:text-slate-300 font-bold"}>
                    {shippingType === "SEM_FRETE" ? "Grátis" : "A Combinar"}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-primary dark:text-white">{formattedSubtotal}</span>
                </div>
              </div>
          </div>

        </div>
      </div>
    );
}
