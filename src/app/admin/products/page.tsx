import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import ProductRowActions from "./ProductRowActions";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; // Force dynamic fetching to always show the latest products

export default async function ProductsListPage() {
  // Fetch products with their variants to calculate total stock
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Produtos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie o catálogo de produtos, preços e estoque.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Novo Produto
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">inventory_2</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhum produto cadastrado</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Adicione seu primeiro produto para começar a vender online.</p>
            <Link 
              href="/admin/products/new" 
              className="px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-lg font-bold text-sm"
            >
              Começar agora
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Produto</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">SKU</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Categoria</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Estoque</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Preço</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => {
                  const totalStock = product.variants.reduce((acc, variant) => acc + variant.stock, 0);
                  const isLowStock = totalStock > 0 && totalStock <= 5;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-slate-400 text-xl">image</span>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.variants.length} variações</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {product.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${totalStock === 0 ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          <span className={`font-semibold ${totalStock === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                            {totalStock} un
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        R$ {Number(product.basePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ProductRowActions productId={product.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
