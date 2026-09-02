"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { reauthRateLimiter } from "@/lib/rate-limit";
import { generateTotpSecret, otpauthUri, verifyTotpStep } from "@/lib/two-factor/totp";
import { encryptTwoFactorSecret, decryptTwoFactorSecret } from "@/lib/two-factor/secret-crypto";
import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/two-factor/recovery-codes";
import { verifySecondFactor } from "@/lib/two-factor/verify-second-factor";

// De uitgever die authenticator-apps tonen (otpauth-issuer). Merknaam van het platform.
const ISSUER = "Handslag";
const SETUP_PATH = "/account/tweestapsverificatie";

export interface TwoFactorSetup {
  status: "off" | "pending" | "on";
  otpauthUri?: string;
  secret?: string;
}

/**
 * Leest de huidige 2FA-staat van de actor. Server-side waarheid: `twoFactorEnabledAt` gezet → aan;
 * een geheim zonder `enabledAt` → in setup (pending), waarbij we het gedecrypteerde geheim + de
 * otpauth-URI teruggeven zodat de page een QR/handmatige invoer kan tonen; anders uit.
 */
export async function getTwoFactorSetup(): Promise<TwoFactorSetup> {
  const actor = await requireActor();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { email: true, twoFactorSecret: true, twoFactorEnabledAt: true },
  });
  if (!user) return { status: "off" };

  if (user.twoFactorEnabledAt) return { status: "on" };

  if (user.twoFactorSecret) {
    // Defensief: een niet-ontsleutelbaar pending-geheim (bv. na rotatie van de encryptiesleutel) mag
    // de account-pagina niet laten crashen. Behandel het dan als "uit" zodat de gebruiker de
    // instelling opnieuw kan starten met een vers geheim.
    try {
      const secret = decryptTwoFactorSecret(user.twoFactorSecret);
      return {
        status: "pending",
        secret,
        otpauthUri: otpauthUri({ secret, accountName: user.email, issuer: ISSUER }),
      };
    } catch {
      return { status: "off" };
    }
  }

  return { status: "off" };
}

export interface BeginState {
  error?: string;
}

/**
 * Start de 2FA-instelling: genereert een vers geheim en slaat het VERSLEUTELD op met
 * `twoFactorEnabledAt=null` (pending). Weigert als 2FA al aan staat. De page leest daarna via
 * getTwoFactorSetup — deze actie hoeft geen data terug te geven.
 */
export async function beginTwoFactorSetup(
  _prev: BeginState | undefined,
  _formData: FormData,
): Promise<BeginState> {
  const actor = await requireActor();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { twoFactorEnabledAt: true },
  });
  if (!user) return { error: "Account niet gevonden." };
  if (user.twoFactorEnabledAt) {
    return { error: "Tweestapsverificatie staat al aan." };
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: actor.id },
    data: { twoFactorSecret: encryptTwoFactorSecret(secret), twoFactorEnabledAt: null },
  });

  revalidatePath(SETUP_PATH);
  return {};
}

export interface ConfirmState {
  error?: string;
  recoveryCodes?: string[];
}

const confirmSchema = z.object({
  token: z.string().trim().min(1),
});

/**
 * Bevestigt de 2FA-instelling: verifieert de ingevoerde TOTP-code tegen het pending-geheim. Bij een
 * geldige code wordt 2FA geactiveerd (`twoFactorEnabledAt=now`), worden verse herstelcodes gehasht
 * opgeslagen (oude codes eerst verwijderd) en geven we de PLATTE codes één keer terug om te tonen.
 */
export async function confirmTwoFactorSetup(
  _prev: ConfirmState | undefined,
  formData: FormData,
): Promise<ConfirmState> {
  const actor = await requireActor();
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { twoFactorSecret: true, twoFactorEnabledAt: true },
  });
  if (!user) return { error: "Account niet gevonden." };
  if (user.twoFactorEnabledAt || !user.twoFactorSecret) {
    return { error: "Er is geen instelling in behandeling. Start de instelling opnieuw." };
  }

  const parsed = confirmSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return { error: "De code klopt niet of is verlopen." };
  }

  let step: number | null = null;
  try {
    step = verifyTotpStep(decryptTwoFactorSecret(user.twoFactorSecret), parsed.data.token);
  } catch {
    step = null;
  }
  const meta = await requestMeta();
  if (step === null) {
    await audit({
      actorId: actor.id,
      action: "TWO_FACTOR_CHALLENGE_FAILED",
      entityType: "User",
      entityId: actor.id,
      metadata: { context: "setup" },
      ...meta,
    });
    return { error: "De code klopt niet of is verlopen." };
  }

  const codes = generateRecoveryCodes();
  const codeHashes = await Promise.all(codes.map((code) => hashRecoveryCode(code)));

  await prisma.$transaction([
    prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: actor.id } }),
    prisma.twoFactorRecoveryCode.createMany({
      data: codeHashes.map((codeHash) => ({ userId: actor.id, codeHash })),
    }),
    prisma.user.update({
      where: { id: actor.id },
      // De bij de bevestiging verbruikte step meteen vastleggen zodat exact díe code niet binnen zijn
      // ±venster hergebruikt kan worden voor de eerste echte login (replay-preventie, RFC 6238 §5.2).
      data: { twoFactorEnabledAt: new Date(), twoFactorLastUsedStep: step },
    }),
  ]);

  await audit({
    actorId: actor.id,
    action: "TWO_FACTOR_ENABLED",
    entityType: "User",
    entityId: actor.id,
    ...meta,
  });

  revalidatePath(SETUP_PATH);
  return { recoveryCodes: codes };
}

