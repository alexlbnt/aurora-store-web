"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED") {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    revalidatePath(`/admin/sales/${orderId}`);
    revalidatePath("/admin/sales");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao atualizar status do pedido." };
  }
}
