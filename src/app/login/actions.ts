"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticateCustomer(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: "/account"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "E-mail ou senha incorretos.";
        default:
          return "Ocorreu um erro ao fazer login.";
      }
    }
    throw error;
  }
}
