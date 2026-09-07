import { prisma } from "@/lib/db";

/**
 * Public platform counts for login/registration. Demo data never becomes public social proof.
 */
export interface PublicTrustStats {
  /** Aantal geverifieerde certificaten (VOG, diploma's, BIG, verzekering, …). */
  verifiedCredentials: number;
  /** Aantal ZZP'ers met minstens één geverifieerd certificaat. */
  verifiedFreelancers: number;
  /** Aantal succesvol afgeronde samenwerkingen. */
  completedCollaborations: number;
}

export async function getPublicTrustStats(): Promise<PublicTrustStats> {
  if (process.env.SEED_DEMO === "true") {
    return { verifiedCredentials: 0, verifiedFreelancers: 0, completedCollaborations: 0 };
  }
  const [verifiedCredentials, verifiedFreelancers, completedCollaborations] = await Promise.all([
    prisma.credential.count({ where: { status: "VERIFIED" } }),
    prisma.freelancerProfile.count({ where: { credentials: { some: { status: "VERIFIED" } } } }),
    prisma.collaboration.count({ where: { status: "COMPLETED" } }),
  ]);
  return { verifiedCredentials, verifiedFreelancers, completedCollaborations };
}

export interface TrustHighlight {
  /** Numerieke waarde. */
  value: number;
  /** NL-label, enkelvoud/meervoud al toegepast. */
  label: string;
}

/**
 * Bepaalt welke numerieke vertrouwens-hoogtepunten getoond worden. Een getal verschijnt pas
 * boven een betekenis-drempel, zodat een net-gelanceerd of klein platform nooit met magere
 * cijfers ("1 geverifieerd certificaat") pronkt. Onder de drempel dragen de kwalitatieve
 * productfuncties (verificatie, overeenkomsten, verklaarbare match) het vertrouwen.
 * Pure functie → unit-testbaar zonder database.
 */
export function trustHighlights(stats: PublicTrustStats): TrustHighlight[] {
  const out: TrustHighlight[] = [];
  if (stats.verifiedCredentials >= 10) {
    out.push({ value: stats.verifiedCredentials, label: "geverifieerde certificaten" });
  }
  if (stats.verifiedFreelancers >= 5) {
    out.push({ value: stats.verifiedFreelancers, label: "geverifieerde ZZP'ers" });
  }
  if (stats.completedCollaborations >= 5) {
    out.push({ value: stats.completedCollaborations, label: "afgeronde samenwerkingen" });
  }
  return out;
}
