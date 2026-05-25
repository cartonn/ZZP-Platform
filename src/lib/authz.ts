// Autorisatie-helpers. De mutatieketen (CLAUDE.md regel 2) is:
//   auth -> rol -> ownership -> Zod -> actie -> audit.
// Dit bestand levert de auth/rol/ownership-stappen. De pure predicaten zijn
// los unit-getest; de async wrappers halen de huidige gebruiker uit Auth.js.

import { type UserRole } from "@/lib/enums";

export interface Actor {
  id: string;
  role: UserRole;
  status: string;
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
    throw new AuthorizationError(
      `Geen toegang: vereist rol ${roles.join(" of ")}.`,
      403,
    );
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

/** Huidige actor of `null`. Gebruik in read-paden waar anoniem toegestaan is. */
export async function currentActor(): Promise<Actor | null> {
  const { auth } = await import("@/auth");
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.role) return null;
  return { id: user.id, role: user.role as UserRole, status: user.status ?? "ACTIVE" };
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
