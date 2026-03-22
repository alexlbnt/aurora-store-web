import AdminLayout from "@/components/admin/AdminLayout";
import CategoryForm from "@/components/admin/categories/CategoryForm";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  // Await params objects in nextjs 15
  const param = await params;
  
  const category = await prisma.category.findUnique({
    where: { id: param.id }
  });

  if (!category) {
    notFound();
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <Link href="/admin/categories" className="text-sm text-primary hover:underline flex items-center gap-1 mb-4 w-max">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Voltar para categorias
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Categoria</h1>
        <p className="text-slate-500 text-sm mt-1">Altere as informações desta categoria.</p>
      </div>

      <CategoryForm initialData={category} />
    </AdminLayout>
  );
}
