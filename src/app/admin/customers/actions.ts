"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const socialMedia = formData.get("socialMedia") as string;

    if (!name || !phone) {
      return { error: "Nome e telefone são obrigatórios." };
    }

    const emailValue = email ? email : null;

    if (emailValue) {
      const existing = await prisma.customer.findUnique({
        where: { email: emailValue }
      });

      if (existing) {
        return { error: "Já existe um cliente cadastrado com este e-mail." };
      }
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email: emailValue,
        phone,
        socialMedia: socialMedia || null
      }
    });

    revalidatePath("/admin/customers");
    return { success: true, customerId: newCustomer.id };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { error: "Erro interno ao cadastrar cliente." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const socialMedia = formData.get("socialMedia") as string;

    if (!name || !phone) {
      return { error: "Nome e telefone são obrigatórios." };
    }

    const emailValue = email ? email : null;

    if (emailValue) {
      const existing = await prisma.customer.findUnique({
        where: { email: emailValue }
      });

      if (existing && existing.id !== id) {
        return { error: "Já existe outro cliente cadastrado com este e-mail." };
      }
    }

    await prisma.customer.update({
      where: { id },
      data: {
        name,
        email: emailValue,
        phone,
        socialMedia: socialMedia || null
      }
    });

    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { error: "Erro interno ao atualizar cliente." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    // Check if customer has orders
    const orders = await prisma.order.count({ where: { customerId: id } });
    if (orders > 0) {
      return { error: "Não é possível excluir um cliente que possui pedidos cadastrados." };
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { error: "Erro interno ao excluir cliente." };
  }
}
