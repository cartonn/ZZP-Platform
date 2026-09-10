// Generieke opslag-kant van ALLE aflever-heartbeats (dead-man's-switches) van het platform. Vervangt de
// tien identieke `*DeliveryHeartbeat`-modellen door één tabel met een `channel`-kolom: de velden waren
// per kanaal al hetzelfde (tijdstippen + uitkomst + teller + driver-modus), alleen de tabelnaam verschilde.
// De enige echte variatie zat in `driver` (het push-kanaal kent er geen) — die kolom is daarom nullable,
// zodat we géén Json-blob of per-kanaal-kolommenrij nodig hebben en de kolom in SQL vindbaar/filterbaar blijft.
//
// Deze module bevat UITSLUITEND de DB-interactie + de write-coalescing. Het inhoudelijke oordeel blijft
// per kanaal in de bijbehorende `*-delivery-freshness.ts` (event-gedreven: de uitkomst van de laatste
// operatie, niet de leeftijd ervan) — die teksten zijn kanaal-specifiek en veranderen hier niet.
//
// Bevat nooit persoonsgegevens, sleutels, endpoints of foutinhoud — alleen tijdstippen, de uitkomst,
// de opeenvolgende-mislukkingen-teller en de driver-modus (configuratie).

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
// LET OP — `report.ts` wordt bewust DYNAMISCH geladen (in reportHeartbeatError), niet statisch: report.ts
// importeert de error-monitoring-heartbeat, die deze module importeert. Een statische import maakt daar een
// module-cyclus van, waardoor de registratie hieronder tijdens het laden nog in de temporal dead zone zit.

/** Ruwe heartbeat-velden zoals elke `*-delivery-freshness.ts`-evaluator ze verwacht. */
export interface DeliveryHeartbeatFields {
  lastAttemptAt: Date | null;
  lastOk: boolean | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  consecutiveFailures: number;
  /** Driver-/providermodus bij de laatste poging, of null (kanalen zonder driver-begrip, bv. web-push). */
  driver: string | null;
}

/**
 * Beschrijving van één bewaakt afleverkanaal. `channel` is de rij-id in `DeliveryHeartbeat` en moet uniek
 * zijn over alle kanalen (één gedeelde tabel = één gedeelde sleutelruimte).
 */
export interface HeartbeatChannelSpec {
  /** Canonieke kanaal-id (primaire sleutel van de rij). */
  readonly channel: string;
  /** `StatusItem.key` waaronder dit kanaal op /admin/systeemstatus verschijnt. */
  readonly statusItemKey: string;
  /** Bronnaam voor de foutrapportage/log bij een mislukte heartbeat-schrijf of -lezing. */
  readonly source: string;
  /** Pad-prefix voor `reportError` (`<prefix>/<channel>`); alleen gebruikt bij sink "report". */
  readonly requestPathPrefix: string;
  /**
   * Waar een mislukte heartbeat-schrijf/-lezing heen gaat. "report" is de norm; kanalen die zélf in het
   * foutrapportage-pad zitten (error-monitoring, upload-scan, routing) loggen rechtstreeks om terugkoppeling
   * te vermijden.
   */
  readonly errorSink: "report" | "log";
  /**
   * Env-variabele die het success-coalescing-venster (ms) stuurt. Aanwezig = geslaagde operaties worden
   * gecoalesceerd (hooguit één schrijf per venster per proces) omdat het kanaal op een hot path zit.
   * Afwezig = elke operatie schrijft.
   */
  readonly coalesceEnvVar?: string;
}

/**
 * Registratie van élk bewaakt afleverkanaal. Eén bron van waarheid: de kanaal-id's zijn hier uniek en de
 * coveragetest bewaakt dat elk kanaal ook daadwerkelijk een posture-item op /admin/systeemstatus krijgt.
 */
