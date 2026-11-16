"use server";

import { signIn, signOut } from "@/auth";

/** Painel: o administrador entra só com o Gmail autorizado (ADMIN_EMAILS). */
export async function signInAdminWithGoogle() {
  await signIn("google", { redirectTo: "/admin" });
}

/** Sai da conta atual para entrar com o Gmail da marca. */
export async function switchAdminAccount() {
  await signOut({ redirectTo: "/admin/login" });
}
