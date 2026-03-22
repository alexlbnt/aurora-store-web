import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import CategoryRowActions from "./CategoryRowActions";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; // Force dynamic fetching

export default async function CategoriesListPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categorias</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie as categorias de produtos da sua loja.</p>
        </div>
        <Link 
          href="/admin/categories/new" 
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nova Categoria
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-slate-400">category</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nenhuma categoria cadastrada</h3>
            <p className="text-slate-500 mb-6 max-w-sm">Crie categorias para organizar seus produtos na loja.</p>
            <Link 
              href="/admin/categories/new" 
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
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Nome</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Slug</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Produtos</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{category.name}</div>
                      {category.description && (
                         <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{category.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{category.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {category._count.products} produtos
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CategoryRowActions categoryId={category.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
