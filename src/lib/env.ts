// Env-validatie. Draait bij server-boot (zie src/instrumentation.ts) zodat een ontbrekende
// of zwakke configuratie meteen en duidelijk faalt in plaats van later mysterieus.
//
// Twee niveaus:
//   1. HARDE fouten (validateEnv werpt): de app kan niet veilig of correct draaien.
//      - basisvariabelen ontbreken/zwak (DATABASE_URL, AUTH_SECRET ≥16);
//      - een ingeschakelde integratie (s3/smtp/mollie/duo/...) mist zijn vereiste secrets —
//        dan is een halve activering gevaarlijker dan geen.
//   2. ZACHTE waarschuwingen (envWarnings, gelogd bij boot): de app draait door met een
//      veilige fallback, maar in productie wil je dit waarschijnlijk anders (geen mailkanaal,
//      lokale documentopslag, geen taak-cron, en de productie-aanbevelingen SHARE_TOKEN_SECRET,
//      AUTH_URL en een sterke AUTH_SECRET ≥32). Nooit fataal — de deploy/pilot blijft werken.
//
// Integraties staan default UIT/inert; ze activeren pas zodra de bijbehorende secret er is.

import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is verplicht."),
    AUTH_SECRET: z.string().min(16, "AUTH_SECRET moet minstens 16 tekens zijn."),
    // Productie-webadres (NextAuth + deelbare dossier-links). In productie verplicht; lokaal optioneel.
    AUTH_URL: z.string().url("AUTH_URL moet een geldige URL zijn.").optional(),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL moet een geldige URL zijn.").optional(),
    // Eigen sleutel voor deelbare dossier-links (security-review H-1). Valt lokaal terug op
    // AUTH_SECRET; in productie verplicht zodat rotatie van het één niet het ander breekt.
    SHARE_TOKEN_SECRET: z
      .string()
      .min(16, "SHARE_TOKEN_SECRET moet minstens 16 tekens zijn.")
      .optional(),

    // Documentopslag: lokale .gitignore'de map (default) of S3 / S3-compatibel (productie).
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_S3_BUCKET: z.string().optional(),
    STORAGE_S3_REGION: z.string().optional(),
    STORAGE_S3_ENDPOINT: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    // Geldigheidsduur (seconden) van presigned download-URLs. Optioneel; geklemd op [30, 3600],
    // default 300. Een ongeldige waarde valt veilig terug op de default.
    STORAGE_S3_URL_TTL: z.string().optional(),
    // Server-side encryption-at-rest voor S3-uploads. AES256 (default, SSE-S3), aws:kms (SSE-KMS)
    // of none (bewust uit, voor S3-compatibele opslag zonder SSE-header). Zie resolveSseParams().
    STORAGE_S3_SSE: z.enum(["AES256", "aws:kms", "none"]).optional(),
    STORAGE_S3_SSE_KMS_KEY_ID: z.string().optional(),

    // Echte reistijd-routing: offline fallback (default) of Geoapify met API-key.
    ROUTING_PROVIDER: z.enum(["offline", "geoapify"]).default("offline"),
    GEOAPIFY_API_KEY: z.string().optional(),
    // Semantische matching: local (default, in-memory) of pgvector (productie).
    SEMANTIC_MATCHER: z.enum(["local", "pgvector"]).default("local"),
    // Rate-limit-store: in-memory per proces (default) of gedeeld via Upstash Redis REST
    // (horizontale schaling, MENSENWERK §0b H-2). Bij "upstash" zijn URL + token verplicht.
    RATE_LIMIT_STORE: z.enum(["memory", "upstash"]).default("memory"),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Beveiligt POST /api/tasks/* (verloopdetectie, herinneringen, cascade-runners). Optioneel;
    // zonder waarde zijn de taak-endpoints uitgeschakeld (503).
    CRON_SECRET: z.string().optional(),

    // E-mailkanaal: noop (default, in-app meldingen blijven werken), echte SMTP-verzending, of de
    // Resend HTTP-API (nodig op hosts die uitgaande SMTP blokkeren, zoals Railway).
    EMAIL_DRIVER: z.enum(["noop", "smtp", "resend"]).default("noop"),
    EMAIL_SMTP_HOST: z.string().optional(),
    EMAIL_SMTP_PORT: z.string().optional(),
    EMAIL_SMTP_USER: z.string().optional(),
    EMAIL_SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),

    // Betaalprovider: noop (default, demo-abonnementsflow), Mollie of Stripe.
    BILLING_PROVIDER: z.enum(["noop", "mollie", "stripe"]).default("noop"),
    MOLLIE_API_KEY: z.string().optional(),
    STRIPE_API_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Malware-scan van geüploade bewijsstukken: noop (default, geen scan) of ClamAV-daemon.
    // Bij "clamav" is CLAMAV_HOST verplicht; de poort valt terug op 3310.
    UPLOAD_SCANNER: z.enum(["noop", "clamav"]).default("noop"),
    CLAMAV_HOST: z.string().optional(),
    CLAMAV_PORT: z.string().optional(),

    // Foutmonitoring: optionele externe error-reporting (Sentry). Zonder DSN worden
    // server-fouten alleen gestructureerd gelogd. LOG_LEVEL stelt de logdrempel in.
    SENTRY_DSN: z.string().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),

    // Externe verificatie-adapters. Elke waarde behalve de echte provider ("duo"/"bigregister"/
    // "idin") betekent de ingebouwde demo-verifier (conventie in .env.example: "mock") — daarom
    // een vrije string i.p.v. een strikte enum, zodat bestaande config niet breekt.
    DIPLOMA_VERIFIER: z.string().optional(),
    DUO_API_BASE: z.string().optional(),
    DUO_API_KEY: z.string().optional(),
    BIG_VERIFIER: z.string().optional(),
    BIG_API_BASE: z.string().optional(),
    BIG_API_KEY: z.string().optional(),
    IDENTITY_VERIFIER: z.string().optional(),
    IDENTITY_API_BASE: z.string().optional(),
    IDENTITY_API_KEY: z.string().optional(),
    // Fail-closed poort tegen mock-verificatie op echte data (security-review 2026-07-07, KRITIEK).
    // In productie weigert de zelf-verificatie standaard de ingebouwde demo-verifiers, tenzij deze op
    // "true" staat (bewuste pilotkeuze) of SEED_DEMO=true (demo-dataset). Zie verification-policy.ts.
    ALLOW_MOCK_VERIFICATION: z.string().optional(),
    // Demo-dataset-vlag (prisma/seed.ts). In productie mét demo-data mag de mock-verifier draaien.
    SEED_DEMO: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const require = (cond: boolean, path: string, message: string) => {
      if (!cond) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };

    // Integratie ingeschakeld → de bijbehorende secrets zijn verplicht (geen halve activering).
    if (v.STORAGE_DRIVER === "s3") {
      require(!!v.STORAGE_S3_BUCKET, "STORAGE_S3_BUCKET", "Verplicht bij STORAGE_DRIVER=s3.");
      require(!!v.STORAGE_S3_REGION, "STORAGE_S3_REGION", "Verplicht bij STORAGE_DRIVER=s3.");
      require(!!v.AWS_ACCESS_KEY_ID, "AWS_ACCESS_KEY_ID", "Verplicht bij STORAGE_DRIVER=s3.");
      require(!!v.AWS_SECRET_ACCESS_KEY, "AWS_SECRET_ACCESS_KEY", "Verplicht bij STORAGE_DRIVER=s3.");
    }
    if (v.ROUTING_PROVIDER === "geoapify") {
      require(!!v.GEOAPIFY_API_KEY, "GEOAPIFY_API_KEY", "Verplicht bij ROUTING_PROVIDER=geoapify.");
    }
    if (v.EMAIL_DRIVER === "smtp") {
      require(!!v.EMAIL_SMTP_HOST, "EMAIL_SMTP_HOST", "Verplicht bij EMAIL_DRIVER=smtp.");
      require(!!v.EMAIL_SMTP_PORT, "EMAIL_SMTP_PORT", "Verplicht bij EMAIL_DRIVER=smtp.");
      require(!!v.EMAIL_SMTP_USER, "EMAIL_SMTP_USER", "Verplicht bij EMAIL_DRIVER=smtp.");
      require(!!v.EMAIL_SMTP_PASS, "EMAIL_SMTP_PASS", "Verplicht bij EMAIL_DRIVER=smtp.");
      require(!!v.EMAIL_FROM, "EMAIL_FROM", "Verplicht bij EMAIL_DRIVER=smtp.");
    }
    if (v.EMAIL_DRIVER === "resend") {
      require(!!v.RESEND_API_KEY, "RESEND_API_KEY", "Verplicht bij EMAIL_DRIVER=resend.");
      require(!!v.EMAIL_FROM, "EMAIL_FROM", "Verplicht bij EMAIL_DRIVER=resend.");
    }
    if (v.BILLING_PROVIDER === "mollie") {
      require(!!v.MOLLIE_API_KEY, "MOLLIE_API_KEY", "Verplicht bij BILLING_PROVIDER=mollie.");
    }
    if (v.BILLING_PROVIDER === "stripe") {
      require(!!v.STRIPE_API_KEY, "STRIPE_API_KEY", "Verplicht bij BILLING_PROVIDER=stripe.");
      // Zonder webhook-secret kan de betaalstatus-webhook niet geverifieerd worden (halve activering).
      require(!!v.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET", "Verplicht bij BILLING_PROVIDER=stripe (webhookverificatie).");
    }
    if (v.UPLOAD_SCANNER === "clamav") {
      require(!!v.CLAMAV_HOST, "CLAMAV_HOST", "Verplicht bij UPLOAD_SCANNER=clamav.");
    }
    if (v.RATE_LIMIT_STORE === "upstash") {
      require(!!v.UPSTASH_REDIS_REST_URL, "UPSTASH_REDIS_REST_URL", "Verplicht bij RATE_LIMIT_STORE=upstash.");
      require(!!v.UPSTASH_REDIS_REST_TOKEN, "UPSTASH_REDIS_REST_TOKEN", "Verplicht bij RATE_LIMIT_STORE=upstash.");
    }
    if (v.DIPLOMA_VERIFIER === "duo") {
      require(!!v.DUO_API_BASE, "DUO_API_BASE", "Verplicht bij DIPLOMA_VERIFIER=duo.");
      require(!!v.DUO_API_KEY, "DUO_API_KEY", "Verplicht bij DIPLOMA_VERIFIER=duo.");
    }
    if (v.BIG_VERIFIER === "bigregister") {
      require(!!v.BIG_API_BASE, "BIG_API_BASE", "Verplicht bij BIG_VERIFIER=bigregister.");
      require(!!v.BIG_API_KEY, "BIG_API_KEY", "Verplicht bij BIG_VERIFIER=bigregister.");
    }
    if (v.IDENTITY_VERIFIER === "idin") {
      require(!!v.IDENTITY_API_BASE, "IDENTITY_API_BASE", "Verplicht bij IDENTITY_VERIFIER=idin.");
      require(!!v.IDENTITY_API_KEY, "IDENTITY_API_KEY", "Verplicht bij IDENTITY_VERIFIER=idin.");
    }

    // Productie-aanbevelingen (sterke AUTH_SECRET, SHARE_TOKEN_SECRET, AUTH_URL) zijn bewust GEEN
    // harde boot-eisen: ze hebben een veilige fallback (SHARE_TOKEN_SECRET valt terug op AUTH_SECRET,
    // MENSENWERK §0b H-1) en mogen een productie-deploy niet breken vóór de mens de secret heeft
    // gezet. Ze worden als niet-fatale waarschuwing gelogd via envWarnings().
  });

export type Env = z.infer<typeof schema>;

/**
 * Niet-fatale waarschuwingen voor productie: integraties die op een veilige fallback draaien
 * maar die je in productie waarschijnlijk wilt activeren. Puur (testbaar); validateEnv logt ze.
 */