export const HEARTBEAT_CHANNELS = [
  {
    channel: "outbound",
    statusItemKey: "mail-delivery-heartbeat",
    source: "mail-delivery-heartbeat",
    requestPathPrefix: "/mail",
    errorSink: "report",
  },
  {
    channel: "web-push",
    statusItemKey: "push-delivery-heartbeat",
    source: "push-delivery-heartbeat",
    requestPathPrefix: "/push",
    errorSink: "report",
  },
  {
    channel: "object-storage",
    statusItemKey: "storage-delivery-heartbeat",
    source: "storage-delivery-heartbeat",
    requestPathPrefix: "/storage",
    errorSink: "report",
  },
  {
    channel: "payment-provider",
    statusItemKey: "billing-delivery-heartbeat",
    source: "billing-delivery-heartbeat",
    requestPathPrefix: "/billing",
    errorSink: "report",
  },
  {
    channel: "verification-diploma",
    statusItemKey: "verification-delivery-heartbeat",
    source: "verification-delivery-heartbeat",
    requestPathPrefix: "/verification",
    errorSink: "report",
  },
  {
    channel: "verification-big",
    statusItemKey: "verification-delivery-heartbeat",
    source: "verification-delivery-heartbeat",
    requestPathPrefix: "/verification",
    errorSink: "report",
  },
  {
    channel: "verification-identity",
    statusItemKey: "verification-delivery-heartbeat",
    source: "verification-delivery-heartbeat",
    requestPathPrefix: "/verification",
    errorSink: "report",
  },
  {
    channel: "rate-limit-store",
    statusItemKey: "ratelimit-delivery-heartbeat",
    source: "ratelimit-delivery-heartbeat",
    requestPathPrefix: "/ratelimit",
    errorSink: "report",
    coalesceEnvVar: "RATELIMIT_HEARTBEAT_COALESCE_MS",
  },
  {
    channel: "password-breach",
    statusItemKey: "password-breach-delivery-heartbeat",
    source: "password-breach-delivery-heartbeat",
    requestPathPrefix: "/password-breach",
    errorSink: "report",
  },
  {
    channel: "error-monitoring",
    statusItemKey: "error-monitoring-delivery-heartbeat",
    source: "error-monitoring-delivery-heartbeat",
    requestPathPrefix: "/error-monitoring",
    errorSink: "log",
    coalesceEnvVar: "ERROR_MONITORING_HEARTBEAT_COALESCE_MS",
  },
  {
    channel: "upload-scan",
    statusItemKey: "upload-scan-delivery-heartbeat",
    source: "upload-scan-delivery-heartbeat",
    requestPathPrefix: "/upload-scan",
    errorSink: "log",
    coalesceEnvVar: "UPLOAD_SCAN_HEARTBEAT_COALESCE_MS",
  },
  {
    channel: "routing",
    statusItemKey: "routing-delivery-heartbeat",
    source: "routing-delivery-heartbeat",
    requestPathPrefix: "/routing",
    errorSink: "log",
    coalesceEnvVar: "ROUTING_HEARTBEAT_COALESCE_MS",
  },
] as const satisfies readonly HeartbeatChannelSpec[];

/** Kanaal-id's die daadwerkelijk in de registratie staan. */
export type HeartbeatChannelId = (typeof HEARTBEAT_CHANNELS)[number]["channel"];

const SPEC_BY_CHANNEL = new Map<string, HeartbeatChannelSpec>(
  HEARTBEAT_CHANNELS.map((spec) => [spec.channel, spec]),
);

/**
 * Zoekt de spec van een geregistreerd kanaal op. Typegecontroleerd: een kanaal dat niet in
 * `HEARTBEAT_CHANNELS` staat, compileert niet — zo blijft de registratie de enige bron van waarheid.
 */
export function heartbeatChannelSpec(channel: HeartbeatChannelId): HeartbeatChannelSpec {
  const spec = SPEC_BY_CHANNEL.get(channel);
  /* c8 ignore next */
  if (!spec) throw new Error(`Onbekend heartbeat-kanaal: ${channel}`);
  return spec;
}

const DEFAULT_COALESCE_MS = 15_000;
const MIN_COALESCE_MS = 0;
const MAX_COALESCE_MS = 300_000;

/** Per-proces coalescing-state per kanaal. `lastRecordedOk === null` = nog niets sinds boot. */
interface CoalesceState {
  lastRecordedOk: boolean | null;
  lastSuccessWriteMs: number;
}
const coalesceState = new Map<string, CoalesceState>();

function stateFor(channel: string): CoalesceState {
  let state = coalesceState.get(channel);
  if (!state) {
    state = { lastRecordedOk: null, lastSuccessWriteMs: 0 };
    coalesceState.set(channel, state);
  }
  return state;
}

/** Leest + klemt het success-coalescing-venster (ms). `0` schakelt coalescing bewust uit. */
function resolveCoalesceMs(envVar: string): number {
  const raw = process.env[envVar];
  if (raw === undefined || raw === "") return DEFAULT_COALESCE_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_COALESCE_MS;
  return Math.min(MAX_COALESCE_MS, Math.max(MIN_COALESCE_MS, Math.floor(parsed)));
}

/**
 * Meldt een mislukte heartbeat-schrijf/-lezing. Faalt nooit naar buiten: de heartbeat is observability,
 * geen kernpad — een DB-storing hier mag de geslaagde operatie niet alsnog laten falen.
 */
