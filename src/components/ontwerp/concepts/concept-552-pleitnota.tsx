"use client";

// Concept 552 — "Pleitnota" · het platform als juridisch processtuk. Een match is geen score maar
// een betoog: links de stelling ("waarom deze opdracht past"), rechts het weerwoord ("wat ontbreekt"),
// doorlopend genummerd (1.1, 1.2, 2.1 …) met marginalia in de kantlijn die naar bewijsstukken
// verwijzen. Verificatie wordt de bewijsbundel: elk certificaat is een genummerd bewijsstuk met een
// zegelstatus. Ivoorwit papier, diepzwarte inkt, één bordeauxrood zegel-accent. Geen kaarten, geen
// schaduwen — dit is een document, met kantlijnen en regelnummers.
// Bronnen (research): nl.wikipedia.org "Pleitnota"; armarium.nl procesreglement "Indienen en ordenen
// van stukken en producties"; lawspot.nl over doorgenummerde producties; Maastricht University
// "Instructie voor het opstellen van een pleitnota" — kern: genummerde alinea's, doorlopend
// genummerde producties per partij, korte zinnen, verwijzing naar bewijsstuk bij elke stelling.
// Fonts: Cormorant Garamond (kop + lopende tekst) + IBM Plex Mono (nummering).
// Deterministisch — geen random, geen datum.

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Gavel,
  Minus,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Stamp,
  Unplug,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  ACTIES,
  CREDENTIALS,
  DOCUMENTEN,
  FACTUREN,
  KPIS,
  OPDRACHTEN,
  PROFIEL,
  type CredStatus,
  type Opdracht,
  type ScreenKey,
} from "./mock";

// ── Palet — papier, inkt, één zegel ───────────────────────────────────────────────────
const P = {
  papier: "#faf8f3",
  papierDiep: "#f2eee4",
  inkt: "#16130f",
  inktZacht: "#4a453c",
  inktLicht: "#79736a",
  lijn: "#ddd6c8",
  lijnFijn: "#eae4d7",
  zegel: "#8b1e2d",
  zegelZacht: "#f0e2e4",
  groen: "#3f5c43",
  amber: "#8a6520",
};

const serif = { fontFamily: "var(--font-lab-cormorant)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b1e2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f3]";

// ── Schermen — als onderdelen van een processtuk ──────────────────────────────────────
type Scherm = ScreenKey | "admin" | "profiel";

const SCHERMEN: { key: Scherm; label: string; nr: string }[] = [
  { key: "dashboard", label: "Zaakoverzicht", nr: "I" },
  { key: "marktplaats", label: "De rol", nr: "II" },
  { key: "opdracht", label: "Pleitnota", nr: "III" },
  { key: "verificatie", label: "Bewijsbundel", nr: "IV" },
  { key: "acties", label: "Termijnen", nr: "V" },
  { key: "facturen", label: "Declaraties", nr: "VI" },
  { key: "documenten", label: "Dossierstukken", nr: "VII" },
  { key: "profiel", label: "Persoonsdossier", nr: "VIII" },
  { key: "admin", label: "Griffie", nr: "IX" },
];

// Lokale, puur presentationele demo-content voor de griffie (beoordelingsrij).
const GRIFFIE: {
  zaak: string;
  indiener: string;
  stuk: string;
  ingediend: string;
  termijn: string;
  spoed: boolean;
}[] = [
  {
    zaak: "B-2026/041",
    indiener: "Sanne de Vries",
    stuk: "Bewijsstuk B-4 · Reanimatie / BLS",
    ingediend: "21 juni",
    termijn: "nog 3 dagen",
    spoed: true,
  },
  {
    zaak: "B-2026/039",
    indiener: "Marijn Bakker",
    stuk: "Bewijsstuk B-2 · VOG (zorg)",
    ingediend: "20 juni",
    termijn: "nog 4 dagen",
    spoed: true,
  },
  {
    zaak: "B-2026/034",
    indiener: "Iris Hoekstra",
    stuk: "Bewijsstuk B-1 · Diploma VIG",
    ingediend: "17 juni",
    termijn: "nog 9 dagen",
    spoed: false,
  },
  {
    zaak: "B-2026/028",
    indiener: "Youssef Amrani",
    stuk: "Bewijsstuk B-3 · BIG-registratie",
    ingediend: "12 juni",
    termijn: "nog 14 dagen",
    spoed: false,
  },
];

// ── Statustaal — zegel, label én icoon; nooit kleur alleen ────────────────────────────
function zegelMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  kleur: string;
  toelichting: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Gezegeld",
        Icon: Check,
        kleur: P.groen,
        toelichting: "Toegelaten tot het dossier",
      };
    case "SUBMITTED":
      return {
        label: "In behandeling",
        Icon: Clock,
        kleur: P.inktLicht,
        toelichting: "Ligt ter beoordeling bij de griffie",
      };
    case "EXPIRING":
      return {
        label: "Vervalt",
        Icon: AlertTriangle,
        kleur: P.amber,
        toelichting: "Zegel verliest binnenkort zijn kracht",
      };
    case "REJECTED":
      return {
        label: "Geweigerd",
        Icon: X,
        kleur: P.zegel,
        toelichting: "Buiten beschouwing gelaten, met reden",
      };
  }
}

// ── Zegel — bordeauxrode stempel, puur CSS ────────────────────────────────────────────
function Zegel({ status, klein = false }: { status: CredStatus; klein?: boolean }) {
  const m = zegelMeta(status);
  const maat = klein ? 54 : 76;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: maat,
        height: maat,
        border: `2px solid ${m.kleur}`,
        boxShadow: `inset 0 0 0 3px ${P.papier}, inset 0 0 0 4px ${m.kleur}33`,
        color: m.kleur,
        transform: "rotate(-6deg)",
      }}
      role="img"
      aria-label={`Zegelstatus: ${m.label}`}
    >
      <span className="flex flex-col items-center justify-center text-center leading-none">
        <m.Icon size={klein ? 13 : 17} strokeWidth={2.4} aria-hidden="true" />
        <span
          className="mt-1 px-1 uppercase"
          style={{ ...mono, fontSize: klein ? 7 : 8.5, letterSpacing: "0.08em" }}
        >
          {m.label}
        </span>
      </span>
    </span>
  );
}

