import AdminLayout from "@/components/admin/AdminLayout";
import CategoryForm from "@/components/admin/categories/CategoryForm";
import Link from "next/link";

export default function NewCategoryPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/admin/categories" className="text-sm text-primary hover:underline flex items-center gap-1 mb-4 w-max">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Voltar para categorias
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nova Categoria</h1>
        <p className="text-slate-500 text-sm mt-1">Preencha os dados abaixo para criar uma nova categoria.</p>
      </div>

      <CategoryForm />
    </AdminLayout>
  );
}
