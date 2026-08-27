import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// AVG art. 17 (recht op vergetelheid) — schema-dekkingspoort voor de erasure.
//
// `anonymizeUser` (actions.ts) wist/redact per Prisma-model de persoonsgegevens van de betrokkene.
// Die dekking werd tot nu toe alleen door ontwikkelaars-discipline bewaakt: voegt een toekomstige
// wijziging een NIEUW PII-dragend model toe zonder het in de erasure te draden, dan overleeft die PII
// stil een verwijderverzoek — precies de faalmodus die de saved-search-feature (`SavedJobSearch`)
// eerder liet ontstaan (spiegel van `SavedJob`, maar niet gewist). In een codebase met continue,
// autonome ontwikkeling is manuele discipline niet genoeg.
//
// Deze test dwingt af dat ELK model in `prisma/schema.prisma` óf (a) door de erasure wordt aangeraakt
// (`prisma.<model>` komt voor in de body van `anonymizeUser`), óf (b) hier bewust en gemotiveerd is
// uitgezonderd (geen persoonsgegevens, wettelijke bewaarplicht, cascade-verwijderd, of een aparte
// verwerkings-/bewaargrond). Een nieuw model dat op geen van beide lijsten staat breekt de CI-poort in
// plaats van stil PII te laten overleven. Spiegelt `logger.pii-name-coverage.test.ts` (die hetzelfde
// doet voor de log-redactie), maar dan voor de erasure.

/** Prisma-clientaccessor voor een modelnaam (eerste letter → kleine letter, rest ongewijzigd). */
function accessor(model: string): string {
  return model[0]!.toLowerCase() + model.slice(1);
}

/**
 * True als de erasure-bron `<model>` als Prisma-client-aanroep aanraakt. Woordgrens (`\b`) zodat
 * `prisma.lead` NIET matcht op `prisma.leadContact` en `prisma.conversation` niet op
 * `prisma.conversationParticipant` (anders zou een korter modelnaam ten onrechte als gedekt tellen).
 */
function isErased(src: string, model: string): boolean {
  return new RegExp(`(?:prisma|tx)\\.${accessor(model)}\\b`).test(src);
}

