"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { requestMeta } from "@/lib/request-meta";
import { registerRateLimiter } from "@/lib/rate-limit";
import { bureauRegisterSchema, registerSchema } from "@/lib/validation";
import { createTenantWithOwner } from "@/lib/franchise/create-tenant";
import {
  getPasswordBreachChecker,
  BREACHED_PASSWORD_MESSAGE,
} from "@/lib/services/password-breach";
import { TIMING_EQUALIZER_HASH } from "@/lib/authorize-credentials";

export type RegisterState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * Begrens massale account-aanmaak per IP (server-side waarheid). Bij overschrijding weigeren +
 * auditregel; geen enumeratie-informatie in de respons. Geldt voor élke registratievorm.
 */
async function rateLimitBlocked(email: string): Promise<RegisterState | null> {
  const meta = await requestMeta();
  const limitKey = meta.ipAddress ?? "unknown";
  if ((await registerRateLimiter.check(limitKey)).allowed) return null;
  await audit({
    action: "REGISTER_RATE_LIMITED",
    entityType: "User",
    entityId: "unknown",
    metadata: { email },
    ...meta,
  });
  return { error: "Te veel registratiepogingen. Probeer het later opnieuw." };
}

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  // Bemiddelingsbureau: eigen schema + eigen flow (tenant op PENDING, geen auto-login).
  if (formData.get("role") === "FRANCHISER") return registerBureau(formData);

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

  const limited = await rateLimitBlocked(email);
  if (limited) return limited;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Timing-egalisatie (CWE-208): het "nieuw account"-pad hieronder draait `bcrypt.hash(..., 10)`
    // (~90 ms). Zonder dezelfde bcrypt-kost op de vroege return zou een bestaand e-mailadres
    // meetbaar sneller antwoorden en enumereerbaar worden. Zie het equalizer-patroon in
    // `src/lib/authorize-credentials.ts`. Het resultaat wordt bewust genegeerd — enkel de
    // rekentijd telt. NB: de expliciete oracle-veldfout hieronder blijft bewust staan als
    // UX-affordance en moet met de opdrachtgever besproken worden (login/reset-flow zonder
    // werkende mail is nu problematisch); staat op de backlog. Deze PR dicht enkel het timing-lek.
    await bcrypt.compare(password, TIMING_EQUALIZER_HASH);
    return { fieldErrors: { email: "Er bestaat al een account met dit e-mailadres." } };
  }

  // Gelekt-wachtwoord-controle (NIST 800-63B). Inert tenzij PASSWORD_BREACH_CHECK=hibp; fail-open bij
  // een storing (check.skipped) zodat registratie nooit door een externe blip wordt geblokkeerd.
  if ((await getPasswordBreachChecker().check(password)).breached) {
    return { fieldErrors: { password: BREACHED_PASSWORD_MESSAGE } };
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

const BUREAU_SUBMITTED =
  "Aanmelding ontvangen. We beoordelen je bureau en nemen binnen 2 werkdagen contact met je op.";

/**
 * Zelfaanmelding van een bemiddelingsbureau. Volgt dezelfde keten als de gewone registratie
 * (Zod → rate-limit → dubbele-account-check → gelekt-wachtwoord → aanmaken → audit), met drie
 * verschillen:
 *  - de tenant start op PENDING, dus de bemiddelaar heeft nog GEEN toegang tot de werkplek
 *    (fail-closed via tenantAccessBlocked in authz.ts) en ziet na inloggen de wachtpagina;
 *  - er is geen auto-login: de bevestiging is de succesmelding op het formulier;
 *  - het KvK-nummer is uniek, zodat hetzelfde bureau zich niet twee keer aanmeldt.
 * Bij een al bestaand e-mailadres of KvK-nummer geven we exact dezelfde generieke bevestiging
 * terug (geen enumeratie van bestaande bureaus/accounts).
 */
async function registerBureau(formData: FormData): Promise<RegisterState> {
  const parsed = bureauRegisterSchema.safeParse({
    bureauName: formData.get("bureauName"),
    kvkNumber: formData.get("kvkNumber"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    region: formData.get("region") || undefined,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) {
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors };
  }
  const { bureauName, kvkNumber, name, email, password, phone, region } = parsed.data;

  const limited = await rateLimitBlocked(email);
  if (limited) return limited;

  if ((await getPasswordBreachChecker().check(password)).breached) {
    return { fieldErrors: { password: BREACHED_PASSWORD_MESSAGE } };
  }

  // Bestaat het e-mailadres of KvK-nummer al? Dan stil stoppen met dezelfde bevestiging — één
  // aanmelding per bureau, en geen signaal of dit account/bureau al bekend is.
  const [existingUser, existingTenant] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.tenant.findUnique({ where: { kvkNumber }, select: { id: true } }),
  ]);
  if (existingUser || existingTenant) {
    // Timing-egalisatie (CWE-208): zonder deze compare zou de vroege return meetbaar sneller
    // zijn dan het "nieuwe tenant"-pad (dat `bcrypt.hash(..., 10)` draait) en zo verklappen
    // dat het e-mailadres/KvK-nummer al bekend is — enumeratie van bureaus in het
    // trust-dossier. Zelfde patroon als `src/lib/authorize-credentials.ts`. Het resultaat
    // wordt bewust genegeerd; enkel de rekentijd telt.
    await bcrypt.compare(password, TIMING_EQUALIZER_HASH);
    return { success: BUREAU_SUBMITTED };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const meta = await requestMeta();
  try {
    await createTenantWithOwner({
      tenantName: bureauName,
      ownerName: name,
      ownerEmail: email,
      passwordHash,
      status: "PENDING",
      kvkNumber,
      region: region ?? null,
      contactPhone: phone ?? null,
      auditAction: "FRANCHISE_SELF_REGISTERED",
      auditMetadata: { kvkNumber },
      ...meta,
    });
  } catch (error) {
    // Twee gelijktijdige aanmeldingen met hetzelfde e-mailadres of KvK-nummer: de unieke index in
    // de database is de laatste waarheid. De verliezer krijgt dezelfde generieke bevestiging als
    // de check hierboven — geen 500, en nog steeds geen enumeratie.
    if (isUniqueConstraintError(error)) return { success: BUREAU_SUBMITTED };
    throw error;
  }

  return { success: BUREAU_SUBMITTED };
}

/** Prisma P2002 = unieke constraint geschonden. Los gehouden zodat de check leesbaar blijft. */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002"
  );
}
