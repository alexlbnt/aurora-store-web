import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AddToCart from "@/components/storefront/AddToCart";
import ProductGallery from "@/components/storefront/ProductGallery";

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

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

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
    details: dbProduct.details.length > 0 ? dbProduct.details : [
      "Qualidade Premium",
      "Modelagem confortável",
      "Toque macio"
    ]
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
        <ProductGallery images={product.images} />

        {/* Product Info */}
        <div className="w-full md:w-[45%] flex flex-col gap-8 md:pt-4">
          <div className="space-y-4 border-b border-primary/10 pb-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl lg:text-4xl font-serif text-primary dark:text-slate-100 font-bold leading-tight">{product.name}</h1>
              {isAdmin && (
                <Link href={`/admin/products/${product.id}/edit`} className="shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </Link>
              )}
            </div>
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