function schemaModels(): string[] {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const models: string[] = [];
  for (const line of schema.split("\n")) {
    const m = /^model\s+([A-Za-z0-9]+)\s*\{/.exec(line);
    if (m) models.push(m[1]!);
  }
  return models;
}

/**
 * De broncode van `anonymizeUser` (het laatste export in actions.ts, dus van de functie-declaratie tot
 * einde bestand). We scopen bewust op déze functie zodat een `prisma.user`-aanroep in een ándere
 * admin-actie (bv. status wijzigen) niet ten onrechte als "erasure-dekking" telt.
 */
function anonymizeUserSource(): string {
  const file = readFileSync(
    resolve(process.cwd(), "src/app/(protected)/admin/gebruikers/actions.ts"),
    "utf8",
  );
  const start = file.indexOf("export async function anonymizeUser");
  expect(start, "kon anonymizeUser niet vinden in actions.ts").toBeGreaterThanOrEqual(0);
  return file.slice(start);
}

// Bewust uitgezonderde modellen + de reden. Uitbreiden vereist een expliciete, gemotiveerde keuze —
// precies het doel van deze poort. Groepen:
//   [INFRA]     — systeem-/observability-/idempotentie-tabellen: geen persoonsgegevens (tijdstippen,
//                 tellers, config, cache-sleutels).
//   [REFERENCE] — gedeelde referentie-/content-/config-data, niet aan één betrokkene gebonden.
//   [JOIN]      — koppeltabellen: enkel vreemde sleutels (skill-/industry-/job-id's), geen PII.
//   [FISCAAL]   — facturen/vergoedingen/heffingen onder wettelijke (fiscale) bewaarplicht — art.
//                 17(3)(b); kernvelden bewust behouden, spiegel van `Invoice`.
//   [CASCADE]   — kindrij die automatisch mee-verdwijnt wanneer de erasure de ouder hard verwijdert.
//   [AUTH]      — Auth.js-adaptertabellen/kortlevende tokens: dit platform draait op credentials+JWT
//                 (stateless), dus niet/nauwelijks gevuld; erasure maakt het account sowieso inert
//                 (SUSPENDED, lege passwordHash) en de rijen dragen geen zelf-getypte PII.
//   [APART]     — een aparte betrokkene of een aparte verwerkings-/bewaargrond dan de account-houder.
const ALLOWLIST: Record<string, string> = {
  // [INFRA]
  BackupHeartbeat: "[INFRA] aflever-heartbeat: enkel tijdstippen/teller/driver, geen PII.",
  BillingDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  CronHeartbeat: "[INFRA] cron-heartbeat: geen PII.",
  ErrorMonitoringDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  MailDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  PasswordBreachDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  PushDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  RateLimitDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  StorageDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  UploadScanDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  VerificationDeliveryHeartbeat: "[INFRA] aflever-heartbeat: geen PII.",
  HealthIncident: "[INFRA] systeem-gezondheidsincident: geen persoonsgegevens.",
  EventHandlerRun: "[INFRA] event-handler-idempotentie: geen PII.",
  ProcessedWebhookEvent: "[INFRA] webhook-idempotentiegrendel: geen PII.",
  GeocodeCache: "[INFRA] gedeelde adres→coord-cache, niet aan een gebruiker-id gekoppeld.",
  TravelRouteCache: "[INFRA] gedeelde route-cache tussen postcodes, niet gebruiker-gescoopt.",
  InvoiceSequence: "[INFRA] factuurnummer-teller (issuerKey+jaar), enkel een volgnummer.",
  PlatformConfig: "[INFRA] platform-configuratie (key/value), geen PII.",
  // [REFERENCE]
  Industry: "[REFERENCE] branchereferentie, geen PII.",
  Skill: "[REFERENCE] vaardigheidsreferentie, geen PII.",
  Course: "[REFERENCE] leercontent, geen PII.",
  Lesson:
    "[REFERENCE] leercontent, geen PII (LessonCompletion — de eigen voortgang — wordt wél gewist).",
  Plan: "[REFERENCE] abonnementsplan-catalogus, geen PII.",
  Department: "[REFERENCE] afdelingsstructuur van een opdrachtgever, geen zelf-getypte PII.",
  // [JOIN]
  FreelancerSkill: "[JOIN] profiel↔vaardigheid, enkel vreemde sleutels.",
  FreelancerIndustry: "[JOIN] profiel↔branche, enkel vreemde sleutels.",
  JobSkill: "[JOIN] opdracht↔vaardigheid, enkel vreemde sleutels.",
  JobCredentialRequirement: "[JOIN] opdracht↔certificaateis, enkel vreemde sleutels.",
  // [FISCAAL]
  TaxFilingRequest:
    "[FISCAAL] fiscale bewaarplicht 7 jaar (art. 17(3)(b) / art. 52 AWR); geen zelf-getypte vrije tekst. Expliciet gedocumenteerd in actions.ts.",
  AdministrationEntry: "[FISCAAL] boekhoudregel onder fiscale bewaarplicht.",
  CollaborationFee: "[FISCAAL] franchise-transactievergoeding (facturatiegrondslag).",
  PlatformBillingInvoice: "[FISCAAL] platform-facturatie aan tenants (zakelijk/fiscaal record).",
  Subscription: "[FISCAAL] abonnement (facturatie/bewaargrond); geen vrije-tekst-PII.",
  TenantSubscription: "[FISCAAL] tenant-abonnement (facturatie); geen vrije-tekst-PII.",
  ZzpMembershipCharge: "[FISCAAL] lidmaatschapsheffing (facturatie/bewaargrond).",
  // [CASCADE]
  CredentialVerification:
    "[CASCADE] onDelete:Cascade vanaf Credential; Credential wordt hard verwijderd in de erasure.",
  VerificationRequest:
    "[CASCADE] onDelete:Cascade vanaf Credential; verdwijnt met de credential-verwijdering.",
  // [AUTH]
  Account:
    "[AUTH] Auth.js OAuth-adaptertabel; credentials+JWT-platform (niet gevuld). Erasure maakt het account inert.",
  Session: "[AUTH] Auth.js sessie-adaptertabel; JWT is stateless (niet gevuld).",
  VerificationToken: "[AUTH] Auth.js verificatietoken; kortlevend, geen blijvende PII.",
  PasswordResetToken:
    "[AUTH] kortlevend reset-token; inert na erasure (lege passwordHash) en verloopt.",
  // [APART]
  Lead: "[APART] derde-partij lead-PII (aparte betrokkene, tenant-eigen); aparte verwerkings-/bewaargrond dan de account-houder. LeadContact.body (eigen notitie) wordt wél geredact.",
  Job: "[APART] zakelijke opdracht-posting van de opdrachtgever (bedrijfsnaam wordt geanonimiseerd); andere partijen (sollicitanten) hebben belang bij behoud.",
  Tenant:
    "[APART] franchise-vestiging; canAnonymizeUser blokkeert fail-closed het anonimiseren van een tenant-eigenaar tot de vestiging is overgedragen/gesloten.",
  Conversation:
    "[APART] gesprekscontainer zonder eigen PII; berichten worden geredact en ConversationParticipant.lastReadAt gewist.",
};

describe("AVG art. 17 — schema-dekking van de erasure (anonymizeUser)", () => {
  it("extractie werkt: bekende gewiste modellen worden als erasure-gedekt herkend", () => {
    const src = anonymizeUserSource();
    for (const model of ["User", "SavedJob", "SavedJobSearch", "Message", "Notification"]) {
      expect(isErased(src, model), `verwacht dat ${model} door de erasure wordt aangeraakt`).toBe(
        true,
      );
    }
  });

  it("elk Prisma-model wordt door de erasure gewist óf staat op de expliciete uitzonderingslijst", () => {
    const src = anonymizeUserSource();
    const models = schemaModels();
    expect(models.length, "schema-extractie vond geen modellen").toBeGreaterThan(50);

    const unclassified = models.filter((m) => !isErased(src, m) && !(m in ALLOWLIST));
    expect(
      unclassified,
      `Modellen die noch door de erasure (anonymizeUser) worden aangeraakt, noch bewust zijn ` +
        `uitgezonderd. Draad ze in de erasure-transactie (AVG art. 17) óf voeg ze met een gemotiveerde ` +
        `reden toe aan ALLOWLIST in deze test: ${unclassified.join(", ")}`,
    ).toEqual([]);
  });

  it("de uitzonderingslijst blijft eerlijk: geen dode of dubbel-gedekte vermeldingen", () => {
    const src = anonymizeUserSource();
    const models = new Set(schemaModels());
    // Geen ALLOWLIST-sleutel die geen bestaand model (meer) is.
    const stale = Object.keys(ALLOWLIST).filter((m) => !models.has(m));
    expect(
      stale,
      `ALLOWLIST-vermeldingen zonder bijbehorend model (opruimen): ${stale.join(", ")}`,
    ).toEqual([]);
    // Geen model dat én in de erasure zit én op de uitzonderingslijst staat (verwijder het dan uit de lijst).
    const redundant = Object.keys(ALLOWLIST).filter((m) => isErased(src, m));
    expect(
      redundant,
      `Modellen die nu door de erasure worden gewist maar nog op ALLOWLIST staan (verwijder ze daar): ${redundant.join(", ")}`,
    ).toEqual([]);
  });
});
