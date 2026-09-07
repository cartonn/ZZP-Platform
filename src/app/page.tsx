import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Handslag — Zorg is je vak. Kies je eigen richting.",
  description: "Handslag brengt zelfstandige zorgprofessionals en opdrachtgevers samen. Vind een opdracht, maak afspraken en houd documenten, uren en facturen bij elkaar.",
  alternates: { canonical: "https://handslag.nl" },
  openGraph: {
    title: "Handslag — Zorg is je vak. Kies je eigen richting.",
    description: "Een plek voor zelfstandig werken en samenwerken in de zorg.",
    url: "https://handslag.nl",
    locale: "nl_NL",
    type: "website",
  },
};

const questions = [
  { question: "Voor wie is Handslag?", answer: "Voor zelfstandige zorgprofessionals en organisaties die met hen samenwerken. Ook bemiddelaars kunnen opdrachten en samenwerkingen in Handslag organiseren." },
  { question: "Hoe worden facturen betaald?", answer: "De opdrachtgever betaalt de zzp’er rechtstreeks, buiten Handslag om. Handslag helpt bij de facturatie en het bijhouden van de betaalstatus. Er is op dit moment geen voorfinanciering of betalingsgarantie." },
  { question: "Wat zegt de status van een document?", answer: "Je ziet of een document is aangeleverd, beoordeeld of aan vernieuwing toe is. Een beoordeling is geen garantie dat een opdracht juridisch of beroepsmatig is toegestaan. Professional en opdrachtgever houden hun eigen verantwoordelijkheden." },
  { question: "Kan ik al beginnen?", answer: "Handslag wordt gefaseerd in gebruik genomen. Je kunt een account aanmaken om kennis te maken. Controleer vóór een echte samenwerking welke dienstverlening en voorwaarden voor jou beschikbaar zijn." },
];