// ── Kantlijn-marginalia ───────────────────────────────────────────────────────────────
function Marginale({ children }: { children: ReactNode }) {
  return (
    <span
      className="block text-[10.5px] uppercase leading-relaxed"
      style={{ ...mono, color: P.zegel, letterSpacing: "0.06em" }}
    >
      {children}
    </span>
  );
}

// ── Genummerde alinea met kantlijn ────────────────────────────────────────────────────
function Alinea({
  nr,
  marginalia,
  children,
}: {
  nr: string;
  marginalia?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[64px_minmax(0,1fr)] lg:grid-cols-[64px_minmax(0,1fr)_150px]">
      <span
        className="pt-[3px] text-[12px] tabular-nums"
        style={{ ...mono, color: P.inktLicht }}
        aria-hidden="true"
      >
        {nr}
      </span>
      <p className="text-[16px] leading-[1.65]" style={{ ...serif, color: P.inkt }}>
        <span className="sr-only">Alinea {nr}. </span>
        {children}
      </p>
      <span className="hidden pt-1 lg:block">
        {marginalia ? <Marginale>{marginalia}</Marginale> : null}
      </span>
      {marginalia ? (
        <span className="col-start-1 sm:col-start-2 lg:hidden">
          <Marginale>{marginalia}</Marginale>
        </span>
      ) : null}
    </div>
  );
}

// ── Vel — het papier met kantlijnstreep ───────────────────────────────────────────────
function Vel({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <section
      className="relative px-4 py-7 sm:px-8"
      style={{
        background: P.papier,
        border: `1px solid ${P.lijn}`,
        borderLeft: `3px double ${P.zegel}`,
      }}
      aria-label={label}
    >
      {children}
    </section>
  );
}

// ── Kop van een processtuk ────────────────────────────────────────────────────────────
function StukKop({
  bovenschrift,
  titel,
  onderschrift,
  nummer,
}: {
  bovenschrift: string;
  titel: string;
  onderschrift: string;
  nummer: string;
}) {
  return (
    <header className="mb-7">
      <p
        className="text-[10.5px] uppercase"
        style={{ ...mono, color: P.zegel, letterSpacing: "0.22em" }}
      >
        Onderdeel {nummer} — {bovenschrift}
      </p>
      <h1
        className="mt-2 text-[30px] leading-[1.08] sm:text-[40px]"
        style={{ ...serif, color: P.inkt, fontWeight: 500 }}
      >
        {titel}
      </h1>
      <p
        className="mt-2 max-w-2xl text-[15px] italic leading-relaxed"
        style={{ ...serif, color: P.inktZacht }}
      >
        {onderschrift}
      </p>
      <span aria-hidden="true" className="mt-5 block h-px w-full" style={{ background: P.lijn }} />
    </header>
  );
}

// ── Staten in de documenttaal ─────────────────────────────────────────────────────────
type Toestand = "stuk" | "laden" | "fout";

