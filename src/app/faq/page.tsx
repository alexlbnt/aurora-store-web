import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import { whatsappLink } from "@/lib/contact";
import { TROCAS_RESUMO } from "@/lib/policies";
import SizeGuideTable from "@/components/storefront/SizeGuideTable";

export const metadata = {
  title: "Ajuda & Dúvidas Frequentes | Aurora Sleepwear",
  description: "Respostas sobre entrega, pagamento, trocas e tamanhos.",
};

export default function FAQPage() {
  const faqs = [
    {
      q: "Qual é o prazo e o valor da entrega?",
      a: "Frete e prazo variam de pedido para pedido. Depois que você envia o pedido, a vendedora entra em contato para combinar os dois. Você também pode perguntar antes, pelo WhatsApp.",
    },
    {
      q: "Como funcionam as trocas e devoluções?",
      a: `${TROCAS_RESUMO} Veja todos os detalhes em Trocas e devoluções.`,
    },
    {
      q: "Como funciona o pagamento?",
      a: "Ao enviar o pedido pelo site, você não paga na hora. A equipe entra em contato para combinar a forma de pagamento. Na loja física, o pagamento é feito no atendimento.",
    },
    {
      q: "Como cuidar das minhas peças de sleepwear?",
      a: "Confira a etiqueta de cada peça. Em geral, lave à mão ou no ciclo delicado, com sabão neutro e sem alvejante, e evite secadora para preservar a maciez do tecido.",
    },
  ];


  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-serif text-primary dark:text-slate-100 mb-4">
            Dúvidas frequentes
          </h1>
          <p className="text-primary/80 dark:text-slate-400 max-w-xl">
            Entrega, pagamento, trocas e medidas. Se não achar a resposta, fale com a equipe.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-8 mb-16">
          <h2 id="trocas" className="text-3xl font-serif text-primary dark:text-slate-100 border-b border-primary/10 pb-3 scroll-mt-24">
            Perguntas e respostas
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-primary/10 dark:border-slate-800"
              >
                <h3 className="font-semibold text-primary dark:text-slate-100 text-lg mb-2">
                  {faq.q}
                </h3>
                <p className="text-primary/80 dark:text-slate-400 leading-relaxed max-w-prose">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Guia de Medidas */}
        <div className="space-y-6 mb-16">
          <h2 id="tamanhos" className="text-3xl font-serif text-primary dark:text-slate-100 border-b border-primary/10 pb-3 scroll-mt-24">
            Guia de tamanhos
          </h2>
          <p className="text-primary/80 dark:text-slate-400">Medidas do corpo, em centímetros.</p>
          <SizeGuideTable />
        </div>

        {/* Contact Banner */}
        <div className="bg-accent-soft dark:bg-slate-800/60 p-8 rounded-lg space-y-4">
          <h2 className="text-2xl font-serif text-primary dark:text-slate-100">
            Não encontrou o que procurava?
          </h2>
          <p className="text-primary/80 dark:text-slate-400 max-w-md">
            Fale com a equipe pelo WhatsApp. Entrega, troca e pagamento são combinados direto com a vendedora.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href={whatsappLink("Olá! Tenho uma dúvida sobre a Aurora.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-12 px-6 bg-primary text-white font-semibold rounded-full hover:bg-accent-blue transition-colors text-sm"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/trocas"
              className="inline-flex items-center min-h-12 px-6 border border-primary/40 text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm"
            >
              Trocas e devoluções
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center min-h-12 px-6 border border-primary/40 text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm"
            >
              Ver o catálogo
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
