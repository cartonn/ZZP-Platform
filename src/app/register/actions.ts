"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

export type RegisterState =
  | { error?: string; fieldErrors?: Record<string, string> }
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
    if (error instanceof AuthError) {
      return { error: "Account aangemaakt. Log in om verder te gaan." };
    }
    throw error;
  }
  return undefined;
}
