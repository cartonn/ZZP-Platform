"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requestMeta } from "@/lib/request-meta";
import { registerRateLimiter } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export type RegisterState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyName: formData.get("companyName") || undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) {
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }

  const { name, email, password, role, companyName } = parsed.data;

  // Begrens massale account-aanmaak per IP (server-side waarheid). Bij overschrijding
  // weigeren + auditregel; geen enumeratie-informatie in de respons.
  const meta = await requestMeta();
  const limitKey = meta.ipAddress ?? "unknown";
  if (!(await registerRateLimiter.check(limitKey)).allowed) {
    await audit({
      action: "REGISTER_RATE_LIMITED",
      entityType: "User",
      entityId: "unknown",
      metadata: { email },
      ...meta,
    });
    return { error: "Te veel registratiepogingen. Probeer het later opnieuw." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Er bestaat al een account met dit e-mailadres." } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status: "ACTIVE",
      ...(role === "FREELANCER"
        ? { freelancerProfile: { create: {} } }
        : { company: { create: { name: companyName! } } }),
    },
  });

  await audit({
    actorId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    metadata: { role },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    // signIn gooit bij succes een NEXT_REDIRECT die we MOETEN doorlaten.
    // Komen we hier met een AuthError, dan is het account wél aangemaakt maar lukte de
    // auto-login niet — dat is een succesmelding (groen), geen fout (rood).
    if (error instanceof AuthError) {
      return { success: "Account aangemaakt. Log in om verder te gaan." };
    }
    throw error;
  }
  return undefined;
}
