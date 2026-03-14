import React from "react";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import ProductCard from "@/components/storefront/ProductCard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const revalidate = 60; // Revalidate page every 60 seconds

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          category: true,
          images: {
            where: { isDisplay: true },
            take: 1
          }
        }
      }
    }
  });

  if (!category) {
    notFound();
  }

  const products = category.products.map(p => ({
    id: p.id,
    name: p.name,
    price: `R$ ${Number(p.basePrice).toFixed(2).replace('.', ',')}`,
    category: p.category.name,
    imageUrl: p.images[0]?.url || "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1587&auto=format&fit=crop",
    isNew: p.isNew
  }));

  return (
    <StorefrontLayout>
      <section className="py-12 md:py-20 mt-4">
        <div className="text-center mb-12">
          <p className="text-primary/60 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Categoria</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary dark:text-slate-100 font-bold capitalize">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-4 text-primary/70 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-primary/5 dark:bg-slate-800/50 rounded-lg border border-primary/10 dark:border-slate-800">
            <h3 className="text-xl font-serif text-primary dark:text-slate-200 font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-primary/60 dark:text-slate-400">Ainda não temos produtos nesta categoria.</p>
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
