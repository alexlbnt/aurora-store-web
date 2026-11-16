import React, { cache } from "react";
import type { Metadata } from "next";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/auth";
import AddToCart from "@/components/storefront/AddToCart";
import ProductGallery from "@/components/storefront/ProductGallery";
import ProductCard from "@/components/storefront/ProductCard";
import { availableFirst, availableStock, formatBRL, metaDescription, productCardInclude, toProductCard } from "@/lib/storefront";
import { SITE_NAME } from "@/lib/site";
import { isUuid, productPath } from "@/lib/slug";
import { TROCAS_RESUMO } from "@/lib/policies";

// Mesma consulta para a página e para os metadados: o cache evita ir ao banco duas vezes.
// O endereço aceita o slug (/product/pijama-cetim) ou o id antigo (links já compartilhados).
const getProduct = cache((idOrSlug: string) =>
  prisma.product.findUnique({
    where: isUuid(idOrSlug) ? { id: idOrSlug } : { slug: decodeURIComponent(idOrSlug) },
    include: {
      category: true,
      images: { orderBy: { order: "asc" } },
      variants: true,
    },
  })
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p || !p.visible) return { title: `Produto não encontrado | ${SITE_NAME}`, robots: { index: false } };

  const title = `${p.name.trim()} | ${SITE_NAME}`;
  const price = formatBRL(Number(p.basePrice));
  const soldOut = availableStock(p.variants) === 0;
  const description = metaDescription(`${soldOut ? "Esgotado. " : `${price}. `}${p.description}`);
  const cover = [...p.images].sort((a, b) => Number(b.isDisplay) - Number(a.isDisplay) || a.order - b.order)[0];

  return {
    title,
    description,
    alternates: { canonical: productPath(p) },
    openGraph: {
      title,
      description,
      url: productPath(p),
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      ...(cover ? { images: [{ url: cover.url, alt: p.name }] } : {}),
    },
  };
}

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const dbProduct = await getProduct(resolvedParams.id);

  const session = await auth();
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Produto oculto na loja: some para o público; o administrador ainda vê para conferir.
  if (!dbProduct || (!dbProduct.visible && !isAdmin)) {
    notFound();
  }

  // Link antigo pelo id: leva ao endereço legível, que é o que o Google deve guardar.
  if (dbProduct.slug && resolvedParams.id !== dbProduct.slug && isUuid(resolvedParams.id)) {
    permanentRedirect(productPath(dbProduct));
  }

  // "Você também pode gostar": outras peças da mesma categoria, disponíveis primeiro.
  const relatedRaw = await prisma.product.findMany({
    where: { categoryId: dbProduct.categoryId, visible: true, id: { not: dbProduct.id } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 12,
    include: productCardInclude,
  });
  const related = availableFirst(relatedRaw.map(toProductCard)).slice(0, 4);

  // Extrair cores únicas e tamanhos únicos das variantes
  const colors = Array.from(new Set(dbProduct.variants.map((v: any) => v.color)));
  const sizes = Array.from(new Set(dbProduct.variants.map((v: any) => v.size)));

  // Preço: a variação pode ter preço próprio; sem ele, vale o preço base do produto.
  const basePrice = Number(dbProduct.basePrice);
  const variantPrices = dbProduct.variants.map((v) => (v.price != null ? Number(v.price) : basePrice));
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
  const hasPriceRange = new Set(variantPrices).size > 1;

  const product = {
    id: dbProduct.id,
    name: dbProduct.name.trim(),
    basePrice,
    price: formatBRL(minPrice),
    images: dbProduct.images.map((img) => img.url),
    colors: colors.length > 0 ? colors : ["Padrão"],
    sizes: sizes.length > 0 ? sizes : ["Único"],
    // O site vende dos dois estoques (A e V): o disponível é a soma.
    variants: dbProduct.variants.map((v) => ({
      color: v.color,
      size: v.size,
      stock: Math.max(0, v.stockA) + Math.max(0, v.stockV),
      price: v.price != null ? Number(v.price) : null,
    })),
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
      <nav className="flex items-center gap-2 text-sm text-primary/70 dark:text-slate-400 py-6">
        <Link href="/" className="hover:text-primary dark:hover:text-slate-200 transition-colors">Início</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-primary dark:hover:text-slate-200 transition-colors">{product.categoryName}</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary dark:text-slate-200 font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
      </nav>

      {!dbProduct.visible && (
        <p className="mb-6 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 px-4 py-3 text-sm" role="status">
          Este produto está <strong>oculto na loja</strong>. Só administradores veem esta página. Para mostrar de novo,
          use &quot;Mostrar na loja&quot; na lista de produtos do painel.
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-10 lg:gap-16 mb-20 relative">
        {/* Images Selection */}
        <ProductGallery images={product.images} />

        {/* Product Info */}
        <div className="w-full md:w-[45%] flex flex-col gap-8 md:pt-4">
          <div className="space-y-4 border-b border-primary/10 pb-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl lg:text-4xl font-serif text-primary dark:text-slate-100 leading-tight">{product.name}</h1>
              {isAdmin && (
                <Link href={`/admin/products/${product.id}/edit`} className="shrink-0 flex items-center gap-1 bg-accent-soft text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Editar
                </Link>
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold text-primary dark:text-slate-100">
                {hasPriceRange && <span className="text-base font-normal text-primary/70">A partir de </span>}
                {product.price}
              </p>
            </div>
          </div>

          <AddToCart product={product} />

          {/* Accordion Detalhes */}
          <div className="space-y-1">
            <details className="group border-b border-primary/10 pb-4" open>
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-xl text-primary dark:text-slate-100">
                Detalhes do produto
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
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-xl text-primary dark:text-slate-100">
                Cuidados com a peça
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-primary/60">keyboard_arrow_down</span>
              </summary>
              <div className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed pr-6 pb-2">
                <p>Para manter a maciez e o caimento da peça, confira a etiqueta e, em geral:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Lavar à mão com água fria e sabão neutro</li>
                  <li>Não torcer, apenas espremer suavemente</li>
                  <li>Secar à sombra, longe de calor direto</li>
                  <li>Passar do avesso, em temperatura baixa</li>
                </ul>
              </div>
            </details>
            <details className="group border-b border-primary/10 pb-4">
              <summary className="flex items-center justify-between cursor-pointer list-none py-4 font-serif text-xl text-primary dark:text-slate-100">
                Trocas e devoluções
                <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-primary/60">keyboard_arrow_down</span>
              </summary>
              <div className="text-sm text-primary/80 dark:text-slate-300 leading-relaxed pr-6 pb-2">
                <p>{TROCAS_RESUMO}</p>
                <Link href="/trocas" className="inline-block mt-2 font-semibold text-primary dark:text-slate-100 underline underline-offset-4">
                  Ver a política de trocas
                </Link>
              </div>
            </details>
          </div>

        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="mb-20">
          <h2 id="relacionados" className="text-2xl sm:text-3xl font-serif text-primary dark:text-slate-100 mb-8">
            Você também pode gostar
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}
    </StorefrontLayout>
  );
}
