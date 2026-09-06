// Validatie voor de go-live bootstrap-beheerder (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD).
//
// Dit is de ENIGE weg naar een eerste échte ADMIN op een verse productie-database zonder demo-data
// (MENSENWERK §6): de seed maakt er precies één keer een beheerder mee aan (mustChangePassword), zodat
// er nooit een hardgecodeerd demo-wachtwoord in productie staat. Juist omdat dit het meest-
// geprivilegieerde account is, mag de configuratie ervan niet stil half-geactiveerd of zwak zijn:
//   - één van de twee variabelen gezet ("partial") is de klassieke stille halve activering — de
//     operator denkt een beheerder te hebben gezet, maar de seed maakt er geen aan (geen toegang bij
//     go-live, of erger: men valt terug op een demo-account);
//   - een ongeldig e-mailadres levert een beheerder op waarmee je niet betrouwbaar kunt inloggen;
//   - een triviaal zwak wachtwoord op het hoogst-geprivilegieerde account is een reëel risico in het
//     venster tussen seed en de eerste (afgedwongen) wachtwoordwijziging.
//
// Zelfde "geen halve activering"-lijn als de integraties in src/lib/env.ts (VAPID, Stripe-webhook,
// upstash/redis, s3, smtp). Pure, testbare kern — gedeeld door de env-validatie (harde boot-fout bij
// partial/invalid), de systeemstatus-posture (aandacht vóór go-live) en de seed (die de admin
// daadwerkelijk aanmaakt). Bevat NOOIT de wachtwoordwaarde in zijn output.

import { z } from "zod";

/**
 * Minimale wachtwoordlengte voor de bootstrap-beheerder. Bewust hoger dan de eind-gebruikersdrempel
 * (8, zie src/lib/validation.ts): dit is een eenmalig, door de operator in een secrets-kluis gezet
 * wachtwoord op het hoogst-geprivilegieerde account — geen mens hoeft het te typen, dus een hogere
 * lat kost niets. 12 tekens verwerpt en passant het publiek bekende demo-wachtwoord (`demo1234`, 8).
 */
export const BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH = 12;
/** Bovengrens (spiegelt de eind-gebruikers-max in src/lib/validation.ts; voorkomt bcrypt-misbruik). */
export const BOOTSTRAP_ADMIN_MAX_PASSWORD_LENGTH = 200;

/**
 * - `unset`   : geen van beide variabelen gezet → geen bootstrap-admin (veilig; de seed doet niets).
 * - `partial` : precies één van de twee gezet → stille halve activering (harde boot-/seed-fout).
 * - `invalid` : beide gezet, maar e-mail ongeldig en/of wachtwoord te zwak (harde boot-/seed-fout).
 * - `ready`   : beide gezet en geldig → de seed mag de beheerder aanmaken.
 */
export type BootstrapAdminState = "unset" | "partial" | "invalid" | "ready";

export interface BootstrapAdminConfig {
  state: BootstrapAdminState;
  /** Genormaliseerd (trim + lowercase) e-mailadres; alleen gezet bij state === "ready". */
  email: string | null;
  /** Reden(en) bij partial/invalid — variabelenamen + eisen, NOOIT de wachtwoordwaarde. */
  errors: string[];
}

const emailSchema = z.string().email();

function isPresent(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Classificeert de bootstrap-admin-configuratie. Puur: leest alleen de meegegeven waarden, raakt
 * process.env niet aan en logt niets. De wachtwoordwaarde wordt uitsluitend op lengte beoordeeld en
 * verlaat deze functie nooit.
 */
export function resolveBootstrapAdminConfig(input: {
  email?: string | null;
  password?: string | null;
}): BootstrapAdminConfig {
  const hasEmail = isPresent(input.email);
  const hasPassword = isPresent(input.password);

  if (!hasEmail && !hasPassword) {
    return { state: "unset", email: null, errors: [] };
  }

  if (hasEmail !== hasPassword) {
    const missing = hasEmail ? "BOOTSTRAP_ADMIN_PASSWORD" : "BOOTSTRAP_ADMIN_EMAIL";
    const present = hasEmail ? "BOOTSTRAP_ADMIN_EMAIL" : "BOOTSTRAP_ADMIN_PASSWORD";
    return {
      state: "partial",
      email: null,
      errors: [
        `${present} is gezet maar ${missing} ontbreekt — zet beide of geen (anders wordt er stil géén beheerder aangemaakt).`,
      ],
    };
  }

  // Beide aanwezig: valideer inhoud.
  const errors: string[] = [];
  const normalizedEmail = (input.email as string).trim().toLowerCase();
  if (!emailSchema.safeParse(normalizedEmail).success) {
    errors.push("BOOTSTRAP_ADMIN_EMAIL is geen geldig e-mailadres.");
  }
  // Lengte op de RUWE waarde: leidende/volgende spaties zijn geldige wachtwoordtekens en mogen niet
  // worden weggetrimd vóór de lengtemeting.
  const password = input.password as string;
  if (password.length < BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH) {
    errors.push(
      `BOOTSTRAP_ADMIN_PASSWORD moet minstens ${BOOTSTRAP_ADMIN_MIN_PASSWORD_LENGTH} tekens zijn (het is een go-live-beheerderswachtwoord).`,
    );
  } else if (password.length > BOOTSTRAP_ADMIN_MAX_PASSWORD_LENGTH) {
    errors.push(
      `BOOTSTRAP_ADMIN_PASSWORD mag hoogstens ${BOOTSTRAP_ADMIN_MAX_PASSWORD_LENGTH} tekens zijn.`,
    );
  }

  if (errors.length > 0) {
    return { state: "invalid", email: null, errors };
  }

  return { state: "ready", email: normalizedEmail, errors: [] };
}
