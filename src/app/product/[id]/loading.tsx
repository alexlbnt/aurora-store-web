import StorefrontLayout from "@/components/storefront/StorefrontLayout";

// Aparece enquanto a página do produto carrega.
export default function ProductLoading() {
  return (
    <StorefrontLayout>
      <div className="py-6 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Carregando produto">
        <div className="h-4 w-48 rounded bg-accent-soft mb-8" />
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 mb-20">
          <div className="w-full md:w-[55%] aspect-[3/4] rounded-lg bg-accent-soft" />
          <div className="w-full md:w-[45%] flex flex-col gap-4 md:pt-4">
            <div className="h-10 w-3/4 rounded bg-accent-soft" />
            <div className="h-7 w-32 rounded bg-accent-soft" />
            <div className="h-12 w-full rounded-full bg-accent-soft mt-6" />
            <div className="h-24 w-full rounded bg-accent-soft/70 mt-4" />
          </div>
        </div>
        <span className="sr-only">Carregando produto…</span>
      </div>
    </StorefrontLayout>
  );
}
