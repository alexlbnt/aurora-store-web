"use server";

import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true }
  });
}