async function reportHeartbeatError(
  spec: HeartbeatChannelSpec,
  channel: string,
  op: "success" | "failure" | "read",
  error: unknown,
): Promise<void> {
  if (spec.errorSink === "log") {
    logger.error(spec.source, {
      op,
      channel,
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    return;
  }
  const { reportError } = await import("@/lib/observability/report");
  await reportError(error, {
    source: spec.source,
    requestPath: `${spec.requestPathPrefix}/${channel}`,
  });
}

/**
 * Registreert dat een operatie via het echte kanaal zojuist SLAAGDE: markeert het kanaal als operationeel
 * en zet de opeenvolgende-mislukkingen-teller terug op 0.
 *
 * Kanalen met `coalesceEnvVar` schrijven hooguit één success per venster (ze zitten op een hot path), maar
 * altijd meteen bij een HERSTEL (eerste success ná een mislukking) of de eerste operatie sinds boot — zodat
 * een opgeloste storing de melding direct wist. De DB-rij blijft de bron van waarheid; de in-memory vlaggen
 * sturen alleen de schrijf-frequentie.
 */
export async function recordHeartbeatSuccess(
  spec: HeartbeatChannelSpec,
  driver: string | null = null,
  now: Date = new Date(),
  channel: string = spec.channel,
): Promise<void> {
  const state = stateFor(channel);
  if (spec.coalesceEnvVar) {
    const coalesceMs = resolveCoalesceMs(spec.coalesceEnvVar);
    if (state.lastRecordedOk === true && coalesceMs > 0) {
      if (now.getTime() - state.lastSuccessWriteMs < coalesceMs) return;
    }
  }
  try {
    await prisma.deliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver,
      },
      update: {
        lastAttemptAt: now,
        lastOk: true,
        lastSuccessAt: now,
        consecutiveFailures: 0,
        driver,
      },
    });
    // Alleen ná een geslaagde schrijf de coalescing-state bijwerken, zodat een mislukte schrijf niet stil
    // wordt weggecoalesceerd (de volgende success probeert dan opnieuw).
    state.lastRecordedOk = true;
    state.lastSuccessWriteMs = now.getTime();
  } catch (error) {
    await reportHeartbeatError(spec, channel, "success", error);
  }
}

/**
 * Registreert dat een operatie via het echte kanaal zojuist MISLUKTE: markeert het kanaal als afwijzend en
 * telt de opeenvolgende-mislukkingen-teller atomair op (zodat een monitor op een AANHOUDENDE storing kan
 * alarmeren i.p.v. op één transiënte fout). Wordt altijd direct geschreven, nooit gecoalesceerd.
 */
export async function recordHeartbeatFailure(
  spec: HeartbeatChannelSpec,
  driver: string | null = null,
  now: Date = new Date(),
  channel: string = spec.channel,
): Promise<void> {
  // Markeer de intentie meteen "failing" zodat de eerstvolgende success (herstel) sowieso schrijft — ook als
  // de onderstaande schrijf zelf faalt.
  stateFor(channel).lastRecordedOk = false;
  try {
    await prisma.deliveryHeartbeat.upsert({
      where: { channel },
      create: {
        channel,
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: 1,
        driver,
      },
      update: {
        lastAttemptAt: now,
        lastOk: false,
        lastFailureAt: now,
        consecutiveFailures: { increment: 1 },
        driver,
      },
    });
  } catch (error) {
    await reportHeartbeatError(spec, channel, "failure", error);
  }
}

/**
 * Leest één heartbeat-rij. Faalt nooit naar buiten: bij een leesfout wordt `null` teruggegeven (neutraal —
 * de evaluator maakt daar "never" van) i.p.v. een 500 op het admin-scherm of het metrics-endpoint.
 */
export async function readHeartbeat(
  spec: HeartbeatChannelSpec,
  channel: string = spec.channel,
): Promise<DeliveryHeartbeatFields | null> {
  try {
    const row = await prisma.deliveryHeartbeat.findUnique({ where: { channel } });
    if (!row) return null;
    return {
      lastAttemptAt: row.lastAttemptAt,
      lastOk: row.lastOk,
      lastSuccessAt: row.lastSuccessAt,
      lastFailureAt: row.lastFailureAt,
      consecutiveFailures: row.consecutiveFailures,
      driver: row.driver,
    };
  } catch (error) {
    await reportHeartbeatError(spec, channel, "read", error);
    return null;
  }
}

/**
 * Leest meerdere heartbeat-rijen in één query (bv. de drie verificatieregisters). Faalt nooit naar buiten:
 * bij een leesfout komt er een lege map terug, waarna elk kanaal als "never" wordt beoordeeld.
 */
export async function readHeartbeats(
  spec: HeartbeatChannelSpec,
  channels: readonly string[],
): Promise<Map<string, DeliveryHeartbeatFields>> {
  try {
    // unbounded-allow: begrensd door de meegegeven kanaal-id-lijst (hooguit een handvol singleton-rijen).
    const rows = await prisma.deliveryHeartbeat.findMany({
      where: { channel: { in: [...channels] } },
    });
    return new Map(
      rows.map((row) => [
        row.channel,
        {
          lastAttemptAt: row.lastAttemptAt,
          lastOk: row.lastOk,
          lastSuccessAt: row.lastSuccessAt,
          lastFailureAt: row.lastFailureAt,
          consecutiveFailures: row.consecutiveFailures,
          driver: row.driver,
        } satisfies DeliveryHeartbeatFields,
      ]),
    );
  } catch (error) {
    await reportHeartbeatError(spec, "overview", "read", error);
    return new Map();
  }
}

/** Test-only: reset de per-proces coalescing-state zodat testcases onafhankelijk zijn. */
export function __resetHeartbeatCoalescing(): void {
  coalesceState.clear();
}
