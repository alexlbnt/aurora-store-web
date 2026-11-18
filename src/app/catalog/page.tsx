import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import CatalogFilters from "@/components/storefront/CatalogFilters";
import Link from "next/link";
import { availableFirst, filterableColors, paginate, productCardInclude, sortSizes, toProductCard } from "@/lib/storefront";

export const revalidate = 0;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const categoryStr = typeof params.category === 'string' ? params.category : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';
  const size = typeof params.size === 'string' ? params.size : undefined;
  const color = typeof params.color === 'string' ? params.color : undefined;

  const where: Prisma.ProductWhereInput = { visible: true };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (categoryStr) {
    where.categoryId = categoryStr;
  }
  // Tamanho e cor: só mostra o produto se a combinação escolhida tiver peça em algum estoque.
  if (size || color) {
    where.variants = {
      some: {
        ...(size ? { size } : {}),
        ...(color ? { color } : {}),
        OR: [{ stockA: { gt: 0 } }, { stockV: { gt: 0 } }],
      },
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
  if (sort === 'price_desc') orderBy = { basePrice: 'desc' };

  const productsRaw = await prisma.product.findMany({
    where,
    orderBy,
    include: productCardInclude,
  });

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  // Opções de tamanho e cor: só o que tem peça disponível.
  const inStockVariants = await prisma.variant.findMany({
    where: { product: { visible: true }, OR: [{ stockA: { gt: 0 } }, { stockV: { gt: 0 } }] },
    select: { size: true, color: true },
    distinct: ['size', 'color'],
  });
  const sizes = sortSizes(inStockVariants.map((v) => v.size));
  const colors = filterableColors(inStockVariants.map((v) => v.color));

  // Esgotados aparecem por último, para o cliente ver primeiro o que pode comprar.
  const allProducts = availableFirst(productsRaw.map(toProductCard));
  const { page, totalPages, items: products } = paginate(allProducts, params.page);

  // Link de outra página mantendo busca, filtros e ordem.
  const pageHref = (n: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (categoryStr) sp.set("category", categoryStr);
    if (sort && sort !== "newest") sp.set("sort", sort);
    if (size) sp.set("size", size);
    if (color) sp.set("color", color);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  return (
    <StorefrontLayout>
      <section className="py-12 md:py-20 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <CatalogFilters
              categories={categories}
              sizes={sizes}
              colors={colors}
              initialQuery={q}
              initialCategory={categoryStr}
              initialSort={sort}
              initialSize={size}
              initialColor={color}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white capitalize">
                {q ? `Resultados para "${q}"` : 'Catálogo Completo'}
              </h1>
              <p className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{allProducts.length} {allProducts.length === 1 ? "produto" : "produtos"}</p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : null}

            {totalPages > 1 && (
              <nav aria-label="Páginas do catálogo" className="mt-12 flex flex-wrap items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="min-h-11 px-4 inline-flex items-center rounded-full border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5">
                    Anterior
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={pageHref(n)}
                    aria-current={n === page ? "page" : undefined}
                    className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-sm font-semibold ${n === page ? "bg-primary text-white" : "text-primary hover:bg-primary/5"}`}
                  >
                    {n}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="min-h-11 px-4 inline-flex items-center rounded-full border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5">
                    Próxima
                  </Link>
                )}
              </nav>
            )}

            {products.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-4 block">search_off</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Nenhum produto encontrado</h3>
                <p className="text-slate-500">Tente ajustar seus filtros ou termos de busca.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
