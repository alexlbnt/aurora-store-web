"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCustomer(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (!name || !email) {
      return { error: "Nome e e-mail são obrigatórios." };
    }

    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email }
    });

    if (existing) {
      return { error: "Já existe um cliente cadastrado com este e-mail." };
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: phone || null
      }
    });

    revalidatePath("/admin/customers");
    return { success: true, customerId: newCustomer.id };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { error: "Erro interno ao cadastrar cliente." };
  }
}