function Skelet() {
  return (
    <Vel label="Stuk wordt opgehaald">
      <p
        className="mb-5 text-[11px] uppercase"
        style={{ ...mono, color: P.inktLicht, letterSpacing: "0.18em" }}
        aria-busy="true"
        aria-live="polite"
      >
        Stuk wordt uit het dossier gelicht…
      </p>
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid gap-4 sm:grid-cols-[64px_minmax(0,1fr)]" aria-hidden="true">
            <span className="text-[12px] tabular-nums" style={{ ...mono, color: P.lijn }}>
              {Math.floor(i / 2) + 1}.{(i % 2) + 1}
            </span>
            <span className="space-y-2">
              <span
                className="pl-skel block h-3.5"
                style={{ background: P.papierDiep, width: `${94 - i * 6}%` }}
              />
              <span
                className="pl-skel block h-3.5"
                style={{ background: P.papierDiep, width: `${72 - i * 5}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </Vel>
  );
}

function FoutVel({ onHerstel }: { onHerstel: () => void }) {
  return (
    <Vel label="Storing">
      <div className="mx-auto max-w-lg py-6 text-center" role="alert">
        <Unplug size={26} strokeWidth={1.8} style={{ color: P.zegel }} className="mx-auto" />
        <h2 className="mt-4 text-[26px] leading-tight" style={{ ...serif, color: P.inkt }}>
          Het dossier is niet bereikbaar
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed"
          style={{ ...serif, color: P.inktZacht }}
        >
          De verbinding met de griffie is verbroken. Er worden geen stukken getoond zolang wij niet
          kunnen vaststellen dat ze volledig en actueel zijn.
        </p>
        <button
          type="button"
          onClick={onHerstel}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase ${FOCUS}`}
          style={{ ...mono, background: P.zegel, color: P.papier, letterSpacing: "0.16em" }}
        >
          Stuk opnieuw opvragen <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </Vel>
  );
}

function LeegVel({
  titel,
  tekst,
  knop,
  onKnop,
}: {
  titel: string;
  tekst: string;
  knop: string;
  onKnop: () => void;
}) {
  return (
    <Vel label="Geen stukken">
      <div className="mx-auto max-w-lg py-8 text-center">
        <FileText size={26} strokeWidth={1.6} style={{ color: P.inktLicht }} className="mx-auto" />
        <h2 className="mt-4 text-[24px] leading-tight" style={{ ...serif, color: P.inkt }}>
          {titel}
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed"
          style={{ ...serif, color: P.inktZacht }}
        >
          {tekst}
        </p>
        <button
          type="button"
          onClick={onKnop}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase ${FOCUS}`}
          style={{
            ...mono,
            border: `1px solid ${P.inkt}`,
            color: P.inkt,
            letterSpacing: "0.16em",
          }}
        >
          {knop}
        </button>
      </div>
    </Vel>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────────────
export function Concept552() {
  const [scherm, setScherm] = useState<Scherm>("dashboard");
  const [toestand, setToestand] = useState<Toestand>("stuk");
  const zaak = OPDRACHTEN[0]!;
  const huidig = SCHERMEN.find((s) => s.key === scherm) ?? SCHERMEN[0]!;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...serif, background: P.papierDiep, color: P.inkt }}
    >
      <style>{`
        @keyframes plSkel { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pl-skel { animation: plSkel 1.4s ease-in-out infinite; }
        @keyframes plIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .pl-in { animation: plIn 300ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .pl-skel, .pl-in { animation: none !important; } }
      `}</style>

      {/* Briefhoofd */}
      <header
        className="w-full"
        style={{ background: P.papier, borderBottom: `1px solid ${P.lijn}` }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-8">
          <div className="flex items-start gap-3">
            <Scale
              size={26}
              strokeWidth={1.5}
              style={{ color: P.zegel }}
              aria-hidden="true"
              className="mt-1 shrink-0"
            />
            <div>
              <p className="text-[26px] leading-none sm:text-[30px]" style={{ ...serif }}>
                Pleitnota
              </p>
              <p
                className="mt-2 text-[10.5px] uppercase"
                style={{ ...mono, color: P.inktLicht, letterSpacing: "0.2em" }}
              >
                Inzake {PROFIEL.naam} · {PROFIEL.rol}
              </p>
            </div>
          </div>
          <dl className="text-right">
            <dt
              className="text-[10px] uppercase"
              style={{ ...mono, color: P.inktLicht, letterSpacing: "0.18em" }}
            >
              Zaaknummer
            </dt>
            <dd className="text-[15px]" style={{ ...mono, color: P.inkt }}>
              ZZP-2026/{huidig.nr}
            </dd>
          </dl>
        </div>
      </header>

      {/* Inhoudsopgave = navigatie */}
      <nav
        aria-label="Onderdelen van het stuk"
        className="w-full"
        style={{ background: P.papier, borderBottom: `1px solid ${P.lijn}` }}
      >
        <div
          role="tablist"
          aria-label="Onderdelen van het stuk"
          className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 sm:px-8"
        >
          {SCHERMEN.map((s) => {
            const aan = s.key === scherm;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                id={`pl-tab-${s.key}`}
                aria-selected={aan}
                aria-controls="pl-panel"
                onClick={() => setScherm(s.key)}
                className={`shrink-0 border-b-2 py-3 text-[12.5px] transition-colors ${FOCUS}`}
                style={{
                  ...serif,
                  borderColor: aan ? P.zegel : "transparent",
                  color: aan ? P.zegel : P.inktZacht,
                  fontWeight: aan ? 600 : 400,
                }}
              >
                <span
                  className="mr-1.5 text-[10px] uppercase"
                  style={{ ...mono, letterSpacing: "0.1em", opacity: 0.7 }}
                >
                  {s.nr}.
                </span>
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toestand-schakelaar — maakt laad- en foutstaat echt bereikbaar */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 pt-5 sm:px-8">
        <span
          className="text-[10px] uppercase"
          style={{ ...mono, color: P.inktLicht, letterSpacing: "0.18em" }}
        >
          Staat van het stuk
        </span>
        <div className="flex gap-2" role="group" aria-label="Staat van het stuk">
          {(["stuk", "laden", "fout"] as Toestand[]).map((t) => {
            const aan = toestand === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={aan}
                onClick={() => setToestand(t)}
                className={`px-3 py-1 text-[10px] uppercase transition-colors ${FOCUS}`}
                style={{
                  ...mono,
                  letterSpacing: "0.12em",
                  border: `1px solid ${aan ? P.zegel : P.lijn}`,
                  background: aan ? P.zegelZacht : "transparent",
                  color: aan ? P.zegel : P.inktZacht,
                }}
              >
                {t === "stuk" ? "Compleet" : t === "laden" ? "Wordt gelicht" : "Onbereikbaar"}
              </button>
            );
          })}
        </div>
      </div>

      <main
        id="pl-panel"
        role="tabpanel"
        aria-labelledby={`pl-tab-${huidig.key}`}
        className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-8"
      >
        <div key={scherm} className="pl-in">
          {toestand === "laden" ? (
            <Skelet />
          ) : toestand === "fout" ? (
            <FoutVel onHerstel={() => setToestand("stuk")} />
          ) : scherm === "dashboard" ? (
            <Zaakoverzicht
              onZaak={() => setScherm("opdracht")}
              onBundel={() => setScherm("verificatie")}
            />
          ) : scherm === "marktplaats" ? (
            <Rol onOpen={() => setScherm("opdracht")} />
          ) : scherm === "opdracht" ? (
            <PleitnotaStuk zaak={zaak} onTerug={() => setScherm("marktplaats")} />
          ) : scherm === "verificatie" ? (
            <Bewijsbundel />
          ) : scherm === "acties" ? (
            <Termijnen onBundel={() => setScherm("verificatie")} />
          ) : scherm === "facturen" ? (
            <Declaraties />
          ) : scherm === "documenten" ? (
            <Dossierstukken />
          ) : scherm === "profiel" ? (
            <Persoonsdossier />
          ) : (
            <Griffie />
          )}
        </div>
      </main>

      <footer className="w-full" style={{ background: P.papier, borderTop: `1px solid ${P.lijn}` }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-8">
          <p
            className="text-[10.5px] uppercase"
            style={{ ...mono, color: P.inktLicht, letterSpacing: "0.18em" }}
          >
            Getekend te Utrecht · onderdeel {huidig.nr} van {SCHERMEN.length}
          </p>
          <p className="text-[14px] italic" style={{ ...serif, color: P.inktZacht }}>
            Elk beroep op een bewijsstuk is naar de bundel verwezen.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── I. Zaakoverzicht ──────────────────────────────────────────────────────────────────
function Zaakoverzicht({ onZaak, onBundel }: { onZaak: () => void; onBundel: () => void }) {
  const zaak = OPDRACHTEN[0]!;
  const spoed = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0]!;

  return (
    <div className="space-y-5">
      <Vel label="Zaakoverzicht">
        <StukKop
          nummer="I"
          bovenschrift="Zaakoverzicht"
          titel="De stand van het dossier"
          onderschrift="Wat vaststaat, wat betwist is, en welke termijn als eerste dreigt te verlopen."
        />

        <div className="space-y-5">
          <Alinea nr="1.1" marginalia="Bewijsstuk B-1 t/m B-4">
            Het dossier telt {CREDENTIALS.length} bewijsstukken, waarvan er{" "}
            {CREDENTIALS.filter((c) => c.status === "VERIFIED").length} zijn gezegeld. De overige
            stukken zijn in behandeling of naderen hun vervaldatum en verzwakken daarmee de positie.
          </Alinea>
          <Alinea nr="1.2" marginalia="Zie onderdeel III">
            De sterkste zaak op de rol is <em>{zaak.titel}</em> bij {zaak.opdrachtgever} te{" "}
            {zaak.plaats}, met een onderbouwde overeenstemming van {zaak.match} procent.
          </Alinea>
          <Alinea nr="1.3" marginalia="Termijnbewaking">
            Eén termijn vraagt onmiddellijk aandacht: {spoed.titel.toLowerCase()}. Zonder handeling
            vervalt het betreffende zegel en daalt de bewijskracht van het volledige dossier.
          </Alinea>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onZaak}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase ${FOCUS}`}
            style={{ ...mono, background: P.inkt, color: P.papier, letterSpacing: "0.14em" }}
          >
            Lees de pleitnota <ArrowRight size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onBundel}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase ${FOCUS}`}
            style={{
              ...mono,
              border: `1px solid ${P.inkt}`,
              color: P.inkt,
              letterSpacing: "0.14em",
            }}
          >
            Open de bewijsbundel
          </button>
        </div>
      </Vel>

      <Vel label="Cijfermatige onderbouwing">
        <h2
          className="text-[11px] uppercase"
          style={{ ...mono, color: P.zegel, letterSpacing: "0.2em" }}
        >
          Bijlage — cijfermatige onderbouwing
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">Kerncijfers uit het dossier</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.inkt}` }}>
                {["Nr.", "Grootheid", "Stand", "Ontwikkeling", "Verloop"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="py-2 pr-4 text-[10px] uppercase"
                    style={{ ...mono, color: P.inktLicht, letterSpacing: "0.14em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KPIS.map((k, i) => (
                <tr key={k.label} style={{ borderBottom: `1px solid ${P.lijnFijn}` }}>
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left text-[12px]"
                    style={{ ...mono, color: P.inktLicht }}
                  >
                    2.{i + 1}
                  </th>
                  <td className="py-3 pr-4 text-[15px]" style={{ ...serif, color: P.inkt }}>
                    {k.label}
                  </td>
                  <td className="py-3 pr-4 text-[17px]" style={{ ...serif, color: P.inkt }}>
                    {k.value}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ ...mono, color: k.up ? P.groen : P.amber }}
                    >
                      {k.up ? (
                        <Plus size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Minus size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {k.trend}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="flex h-6 items-end gap-[2px]" aria-hidden="true">
                      {k.spark.map((v, j) => {
                        const max = Math.max(...k.spark);
                        return (
                          <span
                            key={j}
                            className="w-1"
                            style={{
                              height: `${Math.round((v / max) * 100)}%`,
                              background: j === k.spark.length - 1 ? P.zegel : P.lijn,
                            }}
                          />
                        );
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Vel>
    </div>
  );
}

// ── II. De rol — zakenlijst met zoekfilter ────────────────────────────────────────────
function Rol({ onOpen }: { onOpen: () => void }) {
  const [zoek, setZoek] = useState("");
  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    return OPDRACHTEN.filter(
      (o) =>
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t),
    );
  }, [zoek]);

  return (
    <div className="space-y-5">
      <Vel label="De rol">
        <StukKop
          nummer="II"
          bovenschrift="De rol"
          titel="Zaken die op de rol staan"
          onderschrift="Elke zaak is een aanhangig gemaakte opdracht, met de zittingsdatum als startdatum."
        />

        <label className="flex items-center gap-3 border-b pb-2" style={{ borderColor: P.lijn }}>
          <Search size={15} strokeWidth={1.8} style={{ color: P.inktLicht }} aria-hidden="true" />
          <span className="sr-only">Zoek in de rol</span>
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op zaak, wederpartij of plaats"
            className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:opacity-55"
            style={{ ...serif, color: P.inkt }}
          />
          {zoek && (
            <button
              type="button"
              onClick={() => setZoek("")}
              aria-label="Zoekterm wissen"
              className={`shrink-0 p-1 ${FOCUS}`}
            >
              <X size={14} strokeWidth={2.4} style={{ color: P.inktLicht }} aria-hidden="true" />
            </button>
          )}
        </label>

        {lijst.length === 0 ? (
          <div className="mt-6">
            <LeegVel
              titel="Geen zaak op de rol"
              tekst={`Voor “${zoek}” staat niets ingeschreven. Wis de zoekterm om de volledige rol terug te zien.`}
              knop="Zoekterm wissen"
              onKnop={() => setZoek("")}
            />
          </div>
        ) : (
          <ol className="mt-6 space-y-6">
            {lijst.map((o, i) => (
              <li key={o.id}>
                <article
                  className="grid gap-x-4 gap-y-2 border-t pt-5 sm:grid-cols-[64px_minmax(0,1fr)_auto]"
                  style={{ borderColor: P.lijn }}
                >
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ ...mono, color: P.inktLicht }}
                    aria-hidden="true"
                  >
                    {i + 1}.0
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[22px] leading-tight" style={{ ...serif, color: P.inkt }}>
                      {o.titel}
                    </h3>
                    <p
                      className="mt-1 text-[13px]"
                      style={{ ...mono, color: P.inktLicht, letterSpacing: "0.02em" }}
                    >
                      {o.id} · {o.opdrachtgever} · {o.plaats}
                    </p>
                    <p
                      className="mt-2.5 max-w-xl text-[15px] leading-relaxed"
                      style={{ ...serif, color: P.inktZacht }}
                    >
                      Gevorderd: {o.uren} vanaf {o.start}, tegen {o.tarief}. Onderbouwing steunt op{" "}
                      {o.redenen.plus.length} bevestigende omstandigheden; {o.redenen.min.length}{" "}
                      punt(en) worden betwist.
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {o.tags.map((t) => (
                        <li
                          key={t}
                          className="px-2 py-0.5 text-[10px] uppercase"
                          style={{
                            ...mono,
                            border: `1px solid ${P.lijn}`,
                            color: P.inktZacht,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="text-right">
                      <span
                        className="block text-[30px] leading-none"
                        style={{ ...serif, color: P.zegel }}
                      >
                        {o.match}%
                      </span>
                      <span
                        className="mt-1 block text-[9.5px] uppercase"
                        style={{ ...mono, color: P.inktLicht, letterSpacing: "0.14em" }}
                      >
                        onderbouwd
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={onOpen}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
                      style={{
                        ...mono,
                        border: `1px solid ${P.inkt}`,
                        color: P.inkt,
                        letterSpacing: "0.14em",
                      }}
                    >
                      Pleitnota <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </Vel>
    </div>
  );
}

// ── III. Pleitnota — stelling tegenover weerwoord ─────────────────────────────────────
function PleitnotaStuk({ zaak, onTerug }: { zaak: Opdracht; onTerug: () => void }) {
  const [weerwoord, setWeerwoord] = useState(true);
  const [ingediend, setIngediend] = useState(false);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onTerug}
        className={`inline-flex items-center gap-2 text-[10.5px] uppercase ${FOCUS}`}
        style={{ ...mono, color: P.inktZacht, letterSpacing: "0.16em" }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar de rol
      </button>

      <Vel label="Pleitnota">
        <StukKop
          nummer="III"
          bovenschrift={`Zaak ${zaak.id}`}
          titel={zaak.titel}
          onderschrift={`Inzake ${PROFIEL.naam} tegen ${zaak.opdrachtgever} te ${zaak.plaats} — ${zaak.uren}, ${zaak.start}, ${zaak.tarief}.`}
        />

        <div
          className="mb-7 flex flex-wrap items-center justify-between gap-4 border-y py-4"
          style={{ borderColor: P.lijn }}
        >
          <p className="flex items-baseline gap-3">
            <span className="text-[44px] leading-none" style={{ ...serif, color: P.zegel }}>
              {zaak.match}%
            </span>
            <span className="text-[14px] italic" style={{ ...serif, color: P.inktZacht }}>
              onderbouwde overeenstemming, opgebouwd uit {zaak.redenen.plus.length} stellingen en{" "}
              {zaak.redenen.min.length} weren
            </span>
          </p>
          <button
            type="button"
            onClick={() => setWeerwoord((v) => !v)}
            aria-pressed={weerwoord}
            className={`inline-flex items-center gap-2 px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
            style={{
              ...mono,
              letterSpacing: "0.14em",
              border: `1px solid ${weerwoord ? P.zegel : P.lijn}`,
              background: weerwoord ? P.zegelZacht : "transparent",
              color: weerwoord ? P.zegel : P.inktZacht,
            }}
          >
            <Gavel size={13} strokeWidth={1.9} aria-hidden="true" />
            {weerwoord ? "Weerwoord getoond" : "Weerwoord verborgen"}
          </button>
        </div>

        {/* Adversariële twee-kolomsopmaak */}
        <div className={`grid gap-8 ${weerwoord ? "lg:grid-cols-2" : ""}`}>
          <section aria-labelledby="pl-stelling">
            <h2
              id="pl-stelling"
              className="mb-4 text-[11px] uppercase"
              style={{ ...mono, color: P.inkt, letterSpacing: "0.2em" }}
            >
              A. De stelling — waarom deze zaak past
            </h2>
            <div className="space-y-4">
              {zaak.redenen.plus.map((r, i) => (
                <Alinea key={r} nr={`3.${i + 1}`} marginalia={`bewijsstuk B-${i + 1}`}>
                  {r}. Dit blijkt uit het gezegelde bewijsstuk in de bundel en is door de griffie
                  vastgesteld, niet door de wederpartij gesteld.
                </Alinea>
              ))}
              <Alinea nr={`3.${zaak.redenen.plus.length + 1}`} marginalia="conclusie">
                Op grond van het voorgaande is de opdracht passend en kan zonder voorbehoud worden
                gereageerd.
              </Alinea>
            </div>
          </section>

          {weerwoord && (
            <section
              aria-labelledby="pl-weerwoord"
              className="lg:border-l lg:pl-8"
              style={{ borderColor: P.lijn }}
            >
              <h2
                id="pl-weerwoord"
                className="mb-4 text-[11px] uppercase"
                style={{ ...mono, color: P.zegel, letterSpacing: "0.2em" }}
              >
                B. Het weerwoord — wat ontbreekt
              </h2>
              <div className="space-y-4">
                {zaak.redenen.min.map((r, i) => (
                  <Alinea key={r} nr={`4.${i + 1}`} marginalia="betwist">
                    {r}. Dit punt is niet met een gezegeld stuk onderbouwd en weegt daarom als
                    voorbehoud mee in de beoordeling.
                  </Alinea>
                ))}
                <Alinea nr={`4.${zaak.redenen.min.length + 1}`} marginalia="advies">
                  Het voorbehoud vervalt zodra het ontbrekende bewijsstuk is aangeleverd en
                  gezegeld.
                </Alinea>
              </div>
            </section>
          )}
        </div>

        <div className="mt-8 border-t pt-6" style={{ borderColor: P.lijn }}>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setIngediend(true)}
              disabled={ingediend}
              className={`inline-flex items-center gap-2 px-5 py-3 text-[11px] uppercase disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`}
              style={{
                ...mono,
                background: ingediend ? P.inktLicht : P.zegel,
                color: P.papier,
                letterSpacing: "0.16em",
              }}
            >
              {ingediend ? "Reactie ingediend" : "Reactie indienen"}
              {ingediend ? (
                <Check size={14} strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <Stamp size={14} strokeWidth={1.9} aria-hidden="true" />
              )}
            </button>
            {ingediend && (
              <p
                className="text-[14px] italic"
                style={{ ...serif, color: P.inktZacht }}
                role="status"
              >
                Het stuk is ter griffie ingediend bij {zaak.opdrachtgever}. Een tweede indiening in
                dezelfde zaak is niet mogelijk.
              </p>
            )}
          </div>
        </div>
      </Vel>
    </div>
  );
}

// ── IV. Bewijsbundel ──────────────────────────────────────────────────────────────────
function Bewijsbundel() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[2]?.naam ?? null);
  const gezegeld = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-5">
      <Vel label="Bewijsbundel">
        <StukKop
          nummer="IV"
          bovenschrift="Producties"
          titel="De bewijsbundel"
          onderschrift={`Doorlopend genummerd, B-1 tot en met B-${CREDENTIALS.length}. ${gezegeld} van de ${CREDENTIALS.length} stukken zijn gezegeld en tellen volledig mee.`}
        />

        <ol className="space-y-5">
          {CREDENTIALS.map((c, i) => {
            const m = zegelMeta(c.status);
            const uit = open === c.naam;
            const nr = `B-${i + 1}`;
            return (
              <li key={c.naam} className="border-t pt-5" style={{ borderColor: P.lijn }}>
                <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)]">
                  <div className="flex justify-start sm:justify-center">
                    <Zegel status={c.status} klein />
                  </div>
                  <div className="min-w-0">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpen(uit ? null : c.naam)}
                        aria-expanded={uit}
                        aria-controls={`pl-bewijs-${i}`}
                        className={`flex w-full flex-wrap items-start justify-between gap-3 text-left ${FOCUS}`}
                      >
                        <span className="min-w-0">
                          <span
                            className="block text-[10.5px] uppercase"
                            style={{ ...mono, color: P.zegel, letterSpacing: "0.16em" }}
                          >
                            Bewijsstuk {nr}
                          </span>
                          <span
                            className="mt-1 block text-[21px] leading-tight"
                            style={{ ...serif, color: P.inkt }}
                          >
                            {c.naam}
                          </span>
                          <span
                            className="mt-1 block text-[13px]"
                            style={{ ...serif, color: P.inktZacht }}
                          >
                            {c.detail} — {m.toelichting}
                          </span>
                        </span>
                        <ChevronDown
                          size={18}
                          strokeWidth={1.9}
                          aria-hidden="true"
                          style={{
                            color: P.inktLicht,
                            transform: uit ? "rotate(180deg)" : "none",
                            transition: "transform 180ms",
                          }}
                        />
                      </button>
                    </h3>

                    {uit && (
                      <div
                        id={`pl-bewijs-${i}`}
                        className="mt-4 space-y-3 border-l-2 pl-4"
                        style={{ borderColor: P.lijnFijn }}
                      >
                        <Alinea nr={`${i + 1}.1`} marginalia={`prod. ${nr}`}>
                          Het stuk is door {PROFIEL.naam} in het geding gebracht en uitsluitend
                          zichtbaar voor de griffie. Opdrachtgevers zien de status, nooit het
                          bestand zelf.
                        </Alinea>
                        <Alinea nr={`${i + 1}.2`} marginalia="rechtsgevolg">
                          {c.status === "VERIFIED"
                            ? "Het zegel is geldig; het stuk telt volledig mee bij de beoordeling van elke zaak."
                            : c.status === "EXPIRING"
                              ? "Het zegel verliest binnenkort zijn kracht; zonder vervanging vervalt de bewijswaarde."
                              : c.status === "SUBMITTED"
                                ? "Het stuk ligt ter beoordeling; tot die tijd blijft het buiten de score."
                                : "Het stuk is met opgaaf van redenen geweigerd en kan opnieuw worden ingediend."}
                        </Alinea>
                        {c.status !== "VERIFIED" && (
                          <button
                            type="button"
                            className={`mt-1 inline-flex items-center gap-2 px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
                            style={{
                              ...mono,
                              background: P.inkt,
                              color: P.papier,
                              letterSpacing: "0.14em",
                            }}
                          >
                            Vervangend stuk indienen <ArrowRight size={13} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p
          className="mt-8 border-t pt-5 text-[14px] italic leading-relaxed"
          style={{ ...serif, color: P.inktZacht, borderColor: P.lijn }}
        >
          <ShieldCheck
            size={15}
            strokeWidth={1.8}
            className="mr-2 inline align-[-2px]"
            style={{ color: P.groen }}
            aria-hidden="true"
          />
          Weigering geschiedt uitsluitend met opgaaf van redenen; de beslissing en de reden worden
          in het logboek vastgelegd en aan de indiener meegedeeld.
        </p>
      </Vel>
    </div>
  );
}

// ── V. Termijnen ──────────────────────────────────────────────────────────────────────
function Termijnen({ onBundel }: { onBundel: () => void }) {
  const [afgedaan, setAfgedaan] = useState<string[]>([]);
  const lijst = ACTIES.filter((a) => !afgedaan.includes(a.titel));

  return (
    <div className="space-y-5">
      <Vel label="Termijnen">
        <StukKop
          nummer="V"
          bovenschrift="Termijnbewaking"
          titel="Wat als eerste vervalt"
          onderschrift="Op volgorde van dreigend verval. Elke termijn kent één handeling die het verval afwendt."
        />

        {lijst.length === 0 ? (
          <LeegVel
            titel="Geen lopende termijn"
            tekst="Alle termijnen zijn afgedaan. Zet de lijst terug om het overzicht opnieuw te bekijken."
            knop="Lijst terugzetten"
            onKnop={() => setAfgedaan([])}
          />
        ) : (
          <ol className="space-y-6">
            {lijst.map((a, i) => {
              const spoed = a.urgentie === "warning";
              return (
                <li key={a.titel} className="border-t pt-5" style={{ borderColor: P.lijn }}>
                  <div className="grid gap-x-4 gap-y-3 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
                    <span
                      className="text-[12px] tabular-nums"
                      style={{ ...mono, color: P.inktLicht }}
                      aria-hidden="true"
                    >
                      5.{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="flex items-center gap-2 text-[10.5px] uppercase"
                        style={{
                          ...mono,
                          color: spoed ? P.zegel : P.inktLicht,
                          letterSpacing: "0.16em",
                        }}
                      >
                        {spoed ? (
                          <AlertTriangle size={12} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
                        )}
                        {spoed ? "Fatale termijn" : "Gewone termijn"}
                      </p>
                      <h3
                        className="mt-1.5 text-[21px] leading-tight"
                        style={{ ...serif, color: P.inkt }}
                      >
                        {a.titel}
                      </h3>
                      <p
                        className="mt-1.5 max-w-xl text-[15px] leading-relaxed"
                        style={{ ...serif, color: P.inktZacht }}
                      >
                        {a.detail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                      <button
                        type="button"
                        onClick={onBundel}
                        className={`px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
                        style={{
                          ...mono,
                          background: spoed ? P.zegel : P.inkt,
                          color: P.papier,
                          letterSpacing: "0.14em",
                        }}
                      >
                        {a.cta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAfgedaan((v) => [...v, a.titel])}
                        className={`px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
                        style={{
                          ...mono,
                          border: `1px solid ${P.lijn}`,
                          color: P.inktZacht,
                          letterSpacing: "0.14em",
                        }}
                      >
                        Afgedaan
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {afgedaan.length > 0 && lijst.length > 0 && (
          <p className="mt-6 text-[13px]" style={{ ...mono, color: P.inktLicht }} role="status">
            {afgedaan.length} termijn(en) afgedaan ·{" "}
            <button
              type="button"
              onClick={() => setAfgedaan([])}
              className={`underline underline-offset-4 ${FOCUS}`}
              style={{ color: P.zegel }}
            >
              terugzetten
            </button>
          </p>
        )}
      </Vel>
    </div>
  );
}

// ── VI. Declaraties ───────────────────────────────────────────────────────────────────
function Declaraties() {
  const kleur = (s: string) =>
    s === "Betaald" ? P.groen : s === "Openstaand" ? P.zegel : P.inktLicht;
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");

  return (
    <div className="space-y-5">
      <Vel label="Declaraties">
        <StukKop
          nummer="VI"
          bovenschrift="Kostenstaat"
          titel="Declaraties en betalingen"
          onderschrift="Doorlopend genummerd per opdrachtgever. Een openstaande post is een lopende vordering."
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <caption className="sr-only">Declaraties met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.inkt}` }}>
                {["Nr.", "Kenmerk", "Wederpartij", "Datum", "Status", "Bedrag"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="py-2 pr-4 text-[10px] uppercase"
                    style={{ ...mono, color: P.inktLicht, letterSpacing: "0.14em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${P.lijnFijn}` }}>
                  <th
                    scope="row"
                    className="py-3.5 pr-4 text-left text-[12px]"
                    style={{ ...mono, color: P.inktLicht }}
                  >
                    6.{i + 1}
                  </th>
                  <td className="py-3.5 pr-4 text-[13px]" style={{ ...mono, color: P.inkt }}>
                    {f.nr}
                  </td>
                  <td className="py-3.5 pr-4 text-[15px]" style={{ ...serif, color: P.inkt }}>
                    {f.klant}
                  </td>
                  <td className="py-3.5 pr-4 text-[13px]" style={{ ...mono, color: P.inktZacht }}>
                    {f.datum}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10.5px] uppercase"
                      style={{ ...mono, color: kleur(f.status), letterSpacing: "0.12em" }}
                    >
                      {f.status === "Betaald" ? (
                        <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                      ) : f.status === "Openstaand" ? (
                        <Clock size={12} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <FileText size={12} strokeWidth={2.2} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-[17px]" style={{ ...serif, color: P.inkt }}>
                    {f.bedrag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-7 space-y-4">
          <Alinea nr="6.5" marginalia="vordering">
            Er staat {openstaand.length} declaratie open, samen € 1.350, verzonden aan{" "}
            {openstaand[0]?.klant ?? "de wederpartij"}. Na veertien dagen volgt van rechtswege een
            aanmaning.
          </Alinea>
          <Alinea nr="6.6" marginalia="concept">
            Eén stuk staat nog in concept en is dus niet in het geding gebracht; het telt niet mee
            in de omzet.
          </Alinea>
        </div>

        <button
          type="button"
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase ${FOCUS}`}
          style={{ ...mono, background: P.inkt, color: P.papier, letterSpacing: "0.14em" }}
        >
          Aanmaning opstellen <ArrowRight size={14} aria-hidden="true" />
        </button>
      </Vel>
    </div>
  );
}

// ── VII. Dossierstukken ───────────────────────────────────────────────────────────────
function Dossierstukken() {
  const [selectie, setSelectie] = useState<string[]>([]);
  const wissel = (naam: string) =>
    setSelectie((v) => (v.includes(naam) ? v.filter((n) => n !== naam) : [...v, naam]));

  return (
    <div className="space-y-5">
      <Vel label="Dossierstukken">
        <StukKop
          nummer="VII"
          bovenschrift="Inventaris"
          titel="Stukken in het dossier"
          onderschrift="Alles ligt privé opgeslagen. Vink aan wat je in één zaak in het geding wilt brengen."
        />

        <ol className="space-y-4">
          {DOCUMENTEN.map((d, i) => {
            const m = zegelMeta(d.status);
            const aan = selectie.includes(d.naam);
            return (
              <li key={d.naam} className="border-t pt-4" style={{ borderColor: P.lijnFijn }}>
                <button
                  type="button"
                  onClick={() => wissel(d.naam)}
                  aria-pressed={aan}
                  className={`grid w-full gap-x-4 gap-y-2 text-left sm:grid-cols-[64px_minmax(0,1fr)_auto] ${FOCUS}`}
                >
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ ...mono, color: aan ? P.zegel : P.inktLicht }}
                    aria-hidden="true"
                  >
                    7.{i + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block break-words text-[18px] leading-tight"
                      style={{ ...serif, color: P.inkt }}
                    >
                      {d.naam}
                    </span>
                    <span
                      className="mt-1 block text-[11.5px] uppercase"
                      style={{ ...mono, color: P.inktLicht, letterSpacing: "0.1em" }}
                    >
                      {d.type} · {d.grootte} · bijgewerkt {d.bijgewerkt}
                    </span>
                    <span
                      className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] uppercase"
                      style={{ ...mono, color: m.kleur, letterSpacing: "0.12em" }}
                    >
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                      {m.label} — {m.toelichting}
                    </span>
                  </span>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center self-start"
                    style={{
                      border: `1px solid ${aan ? P.zegel : P.lijn}`,
                      background: aan ? P.zegel : "transparent",
                    }}
                    aria-hidden="true"
                  >
                    {aan && <Check size={14} strokeWidth={3} style={{ color: P.papier }} />}
                  </span>
                  <span className="sr-only">
                    {aan ? "Aangevinkt om in te brengen" : "Niet aangevinkt"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div
          className="mt-7 flex flex-wrap items-center gap-3 border-t pt-5"
          style={{ borderColor: P.lijn }}
        >
          <button
            type="button"
            disabled={selectie.length === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`}
            style={{ ...mono, background: P.zegel, color: P.papier, letterSpacing: "0.14em" }}
          >
            In het geding brengen ({selectie.length}) <ArrowRight size={14} aria-hidden="true" />
          </button>
          <p className="text-[13.5px] italic" style={{ ...serif, color: P.inktZacht }}>
            {selectie.length === 0
              ? "Zolang niets is aangevinkt, blijft de knop gesloten — er lekt nooit een stuk per ongeluk."
              : `${selectie.length} stuk(ken) worden aan één zaak toegevoegd, niet aan het openbare profiel.`}
          </p>
        </div>
      </Vel>
    </div>
  );
}

// ── VIII. Persoonsdossier ─────────────────────────────────────────────────────────────
function Persoonsdossier() {
  const gezegeld = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const gegevens: { l: string; v: string }[] = [
    { l: "Naam", v: PROFIEL.naam },
    { l: "Hoedanigheid", v: PROFIEL.rol },
    { l: "Vestigingsplaats", v: PROFIEL.plaats },
    { l: "Vertrouwensniveau", v: PROFIEL.trust },
    { l: "Gezegelde stukken", v: `${gezegeld} van ${CREDENTIALS.length}` },
    { l: "Zaken op de rol", v: `${OPDRACHTEN.length} aanhangig` },
  ];

  return (
    <div className="space-y-5">
      <Vel label="Persoonsdossier">
        <StukKop
          nummer="VIII"
          bovenschrift="Partijgegevens"
          titel="Persoonsdossier"
          onderschrift="De gegevens waarop elke stelling in dit stuk steunt, met hun herkomst."
        />

        <div className="flex flex-wrap items-start gap-6">
          <Zegel status="VERIFIED" />
          <dl className="min-w-0 flex-1 space-y-0">
            {gegevens.map((g, i) => (
              <div
                key={g.l}
                className="grid gap-x-4 gap-y-1 border-b py-3 sm:grid-cols-[64px_minmax(0,200px)_minmax(0,1fr)]"
                style={{ borderColor: P.lijnFijn }}
              >
                <span
                  className="text-[12px] tabular-nums"
                  style={{ ...mono, color: P.inktLicht }}
                  aria-hidden="true"
                >
                  8.{i + 1}
                </span>
                <dt
                  className="text-[10.5px] uppercase"
                  style={{ ...mono, color: P.inktLicht, letterSpacing: "0.14em" }}
                >
                  {g.l}
                </dt>
                <dd className="text-[16px]" style={{ ...serif, color: P.inkt }}>
                  {g.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-7 space-y-4">
          <Alinea nr="8.7" marginalia="grondslag">
            Alle bovenstaande gegevens zijn server-zijdig vastgesteld. Het beeldscherm toont ze
            slechts; het beslist nergens over.
          </Alinea>
          <Alinea nr="8.8" marginalia="inzage">
            Van elke inzage in een document wordt een aantekening gemaakt: wie keek, wanneer, en met
            welke grondslag.
          </Alinea>
        </div>
      </Vel>
    </div>
  );
}

// ── IX. Griffie — beoordelingsrij ─────────────────────────────────────────────────────
function Griffie() {
  const [alleenSpoed, setAlleenSpoed] = useState(false);
  const rijen = alleenSpoed ? GRIFFIE.filter((r) => r.spoed) : GRIFFIE;

  return (
    <div className="space-y-5">
      <Vel label="Griffie">
        <StukKop
          nummer="IX"
          bovenschrift="Beoordelingsrij"
          titel="Ter griffie ingediend"
          onderschrift="Ingediende bewijsstukken wachten op een beslissing. Weigeren kan alleen met reden."
        />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p
            className="flex items-center gap-2 text-[14px] italic"
            style={{ ...serif, color: P.inktZacht }}
          >
            <Gavel size={15} strokeWidth={1.8} style={{ color: P.zegel }} aria-hidden="true" />
            {rijen.length} stuk(ken) in behandeling
          </p>
          <button
            type="button"
            onClick={() => setAlleenSpoed((v) => !v)}
            aria-pressed={alleenSpoed}
            className={`px-4 py-2 text-[10.5px] uppercase ${FOCUS}`}
            style={{
              ...mono,
              letterSpacing: "0.14em",
              border: `1px solid ${alleenSpoed ? P.zegel : P.lijn}`,
              background: alleenSpoed ? P.zegelZacht : "transparent",
              color: alleenSpoed ? P.zegel : P.inktZacht,
            }}
          >
            Alleen fatale termijnen
          </button>
        </div>

        {rijen.length === 0 ? (
          <LeegVel
            titel="Geen stuk in behandeling"
            tekst="Met dit filter blijft er niets over. Zet het filter uit om de volledige rij te zien."
            knop="Filter opheffen"
            onKnop={() => setAlleenSpoed(false)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <caption className="sr-only">Beoordelingsrij van de griffie</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${P.inkt}` }}>
                  {["Zaak", "Indiener", "Stuk", "Ingediend", "Termijn", "Beslissing"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="py-2 pr-4 text-[10px] uppercase"
                      style={{ ...mono, color: P.inktLicht, letterSpacing: "0.14em" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rijen.map((r) => (
                  <tr key={r.zaak} style={{ borderBottom: `1px solid ${P.lijnFijn}` }}>
                    <th
                      scope="row"
                      className="py-3.5 pr-4 text-left text-[12.5px]"
                      style={{ ...mono, color: P.inkt }}
                    >
                      {r.zaak}
                    </th>
                    <td className="py-3.5 pr-4 text-[15px]" style={{ ...serif, color: P.inkt }}>
                      {r.indiener}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-[14px]"
                      style={{ ...serif, color: P.inktZacht }}
                    >
                      {r.stuk}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-[12.5px]"
                      style={{ ...mono, color: P.inktZacht }}
                    >
                      {r.ingediend}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10.5px] uppercase"
                        style={{
                          ...mono,
                          color: r.spoed ? P.zegel : P.inktZacht,
                          letterSpacing: "0.12em",
                        }}
                      >
                        {r.spoed ? (
                          <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
                        )}
                        {r.termijn}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="flex gap-2">
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-[10px] uppercase ${FOCUS}`}
                          style={{
                            ...mono,
                            background: P.inkt,
                            color: P.papier,
                            letterSpacing: "0.1em",
                          }}
                        >
                          Zegelen
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-[10px] uppercase ${FOCUS}`}
                          style={{
                            ...mono,
                            border: `1px solid ${P.zegel}`,
                            color: P.zegel,
                            letterSpacing: "0.1em",
                          }}
                        >
                          Weigeren
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-7 space-y-4">
          <Alinea nr="9.1" marginalia="motivering">
            Een weigering zonder reden is geen weigering: het veld voor de motivering wordt
            server-zijdig afgedwongen voordat de beslissing wordt vastgelegd.
          </Alinea>
          <Alinea nr="9.2" marginalia="logboek">
            Iedere beslissing komt in het logboek en wordt als bericht aan de indiener gezonden, met
            de herstelhandeling erbij.
          </Alinea>
        </div>
      </Vel>
    </div>
  );
}
