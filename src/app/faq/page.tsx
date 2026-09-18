import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";

export const metadata = {
  title: "Ajuda & Dúvidas Frequentes | Aurora Sleepwear",
  description: "Encontre respostas sobre frete, trocas, devoluções e guia de tamanhos.",
};

export default function FAQPage() {
  const faqs = [
    {
      q: "Qual é o prazo de entrega dos pedidos?",
      a: "O envio é realizado em até 24h úteis após a confirmação do pagamento. O prazo de entrega varia conforme o seu CEP, sendo informado diretamente no momento da compra.",
    },
    {
      q: "Como funciona a política de trocas e devoluções?",
      a: "Você tem até 7 dias corridos após o recebimento do pedido para solicitar troca ou devolução gratuita, conforme o Código de Defesa do Consumidor. A peça deve estar com etiquetas intactas e sem sinais de uso.",
    },
    {
      q: "Quais são as formas de pagamento aceitas?",
      a: "Aceitamos cartões de crédito (com parcelamento sem juros), PIX instantâneo e boleto bancário.",
    },
    {
      q: "Como cuidar das minhas peças de sleepwear?",
      a: "Recomendamos lavagem à mão ou no ciclo delicado da máquina, com sabão neutro e sem alvejantes. Evite secadora para preservar a maciez e o brilho dos tecidos acetinados.",
    },
  ];

  const sizeGuide = [
    { size: "P", busto: "84 - 88 cm", cintura: "66 - 70 cm", quadril: "92 - 96 cm", num: "36 - 38" },
    { size: "M", busto: "89 - 94 cm", cintura: "71 - 76 cm", quadril: "97 - 102 cm", num: "40 - 42" },
    { size: "G", busto: "95 - 100 cm", cintura: "77 - 82 cm", quadril: "103 - 108 cm", num: "44 - 46" },
    { size: "GG", busto: "101 - 108 cm", cintura: "83 - 90 cm", quadril: "109 - 116 cm", num: "48" },
  ];

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-primary/60 font-bold block mb-3">
            Central de Suporte
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif text-primary dark:text-slate-100 font-bold mb-4">
            Como podemos te ajudar?
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Tire suas dúvidas sobre pedidos, trocas, devoluções e medidas.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-8 mb-16">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-slate-100 border-b border-primary/10 pb-3">
            Dúvidas Frequentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">help</span>
                  {faq.q}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Guia de Medidas */}
        <div className="space-y-6 mb-16">
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-slate-100 border-b border-primary/10 pb-3">
            Guia de Tamanhos
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Tamanho</th>
                    <th className="px-6 py-4">Busto</th>
                    <th className="px-6 py-4">Cintura</th>
                    <th className="px-6 py-4">Quadril</th>
                    <th className="px-6 py-4">Manequim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sizeGuide.map((row) => (
                    <tr key={row.size} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-bold text-primary">{row.size}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.busto}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.cintura}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.quadril}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{row.num}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="bg-primary/5 dark:bg-slate-800/60 p-8 rounded-3xl border border-primary/10 text-center space-y-4">
          <h3 className="text-xl font-serif font-bold text-primary dark:text-slate-100">
            Ainda precisa de assistência?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Nossa equipe de suporte está à disposição para te atender com carinho e agilidade.
          </p>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-sm"
            >
              Voltar às Compras
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
