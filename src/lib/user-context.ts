// Gedeelde, request-gecachte gebruikerscontext voor de app-shell.
//
// Waarom dit bestand bestaat: op élke beschermde pagina draaien `navBadges` (signals.ts) en
// `computeTasks` (actions/pending-tasks.ts) naast elkaar. Ze beantwoorden verschillende vragen, maar
// leunen op dezelfde ONDERLIGGENDE feiten: het certificaatdossier van deze ZZP'er, zijn ongelezen
// gesprekken, bij welke tenant hij hoort, welk bedrijf van deze opdrachtgever is. Die feiten werden
// per aanroeper opnieuw opgehaald — soms meerdere keren binnen één functie. Hier staan ze één keer,
// achter React `cache()`, zodat ze binnen één request hooguit één query kosten (zelfde patroon als
// `getCompletenessProfile` in data/freelancer-profile.ts).
//
// Regel voor dit bestand: alleen FEITEN, geen beleid. De pure afleidingen (welke badge, welke taak,
// welke drempel) blijven bij de aanroepers, zodat badge en actiecentrum hun bestaande, expliciet
// gedocumenteerde pariteit houden en hier niets stil kan driften.

import "server-only";
import { cache } from "react";

import { prisma } from "@/lib/db";

/** Eén certificaatrij zoals élke shell-consument 'm nodig heeft (badge, taken, compliance). */
export interface CredentialDossierRow {
  id: string;
  title: string;
  type: string;
  status: string;
  expiresAt: Date | null;
}

/**
 * Het VOLLEDIGE certificaatdossier van één ZZP-profiel — één query voor alle certificaatvragen.
 *
 * De `/certificaten`-badge stelde er vier: afgewezen (count), het VERIFIED-dossier, de
 * verplichte-documentrijen en nogmaals álle rijen voor de plaatsings-/gatencheck. Alle vier zijn
 * deelverzamelingen van deze ene set, dus ze worden nu in-memory afgeleid; `freelancerTasks` laadt
 * dezelfde set en deelt 'm via de cache.
 *
 * ONBEGRENSD (geen `take`) — bewust, en identiek aan wat pending-tasks.ts hier al deed: de
 * superseded-/dekkingsdetectie heeft álle nu-geldige exemplaren van een type nodig, en een cap zou
 * badge en actiecentrum uiteen laten lopen zodra een dossier groter is dan de cap. De set is
 * eigenaar-gescoopt en inherent begrensd tot één persoonlijk certificaatdossier.
 */
export const getCredentialDossier = cache(
  async (freelancerProfileId: string): Promise<CredentialDossierRow[]> =>
    // unbounded-allow: één persoonlijk certificaatdossier (eigenaar-gescoopt); een cap zou de
    // superseded-/dekkingsdetectie breken en badge en actiecentrum uiteen laten lopen.
    prisma.credential.findMany({
      where: { freelancerProfileId },
      select: { id: true, title: true, type: true, status: true, expiresAt: true },
    }),
);

/** Deelnemerschap + het laatste bericht van een ánder per gesprek — de basis voor "ongelezen". */
export interface UnreadConversationState {
  participants: { conversationId: string; lastReadAt: Date | null }[];
  /** conversationId → tijdstip van het laatste bericht van iemand anders (null = geen). */
  latestForeign: Map<string, Date | null>;
}

/**
 * Twee begrensde queries (geen N+1) die samen bepalen welke gesprekken ongelezen zijn. De
 * `/berichten`-badge (signals.ts) telt ze; het actiecentrum (pending-tasks.ts) verrijkt ze tot losse
 * taken. Beide draaiden hun eigen kopie van precies deze twee queries; gedeeld kost het er nog twee
 * per request in plaats van vier.
 *
 * `orderBy: { conversationId: "asc" }` staat hier vast: het actiecentrum snijdt de lijst af op zijn
 * eigen maximum en heeft daarvoor een stabiele volgorde nodig (anders flikkert een berichttaak tussen
 * requests). Voor de telling maakt de volgorde niet uit, dus de badge houdt exact zijn oude uitkomst.
 */
export const getUnreadConversationState = cache(
  async (userId: string): Promise<UnreadConversationState> => {
    // unbounded-allow: het eigen deelnemerschap van één gebruiker (eigenaar-gescoopt); de
    // consumenten cappen zelf (het actiecentrum snijdt af op zijn eigen maximum) en de telling
    // moet over álle gesprekken gaan, anders is de badge stiller dan de berichtenlijst.
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      orderBy: { conversationId: "asc" },
      select: { conversationId: true, lastReadAt: true },
    });
    if (participants.length === 0) return { participants, latestForeign: new Map() };

    const grouped = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: participants.map((p) => p.conversationId) },
        senderId: { not: userId },
      },
      _max: { createdAt: true },
    });
    return {
      participants,
      latestForeign: new Map(grouped.map((g) => [g.conversationId, g._max.createdAt])),
    };
  },
);

/**
 * Het franchise-lidmaatschap (tenant) van deze gebruiker; `null` = directe platformgebruiker. Zowel
 * de bemiddelaar-badges als de bemiddelaar-taken beginnen met deze ene lookup — nu één keer per
 * request in plaats van per aanroeper.
 */
export const getUserTenantId = cache(async (userId: string): Promise<string | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
  return user?.tenantId ?? null;
});

/**
 * Het bedrijf van deze opdrachtgever; `null` = nog geen bedrijfsprofiel. De kandidaat-/opdracht-
 * badges en de compliance-signalen (collaboration-alerts.ts) deden hier ieder hun eigen identieke
 * lookup, ook binnen één badge-berekening.
 */
export const getUserCompanyId = cache(async (userId: string): Promise<string | null> => {
  const company = await prisma.company.findUnique({ where: { userId }, select: { id: true } });
  return company?.id ?? null;
});
