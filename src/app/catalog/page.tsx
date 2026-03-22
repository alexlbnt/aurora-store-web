import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { prisma } from "@/lib/prisma";
import CatalogFilters from "@/components/storefront/CatalogFilters";

export const revalidate = 0;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const categoryStr = typeof params.category === 'string' ? params.category : undefined;
  const sort = typeof params.sort === 'string' ? params.sort : 'newest';

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }
  if (categoryStr) {
    where.categoryId = categoryStr;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
  if (sort === 'price_desc') orderBy = { basePrice: 'desc' };

  const productsRaw = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: true,
      images: { where: { isDisplay: true }, take: 1 }
    }
  });

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  const products = productsRaw.map(p => ({
    id: p.id,
    name: p.name,
    price: `R$ ${Number(p.basePrice).toFixed(2).replace('.', ',')}`,
    category: p.category.name,
    imageUrl: p.images[0]?.url || "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop",
    isNew: p.isNew
  }));

  return (
    <StorefrontLayout>
      <section className="py-12 md:py-20 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <CatalogFilters categories={categories} initialQuery={q} initialCategory={categoryStr} initialSort={sort} />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-serif font-bold text-slate-900 dark:text-white capitalize">
                {q ? `Resultados para "${q}"` : 'Catálogo Completo'}
              </h1>
              <p className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{products.length} produtos</p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
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
