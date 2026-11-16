import Link from "next/link";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { whatsappLink } from "@/lib/contact";

export const metadata = {
  title: "Página não encontrada | Aurora Sleepwear",
};

export default function NotFound() {
  return (
    <StorefrontLayout>
      <div className="max-w-xl mx-auto px-4 py-24 sm:py-32 text-center">
        <p className="text-primary/60 dark:text-slate-400 text-sm font-semibold mb-3">Erro 404</p>
        <h1 className="text-4xl sm:text-5xl font-serif text-primary dark:text-slate-100 mb-4">
          Página não encontrada
        </h1>
        <p className="text-primary/80 dark:text-slate-400 mb-10">
          O link pode estar errado ou o produto saiu da loja. Veja as peças disponíveis no catálogo.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center min-h-12 px-6 bg-primary text-white font-semibold rounded-full hover:bg-accent-blue transition-colors text-sm"
          >
            Ver o catálogo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center min-h-12 px-6 border border-primary/40 text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm"
          >
            Página inicial
          </Link>
          <a
            href={whatsappLink("Olá! Não encontrei uma página no site da Aurora.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-12 px-6 text-primary font-semibold underline underline-offset-4 text-sm"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </StorefrontLayout>
  );
}
