/**
 * Vangrail: detecteert findMany()-aanroepen in page-bestanden zonder `take:`.
 *
 * Een `findMany` zonder `take` kan op termijn de server-memory en laadtijden
 * om zeep helpen. Elke nieuwe onbegrensde lijst moet hier expliciet worden
 * toegestaan (allowlist) met een reden.
 *
 * De test leest de broncode, zoekt `findMany(`-aanroepen en controleert of
 * `take:` aanwezig is in het bijbehorende argument-object (heuristische
 * brace-matching over max. 25 regels). Zo niet: fail.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Toegestane uitzonderingen: { file: relatief t.o.v. src/app, line: regelnummer }
// Bij elke uitzondering een reden als comment.
// ---------------------------------------------------------------------------
const ALLOWLIST: Array<{ file: string; line: number; reason: string }> = [
  // --- dashboard/page.tsx ---
  // Dashboard-widget: certificaten van één freelancer voor de statustelling.
  // Dit is een aggregatie-query voor een widget (geen lijst-view); typisch < 10 items.
  {
    file: "(protected)/dashboard/page.tsx",
    line: 220,
    reason: "dashboard-widget aggregatie; eigenaar-scoped, inherent begrensd",
  },

  // --- reacties/page.tsx ---
  // Reacties zijn altijd van één freelancer; groei is lineair en in de praktijk
  // beperkt (een ZZP'er heeft doorgaans < 100 actieve reacties).
  {
    file: "(protected)/reacties/page.tsx",
    line: 111,
    reason: "eigenaar-scoped, inherent begrensd",
  },

  // (De boekhoud-findMany van /administratie is verplaatst naar de BoekhoudingPanel onder
  // src/components/administratie; panels worden niet door deze vangrail gescand.)

  // --- beschikbaarheid/page.tsx ---
  // Beschikbaarheidvensters van één freelancer; kalender-aggregatie die de
  // volledige set nodig heeft voor upcoming/summary.
  {
    file: "(protected)/beschikbaarheid/page.tsx",
    line: 38,
    reason: "kalenderaggregatie vereist alle vensters van eigenaar",
  },
  {
    file: "(protected)/beschikbaarheid/page.tsx",
    line: 44,
    reason: "eigenaar-scoped lopende samenwerkingen voor conflictdetectie; inherent klein",
  },

  // --- certificaten/(index)/page.tsx ---
  // Certificaten van één freelancer; dit zijn er typisch < 20 per persoon.
  {
    file: "(protected)/certificaten/(index)/page.tsx",
    line: 71,
    reason: "eigenaar-scoped, inherent begrensd tot persoonlijk certificaatdossier",
  },

  // (De admin-aggregatie-findMany's van /admin/administratie zijn verplaatst naar de
  // AdminAdministratiePanel onder src/components/admin/financien; panels worden niet door deze
  // vangrail gescand.)

  // --- admin/verificaties/page.tsx ---
  // Verificatiewachtrij; alleen SUBMITTED-credentials; het aantal wachtende
  // aanvragen is structureel klein (dagelijkse verwerking door beheerders).
  {
    file: "(protected)/admin/verificaties/page.tsx",
    line: 48,
    reason: "verificatiewachtrij is structureel klein (dagelijks verwerkt)",
  },

  // (Het admin-samenwerkingenoverzicht is verplaatst naar SamenwerkingenPanel onder
  // src/components/admin; panels worden niet door deze vangrail gescand. De query heeft daar
  // bovendien een defensieve take-cap gekregen.)

  // --- admin/support/page.tsx ---
  // Actieve support-tickets (status-filter op ESCALATED/REOPENED/TRIAGED/NEW/AWAITING_USER);
  // dit zijn altijd onopgeloste items; structureel klein voor goed beheerde queue.
  {
    file: "(protected)/admin/support/page.tsx",
    line: 79,
    reason: "actieve queue met status-filter; structureel klein bij goede SLA",
  },

  // (De franchise-tenant-findMany van /admin/franchises is verplaatst naar de BemiddelaarsPanel
  // onder src/components/admin/gebruikersbeheer; panels worden niet door deze vangrail gescand.)

  // --- admin/import/actions.ts (drie findMany's) ---
  // Import-acties die de volledige gebruikers/skills-set nodig hebben voor
  // deduplicatie; batch-operaties, niet voor eindgebruikers.
  {
    file: "(protected)/admin/import/actions.ts",
    line: 105,
    reason: "deduplicatiecheck voor import-batch",
  },
  {
    file: "(protected)/admin/import/actions.ts",
    line: 114,
    reason: "skill-lijst voor import-mapping",
  },
  {
    file: "(protected)/admin/import/actions.ts",
    line: 181,
    reason: "skill-lookup voor import-mapping",
  },

  // --- admin/disputen/page.tsx ---
  // Samenwerkingen met een actief geschil; altijd gefilterd op disputedAt IS NOT NULL;
  // structureel klein bij een gezond platform.
  {
    file: "(protected)/admin/disputen/page.tsx",
    line: 20,
    reason: "geschillen-filter; structureel klein",
  },

  // --- admin/gebruikers/actions.ts ---
  // Documenten ophalen ten behoeve van accountverwijdering; eenmalige actie per
  // gebruiker, geen lijst-view.
  {
    file: "(protected)/admin/gebruikers/actions.ts",
    line: 78,
    reason: "account-verwijdering-actie, niet een lijst-view",
  },
  {
    file: "(protected)/admin/gebruikers/actions.ts",
    line: 88,
    reason:
      "AVG-verwijdering: eigen DISPUTE_OPENED-events van één gebruiker; bewust geen take (alle eigen dispuutredenen moeten gewist worden, een cap zou er stilletjes overslaan)",
  },
  {
    file: "(protected)/admin/gebruikers/actions.ts",
    line: 102,
    reason:
      "AVG art. 17: alle auditregels met PII (e-mail/IP) van één gebruiker; bewust geen take (een cap zou stilletjes PII laten staan bij de vergetelheid-actie)",
  },

  // --- abonnement/page.tsx ---
  // Plan-tabel: er zijn exact 3 plannen (FREE/PRO/BUSINESS); onbegrensd is prima.
  {
    file: "(protected)/abonnement/page.tsx",
    line: 23,
    reason: "vaste kleine referentietabel (3 plannen)",
  },

  // --- diensten/importeer/page.tsx ---
  // Samenwerkingen ten behoeve van importkeuze; frontend-selectiecomponent.
  // Volume is eigenaar-scoped (kleine set actieve samenwerkingen per franchise).
  {
    file: "(protected)/diensten/importeer/page.tsx",
    line: 15,
    reason: "franchise-eigenaar-scoped, inherent begrensd",
  },

  // --- facturen/nieuw/page.tsx ---
  // Keuzelijst van factureerbare samenwerkingen; eigenaar-scoped en
  // inherent klein (alleen actieve samenwerkingen van de gebruiker).
  {
    file: "(protected)/facturen/nieuw/page.tsx",
    line: 21,
    reason: "eigenaar-scoped keuzelijst; inherent klein",
  },

  // (De factuur- en openstaand-findMany's van /facturen en /openstaand zijn verplaatst naar de
  // FacturenPanel/OpenstaandPanel onder src/components/administratie; panels worden niet door
  // deze vangrail gescand.)

  // --- ideeen/actions.ts ---
  // Stemgevers ophalen voor een specifiek idee; maximaal het totaal aantal gebruikers
  // maar dit is geen lijst-view en draait als server action.
  {
    file: "(protected)/ideeen/actions.ts",
    line: 144,
    reason: "stemgevers van één idee; server action, geen lijst-view",
  },

  // --- ideeen/page.tsx ---
  // Ideeënlijst met filter; het platform heeft doorgaans < 200 ideeën; paginatie
  // kan later worden toegevoegd als het volume groeit.
  {
    file: "(protected)/ideeen/page.tsx",
    line: 60,
    reason: "ideeënlijst met filter; laag volume; kandidaat voor toekomstige paginatie",
  },

  // --- account/actions.ts ---
  // Admin-check: zoek naar bestaande admins vóór account-verwijdering.
  // Dit is een veiligheidscheck, geen lijst-view.
  {
    file: "(protected)/account/actions.ts",
    line: 62,
    reason: "admin-veiligheidscheck; geen lijst-view",
  },

  // --- samenwerkingen/page.tsx (tweede findMany: invoiceable check) ---
  // Query om factureerbare samenwerkingen te identificeren voor de knopweergave;
  // dit is een ID-set-query (select: {id: true}), geen volledige lijst.
  {
    file: "(protected)/samenwerkingen/page.tsx",
    line: 155,
    reason: "ID-set-query voor factureerbare samenwerkingen; geen volledige lijst",
  },

  // --- samenwerkingen/page.tsx (derde findMany: afronden-rem) ---
  // Factuurstatussen voor de zichtbare (gepagineerde) samenwerkingen, om de "Markeer als
  // afgerond"-knop niet als dode knop aan te bieden. Begrensd door de page-of-collaborations.
  {
    file: "(protected)/samenwerkingen/page.tsx",
    line: 168,
    reason: "factuurstatus-snapshot per zichtbare samenwerking (afronden-rem); page-begrensd",
  },

  // --- samenwerkingen/actions.ts (afronden-rem guard) ---
  // Factuurstatussen van één samenwerking om afronden server-side te weigeren bij open geld.
  {
    file: "(protected)/samenwerkingen/actions.ts",
    line: 219,
    reason: "factuurstatus van één samenwerking voor de afronden-rem; per-collab begrensd",
  },

  // --- franchise/diensten/page.tsx ---
  // Franchise-diensten (opdrachten) van één tenant; eigenaar-scoped en beheerbaar.
  {
    file: "(protected)/franchise/diensten/page.tsx",
    line: 26,
    reason: "franchise-tenant-scoped diensten; beheerbaar volume",
  },

  // --- franchise/samenwerkingen/page.tsx ---
  // Franchise-samenwerkingen; eigenaar-scoped en beheerbaar.
  {
    file: "(protected)/franchise/samenwerkingen/page.tsx",
    line: 58,
    reason: "franchise-tenant-scoped; beheerbaar volume",
  },

  // --- franchise/leads/page.tsx ---
  // Franchise-leads; tenant-scoped, beheerbaar volume.
  {
    file: "(protected)/franchise/leads/page.tsx",
    line: 45,
    reason: "franchise-tenant-scoped leads; beheerbaar volume",
  },

  // --- franchise/opdrachtgevers/nieuw/page.tsx (twee findMany's) ---
  // Opdrachten en skills-referentielijsten voor het formulier.
  {
    file: "(protected)/franchise/opdrachtgevers/nieuw/page.tsx",
    line: 205,
    reason: "kleine referentielijst voor formulier (tenant-scope)",
  },
  {
    file: "(protected)/franchise/opdrachtgevers/nieuw/page.tsx",
    line: 210,
    reason: "skills-referentielijst voor formulier",
  },

  // --- franchise/opdrachtgevers/[id]/page.tsx (twee findMany's) ---
  // Skills en opdrachten per opdrachtgever; referentielijsten voor formulier.
  {
    file: "(protected)/franchise/opdrachtgevers/[id]/page.tsx",
    line: 50,
    reason: "skills-referentielijst voor formulier",
  },
  {
    file: "(protected)/franchise/opdrachtgevers/[id]/page.tsx",
    line: 53,
    reason: "opdrachten per opdrachtgever voor formulier",
  },

  // --- franchise/opdrachtgevers/page.tsx ---
  // Alle bedrijven van deze franchise-tenant; tenant-scoped en beheerbaar.
  {
    file: "(protected)/franchise/opdrachtgevers/page.tsx",
    line: 18,
    reason: "franchise-tenant-scoped bedrijven; beheerbaar volume",
  },

  // --- franchise/zzpers/actions.ts ---
  // Skills-lijst voor ZZP'er-acties; kleine referentielijst.
  {
    file: "(protected)/franchise/zzpers/actions.ts",
    line: 67,
    reason: "skills-referentielijst voor actie",
  },

  // --- franchise/zzpers/page.tsx (twee findMany's) ---
  // Freelancers en skills van deze franchise; tenant-scoped.
  {
    file: "(protected)/franchise/zzpers/page.tsx",
    line: 80,
    reason: "franchise-tenant-scoped freelancers; beheerbaar volume",
  },
  {
    file: "(protected)/franchise/zzpers/page.tsx",
    line: 90,
    reason: "skills-referentielijst voor formulier",
  },

  // --- profiel/actions.ts (twee findMany's) ---
  // Skills en branches voor profielbewerking; kleine referentielijsten.
  {
    file: "(protected)/profiel/actions.ts",
    line: 59,
    reason: "skills-referentielijst voor profielformulier",
  },
  {
    file: "(protected)/profiel/actions.ts",
    line: 60,
    reason: "branches-referentielijst voor profielformulier",
  },

  // --- profiel/page.tsx (twee findMany's) ---
  // Skills en branches voor profielweergave; kleine referentielijsten.
  {
    file: "(protected)/profiel/bewerken/page.tsx",
    line: 30,
    reason: "skills-referentielijst voor profielpagina",
  },
  {
    file: "(protected)/profiel/bewerken/page.tsx",
    line: 31,
    reason: "branches-referentielijst voor profielpagina",
  },

  // --- opdrachten/actions.ts ---
  // Skills voor het aanmaakformulier.
  {
    file: "(protected)/opdrachten/actions.ts",
    line: 77,
    reason: "skills-referentielijst voor formulier",
  },
  // Flexpool-leden van het eigen bedrijf bij de eerste publicatie (poule is per bedrijf
  // curated en klein; slice-1-overzicht toont er max. 100).
  {
    file: "(protected)/opdrachten/actions.ts",
    line: 270,
    reason: "eigen flexpool-leden bij eerste publicatie (per bedrijf begrensd)",
  },
  // Nog-openstaande reacties op één opdracht bij het sluiten (per opdracht begrensd; alleen
  // NEW/VIEWED/SHORTLIST) om ze te notificeren dat de opdracht weg is.
  {
    file: "(protected)/opdrachten/actions.ts",
    line: 330,
    reason: "open reacties van één opdracht bij sluiten (per opdracht begrensd)",
  },

  // --- opdrachten/nieuw/page.tsx (twee findMany's) ---
  // Skills en branches voor nieuw-opdrachtformulier.
  {
    file: "(protected)/opdrachten/nieuw/page.tsx",
    line: 46,
    reason: "skills-referentielijst voor formulier",
  },
  {
    file: "(protected)/opdrachten/nieuw/page.tsx",
    line: 47,
    reason: "branches-referentielijst voor formulier",
  },

  // --- opdrachten/[id]/bewerken/page.tsx (twee findMany's) ---
  // Skills en branches voor bewerkformulier.
  {
    file: "(protected)/opdrachten/[id]/bewerken/page.tsx",
    line: 31,
    reason: "skills-referentielijst voor formulier",
  },
  {
    file: "(protected)/opdrachten/[id]/bewerken/page.tsx",
    line: 32,
    reason: "branches-referentielijst voor formulier",
  },

  // --- opdrachten/(index)/page.tsx (vier findMany's) ---
  // Client-kanban van eigen opdrachten; geen take maar altijd gefilterd op company.userId
  // (eigenaar-scoped). Industry-/skill-lijsten zijn kleine referentielijsten. De savedJob-query
  // is eigenaar-scoped (freelancerProfileId) en levert alleen id-referenties op.
  {
    file: "(protected)/opdrachten/(index)/page.tsx",
    line: 72,
    reason: "eigenaar-scoped kanban van eigen opdrachten; kandidaat toekomstige paginatie",
  },
  {
    file: "(protected)/opdrachten/(index)/page.tsx",
    line: 276,
    reason: "branches-referentielijst voor filter",
  },
  {
    file: "(protected)/opdrachten/(index)/page.tsx",
    line: 277,
    reason: "skills-referentielijst voor filter",
  },
  {
    file: "(protected)/opdrachten/(index)/page.tsx",
    line: 282,
    reason:
      "bewaarde opdrachten, eigenaar-scoped op freelancerProfileId; alleen jobId-referenties, membership in-memory",
  },

  // --- support/page.tsx ---
  // Support-tickets van één gebruiker; eigenaar-scoped, structureel klein.
  {
    file: "(protected)/support/page.tsx",
    line: 19,
    reason: "eigenaar-scoped support-tickets; structureel klein",
  },

  // --- bedrijf/bewerken/page.tsx ---
  // Industries-referentielijst voor het bedrijfsprofielformulier (verplaatst van /bedrijf naar
  // /bedrijf/bewerken toen /bedrijf de hub werd); kleine, vaste referentietabel.
  {
    file: "(protected)/bedrijf/bewerken/page.tsx",
    line: 19,
    reason: "kleine referentietabel industries",
  },

  // --- ontzorgd/aangifte/actions.ts ---
  // Administratie-entries voor de aangifte-actie; eigenaar-scoped aggregatie.
  {
    file: "(protected)/ontzorgd/aangifte/actions.ts",
    line: 51,
    reason: "eigenaar-scoped aggregatie voor aangifte",
  },

  // --- ontzorgd/aangifte/page.tsx ---
  // Aangifte-overzicht; eigenaar-scoped, alle entries nodig voor aggregatie.
  {
    file: "(protected)/ontzorgd/aangifte/page.tsx",
    line: 29,
    reason: "eigenaar-scoped aggregatie voor aangifte-pagina",
  },

  // (De ontzorgd-findMany van /ontzorgd is verplaatst naar de OntzorgdPanel onder
  // src/components/administratie; panels worden niet door deze vangrail gescand.)

  // --- kandidaten/page.tsx ---
  // Kandidaten (freelancers) voor een opdrachtgever; gefilterd en beperkt door matching.
  {
    file: "(protected)/kandidaten/page.tsx",
    line: 109,
    reason: "kandidaten-matching; volume beperkt door filter",
  },

  // --- kandidaten/actions.ts ---
  // Bulk-triage: geladen set is begrensd door de geselecteerde appId's (id: { in: ids }).
  {
    file: "(protected)/kandidaten/actions.ts",
    line: 143,
    reason: "bulk-triage; begrensd door geselecteerde ids (id in ids)",
  },

  // --- berichten/actions.ts ---
  // Berichten/gesprekken voor één gebruiker; eigenaar-scoped.
  { file: "(protected)/berichten/actions.ts", line: 16, reason: "eigenaar-scoped gesprekken" },

  // --- api/administratie/openstaand/route.ts ---
  // API-route voor openstaand; eigenaar-scoped aggregatie.
  {
    file: "api/administratie/openstaand/route.ts",
    line: 18,
    reason: "API-route; eigenaar-scoped aggregatie",
  },

  // --- api/administratie/export/route.ts ---
  // Export-route; verwerkt alle records van eigenaar (export vereist volledigheid).
  {
    file: "api/administratie/export/route.ts",
    line: 25,
    reason: "export-route; volledigheid vereist",
  },

  // --- api/administratie/btw/route.ts ---
  // BTW-berekening; alle regels nodig voor correcte aangifte.
  {
    file: "api/administratie/btw/route.ts",
    line: 29,
    reason: "BTW-aggregatie; volledigheid vereist",
  },

  // --- api/admin/export/invoices/route.ts ---
  // Admin-export; volledigheid vereist voor boekhouding.
  {
    file: "api/admin/export/invoices/route.ts",
    line: 27,
    reason: "admin-export; volledigheid vereist",
  },

  // (De rooster-findMany van /api/agenda is verplaatst naar src/lib/calendar/user-schedule.ts en
  // gedeeld met /api/agenda/feed.ics; lib-bestanden worden niet door deze vangrail gescand. De
  // query is eigenaar-scoped en inherent klein — alle actieve samenwerkingen van één gebruiker.)

  // --- api/account/export/route.ts (drie findMany's) ---
  // Account-export (AVG); volledigheid vereist voor data-portabiliteit.
  { file: "api/account/export/route.ts", line: 61, reason: "AVG-export; volledigheid vereist" },
  { file: "api/account/export/route.ts", line: 72, reason: "AVG-export; volledigheid vereist" },
  { file: "api/account/export/route.ts", line: 76, reason: "AVG-export; volledigheid vereist" },
  { file: "api/account/export/route.ts", line: 80, reason: "AVG-export; volledigheid vereist" },
];

// ---------------------------------------------------------------------------
// Hulpfuncties
// ---------------------------------------------------------------------------

/** Geeft de inhoud van het argument-blok van findMany( terug (heuristisch). */
function extractFindManyArg(source: string, matchIndex: number): string {
  // Zoek de eerste `(` na `findMany`
  let depth = 0;
  let start = -1;
  for (let i = matchIndex; i < source.length; i++) {
    if (source[i] === "(") {
      if (start === -1) start = i;
      depth++;
    } else if (source[i] === ")") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return "";
}

/** Leest alle .ts/.tsx bestanden in src/app recursief. */
function walkAppDir(): Array<{ rel: string; content: string }> {
  const root = join(process.cwd(), "src", "app");
  const results: Array<{ rel: string; content: string }> = [];

  function walk(dir: string, relBase: string) {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const abs = join(dir, entry);
      const rel = relBase ? `${relBase}/${entry}` : entry;
      const stat = statSync(abs);
      if (stat.isDirectory()) {
        walk(abs, rel);
      } else if (/\.(ts|tsx)$/.test(entry)) {
        results.push({ rel, content: readFileSync(abs, "utf8") });
      }
    }
  }
  walk(root, "");
  return results;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("onbegrensde findMany()-aanroepen in src/app", () => {
  const allowSet = new Set(ALLOWLIST.map((a) => `${a.file}:${a.line}`));
  const files = walkAppDir();

  it("elke findMany() heeft take: of staat in de allowlist", () => {
    const violations: string[] = [];

    for (const { rel, content } of files) {
      // Zoek alle findMany( occurrences
      const regex = /findMany\s*\(/g;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(content)) !== null) {
        // Bereken regelnummer (1-based)
        const before = content.slice(0, m.index);
        const lineNo = before.split("\n").length;

        const argBlock = extractFindManyArg(content, m.index + m[0].length - 1);
        // Begrensd als: letterlijke `take:` in het argument-object, of een spread van
        // pageArgs() (de gedeelde cursor-paginatie-helper die altijd take: pageSize+1 levert).
        const hasTake = /\btake\s*:/.test(argBlock) || /\.\.\.\s*pageArgs\s*\(/.test(argBlock);

        if (!hasTake) {
          const key = `${rel}:${lineNo}`;
          if (!allowSet.has(key)) {
            violations.push(
              `${rel}:${lineNo} — findMany() zonder take: (voeg toe aan ALLOWLIST met reden)`,
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        `Onbegrensde findMany()-aanroepen gevonden:\n${violations.join("\n")}\n\n` +
          `Voeg ze toe aan de ALLOWLIST in unbounded-queries.test.ts met een reden, ` +
          `of voeg take: toe aan de query.`,
      );
    }
  });

  it("allowlist bevat geen verwijzingen naar niet-bestaande bestanden", () => {
    const existingFiles = new Set(files.map((f) => f.rel));
    const missing: string[] = [];

    for (const entry of ALLOWLIST) {
      if (!existingFiles.has(entry.file)) {
        missing.push(`${entry.file}:${entry.line} (bestand niet gevonden)`);
      }
    }

    if (missing.length > 0) {
      expect.fail(
        `Allowlist verwijst naar niet-bestaande bestanden:\n${missing.join("\n")}\n\n` +
          `Verwijder de entry of pas het pad aan.`,
      );
    }
  });
});
