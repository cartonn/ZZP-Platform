// AVG "recht op verwijdering" — pure logica voor het anonimiseren van een account.
//
// Beheer voert een door de gebruiker aangevraagde verwijdering uit door de
// persoonsgegevens onomkeerbaar te overschrijven. Records met een wettelijke
// (fiscale) bewaarplicht — facturen — blijven bestaan; de persoonsgegevens op
// het account zelf worden onleesbaar gemaakt. Deze module bevat alleen pure
// functies (geen DB/IO) zodat de regels los testbaar en deterministisch zijn.

import { type UserRole } from "@/lib/enums";

/** Weergavenaam waarmee een geanonimiseerd account wordt getoond. */
export const ANONYMIZED_NAME = "Verwijderde gebruiker";

/** Redactie-marker die in de plaats komt van uit auditlog-metadata verwijderde persoonsgegevens. */
export const AUDIT_PII_REDACTED = "[verwijderd]";

/**
 * AVG art. 17 (recht op vergetelheid) dekt óók de auditlog. Meerdere audit-events schrijven rauwe
 * PII van de betrokkene in de JSON-metadata (e-mailadres bij mislukte login/rate-limit/bulk-import;
 * de volledige naam bij `FRANCHISE_FREELANCER_ADDED`); de overschrijving van `User.email`/`User.name`
 * bij anonimisering raakt die kopieën niet. Deze pure helper redact elk opgegeven PII-waarde uit één
 * metadata-string: elk stringveld dat exact (hoofdletter-ongevoelig) gelijk is aan een van de waarden
 * wordt vervangen door de redactie-marker. Andere velden (bv. `role`, status-overgangen) blijven staan
 * — die zijn niet naar de persoon herleidbaar en operationeel nodig. De exact-match voorkomt dat de
 * waarde van een ándere gebruiker (die deze slechts als substring bevat) per ongeluk wordt geraakt.
 * Geeft de invoer ongewijzigd terug als er niets te redacten valt of de metadata geen geldige
 * JSON-object-string is (defensief; `auditData` schrijft altijd JSON, maar we vertrouwen niet blind).
 */
export function scrubAuditMetadataPii(
  metadata: string | null,
  values: readonly (string | null | undefined)[],
): string | null {
  if (!metadata) return metadata;
  // Alleen niet-lege PII-waarden; een leeg/whitespace-adres of -naam zou anders élk leeg
  // stringveld ten onrechte redacten. Vergelijking is hoofdletter-ongevoelig en exact per veld,
  // zodat het adres/de naam van een ánder (die de waarde slechts als substring bevat) niet wordt geraakt.
  const targets = new Set(
    values
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.toLowerCase()),
  );
  if (targets.size === 0) return metadata;
  let parsed: unknown;
  try {
    parsed = JSON.parse(metadata);
  } catch {
    return metadata;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return metadata;
  const obj = parsed as Record<string, unknown>;
  let changed = false;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && targets.has(value.toLowerCase())) {
      obj[key] = AUDIT_PII_REDACTED;
      changed = true;
    }
  }
  return changed ? JSON.stringify(obj) : metadata;
}

/** Backwards-compatibele variant die alleen het e-mailadres redact. */
export function scrubAuditMetadataEmail(metadata: string | null, email: string): string | null {
  return scrubAuditMetadataPii(metadata, [email]);
}

/** Deterministisch, uniek pseudo-adres. Behoudt de unique-constraint op `email`
 *  zonder een herleidbaar adres te bewaren. `.invalid` is per RFC 6761 nooit een
 *  echt domein, dus er kan geen mail naartoe. */
export function anonymizedEmail(userId: string): string {
  return `verwijderd-${userId}@anoniem.invalid`;
}

export interface AnonymizationTarget {
  id: string;
  role: string;
  deletionRequestedAt: Date | null;
  anonymizedAt: Date | null;
  /** True wanneer de betrokkene nog eigenaar (`Tenant.ownerUserId`) is van een tenant die nog
   *  operationeel is — status PENDING, ACTIVE of SUSPENDED. Zo'n vestiging draagt zijn eigen naam
   *  (`Tenant.name`/`slug`, vaak persoonsafgeleid, bv. "Bemiddeling Jansen") én blijft na
   *  anonimisering doordraaien met andere leden, bedrijven en freelancers eronder: zonder een
   *  overdracht/sluiting zouden zowel de (mogelijk persoons-)naam als de `ownerUserId`-verwijzing
   *  naar het nu-geanonimiseerde account blijven bestaan — een half-voltooide AVG-verwijdering.
   *
   *  Een REJECTED-tenant blokkeert hier bewust NIET: de aanmelding is afgewezen (fail-closed via
   *  `tenantAccessBlocked` — de eigenaar heeft nooit toegang gehad, dus er zijn geen leden,
   *  bedrijven, opdrachten, subscription of fees op die tenant), en `TENANT_TRANSITIONS.REJECTED`
   *  is leeg (er is geen legale of admin-actie om zo'n dossier alsnog te sluiten of over te
   *  dragen). De aanmeldings-PII (naam/KvK/regio/telefoon/activationNote) moet dan meepakbaar zijn
   *  in dezelfde erasure-transactie in `anonymizeUser`; anders is er geen bereikbaar wispad voor
   *  een afgewezen bureau dat om vergetelheid vraagt (AVG art. 17 — voorheen permanent
   *  onerasbaar). De scheiding met de brede oude `ownsTenant`-boolean is bewust: die zou de
   *  REJECTED-tak stilzwijgend blijven blokkeren.
   *
   *  Optioneel zodat bestaande aanroepers/tests niet breken; `undefined` telt als "bezit geen
   *  operationele tenant". */
  ownsActiveTenant?: boolean;
}

