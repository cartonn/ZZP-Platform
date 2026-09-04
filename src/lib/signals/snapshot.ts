// Signaal-snapshot: één lezing voor de hele app-shell.
//
// WAT DIT WEL IS: een cache van de UITKOMST van de bestaande berekening. `recomputeSignalSnapshot`
// roept letterlijk `navBadges` (signals.ts), `pendingTaskCount` (actions/pending-tasks.ts) en de
// ongelezen-meldingenteller aan, en bewaart wat daaruit komt. De tel-logica en de bewust GESCHEIDEN
// vensters daarin (#1022/#1026) blijven ongemoeid — samenvoegen zou de ondertellingen terugbrengen
// die daar zijn gefixt.
//
// WAT DIT NIET IS: een tweede waarheid. Ontbreekt de rij, hoort hij bij een andere rol, is hij van
// een oudere `SIGNAL_SNAPSHOT_VERSION` of verlopen, dan herberekent de lezer synchroon — precies het
// huidige gedrag, alleen met een terugschrijf. De cache kan dus nooit een badge tonen die de
// berekening niet zou geven; hij kan er hooguit `SIGNAL_SNAPSHOT_TTL_MS` over doen om mee te bewegen.
//
// VERSSHEID (de keuze, met motivatie). Er zijn 68 losse `notification.create`-plaatsen en tientallen
// serveracties die rechtstreeks naar Prisma schrijven zonder DomainEvent — een sluitende, expliciete
// invalidatie op élk van die paden is niet te garanderen en zou stil verouderen zodra iemand een
// pad toevoegt. Daarom is de bodemgarantie een KORTE TTL (60 s): wat de invalidatie mist, verloopt
// vanzelf, en niets kan permanent achterlopen. Daarbovenop staat expliciete invalidatie op de
// zwaarste paden (de cascade-chokepoint `persistEventAndEffects`) en de uurlijkse sweep in
// `signal-snapshot-reconcile-task.ts`, die via `SIGNAL_INVALIDATION` de betrokken gebruikers van
// verse DomainEvents leegt én meet of de bewaarde waarde nog klopt (drift = bug).

import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/observability/logger";
import { type BadgeTone, type NavBadges, navBadges } from "@/lib/signals";
import { pendingTaskCount } from "@/lib/actions/pending-tasks";
import { type UserRole } from "@/lib/enums";

// De write-kant staat apart (invalidate.ts) zodat schrijfpaden 'm kunnen aanroepen zonder de hele
// berekening te importeren; hier alleen doorgegeven voor de consumenten van dit bestand.
export { invalidateSignals } from "@/lib/signals/invalidate";

/**
 * Ophogen zodra de BETEKENIS van de bewaarde velden verandert (andere badge-sleutels, andere
 * telling). Bewaarde rijen met een lagere versie worden genegeerd en herberekend — geen migratie
 * nodig, geen stille mengeling van oude en nieuwe waarden.
 */
export const SIGNAL_SNAPSHOT_VERSION = 1;

/** Bodemgarantie op verssheid: een snapshot is hooguit een minuut oud. */
export const SIGNAL_SNAPSHOT_TTL_MS = 60_000;

/** Wat de app-shell nodig heeft: de badges, de /acties-teller en de bel-teller. */
export interface SignalSnapshot {
  badges: NavBadges;
  pendingTaskCount: number;
  unreadNotifications: number;
  computedAt: Date;
  /** True = zojuist herberekend (cache-miss, verlopen of ongeldig), false = uit de snapshot gelezen. */
  recomputed: boolean;
}

/** Eén bewaarde badge-rij (zoals `UserSignalBadge` 'm teruggeeft). */
export interface StoredBadgeRow {
  href: string;
  count: number;
  tone: string;
}

/** Alleen de velden die de verssheidstoets nodig heeft. */
export interface StoredSnapshotRow {
  role: string;
  version: number;
  staleAfter: Date;
}

/** Onbekende tonen vallen terug op de rustige toon — nooit een verzonnen alarm. */
function toTone(value: string): BadgeTone {
  return value === "attention" ? "attention" : "info";
}