export interface DisableState {
  error?: string;
  done?: boolean;
}

const disableSchema = z.object({
  password: z.string().min(1),
  // Optionele tweede factor bij de aanvraag. Voor een account met 2FA aan (het enige geval waarin
  // uitschakelen betekenis heeft) is een geldige TOTP-code of ongebruikte herstelcode server-side
  // verplicht; het schema houdt 'm optioneel zodat de action zelf de nette foutmelding kan geven.
  token: z.string().trim().optional(),
});

/**
 * Schakelt 2FA uit. Vereist bevestiging via het HUIDIGE wachtwoord (server-side waarheid, bcrypt) ÉN
 * — zolang 2FA aan staat — een geldige tweede factor (TOTP-code of ongebruikte herstelcode). Het
 * verwijderen van de factor verdient een factor-challenge: een uitgelekt/hergebruikt wachtwoord mag
 * de beveiligingslaag niet alléén kunnen strippen (best practice GitHub/Google; OWASP ASVS 2.8). De
 * verificatie loopt via dezelfde replay-veilige poort als de login (`verifySecondFactor`). Bij succes
 * worden het geheim en alle herstelcodes in één transactie verwijderd en wordt de actie geaudit.
 */
export async function disableTwoFactor(
  _prev: DisableState | undefined,
  formData: FormData,
): Promise<DisableState> {
  const actor = await requireActor();
  const parsed = disableSchema.safeParse({
    password: formData.get("password"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { error: "Vul je huidige wachtwoord in." };
  }

  const meta = await requestMeta();

  // Brute-force-rem op de her-authenticatie (CWE-307 / OWASP A07): begrens het aantal disable-pogingen
  // per account. Een aanvaller met een geldige (gestolen) sessie mag noch het huidige wachtwoord noch
  // de 6-cijferige TOTP ongelimiteerd kunnen raden om zo de tweede factor te strippen. Gekeyd op
  // actor.id (de aanvaller bezit de sessie al → IP-rotatie omzeilt de rem niet). Alleen een VOLLEDIG
  // geslaagde uitschakeling reset de teller, zodat ook mislukte factor-pogingen blijven meetellen en
  // de TOTP-ruimte niet ongelimiteerd afgezocht kan worden.
  if (!(await reauthRateLimiter.check(actor.id)).allowed) {
    await audit({
      actorId: actor.id,
      action: "AUTH_RATE_LIMITED",
      entityType: "User",
      entityId: actor.id,
      metadata: { context: "disable-2fa" },
      ...meta,
    });
    return {
      error: "Te veel pogingen. Wacht een paar minuten en probeer het daarna opnieuw.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: {
      id: true,
      passwordHash: true,
      twoFactorEnabledAt: true,
      twoFactorSecret: true,
      twoFactorLastUsedStep: true,
    },
  });
  if (!user) return { error: "Account niet gevonden." };
  if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "Wachtwoord klopt niet." };
  }

  // Tweede-factor-challenge: alleen betekenisvol wanneer 2FA daadwerkelijk aan staat. Zo niet, dan is
  // er niets te strippen en blijft het gedrag onveranderd. Faalt de factor, dan weigeren we vóór enige
  // schrijfactie (de audit-mislukking zit in verifySecondFactor).
  if (
    user.twoFactorEnabledAt &&
    !(await verifySecondFactor(user, parsed.data.token, meta, {
      context: "disable",
    }))
  ) {
    return {
      error:
        "De verificatiecode klopt niet of is verlopen. Vul de actuele code uit je authenticator-app of een ongebruikte herstelcode in.",
    };
  }

  // Volledig geslaagde her-authenticatie (wachtwoord + tweede factor): reset de rem.
  await reauthRateLimiter.reset(actor.id);

  await prisma.$transaction([
    prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: actor.id } }),
    prisma.user.update({
      where: { id: actor.id },
      data: { twoFactorSecret: null, twoFactorEnabledAt: null, twoFactorLastUsedStep: null },
    }),
  ]);

  await audit({
    actorId: actor.id,
    action: "TWO_FACTOR_DISABLED",
    entityType: "User",
    entityId: actor.id,
    ...meta,
  });

  revalidatePath(SETUP_PATH);
  return { done: true };
}
