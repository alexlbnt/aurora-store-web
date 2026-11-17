import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { whatsappLink } from "@/lib/contact";

export const metadata = {
  title: "Política de Privacidade | Aurora Sleepwear",
  description: "Quais dados a Aurora coleta, para que usa e como você pode pedir acesso ou exclusão.",
};

const CONTACT_EMAIL = "auroraadm25@gmail.com";
const UPDATED_AT = "16 de novembro de 2026";

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "quem-somos",
    title: "Quem somos",
    body: (
      <p>
        A Aurora Sleepwear é uma loja de roupas para dormir. Esta página explica quais dados pessoais coletamos
        no site, para que eles servem e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados
        (Lei 13.709/2018, LGPD).
      </p>
    ),
  },
  {
    id: "dados",
    title: "Dados que coletamos",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Ao fazer um pedido:</strong> nome, telefone (WhatsApp), e-mail (opcional), CEP, endereço,
          cidade, estado, observações do pedido e os produtos escolhidos.
        </li>
        <li>
          <strong>Ao criar uma conta com e-mail e senha:</strong> nome, e-mail e senha. A senha é guardada
          criptografada; ninguém da equipe consegue vê-la.
        </li>
        <li>
          <strong>Ao entrar com o Google:</strong> recebemos do Google apenas seu nome e e-mail. Não temos
          acesso à sua senha do Google, aos seus e-mails nem a outros dados da conta.
        </li>
        <li>
          <strong>No seu navegador:</strong> o carrinho e os favoritos ficam salvos no próprio aparelho, e um
          cookie mantém a sua conta conectada. Não usamos cookies de propaganda nem de rastreamento.
        </li>
        <li>
          <strong>Estatísticas de visita:</strong> contamos quantas pessoas visitam cada página da loja, de
          forma anônima e sem cookies (Vercel Web Analytics). Não entram nessa contagem a sua conta, o
          resultado do pedido nem o que você digita nos formulários.
        </li>
      </ul>
    ),
  },
  {
    id: "uso",
    title: "Para que usamos",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Separar as peças, combinar pagamento e frete e entregar o seu pedido.</li>
        <li>Falar com você pelo WhatsApp ou e-mail sobre o pedido.</li>
        <li>Mostrar o histórico de pedidos na sua conta.</li>
        <li>Evitar pedidos falsos e proteger o site contra abuso.</li>
      </ul>
    ),
  },
  {
    id: "compartilhamento",
    title: "Com quem compartilhamos",
    body: (
      <>
        <p>Não vendemos nem alugamos seus dados. Eles são acessados apenas:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>pelas vendedoras da Aurora, para atender o seu pedido;</li>
          <li>
            pelos serviços que mantêm o site no ar: a Vercel (hospedagem), a Neon (banco de dados) e o Google
            (login, quando você escolhe entrar com o Google). Esses serviços podem guardar dados em servidores
            fora do Brasil;
          </li>
          <li>pela transportadora ou pelos Correios, quando houver envio, com o nome e o endereço de entrega.</li>
        </ul>
      </>
    ),
  },
  {
    id: "guarda",
    title: "Por quanto tempo guardamos",
    body: (
      <p>
        Os dados da conta ficam guardados enquanto ela existir. Os dados dos pedidos ficam guardados pelo tempo
        necessário para atendimento, trocas e obrigações legais. Depois disso, são excluídos.
      </p>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <p>
        Você pode, a qualquer momento, pedir para ver, corrigir ou excluir seus dados, ou saber com quem eles
        foram compartilhados. Basta escrever para o e-mail abaixo ou chamar no WhatsApp. Respondemos em até 15
        dias.
      </p>
    ),
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: (
      <p>
        Se esta política mudar, a nova versão será publicada nesta página com a data de atualização.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <StorefrontLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-serif text-primary dark:text-slate-100 mb-4">
            Política de Privacidade
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

        <div id="contato" className="mt-16 bg-accent-soft dark:bg-slate-800/60 p-8 rounded-lg space-y-4 scroll-mt-24">
          <h2 className="text-2xl font-serif text-primary dark:text-slate-100">Contato sobre seus dados</h2>
          <p className="text-primary/80 dark:text-slate-400">
            E-mail:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-primary dark:text-slate-100 underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <a
            href={whatsappLink("Olá! Tenho uma dúvida sobre os meus dados na Aurora.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-12 px-6 bg-primary text-white font-semibold rounded-full hover:bg-accent-blue transition-colors text-sm"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </StorefrontLayout>
  );
}