export function envWarnings(env: Env): string[] {
  if (env.NODE_ENV !== "production") return [];
  const warnings: string[] = [];
  if (env.STORAGE_DRIVER === "local") {
    warnings.push(
      "STORAGE_DRIVER=local — geüploade documenten gaan naar de lokale schijf (vluchtig bij redeploy). Zet STORAGE_DRIVER=s3 voor productie.",
    );
  }
  if (env.STORAGE_DRIVER === "s3" && env.STORAGE_S3_SSE === "none") {
    warnings.push(
      "STORAGE_S3_SSE=none — uploads worden zonder expliciete server-side-encryptie-header opgeslagen; gevoelige documenten leunen dan enkel op de bucket-default-encryptie. Zet STORAGE_S3_SSE=AES256 (of aws:kms) tenzij je opslag de header niet accepteert.",
    );
  }
  if (env.EMAIL_DRIVER === "noop") {
    warnings.push(
      "EMAIL_DRIVER=noop — er wordt geen e-mail afgeleverd (alleen in-app meldingen). Configureer EMAIL_DRIVER=smtp voor e-mailmeldingen.",
    );
  }
  if (!env.CRON_SECRET) {
    warnings.push(
      "CRON_SECRET ontbreekt — de taak-endpoints (/api/tasks/*) zijn uitgeschakeld; geplande runners draaien niet.",
    );
  }
  if (/^(file:|sqlite)/i.test(env.DATABASE_URL)) {
    warnings.push(
      "DATABASE_URL wijst naar SQLite — gebruik in productie een managed PostgreSQL (EU-regio, back-ups).",
    );
  }
  if (!env.SHARE_TOKEN_SECRET) {
    warnings.push(
      "SHARE_TOKEN_SECRET ontbreekt — deelbare dossier-links vallen terug op AUTH_SECRET; rotatie van AUTH_SECRET breekt dan bestaande links. Aanbevolen (security-review H-1): genereer met `openssl rand -base64 32`.",
    );
  }
  if (!env.AUTH_URL && !env.NEXTAUTH_URL) {
    warnings.push(
      "AUTH_URL/NEXTAUTH_URL ontbreekt — zet je productie-webadres voor betrouwbare login-callbacks en deelbare links.",
    );
  }
  if (env.AUTH_SECRET.length < 32) {
    warnings.push(
      "AUTH_SECRET is korter dan 32 tekens — gebruik in productie een sterke sleutel (`openssl rand -base64 32`).",
    );
  }
  if (!env.SENTRY_DSN) {
    warnings.push(
      "SENTRY_DSN ontbreekt — server-fouten worden alleen gestructureerd gelogd (geen externe error-monitoring). Zet SENTRY_DSN + installeer @sentry/nextjs voor productie-monitoring.",
    );
  }
  if (env.UPLOAD_SCANNER === "noop") {
    warnings.push(
      "UPLOAD_SCANNER=noop — geüploade bewijsstukken worden niet op malware gescand. Zet UPLOAD_SCANNER=clamav (met CLAMAV_HOST) voor productie met echte gevoelige documenten.",
    );
  }
  if (env.RATE_LIMIT_STORE === "memory") {
    warnings.push(
      "RATE_LIMIT_STORE=memory — rate-limits gelden per proces; bij meerdere instances zijn de limieten per instance. Zet RATE_LIMIT_STORE=upstash (met UPSTASH_REDIS_REST_URL/TOKEN) vóór horizontale schaling.",
    );
  }
  // Verificatie-vertrouwen (security-review 2026-07-07, KRITIEK). Een verifier die niet op zijn echte
  // register staat, draait op de demo-verifier (source "MOCK").
  const mockVerifiers = [
    env.DIPLOMA_VERIFIER !== "duo" ? "DIPLOMA_VERIFIER=duo" : null,
    env.BIG_VERIFIER !== "bigregister" ? "BIG_VERIFIER=bigregister" : null,
    env.IDENTITY_VERIFIER !== "idin" ? "IDENTITY_VERIFIER=idin" : null,
  ].filter((x): x is string => x !== null);
  if (mockVerifiers.length > 0) {
    if (env.ALLOW_MOCK_VERIFICATION === "true" && env.SEED_DEMO !== "true") {
      warnings.push(
        `ALLOW_MOCK_VERIFICATION=true met demo-verifier(s) actief (${mockVerifiers.join(", ")}) — een format-geldig maar mogelijk VERZONNEN diploma/BIG-nummer/identiteit wordt als "Geverifieerd" gestempeld en kan de plaatsingspoort passeren. Alleen doen in een bewuste pilot ZONDER echte gevoelige documenten; zet de echte koppelingen vóór echte data live gaat.`,
      );
    } else if (env.SEED_DEMO !== "true") {
      warnings.push(
        `Verificatie draait op de demo-verifier (${mockVerifiers.join(", ")}) — zelf-verificatie van diploma/BIG/identiteit is in productie GEBLOKKEERD (fail-closed) tot de echte registerkoppelingen zijn gezet. Configureer ze vóór go-live met echte diploma-/VOG-data.`,
      );
    }
  }
  return warnings;
}

/** Valideert process.env; werpt een leesbare fout als er iets ontbreekt/zwak is. */
export function validateEnv(): Env {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Ongeldige omgevingsvariabelen:\n${details}`);
  }
  for (const warning of envWarnings(result.data)) {
    console.warn(`[env] waarschuwing: ${warning}`);
  }
  return result.data;
}
