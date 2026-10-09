import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import HeroSky from "@/components/storefront/HeroSky";
import { whatsappLink } from "@/lib/contact";

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function Home() {

  const dbEssentialsProducts = await prisma.product.findMany({
    take: 8,
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      category: true,
      images: {
        orderBy: [
          { isDisplay: 'desc' },
          { order: 'asc' }
        ],
        take: 1
      }
    }
  });

  const dbCategories = await prisma.category.findMany({
    take: 5,
    orderBy: { name: 'asc' },
    include: {
      products: {
        take: 1,
        include: {
          images: {
            orderBy: [
              { isDisplay: 'desc' },
              { order: 'asc' }
            ],
            take: 1
          }
        }
      }
    }
  });

  const promoCategory = dbCategories.find(c => c.name.toLowerCase() === 'blusas') || dbCategories[0];
  const displayCategories = dbCategories.filter(c => c.id !== promoCategory?.id).slice(0, 4);

  type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
      category: true;
      images: {
        orderBy: [
          { isDisplay: 'desc' },
          { order: 'asc' }
        ];
        take: 1;
      };
    };
  }>;

  const mapProductToCard = (p: ProductWithRelations) => ({
    id: p.id,
    name: p.name,
    price: `R$ ${Number(p.basePrice).toFixed(2).replace('.', ',')}`,
    category: p.category.name,
    imageUrl: p.images[0]?.url || "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop",
    isNew: p.isNew
  });

  const essentialsProducts = dbEssentialsProducts.map(mapProductToCard);

  return (
    <StorefrontLayout>
      {/* Hero */}
      <section className="relative isolate mt-4 flex h-[78vh] min-h-[520px] max-h-[780px] w-full items-end overflow-hidden">
        <Image
          src="/hero-banner.jpg"
          alt="Peças de dormir da coleção Aurora"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        {/* Escurecimento base: garante a leitura do texto antes do céu aparecer */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent" />
        <HeroSky />
        <div className="relative z-10 w-full max-w-2xl px-6 pb-10 sm:px-10 sm:pb-14 text-left text-white">
          <h1 className="font-serif text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
            Roupas para dormir melhor
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">
            Camisolas, conjuntos e roupões. Escolha pelo site e combine entrega e pagamento com a nossa equipe.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/catalog" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-accent-soft">
              Ver o catálogo
            </Link>
            <a
              href={whatsappLink("Olá! Gostaria de ajuda para escolher uma peça da Aurora.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/70 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Falar com a equipe
            </a>
          </div>
        </div>
      </section>

      {/* Atendimento: sem promessas fixas de frete, prazo ou troca */}
      <section className="flex flex-col gap-3 border-b border-primary/10 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-primary/80 dark:text-slate-300">
          Frete, prazo de entrega e trocas são combinados com a vendedora no atendimento.
        </p>
        <a
          href={whatsappLink("Olá! Tenho uma dúvida sobre entrega e trocas da Aurora.")}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm font-semibold text-accent-blue underline underline-offset-4 hover:text-primary"
        >
          Tirar dúvidas no WhatsApp
        </a>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-24">
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-serif text-primary dark:text-slate-100">Categorias</h2>
            <p className="text-primary/70 dark:text-slate-400 text-sm md:text-base max-w-lg">Navegue por tipo de peça.</p>
          </div>
          <Link href="/catalog" className="text-primary dark:text-slate-300 text-sm font-semibold underline underline-offset-4 decoration-primary/30 hover:decoration-primary shrink-0">
            Ver o catálogo completo
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {displayCategories.map(category => (
            <Link key={category.id} href={`/category/${category.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              <Image 
                src={category.imageUrl || category.products[0]?.images[0]?.url || "/promo-banner.jpg"} 
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white font-serif text-2xl md:text-3xl capitalize">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Collection Promo Split */}
      {promoCategory && (
        <section className="py-20">
          <div className="flex flex-col md:flex-row overflow-hidden bg-accent-soft dark:bg-slate-900">
            <div className="md:w-1/2 aspect-square md:aspect-auto relative min-h-[400px]">
              <Image src={promoCategory.imageUrl || promoCategory.products[0]?.images[0]?.url || "/promo-banner.jpg"} alt={`Coleção ${promoCategory.name}`} fill className="object-cover" />
            </div>
            <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center gap-6 text-left">
              <h2 className="text-4xl md:text-6xl font-serif text-primary dark:text-slate-100 leading-[1.05] capitalize">
                {promoCategory.name}
              </h2>
              <p className="text-primary/70 dark:text-slate-300 text-sm md:text-base max-w-md">
                {promoCategory.description || "Veja todas as peças desta categoria."}
              </p>
              <div>
                <Link href={`/category/${promoCategory.slug}`} className="inline-block mt-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue">
                  Ver {promoCategory.name}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid Products */}
      <section className="py-12 mb-20">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-serif text-primary dark:text-slate-100">Destaques</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {essentialsProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

    </StorefrontLayout>
  );
}
