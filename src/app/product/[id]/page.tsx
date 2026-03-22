import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AddToCart from "@/components/storefront/AddToCart";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  // In a real app we'd fetch product data here based on params.id
  // This is mock data
  const resolvedParams = await params;
  
  const dbProduct = await prisma.product.findUnique({
    where: { id: resolvedParams.id },
    include: {
      category: true,
      images: {
        orderBy: { order: 'asc' }
      },
      variants: true
    }
  });

  if (!dbProduct) {
    notFound();
  }

  // Extrair cores únicas e tamanhos únicos das variantes
  const colors = Array.from(new Set(dbProduct.variants.map((v: any) => v.color)));
  const sizes = Array.from(new Set(dbProduct.variants.map((v: any) => v.size)));

  const product = {
    id: dbProduct.id,
    name: dbProduct.name,
    price: `R$ ${Number(dbProduct.basePrice).toFixed(2).replace('.', ',')}`,
    installments: "em até 6x s/ juros",
    images: dbProduct.images.length > 0 
      ? dbProduct.images.map((img: any) => img.url) 
      : ["https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop"],
    colors: colors.length > 0 ? colors : ["Padrão"],
    sizes: sizes.length > 0 ? sizes : ["Único"],
    description: dbProduct.description,
    categoryName: dbProduct.category.name,
    categorySlug: dbProduct.category.slug,
    details: [
      "Qualidade Premium",
      "Modelagem confortável",
      "Toque macio"
    ] // Fake details as we don't have this in schema yet
  };

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-primary/60 dark:text-slate-400 py-6 font-medium uppercase tracking-widest">
        <Link href="/" className="hover:text-primary dark:hover:text-slate-200 transition-colors">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-primary dark:hover:text-slate-200 transition-colors">{product.categoryName}</Link>
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

          <AddToCart product={product} />

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
