import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";
import { isAdminEmail, isVerifiedGoogleProfile, parseAdminEmails } from "@/lib/admin-access";
import { authConfig } from "./auth.config";

const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Lê AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET do ambiente.
    Google,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.password) return null;
        // Administrador entra só pelo Google: senha vazada não abre o painel.
        if (user.role === "ADMIN") return null;

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn({ account, profile }) {
      if (account?.provider === "google") return isVerifiedGoogleProfile(profile);
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        // Primeiro login com Google: cria (ou reaproveita) o usuário pelo e-mail.
        // O papel de administrador vem só da lista ADMIN_EMAILS.
        const email = token.email.toLowerCase();
        const admin = isAdminEmail(email, adminEmails);
        const existing = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });
        const dbUser = existing
          ? admin && existing.role !== "ADMIN"
            ? await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } })
            : existing
          : await prisma.user.create({
              data: { email, name: token.name ?? null, role: admin ? "ADMIN" : "USER" },
            });

        token.sub = dbUser.id;
        token.email = dbUser.email;
        token.role = admin ? "ADMIN" : "USER";
        return token;
      }
      if (user) token.role = user.role;
      return token;
    },
  },
});
