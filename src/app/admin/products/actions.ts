"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProduct(productId: string) {
  try {
    // Delete variants associated with the product first (or rely on Cascade if configured)
    await prisma.variant.deleteMany({
      where: { productId }
    });

    // Delete the product itself
    await prisma.product.delete({
      where: { id: productId }
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Falha ao excluir o produto. Tente novamente." };
  }
}

export async function editProduct(productId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const stockA = formData.get("stockA") as string;
  const stockV = formData.get("stockV") as string;
  let categoryId = formData.get("categoryId") as string;
  const newCategoryName = formData.get("newCategoryName") as string;

  if (categoryId === "NEW" && newCategoryName) {
    const existingCat = await prisma.category.findFirst({
      where: {
        name: {
          equals: newCategoryName,
          mode: 'insensitive'
        }
      }
    });

    if (existingCat) {
      categoryId = existingCat.id;
    } else {
      let slugBase = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slugBase) slugBase = 'categoria';
      let uniqueSlug = slugBase;
      let counter = 1;
      while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slugBase}-${counter}`;
        counter++;
      }
      const newCat = await prisma.category.create({
        data: {
          name: newCategoryName,
          slug: uniqueSlug
        }
      });
      categoryId = newCat.id;
    }
  }
  const imagesRaw = formData.get("images") as string;
  
  let images: string[] = [];
  if (imagesRaw) {
    try { images = JSON.parse(imagesRaw); } catch(e) {}
  }
  
  const hasVariants = formData.get("hasVariants") === "true";
  const variantsMatrixRaw = formData.get("variantsMatrix") as string;
  
  let variantsMatrix: any[] = [];
  if (hasVariants && variantsMatrixRaw) {
    variantsMatrix = JSON.parse(variantsMatrixRaw);
  } else {
    variantsMatrix = [{ 
      size: 'Único', 
      color: 'Padrão', 
      sku: `AUR-${Math.random().toString(36).substring(7).toUpperCase()}`, 
      price: parseFloat(price), 
      stockA: parseInt(stockA, 10) || 0,
      stockV: parseInt(stockV, 10) || 0
    }];
  }

  if (!name || !price || !categoryId) {
    return { success: false, error: "Campos obrigatórios ausentes." };
  }

  try {
    // 1. Delete old variants to simply recreate them, or update them.
    // Easiest is to delete and recreate due to complex changing rules for variants.
    await prisma.variant.deleteMany({
      where: { productId }
    });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || "",
        basePrice: parseFloat(price),
        categoryId,
        ...(images.length > 0 && { 
          images: {
            deleteMany: {},
            create: images.map((url, i) => ({
              url,
              order: i,
              isDisplay: i === 0
            }))
          } 
        }),
        variants: {
          create: variantsMatrix.map((v: any) => ({
            sku: v.sku || `AUR-${v.size}-${v.color}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            price: v.price ? parseFloat(v.price) : parseFloat(price),
            stockA: parseInt(v.stockA, 10) || 0,
            stockV: parseInt(v.stockV, 10) || 0,
            color: v.color,
            size: v.size
          }))
        }
      }
    });

    revalidatePath("/admin/products");
    return { success: true, productId: product.id };
  } catch (error: any) {
    console.error("Failed to edit product:", error);
    return { success: false, error: "Falha ao editar produto: " + (error?.message || String(error)) };
  }
}

export async function quickUpdateCategory(id: string, newName: string) {
  if (!newName) return { error: "Nome não pode estar vazio." };
  try {
    const existingCat = await prisma.category.findFirst({
      where: {
        name: { equals: newName, mode: 'insensitive' }
      }
    });
    if (existingCat && existingCat.id !== id) {
      return { error: "Já existe uma categoria com este nome." };
    }
    
    let slugBase = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slugBase) slugBase = 'categoria';
    let uniqueSlug = slugBase;
    let counter = 1;
    while (true) {
      const collision = await prisma.category.findUnique({ where: { slug: uniqueSlug } });
      if (!collision || collision.id === id) break;
      uniqueSlug = `${slugBase}-${counter}`;
      counter++;
    }

    await prisma.category.update({
      where: { id },
      data: { name: newName, slug: uniqueSlug }
    });
    revalidatePath("/admin/products/new");
    revalidatePath("/admin/products/[id]"); 
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar categoria." };
  }
}

export async function quickDeleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/products/new");
    revalidatePath("/admin/products/[id]");
    return { success: true };
  } catch (error) {
    return { error: "Não foi possível excluir a categoria, pois ela possui produtos vinculados." };
  }
}