export type AnonymizationCheck = { ok: true } | { ok: false; reason: string };

/** Guard voor de anonimisering. Server-side waarheid: alleen een beheerder mag
 *  uitvoeren, nooit op de eigen account, nooit op een andere beheerder (voorkomt
 *  dat het platform onbeheerbaar wordt), alleen wanneer er een openstaand
 *  verzoek is, en niet wanneer het account al geanonimiseerd is. */
export function canAnonymizeUser(
  actor: { id: string; role: UserRole | string },
  target: AnonymizationTarget,
): AnonymizationCheck {
  if (actor.role !== "ADMIN") {
    return { ok: false, reason: "Alleen een beheerder kan een verwijderverzoek afhandelen." };
  }
  if (actor.id === target.id) {
    return { ok: false, reason: "Je kunt je eigen account niet anonimiseren." };
  }
  if (target.role === "ADMIN") {
    return { ok: false, reason: "Een beheerdersaccount kan niet worden geanonimiseerd." };
  }
  if (target.anonymizedAt) {
    return { ok: false, reason: "Dit account is al geanonimiseerd." };
  }
  if (!target.deletionRequestedAt) {
    return { ok: false, reason: "Er is geen openstaand verwijderverzoek voor dit account." };
  }
  if (target.ownsActiveTenant) {
    // Fail-closed: een OPERATIONELE eigen tenant (PENDING/ACTIVE/SUSPENDED) draagt leden,
    // bedrijven, opdrachten en fees en blijft na anonimisering doordraaien. De
    // anonimiseringstransactie schoont zo'n vestiging niet op — anders zouden de (mogelijk
    // persoonsafgeleide) tenant-naam én de `ownerUserId`-verwijzing achterblijven op een
    // doordraaiende vestiging → half-voltooide verwijdering (AVG art. 17). Beheer moet de
    // vestiging eerst overdragen aan een andere beheerder of sluiten vóór het account kan worden
    // verwijderd. Een REJECTED-tenant valt hier bewust NIET onder (zie de docstring op
    // `ownsActiveTenant`): die wordt in dezelfde erasure-transactie meegepakt.
    return {
      ok: false,
      reason:
        "Deze bemiddelaar beheert nog een actieve vestiging. Draag de vestiging eerst over aan een andere beheerder of sluit haar, vóór het account wordt verwijderd.",
    };
  }
  return { ok: true };
}

/** PII-velden die op de User-rij worden overschreven. `passwordHash` wordt leeggemaakt
 *  zodat inloggen onmogelijk wordt (bcrypt-vergelijking faalt altijd). `lastLoginAt`/
 *  `previousLoginAt` zijn login-recency-gedragsmetadata óver de betrokkene (wanneer die persoon
 *  voor het laatst inlogde): de server voedt er inzetbaarheids-/roster-dormancy-signalen mee die
 *  óók aan derden (de bemiddelaar op `/franchise/zzpers`) worden getoond. Blijven ze na
 *  anonimisering staan, dan overleeft toewijsbare gedragsmetadata over het verwijderde individu een
 *  art. 17-verzoek (spiegelbeeld van `ConversationParticipant.lastReadAt`, #1097). Ze op `null`
 *  zetten hoort dus bij de erasure; de nu-wachtwoordloze account kan sowieso niet opnieuw inloggen,
 *  dus er wordt niets nuttigs weggegooid. */
