"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCustomerProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Não autorizado. Faça login novamente." };
  }

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const cep = formData.get("cep") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;

  if (!name || !phone) {
    return { error: "Nome e telefone são obrigatórios." };
  }

  try {
    const email = session.user.email;

    await prisma.$transaction(async (tx) => {
      await tx.customer.upsert({
        where: { email },
        update: {
          name,
          phone,
          address: address || null,
          cep: cep || null,
          city: city || null,
          state: state || null,
        },
        create: {
          name,
          email,
          phone,
          address: address || null,
          cep: cep || null,
          city: city || null,
          state: state || null,
        },
      });

      await tx.user.updateMany({
        where: { email },
        data: { name },
      });
    });

    revalidatePath("/account");
    revalidatePath("/account/settings");
    return { success: "Dados atualizados com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao atualizar dados:", error);
    return { error: "Falha ao atualizar dados. Tente novamente." };
  }
}
