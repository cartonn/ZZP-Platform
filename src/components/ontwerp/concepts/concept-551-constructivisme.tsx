"use client";

// Concept 551 — "Constructivisme" · Russisch constructivisme (Rodchenko, El Lissitzky, ca. 1920-1925).
// De diagonaal is hier geen versiering maar het ordeningsprincipe: schuine banen van 15-30° verdelen
// het scherm in harde vlakken, en elk vlak draagt precies één boodschap. Rood/zwart/off-white,
// oversized cijferblokken voor match-percentages, vet-condensed display-typografie en fotomontage-
// achtige composities die volledig uit CSS (wiggen, cirkels, balken) zijn opgebouwd.
// Alle leesbare tekst blijft horizontaal; alleen decoratieve labels staan schuin en zijn aria-hidden.
// Bronnen (research): creativepro.com "Russian Constructivism and Graphic Design",
// thegraphicdesignschool.com "Aleksander Rodchenko", theartstory.org "El Lissitzky",
// designyourway.net "What Is Constructivism in Graphic Design" — kernprincipes: bewuste
// onbalans/asymmetrie, sterke diagonale structuur, minimaal kleurpalet, elementaire geometrie.
// Fonts: Anton (display) + Libre Franklin (body). Deterministisch — geen random, geen datum.

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Gavel,
  LayoutGrid,
  MapPin,
  Megaphone,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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

// ── Palet — drie kleuren, geen tussenwaarden ───────────────────────────────────────────
const K = {
  rood: "#e3121a",
  roodDiep: "#a70c12",
  zwart: "#101010",
  inkt: "#1c1c1c",
  grijs: "#5b574f",
  papier: "#efe9df",
  papierDiep: "#e2dacb",
  wit: "#fbf8f2",
  lijn: "#c9c0ae",
};

const display = { fontFamily: "var(--font-lab-anton)" };
const body = { fontFamily: "var(--font-lab-franklin)" };

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3121a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9df]";
const FOCUS_DONKER =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efe9df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]";

// ── Schermen ──────────────────────────────────────────────────────────────────────────
type Scherm = ScreenKey | "admin";

const SCHERMEN: { key: Scherm; label: string; nr: string }[] = [
  { key: "dashboard", label: "Dashboard", nr: "01" },
  { key: "marktplaats", label: "Marktplaats", nr: "02" },
  { key: "opdracht", label: "Opdracht", nr: "03" },
  { key: "verificatie", label: "Verificatie", nr: "04" },
  { key: "acties", label: "Acties", nr: "05" },
  { key: "facturen", label: "Facturen", nr: "06" },
  { key: "documenten", label: "Documenten", nr: "07" },
  { key: "admin", label: "Bureau", nr: "08" },
];

// Lokale, puur presentationele extra demo-content voor het bureau-/verificatiescherm.
const BUREAU_RIJEN: {
  dossier: string;
  persoon: string;
  stuk: string;
  wacht: string;
  prioriteit: "hoog" | "normaal";
}[] = [
  {
    dossier: "VRZ-0912",
    persoon: "Sanne de Vries",
    stuk: "Reanimatie / BLS",
    wacht: "2 dagen",
    prioriteit: "hoog",
  },
  {
    dossier: "VRZ-0908",
    persoon: "Marijn Bakker",
    stuk: "VOG (zorg)",
    wacht: "1 dag",
    prioriteit: "hoog",
  },
  {
    dossier: "VRZ-0901",
    persoon: "Iris Hoekstra",
    stuk: "Diploma VIG",
    wacht: "4 dagen",
    prioriteit: "normaal",
  },
  {
    dossier: "VRZ-0894",
    persoon: "Youssef Amrani",
    stuk: "BIG-registratie",
    wacht: "6 dagen",
    prioriteit: "normaal",
  },
];

// ── Status-taal — nooit alleen kleur: altijd label + icoon ─────────────────────────────
function credMeta(s: CredStatus): { label: string; Icon: LucideIcon; kleur: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, kleur: K.zwart };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, kleur: K.grijs };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, kleur: K.rood };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, kleur: K.roodDiep };
  }
}

