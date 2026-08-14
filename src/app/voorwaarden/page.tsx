import { type Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Algemene voorwaarden · Handslag",
  description:
    "De algemene voorwaarden van Handslag: platformrol, verificatie, matching, betaling, schorsing en aansprakelijkheid — voor ZZP'ers, opdrachtgevers en bemiddelaars.",
};

/**
 * Algemene voorwaarden. Bevat bewust de P2B-/DSA-transparantie-elementen (schorsingsgronden
 * + motivering, ranking-parameters, klachtenroute, 15-dagen-wijzigingstermijn) ook al is
 * P2B formeel pas verplicht bij consumenten-aanbod — dat voorkomt herwerk en is de
 * eerlijkheidslat die het platform toch al wil. Zie docs/legal/REVIEW-DOOR-JURIST.md.
 */
export default function VoorwaardenPage() {
  return (
    <LegalPage
      title="Algemene voorwaarden"
      version="1.0 (concept — in afwachting van externe juridische toetsing)"
      updatedAt="14 augustus 2026"
      intro={
        <p>
          Deze voorwaarden gelden tussen jou en Handslag (de exacte rechtspersoon, het KVK-nummer en
          het vestigingsadres worden hier vermeld zodra de inschrijving definitief is) voor elk
          gebruik van het platform — als ZZP&apos;er, opdrachtgever of bemiddelaar. Ze zijn
          geschreven om gelezen te worden: duidelijke taal, geen kleine lettertjes. Bewaar of print
          deze pagina gerust; bij registratie verwijzen we er expliciet naar.
        </p>
      }
    >
      <LegalSection title="1. Wat Handslag is — en wat niet">
        <p>
          Handslag is een bemiddelingsplatform: wij brengen vraag en aanbod van zelfstandig
          ondernemerschap samen, verifiëren certificaten en ondersteunen de administratie eromheen.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            De overeenkomst van opdracht komt tot stand{" "}
            <strong>tussen ZZP&apos;er en opdrachtgever</strong>. Handslag is daarbij geen partij.
          </li>
          <li>
            Handslag is <strong>geen werkgever, geen uitzendbureau en geen zorgaanbieder</strong>.
            We oefenen geen leiding of toezicht uit over de uitvoering van opdrachten.
          </li>
          <li>
            Betalingen voor opdrachten lopen rechtstreeks tussen ZZP&apos;er en opdrachtgever
            (giraal); Handslag houdt geen gelden van partijen onder zich.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Account en registratie">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Je staat in voor de juistheid van je gegevens en houdt ze actueel; één account per
            persoon of organisatie.
          </li>
          <li>
            Je houdt je inloggegevens geheim. Handelingen via jouw account gelden als door jou
            verricht, tenzij je aantoonbaar slachtoffer bent van misbruik — meld dat direct.
          </li>
          <li>
            De overeenkomst met Handslag komt elektronisch tot stand op het moment dat je je
            registratie bevestigt; we bevestigen de ontvangst direct per e-mail. Deze voorwaarden
            blijven hier raadpleegbaar en opslaanbaar, per versie.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Verificatie en vertrouwen">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Handslag verifieert aangeleverde certificaten, diploma&apos;s en screeningen zorgvuldig
            (menselijke beoordeling, waar mogelijk controle bij registers zoals DUO en het
            BIG-register) en toont de uitkomst als status.
          </li>
          <li>
            Een verificatiestatus is een zorgvuldige momentopname, <strong>geen garantie</strong>.
            De opdrachtgever blijft zelf eindverantwoordelijk voor de eigen (wettelijke)
            controleplichten, zoals de vergewisplicht in de zorg (Wkkgz).
          </li>
          <li>
            Het aanleveren van valse of vervalste documenten is grond voor onmiddellijke schorsing
            en melding bij de bevoegde autoriteiten.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Matching en volgorde (ranking)">
        <p>
          Suggesties en volgordes op het platform komen tot stand op basis van deze belangrijkste
          parameters, in aflopend gewicht: aansluiting van vaardigheden en branche, vereiste
          (geverifieerde) certificaten, beschikbaarheid, reisafstand en tarief. Bij elke suggestie
          tonen we de redenen. Handslag bevoordeelt geen eigen diensten of betalende gebruikers in
          de ranking.
        </p>
      </LegalSection>

      <LegalSection title="5. Zelfstandigheid en Wet DBA">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            ZZP&apos;er en opdrachtgever zijn <strong>samen verantwoordelijk</strong> voor de juiste
            kwalificatie van hun arbeidsrelatie. Handslag ondersteunt met signalen en een
            modelovereenkomst van opdracht, maar de feitelijke werkpraktijk is beslissend en
            Handslag garandeert niet dat een relatie buiten dienstbetrekking blijft.
          </li>
          <li>
            Handslag verplicht niet tot persoonlijke uitvoering en oefent geen gezag uit: afspraken
            over vervanging, werkwijze en tarief maken ZZP&apos;er en opdrachtgever zelf — kenmerken
            van zelfstandig ondernemerschap.
          </li>
          <li>
            Naheffingen, boetes of andere gevolgen van herkwalificatie van de arbeidsrelatie komen
            voor rekening van ZZP&apos;er en/of opdrachtgever, niet van Handslag.
          </li>
          <li>
            De ZZP&apos;er is zelf verantwoordelijk voor eigen fiscale verplichtingen (btw-aangifte,
            inkomstenbelasting, urenadministratie), ook waar het platform die administratie
            ondersteunt.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Abonnement en kosten">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            De actuele abonnementen en tarieven staan in het platform vóór je een betaald plan
            afsluit. Voor ZZP&apos;ers geldt: het platformabonnement is alleen verschuldigd in
            maanden waarin je via het platform werkt — geen opdracht, geen kosten.
          </li>
          <li>
            Prijswijzigingen kondigen we ten minste 30 dagen vooraf aan; ze gelden nooit met
            terugwerkende kracht. Bij een prijsverhoging kun je opzeggen vóór de ingangsdatum.
          </li>
          <li>Betaling verloopt via onze betaaldienstverlener; uitsluitend giraal.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Gebruik van het platform">
        <p>Niet toegestaan is in ieder geval:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>onjuiste, misleidende of andermans gegevens gebruiken;</li>
          <li>
            patiënt- of cliëntgegevens delen via het platform (berichten en documenten zijn daar
            niet voor bedoeld);
          </li>
          <li>
            het platform omzeilen om bemiddelde relaties buiten het platform voort te zetten met het
            uitsluitende doel kosten te ontwijken;
          </li>
          <li>geautomatiseerd scrapen, spam, of inbreuk op beveiliging;</li>
          <li>intimidatie, discriminatie of ander onrechtmatig gedrag richting gebruikers.</li>
        </ul>
        <p>
          Vermoed je onrechtmatige inhoud of misbruik (bv. een vervalst certificaat of een nep
          profiel)? Meld het via{" "}
          <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
            support@zzp-platform.nl
          </a>
          . We beoordelen meldingen zorgvuldig en tijdig (menselijke beoordeling), informeren de
          melder over de uitkomst en motiveren beperkingen richting de getroffen gebruiker.
        </p>
      </LegalSection>

      <LegalSection title="8. Schorsing en beëindiging">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Gronden voor beperking of schorsing:</strong> schending van deze voorwaarden,
            valse of vervalste documenten, fraudesignalen, wanbetaling, onrechtmatig gedrag richting
            andere gebruikers, of een wettelijke verplichting.
          </li>
          <li>
            Bij schorsing ontvang je een <strong>motivering</strong>; je kunt daartegen bezwaar
            maken via de klachtenroute (artikel 9). Je gegevens blijven tijdens een schorsing
            bewaard conform de privacyverklaring.
          </li>
          <li>
            Beëindigt Handslag je account volledig, dan kondigen we dat — behoudens wettelijke
            uitzonderingen of ernstige misdragingen — ten minste <strong>30 dagen</strong> vooraf
            aan met redenen.
          </li>
          <li>
            Zelf opzeggen kan altijd, per direct, via je accountpagina. Lopende verplichtingen
            (zoals openstaande facturen of de fiscale bewaarplicht) blijven bestaan.
          </li>
          <li>
            Wijzigingen van deze voorwaarden kondigen we ten minste <strong>15 dagen</strong> vóór
            inwerkingtreding aan via het platform; bij ingrijpende wijzigingen langer. Ben je het er
            niet mee eens, dan kun je vóór de ingangsdatum opzeggen.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Klachten en geschillen">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Klachten over het platform of over een beslissing (zoals een afgewezen verificatie of
            een schorsing) dien je in via{" "}
            <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
              support@zzp-platform.nl
            </a>{" "}
            of het supportkanaal in het platform. We bevestigen ontvangst en reageren inhoudelijk
            binnen 14 dagen. De behandeling is kosteloos.
          </li>
          <li>
            Geschillen tussen ZZP&apos;er en opdrachtgever over een opdracht lossen partijen
            onderling op; Handslag kan op verzoek de relevante platformgegevens (zoals
            urenregistraties en berichten) aan beide partijen verstrekken.
          </li>
          <li>Op deze voorwaarden is Nederlands recht van toepassing.</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Aansprakelijkheid">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Handslag spant zich in voor een beschikbaar, veilig en juist werkend platform, maar
            biedt geen ononderbroken beschikbaarheidsgarantie.
          </li>
          <li>
            Handslag is niet aansprakelijk voor de uitvoering, kwaliteit of betaling van opdrachten:
            die overeenkomst is tussen ZZP&apos;er en opdrachtgever.
          </li>
          <li>
            Aansprakelijkheid van Handslag voor indirecte schade (waaronder gederfde omzet of winst)
            is uitgesloten. Voor directe schade is de aansprakelijkheid per gebeurtenis beperkt tot
            de vergoedingen die je in de 12 maanden ervóór aan Handslag hebt betaald.
          </li>
          <li>
            Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van Handslag, of waar de
            wet beperking niet toestaat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="11. Gegevens en intellectuele eigendom">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Hoe we met persoonsgegevens omgaan staat in de{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              privacyverklaring
            </Link>{" "}
            en de{" "}
            <Link href="/cookies" className="underline underline-offset-2">
              cookieverklaring
            </Link>
            ; die maken deel uit van deze voorwaarden.
          </li>
          <li>
            Jouw content (profiel, documenten, berichten) blijft van jou. Je geeft Handslag alleen
            de licentie die nodig is om het platform te laten werken (tonen aan de door jou gekozen
            ontvangers, opslaan, back-uppen).
          </li>
          <li>Het platform zelf (software, ontwerp, merk) is en blijft van Handslag.</li>
        </ul>
      </LegalSection>

      <LegalSection title="12. Slotbepalingen">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Is een bepaling nietig of vernietigbaar, dan blijven de overige bepalingen gelden en
            vervangen partijen de bepaling door een geldige die de bedoeling het dichtst benadert.
          </li>
          <li>
            Handslag mag rechten en plichten uit deze overeenkomst overdragen aan een rechtsopvolger
            die de dienstverlening voortzet; je wordt daarover geïnformeerd.
          </li>
          <li>
            Eerdere versies van deze voorwaarden zijn op verzoek beschikbaar via{" "}
            <a href="mailto:support@zzp-platform.nl" className="underline underline-offset-2">
              support@zzp-platform.nl
            </a>
            .
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
