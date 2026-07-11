import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { authorizeCredentials } from "@/lib/authorize-credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    signIn: async ({ user }) => {
      if (!user?.id) return;
      const meta = await requestMeta();
      // Eén schuif per geslaagde login (Node-runtime): lastLoginAt voedt het recency-signaal voor
      // inzetbaarheid; de vorige waarde schuift naar previousLoginAt en begrenst het
      // "terwijl je weg was"-venster in het notificatiecentrum.
      const prev = await prisma.user.findUnique({
        where: { id: user.id },
        select: { lastLoginAt: true },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { previousLoginAt: prev?.lastLoginAt ?? null, lastLoginAt: new Date() },
      });
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
      authorize: (raw) => authorizeCredentials(raw as Record<string, unknown> | undefined),
    }),
  ],
});
