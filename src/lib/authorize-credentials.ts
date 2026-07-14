// Credentials-verificatie voor de login. Bewust los van `src/auth.ts` (dat op module-load
// `NextAuth(...)` initialiseert en `next/server` intrekt) zodat de mutatieketen — incl. de
// onderhouds-afsluitingspoort en de rate-limiter — direct unit-testbaar is zonder de hele
// Auth.js-runtime te laden.

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requestMeta } from "@/lib/request-meta";
import { loginRateLimiter } from "@/lib/rate-limit";
import { loginBlockedByMaintenance } from "@/lib/maintenance";
import { type UserRole } from "@/lib/enums";

// Geldige cost-10-bcrypt-hash van een constante — nooit een echt wachtwoord. Dient als vergelijkings-
// doel wanneer er géén bruikbare gebruiker is (onbekende e-mail, niet-ACTIVE, of na anonimisering een
// lege passwordHash), zodat élke mislukte login evenveel bcrypt-rekentijd kost als een fout wachtwoord
// op een bestaand ACTIVE-account. Zonder dit short-circuit `bcrypt.compare` weg bij een onbekend
// account → dat logt meetbaar sneller in en verraadt via de responstijd of een e-mail bestaat
// (CWE-208 timing-side-channel → gebruikers-/e-mail-enumeratie, OWASP A07). Cost 10 = gelijk aan de
// registratie-hash (`bcrypt.hash(..., 10)`), zodat de rekentijd overeenkomt.
const TIMING_EQUALIZER_HASH = "$2a$10$WXJahW.hkelHJbQ3heO7Ve7udQ0dZ/.iVzUpX1JT7MQZIoCfWI6TC";

const credentialsSchema = z.object({
  // Registratie slaat e-mail genormaliseerd (trim + lowercase) op; de login-lookup MOET hetzelfde
  // normaliseren, anders matcht 'Jan@Bedrijf.nl' het opgeslagen 'jan@bedrijf.nl' niet op een
  // hoofdlettergevoelige unieke kolom (PostgreSQL) → onterechte buitensluiting.
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: string;
  mustChangePassword: boolean;
}

/**
 * Verifieert een e-mail/wachtwoord-combinatie en geeft de sessie-payload terug, of `null` bij een
 * mislukte/geweigerde poging. Volgt de mutatieketen: onderhoudspoort → Zod → rate-limit → lookup →
 * wachtwoordcheck → audit.
 */
export async function authorizeCredentials(
  raw: Record<string, unknown> | undefined,
): Promise<AuthorizedUser | null> {
  // Volledige onderhouds-afsluiting (MAINTENANCE_ALLOW_ADMIN=false): geen enkele login mag de
  // database raken tijdens een herstel/migratie. De middleware kan dit niet afdwingen — de matcher
  // sluit `/api/auth/**` uit — dus de poort staat hier, vóór élke Prisma-call. Bewust geen audit
  // (dat zou zelf een DB-schrijfactie zijn): stil weigeren tot onderhoud voorbij is.
  if (
    loginBlockedByMaintenance(process.env.MAINTENANCE_MODE, process.env.MAINTENANCE_ALLOW_ADMIN)
  ) {
    return null;
  }

  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  const meta = await requestMeta();

  // Brute-force-bescherming: begrens inlogpogingen per IP + e-mail. De server
  // beslist; bij overschrijding wordt de poging geweigerd en geaudit. E-mail
  // genormaliseerd zodat hoofdletter-varianten niet om de limiet heen kunnen.
  const limitKey = `${meta.ipAddress ?? "unknown"}:${email.toLowerCase()}`;
  if (!(await loginRateLimiter.check(limitKey)).allowed) {
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

  // Timing-egalisatie (CWE-208): draai ALTIJD precies één bcrypt.compare, ook als de gebruiker niet
  // bestaat, niet ACTIVE is, of (na anonimisering) een lege passwordHash heeft. Alleen een bestaand,
  // ACTIVE-account met een gezette hash vergelijkt tegen zijn eigen hash; alle andere paden vergelijken
  // tegen de constante equalizer-hash (matcht nooit). Zo is de responstijd van een onbekend/geblokkeerd
  // account niet te onderscheiden van een fout wachtwoord → geen e-mail-enumeratie via timing.
  const comparisonHash =
    user && user.status === "ACTIVE" && user.passwordHash
      ? user.passwordHash
      : TIMING_EQUALIZER_HASH;
  const passwordMatches = await bcrypt.compare(password, comparisonHash);

  if (!user || user.status !== "ACTIVE" || !user.passwordHash || !passwordMatches) {
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
  await loginRateLimiter.reset(limitKey);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };
}
