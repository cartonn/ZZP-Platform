// Unit-tests voor favorieten/actions — zichtbaarheids-/tenant-poort op het TOEVOEGEN van een
// favoriet (CLAUDE.md regel 1 & 2 + tenant-isolatie). Zonder de poort kon een opdrachtgever via een
// gegokt id een PRIVATE of cross-tenant ZZP-profiel favorieten en zo naam/tarief/locatie/beschikbaar-
// heid op /favorieten inzien — de privacy-opt-out en franchise-tenant-grens die elk ander vind-
// oppervlak (zoek, "gesprek starten", uitnodigen) wél afdwingt, omzeild. Rood→groen: vóór de fix las
// addFavorite het profiel met een ongescoopte findUnique (alleen bestaanscheck) en schreef het weg.
// De discoverable-/tenant-where-helpers zijn bewust ECHT (leaf-modules) zodat de test de werkelijke
// samengestelde where verifieert; prisma/authz/audit/next-cache gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { addFavorite, removeFavorite } from "@/app/(protected)/favorieten/actions";

const store = {
  actor: { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
  profile: null as { id: string } | null,
};

const profileFindFirst = vi.hoisted(() => vi.fn());
const favoriteFindUnique = vi.hoisted(() => vi.fn(async () => null));
const favoriteCreate = vi.hoisted(() => vi.fn(async () => ({ id: "fav-1" })));
const favoriteDeleteMany = vi.hoisted(() => vi.fn(async () => ({ count: 1 })));
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => ({ id: "co-1" })) },
    freelancerProfile: { findFirst: profileFindFirst },
    favoriteFreelancer: {
      findUnique: favoriteFindUnique,
      create: favoriteCreate,
      deleteMany: favoriteDeleteMany,
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  store.actor = { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null };
  // De findFirst-mock simuleert de DB-filtering: geeft alleen een rij terug als de where GEEN
  // zichtbaarheids-/tenant-uitsluiting bevat die het doelprofiel wegfiltert. Standaard: profiel bestaat
  // maar is NIET zichtbaar voor deze actor (findFirst geeft null zodra de poort meegestuurd is).
  profileFindFirst.mockImplementation(async ({ where }: { where: Record<string, unknown> }) => {
    // Poort actief? Dan filtert de DB het niet-zichtbare profiel weg → null.
    if ("visibility" in where) return null;
    return { id: String(where.id) };
  });
});

describe("addFavorite — zichtbaarheids-/tenant-poort", () => {
  it("stuurt de discoverable-/tenant-where mee (poort actief)", async () => {
    await expect(addFavorite("zzp-hidden")).rejects.toThrow("ZZP'er niet gevonden.");
    const where = profileFindFirst.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.id).toBe("zzp-hidden");
    expect(where.visibility).toBe("PUBLIC"); // discoverableFreelancerWhere
    expect("tenantId" in where).toBe(true); // visibleFreelancersWhere(actor)
  });

  it("schrijft GEEN favoriet + GEEN audit voor een niet-zichtbaar/cross-tenant profiel", async () => {
    await expect(addFavorite("zzp-other-tenant")).rejects.toThrow("ZZP'er niet gevonden.");
    expect(favoriteCreate).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("voegt een zichtbaar PUBLIC-profiel wél toe (create + audit)", async () => {
    // Simuleer een zichtbaar profiel: de DB geeft ook mét poort een rij terug.
    profileFindFirst.mockResolvedValueOnce({ id: "zzp-visible" });
    await addFavorite("zzp-visible");
    expect(favoriteCreate).toHaveBeenCalledOnce();
    expect(auditMock).toHaveBeenCalledOnce();
  });
});

describe("removeFavorite — opruimen mag altijd (geen zichtbaarheidspoort)", () => {
  it("verwijdert een reeds-eigen favoriet zonder de zichtbaarheids-where", async () => {
    await removeFavorite("zzp-now-private");
    const where = profileFindFirst.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(where.id).toBe("zzp-now-private");
    expect("visibility" in where).toBe(false); // geen poort → opruimen kan niet vastlopen
    expect(favoriteDeleteMany).toHaveBeenCalledOnce();
  });
});
