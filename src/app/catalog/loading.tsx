import StorefrontLayout from "@/components/storefront/StorefrontLayout";

// Aparece enquanto o catálogo carrega (busca, filtro ou troca de página).
export default function CatalogLoading() {
  return (
    <StorefrontLayout>
      <section className="py-12 md:py-20 mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy="true" aria-label="Carregando catálogo">
        <div className="flex flex-col md:flex-row gap-8 animate-pulse motion-reduce:animate-none">
          <div className="w-full md:w-64 shrink-0 h-72 rounded-2xl bg-accent-soft/60" />
          <div className="flex-1">
            <div className="h-8 w-56 rounded bg-accent-soft mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="aspect-[3/4] bg-accent-soft" />
                  <div className="h-4 w-3/4 rounded bg-accent-soft" />
                  <div className="h-4 w-1/3 rounded bg-accent-soft" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Carregando produtos…</span>
      </section>
    </StorefrontLayout>
  );
}
