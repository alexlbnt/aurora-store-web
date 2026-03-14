"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
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

  const product = await prisma.product.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(7),
      description: description || "",
      basePrice: parseFloat(price),
      categoryId,
      isFeatured: false,
      sku: `AUR-${Math.random().toString(36).substring(7).toUpperCase()}`, // Generate random SKU for demo
      variants: {
        create: sizes.flatMap(size => 
          colors.map(color => ({
            sku: `AUR-${size}-${color}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            price: parseFloat(price),
            stock: Math.floor((parseInt(stock, 10) || 0) / (sizes.length * colors.length)) || 0, // Distribute stock evenly for demo
            color,
            size
          }))
        )
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  
  return { 
    success: true, 
    productId: product.id 
  };
}
