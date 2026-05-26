import type { NextAuthConfig } from "next-auth";
import { type UserRole } from "@/lib/enums";

// Edge-veilige config (geen Prisma/bcrypt): gedeeld door middleware én de volledige
// Auth.js-config in src/auth.ts. De Credentials-provider wordt daar toegevoegd.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/zzp/") ||
        pathname.startsWith("/api/auth");
      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
