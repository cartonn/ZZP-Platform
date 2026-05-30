import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { type UserRole } from "@/lib/enums";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    signIn: async ({ user }) => {
      if (!user?.id) return;
      const meta = await requestMeta();
      await audit({ actorId: user.id, action: "USER_LOGIN", entityType: "User", entityId: user.id, ...meta });
    },
    signOut: async (message) => {
      const token = "token" in message ? message.token : null;
      const userId = token?.id as string | undefined;
      if (!userId) return;
      const meta = await requestMeta();
      await audit({ actorId: userId, action: "USER_LOGOUT", entityType: "User", entityId: userId, ...meta });
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
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE" || !(await bcrypt.compare(password, user.passwordHash))) {
          const meta = await requestMeta();
          await audit({ action: "USER_LOGIN_FAILED", entityType: "User", entityId: user?.id ?? "unknown", metadata: { email }, ...meta });
          return null;
        }

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