/** Bewaarde rijen → de `NavBadges`-vorm die de nav-componenten al kennen. Puur. */
export function toNavBadges(rows: readonly StoredBadgeRow[]): NavBadges {
  const badges: NavBadges = {};
  for (const row of rows) {
    // Een 0-telling hoort niet in de snapshot (buildBadges filtert die weg); mocht hij er toch
    // staan, dan tonen we 'm niet — de UI zou anders een lege badge renderen.
    if (row.count > 0) badges[row.href] = { count: row.count, tone: toTone(row.tone) };
  }
  return badges;
}

/** `NavBadges` → bewaarde rijen. Puur; stabiele volgorde (href) zodat diffs leesbaar blijven. */
export function toBadgeRows(
  userId: string,
  badges: NavBadges,
): (StoredBadgeRow & { userId: string })[] {
  return Object.entries(badges)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([href, badge]) => ({ userId, href, count: badge.count, tone: badge.tone }));
}

/**
 * Mag deze bewaarde rij gebruikt worden? Alleen als hij bij dezelfde rol hoort, van de huidige
 * versie is en nog niet verlopen. Puur, los testbaar — dit is de hele cache-beslissing.
 */
export function isSnapshotUsable(
  row: StoredSnapshotRow | null,
  role: UserRole,
  now: Date,
): row is StoredSnapshotRow {
  if (!row) return false;
  if (row.role !== role) return false;
  if (row.version !== SIGNAL_SNAPSHOT_VERSION) return false;
  return row.staleAfter.getTime() > now.getTime();
}

/** Verschillen tussen twee signaalstanden, als leesbare sleutels. Puur — de drift-meter. */
export function diffSignals(
  stored: Pick<SignalSnapshot, "badges" | "pendingTaskCount" | "unreadNotifications">,
  fresh: Pick<SignalSnapshot, "badges" | "pendingTaskCount" | "unreadNotifications">,
): string[] {
  const diffs: string[] = [];
  if (stored.pendingTaskCount !== fresh.pendingTaskCount) diffs.push("pendingTaskCount");
  if (stored.unreadNotifications !== fresh.unreadNotifications) diffs.push("unreadNotifications");
  const hrefs = new Set([...Object.keys(stored.badges), ...Object.keys(fresh.badges)]);
  for (const href of [...hrefs].sort()) {
    const a = stored.badges[href];
    const b = fresh.badges[href];
    if (a?.count !== b?.count || a?.tone !== b?.tone) diffs.push(href);
  }
  return diffs;
}

/**
 * De berekening zelf — exact de drie bronnen die de app-shell vandaag ook aanroept, in dezelfde
 * `Promise.all`. Geen eigen queries op badge-data: dit bestand telt niets.
 */
async function computeSignals(
  userId: string,
  role: UserRole,
): Promise<Pick<SignalSnapshot, "badges" | "pendingTaskCount" | "unreadNotifications">> {
  const [badges, tasks, unread] = await Promise.all([
    navBadges(role, userId),
    pendingTaskCount(userId, role),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { badges, pendingTaskCount: tasks, unreadNotifications: unread };
}

/**
 * Gebruikers waarvoor op dit moment al een snapshot-write loopt (per proces). Zonder deze grendel
 * levert één navigatie een handvol gelijktijdige writes op: Next rendert de shell ook voor élke
 * prefetch, en die missen allemaal dezelfde koude cache. Op PostgreSQL is dat verspilling; op SQLite
 * (lokaal + CI) is het schadelijk — een schrijftransactie houdt daar een exclusieve grendel op het
 * hele bestand en laat gelijktijdige LEZERS wachten, waardoor de hele app trager wordt.
 */
const writesInFlight = new Set<string>();

/** De write zelf, best-effort: een cache mag een paginarender nooit omverhalen. */
async function writeSnapshot(
  userId: string,
  base: {
    role: string;
    pendingTaskCount: number;
    unreadNotifications: number;
    version: number;
    computedAt: Date;
    staleAfter: Date;
  },
  badges: NavBadges,
): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.userSignalSnapshot.upsert({
        where: { userId },
        create: { userId, ...base },
        update: base,
      }),
      // Vervangen, niet mergen: een badge die op 0 kwam moet verdwijnen, niet blijven staan.
      prisma.userSignalBadge.deleteMany({ where: { userId } }),
      prisma.userSignalBadge.createMany({ data: toBadgeRows(userId, badges) }),
    ]);
  } catch (err) {
    logger.warn("signal-snapshot: wegschrijven mislukt", { userId, err: String(err) });
  }
}

