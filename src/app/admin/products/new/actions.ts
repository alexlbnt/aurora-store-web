"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
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
  if (images.length === 0) {
    images = ["https://d2qs1z4gndokv4.cloudfront.net/Custom/Content/Products/99/65/996545_calcinha-conforto-em-tecido-canelado-sem-costura-my-lady-6229_m5_638519965223030386.jpg"];
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

  const product = await prisma.product.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(7),
      description: description || "",
      basePrice: parseFloat(price),
      categoryId,
      isFeatured: false,
      sku: `AUR-${Math.random().toString(36).substring(7).toUpperCase()}`,
      images: {
        create: images.map((url, i) => ({
          url,
          order: i,
          isDisplay: i === 0
        }))
      },
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
  revalidatePath("/admin/products/new");
  
  return { 
    success: true, 
    productId: product.id 
  };
}
