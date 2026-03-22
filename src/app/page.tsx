import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Truck, Award, RefreshCw, ArrowRight } from "lucide-react";

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function Home() {
  const dbTrendingProducts = await prisma.product.findMany({
    where: { isFeatured: true },
    take: 4,
    include: {
      category: true,
      images: {
        where: { isDisplay: true },
        take: 1
      }
    }
  });

  const dbEssentialsProducts = await prisma.product.findMany({
    where: { isFeatured: false },
    take: 4,
    include: {
      category: true,
      images: {
        where: { isDisplay: true },
        take: 1
      }
    }
  });

  type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
      category: true;
      images: { where: { isDisplay: true }; take: 1 };
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

  const trendingProducts = dbTrendingProducts.map(mapProductToCard);
  const essentialsProducts = dbEssentialsProducts.map(mapProductToCard);

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] max-h-[800px] w-full mt-4 rounded-xl overflow-hidden flex items-center justify-center -mx-4 sm:mx-0 sm:w-full">
        <Image 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1_S_-s8K_t8v_L8W-s_9B8k1F_Q_1X4R4P_G9Q8M_o8y_J9O1H9m_q7C_4Y_A5k4n8T_2i_M9V3e8P2G_G_I_a8E4v_M_A5Z5R4E4Y4n_n8S4o_P_Y5c_y9k_G5z" 
          alt="Elegância no Descanso" 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <p className="text-white/90 text-xs font-bold uppercase tracking-[0.3em]">Nova Coleção</p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white font-bold tracking-tight">Elegância no <br/><span className="italic font-light">Descanso</span></h2>
          <p className="text-white/80 text-sm md:text-base font-medium max-w-md">Descubra peças em seda pura e tecidos premium que transformam sua rotina noturna em um ritual de bem-estar.</p>
          <Link href="/catalog" className="mt-4 bg-white text-primary px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-accent-blue hover:text-white transition-colors shadow-xl">
            Explorar Coleção
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-primary/10 dark:divide-slate-800 border-b border-primary/5 dark:border-slate-800">
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <Truck className="w-8 h-8 text-primary/70 dark:text-slate-400" />
          <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-lg">Frete Grátis</h4>
          <p className="text-primary/60 dark:text-slate-400 text-sm">Em compras acima de R$ 399</p>
        </div>
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <Award className="w-8 h-8 text-primary/70 dark:text-slate-400" />
          <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-lg">Qualidade Premium</h4>
          <p className="text-primary/60 dark:text-slate-400 text-sm">Materiais nobres e toque macio</p>
        </div>
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <RefreshCw className="w-8 h-8 text-primary/70 dark:text-slate-400" />
          <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-lg">Troca Fácil</h4>
          <p className="text-primary/60 dark:text-slate-400 text-sm">Primeira troca sem custo em 30 dias</p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 md:py-24">
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4 mb-10">
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-4xl font-serif text-primary dark:text-slate-100 font-bold">Essenciais</h3>
            <p className="text-primary/60 dark:text-slate-400 text-sm md:text-base max-w-lg">Peças atemporais e versáteis projetadas para o máximo de conforto em qualquer estação.</p>
          </div>
          <Link href="/catalog" className="text-primary dark:text-slate-300 text-sm font-bold uppercase tracking-wider hover:underline underline-offset-4 decoration-primary/30 shrink-0">
            Ver todas as categorias
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Link href="/category/conjuntos" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image src="https://images.unsplash.com/photo-1512496015851-a1fbaf3261a8?q=80&w=1588&auto=format&fit=crop" alt="Conjuntos" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Conjuntos</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
          <Link href="/category/camisolas" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image src="https://images.unsplash.com/photo-1616150854490-ba5d45d8b99c?q=80&w=1587&auto=format&fit=crop" alt="Camisolas" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Camisolas</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
          <Link href="/category/roupoes" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop" alt="Roupões" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Roupões</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
          <Link href="/category/acessorios" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1480&auto=format&fit=crop" alt="Acessórios" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Acessórios</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 border-t border-primary/5 dark:border-slate-800">
        <div className="text-center mb-12">
          <p className="text-accent-blue dark:text-accent-blue/80 text-xs font-bold uppercase tracking-[0.2em] mb-3">Mais Desejados</p>
          <h3 className="text-3xl md:text-4xl font-serif text-primary dark:text-slate-100 font-bold">Em Alta</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Collection Promo Split */}
      <section className="py-20">
        <div className="flex flex-col md:flex-row rounded-lg overflow-hidden bg-accent-soft dark:bg-slate-900 border border-primary/5 dark:border-slate-800 shadow-sm">
          <div className="md:w-1/2 aspect-square md:aspect-auto relative min-h-[400px]">
            <Image src="https://images.unsplash.com/photo-1620755940384-5f8f8edbd41c?q=80&w=1587&auto=format&fit=crop" alt="Coleção Modal" fill className="object-cover" />
          </div>
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center gap-6 text-center md:text-left">
            <p className="text-accent-blue dark:text-accent-blue/80 text-xs font-bold uppercase tracking-[0.2em]">Sustentabilidade</p>
            <h3 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold leading-tight">Conforto Além <br/>da Seda</h3>
            <p className="text-primary/70 dark:text-slate-300 text-sm md:text-base max-w-md mx-auto md:mx-0">
              Conheça nossa nova linha modal, produzida a partir de fontes renováveis. 
              Extra macia, respirável e consciente. O abraço que você precisa ao final do dia.
            </p>
            <div>
              <Link href="/collection/modal" className="inline-block mt-2 border-b-2 border-primary pb-1 text-primary dark:text-slate-200 font-bold uppercase tracking-wider text-sm hover:text-accent-blue hover:border-accent-blue transition-colors">
                Descubra a Coleção Modal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Products */}
      <section className="py-12 mb-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-serif text-primary dark:text-slate-100 font-bold">Clássicos Atemporais</h3>
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
