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
  
  const hasVariants = formData.get("hasVariants") === "true";
  const sizesRaw = formData.get("sizes") as string;
  const colorsRaw = formData.get("colors") as string;
  
  const sizes = JSON.parse(sizesRaw) as string[];
  const colors = JSON.parse(colorsRaw) as string[];

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
        variants: {
          create: sizes.flatMap(size => 
            colors.map(color => ({
              sku: `AUR-${size}-${color}-${Math.random().toString(36).substring(7).toUpperCase()}`,
              price: parseFloat(price),
              stock: Math.floor((parseInt(stock, 10) || 0) / (sizes.length * colors.length)) || 0,
              color,
              size
            }))
          )
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

