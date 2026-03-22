"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt-ts";
import { redirect } from "next/navigation";

export async function registerCustomer(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = formData.get("phone") as string;

  if (!name || !email || !password) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Este e-mail já está cadastrado." };
    }

    const hashedPassword = await hash(password, 10);

    // Create User (for auth) and Customer (for orders)
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER"
        }
      });

      // Customer may already exist if they bought as guest, check first
      const existingCustomer = await tx.customer.findUnique({ where: { email } });
      if (!existingCustomer) {
        await tx.customer.create({
          data: {
            name,
            email,
            phone: phone || null
          }
        });
      } else if (phone && !existingCustomer.phone) {
         await tx.customer.update({
           where: { email },
           data: { phone }
         });
      }
    });
  } catch (error) {
    console.error(error);
    return { error: "Ocorreu um erro ao criar a conta." };
  }

  redirect("/login?registered=1");
}
