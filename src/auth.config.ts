import type { NextAuthConfig } from "next-auth";
import { type UserRole } from "@/lib/enums";

// Edge-veilige config (geen Prisma/bcrypt): gedeeld door middleware én de volledige
// Auth.js-config in src/auth.ts. De Credentials-provider wordt daar toegevoegd.
export const authConfig = {
  pages: { signIn: "/login" },
  // Kortere sessieduur dan de Auth.js-default (30 dagen): defense-in-depth bovenop de live
  // DB-revalidatie in currentActor(). updateAge verlengt een actieve sessie stilzwijgend.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  // Secure cookies in productie (https); Auth.js zet dan de __Secure-/__Host-prefix + secure-flag.
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.status = user.status;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      // Na een geslaagde wachtwoordwijziging vraagt de client een session-update aan; dan vervalt
      // de geforceerde wijziging (anders blijft de JWT stale tot de volgende login).
      if (
        trigger === "update" &&
        (session as { mustChangePassword?: boolean } | null)?.mustChangePassword === false
      ) {
        token.mustChangePassword = false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as string;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