/**
 * Herbereken en schrijf de snapshot weg (en wácht op die write). Dit is het pad voor de
 * reconciliatietaak, die deterministisch moet zijn. De renderkant gebruikt bewust
 * `recomputeSignalSnapshotDeferred`.
 */
export async function recomputeSignalSnapshot(
  userId: string,
  role: UserRole,
  now: Date = new Date(),
): Promise<SignalSnapshot> {
  const computed = await computeSignals(userId, role);
  await writeSnapshot(userId, snapshotBase(role, computed, now), computed.badges);
  return { ...computed, computedAt: now, recomputed: true };
}

function snapshotBase(
  role: UserRole,
  computed: Pick<SignalSnapshot, "pendingTaskCount" | "unreadNotifications">,
  now: Date,
) {
  return {
    role,
    pendingTaskCount: computed.pendingTaskCount,
    unreadNotifications: computed.unreadNotifications,
    version: SIGNAL_SNAPSHOT_VERSION,
    computedAt: now,
    staleAfter: new Date(now.getTime() + SIGNAL_SNAPSHOT_TTL_MS),
  };
}

/**
 * Herbereken en vul de cache op de ACHTERGROND: de aanroeper krijgt de verse waarden zodra de
 * berekening klaar is en wacht niet op de write.
 *
 * Waarom niet gewoon wachten: het vullen van een cache is geen werk waar een paginarender op hoort
 * te wachten, en op SQLite blokkeert die write ook nog eens elke gelijktijdige lezer. Gemeten in de
 * e2e-suite (CI): met een gewachte write werd élke test 2–3× trager (bv. het actiecentrum 4,0 s →
 * 13,9 s); zonder is de latency van de render gelijk aan de oude berekening. De grendel
 * (`writesInFlight`) zorgt dat één koude gebruiker hooguit één write tegelijk veroorzaakt, hoeveel
 * gelijktijdige renders/prefetches er ook binnenkomen.
 */
async function recomputeSignalSnapshotDeferred(
  userId: string,
  role: UserRole,
  now: Date,
): Promise<SignalSnapshot> {
  const computed = await computeSignals(userId, role);
  if (!writesInFlight.has(userId)) {
    writesInFlight.add(userId);
    void writeSnapshot(userId, snapshotBase(role, computed, now), computed.badges).finally(() => {
      writesInFlight.delete(userId);
    });
  }
  return { ...computed, computedAt: now, recomputed: true };
}

/**
 * De lezer voor de app-shell: één `findUnique` (met de badge-rijen). Is de rij bruikbaar, dan is dit
 * de hele kost van de shell-signalen; anders herberekent hij synchroon — het huidige gedrag als
 * fallback, dus nooit een lege of achterlopende shell. Het terugschrijven van die herberekening
 * gebeurt op de achtergrond, zodat de render nooit op een cache-vulling wacht.
 *
 * Request-gecachet (React `cache`), net als `navBadges` en `computeTasks`: dezelfde render mag dit
 * meerdere keren vragen zonder een tweede lezing.
 */
export const readSignalSnapshot = cache(async function readSignalSnapshot(
  userId: string,
  role: UserRole,
): Promise<SignalSnapshot> {
  const now = new Date();
  let row:
    | (StoredSnapshotRow & { computedAt: Date; badges: StoredBadgeRow[] } & Pick<
          SignalSnapshot,
          "pendingTaskCount" | "unreadNotifications"
        >)
    | null = null;
  try {
    row = await prisma.userSignalSnapshot.findUnique({
      where: { userId },
      select: {
        role: true,
        version: true,
        staleAfter: true,
        computedAt: true,
        pendingTaskCount: true,
        unreadNotifications: true,
        badges: { select: { href: true, count: true, tone: true } },
      },
    });
  } catch (err) {
    // Een leesfout mag nooit een pagina breken: val terug op de volledige berekening.
    logger.warn("signal-snapshot: lezen mislukt", { userId, err: String(err) });
  }
  if (isSnapshotUsable(row, role, now) && row) {
    return {
      badges: toNavBadges(row.badges),
      pendingTaskCount: row.pendingTaskCount,
      unreadNotifications: row.unreadNotifications,
      computedAt: row.computedAt,
      recomputed: false,
    };
  }
  return recomputeSignalSnapshotDeferred(userId, role, now);
});
