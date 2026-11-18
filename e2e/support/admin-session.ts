import { encode } from "next-auth/jwt";
import type { BrowserContext } from "@playwright/test";

// O painel só aceita login com Google, que um teste automático não consegue fazer.
// Em vez disso, o teste monta a mesma sessão que o NextAuth criaria (assinada com o AUTH_SECRET
// do .env local) para um administrador de teste que existe só durante a execução.
const COOKIE_NAME = "authjs.session-token"; // nome usado em http://localhost

export async function signInAsAdmin(
  context: BrowserContext,
  baseURL: string,
  admin: { id: string; email: string; name: string },
): Promise<void> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não está no .env: não dá para montar a sessão do painel.");
  const token = await encode({
    secret,
    salt: COOKIE_NAME,
    maxAge: 60 * 30,
    token: { sub: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
  });
  const { hostname } = new URL(baseURL);
  await context.addCookies([
    { name: COOKIE_NAME, value: token, domain: hostname, path: "/", httpOnly: true, sameSite: "Lax", secure: false },
  ]);
}
