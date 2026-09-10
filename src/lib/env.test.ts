import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { envWarnings, rateLimitStoreDiagnostics, validateEnv, type Env } from "@/lib/env";

const ORIGINAL = process.env;

// Integratie-secrets die de sandbox/CI kan injecteren (bv. proxy-geïnjecteerde AWS-creds);
// per test wissen zodat de flag→companion-checks deterministisch zijn.
const INTEGRATION_VARS = [
  "STORAGE_S3_BUCKET",
  "STORAGE_S3_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "GEOAPIFY_API_KEY",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "EMAIL_SMTP_USER",
  "EMAIL_SMTP_PASS",
  "EMAIL_FROM",
  "RESEND_API_KEY",
  "POSTMARK_SERVER_TOKEN",
  "POSTMARK_MESSAGE_STREAM",
  "SES_REGION",
  "SES_ACCESS_KEY_ID",
  "SES_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
  "MOLLIE_API_KEY",
  "STRIPE_API_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "DUO_API_BASE",
  "DUO_API_KEY",
  "BIG_API_BASE",
  "BIG_API_KEY",
  "IDENTITY_API_BASE",
  "IDENTITY_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "REDIS_URL",
  "DB_TRANSITION_ACCEPT_DATA_LOSS",
  "CLAMAV_HOST",
  "CLAMAV_PORT",
  "SHARE_TOKEN_SECRET",
  "TWOFA_ENC_KEY",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD",
];

/** Zet een env-var (omzeilt de readonly-typing van bv. NODE_ENV). */
function setEnv(key: string, value: string) {
  (process.env as Record<string, string | undefined>)[key] = value;
}

beforeEach(() => {
  process.env = { ...ORIGINAL };
  for (const key of INTEGRATION_VARS) delete process.env[key];
});
afterEach(() => {
  process.env = ORIGINAL;
});

/** Minimale geldige basis (lokaal); per test aangevuld. */
function baseValid() {
  process.env.DATABASE_URL = "file:./dev.db";
  process.env.AUTH_SECRET = "x".repeat(32);
  process.env.STORAGE_DRIVER = "local";
}