const workflow = [
  { number: "01", title: "Een opdracht die past", text: "Bekijk de gevraagde expertise, locatie en inzet. Reageer als de opdracht bij je past. Als opdrachtgever bekijk je de reacties en maak je kennis met de professional.", note: "Opdracht → Reactie → Kennismaking" },
  { number: "02", title: "Weten wat je afspreekt", text: "Leg tarief, inzet en verwachtingen vast bij de samenwerking. Houd de benodigde documenten en hun beoordeling op dezelfde plek bij.", note: "Afspraken → Documenten → Samenwerking" },
  { number: "03", title: "Ook na de dienst overzicht", text: "Dien gewerkte uren in en laat ze beoordelen. De factuur blijft gekoppeld aan de samenwerking, zodat beide partijen terugvinden waarop het bedrag is gebaseerd.", note: "Uren → Beoordeling → Factuur" },
];

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <a className={styles.skip} href="#inhoud">Naar inhoud</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Handslag — home">
          <BrandMark size={30} /><span>handslag.</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Hoofdnavigatie">
          <a href="#voor-jou">Voor jou</a><a href="#zo-werkt-het">Zo werkt het</a><a href="#vragen">Vragen</a>
        </nav>
        <Link className={styles.login} href="/login">Inloggen <ArrowUpRight size={17} aria-hidden="true" /></Link>
        <details className={styles.mobileMenu}>
          <summary>Menu</summary>
          <nav aria-label="Mobiele navigatie"><a href="#voor-jou">Voor jou</a><a href="#zo-werkt-het">Zo werkt het</a><a href="#vragen">Vragen</a></nav>
        </details>
      </header>
      <main id="inhoud">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroTop}><p>Zelfstandig werken. Samen zorgen.</p><span>Handslag / Nederland</span></div>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 id="hero-title">Zorg is je vak.<br />Kies je eigen<br /><em>richting.</em></h1>
              <p className={styles.intro}>Jij weet wat je kunt betekenen. Handslag brengt je in contact met opdrachtgevers in de zorg — en houdt jullie afspraken, uren en facturen bij elkaar.</p>
              <a className={styles.primary} href="#voor-jou">Vind jouw plek <ArrowUpRight size={20} aria-hidden="true" /></a>
              <a className={styles.readOn} href="#zo-werkt-het"><ArrowDown size={16} aria-hidden="true" /> Bekijk hoe het werkt</a>
            </div>
            <figure className={styles.heroFigure}>
              <div className={styles.photoFrame}>
                <Image src="https://images.unsplash.com/photo-1589061434060-a05a5335bfbb?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Handen van twee generaties, op elkaar gelegd" fill priority sizes="(max-width: 760px) 100vw, 48vw" className={styles.photo} />
                <div className={styles.photoLabel} aria-hidden="true"><span>Aandacht maakt</span><em>het verschil.</em></div>
              </div>
              <figcaption><span>De mens achter het werk.</span><a href="https://unsplash.com/photos/9MTqeBaAOlU" target="_blank" rel="noopener noreferrer">Foto: Dulcey Lima / Unsplash</a></figcaption>
            </figure>
          </div>
          <div className={styles.heroBottom}><span>Zorgprofessional & opdrachtgever</span><p>Van de eerste kennismaking tot de laatste factuur.</p><span aria-hidden="true">↓</span></div>
        </section>

        <section id="voor-jou" className={styles.audience} aria-labelledby="audience-title">
          <div className={styles.sectionIntro}><p className={styles.kicker}>01 / Vind jouw plek</p><h2 id="audience-title">Goed werk begint<br />bij <em>wat jij nodig hebt.</em></h2></div>
          <div className={styles.audienceRows}>
            <article className={styles.audienceRow}>
              <span className={styles.rowNumber} aria-hidden="true">a.</span>
              <div><p className={styles.kicker}>Voor zorgprofessionals</p><h3>Ik wil mijn vak<br />zelfstandig uitoefenen.</h3></div>
              <div className={styles.audienceDetail}><p>Vind opdrachten voor jouw expertise en beschikbaarheid. Maak rechtstreeks afspraken en houd je administratie bij de samenwerking.</p><Link href="/register" className={styles.actionLink}>Start als zorgprofessional <ArrowUpRight size={21} aria-hidden="true" /></Link></div>
            </article>
            <article className={styles.audienceRow}>
              <span className={styles.rowNumber} aria-hidden="true">b.</span>
              <div><p className={styles.kicker}>Voor opdrachtgevers</p><h3>Ik zoek expertise<br />voor mijn organisatie.</h3></div>
              <div className={styles.audienceDetail}><p>Maak je zorgvraag concreet. Bekijk reacties en documentstatussen, leg de inzet vast en beoordeel de gewerkte uren op één plek.</p><Link href="/register" className={styles.actionLink}>Start als opdrachtgever <ArrowUpRight size={21} aria-hidden="true" /></Link></div>
            </article>
          </div>
          <p className={styles.pilotNote}>We nemen Handslag stap voor stap in gebruik. Een account is de eerste kennismaking.</p>
        </section>

        <section id="zo-werkt-het" className={styles.process} aria-labelledby="process-title">
          <div className={styles.processIntro}><p className={styles.kicker}>02 / Het werk eromheen</p><h2 id="process-title">De dienst zit erop.<br /><em>En de rest?</em></h2><p>Een tarief in een bericht. Uren in een losse mail. Een document dat je opnieuw moet opzoeken. Bij Handslag blijven die stappen bij dezelfde samenwerking.</p><span className={styles.processSignature}>Afgesproken. Terug te vinden.</span></div>
          <div className={styles.workflow}>
            {workflow.map((step, index) => <details key={step.number} open={index === 0}><summary><span>{step.number}</span><h3>{step.title}</h3><Plus size={20} aria-hidden="true" /></summary><div className={styles.stepBody}><p>{step.text}</p><span>{step.note}</span></div></details>)}
            <div className={styles.paymentNote}><p>Over betalen zijn we duidelijk.</p><span>De betaling loopt rechtstreeks van opdrachtgever naar professional. Handslag houdt de factuur en betaalstatus bij.</span><a href="#vragen">Lees de uitleg <ArrowDown size={15} aria-hidden="true" /></a></div>
          </div>
        </section>

        <section id="vragen" className={styles.faq} aria-labelledby="faq-title">
          <div><p className={styles.kicker}>03 / Voor je begint</p><h2 id="faq-title">Nog even<br /><em>dit.</em></h2></div>
          <div className={styles.questions}>{questions.map((item)=><details key={item.question}><summary>{item.question}<Plus size={20} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title"><p className={styles.kicker}>Aangenaam. Wij zijn Handslag.</p><div><h2 id="closing-title">Laten we<br /><em>kennismaken.</em></h2><a href="#voor-jou" className={styles.closingLink} aria-label="Kies jouw rol bij Handslag"><ArrowUpRight aria-hidden="true" /><span>Kies jouw rol</span></a></div></section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}><span>Samenwerken in de zorg.</span><a href="#inhoud">Terug naar boven ↑</a></div>
        <div className={styles.footerWord} aria-hidden="true">handslag.</div>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Handslag</span><nav aria-label="Juridische informatie"><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link><Link href="/cookies">Cookies</Link><Link href="/login">Inloggen</Link></nav></div>
      </footer>
    </div>
  );
}
