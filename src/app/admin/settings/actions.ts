"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcrypt-ts";
import { revalidatePath } from "next/cache";

export async function updateAdminProfile(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || (session.user as any)?.role !== "ADMIN") {
    return { error: "Não autorizado." };
  }

  const name = (formData.get("name") as string)?.trim();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name) {
    return { error: "O nome do administrador é obrigatório." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { error: "Usuário administrador não encontrado." };
    }

    // Se forneceu nova senha, validar
    let updatedPassword = user.password;
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return { error: "Informe sua senha atual para definir uma nova senha." };
      }
      if (!user.password) {
        return { error: "Senha não cadastrada." };
      }
      const isCurrentValid = await compare(currentPassword, user.password);
      if (!isCurrentValid) {
        return { error: "A senha atual informada está incorreta." };
      }
      if (newPassword.length < 6) {
        return { error: "A nova senha deve ter no mínimo 6 caracteres." };
      }
      if (newPassword !== confirmPassword) {
        return { error: "A confirmação da nova senha não confere." };
      }
      updatedPassword = await hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        password: updatedPassword,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: "Configurações e credenciais salvas com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao atualizar configurações de admin:", error);
    return { error: "Falha ao salvar alterações. Tente novamente." };
  }
}