function Stempel({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const omgekeerd = status === "EXPIRING" || status === "REJECTED";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
      style={{
        background: omgekeerd ? m.kleur : "transparent",
        color: omgekeerd ? K.papier : m.kleur,
        border: `2px solid ${m.kleur}`,
      }}
    >
      <m.Icon size={12} strokeWidth={3} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Decoratieve geometrie — pure CSS, altijd aria-hidden ───────────────────────────────
function Wig({
  kleur,
  klasse,
  richting = "rechts",
}: {
  kleur: string;
  klasse?: string;
  richting?: "links" | "rechts";
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${klasse ?? ""}`}
      style={{
        background: kleur,
        clipPath:
          richting === "rechts"
            ? "polygon(0 0, 100% 0, 100% 100%)"
            : "polygon(0 0, 100% 0, 0 100%)",
      }}
    />
  );
}

function SchuinLabel({ tekst, klasse, kleur }: { tekst: string; klasse?: string; kleur: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.5em] ${klasse ?? ""}`}
      style={{ ...body, color: kleur, transform: "rotate(-90deg)", transformOrigin: "left top" }}
    >
      {tekst}
    </span>
  );
}

// ── Kop-blok: schuine baan met horizontale tekst ───────────────────────────────────────
function Baan({ titel, onder, index }: { titel: string; onder: string; index: string }) {
  return (
    <section className="relative mb-7 overflow-hidden" aria-labelledby={`baan-${index}`}>
      <div
        className="relative overflow-hidden"
        style={{ background: K.zwart, transform: "skewY(-2deg)" }}
      >
        <Wig kleur={K.rood} klasse="right-0 top-0 h-full w-24 sm:w-40" richting="rechts" />
        <div
          className="relative flex flex-wrap items-end justify-between gap-3 px-4 py-6 sm:px-7"
          style={{ transform: "skewY(2deg)" }}
        >
          <div className="min-w-0">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.36em]"
              style={{ ...body, color: K.rood }}
            >
              Blad {index}
            </p>
            <h1
              id={`baan-${index}`}
              className="mt-1 break-words text-[30px] uppercase leading-[0.92] tracking-[0.01em] sm:text-[42px]"
              style={{ ...display, color: K.papier }}
            >
              {titel}
            </h1>
          </div>
          <p
            className="max-w-xs text-[12.5px] leading-snug"
            style={{ ...body, color: K.papierDiep }}
          >
            {onder}
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Reusable staten in de constructivistische taal ─────────────────────────────────────
type Toestand = "data" | "laden" | "fout";

function Skelet({ regels = 3 }: { regels?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em]"
        style={{ ...body, color: K.grijs }}
      >
        <RefreshCw size={13} className="con-draai" aria-hidden="true" /> Blokken worden gezet
      </p>
      {Array.from({ length: regels }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden"
          style={{ border: `2px solid ${K.lijn}`, background: K.wit }}
        >
          <div className="flex items-stretch">
            <div
              className="con-puls w-16 shrink-0 sm:w-24"
              style={{ background: i % 2 === 0 ? K.papierDiep : K.lijn }}
            />
            <div className="flex-1 space-y-2 px-4 py-5">
              <div
                className="con-puls h-4"
                style={{ background: K.papierDiep, width: `${72 - i * 9}%` }}
              />
              <div
                className="con-puls h-3"
                style={{ background: K.papierDiep, width: `${44 - i * 6}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FoutVlak({ onHerstel }: { onHerstel: () => void }) {
  return (
    <section
      className="relative overflow-hidden px-5 py-10 text-center sm:px-10"
      style={{ background: K.rood }}
      role="alert"
    >
      <Wig kleur={K.zwart} klasse="left-0 top-0 h-full w-16 sm:w-28" richting="links" />
      <div className="relative mx-auto max-w-md">
        <Unplug size={30} strokeWidth={2.5} style={{ color: K.papier }} className="mx-auto" />
        <h2
          className="mt-4 text-[26px] uppercase leading-[0.95] sm:text-[34px]"
          style={{ ...display, color: K.papier }}
        >
          Verbinding gebroken
        </h2>
        <p className="mt-3 text-[13px] leading-snug" style={{ ...body, color: K.papier }}>
          De gegevens konden niet worden opgehaald. De montage blijft leeg tot de lijn hersteld is.
        </p>
        <button
          type="button"
          onClick={onHerstel}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.2em] ${FOCUS_DONKER}`}
          style={{ ...body, background: K.zwart, color: K.papier }}
        >
          <RefreshCw size={14} aria-hidden="true" /> Opnieuw opbouwen
        </button>
      </div>
    </section>
  );
}

function LeegVlak({
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
    <section
      className="relative overflow-hidden px-5 py-12 text-center sm:px-10"
      style={{ border: `3px solid ${K.zwart}`, background: K.wit }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full"
        style={{ border: `12px solid ${K.papierDiep}` }}
      />
      <div className="relative mx-auto max-w-sm">
        <h2
          className="text-[24px] uppercase leading-[0.95] sm:text-[30px]"
          style={{ ...display, color: K.zwart }}
        >
          {titel}
        </h2>
        <p className="mt-3 text-[13px] leading-snug" style={{ ...body, color: K.grijs }}>
          {tekst}
        </p>
        <button
          type="button"
          onClick={onKnop}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.2em] ${FOCUS}`}
          style={{ ...body, background: K.rood, color: K.papier }}
        >
          {knop} <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────────────
export function Concept551() {
  const [scherm, setScherm] = useState<Scherm>("dashboard");
  const [toestand, setToestand] = useState<Toestand>("data");
  const opdracht = OPDRACHTEN[0]!;

  const ga = useCallback((s: Scherm) => setScherm(s), []);
  const huidig = SCHERMEN.find((s) => s.key === scherm) ?? SCHERMEN[0]!;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...body, background: K.papier, color: K.inkt }}
    >
      <style>{`
        @keyframes conDraai { to { transform: rotate(360deg); } }
        .con-draai { animation: conDraai 1.1s linear infinite; }
        @keyframes conPuls { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .con-puls { animation: conPuls 1.3s ease-in-out infinite; }
        @keyframes conIn { from { opacity: 0; transform: translate3d(-14px, 8px, 0); } to { opacity: 1; transform: none; } }
        .con-in { animation: conIn 320ms cubic-bezier(0.2,0.8,0.2,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .con-draai, .con-puls, .con-in { animation: none !important; }
        }
      `}</style>

      {/* Schuine kopbalk — de diagonaal begint bovenaan en loopt door de hele pagina */}
      <header className="relative overflow-hidden">
        <div
          className="relative overflow-hidden"
          style={{ background: K.rood, transform: "skewY(-2.2deg)", marginTop: -18 }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/3 top-0 h-full w-[46%]"
            style={{ background: K.zwart, clipPath: "polygon(22% 0, 100% 0, 78% 100%, 0 100%)" }}
          />
          <div
            className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pb-5 pt-9 sm:px-7"
            style={{ transform: "skewY(2.2deg)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                aria-hidden="true"
                style={{ background: K.papier }}
              >
                <Megaphone size={22} strokeWidth={2.6} style={{ color: K.rood }} />
              </span>
              <div className="leading-none">
                <p
                  className="text-[24px] uppercase leading-none sm:text-[28px]"
                  style={{ ...display, color: K.papier }}
                >
                  Constructivisme
                </p>
                <p
                  className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: K.papierDiep }}
                >
                  Werkplan · {PROFIEL.naam}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span
                className="hidden px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] sm:inline-block"
                style={{ background: K.papier, color: K.zwart }}
              >
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
                style={{ background: K.zwart, color: K.papier }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav = schuine balk. Horizontaal scrollbaar op smalle schermen. */}
      <nav
        aria-label="Schermen"
        className="relative mx-auto max-w-6xl px-4 sm:px-7"
        style={{ marginTop: -4 }}
      >
        <div
          className="overflow-hidden"
          style={{ background: K.zwart, transform: "skewY(-1.4deg)" }}
        >
          <div
            role="tablist"
            aria-label="Schermen"
            className="flex gap-0.5 overflow-x-auto px-2 py-2"
            style={{ transform: "skewY(1.4deg)" }}
          >
            {SCHERMEN.map((s) => {
              const aan = s.key === scherm;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  id={`con-tab-${s.key}`}
                  aria-selected={aan}
                  aria-controls="con-panel"
                  onClick={() => ga(s.key)}
                  className={`shrink-0 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${FOCUS_DONKER}`}
                  style={{
                    background: aan ? K.rood : "transparent",
                    color: aan ? K.papier : K.papierDiep,
                  }}
                >
                  <span className="mr-1.5 opacity-60">{s.nr}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Toestand-schakelaar: maakt loading- en foutstaat echt bereikbaar */}
      <div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-2 px-4 sm:px-7">
        <span
          className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: K.grijs }}
        >
          Weergave
        </span>
        <div className="flex gap-0.5" role="group" aria-label="Weergavetoestand">
          {(["data", "laden", "fout"] as Toestand[]).map((t) => {
            const aan = toestand === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setToestand(t)}
                aria-pressed={aan}
                className={`px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors ${FOCUS}`}
                style={{
                  background: aan ? K.zwart : "transparent",
                  color: aan ? K.papier : K.grijs,
                  border: `2px solid ${aan ? K.zwart : K.lijn}`,
                }}
              >
                {t === "data" ? "Gegevens" : t === "laden" ? "Laden" : "Storing"}
              </button>
            );
          })}
        </div>
      </div>

      <main
        id="con-panel"
        role="tabpanel"
        aria-labelledby={`con-tab-${huidig.key}`}
        className="relative mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-7"
      >
        <SchuinLabel
          tekst={`Blad ${huidig.nr} — ${huidig.label}`}
          kleur={K.lijn}
          klasse="left-1 top-24 hidden lg:block"
        />
        <div key={scherm} className="con-in">
          {toestand === "laden" ? (
            <Skelet regels={4} />
          ) : toestand === "fout" ? (
            <FoutVlak onHerstel={() => setToestand("data")} />
          ) : scherm === "dashboard" ? (
            <Dashboard onOpdracht={() => ga("opdracht")} onVerificatie={() => ga("verificatie")} />
          ) : scherm === "marktplaats" ? (
            <Marktplaats onOpen={() => ga("opdracht")} />
          ) : scherm === "opdracht" ? (
            <OpdrachtBlad opdracht={opdracht} onTerug={() => ga("marktplaats")} />
          ) : scherm === "verificatie" ? (
            <Verificatie />
          ) : scherm === "acties" ? (
            <Acties onVerificatie={() => ga("verificatie")} />
          ) : scherm === "facturen" ? (
            <Facturen />
          ) : scherm === "documenten" ? (
            <Documenten />
          ) : (
            <Bureau />
          )}
        </div>
      </main>

      <footer
        className="relative overflow-hidden"
        style={{ background: K.zwart, transform: "skewY(-1.2deg)" }}
      >
        <Wig kleur={K.rood} klasse="left-0 top-0 h-full w-20 sm:w-32" richting="links" />
        <div
          className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 sm:px-7"
          style={{ transform: "skewY(1.2deg)" }}
        >
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: K.papierDiep }}
          >
            Bouwen aan werk · ontwerp-lab
          </p>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: K.rood }}
          >
            Blad {huidig.nr} / {SCHERMEN.length}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── 01 Dashboard — cijferblok + vlakverdeling ─────────────────────────────────────────
function Dashboard({
  onOpdracht,
  onVerificatie,
}: {
  onOpdracht: () => void;
  onVerificatie: () => void;
}) {
  const top = OPDRACHTEN[0]!;
  const dringend = ACTIES.find((a) => a.urgentie === "warning") ?? ACTIES[0]!;

  return (
    <div className="space-y-7">
      <Baan
        titel="Wat telt vandaag"
        onder="Vier meters, één beste match, één handeling die geen uitstel duldt."
        index="01"
      />

      {/* Het cijferblok: match als monumentale constructie */}
      <section
        className="relative overflow-hidden"
        style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
        aria-label="Beste match"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{
            background: K.papierDiep,
            clipPath: "polygon(38% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        <div className="relative grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div
            className="relative flex items-center justify-center px-4 py-8"
            style={{ background: K.rood }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full"
              style={{ border: `10px solid ${K.roodDiep}` }}
            />
            <p className="relative text-center leading-none">
              <span
                className="block leading-[0.78]"
                style={{
                  ...display,
                  color: K.papier,
                  fontSize: "clamp(84px, 22vw, 168px)",
                }}
              >
                {top.match}
              </span>
              <span
                className="mt-2 block text-[11px] font-bold uppercase tracking-[0.34em]"
                style={{ color: K.papier }}
              >
                Procent match
              </span>
            </p>
          </div>
          <div className="relative flex flex-col justify-between gap-5 px-5 py-7 sm:px-7">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.3em]"
                style={{ color: K.rood }}
              >
                {top.opdrachtgever}
              </p>
              <h2
                className="mt-2 text-[26px] uppercase leading-[0.95] sm:text-[32px]"
                style={{ ...display, color: K.zwart }}
              >
                {top.titel}
              </h2>
              <p className="mt-3 text-[13px] leading-snug" style={{ color: K.grijs }}>
                {top.uren} · {top.start} · {top.tarief} · {top.plaats}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {top.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ border: `2px solid ${K.zwart}`, color: K.zwart }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onOpdracht}
              className={`inline-flex w-full items-center justify-between gap-3 px-5 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.2em] transition-transform hover:translate-x-1 sm:w-auto ${FOCUS}`}
              style={{ background: K.zwart, color: K.papier }}
            >
              Open het blad <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Meters — vier harde vlakken, geen kaart-in-kaart */}
      <section aria-label="Kerncijfers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const omgekeerd = i === 0;
          return (
            <div
              key={k.label}
              className="relative overflow-hidden px-4 py-5"
              style={{
                background: omgekeerd ? K.zwart : K.wit,
                border: `3px solid ${K.zwart}`,
              }}
            >
              <Wig
                kleur={omgekeerd ? K.rood : K.papierDiep}
                klasse="right-0 top-0 h-10 w-10"
                richting="rechts"
              />
              <p
                className="relative text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: omgekeerd ? K.papierDiep : K.grijs }}
              >
                {k.label}
              </p>
              <p
                className="relative mt-2 break-words text-[26px] leading-none sm:text-[32px]"
                style={{ ...display, color: omgekeerd ? K.papier : K.zwart }}
              >
                {k.value}
              </p>
              <p
                className="relative mt-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: omgekeerd ? K.rood : k.up ? K.zwart : K.rood }}
              >
                {k.up ? "Stijgend" : "Aandacht"} · {k.trend}
              </p>
              {/* Staafgrafiekje, volledig deterministisch uit de mock-reeks */}
              <div className="relative mt-3 flex h-8 items-end gap-[3px]" aria-hidden="true">
                {k.spark.map((v, j) => {
                  const max = Math.max(...k.spark);
                  const h = Math.round((v / max) * 100);
                  return (
                    <span
                      key={j}
                      className="flex-1"
                      style={{
                        height: `${h}%`,
                        background:
                          j === k.spark.length - 1
                            ? K.rood
                            : omgekeerd
                              ? "rgba(239,233,223,0.35)"
                              : K.papierDiep,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Alarmbaan — één handeling, hard gezet */}
      <section
        className="relative overflow-hidden"
        style={{ background: K.rood, transform: "skewY(-1.6deg)" }}
        aria-label="Dringende handeling"
      >
        <div
          className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-7"
          style={{ transform: "skewY(1.6deg)" }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle
              size={26}
              strokeWidth={2.6}
              style={{ color: K.papier }}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0">
              <h2
                className="text-[20px] uppercase leading-[1] sm:text-[26px]"
                style={{ ...display, color: K.papier }}
              >
                {dringend.titel}
              </h2>
              <p
                className="mt-1.5 max-w-xl text-[12.5px] leading-snug"
                style={{ color: K.papierDiep }}
              >
                {dringend.detail}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onVerificatie}
            className={`inline-flex items-center gap-2 px-5 py-3 text-[12px] font-bold uppercase tracking-[0.2em] ${FOCUS_DONKER}`}
            style={{ background: K.zwart, color: K.papier }}
          >
            {dringend.cta} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

// ── 02 Marktplaats — filter + sorteertoggle, met empty-state ──────────────────────────
type Sortering = "match" | "tarief";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [zoek, setZoek] = useState("");
  const [sortering, setSortering] = useState<Sortering>("match");

  const lijst = useMemo(() => {
    const t = zoek.trim().toLowerCase();
    const gefilterd = OPDRACHTEN.filter(
      (o) =>
        !t ||
        o.titel.toLowerCase().includes(t) ||
        o.plaats.toLowerCase().includes(t) ||
        o.opdrachtgever.toLowerCase().includes(t) ||
        o.tags.some((tag) => tag.toLowerCase().includes(t)),
    );
    const tariefWaarde = (o: Opdracht) => Number(o.tarief.replace(/[^0-9]/g, "")) || 0;
    return [...gefilterd].sort((a, b) =>
      sortering === "match" ? b.match - a.match : tariefWaarde(b) - tariefWaarde(a),
    );
  }, [zoek, sortering]);

  return (
    <div className="space-y-6">
      <Baan
        titel="De marktplaats"
        onder="Opdrachten geordend langs één as: wat het beste past staat vooraan."
        index="02"
      />

      <div className="flex flex-wrap items-stretch gap-3">
        <label
          className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3"
          style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
        >
          <Search size={16} strokeWidth={2.6} style={{ color: K.rood }} aria-hidden="true" />
          <span className="sr-only">Opdrachten zoeken</span>
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op titel, plaats of kenmerk"
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:opacity-55"
            style={{ color: K.inkt }}
          />
          {zoek && (
            <button
              type="button"
              onClick={() => setZoek("")}
              className={`shrink-0 p-1 ${FOCUS}`}
              aria-label="Zoekopdracht wissen"
            >
              <X size={15} strokeWidth={3} style={{ color: K.grijs }} aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="flex gap-0.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as Sortering[]).map((s) => {
            const aan = sortering === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSortering(s)}
                aria-pressed={aan}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] ${FOCUS}`}
                style={{
                  background: aan ? K.rood : K.wit,
                  color: aan ? K.papier : K.grijs,
                  border: `3px solid ${aan ? K.rood : K.zwart}`,
                }}
              >
                <SlidersHorizontal size={13} strokeWidth={2.6} aria-hidden="true" />
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {lijst.length === 0 ? (
        <LeegVlak
          titel="Geen enkel vlak gevuld"
          tekst={`Er is niets gevonden voor “${zoek}”. Wis het filter en de constructie vult zich opnieuw.`}
          knop="Filter wissen"
          onKnop={() => setZoek("")}
        />
      ) : (
        <ul className="space-y-4">
          {lijst.map((o, i) => (
            <li key={o.id}>
              <article
                className="relative overflow-hidden"
                style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
              >
                <div className="grid gap-0 sm:grid-cols-[110px_minmax(0,1fr)]">
                  <div
                    className="relative flex items-center justify-center px-3 py-5 sm:py-0"
                    style={{ background: i === 0 ? K.rood : K.zwart }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: i === 0 ? K.roodDiep : "#000",
                        clipPath: "polygon(0 0, 40% 0, 0 100%)",
                        opacity: 0.5,
                      }}
                    />
                    <span className="relative text-center leading-none">
                      <span
                        className="block leading-[0.8]"
                        style={{ ...display, color: K.papier, fontSize: "clamp(38px, 9vw, 54px)" }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-1 block text-[9px] font-bold uppercase tracking-[0.24em]"
                        style={{ color: K.papierDiep }}
                      >
                        % match
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 px-4 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="text-[20px] uppercase leading-[1] sm:text-[24px]"
                          style={{ ...display, color: K.zwart }}
                        >
                          {o.titel}
                        </h3>
                        <p
                          className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
                          style={{ color: K.grijs }}
                        >
                          <span>{o.opdrachtgever}</span>
                          <span aria-hidden="true">/</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} strokeWidth={2.6} aria-hidden="true" /> {o.plaats}
                          </span>
                          <span aria-hidden="true">/</span>
                          <span>{o.uren}</span>
                        </p>
                      </div>
                      <p
                        className="shrink-0 text-[18px] leading-none"
                        style={{ ...display, color: K.rood }}
                      >
                        {o.tarief}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                            style={{ background: K.papierDiep, color: K.inkt }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={onOpen}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-transform hover:translate-x-1 ${FOCUS}`}
                        style={{ background: K.zwart, color: K.papier }}
                      >
                        Bekijken <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── 03 Opdracht-detail — verklaarbare match, plus tegenover min ────────────────────────
function OpdrachtBlad({ opdracht, onTerug }: { opdracht: Opdracht; onTerug: () => void }) {
  const [gereageerd, setGereageerd] = useState(false);
  const feiten: { l: string; v: string }[] = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Plaats", v: opdracht.plaats },
  ];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onTerug}
        className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] ${FOCUS}`}
        style={{ border: `2px solid ${K.zwart}`, color: K.zwart }}
      >
        <ArrowLeft size={14} strokeWidth={3} aria-hidden="true" /> Terug naar de marktplaats
      </button>

      <Baan
        titel={opdracht.titel}
        onder={`${opdracht.opdrachtgever} · ${opdracht.plaats} · ${opdracht.start}`}
        index="03"
      />

      <section
        className="relative overflow-hidden"
        style={{ background: K.zwart }}
        aria-label="Matchscore"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-2/3"
          style={{ background: K.rood, clipPath: "polygon(0 0, 78% 0, 52% 100%, 0 100%)" }}
        />
        <div className="relative flex flex-wrap items-center gap-6 px-5 py-7 sm:px-8">
          <span
            className="leading-[0.78]"
            style={{ ...display, color: K.papier, fontSize: "clamp(64px, 17vw, 128px)" }}
          >
            {opdracht.match}%
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.3em]"
              style={{ color: K.papierDiep }}
            >
              Verklaarbare match
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-snug" style={{ color: K.papier }}>
              De score is opgebouwd uit {opdracht.redenen.plus.length} bevestigende en{" "}
              {opdracht.redenen.min.length} remmende factoren. Alles hieronder is nagerekend op de
              server, niets in het beeld beslist.
            </p>
          </div>
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((f) => (
          <div
            key={f.l}
            className="px-4 py-4"
            style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
          >
            <dt
              className="text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: K.grijs }}
            >
              {f.l}
            </dt>
            <dd
              className="mt-1.5 break-words text-[19px] uppercase leading-none"
              style={{ ...display, color: K.zwart }}
            >
              {f.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 md:grid-cols-2">
        <section
          className="relative overflow-hidden px-5 py-6"
          style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
          aria-labelledby="con-plus"
        >
          <Wig kleur={K.zwart} klasse="right-0 top-0 h-14 w-14" richting="rechts" />
          <h2
            id="con-plus"
            className="relative text-[20px] uppercase leading-none"
            style={{ ...display, color: K.zwart }}
          >
            Wat vóór spreekt
          </h2>
          <ul className="relative mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-3 text-[13px] leading-snug">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ background: K.zwart }}
                  aria-hidden="true"
                >
                  <Check size={13} strokeWidth={3.4} style={{ color: K.papier }} />
                </span>
                <span style={{ color: K.inkt }}>{r}</span>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="relative overflow-hidden px-5 py-6"
          style={{ background: K.rood, border: `3px solid ${K.rood}` }}
          aria-labelledby="con-min"
        >
          <Wig kleur={K.roodDiep} klasse="right-0 top-0 h-14 w-14" richting="rechts" />
          <h2
            id="con-min"
            className="relative text-[20px] uppercase leading-none"
            style={{ ...display, color: K.papier }}
          >
            Wat tegenspreekt
          </h2>
          <ul className="relative mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-3 text-[13px] leading-snug">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                  style={{ background: K.papier }}
                  aria-hidden="true"
                >
                  <X size={13} strokeWidth={3.4} style={{ color: K.rood }} />
                </span>
                <span style={{ color: K.papier }}>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setGereageerd(true)}
          disabled={gereageerd}
          className={`inline-flex items-center gap-2 px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.2em] transition-transform hover:translate-x-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 ${FOCUS}`}
          style={{ background: gereageerd ? K.grijs : K.rood, color: K.papier }}
        >
          {gereageerd ? "Reactie verzonden" : "Reageren op deze opdracht"}
          {gereageerd ? (
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          ) : (
            <ArrowRight size={16} aria-hidden="true" />
          )}
        </button>
        {gereageerd && (
          <p className="text-[12px] leading-snug" style={{ color: K.grijs }} role="status">
            Je reactie staat bij {opdracht.opdrachtgever}. Je kunt niet twee keer reageren.
          </p>
        )}
      </div>
    </div>
  );
}

// ── 04 Verificatie — uitklapbare bewijsblokken ────────────────────────────────────────
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[2]?.naam ?? null);
  const geverifieerd = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((geverifieerd / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Baan
        titel="Het bewijs"
        onder="Elk document is een blok. Zolang één blok ontbreekt, staat de constructie scheef."
        index="04"
      />

      <section
        className="relative overflow-hidden"
        style={{ background: K.wit, border: `3px solid ${K.zwart}` }}
        aria-label="Voortgang verificatie"
      >
        <div className="grid gap-0 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <div
            className="flex flex-col items-center justify-center px-4 py-6"
            style={{ background: K.zwart }}
          >
            <span
              className="leading-[0.8]"
              style={{ ...display, color: K.papier, fontSize: "clamp(52px, 14vw, 76px)" }}
            >
              {pct}%
            </span>
            <span
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: K.rood }}
            >
              Geverifieerd
            </span>
          </div>
          <div className="flex flex-col justify-center gap-3 px-5 py-6">
            <p className="text-[13px] leading-snug" style={{ color: K.inkt }}>
              {geverifieerd} van de {CREDENTIALS.length} bewijsstukken zijn goedgekeurd door het
              bureau. Documenten blijven privé; alleen de status is zichtbaar voor opdrachtgevers.
            </p>
            <div
              className="flex h-4 w-full overflow-hidden"
              style={{ border: `2px solid ${K.zwart}` }}
              aria-hidden="true"
            >
              {CREDENTIALS.map((c) => (
                <span
                  key={c.naam}
                  className="flex-1"
                  style={{
                    background:
                      c.status === "VERIFIED"
                        ? K.zwart
                        : c.status === "EXPIRING"
                          ? K.rood
                          : c.status === "REJECTED"
                            ? K.roodDiep
                            : K.papierDiep,
                    borderRight: `2px solid ${K.wit}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const uit = open === c.naam;
          return (
            <li key={c.naam}>
              <div style={{ background: K.wit, border: `3px solid ${K.zwart}` }}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(uit ? null : c.naam)}
                    aria-expanded={uit}
                    aria-controls={`con-cred-${i}`}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[#f4efe6] ${FOCUS}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center text-[13px]"
                        style={{ ...display, background: K.zwart, color: K.papier }}
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block text-[16px] uppercase leading-tight"
                          style={{ ...display, color: K.zwart }}
                        >
                          {c.naam}
                        </span>
                        <span className="mt-0.5 block text-[12px]" style={{ color: K.grijs }}>
                          {c.detail}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Stempel status={c.status} />
                      <ChevronDown
                        size={18}
                        strokeWidth={3}
                        aria-hidden="true"
                        style={{
                          color: K.zwart,
                          transform: uit ? "rotate(180deg)" : "none",
                          transition: "transform 180ms",
                        }}
                      />
                    </span>
                  </button>
                </h3>
                {uit && (
                  <div
                    id={`con-cred-${i}`}
                    className="border-t px-4 py-4"
                    style={{ borderColor: K.zwart, background: K.papier }}
                  >
                    <dl className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: K.grijs }}
                        >
                          Beoordeeld door
                        </dt>
                        <dd className="mt-1 text-[13px]" style={{ color: K.inkt }}>
                          {c.status === "SUBMITTED" ? "Nog niet toegewezen" : "Bureau verificatie"}
                        </dd>
                      </div>
                      <div>
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: K.grijs }}
                        >
                          Zichtbaar voor
                        </dt>
                        <dd className="mt-1 text-[13px]" style={{ color: K.inkt }}>
                          Alleen de status, nooit het bestand
                        </dd>
                      </div>
                      <div>
                        <dt
                          className="text-[10px] font-bold uppercase tracking-[0.2em]"
                          style={{ color: K.grijs }}
                        >
                          Gevolg voor matching
                        </dt>
                        <dd className="mt-1 text-[13px]" style={{ color: K.inkt }}>
                          {c.status === "VERIFIED"
                            ? "Telt volledig mee"
                            : c.status === "EXPIRING"
                              ? "Vervalt binnenkort uit je score"
                              : "Telt nog niet mee"}
                        </dd>
                      </div>
                    </dl>
                    {c.status !== "VERIFIED" ? (
                      <button
                        type="button"
                        className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] ${FOCUS}`}
                        style={{ background: m.kleur, color: K.papier }}
                      >
                        Nieuw bewijsstuk aanleveren <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <p className="mt-4 text-[12px]" style={{ color: K.grijs }}>
                        Geen handeling nodig — dit blok staat vast.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 05 Acties — genummerde handelingen langs de diagonaal ─────────────────────────────
function Acties({ onVerificatie }: { onVerificatie: () => void }) {
  const [afgevinkt, setAfgevinkt] = useState<string[]>([]);
  const gesorteerd = useMemo(
    () =>
      [...ACTIES].sort((a, b) =>
        a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
      ),
    [],
  );
  const open = gesorteerd.filter((a) => !afgevinkt.includes(a.titel));

  return (
    <div className="space-y-6">
      <Baan
        titel="De handelingen"
        onder="Op volgorde van gewicht. Eén handeling per blok, geen verstopte keuzes."
        index="05"
      />

      {open.length === 0 ? (
        <LeegVlak
          titel="Alles afgehandeld"
          tekst="Er staat geen handeling meer open. Zet de lijst terug om de constructie opnieuw te bekijken."
          knop="Lijst herstellen"
          onKnop={() => setAfgevinkt([])}
        />
      ) : (
        <ol className="space-y-4">
          {open.map((a, i) => {
            const dringend = a.urgentie === "warning";
            return (
              <li key={a.titel}>
                <article
                  className="relative overflow-hidden"
                  style={{
                    background: dringend ? K.rood : K.wit,
                    border: `3px solid ${dringend ? K.rood : K.zwart}`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-0 w-24"
                    style={{
                      background: dringend ? K.roodDiep : K.papierDiep,
                      clipPath: "polygon(46% 0, 100% 0, 100% 100%, 0 100%)",
                    }}
                  />
                  <div className="relative flex flex-wrap items-center gap-4 px-4 py-5 sm:px-6">
                    <span
                      className="leading-[0.8]"
                      style={{
                        ...display,
                        color: dringend ? K.papier : K.rood,
                        fontSize: "clamp(44px, 10vw, 62px)",
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {dringend ? (
                          <AlertTriangle
                            size={15}
                            strokeWidth={3}
                            style={{ color: K.papier }}
                            aria-hidden="true"
                          />
                        ) : (
                          <Radio
                            size={15}
                            strokeWidth={3}
                            style={{ color: K.zwart }}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.24em]"
                          style={{ color: dringend ? K.papier : K.grijs }}
                        >
                          {dringend ? "Vraagt aandacht" : "Kans"}
                        </span>
                      </div>
                      <h2
                        className="mt-1.5 text-[19px] uppercase leading-[1.02] sm:text-[23px]"
                        style={{ ...display, color: dringend ? K.papier : K.zwart }}
                      >
                        {a.titel}
                      </h2>
                      <p
                        className="mt-1.5 max-w-xl text-[12.5px] leading-snug"
                        style={{ color: dringend ? K.papierDiep : K.grijs }}
                      >
                        {a.detail}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onVerificatie}
                        className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] ${dringend ? FOCUS_DONKER : FOCUS}`}
                        style={{
                          background: dringend ? K.zwart : K.rood,
                          color: K.papier,
                        }}
                      >
                        {a.cta}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAfgevinkt((v) => [...v, a.titel])}
                        className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] ${dringend ? FOCUS_DONKER : FOCUS}`}
                        style={{
                          border: `2px solid ${dringend ? K.papier : K.zwart}`,
                          color: dringend ? K.papier : K.zwart,
                        }}
                      >
                        Afronden
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {afgevinkt.length > 0 && (
        <p
          className="text-[12px] font-bold uppercase tracking-[0.18em]"
          style={{ color: K.grijs }}
          role="status"
        >
          {afgevinkt.length} handeling(en) afgerond ·{" "}
          <button
            type="button"
            onClick={() => setAfgevinkt([])}
            className={`underline underline-offset-4 ${FOCUS}`}
            style={{ color: K.rood }}
          >
            Terugzetten
          </button>
        </p>
      )}
    </div>
  );
}

// ── 06 Facturen — echte tabel in een schuine lijst ────────────────────────────────────
function Facturen() {
  const tint = (s: string) => (s === "Betaald" ? K.zwart : s === "Openstaand" ? K.rood : K.grijs);
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");

  return (
    <div className="space-y-6">
      <Baan
        titel="De rekening"
        onder="Geld is een vlak als elk ander: betaald, openstaand of nog niet gezet."
        index="06"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", tone: K.zwart },
          { l: "Openstaand", v: "€ 1.350", tone: K.rood },
          { l: "Concept", v: "€ 880", tone: K.grijs },
        ].map((s) => (
          <div key={s.l} className="px-4 py-5" style={{ background: s.tone }}>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: K.papierDiep }}
            >
              {s.l}
            </p>
            <p className="mt-1.5 text-[28px] leading-none" style={{ ...display, color: K.papier }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div
        className="overflow-x-auto"
        style={{ border: `3px solid ${K.zwart}`, background: K.wit }}
      >
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Overzicht van facturen met status en bedrag</caption>
          <thead>
            <tr style={{ background: K.zwart }}>
              {["Nummer", "Opdrachtgever", "Datum", "Status", "Bedrag"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: K.papierDiep }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => (
              <tr
                key={f.nr}
                style={{ background: i % 2 === 0 ? K.wit : K.papier }}
                className="transition-colors hover:bg-[#f4efe6]"
              >
                <th
                  scope="row"
                  className="px-4 py-3.5 text-left text-[13px] font-bold"
                  style={{ color: K.inkt }}
                >
                  {f.nr}
                </th>
                <td className="px-4 py-3.5 text-[13px]" style={{ color: K.grijs }}>
                  {f.klant}
                </td>
                <td className="px-4 py-3.5 text-[13px] tabular-nums" style={{ color: K.grijs }}>
                  {f.datum}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ background: tint(f.status), color: K.papier }}
                  >
                    {f.status === "Betaald" ? (
                      <Check size={11} strokeWidth={3.4} aria-hidden="true" />
                    ) : f.status === "Openstaand" ? (
                      <Clock size={11} strokeWidth={3.4} aria-hidden="true" />
                    ) : (
                      <FileText size={11} strokeWidth={3.4} aria-hidden="true" />
                    )}
                    {f.status}
                  </span>
                </td>
                <td
                  className="px-4 py-3.5 text-[15px] tabular-nums"
                  style={{ ...display, color: K.zwart }}
                >
                  {f.bedrag}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openstaand.length > 0 && (
        <section
          className="relative overflow-hidden px-5 py-5"
          style={{ background: K.rood }}
          aria-label="Openstaande facturen"
        >
          <Wig kleur={K.zwart} klasse="right-0 top-0 h-full w-16" richting="rechts" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] leading-snug" style={{ color: K.papier }}>
              <strong>{openstaand.length} factuur openstaand.</strong> {openstaand[0]!.nr} wacht al
              9 dagen bij {openstaand[0]!.klant}.
            </p>
            <button
              type="button"
              className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] ${FOCUS_DONKER}`}
              style={{ background: K.zwart, color: K.papier }}
            >
              Herinnering sturen
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ── 07 Documenten — archief als vlakverdeling ─────────────────────────────────────────
function Documenten() {
  const [selectie, setSelectie] = useState<string[]>([]);
  const alles = DOCUMENTEN.map((d) => d.naam);
  const allesGeselecteerd = selectie.length === alles.length;

  const wissel = (naam: string) =>
    setSelectie((v) => (v.includes(naam) ? v.filter((n) => n !== naam) : [...v, naam]));

  return (
    <div className="space-y-6">
      <Baan
        titel="Het archief"
        onder="Alles staat privé opgeslagen. Selecteer wat je met één opdrachtgever wilt delen."
        index="07"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSelectie(allesGeselecteerd ? [] : alles)}
          className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] ${FOCUS}`}
          style={{ border: `3px solid ${K.zwart}`, color: K.zwart, background: K.wit }}
        >
          {allesGeselecteerd ? "Selectie wissen" : "Alles selecteren"}
        </button>
        <button
          type="button"
          disabled={selectie.length === 0}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`}
          style={{ background: K.rood, color: K.papier }}
          title={
            selectie.length === 0 ? "Selecteer eerst minstens één document om te delen" : undefined
          }
        >
          Deel {selectie.length > 0 ? `${selectie.length} stuk(ken)` : "selectie"}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      {selectie.length === 0 && (
        <p className="text-[11.5px]" style={{ color: K.grijs }}>
          Delen is uitgeschakeld zolang er niets geselecteerd is — zo lekt er nooit per ongeluk een
          bestand.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {DOCUMENTEN.map((d, i) => {
          const aan = selectie.includes(d.naam);
          const m = credMeta(d.status);
          return (
            <li key={d.naam}>
              <button
                type="button"
                onClick={() => wissel(d.naam)}
                aria-pressed={aan}
                className={`relative block w-full overflow-hidden px-4 py-5 text-left transition-transform hover:-translate-y-0.5 ${FOCUS}`}
                style={{
                  background: aan ? K.zwart : K.wit,
                  border: `3px solid ${aan ? K.rood : K.zwart}`,
                }}
              >
                <Wig
                  kleur={aan ? K.rood : K.papierDiep}
                  klasse="right-0 top-0 h-12 w-12"
                  richting="rechts"
                />
                <div className="relative flex items-start gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center text-[11px]"
                    style={{
                      ...display,
                      background: aan ? K.rood : K.zwart,
                      color: K.papier,
                    }}
                    aria-hidden="true"
                  >
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="break-words text-[14px] font-bold leading-tight"
                      style={{ color: aan ? K.papier : K.inkt }}
                    >
                      {d.naam}
                    </p>
                    <p
                      className="mt-1 text-[11.5px]"
                      style={{ color: aan ? K.papierDiep : K.grijs }}
                    >
                      {d.grootte} · bijgewerkt {d.bijgewerkt}
                    </p>
                    <span
                      className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        background: aan ? K.papier : m.kleur,
                        color: aan ? K.zwart : K.papier,
                      }}
                    >
                      <m.Icon size={11} strokeWidth={3.2} aria-hidden="true" />
                      {m.label}
                    </span>
                  </div>
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
                    style={{
                      border: `2px solid ${aan ? K.papier : K.zwart}`,
                      background: aan ? K.papier : "transparent",
                    }}
                    aria-hidden="true"
                  >
                    {aan && <Check size={13} strokeWidth={3.6} style={{ color: K.zwart }} />}
                  </span>
                </div>
                <span className="sr-only">
                  {aan ? "Geselecteerd om te delen" : "Niet geselecteerd"} — document {i + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 08 Bureau — verificatiequeue van de beoordelaar ───────────────────────────────────
function Bureau() {
  const [alleenHoog, setAlleenHoog] = useState(false);
  const rijen = alleenHoog ? BUREAU_RIJEN.filter((r) => r.prioriteit === "hoog") : BUREAU_RIJEN;

  return (
    <div className="space-y-6">
      <Baan
        titel="Het bureau"
        onder="De beoordelingsrij. Elk dossier krijgt een besluit met reden — nooit stilzwijgend."
        index="08"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[12.5px]" style={{ color: K.grijs }}>
          <Gavel size={16} strokeWidth={2.6} style={{ color: K.rood }} aria-hidden="true" />
          {rijen.length} dossier(s) in de rij · gemiddelde doorlooptijd 3 dagen
        </p>
        <button
          type="button"
          onClick={() => setAlleenHoog((v) => !v)}
          aria-pressed={alleenHoog}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] ${FOCUS}`}
          style={{
            background: alleenHoog ? K.rood : K.wit,
            color: alleenHoog ? K.papier : K.zwart,
            border: `3px solid ${alleenHoog ? K.rood : K.zwart}`,
          }}
        >
          <LayoutGrid size={13} strokeWidth={2.8} aria-hidden="true" />
          Alleen hoge prioriteit
        </button>
      </div>

      {rijen.length === 0 ? (
        <LeegVlak
          titel="Rij is leeg"
          tekst="Met dit filter blijft er geen dossier over. Zet het filter uit om de volledige rij te zien."
          knop="Filter uitzetten"
          onKnop={() => setAlleenHoog(false)}
        />
      ) : (
        <div
          className="overflow-x-auto"
          style={{ border: `3px solid ${K.zwart}`, background: K.wit }}
        >
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Verificatiequeue van het bureau</caption>
            <thead>
              <tr style={{ background: K.zwart }}>
                {["Dossier", "Persoon", "Bewijsstuk", "Wachttijd", "Prioriteit", "Besluit"].map(
                  (h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: K.papierDiep }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rijen.map((r, i) => (
                <tr
                  key={r.dossier}
                  style={{ background: i % 2 === 0 ? K.wit : K.papier }}
                  className="transition-colors hover:bg-[#f4efe6]"
                >
                  <th
                    scope="row"
                    className="px-4 py-3.5 text-left text-[13px] font-bold"
                    style={{ color: K.inkt }}
                  >
                    {r.dossier}
                  </th>
                  <td className="px-4 py-3.5 text-[13px]" style={{ color: K.inkt }}>
                    {r.persoon}
                  </td>
                  <td className="px-4 py-3.5 text-[13px]" style={{ color: K.grijs }}>
                    {r.stuk}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] tabular-nums" style={{ color: K.grijs }}>
                    {r.wacht}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        background: r.prioriteit === "hoog" ? K.rood : "transparent",
                        color: r.prioriteit === "hoog" ? K.papier : K.grijs,
                        border: `2px solid ${r.prioriteit === "hoog" ? K.rood : K.lijn}`,
                      }}
                    >
                      {r.prioriteit === "hoog" ? (
                        <AlertTriangle size={11} strokeWidth={3.2} aria-hidden="true" />
                      ) : (
                        <Clock size={11} strokeWidth={3.2} aria-hidden="true" />
                      )}
                      {r.prioriteit === "hoog" ? "Hoog" : "Normaal"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex gap-1.5">
                      <button
                        type="button"
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${FOCUS}`}
                        style={{ background: K.zwart, color: K.papier }}
                      >
                        Goedkeuren
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${FOCUS}`}
                        style={{ border: `2px solid ${K.rood}`, color: K.rood }}
                      >
                        Afwijzen
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section
        className="relative overflow-hidden px-5 py-5"
        style={{ background: K.zwart }}
        aria-label="Werkwijze"
      >
        <Wig kleur={K.rood} klasse="left-0 top-0 h-full w-14" richting="links" />
        <div className="relative flex flex-wrap items-center gap-3">
          <ShieldCheck size={20} strokeWidth={2.6} style={{ color: K.rood }} aria-hidden="true" />
          <p className="max-w-2xl text-[12.5px] leading-snug" style={{ color: K.papierDiep }}>
            Afwijzen kan alleen mét reden. Elk besluit belandt in het logboek en gaat als bericht
            naar de betrokkene, samen met de herstelactie.
          </p>
        </div>
      </section>
    </div>
  );
}
