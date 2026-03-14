import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import Image from "next/image";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  // In a real app we'd fetch product data here based on params.id
  // This is mock data
  const resolvedParams = await params;
  const product = {
    id: resolvedParams.id,
    name: "Conjunto Seda Pura Noturno",
    price: "R$ 489,00",
    installments: "em até 6x de R$ 81,50 s/ juros",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBItmN9eB11w_Z6UoMv_D24Z4f-GjO55Q322H00bM5F_2Q6P5zG6I52hP8Zk9dG4B1g3J5U7c_f8U4k180u1K46R-tZ2eY56f9s6b5C8Xz85g1B7Hh8X9C_T5t8y_q7O5N34m4M_F1Z-0j-lZ0p_M-QvE93D_E_Z_A_H_A_z_oV",
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512496015851-a1fbaf3261a8?q=80&w=1588&auto=format&fit=crop"
    ],
    colors: ["Pérola", "Champagne", "Preto"],
    sizes: ["P", "M", "G", "GG"],
    description: "Com modelagem fluida e toque incomparavelmente macio, este conjunto foi desenhado para abraçar seu corpo. A blusa possui alças finas reguláveis e decote suave, enquanto o shorts tem cintura elástica embutida que não marca. Confeccionado em 100% seda pura de amoreira.",
    details: [
      "100% Seda Pura de Amoreira (22 momme)",
      "Termorregulador natural",
      "Hipoalergênico e gentil com a pele",
      "Modelagem soltinha e confortável"
    ]
  };

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-primary/60 dark:text-slate-400 py-6 font-medium uppercase tracking-widest">
        <Link href="/" className="hover:text-primary dark:hover:text-slate-200 transition-colors">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href="/category/conjuntos" className="hover:text-primary dark:hover:text-slate-200 transition-colors">Conjuntos</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16 mb-20 relative">
        {/* Images Selection */}
        <div className="w-full md:w-[55%] flex flex-col-reverse md:flex-row gap-4 h-full md:sticky md:top-24">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-20 lg:w-24 shrink-0 snap-x">
            {product.images.map((img, idx) => (
              <button key={idx} className={`aspect-[3/4] rounded md:rounded-none shrink-0 w-20 md:w-full overflow-hidden border-2 snap-center transition-all ${idx === 0 ? 'border-primary dark:border-slate-500' : 'border-transparent opacity-60 hover:opacity-100 hover:border-primary/30'}`}>
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
              </button>
            ))}
          </div>
          <div className="flex-1 aspect-[3/4] md:aspect-auto md:h-[calc(100vh-160px)] min-h-[400px] bg-primary/5 rounded-lg overflow-hidden relative cursor-zoom-in">
             <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${product.images[0]})` }} />
             <button className="absolute bottom-4 right-4 bg-white/80 backdrop-blur size-10 flex items-center justify-center rounded-full text-primary hover:bg-white transition-colors shadow-sm">
               <span className="material-symbols-outlined">zoom_in</span>
             </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full md:w-[45%] flex flex-col gap-8 md:pt-4">
          <div className="space-y-4 border-b border-primary/10 pb-8">
            <h1 className="text-3xl lg:text-4xl font-serif text-primary dark:text-slate-100 font-bold leading-tight">{product.name}</h1>
            <div>
              <p className="text-2xl font-bold text-primary dark:text-slate-100 mb-1">{product.price}</p>
              <p className="text-sm text-primary/60 dark:text-slate-400 font-medium">{product.installments}</p>
            </div>
          </div>

          <div className="space-y-6 border-b border-primary/10 pb-8">
            {/* Cor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary dark:text-slate-200 uppercase tracking-widest">Cor: <span className="text-primary/70">{product.colors[0]}</span></span>
              </div>
              <div className="flex gap-3">
                {product.colors.map((c, i) => (
                  <button key={i} className={`size-8 rounded-full border-2 p-0.5 transition-all outline-none ${i === 0 ? 'border-primary dark:border-slate-400' : 'border-transparent'}`} title={c}>
                    <div className={`w-full h-full rounded-full border border-primary/10 ${i===0 ? 'bg-[#FAF6F0]' : i===1 ? 'bg-[#d8c8b8]' : 'bg-[#2D241D]'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Tamanho */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary dark:text-slate-200 uppercase tracking-widest">Tamanho</span>
                <button className="text-xs font-bold text-primary/60 dark:text-slate-400 underline underline-offset-4 hover:text-primary transition-colors">Guia de Medidas</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.sizes.map((s, i) => (
                  <button key={i} className={`py-3 rounded text-sm font-bold uppercase transition-all flex items-center justify-center ${i === 1 ? 'bg-primary text-white border border-primary' : 'border border-primary/20 text-primary dark:text-slate-300 hover:border-primary/60'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="pt-4 space-y-3">
              <button className="w-full bg-primary hover:bg-primary/90 text-white dark:text-slate-100 font-bold uppercase tracking-widest py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm">
                <span className="material-symbols-outlined">shopping_bag</span>
                Adicionar à Sacola
              </button>
              <button className="w-full bg-transparent text-primary dark:text-slate-200 border border-primary dark:border-slate-500 font-bold uppercase tracking-widest py-4 rounded-full hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                Lista de Desejos
              </button>
            </div>
            
            <div className="flex items-center gap-3 pt-4 text-xs font-bold text-primary/60 dark:text-slate-400 uppercase tracking-widest">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              Envio em 24h úteis
            </div>
          </div>

          {/* Accordion Detalhes */}
          <div className="space-y-1">
            <details className="group border-b border-primary/10 pb-4" open>
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-lg text-primary dark:text-slate-100 font-bold">
                Detalhes do Produto
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-primary/60">keyboard_arrow_down</span>
              </summary>
              <div className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed pr-6 pb-2 space-y-4">
                <p>{product.description}</p>
                <ul className="list-disc pl-5 space-y-1">
                  {product.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </details>
            <details className="group border-b border-primary/10 pb-4">
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-lg text-primary dark:text-slate-100 font-bold">
                Cuidados com a Peça
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-primary/60">keyboard_arrow_down</span>
              </summary>
              <div className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed pr-6 pb-2">
                <p>A seda exige cuidados delicados para manter seu brilho e maciez por muitos anos:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Lavar à mão com água fria e sabão neutro</li>
                  <li>Não torcer, apenas espremer suavemente</li>
                  <li>Secar à sombra, longe de calor direto</li>
                  <li>Passar do avesso com ferro morno ou a vapor</li>
                </ul>
              </div>
            </details>
            <details className="group border-b border-primary/10 pb-4">
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-lg text-primary dark:text-slate-100 font-bold">
                Trocas & Devoluções
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-primary/60">keyboard_arrow_down</span>
              </summary>
              <div className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed pr-6 pb-2">
                Você tem 30 dias após o recebimento para solicitar a primeira troca gratuitamente. A peça deve estar com as etiquetas originais, sem marcas de uso, odores ou lavagem.
              </div>
            </details>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
}
