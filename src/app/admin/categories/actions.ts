"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { handleDatabaseError } from "@/lib/error-handler";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !slug) return { error: "O nome e o identificador (link) da categoria são obrigatórios." };

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return { error: "O identificador (link) desta categoria já está sendo usado. Cada categoria precisa ter um identificador único." };

    await prisma.category.create({
      data: { name, slug, description },
    });
  } catch (error) {
    return { error: handleDatabaseError(error, "Não foi possível criar a categoria. Tente novamente.") };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !slug) return { error: "O nome e o identificador (link) da categoria são obrigatórios." };

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing && existing.id !== id) return { error: "O identificador (link) desta categoria já está sendo usado. Cada categoria precisa ter um identificador único." };

    await prisma.category.update({
      where: { id },
      data: { name, slug, description },
    });
  } catch (error) {
    return { error: handleDatabaseError(error, "Não foi possível atualizar a categoria. Tente novamente.") };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    return { error: "Não é possível excluir esta categoria porque ainda existem produtos vinculados a ela. Remova os produtos da categoria primeiro." };
  }
}
