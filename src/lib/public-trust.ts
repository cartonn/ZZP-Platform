import { prisma } from "@/lib/db";

/**
 * Publieke vertrouwenscijfers voor de inlog-/registratieschermen. Uitsluitend ECHTE,
 * server-side getelde platformdata — nooit verzonnen of opgeblazen getallen.
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
 * garanties (handmatige verificatie, Wet-DBA-modelovereenkomst, verklaarbare match) het vertrouwen.
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
