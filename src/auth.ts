import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { loginRateLimiter } from "@/lib/rate-limit";
import { type UserRole } from "@/lib/enums";

const credentialsSchema = z.object({
  // Registratie slaat e-mail genormaliseerd (trim + lowercase) op; de login-lookup MOET hetzelfde
  // normaliseren, anders matcht 'Jan@Bedrijf.nl' het opgeslagen 'jan@bedrijf.nl' niet op een
  // hoofdlettergevoelige unieke kolom (PostgreSQL) → onterechte buitensluiting.
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    signIn: async ({ user }) => {
      if (!user?.id) return;
      const meta = await requestMeta();
      // Eén write per geslaagde login (Node-runtime): voedt het recency-signaal voor inzetbaarheid.
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await audit({
        actorId: user.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: user.id,
        ...meta,
      });
    },
    signOut: async (message) => {
      const token = "token" in message ? message.token : null;
      const userId = token?.id as string | undefined;
      if (!userId) return;
      const meta = await requestMeta();
      await audit({
        actorId: userId,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: userId,
        ...meta,
      });
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const meta = await requestMeta();

        // Brute-force-bescherming: begrens inlogpogingen per IP + e-mail. De server
        // beslist; bij overschrijding wordt de poging geweigerd en geaudit. E-mail
        // genormaliseerd zodat hoofdletter-varianten niet om de limiet heen kunnen.
        const limitKey = `${meta.ipAddress ?? "unknown"}:${email.toLowerCase()}`;
        if (!loginRateLimiter.check(limitKey).allowed) {
          await audit({
            action: "AUTH_RATE_LIMITED",
            entityType: "User",
            entityId: "unknown",
            metadata: { email },
            ...meta,
          });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (
          !user ||
          user.status !== "ACTIVE" ||
          !(await bcrypt.compare(password, user.passwordHash))
        ) {
          await audit({
            action: "USER_LOGIN_FAILED",
            entityType: "User",
            entityId: user?.id ?? "unknown",
            metadata: { email },
            ...meta,
          });
          return null;
        }

        // Geslaagde login: reset de teller zodat een legitieme gebruiker na eerdere
        // misfires niet onnodig wordt geblokkeerd.
        loginRateLimiter.reset(limitKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
