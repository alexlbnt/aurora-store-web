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
  const stock = formData.get("stock") as string;
  const categoryId = formData.get("categoryId") as string;
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
      stock: parseInt(stock, 10) || 0 
    }];
  }

  if (!name || !price || !categoryId) {
    throw new Error("Missing required fields");
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
            stock: parseInt(v.stock, 10) || 0,
            color: v.color,
            size: v.size
          }))
        }
      }
    });

    revalidatePath("/admin/products");
    return { success: true, productId: product.id };
  } catch (error) {
    console.error("Failed to edit product:", error);
    throw new Error("Failed to edit product");
  }
}