export function userAnonymizationData(
  userId: string,
  now: Date,
): {
  name: string;
  email: string;
  passwordHash: string;
  status: "SUSPENDED";
  deletionRequestedAt: null;
  anonymizedAt: Date;
  identityVerifiedAt: null;
  verifiedLegalName: null;
  mustChangePassword: false;
  emailVerified: null;
  lastLoginAt: null;
  previousLoginAt: null;
  // Tweestapsverificatie: een geanonimiseerd account mag geen bruikbaar 2FA-geheim behouden. Het
  // versleutelde TOTP-geheim → null en de activeringsdatum → null (de herstelcodes worden als aparte
  // rijen fysiek verwijderd in de erasure-transactie). Het account is sowieso SUSPENDED met lege
  // passwordHash en kan nooit meer inloggen, dus er gaat niets nuttigs verloren.
  twoFactorSecret: null;
  twoFactorEnabledAt: null;
  // `twoFactorLastUsedStep` is de hoogst-verbruikte TOTP-tijdteller: `floor(unixtime/30)` van de
  // laatste geslaagde 2FA-login — een gedragsmetadatum met ~30s-resolutie dat via `step * 30`
  // herleidbaar is tot het exacte inlogmoment van de betrokkene en aan de (hernoemde, maar behouden)
  // `User.id` toewijsbaar blijft. Precies dezelfde art. 17-klasse als lastLoginAt/previousLoginAt en
  // ConversationParticipant.lastReadAt (#1097); de self-service `disableTwoFactor` zet dit veld al op
  // null. Hoort dus bij de erasure (spiegel-consistentie voorkomt dat de replay-guard-metadata een
  // vergetelheidsverzoek overleeft).
  twoFactorLastUsedStep: null;
} {
  return {
    name: ANONYMIZED_NAME,
    email: anonymizedEmail(userId),
    passwordHash: "",
    status: "SUSPENDED",
    deletionRequestedAt: null,
    anonymizedAt: now,
    identityVerifiedAt: null,
    verifiedLegalName: null,
    mustChangePassword: false,
    emailVerified: null,
    lastLoginAt: null,
    previousLoginAt: null,
    twoFactorSecret: null,
    twoFactorEnabledAt: null,
    twoFactorLastUsedStep: null,
  };
}

/** Vrije-tekst- en identificerende velden op het ZZP-profiel worden gewist; het
 *  profiel wordt op privé gezet zodat het nergens meer publiek verschijnt.
 *  `defaultMotivation` is de zelf-getypte quick-apply-standaardtekst (≤2000 tekens, vrije tekst met
 *  mogelijk naam/telefoon/adres — spiegelbeeld van `Application.motivation` die al wordt geredact);
 *  `monthlyIncomeGoalCents` is een zelfgekozen financieel doel — beide horen bij art. 17 mee te
 *  worden gewist, net als `hourlyRate`. `iban` is de SEPA-betaalrekening: een direct identificerend
 *  financieel persoonsgegeven (bankrekeningnummer van een natuurlijke persoon), dus óók art. 17. */
export function freelancerProfileAnonymizationData(): {
  headline: null;
  bio: null;
  location: null;
  languages: null;
  kvkNumber: null;
  btwNumber: null;
  iban: null;
  website: null;
  hourlyRate: null;
  monthlyIncomeGoalCents: null;
  defaultMotivation: null;
  visibility: "PRIVATE";
} {
  return {
    headline: null,
    bio: null,
    location: null,
    languages: null,
    kvkNumber: null,
    btwNumber: null,
    iban: null,
    website: null,
    hourlyRate: null,
    monthlyIncomeGoalCents: null,
    defaultMotivation: null,
    visibility: "PRIVATE",
  };
}

/** Neutrale titel waarmee een geanonimiseerde opdracht (Job) wordt getoond. */
export const ANONYMIZED_JOB_TITLE = "Verwijderde opdracht";

/** Redactie-marker voor de vrije-tekst-omschrijving van een geanonimiseerde opdracht. */
export const ANONYMIZED_JOB_DESCRIPTION = "[Verwijderd op verzoek van de gebruiker]";

/**
 * Vrije-tekstvelden op de opdracht (Job) worden onomkeerbaar overschreven. `title` (≤160) en
 * `description` (≤5000) zijn door de OPDRACHTGEVER zélf getypte vrije tekst; bij een eenmanszaak/
 * ZZP-opdrachtgever kunnen die — net als `location` — diens eigen naam/telefoon/adres bevatten.
 * Een `company.update` cascadeert NIET naar de gekoppelde Job-rijen, dus deze velden werden bij de
 * erasure nergens geraakt: door de betrokkene geschreven PII overleefde het art. 17-verzoek en bleef
 * voor een PUBLISHED-opdracht platform-breed zichtbaar voor élke ZZP'er (de marktplaats-`where`
 * filtert enkel op `status`, niet op de status van de eigenaar). Spiegel van
 * `companyAnonymizationData()` en de Message/Application/Performance-vrije-tekstredactie. */
export function jobAnonymizationData(): {
  title: string;
  description: string;
  location: null;
} {
  return {
    title: ANONYMIZED_JOB_TITLE,
    description: ANONYMIZED_JOB_DESCRIPTION,
    location: null,
  };
}

/** Bedrijfsprofielvelden worden gewist; de naam wordt vervangen door de
 *  geanonimiseerde weergavenaam. */
export function companyAnonymizationData(): {
  name: string;
  description: null;
  website: null;
  location: null;
  logoKey: null;
  mailIntakeAlias: null;
} {
  return {
    name: ANONYMIZED_NAME,
    description: null,
    website: null,
    location: null,
    logoKey: null,
    // Intake-alias intrekken: een geanonimiseerd account mag geen werkend inname-kanaal
    // achterlaten waarmee derden nog aanvragen in de (dode) queue kunnen blijven mailen.
    mailIntakeAlias: null,
  };
}
