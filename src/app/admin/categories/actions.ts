"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !slug) return { error: "Nome e Slug são obrigatórios." };

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return { error: "Slug já está em uso." };

    await prisma.category.create({
      data: { name, slug, description },
    });
  } catch (error) {
    return { error: "Erro ao criar categoria." };
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;

  if (!name || !slug) return { error: "Nome e Slug são obrigatórios." };

  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing && existing.id !== id) return { error: "Slug já está em uso." };

    await prisma.category.update({
      where: { id },
      data: { name, slug, description },
    });
  } catch (error) {
    return { error: "Erro ao atualizar categoria." };
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
    return { error: "Erro ao excluir categoria. Pode haver produtos vinculados a ela." };
  }
}
