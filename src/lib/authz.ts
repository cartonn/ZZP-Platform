// Autorisatie-helpers. De mutatieketen (CLAUDE.md regel 2) is:
//   auth -> rol -> ownership -> Zod -> actie -> audit.
// Dit bestand levert de auth/rol/ownership-stappen. De pure predicaten zijn
// los unit-getest; de async wrappers halen de huidige gebruiker uit Auth.js.

import { cache } from "react";
import { type UserRole } from "@/lib/enums";

export interface Actor {
  id: string;
  role: UserRole;
  status: string;
  /** true = geforceerde wachtwoordwijziging vereist (bv. na bulk-import). Optioneel: testliterals
   *  hoeven dit niet te zetten; de middleware leest de vlag uit de sessie. */
  mustChangePassword?: boolean;
  /** Franchise-lidmaatschap. `null`/`undefined` = directe platformgebruiker (geen tenant). De
   *  tenant-scoping (src/lib/tenancy.ts) leunt hierop; ADMIN negeert het en ziet alle tenants. */
  tenantId?: string | null;
}

export class AuthorizationError extends Error {
  readonly status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export function isAdmin(actor: Actor | null | undefined): boolean {
  return actor?.role === "ADMIN";
}

export function hasRole(actor: Actor | null | undefined, ...roles: UserRole[]): boolean {
  return !!actor && roles.includes(actor.role);
}

/** Eigenaar van de resource, of admin. */
export function owns(actor: Actor | null | undefined, ownerId: string): boolean {
  return !!actor && (actor.id === ownerId || actor.role === "ADMIN");
}

/** Werpt 401 als er geen (actieve) actor is; geeft anders een non-null actor terug. */
export function assertAuthenticated(actor: Actor | null | undefined): asserts actor is Actor {
  if (!actor) {
    throw new AuthorizationError("Niet ingelogd.", 401);
  }
  if (actor.status !== "ACTIVE") {
    throw new AuthorizationError("Account is niet actief.", 403);
  }
}

/** Werpt 401/403 als de actor niet één van de toegestane rollen heeft. */
export function assertRole(
  actor: Actor | null | undefined,
  ...roles: UserRole[]
): asserts actor is Actor {
  assertAuthenticated(actor);
  if (!roles.includes(actor.role)) {
    throw new AuthorizationError(`Geen toegang: vereist rol ${roles.join(" of ")}.`, 403);
  }
}

/** Werpt 403 als de actor geen eigenaar (of admin) is van de resource. */
export function assertOwnership(
  actor: Actor | null | undefined,
  ownerId: string,
): asserts actor is Actor {
  assertAuthenticated(actor);
  if (!owns(actor, ownerId)) {
    throw new AuthorizationError("Geen toegang tot deze resource.", 403);
  }
}

// --- Async glue (Auth.js). Lazy import zodat unit-tests de pure functies kunnen
//     testen zonder next-auth/prisma in te laden. ---

/**
 * Verse rol/status uit de DB, per request gememoïseerd (React cache) zodat meerdere
 * currentActor()-aanroepen binnen één request maar één query doen.
 */
const loadFreshUser = cache(async (userId: string) => {
  const { prisma } = await import("@/lib/db");
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      status: true,
      mustChangePassword: true,
      anonymizedAt: true,
      tenantId: true,
      passwordChangedAt: true,
      // Tenant-status live meelezen zodat een geschorste franchise (Tenant.status !== "ACTIVE") de
      // toegang van ál haar leden fail-closed intrekt — zie tenantAccessBlocked / currentActor.
      tenant: { select: { status: true } },
    },
  });
});

/**
 * Fail-closed tenant-poort: een lid van een GESCHORSTE tenant (`Tenant.status !== "ACTIVE"`) verliest
 * live alle toegang, exact zoals een geschorst `User`-account. Suspendeert de platform-admin een
 * franchise (bv. bij wanbetaling/fraude), dan moet díe ene switch de héle tenant bevriezen — de
 * franchiser én elke roster-ZZP'er/opdrachtgever die via `tenantId` aan de tenant hangt — en niet
 * alleen een UI-signaal geven. `currentActor()` behandelt een geblokkeerde tenant als uitgelogd,
 * naast de status/anonimisering/wachtwoord-poorten. OWASP A01 (Broken Access Control — ontbrekende
 * autorisatie-afdwinging op een bestaand statusveld).
 *
 * Een gebruiker zónder tenant (`tenantId == null`, directe platformgebruiker) wordt hier nooit door
 * geblokkeerd. Is er wél een tenant maar is de status onbekend (`null`/`undefined`), dan blokkeren we
 * fail-closed: de `Tenant`-rij bestaat altijd zolang `tenantId` gezet is (FK), dus dat pad duidt op een
 * niet-geladen relatie en de veilige keuze is weigeren, niet doorlaten.
 */
