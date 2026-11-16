import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  // Sem chave fixa no código: se AUTH_SECRET faltar, o login falha em vez de aceitar sessões forjadas.
  // Gere uma com `npx auth secret` e configure em .env e na Vercel (Settings > Environment Variables).
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/admin/login',
    // Erros na volta do Google (?error=...) aparecem na tela de login da loja.
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = (auth?.user as any)?.role;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAccount = nextUrl.pathname.startsWith('/account');
      
      if (isOnAdmin) {
        if (nextUrl.pathname === '/admin/login') {
          if (isLoggedIn && userRole === 'ADMIN') {
             return Response.redirect(new URL('/admin', nextUrl));
          }
          // Visitante vê o botão do Google; logado sem permissão vê o aviso para trocar de conta.
          return true;
        }

        if (isLoggedIn) {
          if (userRole === 'ADMIN') return true;
          // Logado com uma conta que não é de administrador
          return Response.redirect(new URL('/admin/login', nextUrl));
        }

        return Response.redirect(new URL('/admin/login', nextUrl)); // Redirect unauthenticated users to login page
      } 
      
      if (isOnAccount) {
        if (!isLoggedIn) {
          return Response.redirect(new URL('/login', nextUrl));
        }
        return true;
      }
      
      // Storefront login pages
      if (nextUrl.pathname === '/login' || nextUrl.pathname === '/register') {
         if (isLoggedIn) {
           return Response.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/account', nextUrl));
         }
         return true;
      }

      return true; // Any other route is public
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
