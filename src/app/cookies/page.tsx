import { type Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookieverklaring · Handslag",
  description:
    "Welke cookies Handslag gebruikt en waarom. Alleen functionele cookies — geen tracking, geen advertenties.",
};

/**
 * Cookieverklaring. Inhoud gespiegeld aan de werkelijke cookie-inventaris:
 * Auth.js (sessie/CSRF/callback), sidebar-stand en taalkeuze — allemaal functioneel.
 * Functionele cookies vereisen géén toestemmingsbanner (art. 11.7a lid 3 Tw).
 * Komt er ooit analytics/tracking bij, dan MOET deze pagina én een consent-mechanisme mee.
 */
export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookieverklaring"
      version="1.0 (concept — in afwachting van externe juridische toetsing)"
      updatedAt="14 augustus 2026"
      intro={
        <p>
          Handslag gebruikt uitsluitend functionele cookies: kleine bestanden die technisch
          noodzakelijk zijn om in te loggen en je voorkeuren te onthouden. We gebruiken géén
          tracking-, advertentie- of analysecookies en delen geen cookiegegevens met derden. Daarom
          tonen we geen cookiebanner: voor puur functionele cookies is geen toestemming vereist
          (art. 11.7a lid 3 Telecommunicatiewet).
        </p>
      }
    >
      <LegalSection title="1. Welke cookies we plaatsen">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Cookie</th>
                <th className="py-2 pr-4 font-medium">Doel</th>
                <th className="py-2 font-medium">Bewaartermijn</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_tr]:border-b [&_tr]:border-border/60">
              <tr>
                <td>Sessiecookie (inloggen)</td>
                <td>Houdt je veilig ingelogd; zonder deze cookie werkt het platform niet.</td>
                <td>Verloopt automatisch na uitloggen of inactiviteit</td>
              </tr>
              <tr>
                <td>Beveiligingscookie (CSRF)</td>
                <td>Beschermt formulieren tegen vervalste verzoeken vanaf andere sites.</td>
                <td>Duur van de sessie</td>
              </tr>
              <tr>
                <td>Terugkeer-cookie (callback)</td>
                <td>Onthoudt tijdens het inloggen naar welke pagina je terug wilde.</td>
                <td>Duur van het inlogproces</td>
              </tr>
              <tr>
                <td>Zijbalk-voorkeur</td>
                <td>Onthoudt of je de navigatiezijbalk in- of uitgeklapt hebt.</td>
                <td>Maximaal 12 maanden</td>
              </tr>
              <tr>
                <td>Taalkeuze</td>
                <td>Onthoudt je gekozen taal (Nederlands of Engels).</td>
                <td>Maximaal 12 maanden</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="2. Wat we bewust níet doen">
        <ul className="list-disc space-y-1 pl-5">
          <li>Geen tracking- of advertentiecookies, en geen cookies van derden.</li>
          <li>Geen statistiek- of analysecookies die jou over websites heen volgen.</li>
          <li>Geen verkoop of deling van cookiegegevens — met niemand.</li>
        </ul>
        <p>
          Gaan we in de toekomst wél statistieken of vergelijkbare technieken gebruiken die
          toestemming vereisen, dan passen we deze verklaring aan en vragen we die toestemming
          vooraf via een duidelijke keuze — nooit stilzwijgend.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies beheren of verwijderen">
        <p>
          Je kunt cookies altijd verwijderen of blokkeren via de instellingen van je browser. Let
          op: omdat al onze cookies functioneel zijn, kun je na het blokkeren ervan niet meer
          inloggen of gaan je voorkeuren verloren.
        </p>
      </LegalSection>

      <LegalSection title="4. Vragen">
        <p>
          Vragen over deze cookieverklaring? Mail{" "}
          <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
            support@zzp-platform.nl
          </a>
          . Hoe we met je persoonsgegevens omgaan staat in de{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacyverklaring
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
