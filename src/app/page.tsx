import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import Link from "next/link";

export default function Home() {
  const trendingProducts = [
    {
      id: "1",
      name: "Conjunto Seda Pura Noturno",
      price: "R$ 489,00",
      category: "Conjuntos",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBItmN9eB11w_Z6UoMv_D24Z4f-GjO55Q322H00bM5F_2Q6P5zG6I52hP8Zk9dG4B1g3J5U7c_f8U4k180u1K46R-tZ2eY56f9s6b5C8Xz85g1B7Hh8X9C_T5t8y_q7O5N34m4M_F1Z-0j-lZ0p_M-QvE93D_E_Z_A_H_A_z_oV",
      isNew: true
    },
    {
      id: "2",
      name: "Camisola Aurora Clássica",
      price: "R$ 359,00",
      category: "Camisolas",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnI1QWbV9rD-wD4k-K6M-w1p1T8e7w9L_Tz2p8K8dZk1e1Vn5V_n8M5c8x8S9eU8k1Z4y8M-QvE93D_e_Z_E_z_X5Z_H_Z_T_n_Y5T_F_V_p_9s_3Y_q7O5N_S_K8s_C2",
      isNew: false
    },
    {
      id: "3",
      name: "Roupão Aveludado Premium",
      price: "R$ 529,00",
      category: "Roupões",
      imageUrl: "https://images.unsplash.com/photo-1588665796035-1a3b90f55e5b?q=80&w=1587&auto=format&fit=crop",
      isNew: false
    },
    {
      id: "4",
      name: "Conjunto Linho Leveza",
      price: "R$ 419,00",
      category: "Conjuntos",
      imageUrl: "https://images.unsplash.com/photo-1582239634283-a4e99f6b9ea7?q=80&w=1587&auto=format&fit=crop",
      isNew: true
    }
  ];

  const essentialsProducts = [
    {
      id: "5",
      name: "Camisola Básica Algodão",
      price: "R$ 189,00",
      category: "Camisolas",
      imageUrl: "https://images.unsplash.com/photo-1584985223403-f11de75bbedd?q=80&w=1587&auto=format&fit=crop",
    },
    {
      id: "6",
      name: "Pijama Curto Conforto",
      price: "R$ 229,00",
      category: "Conjuntos",
      imageUrl: "https://images.unsplash.com/photo-1621217730953-adcb615fd9ce?q=80&w=1587&auto=format&fit=crop",
    },
    {
      id: "7",
      name: "Calça Pantalona Sleep",
      price: "R$ 259,00",
      category: "Calças",
      imageUrl: "https://images.unsplash.com/photo-1583095697334-71be9fbff0ea?q=80&w=1587&auto=format&fit=crop",
    },
    {
      id: "8",
      name: "Robe Kimono Verão",
      price: "R$ 319,00",
      category: "Robes",
      imageUrl: "https://images.unsplash.com/photo-1592657421946-f9f3022efef6?q=80&w=1587&auto=format&fit=crop",
    }
  ];

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[500px] max-h-[800px] w-full mt-4 rounded-xl overflow-hidden flex items-center justify-center -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC1_S_-s8K_t8v_L8W-s_9B8k1F_Q_1X4R4P_G9Q8M_o8y_J9O1H9m_q7C_4Y_A5k4n8T_2i_M9V3e8P2G_G_I_a8E4v_M_A5Z5R4E4Y4n_n8S4o_P_Y5c_y9k_G5z')" }}></div>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto flex flex-col items-center gap-6">
          <p className="text-white/90 text-xs font-bold uppercase tracking-[0.3em]">Nova Coleção</p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white font-bold tracking-tight">Elegância no <br/><span className="italic font-light">Descanso</span></h2>
          <p className="text-white/80 text-sm md:text-base font-medium max-w-md">Descubra peças em seda pura e tecidos premium que transformam sua rotina noturna em um ritual de bem-estar.</p>
          <Link href="/catalog" className="mt-4 bg-white text-primary px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white/90 transition-colors shadow-xl">
            Explorar Coleção
          </Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-primary/10 dark:divide-slate-800 border-b border-primary/5 dark:border-slate-800">
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <span className="material-symbols-outlined text-3xl text-primary/70 dark:text-slate-400">local_shipping</span>
          <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-lg">Frete Grátis</h4>
          <p className="text-primary/60 dark:text-slate-400 text-sm">Em compras acima de R$ 399</p>
        </div>
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <span className="material-symbols-outlined text-3xl text-primary/70 dark:text-slate-400">workspace_premium</span>
          <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-lg">Qualidade Premium</h4>
          <p className="text-primary/60 dark:text-slate-400 text-sm">Materiais nobres e toque macio</p>
        </div>
        <div className="flex flex-col items-center gap-3 pt-6 md:pt-0">
          <span className="material-symbols-outlined text-3xl text-primary/70 dark:text-slate-400">autorenew</span>
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
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512496015851-a1fbaf3261a8?q=80&w=1588&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Conjuntos</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </div>
          </Link>
          <Link href="/category/camisolas" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1616150854490-ba5d45d8b99c?q=80&w=1587&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Camisolas</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </div>
          </Link>
          <Link href="/category/roupoes" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Roupões</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </div>
          </Link>
          <Link href="/category/acessorios" className="group relative aspect-[4/5] overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1480&auto=format&fit=crop')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h4 className="text-white font-serif text-xl md:text-2xl font-semibold mb-1">Acessórios</h4>
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Explorar <span className="material-symbols-outlined text-sm">arrow_forward</span></span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 border-t border-primary/5 dark:border-slate-800">
        <div className="text-center mb-12">
          <p className="text-primary/60 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Mais Desejados</p>
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
          <div className="md:w-1/2 aspect-square md:aspect-auto bg-cover bg-center min-h-[400px]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1620755940384-5f8f8edbd41c?q=80&w=1587&auto=format&fit=crop')" }}></div>
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center gap-6 text-center md:text-left">
            <p className="text-primary/60 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Sustentabilidade</p>
            <h3 className="text-3xl md:text-5xl font-serif text-primary dark:text-slate-100 font-bold leading-tight">Conforto Além <br/>da Seda</h3>
            <p className="text-primary/70 dark:text-slate-300 text-sm md:text-base max-w-md mx-auto md:mx-0">
              Conheça nossa nova linha modal, produzida a partir de fontes renováveis. 
              Extra macia, respirável e consciente. O abraço que você precisa ao final do dia.
            </p>
            <div>
              <Link href="/collection/modal" className="inline-block mt-2 border-b-2 border-primary pb-1 text-primary dark:text-slate-200 font-bold uppercase tracking-wider text-sm hover:border-transparent transition-colors">
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
