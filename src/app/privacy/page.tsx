import { type Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { RETENTION_SCHEDULE } from "@/lib/compliance/processing-register";

export const metadata: Metadata = {
  title: "Privacyverklaring · Handslag",
  description:
    "Hoe Handslag omgaat met persoonsgegevens: welke gegevens, waarvoor, hoe lang, en welke rechten je hebt onder de AVG.",
};

/**
 * Privacyverklaring (informatieplicht art. 13/14 AVG). De feiten komen uit het
 * verwerkingsregister (src/lib/compliance/processing-register.ts); de bewaartermijnen-
 * tabel wordt daar rechtstreeks uit gerenderd zodat pagina en register nooit driften.
 * Wijzigt het register, dan wijzigt deze pagina mee — hou de prose in sync.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacyverklaring"
      version="1.0 (concept — in afwachting van externe juridische toetsing)"
      updatedAt="14 augustus 2026"
      intro={
        <>
          <p>
            Handslag is een platform waar zelfstandigen (ZZP&apos;ers), opdrachtgevers en
            bemiddelaars samenwerken: opdrachten vinden, certificaten laten verifiëren, veilig
            documenten delen en de administratie voeren. Daarvoor verwerken we persoonsgegevens —
            soms gevoelige, zoals een VOG. Deze verklaring legt uit welke gegevens dat zijn,
            waarvoor we ze gebruiken, hoe lang we ze bewaren en welke rechten je hebt.
          </p>
          <p>
            Verwerkingsverantwoordelijke: Handslag (de exacte rechtspersoon, het KVK-nummer en het
            vestigingsadres worden hier vermeld zodra de inschrijving definitief is). Contact:{" "}
            <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
              support@zzp-platform.nl
            </a>
            .
          </p>
        </>
      }
    >
      <LegalSection title="1. Welke gegevens we verwerken en waarvoor">
        <p>
          We verwerken alleen gegevens die nodig zijn voor het doel waarvoor je ze verstrekt
          (dataminimalisatie). De belangrijkste verwerkingen:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account en profiel</strong> — naam, e-mailadres, wachtwoord (versleuteld
            opgeslagen als hash), rol, profielinformatie zoals vaardigheden, uurtarief en regio.
            Grondslag: uitvoering van de overeenkomst.
          </li>
          <li>
            <strong>Certificaten en documentverificatie</strong> — door jou geüploade
            diploma&apos;s, certificaten, verzekeringsbewijzen en VOG&apos;s, plus de
            verificatiestatus. Een VOG bevat strafrechtelijke gegevens (art. 10 AVG); daarom zijn
            documenten standaard privé, alleen toegankelijk voor bevoegde beheerders, versleuteld
            opgeslagen en gelogd bij elke toegang. Opdrachtgevers zien uitsluitend de
            verificatiestatus — nooit het document zelf. Grondslag: wettelijke en contractuele eisen
            aan inzet in (zorg)opdrachten.
          </li>
          <li>
            <strong>Externe registerverificatie</strong> — voor diplomacontrole delen we minimaal
            noodzakelijke gegevens (verificatiecode, registratienummer, naam) met DUO of het
            BIG-register.
          </li>
          <li>
            <strong>Opdrachten, reacties en matching</strong> — opdrachtomschrijvingen, reacties met
            motivatie, tarieven en beschikbaarheid, zodat vraag en aanbod elkaar vinden. Grondslag:
            uitvoering van de overeenkomst.
          </li>
          <li>
            <strong>Berichten</strong> — de inhoud van gesprekken tussen jou en je
            opdrachtgever/ZZP&apos;er, alleen zichtbaar voor de deelnemers.
          </li>
          <li>
            <strong>Samenwerkingen en facturatie</strong> — contract- en factuurgegevens, waaronder
            IBAN, KVK- en btw-nummer. Grondslag: uitvoering van de overeenkomst en de fiscale
            bewaarplicht (art. 52 AWR).
          </li>
          <li>
            <strong>Beveiliging en misbruikpreventie</strong> — IP-adres, inlogpogingen en een
            logboek van beveiligingsrelevante handelingen. Grondslag: gerechtvaardigd belang
            (beveiliging). IP-adressen op beveiligingsincidenten worden na 90 dagen automatisch
            geredigeerd.
          </li>
          <li>
            <strong>Geaggregeerde signalen</strong> — markttariefbanden, betaalgedrag en
            leverbetrouwbaarheid tonen we uitsluitend als geaggregeerde statistiek met een minimale
            steekproefomvang; individuele tarieven, facturen of beoordelingen verlaten de server
            nooit.
          </li>
        </ul>
        <p>
          Het volledige, actuele overzicht per verwerking (doel, grondslag, ontvangers,
          beveiligingsmaatregelen) houden we intern bij in ons verwerkingsregister (art. 30 AVG);
          een export is opvraagbaar via{" "}
          <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
            support@zzp-platform.nl
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Met wie we gegevens delen">
        <p>
          We verkopen nooit persoonsgegevens. We delen alleen met partijen die nodig zijn om het
          platform te laten werken, telkens onder een verwerkersovereenkomst (art. 28 AVG):
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Andere gebruikers</strong> — wat jij zichtbaar maakt: je profiel aan
            opdrachtgevers (instelbaar), je reactie aan de opdrachtgever van die opdracht, je
            berichten aan je gesprekspartner.
          </li>
          <li>
            <strong>Hosting- en opslagproviders</strong> — het platform en de (versleutelde)
            documentopslag draaien bij Europese datacenters van onze hostingpartijen.
          </li>
          <li>
            <strong>E-maildienstverlener</strong> — voor transactionele e-mail (statusupdates,
            herinneringen); bij doorgifte buiten de EER uitsluitend met modelcontractbepalingen
            (SCC&apos;s).
          </li>
          <li>
            <strong>Betaaldienstverlener</strong> — voor abonnementsbetalingen; wij slaan nooit
            volledige betaalkaartgegevens op.
          </li>
          <li>
            <strong>Overheidsregisters</strong> — DUO en het BIG-register bij registerverificatie;
            de Belastingdienst waar de wet dat vereist, of via een door jou gemachtigd
            belastingkantoor (alleen met jouw uitdrukkelijke, losse toestemming).
          </li>
          <li>
            <strong>Route-dienstverlener</strong> — voor reistijdberekening bij matching sturen we
            een plaatsnaam (geen adres of naam) naar onze routeprovider, alleen wanneer die functie
            actief is.
          </li>
          <li>
            <strong>Foutmonitoring en wachtwoordlekcontrole</strong> — foutrapporten worden vóór
            verzending ontdaan van persoonsgegevens; bij de wachtwoordlekcontrole verlaat alleen een
            anoniem hash-fragment (nooit je wachtwoord of e-mailadres) de server.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Hoe lang we gegevens bewaren">
        <p>
          Bewaartermijnen dwingen we technisch af met geautomatiseerde opschoontaken — verlopen
          gegevens worden echt gewist, niet alleen verborgen. Het actuele schema:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Gegevens</th>
                <th className="py-2 font-medium">Bewaartermijn</th>
              </tr>
            </thead>
            <tbody className="[&_td]:py-2 [&_td]:pr-4 [&_tr]:border-b [&_tr]:border-border/60 [&_tr]:align-top">
              {RETENTION_SCHEDULE.map((rule) => (
                <tr key={rule.key}>
                  <td>{rule.category}</td>
                  <td>{rule.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="4. Hoe we gegevens beveiligen">
        <ul className="list-disc space-y-1 pl-5">
          <li>Versleutelde verbindingen (TLS) en versleutelde opslag van documenten.</li>
          <li>Wachtwoorden alleen als hash (bcrypt); controle tegen bekende datalekken.</li>
          <li>Toegang strikt op rol (RBAC); gevoelige documenten standaard privé.</li>
          <li>Auditlogboek van beveiligingsrelevante handelingen en documenttoegang.</li>
          <li>
            Datalekprocedure: een lek met risico melden we binnen 72 uur bij de Autoriteit
            Persoonsgegevens en — bij hoog risico — ook bij jou.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Geautomatiseerde ondersteuning, menselijke beslissingen">
        <p>
          Het platform ondersteunt met verklaarbare matchingsuggesties en signalen (zoals een
          markttariefband). Er worden geen besluiten met rechtsgevolg uitsluitend geautomatiseerd
          genomen (art. 22 AVG): verificaties beoordeelt een bevoegde beheerder, en over gunning of
          samenwerking beslissen opdrachtgever en ZZP&apos;er zelf. Bij elke matchsuggestie tonen we
          de redenen. De belangrijkste parameters die de volgorde van suggesties bepalen zijn:
          aansluiting van vaardigheden en branche, vereiste (geverifieerde) certificaten,
          beschikbaarheid, reisafstand en tarief.
        </p>
        <p>
          Het verstrekken van accountgegevens is nodig om de overeenkomst uit te voeren; zonder naam
          en e-mailadres kunnen we geen account leveren. Certificaten upload je alleen als je wilt
          reageren op opdrachten die daarom vragen — zonder geverifieerd certificaat kan een
          opdrachtgever je reactie op zo&apos;n opdracht niet accepteren.
        </p>
      </LegalSection>

      <LegalSection title="6. Jouw rechten">
        <p>Onder de AVG heb je recht op:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Inzage en overdraagbaarheid</strong> — download je gegevens direct via Account →
            gegevensexport.
          </li>
          <li>
            <strong>Rectificatie</strong> — pas je profiel- en accountgegevens zelf aan.
          </li>
          <li>
            <strong>Wissing</strong> — vraag accountverwijdering aan via je accountpagina; we
            handelen dit binnen 30 dagen af. Gegevens onder een wettelijke bewaarplicht (zoals
            facturen) bewaren we zo lang de wet dat vereist.
          </li>
          <li>
            <strong>Beperking en bezwaar</strong> — tegen verwerkingen op basis van gerechtvaardigd
            belang kun je bezwaar maken via{" "}
            <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
              support@zzp-platform.nl
            </a>
            .
          </li>
          <li>
            <strong>Toestemming intrekken</strong> — waar een verwerking op toestemming rust (zoals
            belastingaangifte via een gemachtigde), kun je die op elk moment intrekken.
          </li>
        </ul>
        <p>
          We reageren binnen één maand. Ben je het niet eens met hoe we met je gegevens omgaan, dan
          kun je een klacht indienen bij de{" "}
          <a
            href="https://www.autoriteitpersoonsgegevens.nl"
            rel="noopener noreferrer"
            target="_blank"
            className="underline underline-offset-2"
          >
            Autoriteit Persoonsgegevens
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Wijzigingen">
        <p>
          Bij een inhoudelijke wijziging van deze verklaring informeren we je via het platform vóór
          de wijziging ingaat. De actuele versie staat altijd op deze pagina; het versienummer en de
          datum bovenaan tonen wat geldt. Zie ook de{" "}
          <Link href="/cookies" className="underline underline-offset-2">
            cookieverklaring
          </Link>{" "}
          en de{" "}
          <Link href="/voorwaarden" className="underline underline-offset-2">
            algemene voorwaarden
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