describe("validateEnv", () => {
  it("accepteert een geldige lokale configuratie", () => {
    baseValid();
    expect(() => validateEnv()).not.toThrow();
  });

  it("weigert een ontbrekende/zwakke AUTH_SECRET", () => {
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.AUTH_SECRET = "kort";
    expect(() => validateEnv()).toThrow(/AUTH_SECRET/);
  });

  it("vereist bucket, regio én sleutels bij STORAGE_DRIVER=s3", () => {
    baseValid();
    process.env.STORAGE_DRIVER = "s3";
    delete process.env.STORAGE_S3_BUCKET;
    expect(() => validateEnv()).toThrow(/STORAGE_S3_BUCKET/);

    process.env.STORAGE_S3_BUCKET = "docs";
    process.env.STORAGE_S3_REGION = "eu-central-1";
    expect(() => validateEnv()).toThrow(/AWS_ACCESS_KEY_ID/);

    process.env.AWS_ACCESS_KEY_ID = "AKIA";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    expect(() => validateEnv()).not.toThrow();
  });

  it("accepteert web-push met beide VAPID-sleutels", () => {
    baseValid();
    process.env.VAPID_PUBLIC_KEY = "BPublicKey";
    process.env.VAPID_PRIVATE_KEY = "privateKey";
    expect(() => validateEnv()).not.toThrow();
  });

  it("accepteert web-push volledig uit (geen VAPID-sleutels)", () => {
    baseValid();
    expect(() => validateEnv()).not.toThrow();
  });

  it("weigert een halve VAPID-configuratie (alleen publieke sleutel)", () => {
    baseValid();
    process.env.VAPID_PUBLIC_KEY = "BPublicKey";
    delete process.env.VAPID_PRIVATE_KEY;
    expect(() => validateEnv()).toThrow(/VAPID_PRIVATE_KEY/);
  });

  it("weigert een halve VAPID-configuratie (alleen private sleutel)", () => {
    baseValid();
    process.env.VAPID_PRIVATE_KEY = "privateKey";
    delete process.env.VAPID_PUBLIC_KEY;
    expect(() => validateEnv()).toThrow(/VAPID_PUBLIC_KEY/);
  });

  it("weigert een ongeldig VAPID_SUBJECT (geen mailto:/https:)", () => {
    baseValid();
    process.env.VAPID_PUBLIC_KEY = "BPublicKey";
    process.env.VAPID_PRIVATE_KEY = "privateKey";
    process.env.VAPID_SUBJECT = "support@zzp-platform.nl";
    expect(() => validateEnv()).toThrow(/VAPID_SUBJECT/);
  });

  it("accepteert een geldig mailto: VAPID_SUBJECT", () => {
    baseValid();
    process.env.VAPID_PUBLIC_KEY = "BPublicKey";
    process.env.VAPID_PRIVATE_KEY = "privateKey";
    process.env.VAPID_SUBJECT = "mailto:support@zzp-platform.nl";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist een Geoapify-key bij echte routing", () => {
    baseValid();
    process.env.ROUTING_PROVIDER = "geoapify";
    delete process.env.GEOAPIFY_API_KEY;
    expect(() => validateEnv()).toThrow(/GEOAPIFY_API_KEY/);
  });

  it("vereist de SMTP-variabelen bij EMAIL_DRIVER=smtp", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "smtp";
    expect(() => validateEnv()).toThrow(/EMAIL_SMTP_HOST/);
  });

  it("vereist RESEND_API_KEY en EMAIL_FROM bij EMAIL_DRIVER=resend", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "resend";
    expect(() => validateEnv()).toThrow(/RESEND_API_KEY/);
  });

  it("accepteert EMAIL_DRIVER=resend met key en afzender", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "resend";
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist POSTMARK_SERVER_TOKEN en EMAIL_FROM bij EMAIL_DRIVER=postmark", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "postmark";
    expect(() => validateEnv()).toThrow(/POSTMARK_SERVER_TOKEN/);
  });

  it("accepteert EMAIL_DRIVER=postmark met token en afzender", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "postmark";
    process.env.POSTMARK_SERVER_TOKEN = "pm_test_token";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist SES_REGION en EMAIL_FROM bij EMAIL_DRIVER=ses", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "ses";
    expect(() => validateEnv()).toThrow(/SES_REGION/);
  });

  it("vereist credentials bij EMAIL_DRIVER=ses (zonder SES_/AWS-sleutels)", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    expect(() => validateEnv()).toThrow(/SES_ACCESS_KEY_ID/);
  });

  it("accepteert EMAIL_DRIVER=ses met regio, afzender en SES-specifieke sleutels", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-west-1";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    process.env.SES_ACCESS_KEY_ID = "AKIA_TEST";
    process.env.SES_SECRET_ACCESS_KEY = "secret";
    expect(() => validateEnv()).not.toThrow();
  });

  it("accepteert EMAIL_DRIVER=ses met terugval op de generieke AWS-sleutels", () => {
    baseValid();
    process.env.EMAIL_DRIVER = "ses";
    process.env.SES_REGION = "eu-central-1";
    process.env.EMAIL_FROM = "ZZP <noreply@test.nl>";
    process.env.AWS_ACCESS_KEY_ID = "AKIA_AWS";
    process.env.AWS_SECRET_ACCESS_KEY = "aws-secret";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist MOLLIE_API_KEY bij BILLING_PROVIDER=mollie", () => {
    baseValid();
    process.env.BILLING_PROVIDER = "mollie";
    expect(() => validateEnv()).toThrow(/MOLLIE_API_KEY/);
  });

  it("vereist STRIPE_API_KEY + STRIPE_WEBHOOK_SECRET bij BILLING_PROVIDER=stripe", () => {
    baseValid();
    process.env.BILLING_PROVIDER = "stripe";
    expect(() => validateEnv()).toThrow(/STRIPE_API_KEY/);

    process.env.STRIPE_API_KEY = "sk_test_x";
    expect(() => validateEnv()).toThrow(/STRIPE_WEBHOOK_SECRET/);

    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist CLAMAV_HOST bij UPLOAD_SCANNER=clamav", () => {
    baseValid();
    process.env.UPLOAD_SCANNER = "clamav";
    expect(() => validateEnv()).toThrow(/CLAMAV_HOST/);

    process.env.CLAMAV_HOST = "clamd.internal";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist de DUO-endpoints bij DIPLOMA_VERIFIER=duo", () => {
    baseValid();
    process.env.DIPLOMA_VERIFIER = "duo";
    expect(() => validateEnv()).toThrow(/DUO_API_BASE/);
  });

  it("vereist de BIG-endpoints bij BIG_VERIFIER=bigregister", () => {
    baseValid();
    process.env.BIG_VERIFIER = "bigregister";
    expect(() => validateEnv()).toThrow(/BIG_API_BASE/);
  });

  it("vereist de iDIN-endpoints bij IDENTITY_VERIFIER=idin", () => {
    baseValid();
    process.env.IDENTITY_VERIFIER = "idin";
    expect(() => validateEnv()).toThrow(/IDENTITY_API_BASE/);
  });

  it("vereist de Upstash-secrets bij RATE_LIMIT_STORE=upstash", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "upstash";
    expect(() => validateEnv()).toThrow(/UPSTASH_REDIS_REST_URL/);
  });

  it("accepteert RATE_LIMIT_STORE=upstash mét beide Upstash-secrets", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "upstash";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    expect(() => validateEnv()).not.toThrow();
  });

  it("vereist REDIS_URL bij RATE_LIMIT_STORE=redis (halve activering blijft een harde fout)", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "redis";
    expect(() => validateEnv()).toThrow(/REDIS_URL/);
  });

  it("accepteert RATE_LIMIT_STORE=redis mét REDIS_URL", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "redis";
    process.env.REDIS_URL = "redis://localhost:6379";
    expect(() => validateEnv()).not.toThrow();
  });

  it("accepteert een rediss:// (TLS) REDIS_URL", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "redis";
    process.env.REDIS_URL = "rediss://default:pw@host:6380";
    expect(() => validateEnv()).not.toThrow();
  });

  it("crasht de boot NOOIT op een onbekende RATE_LIMIT_STORE-waarde — valt terug op memory (incident 2-9-2026)", () => {
    baseValid();
    process.env.RATE_LIMIT_STORE = "geen-bestaande-driver";
    const env = validateEnv();
    expect(env.RATE_LIMIT_STORE).toBe("memory");
  });

  it("blijft inert (geen fout) zolang een integratie niet is ingeschakeld", () => {
    baseValid();
    // Alle integratie-secrets ontbreken, maar de flags staan op de veilige default.
    expect(() => validateEnv()).not.toThrow();
  });

  describe("productie-aanbevelingen (waarschuwingen, geen harde boot-fail)", () => {
    function baseProd() {
      setEnv("NODE_ENV", "production");
      process.env.DATABASE_URL = "postgresql://localhost/zzp";
      process.env.AUTH_SECRET = "x".repeat(32);
      process.env.AUTH_URL = "https://app.zzp-platform.nl";
      process.env.SHARE_TOKEN_SECRET = "y".repeat(32);
      process.env.TWOFA_ENC_KEY = "z".repeat(32);
    }

    it("breekt de boot NIET als SHARE_TOKEN_SECRET ontbreekt, maar waarschuwt (graceful fallback, H-1)", () => {
      baseProd();
      delete process.env.SHARE_TOKEN_SECRET;
      expect(() => validateEnv()).not.toThrow();
      expect(envWarnings(validateEnv()).some((m) => /SHARE_TOKEN_SECRET/.test(m))).toBe(true);
    });

    it("breekt de boot NIET als AUTH_URL/NEXTAUTH_URL ontbreekt, maar waarschuwt", () => {
      baseProd();
      delete process.env.AUTH_URL;
      delete process.env.NEXTAUTH_URL;
      expect(() => validateEnv()).not.toThrow();
      expect(envWarnings(validateEnv()).some((m) => /AUTH_URL/.test(m))).toBe(true);
    });

    it("breekt de boot NIET bij een AUTH_SECRET < 32, maar waarschuwt", () => {
      baseProd();
      process.env.AUTH_SECRET = "x".repeat(20); // geldig (≥16), zwak voor prod
      expect(() => validateEnv()).not.toThrow();
      expect(envWarnings(validateEnv()).some((m) => /AUTH_SECRET/.test(m))).toBe(true);
    });

    it("accepteert een complete productieconfiguratie zonder deze waarschuwingen", () => {
      baseProd();
      expect(() => validateEnv()).not.toThrow();
      const w = envWarnings(validateEnv());
      expect(w.some((m) => /SHARE_TOKEN_SECRET|AUTH_URL|AUTH_SECRET/.test(m))).toBe(false);
    });
  });

  describe("bootstrap-beheerder", () => {
    it("accepteert geen enkele BOOTSTRAP_ADMIN_*-variabele (geen bootstrap-admin)", () => {
      baseValid();
      expect(() => validateEnv()).not.toThrow();
    });

    it("weigert alleen BOOTSTRAP_ADMIN_EMAIL (halve activering)", () => {
      baseValid();
      setEnv("BOOTSTRAP_ADMIN_EMAIL", "beheer@example.nl");
      expect(() => validateEnv()).toThrow(/BOOTSTRAP_ADMIN_PASSWORD/);
    });

    it("weigert alleen BOOTSTRAP_ADMIN_PASSWORD (halve activering)", () => {
      baseValid();
      setEnv("BOOTSTRAP_ADMIN_PASSWORD", "z".repeat(16));
      expect(() => validateEnv()).toThrow(/BOOTSTRAP_ADMIN_EMAIL/);
    });

    it("weigert een te zwak bootstrap-wachtwoord", () => {
      baseValid();
      setEnv("BOOTSTRAP_ADMIN_EMAIL", "beheer@example.nl");
      setEnv("BOOTSTRAP_ADMIN_PASSWORD", "demo1234");
      expect(() => validateEnv()).toThrow(/BOOTSTRAP_ADMIN_PASSWORD/);
    });

    it("weigert een ongeldig bootstrap-e-mailadres", () => {
      baseValid();
      setEnv("BOOTSTRAP_ADMIN_EMAIL", "geen-adres");
      setEnv("BOOTSTRAP_ADMIN_PASSWORD", "z".repeat(16));
      expect(() => validateEnv()).toThrow(/BOOTSTRAP_ADMIN_EMAIL/);
    });

    it("accepteert een geldige bootstrap-beheerder (beide gezet, sterk wachtwoord)", () => {
      baseValid();
      setEnv("BOOTSTRAP_ADMIN_EMAIL", "beheer@example.nl");
      setEnv("BOOTSTRAP_ADMIN_PASSWORD", "z".repeat(16));
      expect(() => validateEnv()).not.toThrow();
    });
  });
});

