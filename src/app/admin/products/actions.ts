"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { handleDatabaseError } from "@/lib/error-handler";
import { adminGuard, requireAdmin } from "@/lib/require-admin";
import { productPath } from "@/lib/slug";
import { toStock, type VariantMatrixRow } from "@/lib/product-input";

/** Mostra ou esconde o produto da vitrine. Ele continua no painel, nos pedidos e no estoque. */
export async function setProductVisibility(productId: string, visible: boolean) {
  try {
    await requireAdmin();
    const product = await prisma.product.update({
      where: { id: productId },
      data: { visible },
      select: { id: true, slug: true },
    });
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/category/[slug]", "page");
    revalidatePath(productPath(product));
    revalidatePath("/admin/products");
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: handleDatabaseError(error, "Não foi possível mudar a visibilidade do produto.") };
  }
}

export async function deleteProduct(productId: string) {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    // Check if product is part of any order
    const orderItemsCount = await prisma.orderItem.count({
      where: { productId }
    });

    if (orderItemsCount > 0) {
      return {
        success: false,
        error: "Este produto não pode ser excluído pois possui pedidos e histórico de vendas registrados. Para tirá-lo da vitrine, use \"Ocultar da loja\" no menu do produto."
      };
    }

    // Delete variants associated with the product first (or rely on Cascade if configured)
    await prisma.variant.deleteMany({
      where: { productId }
    });

    // Delete images
    await prisma.productImage.deleteMany({
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
    return { success: false, error: handleDatabaseError(error, "Falha ao excluir o produto.") };
  }
}

export async function editProduct(productId: string, formData: FormData) {
  const denied = await adminGuard();
  if (denied) return denied;
  const name = ((formData.get("name") as string) || "").trim();
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
    try { images = JSON.parse(imagesRaw); } catch {}
  }
  
  const hasVariants = formData.get("hasVariants") === "true";
  const variantsMatrixRaw = formData.get("variantsMatrix") as string;
  
  const detailsRaw = formData.get("details") as string;
  let details: string[] = [];
  if (detailsRaw) {
    try { details = JSON.parse(detailsRaw); } catch {}
  }
  
  let variantsMatrix: VariantMatrixRow[] = [];
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
    const product = await prisma.$transaction(async (tx) => {
      // Variações são atualizadas no lugar (mesma cor + tamanho = mesma variação). Antes eram apagadas
      // e recriadas a cada edição, o que levava junto a produção lançada e deixava os pedidos antigos
      // apontando para variações que não existiam mais. Só sai a variação que saiu da grade.
      const existing = await tx.variant.findMany({ where: { productId }, select: { id: true, color: true, size: true } });
      const key = (color: string, size: string) => `${color}\u0000${size}`;
      const byKey = new Map(existing.map((v) => [key(v.color, v.size), v.id]));
      const kept = new Set<string>();

      for (const v of variantsMatrix) {
        const data = {
          price: v.price ? parseFloat(String(v.price)) : parseFloat(price),
          stockA: toStock(v.stockA),
          stockV: toStock(v.stockV),
        };
        const id = byKey.get(key(v.color, v.size));
        if (id) {
          kept.add(id);
          await tx.variant.update({ where: { id }, data: { ...data, ...(v.sku ? { sku: v.sku } : {}) } });
        } else {
          await tx.variant.create({
            data: {
              ...data,
              productId,
              color: v.color,
              size: v.size,
              sku: v.sku || `AUR-${v.size}-${v.color}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            },
          });
        }
      }
      const removed = existing.filter((v) => !kept.has(v.id)).map((v) => v.id);
      if (removed.length > 0) await tx.variant.deleteMany({ where: { id: { in: removed } } });

      return tx.product.update({
        where: { id: productId },
        data: {
          name,
          description: description || "",
          basePrice: parseFloat(price),
          categoryId,
          details,
          images: {
            deleteMany: {},
            create: images.map((url, i) => ({
              url,
              order: i,
              isDisplay: i === 0
            }))
          },
        }
      });
    });

    revalidatePath("/admin/products");
    return { success: true, productId: product.id };
  } catch (error) {
    console.error("Failed to edit product:", error);
    return { success: false, error: handleDatabaseError(error, "Falha ao editar produto.") };
  }
}

export async function quickUpdateCategory(id: string, newName: string) {
  const denied = await adminGuard();
  if (denied) return denied;
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
    return { error: handleDatabaseError(error, "Não foi possível atualizar o nome da categoria. Tente novamente.") };
  }
}

export async function quickDeleteCategory(id: string) {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/products/new");
    revalidatePath("/admin/products/[id]");
    return { success: true };
  } catch (error) {
    return { error: handleDatabaseError(error, "Não é possível excluir esta categoria porque ainda existem produtos usando ela. Remova os produtos primeiro.") };
  }
}

export async function getProductVariants(productId: string) {
  const denied = await adminGuard();
  if (denied) return { error: denied.error };
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
          select: {
            id: true,
            size: true,
            color: true,
            stockA: true,
            stockV: true,
          },
        },
      },
    });
    return { product };
  } catch (error) {
    console.error("Error getting product variants:", error);
    return { error: handleDatabaseError(error, "Não foi possível carregar as variações de cores e tamanhos deste produto.") };
  }
}

export async function quickUpdateProductVariantStock(
  variantId: string,
  stockA: number,
  stockV: number
) {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    await prisma.variant.update({
      where: { id: variantId },
      data: {
        stockA: Math.max(0, Math.floor(stockA)),
        stockV: Math.max(0, Math.floor(stockV)),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/sales/new");
    return { success: true };
  } catch (error) {
    console.error("Error updating variant stock:", error);
    return { error: "Erro ao atualizar estoque da variação." };
  }
}


