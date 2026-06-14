// Publieke vindbaarheid van een ZZP-profiel — één bron van waarheid, gedeeld door alle
// opdrachtgever-gerichte vind-oppervlakken (zoeklijst, opdracht-suggesties, "gesprek starten").
// Bewust een leaf-module zonder server-only imports (geen db/auth/next-headers), zodat het ook
// veilig in een client-graph (freelancer-search.ts → freelancer-browse.tsx) kan worden gebundeld.

import { type Prisma } from "@prisma/client";

/**
 * Where-fragment voor een publiek vindbare ZZP'er: het profiel staat op PUBLIC én het account is
 * ACTIVE. Een geschorst account (bv. uitgeschreven na herhaalde no-shows) of een geanonimiseerd
 * account (status SUSPENDED) mag nergens meer opduiken in opdrachtgever-zoek, opdracht-suggesties of
 * "gesprek starten" — server-side is de waarheid (CLAUDE.md regel 1), de client beslist dit niet.
 * Spiegelt de `{ user: { status: "ACTIVE" } }`-filter die `job-alerts-task.ts` al hanteert.
 * Combineer met `visibleFreelancersWhere(actor)` voor de tenant-grens.
 */
export const discoverableFreelancerWhere = {
  visibility: "PUBLIC",
  user: { status: "ACTIVE" },
} satisfies Prisma.FreelancerProfileWhereInput;
