"use client";

import React, { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { processPaymentAndCreateOrder } from "./actions";
import { formatPhone } from "@/lib/formatters";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const fieldClass =
  "w-full min-h-12 px-4 py-3 bg-accent-cream dark:bg-slate-800 border border-primary/20 dark:border-slate-700 rounded-lg text-primary dark:text-white placeholder:text-primary/40";
const labelClass = "block text-sm font-semibold text-primary dark:text-slate-300 mb-1.5";

const formatCep = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export default function CheckoutClient() {
  const { items, cartTotal, cartCount, isMounted } = useCart();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(processPaymentAndCreateOrder, null);

  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "notFound">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [shippingType, setShippingType] = useState<"SEM_FRETE" | "PAGO_CLIENTE">("SEM_FRETE");

  useEffect(() => {
    if (isMounted && items.length === 0 && !isPending) {
      router.replace("/cart");
    }
  }, [items, isPending, router, isMounted]);

  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        setCepStatus("notFound");
        return;
      }
      if (data.localidade) setCity(data.localidade);
      if (data.uf) setUf(data.uf);
      if (data.logradouro && !address.trim()) setAddress(`${data.logradouro}, `);
      setCepStatus("idle");
    } catch {
      // Sem internet ou serviço fora do ar: a pessoa preenche à mão.
      setCepStatus("idle");
    }
  };

  if (!isMounted) {
    return (
      <div className="py-8 md:py-12 min-h-screen animate-pulse max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-accent-soft rounded-lg mb-10" />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="w-full lg:w-[60%] h-96 bg-accent-soft/60 rounded-lg" />
          <div className="w-full lg:w-[40%] h-96 bg-accent-soft/60 rounded-lg" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const formattedSubtotal = brl(cartTotal);

  return (
    <div className="py-8 md:py-12 min-h-screen">
      <h1 className="text-4xl md:text-5xl font-serif text-primary dark:text-slate-100 mb-10 max-w-6xl mx-auto">Finalizar pedido</h1>

      <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto items-start">
        {/* Resumo: primeiro no mobile, para a pessoa conferir antes de preencher */}
        <aside className="w-full lg:w-[40%] lg:order-2 bg-accent-cream dark:bg-slate-900 rounded-lg p-6 md:p-8 border border-primary/10 dark:border-slate-800 lg:sticky lg:top-28">
          <h2 className="text-2xl font-serif text-primary dark:text-white pb-4 mb-4 border-b border-primary/10 dark:border-slate-800">
            Resumo do pedido
          </h2>
          <ul className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 items-center">
                <div className="relative w-16 h-20 bg-accent-soft shrink-0 overflow-hidden">
                  <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-primary dark:text-white line-clamp-1">{item.name}</p>
                  <p className="text-sm text-primary/70">Tamanho {item.size}, {item.color}</p>
                  <p className="text-sm text-primary/70">Quantidade: {item.qty}</p>
                </div>
                <p className="font-semibold text-primary dark:text-slate-100 text-sm whitespace-nowrap">
                  {brl(item.numericPrice * item.qty)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="border-t border-primary/10 dark:border-slate-800 pt-6 mt-4 flex flex-col gap-2 text-sm text-primary/80 dark:text-slate-400">
            <div className="flex justify-between">
              <dt>Subtotal ({cartCount} {cartCount === 1 ? "item" : "itens"})</dt>
              <dd>{formattedSubtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Frete</dt>
              <dd>A combinar com a equipe</dd>
            </div>
            <div className="flex justify-between items-end mt-4 text-primary dark:text-white">
              <dt className="text-lg font-semibold">Total das peças</dt>
              <dd className="text-2xl font-semibold">{formattedSubtotal}</dd>
            </div>
          </dl>
        </aside>

        <form
          action={formAction}
          className="w-full lg:w-[60%] lg:order-1 space-y-10 bg-white dark:bg-slate-900 border border-primary/10 dark:border-slate-800 p-6 md:p-10 rounded-lg"
        >
          <input type="hidden" name="cartItems" value={JSON.stringify(items)} />
          <input type="hidden" name="paymentMethod" value={paymentMethod} />
          <input type="hidden" name="shippingType" value={shippingType} />

          {/* 1. Dados */}
          <fieldset className="space-y-4">
            <legend className="text-2xl font-serif text-primary dark:text-white mb-2 flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-sans font-semibold text-white">1</span>
              Seus dados
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>Nome completo</label>
                <input id="name" type="text" name="name" required autoComplete="name" className={fieldClass} placeholder="Maria Oliveira" />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>E-mail <span className="font-normal text-primary/60">(opcional)</span></label>
                <input id="email" type="email" name="email" autoComplete="email" className={fieldClass} placeholder="maria@exemplo.com" />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Telefone ou WhatsApp</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className={fieldClass}
                  placeholder="(62) 99999-9999"
                />
              </div>
            </div>
          </fieldset>

          {/* 2. Entrega */}
          <fieldset className="space-y-4">
            <legend className="text-2xl font-serif text-primary dark:text-white mb-2 flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-sans font-semibold text-white">2</span>
              Endereço de entrega
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cep" className={labelClass}>CEP</label>
                <input
                  id="cep"
                  type="text"
                  name="cep"
                  required
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={cep}
                  onChange={(e) => {
                    const v = formatCep(e.target.value);
                    setCep(v);
                    setCepStatus("idle");
                    if (v.length === 9) lookupCep(v);
                  }}
                  aria-describedby="cep-hint"
                  className={fieldClass}
                  placeholder="00000-000"
                />
                <p id="cep-hint" className="mt-1.5 text-sm text-primary/70" role="status">
                  {cepStatus === "loading" && "Buscando endereço…"}
                  {cepStatus === "notFound" && "CEP não encontrado. Preencha o endereço manualmente."}
                  {cepStatus === "idle" && "Preenchemos cidade e estado para você."}
                </p>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className={labelClass}>Rua, número e complemento</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  required
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={fieldClass}
                  placeholder="Av. Principal, 123, apto 402"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="city" className={labelClass}>Cidade</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={fieldClass}
                  placeholder="Goiânia"
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>Estado</label>
                <select
                  id="state"
                  name="state"
                  required
                  autoComplete="address-level1"
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <p className={labelClass} id="envio-label">Como prefere receber?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-labelledby="envio-label">
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${shippingType === "SEM_FRETE" ? "border-primary bg-accent-soft" : "border-primary/20 hover:border-primary/50"}`}>
                  <input type="radio" name="_shippingTypeSelect" value="SEM_FRETE" checked={shippingType === "SEM_FRETE"} onChange={() => setShippingType("SEM_FRETE")} className="mt-1 text-primary" />
                  <span>
                    <span className="block font-semibold text-sm text-primary">Entrega ou retirada</span>
                    <span className="block text-sm text-primary/70 mt-0.5">Frete e prazo combinados com a equipe depois do pedido</span>
                  </span>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${shippingType === "PAGO_CLIENTE" ? "border-primary bg-accent-soft" : "border-primary/20 hover:border-primary/50"}`}>
                  <input type="radio" name="_shippingTypeSelect" value="PAGO_CLIENTE" checked={shippingType === "PAGO_CLIENTE"} onChange={() => setShippingType("PAGO_CLIENTE")} className="mt-1 text-primary" />
                  <span>
                    <span className="block font-semibold text-sm text-primary">Transportadora ou envio expresso</span>
                    <span className="block text-sm text-primary/70 mt-0.5">Valor e prazo combinados pelo WhatsApp</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>Observações <span className="font-normal text-primary/60">(opcional)</span></label>
              <textarea id="notes" name="notes" rows={2} className={fieldClass} placeholder="Referência para entrega, embalagem de presente…" />
            </div>
          </fieldset>

          {/* 3. Pagamento */}
          <fieldset className="space-y-4">
            <legend className="text-2xl font-serif text-primary dark:text-white mb-2 flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-sans font-semibold text-white">3</span>
              Forma de pagamento
            </legend>
            <p className="text-sm text-primary/80">
              Você não paga agora. Depois de enviar o pedido, a equipe entra em contato para combinar o pagamento.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Forma de pagamento preferida">
              {([
                ["PIX", "PIX", "Você recebe os dados para transferir"],
                ["CREDIT_CARD", "Cartão de crédito", "Condições combinadas no atendimento"],
              ] as const).map(([value, title, hint]) => (
                <label key={value} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${paymentMethod === value ? "border-primary bg-accent-soft" : "border-primary/20 hover:border-primary/50"}`}>
                  <input type="radio" name="_paymentSelect" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-1 text-primary" />
                  <span>
                    <span className="block font-semibold text-sm text-primary">{title}</span>
                    <span className="block text-sm text-primary/70 mt-0.5">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {state?.error && (
            <div role="alert" className="border border-dawn-ink/40 bg-dawn/10 text-dawn-ink p-4 rounded-lg text-sm font-medium flex items-start gap-3">
              <span className="material-symbols-outlined">error</span>
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-14 text-base font-semibold bg-primary hover:bg-accent-blue text-white rounded-full transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin">refresh</span> Enviando pedido…
              </>
            ) : (
              <>Enviar pedido ({formattedSubtotal})</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