export function tenantAccessBlocked(
  tenantId: string | null | undefined,
  tenantStatus: string | null | undefined,
): boolean {
  if (!tenantId) return false;
  return tenantStatus !== "ACTIVE";
}

/**
 * True als de sessie is aangemaakt vóór de laatste wachtwoordwijziging van dit account. De JWT is
 * stateless (geen server-side sessiestore), dus een wachtwoord-reset/-wijziging op één apparaat kan
 * een gestolen/oude sessie op een ánder apparaat niet intrekken — tenzij we de generatie-stempel
 * live toetsen. `currentActor()` behandelt een sessie die dit predicaat matcht als uitgelogd
 * (fail-closed), net als voor status/anonimisering. OWASP A07 (Identification & Authentication
 * Failures — session-invalidatie bij credentialwijziging).
 *
 * `sessionStamp` is de bevroren epoch-millis uit de JWT (op inlogmoment); `freshChangedAt` de live
 * DB-waarde. **Fail-open alléén** wanneer de sessie geen stempel draagt (pre-feature token dat nog
 * niet opnieuw is gemunt): binnen de 8u-`maxAge` cyclet zo'n token vanzelf naar een gestempelde
 * versie, dus het venster is begrensd en we loggen niet elke bestaande sessie uit bij de deploy.
 */
export function sessionPredatesPasswordChange(
  sessionStamp: number | null | undefined,
  freshChangedAt: Date | null | undefined,
): boolean {
  if (sessionStamp == null || freshChangedAt == null) return false;
  return freshChangedAt.getTime() > sessionStamp;
}

/**
 * Huidige actor of `null`. Gebruik in read-paden waar anoniem toegestaan is.
 *
 * Server-side is de waarheid (CLAUDE.md regel 1): rol/status worden LIVE uit de DB geladen, niet
 * uit de (tot ~30 dagen geldige) JWT. Daardoor verliest een geschorste, gedegradeerde of
 * geanonimiseerde gebruiker direct toegang i.p.v. pas bij token-expiry — de stale client-token
 * beslist niets meer.
 */
export async function currentActor(): Promise<Actor | null> {
  const { auth } = await import("@/auth");
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  const fresh = await loadFreshUser(user.id);
  // Verwijderd, geanonimiseerd of niet-actief (geschorst) → geen actor. Een mid-sessie geschorst
  // account verliest zo live de toegang; read-paden die op currentActor() leunen (bv. zoeken)
  // behandelen het als uitgelogd, ook met een nog geldige JWT.
  if (!fresh || fresh.anonymizedAt || fresh.status !== "ACTIVE") return null;

  // Sessie van vóór de laatste wachtwoordwijziging → uitgelogd. Zo maakt een reset/wijziging op één
  // apparaat élke bestaande (stateless) JWT op andere apparaten live ongeldig i.p.v. pas bij expiry.
  if (sessionPredatesPasswordChange(user.passwordChangedAt, fresh.passwordChangedAt)) return null;

  // Lid van een geschorste tenant → uitgelogd (fail-closed). Eén franchise-suspend bevriest de hele
  // tenant, net als een geschorst account. Zie tenantAccessBlocked.
  if (tenantAccessBlocked(fresh.tenantId, fresh.tenant?.status)) return null;

  return {
    id: user.id,
    role: fresh.role as UserRole,
    status: fresh.status,
    mustChangePassword: fresh.mustChangePassword,
    tenantId: fresh.tenantId,
  };
}

/** Huidige actor of werpt 401. Eerste stap van elke mutatie. */
export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  assertAuthenticated(actor);
  return actor;
}

/** Huidige actor met rolcheck, of werpt. Combineert auth + rol in één stap. */
export async function requireRole(...roles: UserRole[]): Promise<Actor> {
  const actor = await currentActor();
  assertRole(actor, ...roles);
  return actor;
}
