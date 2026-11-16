import React from "react";
import Link from "next/link";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { whatsappLink } from "@/lib/contact";
import { DESISTENCIA_DIAS } from "@/lib/policies";

export const metadata = {
  title: "Trocas e devoluções | Aurora Sleepwear",
  description: `Direito de desistência em ${DESISTENCIA_DIAS} dias, troca de tamanho e produto com defeito.`,
};

const UPDATED_AT = "16 de novembro de 2026";

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "desistencia",
    title: `Desistência em até ${DESISTENCIA_DIAS} dias`,
    body: (
      <>
        <p>
          Nas compras feitas pelo site ou pelo WhatsApp, você pode desistir em até {DESISTENCIA_DIAS} dias corridos
          a partir do dia em que recebeu o pedido, sem precisar explicar o motivo. É um direito garantido pelo
          art. 49 do Código de Defesa do Consumidor.
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Devolvemos todo o valor pago, inclusive o frete de envio.</li>
          <li>O envio de volta da peça não tem custo para você: a vendedora combina a coleta ou a postagem.</li>
          <li>O reembolso é feito pela mesma forma de pagamento usada na compra, assim que a peça chegar.</li>
        </ul>
      </>
    ),
  },
  {
    id: "tamanho",
    title: "Troca de tamanho ou cor",
    body: (
      <p>
        Não serviu ou prefere outra cor? Fale com a vendedora pelo WhatsApp. A troca é feita conforme o estoque
        disponível. Para trocar, a peça precisa estar sem uso, sem lavagem e com a etiqueta.
      </p>
    ),
  },
  {
    id: "defeito",
    title: "Produto com defeito",
    body: (
      <p>
        Se a peça chegou com defeito ou apresentou problema de fabricação, avise a vendedora com uma foto. A peça é
        consertada, trocada por outra igual ou o valor é devolvido, conforme o Código de Defesa do Consumidor.
      </p>
    ),
  },
  {
    id: "loja-fisica",
    title: "Compras feitas pessoalmente",
    body: (
      <p>
        Em compras feitas pessoalmente com a vendedora, as trocas de tamanho ou cor são combinadas no atendimento.
        Produto com defeito segue a mesma regra acima.
      </p>
    ),
  },
  {
    id: "como-pedir",
    title: "Como pedir",
    body: (
      <ol className="list-decimal pl-5 space-y-2">
        <li>Chame a equipe no WhatsApp e informe o número do pedido (ele começa com AUR-).</li>
        <li>Diga se quer desistir, trocar ou se a peça tem defeito.</li>
        <li>A vendedora combina com você o envio da peça e a devolução do valor ou a nova peça.</li>
      </ol>
    ),
  },
];

export default function TrocasPage() {
  return (
    <StorefrontLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-serif text-primary dark:text-slate-100 mb-4">
            Trocas e devoluções
          </h1>
          <p className="text-primary/70 dark:text-slate-400 text-sm">Atualizada em {UPDATED_AT}.</p>
        </div>

        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-2xl font-serif text-primary dark:text-slate-100 border-b border-primary/10 pb-2 mb-4">
                {s.title}
              </h2>
              <div className="text-primary/80 dark:text-slate-400 leading-relaxed max-w-prose">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-16 bg-accent-soft dark:bg-slate-800/60 p-8 rounded-lg space-y-4">
          <h2 className="text-2xl font-serif text-primary dark:text-slate-100">Precisa trocar ou devolver?</h2>
          <div className="flex flex-wrap gap-3">
            <a
              href={whatsappLink("Olá! Quero falar sobre troca ou devolução de um pedido.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center min-h-12 px-6 bg-primary text-white font-semibold rounded-full hover:bg-accent-blue transition-colors text-sm"
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/faq"
              className="inline-flex items-center min-h-12 px-6 border border-primary/40 text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm"
            >
              Dúvidas frequentes
            </Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
