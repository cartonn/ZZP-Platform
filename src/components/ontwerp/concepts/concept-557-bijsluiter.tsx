"use client";

// Concept 557 — "Bijsluiter" · de farmaceutische bijsluiter als besturingssysteem.
// Richting: het dichtstbedrukte, best gestructureerde document dat mensen thuis hebben. Genummerde
// hoofdsecties, zware zwart-omkaderde waarschuwingen, opsommingstekens, hairline-regels en de
// gevouwen kolommen van een uitgevouwen vel. Extreem hoge informatiedichtheid die tóch rustig leest,
// omdat de hiërarchie ijzersterk is: nummer → kop → alinea → opsomming → kader.
// Platformlogica letterlijk vertaald: verificatie = "samenstelling en werking", verlopende VOG =
// zwart kaderwaarschuwing, next-actions = "3. Wat moet u nu doen", facturen = doserings-/tijdschema.
// Inspiratie/bronnen: EMA-richtlijn leesbaarheid etikettering en bijsluiter (genummerde koppen,
// max. twee kopniveaus, rood uitsluitend voor zeer belangrijke waarschuwingen) + het QRD-sjabloon
// voor productinformatie (vaste sectievolgorde), health.ec.europa.eu readability guideline 2009.
// Fonts: IBM Plex Mono (nummering, labels, cijfers) + Libre Franklin (lopende tekst).
// Deterministisch — geen random, geen datum-API.

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Slash,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  SCREENS,
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — papierwit, zuiver zwart, één signaalrood (alleen waarschuwingen) ────────────
const C = {
  paper: "#fdfdfb",
  paperAlt: "#f4f4f0",
  ink: "#111111",
  inkSoft: "#3d3d39",
  inkFaint: "#63635d",
  rule: "#111111",
  ruleSoft: "#cfcfc8",
  red: "#d0021b",
  redWash: "#fbecee",
};

const mono = { fontFamily: "var(--font-lab-plex-mono)" };
const tekst = { fontFamily: "var(--font-lab-franklin)" };

// Micro-typografie: op mobiel minimaal 13px, vanaf md verdicht naar 11,5–12px.
const BODY = "text-[13px] leading-[1.5] md:text-[11.5px] md:leading-[1.45]";
const BODY_L = "text-[13.5px] leading-[1.55] md:text-[12.5px] md:leading-[1.5]";
const MICRO = "text-[13px] leading-[1.45] md:text-[11px] md:leading-[1.4]";

// ── Bladen (schermen) — kernschermen uit mock + drie extra hoofdstukken ─────────────────
type Blad = ScreenKey | "loket";

const EXTRA_BLADEN: { key: Blad; label: string }[] = [
  { key: "documenten", label: "Documenten" },
  { key: "berichten", label: "Berichten" },
  { key: "loket", label: "Beoordelingsloket" },
];

const BLADEN: { key: Blad; label: string }[] = [
  ...SCREENS.map((s) => ({ key: s.key as Blad, label: s.label })),
  ...EXTRA_BLADEN,
];

// Bijsluiter-titel per blad — de platformtaal vertaald naar de taal van het vouwblad.
const HOOFDSTUK: Record<Blad, { nr: string; titel: string; onder: string }> = {
  dashboard: {
    nr: "0",
    titel: "Lees deze bijsluiter zorgvuldig door",
    onder: "Algemene informatie over uw dossier",
  },
  marktplaats: {
    nr: "1",
    titel: "Waarvoor wordt dit gebruikt",
    onder: "Beschikbare opdrachten en toepassingsgebied",
  },
  opdracht: {
    nr: "1a",
    titel: "Toepassing in detail",
    onder: "Eén opdracht, met werking en tegenindicaties",
  },
  verificatie: {
    nr: "2",
    titel: "Samenstelling en werking",
    onder: "Waaruit uw dossier bestaat en wat is aangetoond",
  },
  acties: {
    nr: "3",
    titel: "Wat moet u nu doen",
    onder: "Handelingen op volgorde van urgentie",
  },
  facturen: {
    nr: "4",
    titel: "Dosering en tijdschema",
    onder: "Facturen, termijnen en betaalmomenten",
  },
  documenten: {
    nr: "5",
    titel: "Bewaren en houdbaarheid",
    onder: "Uw bestanden, hun status en vervaldatum",
  },
  berichten: {
    nr: "6",
    titel: "Wie zijn erbij betrokken",
    onder: "Correspondentie met opdrachtgevers",
  },
  loket: {
    nr: "7",
    titel: "Melden en beoordelen",
    onder: "Beoordelingsloket — controle van bewijsstukken",
  },
};

// ── Status-vertaling — nooit alleen kleur: label + icoon + rasterteken ──────────────────
function credMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  teken: string;
  rood: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Aangetoond", Icon: Check, teken: "++", rood: false };
    case "SUBMITTED":
      return { label: "In onderzoek", Icon: Clock, teken: "~", rood: false };
    case "EXPIRING":
      return { label: "Beperkt houdbaar", Icon: AlertTriangle, teken: "!", rood: true };
    case "REJECTED":
      return { label: "Niet aangetoond", Icon: XCircle, teken: "–", rood: true };
  }
}

// ── Primitieven ────────────────────────────────────────────────────────────────────────

/** Hairline-regel, 0,5–1px — het skelet van het hele vel. */
function Regel({ zwaar = false }: { zwaar?: boolean }) {
  return (
    <hr
      className="my-0 border-0"
      style={{ height: zwaar ? 1 : 0.5, background: zwaar ? C.rule : C.ruleSoft }}
      aria-hidden="true"
    />
  );
}

/** Klein mono-label boven een blok. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] uppercase tracking-[0.14em] md:text-[9.5px]"
      style={{ ...mono, color: C.inkFaint }}
    >
      {children}
    </span>
  );
}

/** Zware, zwart-omkaderde waarschuwing. Rood alleen bij variant “rood”. */
function Kader({
  variant = "zwart",
  kop,
  children,
}: {
  variant?: "zwart" | "rood";
  kop: string;
  children: React.ReactNode;
}) {
  const rood = variant === "rood";
  return (
    <section
      className="mt-3"
      style={{
        border: `2px solid ${rood ? C.red : C.ink}`,
        background: rood ? C.redWash : C.paper,
      }}
    >
      <h3
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] md:text-[10.5px]"
        style={{ ...mono, background: rood ? C.red : C.ink, color: C.paper }}
      >
        <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" />
        {kop}
      </h3>
      <div className={`px-3 py-2.5 ${BODY}`} style={{ ...tekst, color: C.ink }}>
        {children}
      </div>
    </section>
  );
}

