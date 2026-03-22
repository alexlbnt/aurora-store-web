import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/admin/login',
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
          } else if (isLoggedIn) {
             return Response.redirect(new URL('/', nextUrl));
          }
          return true; // Let unauthenticated access the login page
        }

        if (isLoggedIn) {
          if (userRole === 'ADMIN') return true;
          // Logged in but not admin
          return Response.redirect(new URL('/', nextUrl));
        }

        return false; // Redirect unauthenticated users to login page
      } 
      
      if (isOnAccount) {
        if (!isLoggedIn) return false;
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
