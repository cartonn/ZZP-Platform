import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, FileCheck2, MapPin } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Handslag — Goed werk begint met een handslag",
  description:
    "Handslag brengt zelfstandige zorgprofessionals en opdrachtgevers samen. Van een passende opdracht tot afspraken, documenten, uren en facturen: overzicht op één plek.",
  alternates: { canonical: "https://handslag.nl" },
  openGraph: {
    title: "Handslag — Goed werk begint met een handslag",
    description: "Voor mensen die zorgen. En de mensen die hen nodig hebben.",
    url: "https://handslag.nl",
    locale: "nl_NL",
    type: "website",
  },
};

const steps = [
  {
    number: "01",
    title: "Vind elkaar.",
    text: "Een opdracht, een vakgebied en beschikbaarheid die aansluiten. Bekijk de mogelijkheden en maak kennis.",
  },
  {
    number: "02",
    title: "Spreek het af.",
    text: "Maak tarief, inzet en verwachtingen concreet. Leg jullie afspraken vast voordat de samenwerking begint.",
  },
  {
    number: "03",
    title: "Houd overzicht.",
    text: "Registreer gewerkte uren, laat ze beoordelen en volg de factuur. Alles blijft verbonden aan de opdracht.",
  },
];

const questions = [
  {
    question: "Voor wie is Handslag?",
    answer:
      "Handslag is bedoeld voor zelfstandige zorgprofessionals en organisaties die met hen samenwerken. Ook bemiddelaars kunnen hun samenwerkingen in het platform organiseren.",
  },
  {
    question: "Wat kan ik met het platform regelen?",
    answer:
      "Je kunt opdrachten en reacties beheren, afspraken vastleggen, documenten voor beoordeling aanleveren en gewerkte uren en facturen bijhouden. Welke stappen je ziet, hangt af van je rol en de samenwerking.",
  },
  {
    question: "Hoe worden facturen betaald?",
    answer:
      "De opdrachtgever betaalt de zzp’er rechtstreeks, buiten Handslag om. Handslag helpt bij de facturatie en het bijhouden van de betaalstatus. Het platform biedt op dit moment geen voorfinanciering of betalingsgarantie.",
  },
  {
    question: "Wat betekent een documentbeoordeling?",
    answer:
      "De status laat zien of een aangeleverd document is beoordeeld en of de geldigheid aandacht vraagt. Dit is geen garantie dat iedere opdracht juridisch of beroepsmatig is toegestaan. Opdrachtgever en professional blijven hun eigen verantwoordelijkheden houden.",
  },
  {
    question: "Kan ik al aan de slag?",
    answer:
      "Handslag wordt gefaseerd in gebruik genomen. Je kunt een account aanmaken om kennis te maken. Controleer vóór een echte samenwerking welke dienstverlening en voorwaarden voor jou beschikbaar zijn. Voorbeeldgegevens op deze pagina zijn uitsluitend illustratief.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.landing}>
      <a className={styles.skip} href="#inhoud">Naar inhoud</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Handslag — home">
          <BrandMark size={34} />
          <span>handslag<span className={styles.brandDot}>.</span></span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Hoofdnavigatie">
          <a href="#voor-jou">Voor wie</a>
          <a href="#zo-werkt-het">Zo werkt het</a>
          <a href="#overzicht">Het platform</a>
        </nav>
        <Link className={styles.login} href="/login">Inloggen <ArrowUpRight size={17} aria-hidden="true" /></Link>
        <details className={styles.mobileMenu}>
          <summary>Menu</summary>
          <nav aria-label="Mobiele navigatie">
            <a href="#voor-jou">Voor wie</a>
            <a href="#zo-werkt-het">Zo werkt het</a>
            <a href="#overzicht">Het platform</a>
            <a href="#vragen">Veelgestelde vragen</a>
          </nav>
        </details>
      </header>

      <main id="inhoud">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.dot} /> Samenwerken in de zorg</p>
            <h1 id="hero-title">Goed werk<br />begint met een<br /><em>handslag.</em></h1>
            <p className={styles.intro}>Voor mensen die zorgen. En de mensen die hen nodig hebben. Vind elkaar en houd grip op alles wat daarna komt.</p>
            <div className={styles.actions}>
              <a className={styles.primary} href="#voor-jou">Ontdek jouw mogelijkheden <ArrowUpRight size={19} aria-hidden="true" /></a>
              <a className={styles.textLink} href="#zo-werkt-het">Zo werkt Handslag <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className={styles.heroNote}>Opdrachten · Afspraken · Administratie</p>
          </div>
          <figure className={styles.heroVisual} aria-label="Illustratie van een samenwerking: opdracht, afspraken en uren">
            <div className={styles.arch} aria-hidden="true"><span>&amp;</span><i /><i /></div>
            <div className={styles.orbitLabel} aria-hidden="true">Goed voor elkaar.</div>
            <div className={styles.assignment}>
              <div className={styles.cardTop}><span>Een passende opdracht</span><ArrowUpRight size={19} aria-hidden="true" /></div>
              <div className={styles.assignmentIcon}><CalendarDays size={26} aria-hidden="true" /></div>
              <h2>Ruimte voor<br />jouw vak.</h2>
              <p>Verpleegkundige · Wijkzorg</p>
              <div className={styles.location}><MapPin size={14} aria-hidden="true" /> Bij jou in de regio</div>
              <div className={styles.cardRule} />
              <div className={styles.availability}><span>Jouw beschikbaarheid</span><strong>Jouw keuze</strong></div>
              <div className={styles.week} aria-hidden="true"><span>MA</span><span>DI</span><span>WO</span><span>DO</span><span>VR</span><b>✓</b><b>✓</b><i>—</i><b>✓</b><i>—</i></div>
            </div>
            <div className={styles.agreement}><span className={styles.roundIcon}><FileCheck2 size={21} aria-hidden="true" /></span><div><strong>Afspraken vastgelegd</strong><span>Een helder begin voor allebei.</span></div><Check size={17} aria-hidden="true" /></div>
            <div className={styles.hours}><span className={styles.smallLabel}>Na de dienst</span><strong>Uren klaar<br />voor akkoord.</strong><div><span className={styles.checkCircle}><Check size={15} aria-hidden="true" /></span><span>De volgende stap is duidelijk</span></div></div>
            <figcaption>Een voorbeeld van hoe het samenkomt.</figcaption>
          </figure>
        </section>

        <div className={styles.promiseStrip} aria-label="De basis van Handslag">
          <span><Check size={17} aria-hidden="true" /> Rechtstreeks contact</span>
          <span><Check size={17} aria-hidden="true" /> Afspraken bij elkaar</span>
          <span><Check size={17} aria-hidden="true" /> Inzicht in de volgende stap</span>
        </div>

        <section id="voor-jou" className={styles.audience} aria-labelledby="audience-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Twee kanten. Eén handslag.</p>
            <h2 id="audience-title">Jouw werk.<br /><em>Jullie samenwerking.</em></h2>
            <p>Een goede samenwerking begint bij wat je nodig hebt. Kies jouw kant van Handslag.</p>
          </div>
          <div className={styles.audienceGrid}>
            <article className={styles.professional}>
              <div className={styles.audienceTop}><span>Voor zorgprofessionals</span><span aria-hidden="true">01 /</span></div>
              <h3>Jij doet waar<br />je goed in bent.</h3>
              <p>Vind opdrachten die aansluiten bij jouw vak en beschikbaarheid. Met je profiel, documenten en administratie op één plek.</p>
              <ul><li><Check size={16} aria-hidden="true" /> Laat zien wat je meebrengt</li><li><Check size={16} aria-hidden="true" /> Maak rechtstreeks afspraken</li><li><Check size={16} aria-hidden="true" /> Houd je uren en facturen bij</li></ul>
              <Link href="/register" className={styles.primary}>Start als zorgprofessional <ArrowUpRight size={19} aria-hidden="true" /></Link>
              <span className={styles.audienceDecoration} aria-hidden="true">jij.</span>
            </article>
            <article className={styles.organization}>
              <div className={styles.audienceTop}><span>Voor opdrachtgevers</span><span aria-hidden="true">02 /</span></div>
              <h3>De juiste mensen.<br />Een helder overzicht.</h3>
              <p>Breng je vraag en de juiste expertise samen. Volg reacties, gemaakte afspraken en gewerkte uren vanuit één werkplek.</p>
              <ul><li><Check size={16} aria-hidden="true" /> Maak je opdracht concreet</li><li><Check size={16} aria-hidden="true" /> Bekijk profielen en documentstatussen</li><li><Check size={16} aria-hidden="true" /> Beoordeel uren en volg de factuur</li></ul>
              <Link href="/register" className={styles.secondary}>Start als opdrachtgever <ArrowUpRight size={19} aria-hidden="true" /></Link>
              <span className={styles.audienceDecoration} aria-hidden="true">samen.</span>
            </article>
          </div>
        </section>

        <section id="zo-werkt-het" className={styles.process} aria-labelledby="process-title">
          <div className={styles.processHeading}><p className={styles.eyebrow}>Van kennismaking tot afronding</p><h2 id="process-title">Een goed begin.<br />Een duidelijke <em>volgende stap.</em></h2></div>
          <div className={styles.steps}>{steps.map((step) => (<article key={step.number}><span className={styles.stepNumber}>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>))}</div>
        </section>

        <section id="overzicht" className={styles.overview} aria-labelledby="overview-title">
          <div className={styles.overviewVisual}>
            <div className={styles.workspace}>
              <div className={styles.workspaceHeader}><BrandMark size={24} /><span>Jouw samenwerking</span><span className={styles.example}>Voorbeeld</span></div>
              <p className={styles.smallLabel}>Alles loopt met je mee</p>
              <h3>Van afspraak<br />naar overzicht.</h3>
              <ol className={styles.workflow}>
                <li><span>01</span><div><strong>Opdracht &amp; afspraken</strong><small>Wat jullie samen hebben afgesproken</small></div><Check size={17} aria-hidden="true" /></li>
                <li><span>02</span><div><strong>Documenten</strong><small>Inzicht in beoordeling en geldigheid</small></div><Check size={17} aria-hidden="true" /></li>
                <li><span>03</span><div><strong>Gewerkte uren</strong><small>Indienen en beoordelen</small></div><ArrowRight size={17} aria-hidden="true" /></li>
                <li><span>04</span><div><strong>Factuur &amp; betaalstatus</strong><small>Terug te vinden bij de opdracht</small></div><ArrowRight size={17} aria-hidden="true" /></li>
              </ol>
            </div>
            <div className={styles.marginNote}>Minder losse eindjes.<br /><em>Meer samenhang.</em></div>
          </div>
          <div className={styles.overviewCopy}>
            <p className={styles.eyebrow}>Het platform achter de handslag</p>
            <h2 id="overview-title">Alle aandacht<br />voor de zorg.<br /><em>Overzicht in de rest.</em></h2>
            <p>Een afspraak hier. Een document daar. Uren in een losse mail. Handslag brengt de stappen van een samenwerking bij elkaar, zodat je weet wat er is geregeld en wat nog aandacht vraagt.</p>
            <div className={styles.featureRow}><FileCheck2 size={23} aria-hidden="true" /><div><h3>Documenten met een status</h3><p>Zie wat is aangeleverd, beoordeeld of aan vernieuwing toe is.</p></div></div>
            <div className={styles.featureRow}><CalendarDays size={23} aria-hidden="true" /><div><h3>Afspraken die je terugvindt</h3><p>Houd opdracht, uren en factuur bij dezelfde samenwerking.</p></div></div>
            <Link href="/register" className={styles.textLink}>Maak kennis met het platform <ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>

        <section className={styles.manifesto} aria-label="Waar Handslag voor staat"><span aria-hidden="true">“</span><p>Goed samenwerken<br />is mensenwerk.<br /><em>Dat houden we graag zo.</em></p><div>Jullie maken de afspraken.<br />Handslag helpt het overzicht te bewaren.</div></section>

        <section id="vragen" className={styles.faq} aria-labelledby="faq-title">
          <div><p className={styles.eyebrow}>Even helder</p><h2 id="faq-title">Goed om<br /><em>te weten.</em></h2><p>De belangrijkste vragen voordat je begint.</p></div>
          <div className={styles.questions}>{questions.map((item) => (<details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>))}</div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title"><p className={styles.eyebrow}>Klaar voor een kennismaking?</p><h2 id="closing-title">Het begint<br />met <em>elkaar.</em></h2><a className={styles.primary} href="#voor-jou">Vind jouw plek bij Handslag <ArrowUpRight size={19} aria-hidden="true" /></a><p>Voor zorgprofessionals en opdrachtgevers.</p><div className={styles.closingRing} aria-hidden="true" /><div className={styles.closingRingTwo} aria-hidden="true" /></section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}><Link href="/" className={styles.brand}><BrandMark size={32} /><span>handslag.</span></Link><p>Goed werk begint met een handslag.</p><a href="#inhoud" className={styles.textLink}>Terug naar boven ↑</a></div>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Handslag</span><nav aria-label="Juridische informatie"><Link href="/privacy">Privacy</Link><Link href="/voorwaarden">Voorwaarden</Link><Link href="/cookies">Cookies</Link><Link href="/login">Inloggen</Link></nav></div>
      </footer>
    </div>
  );
}
