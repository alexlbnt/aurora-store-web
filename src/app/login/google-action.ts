"use server";

import { signIn } from "@/auth";

/** Loja: entra (ou cria a conta) com o Google e volta para a área do cliente. */
export async function signInCustomerWithGoogle() {
  await signIn("google", { redirectTo: "/account" });
}