/** Opsomming met vierkant bulletteken — de standaardvorm van dit vel. */
function Lijst({ items, teken = "▪" }: { items: string[]; teken?: string }) {
  return (
    <ul className="space-y-1">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="shrink-0 pt-[1px] text-[9px]" style={{ ...mono }} aria-hidden="true">
            {teken}
          </span>
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Genummerde hoofdsectie — inklapbaar, aria-expanded. */
function Sectie({
  nr,
  titel,
  onder,
  open,
  onToggle,
  children,
}: {
  nr: string;
  titel: string;
  onder?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = `bijsl-sec-${nr.replace(/\W/g, "")}`;
  return (
    <section className="break-inside-avoid" style={{ borderTop: `1px solid ${C.ink}` }}>
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-start gap-2.5 py-2 text-left transition-colors hover:bg-[#f4f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ outlineColor: C.ink }}
        >
          <span
            className="shrink-0 text-[14px] font-bold tabular-nums md:text-[12.5px]"
            style={{ ...mono, color: C.ink }}
          >
            {nr}.
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block text-[14.5px] font-bold leading-tight md:text-[13px]"
              style={{ ...tekst, color: C.ink }}
            >
              {titel}
            </span>
            {onder ? (
              <span className={`mt-0.5 block ${MICRO}`} style={{ ...tekst, color: C.inkFaint }}>
                {onder}
              </span>
            ) : null}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className="mt-0.5 shrink-0 transition-transform"
            style={{ color: C.inkFaint, transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>
      </h2>
      <div id={id} hidden={!open} className={`pb-3 ${BODY}`} style={{ ...tekst, color: C.inkSoft }}>
        {children}
      </div>
    </section>
  );
}

/** Deterministische streepjescode uit een tekst — puur CSS, geen random. */
function Streepjescode({ code, hoogte = 26 }: { code: string; hoogte?: number }) {
  const balken = useMemo(() => {
    const out: { w: number; vol: boolean }[] = [];
    for (let i = 0; i < code.length; i++) {
      const c = code.charCodeAt(i);
      out.push({ w: 1 + (c % 3), vol: true });
      out.push({ w: 1 + ((c >> 2) % 3), vol: false });
      out.push({ w: 1 + ((c >> 4) % 2), vol: true });
      out.push({ w: 1, vol: false });
    }
    return out;
  }, [code]);
  return (
    <span className="inline-flex items-end gap-0" style={{ height: hoogte }} aria-hidden="true">
      {balken.map((b, i) => (
        <span
          key={`${b.w}-${i}`}
          style={{
            width: b.w,
            height: hoogte,
            background: b.vol ? C.ink : "transparent",
          }}
        />
      ))}
    </span>
  );
}

/** Statuszegel — mono, met icoon én teken, nooit alleen kleur. */
function Zegel({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-[2px] text-[11px] font-medium uppercase tracking-[0.08em] md:text-[9.5px]"
      style={{
        ...mono,
        border: `1px solid ${m.rood ? C.red : C.ink}`,
        color: m.rood ? C.red : C.ink,
        background: C.paper,
      }}
    >
      <m.Icon size={10} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
      <span aria-hidden="true" style={{ opacity: 0.6 }}>
        {m.teken}
      </span>
    </span>
  );
}

/** Verticale vouwlijn — de knik van een uitgevouwen vel. */
function Vouwlijn() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 hidden lg:block"
      style={{
        left: "50%",
        width: 1,
        backgroundImage: `repeating-linear-gradient(to bottom, ${C.ruleSoft} 0 5px, transparent 5px 10px)`,
      }}
    />
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────────
export function Concept557() {
  const [blad, setBlad] = useState<Blad>("dashboard");
  const opdracht = OPDRACHTEN[0]!;
  const h = HOOFDSTUK[blad];

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...tekst, background: C.paperAlt, color: C.ink }}
    >
      <style>{`
        .bijsl-focus:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 1px; }
        @keyframes bijslPuls { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .bijsl-puls { animation: bijslPuls 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .bijsl-puls { animation: none !important; } }
      `}</style>

      <div
        className="mx-auto w-full max-w-[1180px]"
        style={{
          background: C.paper,
          borderLeft: `1px solid ${C.ruleSoft}`,
          borderRight: `1px solid ${C.ruleSoft}`,
        }}
      >
        {/* ── Verpakkingsstrook ─────────────────────────────────────────────────────── */}
        <header className="px-4 pt-4 md:px-7 md:pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase tracking-[0.3em] md:text-[10px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Bijsluiter · informatie voor de gebruiker
              </p>
              <h1
                className="mt-1 text-[22px] font-bold leading-none tracking-[-0.01em] md:text-[26px]"
                style={{ ...tekst, color: C.ink }}
              >
                ZZP-PLATFORM 500{" "}
                <span
                  className="text-[13px] font-normal md:text-[14px]"
                  style={{ color: C.inkSoft }}
                >
                  dossierbeheer, verificatie en bemiddeling
                </span>
              </h1>
              <p className={`mt-1 ${MICRO}`} style={{ color: C.inkSoft }}>
                Voor: <strong style={{ color: C.ink }}>{PROFIEL.naam}</strong> · {PROFIEL.rol} ·{" "}
                {PROFIEL.plaats} · vertrouwensniveau {PROFIEL.trust.toLowerCase()}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Streepjescode code={`ZZP-${PROFIEL.initialen}-2041`} />
              <span
                className="text-[10px] uppercase tracking-[0.18em] md:text-[9px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                RVG 20 41 · versie 06/2026
              </span>
            </div>
          </div>
        </header>

        <div className="px-4 pt-3 md:px-7">
          <Regel zwaar />
        </div>

        {/* ── Hoofdstuk-navigatie ───────────────────────────────────────────────────── */}
        <nav className="px-4 md:px-7" aria-label="Hoofdstukken">
          <div className="overflow-x-auto">
            <div role="tablist" aria-label="Hoofdstukken" className="flex min-w-max items-stretch">
              {BLADEN.map((b) => {
                const on = b.key === blad;
                return (
                  <button
                    key={b.key}
                    id={`bijsl-tab-${b.key}`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls="bijsl-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setBlad(b.key)}
                    className="bijsl-focus flex items-baseline gap-1.5 px-2.5 py-2 text-[12.5px] transition-colors md:text-[11px]"
                    style={{
                      ...mono,
                      color: on ? C.paper : C.inkSoft,
                      background: on ? C.ink : "transparent",
                      borderRight: `0.5px solid ${C.ruleSoft}`,
                    }}
                  >
                    <span className="tabular-nums opacity-70">{HOOFDSTUK[b.key].nr}</span>
                    <span className="whitespace-nowrap">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Regel zwaar />
        </nav>

        {/* ── Hoofdstukkop ──────────────────────────────────────────────────────────── */}
        <div className="flex items-baseline gap-3 px-4 pb-2 pt-3 md:px-7">
          <span
            className="text-[26px] font-bold tabular-nums leading-none md:text-[30px]"
            style={{ ...mono, color: C.ink }}
          >
            {h.nr}
          </span>
          <div className="min-w-0">
            <h2
              className="text-[17px] font-bold leading-tight md:text-[19px]"
              style={{ ...tekst, color: C.ink }}
            >
              {h.titel}
            </h2>
            <p className={MICRO} style={{ color: C.inkFaint }}>
              {h.onder}
            </p>
          </div>
        </div>

        <main
          id="bijsl-panel"
          role="tabpanel"
          aria-labelledby={`bijsl-tab-${blad}`}
          tabIndex={-1}
          className="px-4 pb-12 md:px-7"
        >
          {blad === "dashboard" && <BladDashboard onGa={setBlad} />}
          {blad === "marktplaats" && <BladMarktplaats onOpen={() => setBlad("opdracht")} />}
          {blad === "opdracht" && (
            <BladOpdracht opdracht={opdracht} onTerug={() => setBlad("marktplaats")} />
          )}
          {blad === "verificatie" && <BladVerificatie />}
          {blad === "acties" && <BladActies onGa={setBlad} />}
          {blad === "facturen" && <BladFacturen />}
          {blad === "documenten" && <BladDocumenten />}
          {blad === "berichten" && <BladBerichten />}
          {blad === "loket" && <BladLoket />}
        </main>

        {/* ── Voetstrook ────────────────────────────────────────────────────────────── */}
        <footer className="px-4 pb-6 md:px-7">
          <Regel zwaar />
          <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 ${MICRO}`}>
            <span style={{ ...mono, color: C.inkFaint }}>
              Deze bijsluiter is voor u persoonlijk samengesteld. Deel hem niet ongevraagd.
            </span>
            <span style={{ ...mono, color: C.inkFaint }}>
              Blad {BLADEN.findIndex((b) => b.key === blad) + 1} van {BLADEN.length}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── 0. Dashboard — het uitgevouwen vel ─────────────────────────────────────────────────
function BladDashboard({ onGa }: { onGa: (b: Blad) => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    "1": true,
    "2": true,
    "3": true,
    "4": false,
  });
  const toggle = useCallback((k: string) => setOpen((v) => ({ ...v, [k]: !v[k] })), [setOpen]);

  const verlopend = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const aangetoond = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;

  return (
    <div className="space-y-3">
      {/* Zware openingswaarschuwing */}
      <Kader kop="Lees dit voordat u op een opdracht reageert">
        <Lijst
          items={[
            "Bewaar deze bijsluiter. Misschien heeft u hem later opnieuw nodig bij een controle door een opdrachtgever.",
            "Reageer alleen op opdrachten waarvoor uw bewijsstukken aantoonbaar geldig zijn — een verlopen stuk telt niet mee.",
            "Heeft u vragen over uw dossier? Raadpleeg hoofdstuk 2 (samenstelling en werking).",
          ]}
        />
      </Kader>

      {/* Inhoudsopgave — de vaste volgorde van het vel */}
      <section style={{ border: `1px solid ${C.ink}` }}>
        <h3
          className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] md:text-[10.5px]"
          style={{
            ...mono,
            background: C.paperAlt,
            color: C.ink,
            borderBottom: `1px solid ${C.ink}`,
          }}
        >
          Inhoud van deze bijsluiter
        </h3>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {BLADEN.filter((b) => b.key !== "dashboard").map((b) => {
            const hh = HOOFDSTUK[b.key];
            return (
              <li key={b.key} style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}>
                <button
                  type="button"
                  onClick={() => onGa(b.key)}
                  className="bijsl-focus flex w-full items-baseline gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[#f4f4f0]"
                >
                  <span
                    className="w-6 shrink-0 text-[12.5px] font-bold tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    {hh.nr}.
                  </span>
                  <span className={`min-w-0 ${BODY}`} style={{ color: C.ink }}>
                    {hh.titel}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Twee gevouwen kolommen */}
      <div className="relative grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Vouwlijn />

        <div className="lg:pr-6">
          <Sectie
            nr="1"
            titel="Waarvoor wordt dit gebruikt"
            onder="Werking van uw dossier in cijfers"
            open={!!open["1"]}
            onToggle={() => toggle("1")}
          >
            <p className="mb-2">
              ZZP-PLATFORM 500 wordt gebruikt om passende opdrachten te vinden, bewijsstukken
              aantoonbaar geldig te houden en betalingen op tijd binnen te krijgen. De werking wordt
              maandelijks gemeten aan de volgende waarden.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse">
                <caption className={`pb-1 text-left ${MICRO}`} style={{ color: C.inkFaint }}>
                  Gemeten waarden over de laatste zeven perioden.
                </caption>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.ink}` }}>
                    {["Waarde", "Nu", "Verloop", "Verandering"].map((k) => (
                      <th
                        key={k}
                        scope="col"
                        className="px-1 py-1 text-left text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                        style={{ ...mono, color: C.inkFaint }}
                      >
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {KPIS.map((k) => (
                    <tr key={k.label} style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}>
                      <th
                        scope="row"
                        className={`px-1 py-1.5 text-left font-normal ${BODY}`}
                        style={{ color: C.ink }}
                      >
                        {k.label}
                      </th>
                      <td
                        className="px-1 py-1.5 text-[13px] font-bold tabular-nums md:text-[12px]"
                        style={{ ...mono, color: C.ink }}
                      >
                        {k.value}
                      </td>
                      <td className="px-1 py-1.5">
                        <Sparkstrook waarden={k.spark} />
                      </td>
                      <td
                        className="px-1 py-1.5 text-[12px] tabular-nums md:text-[10.5px]"
                        style={{ ...mono, color: C.inkSoft }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {k.up ? (
                            <Plus size={10} strokeWidth={3} aria-hidden="true" />
                          ) : (
                            <Minus size={10} strokeWidth={3} aria-hidden="true" />
                          )}
                          {k.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Sectie>

          <Sectie
            nr="2"
            titel="Wanneer mag u dit niet gebruiken"
            onder="Tegenindicaties en beperkingen"
            open={!!open["2"]}
            onToggle={() => toggle("2")}
          >
            <p className="mb-2">
              Reageer niet op een opdracht wanneer één van de volgende situaties van toepassing is.
              De opdrachtgever ziet dezelfde controle en wijst uw reactie anders af.
            </p>
            <Lijst
              items={[
                "Een vereist bewijsstuk is verlopen of is nog niet beoordeeld.",
                "U bent op de gevraagde dagen niet beschikbaar; overboeking leidt tot annulering.",
                "De opdracht vraagt een registratie die niet in uw dossier staat (bijvoorbeeld SKJ).",
                "Het tarief ligt onder uw ingestelde ondergrens van € 45 per uur.",
              ]}
            />
            {verlopend ? (
              <Kader variant="rood" kop={`Let op — ${verlopend.naam}`}>
                <p>
                  <strong>{verlopend.detail}.</strong> Zolang dit stuk niet is vernieuwd, telt het
                  bij opdrachtgevers als ontbrekend. Vraag een nieuwe Verklaring Omtrent Gedrag aan;
                  de aanvraag duurt gemiddeld 10 werkdagen.
                </p>
                <button
                  type="button"
                  onClick={() => onGa("acties")}
                  className="bijsl-focus mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
                  style={{ ...mono, background: C.red, color: C.paper }}
                >
                  Naar hoofdstuk 3
                </button>
              </Kader>
            ) : null}
          </Sectie>
        </div>

        <div className="lg:pl-6">
          <Sectie
            nr="3"
            titel="Wat moet u nu doen"
            onder="Handelingen, op volgorde"
            open={!!open["3"]}
            onToggle={() => toggle("3")}
          >
            <ol className="space-y-2">
              {ACTIES.map((a, i) => (
                <li key={a.titel} className="flex gap-2">
                  <span
                    className="shrink-0 text-[12.5px] font-bold tabular-nums md:text-[11px]"
                    style={{ ...mono, color: a.urgentie === "warning" ? C.red : C.ink }}
                  >
                    3.{i + 1}
                  </span>
                  <span className="min-w-0">
                    <strong style={{ color: C.ink }}>{a.titel}.</strong> {a.detail}{" "}
                    <button
                      type="button"
                      onClick={() => onGa("acties")}
                      className="bijsl-focus underline decoration-dotted underline-offset-2"
                      style={{ color: a.urgentie === "warning" ? C.red : C.ink }}
                    >
                      {a.cta}
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          </Sectie>

          <Sectie
            nr="4"
            titel="Samenstelling"
            onder={`${aangetoond} van de ${CREDENTIALS.length} bestanddelen zijn aangetoond`}
            open={!!open["4"]}
            onToggle={() => toggle("4")}
          >
            <p className="mb-2">
              Uw dossier bevat de volgende werkzame bestanddelen. Alleen aangetoonde bestanddelen
              tellen mee bij het matchen op opdrachten.
            </p>
            <ul className="space-y-1.5">
              {CREDENTIALS.map((c) => (
                <li
                  key={c.naam}
                  className="flex flex-wrap items-center justify-between gap-2 py-1"
                  style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}
                >
                  <span className="min-w-0">
                    <strong style={{ color: C.ink }}>{c.naam}</strong>
                    <span style={{ color: C.inkFaint }}> — {c.detail}</span>
                  </span>
                  <Zegel status={c.status} />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onGa("verificatie")}
              className="bijsl-focus mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
              style={{ ...mono, background: C.ink, color: C.paper }}
            >
              Volledige samenstelling
            </button>
          </Sectie>
        </div>
      </div>

      <Regel zwaar />
      <p className={MICRO} style={{ ...mono, color: C.inkFaint }}>
        Laatst herzien: juni 2026 · Deze informatie is server-zijdig vastgesteld; wat u hier leest
        is gelijk aan wat een opdrachtgever ziet.
      </p>
    </div>
  );
}

/** Minimalistische verloopstrook — 7 staafjes, puur CSS. */
function Sparkstrook({ waarden }: { waarden: number[] }) {
  const max = Math.max(...waarden);
  const min = Math.min(...waarden);
  const bereik = max - min || 1;
  return (
    <span className="inline-flex h-4 items-end gap-[2px]" aria-hidden="true">
      {waarden.map((w, i) => (
        <span
          key={`${w}-${i}`}
          style={{
            width: 3,
            height: 3 + ((w - min) / bereik) * 13,
            background: i === waarden.length - 1 ? C.ink : C.ruleSoft,
          }}
        />
      ))}
    </span>
  );
}

// ── 1. Marktplaats ─────────────────────────────────────────────────────────────────────
type Toestand = "gereed" | "laden" | "fout";

function BladMarktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [toestand, setToestand] = useState<Toestand>("gereed");

  const lijst = useMemo(
    () =>
      OPDRACHTEN.filter((o) => {
        const t = q.trim().toLowerCase();
        const treffer =
          !t ||
          o.titel.toLowerCase().includes(t) ||
          o.plaats.toLowerCase().includes(t) ||
          o.opdrachtgever.toLowerCase().includes(t);
        return treffer && o.match >= minMatch;
      }),
    [q, minMatch],
  );

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        ZZP-PLATFORM 500 wordt gebruikt bij opdrachten in de zorg waarvoor een geverifieerd dossier
        vereist is. Hieronder staan de opdrachten waarvoor u op dit moment in aanmerking komt. De
        toepassing per opdracht staat in hoofdstuk 1a.
      </p>

      {/* Filterbalk */}
      <section
        className="flex flex-wrap items-center gap-2 px-2.5 py-2"
        style={{ border: `1px solid ${C.ink}`, background: C.paperAlt }}
      >
        <div className="flex min-w-[190px] flex-1 items-center gap-1.5">
          <Search size={13} strokeWidth={2.2} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op functie, plaats of opdrachtgever"
            aria-label="Opdrachten zoeken"
            className={`bijsl-focus w-full bg-transparent outline-none ${BODY}`}
            style={{ ...tekst, color: C.ink }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Minimale match">
          <Label>Min. match</Label>
          {[0, 85, 90].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinMatch(m)}
              aria-pressed={minMatch === m}
              className="bijsl-focus px-2 py-[3px] text-[12px] tabular-nums md:text-[10.5px]"
              style={{
                ...mono,
                border: `1px solid ${C.ink}`,
                background: minMatch === m ? C.ink : C.paper,
                color: minMatch === m ? C.paper : C.ink,
              }}
            >
              {m === 0 ? "alle" : `${m}%`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Weergavetoestand">
          <Label>Toestand</Label>
          {(["gereed", "laden", "fout"] as Toestand[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setToestand(t)}
              aria-pressed={toestand === t}
              className="bijsl-focus px-2 py-[3px] text-[12px] md:text-[10.5px]"
              style={{
                ...mono,
                border: `1px solid ${C.ink}`,
                background: toestand === t ? C.ink : C.paper,
                color: toestand === t ? C.paper : C.ink,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {toestand === "laden" ? (
        <SkeletLijst />
      ) : toestand === "fout" ? (
        <Foutblok onHerstel={() => setToestand("gereed")} />
      ) : lijst.length === 0 ? (
        <Leegblok
          kop="Geen opdrachten die aan uw filter voldoen"
          uitleg={`Er zijn geen opdrachten gevonden voor “${q || `match ≥ ${minMatch}%`}”. Verruim uw filter of wis de zoekterm.`}
          knop="Filter wissen"
          onKnop={() => {
            setQ("");
            setMinMatch(0);
          }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <caption className={`pb-1 text-left ${MICRO}`} style={{ color: C.inkFaint }}>
              {lijst.length} van de {OPDRACHTEN.length} opdrachten voldoen aan uw filter.
            </caption>
            <thead>
              <tr style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}>
                {["Nr.", "Opdracht", "Opdrachtgever", "Tarief", "Omvang", "Match", ""].map((k) => (
                  <th
                    key={k}
                    scope="col"
                    className="px-1.5 py-1 text-left text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lijst.map((o) => (
                <tr
                  key={o.id}
                  className="transition-colors hover:bg-[#f4f4f0]"
                  style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}
                >
                  <td
                    className="px-1.5 py-2 align-top text-[12px] tabular-nums md:text-[10.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {o.id}
                  </td>
                  <th scope="row" className="px-1.5 py-2 text-left align-top">
                    <span
                      className="block text-[13.5px] font-bold leading-tight md:text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span className={`mt-0.5 block ${MICRO}`} style={{ color: C.inkFaint }}>
                      {o.tags.join(" · ")} · start {o.start.toLowerCase()}
                    </span>
                  </th>
                  <td className={`px-1.5 py-2 align-top ${BODY}`} style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                    <span className="block" style={{ color: C.inkFaint }}>
                      {o.plaats}
                    </span>
                  </td>
                  <td
                    className="whitespace-nowrap px-1.5 py-2 align-top text-[12.5px] tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    {o.tarief}
                  </td>
                  <td
                    className="whitespace-nowrap px-1.5 py-2 align-top text-[12.5px] tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {o.uren}
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <Matchbalk waarde={o.match} />
                  </td>
                  <td className="px-1.5 py-2 align-top">
                    <button
                      type="button"
                      onClick={onOpen}
                      className="bijsl-focus whitespace-nowrap px-2 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10px]"
                      style={{ ...mono, background: C.ink, color: C.paper }}
                    >
                      Lees 1a
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Kader kop="Toepassingsvoorwaarde">
        <p>
          Een reactie wordt pas doorgestuurd als alle door de opdrachtgever vereiste bewijsstukken
          de status <strong>aangetoond</strong> hebben. De controle vindt plaats op de server, niet
          in uw browser: u kunt deze niet omzeilen — en een opdrachtgever ook niet.
        </p>
      </Kader>
    </div>
  );
}

/** Match als staaf + cijfer + tekstlabel (niet alleen kleur/lengte). */
function Matchbalk({ waarde }: { waarde: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-[7px] w-14 shrink-0"
        style={{ border: `1px solid ${C.ink}` }}
        aria-hidden="true"
      >
        <span className="block h-full" style={{ width: `${waarde}%`, background: C.ink }} />
      </span>
      <span
        className="text-[12px] font-bold tabular-nums md:text-[10.5px]"
        style={{ ...mono, color: C.ink }}
      >
        {waarde}%
      </span>
    </span>
  );
}

// ── 1a. Opdracht-detail ────────────────────────────────────────────────────────────────
function BladOpdracht({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [gereageerd, setGereageerd] = useState(false);
  const feiten: { l: string; v: string }[] = [
    { l: "Opdrachtgever", v: opdracht.opdrachtgever },
    { l: "Plaats van toediening", v: opdracht.plaats },
    { l: "Sterkte (tarief)", v: opdracht.tarief },
    { l: "Frequentie", v: opdracht.uren },
    { l: "Aanvang", v: opdracht.start },
    { l: "Kenmerk", v: opdracht.id },
  ];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onTerug}
        className="bijsl-focus inline-flex items-center gap-1.5 text-[12.5px] uppercase tracking-[0.1em] md:text-[11px]"
        style={{ ...mono, color: C.inkSoft }}
      >
        <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" /> Terug naar hoofdstuk 1
      </button>

      <div style={{ border: `2px solid ${C.ink}` }}>
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${C.ink}` }}>
          <h3
            className="text-[16px] font-bold leading-tight md:text-[17px]"
            style={{ ...tekst, color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className={MICRO} style={{ ...mono, color: C.inkFaint }}>
            {opdracht.id} · {opdracht.tags.join(" · ")}
          </p>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {feiten.map((f) => (
            <div
              key={f.l}
              className="px-3 py-1.5"
              style={{
                borderBottom: `0.5px solid ${C.ruleSoft}`,
                borderRight: `0.5px solid ${C.ruleSoft}`,
              }}
            >
              <dt
                className="text-[10.5px] uppercase tracking-[0.12em] md:text-[9.5px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {f.l}
              </dt>
              <dd
                className="text-[13.5px] font-medium md:text-[12.5px]"
                style={{ ...tekst, color: C.ink }}
              >
                {f.v}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="relative grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Vouwlijn />
        <section className="lg:pr-6">
          <h3
            className="flex items-baseline gap-2 py-1.5 text-[13.5px] font-bold md:text-[12.5px]"
            style={{ ...tekst, color: C.ink, borderBottom: `1px solid ${C.ink}` }}
          >
            <span style={mono}>1a.1</span> Waarom deze opdracht bij u past
          </h3>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className={`flex gap-2 ${BODY}`} style={{ color: C.inkSoft }}>
                <Plus
                  size={12}
                  strokeWidth={3}
                  aria-hidden="true"
                  className="mt-[3px] shrink-0"
                  style={{ color: C.ink }}
                />
                <span className="min-w-0">
                  <span style={{ color: C.ink }}>{r}</span>
                  <span
                    className="ml-1.5 text-[11px] uppercase tracking-[0.08em] md:text-[9.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    pluspunt
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-3 lg:mt-0 lg:pl-6">
          <h3
            className="flex items-baseline gap-2 py-1.5 text-[13.5px] font-bold md:text-[12.5px]"
            style={{ ...tekst, color: C.ink, borderBottom: `1px solid ${C.ink}` }}
          >
            <span style={mono}>1a.2</span> Waarop u moet letten
          </h3>
          <ul className="mt-2 space-y-1.5">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className={`flex gap-2 ${BODY}`} style={{ color: C.inkSoft }}>
                <Minus
                  size={12}
                  strokeWidth={3}
                  aria-hidden="true"
                  className="mt-[3px] shrink-0"
                  style={{ color: C.ink }}
                />
                <span className="min-w-0">
                  <span style={{ color: C.ink }}>{r}</span>
                  <span
                    className="ml-1.5 text-[11px] uppercase tracking-[0.08em] md:text-[9.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    minpunt
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Kader variant="rood" kop="Belangrijke waarschuwing bij deze opdracht">
        <p>
          Deze opdracht vraagt een geldige VOG (zorg). Uw huidige VOG{" "}
          <strong>verloopt over 23 dagen</strong>. Wordt u ingepland na de vervaldatum, dan vervalt
          de plaatsing automatisch. Vernieuw het stuk vóór u zich vastlegt.
        </p>
      </Kader>

      <section className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setGereageerd(true)}
          disabled={gereageerd}
          className="bijsl-focus px-3 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.1em] disabled:cursor-not-allowed md:text-[11px]"
          style={{
            ...mono,
            background: gereageerd ? C.paperAlt : C.ink,
            color: gereageerd ? C.inkFaint : C.paper,
            border: `1px solid ${C.ink}`,
          }}
        >
          {gereageerd ? "Reactie verstuurd" : "Reageren op deze opdracht"}
        </button>
        <button
          type="button"
          onClick={() => setGereageerd(false)}
          disabled={!gereageerd}
          className="bijsl-focus inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] uppercase tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-45 md:text-[11px]"
          style={{ ...mono, border: `1px solid ${C.ink}`, color: C.ink }}
        >
          <RotateCcw size={12} strokeWidth={2.2} aria-hidden="true" /> Reactie intrekken
        </button>
        {gereageerd ? (
          <span className={MICRO} style={{ ...mono, color: C.inkSoft }} role="status">
            Verstuurd naar {opdracht.opdrachtgever}. Gemiddelde reactietijd: 6 uur.
          </span>
        ) : (
          <span className={MICRO} style={{ ...mono, color: C.inkFaint }}>
            Intrekken kan pas nadat u heeft gereageerd.
          </span>
        )}
      </section>
    </div>
  );
}

// ── 2. Verificatie — samenstelling en werking ──────────────────────────────────────────
function BladVerificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const aangetoond = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((aangetoond / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        De werkzame stof van dit platform is{" "}
        <strong style={{ color: C.ink }}>aantoonbaarheid</strong>. Elk bestanddeel hieronder is door
        een beoordelaar gecontroleerd of wacht op controle. Alleen de status <em>aangetoond</em>{" "}
        telt mee bij opdrachtgevers.
      </p>

      <section
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2"
        style={{ border: `1px solid ${C.ink}`, background: C.paperAlt }}
      >
        <div>
          <Label>Sterkte van uw dossier</Label>
          <div
            className="text-[20px] font-bold tabular-nums leading-none md:text-[22px]"
            style={{ ...mono, color: C.ink }}
          >
            {pct}%
          </div>
        </div>
        <div className="min-w-[160px] flex-1">
          <span
            className="block h-3 w-full"
            style={{ border: `1px solid ${C.ink}` }}
            role="img"
            aria-label={`${aangetoond} van ${CREDENTIALS.length} bestanddelen aangetoond`}
          >
            <span
              className="block h-full"
              style={{
                width: `${pct}%`,
                backgroundImage: `repeating-linear-gradient(45deg, ${C.ink} 0 3px, transparent 3px 6px)`,
                backgroundColor: C.paper,
              }}
            />
          </span>
          <span className={`mt-1 block ${MICRO}`} style={{ ...mono, color: C.inkFaint }}>
            {aangetoond} van {CREDENTIALS.length} bestanddelen aangetoond · 1 beperkt houdbaar · 1
            in onderzoek
          </span>
        </div>
      </section>

      <ol>
        {CREDENTIALS.map((c, i) => {
          const uit = open === c.naam;
          const m = credMeta(c.status);
          const id = `bijsl-cred-${i}`;
          return (
            <li key={c.naam} style={{ borderTop: `1px solid ${C.ink}` }}>
              <button
                type="button"
                onClick={() => setOpen(uit ? null : c.naam)}
                aria-expanded={uit}
                aria-controls={id}
                className="bijsl-focus flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-1 py-2 text-left transition-colors hover:bg-[#f4f4f0]"
              >
                <span
                  className="w-8 shrink-0 text-[12.5px] font-bold tabular-nums md:text-[11px]"
                  style={{ ...mono, color: C.ink }}
                >
                  2.{i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[14px] font-bold leading-tight md:text-[12.5px]"
                    style={{ ...tekst, color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span className={`block ${MICRO}`} style={{ color: C.inkFaint }}>
                    {c.detail}
                  </span>
                </span>
                <Zegel status={c.status} />
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="shrink-0 transition-transform"
                  style={{ color: C.inkFaint, transform: uit ? "rotate(180deg)" : "none" }}
                />
              </button>
              <div id={id} hidden={!uit} className="pb-3 pl-1 sm:pl-9">
                <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <div>
                    <Label>Werking</Label>
                    <p className={BODY} style={{ color: C.inkSoft }}>
                      {c.status === "VERIFIED"
                        ? "Dit bestanddeel is door een beoordelaar gecontroleerd en telt volledig mee in uw match-percentage."
                        : c.status === "SUBMITTED"
                          ? "Dit bestanddeel is ingediend en wacht op beoordeling. Het telt nog niet mee in uw match-percentage."
                          : c.status === "EXPIRING"
                            ? "Dit bestanddeel is nog geldig, maar de houdbaarheid loopt af. Na de vervaldatum vervalt de werking automatisch."
                            : "Dit bestanddeel is afgewezen. De reden is verplicht vastgelegd en staat hieronder."}
                    </p>
                  </div>
                  <div>
                    <Label>Wijze van vaststellen</Label>
                    <Lijst
                      teken="–"
                      items={[
                        "Bron: door u geüpload bewijsstuk (privé opgeslagen).",
                        "Controle: handmatig door beoordelaar, vastgelegd in het controlespoor.",
                        "Zichtbaarheid: opdrachtgevers zien alleen de status, nooit het bestand zelf.",
                      ]}
                    />
                  </div>
                </div>
                {m.rood ? (
                  <Kader variant="rood" kop="Actie vereist">
                    <p>
                      {c.status === "EXPIRING"
                        ? "Vernieuw dit bestanddeel vóór de vervaldatum. Verlopen stukken worden server-zijdig op EXPIRED gezet; herstel achteraf kost gemiddeld 10 werkdagen."
                        : "Dien een nieuw bewijsstuk in. Zonder dit stuk komt u niet in aanmerking voor opdrachten die het vereisen."}
                    </p>
                  </Kader>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <Regel zwaar />
      <p className={MICRO} style={{ ...mono, color: C.inkFaint }}>
        Elke statuswijziging wordt vastgelegd in het controlespoor: wie, wanneer, met welke reden.
      </p>
    </div>
  );
}

// ── 3. Acties ──────────────────────────────────────────────────────────────────────────
function BladActies({ onGa }: { onGa: (b: Blad) => void }) {
  const [afgevinkt, setAfgevinkt] = useState<Record<string, boolean>>({});
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const open = gesorteerd.filter((a) => !afgevinkt[a.titel]);

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        Voer de onderstaande handelingen uit in de aangegeven volgorde. Handelingen met een zwarte
        kaderrand zijn tijdgebonden: uitstel leidt tot verlies van werking.
      </p>

      {open.length === 0 ? (
        <Leegblok
          kop="Alle handelingen afgevinkt"
          uitleg="Er staat op dit moment niets meer open. Nieuwe handelingen verschijnen zodra er iets verandert in uw dossier of uw opdrachten."
          knop="Lijst opnieuw openen"
          onKnop={() => setAfgevinkt({})}
        />
      ) : (
        <ol>
          {gesorteerd.map((a, i) => {
            const klaar = !!afgevinkt[a.titel];
            const dringend = a.urgentie === "warning";
            return (
              <li
                key={a.titel}
                className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5"
                style={{
                  borderTop: `1px solid ${C.ink}`,
                  opacity: klaar ? 0.5 : 1,
                }}
              >
                <span
                  className="w-8 shrink-0 text-[13px] font-bold tabular-nums md:text-[11.5px]"
                  style={{ ...mono, color: dringend ? C.red : C.ink }}
                >
                  3.{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold leading-tight md:text-[13px]"
                    style={{ ...tekst, color: C.ink }}
                  >
                    <span style={klaar ? { textDecoration: "line-through" } : undefined}>
                      {a.titel}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-[1px] text-[10.5px] uppercase tracking-[0.1em] md:text-[9.5px]"
                      style={{
                        ...mono,
                        border: `1px solid ${dringend ? C.red : C.ink}`,
                        color: dringend ? C.red : C.ink,
                      }}
                    >
                      {dringend ? (
                        <AlertTriangle size={9} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Clock size={9} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {dringend ? "tijdgebonden" : "regulier"}
                    </span>
                  </h3>
                  <p className={`mt-0.5 ${BODY}`} style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  {dringend ? (
                    <Kader variant="rood" kop="Termijn">
                      <p>
                        Rond deze handeling binnen 23 dagen af. Daarna verliest het bestanddeel zijn
                        werking en vervalt uw toegang tot opdrachten die het vereisen.
                      </p>
                    </Kader>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onGa(dringend ? "verificatie" : "marktplaats")}
                    className="bijsl-focus px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
                    style={{ ...mono, background: dringend ? C.red : C.ink, color: C.paper }}
                  >
                    {a.cta}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAfgevinkt((v) => ({ ...v, [a.titel]: !v[a.titel] }))}
                    aria-pressed={klaar}
                    className="bijsl-focus inline-flex items-center gap-1 px-2.5 py-1 text-[12px] uppercase tracking-[0.08em] md:text-[10.5px]"
                    style={{ ...mono, border: `1px solid ${C.ink}`, color: C.ink }}
                  >
                    {klaar ? (
                      <X size={11} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Check size={11} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {klaar ? "Terugzetten" : "Afvinken"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Regel zwaar />
      <p className={MICRO} style={{ ...mono, color: C.inkFaint }}>
        Afvinken is alleen voor uw eigen overzicht; de werkelijke status wordt server-zijdig
        bepaald.
      </p>
    </div>
  );
}

// ── 4. Facturen — doserings- en tijdschema ─────────────────────────────────────────────
type SorteerSleutel = "nr" | "klant" | "bedrag" | "status";

function bedragNaarGetal(b: string): number {
  const cijfers = b.replace(/[^0-9.]/g, "").replace(/\./g, "");
  return Number(cijfers) || 0;
}

function BladFacturen() {
  const [sleutel, setSleutel] = useState<SorteerSleutel>("nr");
  const [omgekeerd, setOmgekeerd] = useState(false);

  const rijen = useMemo(() => {
    const kopie = [...FACTUREN];
    kopie.sort((a, b) => {
      let r = 0;
      if (sleutel === "bedrag") r = bedragNaarGetal(a.bedrag) - bedragNaarGetal(b.bedrag);
      else if (sleutel === "klant") r = a.klant.localeCompare(b.klant, "nl");
      else if (sleutel === "status") r = a.status.localeCompare(b.status, "nl");
      else r = a.nr.localeCompare(b.nr, "nl");
      return omgekeerd ? -r : r;
    });
    return kopie;
  }, [sleutel, omgekeerd]);

  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");
  const totaalOpen = openstaand.reduce((s, f) => s + bedragNaarGetal(f.bedrag), 0);

  const kop = (k: SorteerSleutel, label: string) => (
    <th
      scope="col"
      className="px-1.5 py-1 text-left"
      aria-sort={sleutel === k ? (omgekeerd ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => {
          if (sleutel === k) setOmgekeerd((v) => !v);
          else {
            setSleutel(k);
            setOmgekeerd(false);
          }
        }}
        className="bijsl-focus inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
        style={{ ...mono, color: sleutel === k ? C.ink : C.inkFaint }}
      >
        {label}
        <ArrowUpDown size={10} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        Onderstaand schema geeft aan wanneer welk bedrag hoort binnen te komen. Wijk hier niet
        eigenmachtig van af: te laat herinneren verlengt de gemiddelde betaaltermijn aantoonbaar.
      </p>

      <Kader kop="Doseringsvoorschrift">
        <Lijst
          items={[
            "Factureer wekelijks, uiterlijk op vrijdag — niet maandelijks in één keer.",
            "Standaardtermijn: 14 dagen na factuurdatum.",
            "Eerste herinnering: op dag 15. Tweede herinnering: op dag 22 met aankondiging van rente.",
            "Concepten tellen niet mee als uitstaand bedrag; verstuur ze of verwijder ze.",
          ]}
        />
      </Kader>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <caption className={`pb-1 text-left ${MICRO}`} style={{ color: C.inkFaint }}>
            Tijdschema · {FACTUREN.length} facturen · {openstaand.length} openstaand (€{" "}
            {totaalOpen.toLocaleString("nl-NL")})
          </caption>
          <thead>
            <tr style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}>
              {kop("nr", "Nummer")}
              {kop("klant", "Opdrachtgever")}
              <th
                scope="col"
                className="px-1.5 py-1 text-left text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Datum
              </th>
              {kop("bedrag", "Bedrag")}
              {kop("status", "Status")}
              <th
                scope="col"
                className="px-1.5 py-1 text-left text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Eerstvolgende handeling
              </th>
            </tr>
          </thead>
          <tbody>
            {rijen.map((f) => {
              const open = f.status === "Openstaand";
              const concept = f.status === "Concept";
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f4f4f0]"
                  style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}
                >
                  <th
                    scope="row"
                    className="px-1.5 py-1.5 text-left text-[12.5px] font-normal tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </th>
                  <td className={`px-1.5 py-1.5 ${BODY}`} style={{ color: C.inkSoft }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-1.5 py-1.5 text-[12.5px] tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-1.5 py-1.5 text-right text-[12.5px] font-bold tabular-nums md:text-[11.5px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-[1px] text-[11px] uppercase tracking-[0.08em] md:text-[9.5px]"
                      style={{
                        ...mono,
                        border: `1px solid ${open ? C.red : C.ink}`,
                        color: open ? C.red : C.ink,
                      }}
                    >
                      {open ? (
                        <AlertTriangle size={9} strokeWidth={2.6} aria-hidden="true" />
                      ) : concept ? (
                        <Slash size={9} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Check size={9} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {f.status}
                    </span>
                  </td>
                  <td className={`px-1.5 py-1.5 ${MICRO}`} style={{ color: C.inkSoft }}>
                    {open
                      ? "Herinnering sturen — dag 9 van 14"
                      : concept
                        ? "Afronden en versturen"
                        : "Geen — betaald en verwerkt"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.ink}` }}>
              <td
                colSpan={3}
                className="px-1.5 py-1.5 text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Totaal openstaand
              </td>
              <td
                className="px-1.5 py-1.5 text-right text-[13px] font-bold tabular-nums md:text-[12px]"
                style={{ ...mono, color: C.red }}
              >
                € {totaalOpen.toLocaleString("nl-NL")}
              </td>
              <td colSpan={2} className={`px-1.5 py-1.5 ${MICRO}`} style={{ color: C.inkFaint }}>
                Verwachte ontvangst binnen 5 dagen bij tijdig herinneren.
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── 5. Documenten — bewaren en houdbaarheid ────────────────────────────────────────────
function BladDocumenten() {
  const [filter, setFilter] = useState<"alle" | CredStatus>("alle");
  const lijst = useMemo(
    () => (filter === "alle" ? DOCUMENTEN : DOCUMENTEN.filter((d) => d.status === filter)),
    [filter],
  );

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        Bewaar uw bestanden op één plek. Documenten zijn standaard privé: alleen u en een
        beoordelaar kunnen het bestand zelf openen. Opdrachtgevers zien uitsluitend de afgeleide
        status.
      </p>

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter op status">
        <Label>Filter</Label>
        {(["alle", "VERIFIED", "EXPIRING", "SUBMITTED", "REJECTED"] as const).map((f) => {
          const aan = filter === f;
          const label = f === "alle" ? "Alle" : credMeta(f).label;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={aan}
              className="bijsl-focus px-2 py-[3px] text-[12px] uppercase tracking-[0.06em] md:text-[10.5px]"
              style={{
                ...mono,
                border: `1px solid ${C.ink}`,
                background: aan ? C.ink : C.paper,
                color: aan ? C.paper : C.ink,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {lijst.length === 0 ? (
        <Leegblok
          kop="Geen bestanden met deze status"
          uitleg="In uw dossier staat op dit moment geen bestand met de gekozen status. Dat is meestal goed nieuws."
          knop="Alle bestanden tonen"
          onKnop={() => setFilter("alle")}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse">
            <caption className={`pb-1 text-left ${MICRO}`} style={{ color: C.inkFaint }}>
              {lijst.length} bestand(en) · bewaren tot ten minste zeven jaar na afronding van de
              opdracht.
            </caption>
            <thead>
              <tr style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}>
                {["Bestand", "Soort", "Grootte", "Bijgewerkt", "Houdbaarheid"].map((k) => (
                  <th
                    key={k}
                    scope="col"
                    className="px-1.5 py-1 text-left text-[11px] uppercase tracking-[0.1em] md:text-[9.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lijst.map((d) => (
                <tr
                  key={d.naam}
                  className="transition-colors hover:bg-[#f4f4f0]"
                  style={{ borderBottom: `0.5px solid ${C.ruleSoft}` }}
                >
                  <th scope="row" className="px-1.5 py-1.5 text-left">
                    <span className={`flex items-center gap-1.5 ${BODY}`} style={{ color: C.ink }}>
                      <FileText
                        size={12}
                        strokeWidth={2}
                        aria-hidden="true"
                        style={{ color: C.inkFaint }}
                      />
                      {d.naam}
                    </span>
                  </th>
                  <td
                    className="px-1.5 py-1.5 text-[12px] tabular-nums md:text-[10.5px]"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {d.type}
                  </td>
                  <td
                    className="px-1.5 py-1.5 text-[12px] tabular-nums md:text-[10.5px]"
                    style={{ ...mono, color: C.inkSoft }}
                  >
                    {d.grootte}
                  </td>
                  <td
                    className="px-1.5 py-1.5 text-[12px] tabular-nums md:text-[10.5px]"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {d.bijgewerkt}
                  </td>
                  <td className="px-1.5 py-1.5">
                    <Zegel status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Kader kop="Bewaarvoorschrift">
        <Lijst
          items={[
            "Bewaar bestanden nooit in een gedeelde map of e-mailbijlage — upload ze hier.",
            "Vervang een bestand nooit stilzwijgend: dien een nieuwe versie in, dan blijft het spoor kloppen.",
            "Verwijderen kan alleen als het bestand niet aan een lopende opdracht hangt.",
          ]}
        />
      </Kader>
    </div>
  );
}

// ── 6. Berichten ───────────────────────────────────────────────────────────────────────
function BladBerichten() {
  const [gekozen, setGekozen] = useState(BERICHTEN[0]?.van ?? null);
  const actief = BERICHTEN.find((b) => b.van === gekozen) ?? null;
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        Bij deze toepassing zijn de volgende partijen betrokken. Correspondentie loopt via het
        platform, zodat afspraken herleidbaar blijven. {ongelezen} bericht(en) ongelezen.
      </p>

      <div className="relative grid grid-cols-1 gap-x-8 lg:grid-cols-2">
        <Vouwlijn />
        <ul className="lg:pr-6">
          {BERICHTEN.map((b, i) => {
            const aan = b.van === gekozen;
            return (
              <li key={b.van} style={{ borderTop: `1px solid ${C.ink}` }}>
                <button
                  type="button"
                  onClick={() => setGekozen(b.van)}
                  aria-pressed={aan}
                  className="bijsl-focus flex w-full items-start gap-2.5 px-1 py-2 text-left transition-colors hover:bg-[#f4f4f0]"
                  style={{ background: aan ? C.paperAlt : "transparent" }}
                >
                  <span
                    className="w-8 shrink-0 text-[12.5px] font-bold tabular-nums md:text-[11px]"
                    style={{ ...mono, color: C.ink }}
                  >
                    6.{i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[13.5px] font-bold md:text-[12.5px]"
                        style={{ ...tekst, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen ? (
                        <span
                          className="px-1 py-[1px] text-[10px] uppercase tracking-[0.1em] md:text-[9px]"
                          style={{ ...mono, background: C.ink, color: C.paper }}
                        >
                          ongelezen
                        </span>
                      ) : null}
                      <span className={MICRO} style={{ ...mono, color: C.inkFaint }}>
                        {b.tijd}
                      </span>
                    </span>
                    <span className={`mt-0.5 block ${BODY}`} style={{ color: C.inkSoft }}>
                      {b.preview}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 lg:mt-0 lg:pl-6">
          {actief ? (
            <section style={{ border: `1px solid ${C.ink}` }}>
              <h3
                className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] md:text-[10.5px]"
                style={{ ...mono, background: C.ink, color: C.paper }}
              >
                {actief.initialen} · {actief.van}
              </h3>
              <div className={`px-3 py-2 ${BODY}`} style={{ color: C.inkSoft }}>
                <p style={{ color: C.ink }}>{actief.preview}</p>
                <Regel />
                <dl className="mt-2 space-y-1">
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: C.inkFaint }}>Laatste bericht</dt>
                    <dd style={{ ...mono, color: C.ink }}>{actief.tijd}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: C.inkFaint }}>Gemiddelde reactietijd</dt>
                    <dd style={{ ...mono, color: C.ink }}>6 uur</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: C.inkFaint }}>Gedeelde bewijsstukken</dt>
                    <dd style={{ ...mono, color: C.ink }}>alleen status, geen bestanden</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="bijsl-focus mt-2.5 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
                  style={{ ...mono, background: C.ink, color: C.paper }}
                >
                  Bericht beantwoorden
                </button>
              </div>
            </section>
          ) : (
            <Leegblok
              kop="Geen gesprek geselecteerd"
              uitleg="Kies links een gesprek om de details te lezen."
              knop="Eerste gesprek openen"
              onKnop={() => setGekozen(BERICHTEN[0]?.van ?? null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── 7. Beoordelingsloket (admin-wachtrij) ──────────────────────────────────────────────
type LoketRegel = {
  ref: string;
  persoon: string;
  stuk: string;
  ingediend: string;
  risico: "laag" | "midden" | "hoog";
};

const LOKET: LoketRegel[] = [
  {
    ref: "VER-9042",
    persoon: "Sanne de Vries",
    stuk: "Reanimatie / BLS",
    ingediend: "21 jun",
    risico: "laag",
  },
  {
    ref: "VER-9041",
    persoon: "Mounir el Amrani",
    stuk: "VOG (zorg)",
    ingediend: "20 jun",
    risico: "hoog",
  },
  {
    ref: "VER-9039",
    persoon: "Iris Bakker",
    stuk: "Diploma Verpleegkunde",
    ingediend: "19 jun",
    risico: "midden",
  },
  {
    ref: "VER-9036",
    persoon: "Tom Vermeer",
    stuk: "BIG-registratie",
    ingediend: "18 jun",
    risico: "laag",
  },
];

function BladLoket() {
  const [besluit, setBesluit] = useState<Record<string, "goed" | "afgewezen">>({});
  const [reden, setReden] = useState<Record<string, string>>({});
  const wachtend = LOKET.filter((r) => !besluit[r.ref]);

  return (
    <div className="space-y-3">
      <p className={BODY_L} style={{ color: C.inkSoft }}>
        Meld hier bewijsstukken die u niet kunt plaatsen. Een beoordelaar controleert elk stuk
        handmatig. Afwijzen kan uitsluitend met een reden; die reden gaat mee naar de indiener.
      </p>

      <Kader kop="Werkwijze van de beoordelaar">
        <Lijst
          items={[
            "Controleer eerst of het stuk leesbaar en volledig is; anders: afwijzen met reden “onleesbaar”.",
            "Controleer daarna de bron (uitgevende instantie, nummer, geldigheidsduur).",
            "Goedkeuren zet de status op aangetoond en legt datum, beoordelaar en bron vast.",
            "Elke beslissing is onomkeerbaar zichtbaar in het controlespoor.",
          ]}
        />
      </Kader>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className={MICRO} style={{ ...mono, color: C.inkFaint }}>
          In wachtrij: <strong style={{ color: C.ink }}>{wachtend.length}</strong> van{" "}
          {LOKET.length}
        </span>
        <span className={MICRO} style={{ ...mono, color: C.inkFaint }}>
          Oudste indiening: 18 jun · streeftermijn 2 werkdagen
        </span>
      </div>

      {wachtend.length === 0 ? (
        <Leegblok
          kop="Wachtrij leeg"
          uitleg="Alle ingediende bewijsstukken zijn beoordeeld. Nieuwe indieningen verschijnen hier automatisch."
          knop="Wachtrij herstellen"
          onKnop={() => {
            setBesluit({});
            setReden({});
          }}
        />
      ) : (
        <ul>
          {LOKET.map((r) => {
            const b = besluit[r.ref];
            if (b) return null;
            const huidigeReden = reden[r.ref] ?? "";
            return (
              <li
                key={r.ref}
                className="flex flex-wrap items-start gap-x-3 gap-y-2 py-2.5"
                style={{ borderTop: `1px solid ${C.ink}` }}
              >
                <span
                  className="w-16 shrink-0 text-[12.5px] tabular-nums md:text-[11px]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {r.ref}
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[14px] font-bold leading-tight md:text-[12.5px]"
                    style={{ ...tekst, color: C.ink }}
                  >
                    {r.stuk} — {r.persoon}
                  </h3>
                  <p className={MICRO} style={{ color: C.inkFaint }}>
                    Ingediend {r.ingediend} · risicoklasse{" "}
                    <span style={{ ...mono, color: r.risico === "hoog" ? C.red : C.inkSoft }}>
                      {r.risico}
                    </span>
                    {r.risico === "hoog" ? " · extra controle op bron vereist" : ""}
                  </p>
                  <label className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={MICRO} style={{ ...mono, color: C.inkFaint }}>
                      Reden bij afwijzen
                    </span>
                    <input
                      value={huidigeReden}
                      onChange={(e) => setReden((v) => ({ ...v, [r.ref]: e.target.value }))}
                      placeholder="Bijv. document onleesbaar"
                      className={`bijsl-focus min-w-[180px] flex-1 bg-transparent px-1.5 py-[3px] outline-none ${BODY}`}
                      style={{ ...tekst, border: `1px solid ${C.ruleSoft}`, color: C.ink }}
                    />
                  </label>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBesluit((v) => ({ ...v, [r.ref]: "goed" }))}
                    className="bijsl-focus inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
                    style={{ ...mono, background: C.ink, color: C.paper }}
                  >
                    <Check size={11} strokeWidth={2.6} aria-hidden="true" /> Goedkeuren
                  </button>
                  <button
                    type="button"
                    disabled={huidigeReden.trim().length < 3}
                    onClick={() => setBesluit((v) => ({ ...v, [r.ref]: "afgewezen" }))}
                    className="bijsl-focus inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-45 md:text-[10.5px]"
                    style={{ ...mono, border: `1px solid ${C.red}`, color: C.red }}
                    title={
                      huidigeReden.trim().length < 3
                        ? "Vul eerst een reden in — afwijzen zonder reden is niet toegestaan"
                        : undefined
                    }
                  >
                    <XCircle size={11} strokeWidth={2.4} aria-hidden="true" /> Afwijzen
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {Object.keys(besluit).length > 0 ? (
        <section style={{ borderTop: `1px solid ${C.ink}` }} className="pt-2">
          <Label>Vandaag afgehandeld</Label>
          <ul className={`mt-1 space-y-0.5 ${MICRO}`}>
            {LOKET.filter((r) => besluit[r.ref]).map((r) => (
              <li key={r.ref} style={{ ...mono, color: C.inkSoft }}>
                {r.ref} · {r.stuk} · {besluit[r.ref] === "goed" ? "goedgekeurd" : "afgewezen"}
                {besluit[r.ref] === "afgewezen" && reden[r.ref] ? ` — reden: ${reden[r.ref]}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// ── Gedeelde toestandsblokken — in de taal van het vel ─────────────────────────────────

function SkeletLijst() {
  return (
    <div aria-busy="true" aria-live="polite" style={{ borderTop: `1px solid ${C.ink}` }}>
      <p className={`py-2 ${MICRO}`} style={{ ...mono, color: C.inkFaint }}>
        Bezig met ophalen van opdrachten…
      </p>
      {[0, 1, 2].map((n) => (
        <div
          key={n}
          className="bijsl-puls flex items-center gap-3 py-2.5"
          style={{ borderTop: `0.5px solid ${C.ruleSoft}`, animationDelay: `${n * 180}ms` }}
        >
          <span className="h-2.5 w-14 shrink-0" style={{ background: C.ruleSoft }} />
          <span className="h-2.5 flex-1" style={{ background: C.ruleSoft, maxWidth: 280 }} />
          <span className="h-2.5 w-16 shrink-0" style={{ background: C.ruleSoft }} />
          <span className="h-2.5 w-10 shrink-0" style={{ background: C.ruleSoft }} />
        </div>
      ))}
    </div>
  );
}

function Foutblok({ onHerstel }: { onHerstel: () => void }) {
  return (
    <section style={{ border: `2px solid ${C.red}` }} role="alert">
      <h3
        className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] md:text-[10.5px]"
        style={{ ...mono, background: C.red, color: C.paper }}
      >
        <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" />
        Storing — gegevens niet opgehaald
      </h3>
      <div className={`px-3 py-2.5 ${BODY}`} style={{ color: C.ink }}>
        <p>
          De opdrachtenlijst kon niet worden geladen (foutcode <strong>E-503</strong>). Uw dossier
          is niet gewijzigd; er is niets verloren gegaan.
        </p>
        <Lijst
          teken="–"
          items={[
            "Probeer het opnieuw; de meeste storingen duren korter dan een minuut.",
            "Blijft de fout staan, meld dan foutcode E-503 bij de beheerder.",
          ]}
        />
        <button
          type="button"
          onClick={onHerstel}
          className="bijsl-focus mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
          style={{ ...mono, background: C.red, color: C.paper }}
        >
          <RotateCcw size={11} strokeWidth={2.4} aria-hidden="true" /> Opnieuw proberen
        </button>
      </div>
    </section>
  );
}

function Leegblok({
  kop,
  uitleg,
  knop,
  onKnop,
}: {
  kop: string;
  uitleg: string;
  knop: string;
  onKnop: () => void;
}) {
  return (
    <section
      className="flex flex-col items-start gap-1.5 px-3 py-5"
      style={{ border: `1px dashed ${C.ink}`, background: C.paperAlt }}
    >
      <Inbox size={16} strokeWidth={1.8} aria-hidden="true" style={{ color: C.inkFaint }} />
      <h3 className="text-[14px] font-bold md:text-[13px]" style={{ ...tekst, color: C.ink }}>
        {kop}
      </h3>
      <p className={`max-w-lg ${BODY}`} style={{ color: C.inkSoft }}>
        {uitleg}
      </p>
      <button
        type="button"
        onClick={onKnop}
        className="bijsl-focus mt-1 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] md:text-[10.5px]"
        style={{ ...mono, background: C.ink, color: C.paper }}
      >
        {knop}
      </button>
    </section>
  );
}