describe("rateLimitStoreDiagnostics", () => {
  it("meldt geen invalidValue voor een bekende waarde of een ontbrekende variabele", () => {
    expect(rateLimitStoreDiagnostics("memory")).toEqual({ invalidValue: null });
    expect(rateLimitStoreDiagnostics("upstash")).toEqual({ invalidValue: null });
    expect(rateLimitStoreDiagnostics("redis")).toEqual({ invalidValue: null });
    expect(rateLimitStoreDiagnostics(undefined)).toEqual({ invalidValue: null });
  });

  it("meldt de ruwe waarde terug bij een onbekende driver", () => {
    expect(rateLimitStoreDiagnostics("geen-bestaande-driver")).toEqual({
      invalidValue: "geen-bestaande-driver",
    });
  });
});

describe("envWarnings", () => {
  const prod = (over: Partial<Env>): Env =>
    ({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost/zzp",
      AUTH_SECRET: "x".repeat(32),
      SHARE_TOKEN_SECRET: "y".repeat(32),
      TWOFA_ENC_KEY: "z".repeat(32),
      AUTH_URL: "https://app.zzp-platform.nl",
      SENTRY_DSN: "https://example@o0.ingest.sentry.io/0",
      STORAGE_DRIVER: "s3",
      EMAIL_DRIVER: "smtp",
      CRON_SECRET: "cron",
      ROUTING_PROVIDER: "offline",
      SEMANTIC_MATCHER: "local",
      BILLING_PROVIDER: "noop",
      DIPLOMA_VERIFIER: "duo",
      BIG_VERIFIER: "bigregister",
      IDENTITY_VERIFIER: "idin",
      RATE_LIMIT_STORE: "upstash",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
      UPLOAD_SCANNER: "clamav",
      CLAMAV_HOST: "clamd.internal",
      DATABASE_CONNECTION_LIMIT: "10",
      ...over,
    }) as Env;

  it("geeft geen waarschuwingen buiten productie", () => {
    expect(envWarnings(prod({ NODE_ENV: "development", STORAGE_DRIVER: "local" }))).toEqual([]);
  });

  it("waarschuwt voor lokale opslag in productie", () => {
    const w = envWarnings(prod({ STORAGE_DRIVER: "local" }));
    expect(w.some((m) => /STORAGE_DRIVER=local/.test(m))).toBe(true);
  });

  it("waarschuwt voor het noop-mailkanaal in productie", () => {
    const w = envWarnings(prod({ EMAIL_DRIVER: "noop" }));
    expect(w.some((m) => /EMAIL_DRIVER=noop/.test(m))).toBe(true);
  });

  it("waarschuwt voor een ontbrekende CRON_SECRET en SQLite in productie", () => {
    const w = envWarnings(prod({ CRON_SECRET: undefined, DATABASE_URL: "file:./dev.db" }));
    expect(w.some((m) => /CRON_SECRET/.test(m))).toBe(true);
    expect(w.some((m) => /SQLite/.test(m))).toBe(true);
  });

  it("waarschuwt voor de in-memory rate-limit-store in productie", () => {
    const w = envWarnings(prod({ RATE_LIMIT_STORE: "memory" }));
    expect(w.some((m) => /RATE_LIMIT_STORE=memory/.test(m))).toBe(true);
  });

  it("zwijgt over de rate-limit-store bij RATE_LIMIT_STORE=redis", () => {
    const w = envWarnings(prod({ RATE_LIMIT_STORE: "redis", REDIS_URL: "redis://localhost:6379" }));
    expect(w.some((m) => /RATE_LIMIT_STORE=memory/.test(m))).toBe(false);
  });

  it("waarschuwt luid + benoemt de ruwe waarde wanneer RATE_LIMIT_STORE onbekend was en terugviel op memory (incident 2-9-2026)", () => {
    const w = envWarnings(prod({ RATE_LIMIT_STORE: "memory" }), { invalidValue: "redis-oud" });
    expect(w.some((m) => m.includes('RATE_LIMIT_STORE="redis-oud"') && /memory/.test(m))).toBe(
      true,
    );
  });

  it("zwijgt over de onbekende-waarde-waarschuwing wanneer er geen diagnose is (default)", () => {
    const w = envWarnings(prod({ RATE_LIMIT_STORE: "memory" }));
    expect(w.some((m) => m.includes("is geen geldige driver"))).toBe(false);
  });

  it("waarschuwt luid wanneer DB_TRANSITION_ACCEPT_DATA_LOSS=true staat (eenmalige noodrem)", () => {
    const w = envWarnings(prod({ DB_TRANSITION_ACCEPT_DATA_LOSS: "true" }));
    expect(
      w.some((m) => m.includes("DB_TRANSITION_ACCEPT_DATA_LOSS=true") && /verwijder/i.test(m)),
    ).toBe(true);
  });

  it("zwijgt over DB_TRANSITION_ACCEPT_DATA_LOSS zonder de vlag (normale staat)", () => {
    const w = envWarnings(prod({ DB_TRANSITION_ACCEPT_DATA_LOSS: undefined }));
    expect(w.some((m) => m.includes("DB_TRANSITION_ACCEPT_DATA_LOSS"))).toBe(false);
  });

  it("waarschuwt voor SEMANTIC_MATCHER=pgvector in productie (nog niet operationeel, lokale fallback)", () => {
    const w = envWarnings(prod({ SEMANTIC_MATCHER: "pgvector" }));
    expect(w.some((m) => /SEMANTIC_MATCHER=pgvector/.test(m) && /lokale fallback/.test(m))).toBe(
      true,
    );
  });

  it("zwijgt over de semantische matcher bij de lokale default", () => {
    expect(
      envWarnings(prod({ SEMANTIC_MATCHER: "local" })).some((m) => /SEMANTIC_MATCHER/.test(m)),
    ).toBe(false);
  });

  it("waarschuwt voor SEED_DEMO=true in productie (demo-accounts + onderdrukte verifier-waarschuwingen)", () => {
    const w = envWarnings(prod({ SEED_DEMO: "true" }));
    expect(w.some((m) => /SEED_DEMO=true/.test(m) && /demo1234/.test(m))).toBe(true);
  });

  it("zwijgt over SEED_DEMO wanneer het niet op true staat", () => {
    expect(envWarnings(prod({ SEED_DEMO: undefined })).some((m) => /SEED_DEMO/.test(m))).toBe(
      false,
    );
  });

  it("waarschuwt voor een ontbrekende DB-connectielimiet op Postgres in productie", () => {
    const w = envWarnings(prod({ DATABASE_CONNECTION_LIMIT: undefined }));
    expect(w.some((m) => /DATABASE_CONNECTION_LIMIT/.test(m))).toBe(true);
  });

  it("zwijgt over de connectielimiet op SQLite (geen gedeeld plafond)", () => {
    const w = envWarnings(
      prod({ DATABASE_URL: "file:./dev.db", DATABASE_CONNECTION_LIMIT: undefined }),
    );
    expect(w.some((m) => /DATABASE_CONNECTION_LIMIT/.test(m))).toBe(false);
  });

  it("waarschuwt voor de ontbrekende malware-scan in productie", () => {
    const w = envWarnings(prod({ UPLOAD_SCANNER: "noop" }));
    expect(w.some((m) => /UPLOAD_SCANNER=noop/.test(m))).toBe(true);
  });

  it("waarschuwt dat zelf-verificatie GEBLOKKEERD is als een demo-verifier op productie draait", () => {
    const w = envWarnings(prod({ BIG_VERIFIER: "demo" }));
    expect(w.some((m) => /demo-verifier.*GEBLOKKEERD|GEBLOKKEERD.*demo-verifier/.test(m))).toBe(
      true,
    );
  });

  it("waarschuwt LUID wanneer ALLOW_MOCK_VERIFICATION=true een demo-verifier op productie toestaat", () => {
    const w = envWarnings(prod({ IDENTITY_VERIFIER: "demo", ALLOW_MOCK_VERIFICATION: "true" }));
    expect(w.some((m) => /ALLOW_MOCK_VERIFICATION=true/.test(m) && /VERZONNEN/.test(m))).toBe(true);
  });

  it("zwijgt over verificatie bij een expliciete demo-dataset (SEED_DEMO=true)", () => {
    const w = envWarnings(prod({ DIPLOMA_VERIFIER: "demo", SEED_DEMO: "true" }));
    expect(w.some((m) => /demo-verifier/.test(m))).toBe(false);
  });

  it("zwijgt bij een volledig geconfigureerde productie", () => {
    expect(envWarnings(prod({}))).toEqual([]);
  });
});
