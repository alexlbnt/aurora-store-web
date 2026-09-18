import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";

export const metadata = {
  title: "Nossa História | Aurora Sleepwear",
  description: "Conheça a essência, missão e propósito da Aurora Sleepwear.",
};

export default function AboutPage() {
  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-primary/60 font-bold block mb-3">
            Manifesto Aurora
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-primary dark:text-slate-100 font-bold mb-6">
            Ressignificando o seu descanso
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Acreditamos que o autocuidado começa no momento em que você se desliga do mundo exterior e se conecta consigo mesma.
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-12 text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary dark:text-slate-100">
              Nossa Origem
            </h2>
            <p>
              A **Aurora** nasceu do desejo de criar peças de sleepwear e loungewear que unissem a sofisticação do design contemporâneo com o toque acolhedor dos tecidos mais nobres. Cada modelo é pensado para transformar o ritual de dormir em um momento de pura celebração e bem-estar.
            </p>
            <p>
              Priorizamos modelagens que respeitam a anatomia feminina, com caimento fluido, costuras macias que não incomodam durante o sono e uma cartela de cores inspirada na serenidade da primeira luz do dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">spa</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-primary dark:text-slate-100">
                Sustentabilidade & Respeito
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Produzimos em pequenos lotes para minimizar o desperdício têxtil. Nossas embalagens são 100% recicláveis e priorizamos matérias-primas com menor impacto ambiental.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">diamond</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-primary dark:text-slate-100">
                Acabamento Impecável
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cada costura, botão e vivo acetinado reflete nosso compromisso absoluto com a qualidade e durabilidade que você sente ao primeiro toque.
              </p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Conheça Nossa Coleção
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
