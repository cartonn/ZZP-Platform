"use client";

// Concept 180 — "Diorama" · papiergesneden dieptelagen (papercut shadowbox). 2026-trend: spatial
// depth via gestapelde uitgesneden papierlagen. Meerdere vlakke lagen met cast-shadows suggereren
// diepte; elke laag is een "uitgesneden" vorm die iets verschoven is en een zachte slagschaduw op
// de laag eronder werpt. Rustig, tactiel, ambachtelijk-premium. Onderscheidt zich van origami
// (vouwen/facetten), karton (materiaal-ruw) en legpuzzel (in elkaar grijpende stukjes): dit is
// GESTAPELDE papiergesneden diepte — een diorama/shadowbox. Micro-interactie: bij hover schuiven de
// lagen iets verder uit elkaar (parallax in de diepte) en groeit de slagschaduw, alsof je in de doos
// kijkt. Status nooit kleur-alleen: label + icoon + tint. Deterministisch — geen random/Date; vormen
// via statische SVG. UI-taal Nederlands. Fonts: Bricolage Grotesque (display) + Spline Sans + mono.

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Layers,
  Scissors,
  Compass,
  Mountain,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — papiertinten die als gestapelde vellen op elkaar liggen; elke tint een dieptelaag.
//    Zacht, warm, tactiel. Eén ingetogen accent (klei-terracotta) + salie voor rust. ──
const C = {
  bg: "#e9e4da", // achterwand van de doos (diepst)
  paper0: "#f3efe7", // achterste papierlaag
  paper1: "#f8f5ef", // midden
  paper2: "#fdfbf6", // voorste vel (lichtst — dichtst bij kijker)
  card: "#fdfbf6",
  ink: "#33322e", // inkt (zacht houtskool)
  inkSoft: "#63615a", // secundaire tekst
  inkFaint: "#928f85", // labels
  line: "#e4ddcf", // gesneden-rand
  lineSoft: "#eee9dd",
  // Accenten (uitgesneden vlakken)
  clay: "#c56a4a", // terracotta accent (voorgrond-uitsnede)
  claySoft: "#f3e0d5",
  sage: "#6f8a6a", // salie (rustlaag)
  sageSoft: "#e2ebdd",
  sky: "#6d84a3", // gedempt papierblauw
  skySoft: "#e2e8f0",
  // Semantisch (status) — in dezelfde gedempte wereld
  ok: "#4f7d52",
  okSoft: "#e2ebdd",
  warn: "#b3762c",
  warnSoft: "#f5e8d1",
  info: "#5b7595",
  infoSoft: "#e2e8f0",
  danger: "#b0524d",
  dangerSoft: "#f3ddda",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-spline)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Cast-shadow presets — de zachte slagschaduw die het "gesneden vel zweeft boven de laag eronder"
// suggereert. Twee niveaus: rust en gelift (hover).
const CUT_SHADOW = "0 1px 1px rgba(51,50,46,0.05), 0 10px 22px -12px rgba(51,50,46,0.28)";
const CUT_SHADOW_LIFT =
  "0 2px 2px rgba(51,50,46,0.06), 0 22px 40px -16px rgba(51,50,46,0.38), 0 6px 14px -8px rgba(51,50,46,0.2)";

// ── Diorama-scène — gestapelde uitgesneden papierlagen (bergen/heuvels) die bij hover uit elkaar
//    schuiven. Puur decoratief, deterministische SVG-vormen. ──
function DioramaScene() {
  // Elke laag: een uitgesneden silhouet, eigen papiertint, eigen diepte-verschuiving. Bij hover
  // schuiven de voorste (diepere) lagen verder omlaag/omhoog uit elkaar → parallax-diepte. Static
  // Tailwind-klassen zodat de JIT ze meepakt — geen dynamische waarden.
  const layers = [
    {
      fill: C.paper0,
      d: "M0,120 C 90,70 190,110 300,80 C 400,55 500,95 600,72 L600,200 L0,200 Z",
      cls: "group-hover/scene:-translate-y-[2px]",
    },
    {
      fill: C.skySoft,
      d: "M0,140 C 120,105 210,150 320,120 C 430,92 520,140 600,112 L600,200 L0,200 Z",
      cls: "group-hover/scene:translate-y-[3px]",
    },
    {
      fill: C.sageSoft,
      d: "M0,164 C 110,138 220,176 340,150 C 450,128 540,166 600,146 L600,200 L0,200 Z",
      cls: "group-hover/scene:translate-y-[7px]",
    },
    {
      fill: C.claySoft,
      d: "M0,186 C 130,168 250,192 360,176 C 470,162 560,188 600,178 L600,200 L0,200 Z",
      cls: "group-hover/scene:translate-y-[12px]",
    },
  ];
  return (
    <div className="group/scene relative h-full w-full overflow-hidden" aria-hidden="true">
      {/* Zon-uitsnede — rond vel achterin */}
      <div
        className="absolute right-[14%] top-[16%] h-16 w-16 rounded-full transition-transform duration-500 ease-out group-hover/scene:-translate-y-1"
        style={{ background: C.paper2, boxShadow: CUT_SHADOW }}
      />
      {layers.map((l, i) => (
        <svg
          key={i}
          className={`absolute inset-x-0 bottom-0 h-full w-full transition-transform duration-500 ease-out ${l.cls}`}
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          style={{ filter: "drop-shadow(0 -6px 10px rgba(51,50,46,0.12))" }}
        >
          <path d={l.d} fill={l.fill} />
        </svg>
      ))}
    </div>
  );
}

// Gestapeld papier-embleem — drie uitgesneden vellen die bij hover licht spreiden (merk-accent).
function StackMark({ size = 46 }: { size?: number }) {
  return (
    <span
      className="group/mark relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rotate-[-8deg] rounded-[10px] transition-transform duration-300 group-hover/mark:rotate-[-12deg]"
        style={{ background: C.sageSoft, boxShadow: CUT_SHADOW }}
      />
      <span
        className="absolute inset-[3px] rotate-[5deg] rounded-[9px] transition-transform duration-300 group-hover/mark:rotate-[9deg]"
        style={{ background: C.claySoft, boxShadow: CUT_SHADOW }}
      />
      <span
        className="relative flex h-[62%] w-[62%] items-center justify-center rounded-[8px]"
        style={{ background: C.paper2, boxShadow: CUT_SHADOW }}
      >
        <Layers size={size * 0.34} strokeWidth={2} style={{ color: C.clay }} />
      </span>
    </span>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ──────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Papierlaag-kaart — een uitgesneden vel dat boven de achterlaag zweeft; bij hover lift + grotere
//    slagschaduw (het vel komt naar je toe). De diepte zit in de schaduw, niet in kleur. ──
function PaperCard({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl ${
        interactive ? "transition-all duration-300 ease-out hover:-translate-y-1" : ""
      } ${className}`}
      style={{
        background: C.paper2,
        boxShadow: CUT_SHADOW,
        ...style,
      }}
      onMouseEnter={
        interactive ? (e) => (e.currentTarget.style.boxShadow = CUT_SHADOW_LIFT) : undefined
      }
      onMouseLeave={interactive ? (e) => (e.currentTarget.style.boxShadow = CUT_SHADOW) : undefined}
    >
      {children}
    </div>
  );
}

// Sectie-kop — gestapeld icoon + titel + gesneden onderrand.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: C.paper1, boxShadow: CUT_SHADOW }}
        aria-hidden="true"
      >
        <span className="absolute inset-[3px] rounded-lg" style={{ background: C.claySoft }} />
        <Icon size={16} strokeWidth={2} style={{ color: C.clay, position: "relative" }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-bold leading-none tracking-[-0.02em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.clay}55, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.clay }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — gestapelde papier-arc (terracotta voortgang) met cijfer op het voorste vel.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.clay} 0deg, ${C.clay} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
        boxShadow: CUT_SHADOW,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paper2 }}
      >
        <span
          className="text-[15px] font-bold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — gestapelde papierstaafjes, laatste terracotta.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.clay : `${C.ink}1a`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept180() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Kop — achterwand van de shadowbox, met gestapelde papier-navigatie */}
      <header className="relative overflow-hidden" style={{ background: C.bg }}>
        {/* Achterste dieptelaag */}
        <div
          className="absolute inset-x-0 top-0 h-full"
          style={{ background: C.paper0 }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
          style={{ background: `linear-gradient(180deg, transparent, rgba(51,50,46,0.06))` }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <StackMark size={46} />
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                style={{ ...mono, color: C.clay }}
              >
                Diorama
              </div>
              <div
                className="text-[23px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                Werkdoos
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Match · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: C.paper2, color: C.ink, boxShadow: CUT_SHADOW }}
            >
              <ShieldCheck size={12} strokeWidth={2} style={{ color: C.sage }} aria-hidden="true" />{" "}
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
              style={{ ...mono, background: C.paper2, color: C.ink, boxShadow: CUT_SHADOW }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — gestapelde papier-tabs, actief vel ligt vooraan (grotere schaduw) */}
        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 pb-5 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`relative shrink-0 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  on ? "-translate-y-0.5" : "hover:-translate-y-0.5"
                }`}
                style={{
                  ...bodyF,
                  background: on ? C.clay : C.paper2,
                  color: on ? C.white : C.inkSoft,
                  boxShadow: on ? CUT_SHADOW_LIFT : CUT_SHADOW,
                  ["--tw-ring-color" as string]: C.clay,
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        {screen === "dashboard" && (
          <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
        )}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
        <div
          className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
        >
          <Scissors size={12} aria-hidden="true" /> Uitgesneden en gestapeld — diepte zit in de
          schaduw, niet in de drukte.
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — shadowbox met diorama-scène als diepte-achtergrond */}
      <div
        className="group/hero relative overflow-hidden rounded-3xl"
        style={{ background: C.paper1, boxShadow: CUT_SHADOW }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
          <DioramaScene />
        </div>
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.paper2, color: C.clay, boxShadow: CUT_SHADOW }}
          >
            <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je werk krijgt diepte, laag voor laag.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén laag vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            scherp uitgesneden en verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.clay,
                boxShadow: CUT_SHADOW,
                ["--tw-ring-color" as string]: C.clay,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.paper2,
                color: C.ink,
                boxShadow: CUT_SHADOW,
                ["--tw-ring-color" as string]: C.clay,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </div>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <PaperCard key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </PaperCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Compass}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <PaperCard key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.clay }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-bold tracking-[-0.01em]"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.paper1, color: C.inkSoft }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </PaperCard>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <PaperCard className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.sage} 0deg, ${C.sage} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                  boxShadow: CUT_SHADOW,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.paper2 }}
                >
                  <span
                    className="text-[26px] font-bold leading-none"
                    style={{ ...display, color: C.ink }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </PaperCard>

          {/* Prioriteit — voorste uitgesneden vel op donkere achterwand */}
          <div
            className="relative rounded-2xl p-5"
            style={{ background: C.ink, boxShadow: CUT_SHADOW_LIFT }}
          >
            <span
              className="pointer-events-none absolute right-4 top-4 h-10 w-10 rounded-full"
              style={{ background: "rgba(255,255,255,0.05)" }}
              aria-hidden="true"
            />
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, background: C.warnSoft, color: C.warn }}
            >
              <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[17px] font-bold leading-tight tracking-[-0.01em]"
              style={{ ...display, color: C.white }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(255,255,255,0.72)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#33322e]"
              style={{
                ...bodyF,
                background: C.clay,
                color: C.white,
                ["--tw-ring-color" as string]: C.clay,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met empty-state, skeleton-loading én foutstrook ──────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.paper2, boxShadow: CUT_SHADOW }}
          >
            <Search size={15} style={{ color: C.clay }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.paper2,
              boxShadow: CUT_SHADOW,
              ["--tw-ring-color" as string]: C.clay,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: CUT_SHADOW }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold" style={{ ...display, color: C.danger }}>
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading — lege papiervellen
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PaperCard key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.paper1 }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paper1 }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </PaperCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <PaperCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <StackMark size={64} />
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om een nieuwe laag op te
            bouwen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...bodyF, background: C.clay, ["--tw-ring-color" as string]: C.clay }}
          >
            Zoekterm wissen
          </button>
        </PaperCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <PaperCard key={o.id} interactive className="flex flex-col overflow-hidden">
              <div className="h-1 w-full" style={{ background: C.clay }} aria-hidden="true" />
              <div className="flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...bodyF, background: C.paper1, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#f3efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.clay,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </PaperCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.paper2,
          color: C.ink,
          boxShadow: CUT_SHADOW,
          ["--tw-ring-color" as string]: C.clay,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div
        className="group/hero relative overflow-hidden rounded-3xl"
        style={{ background: C.paper1, boxShadow: CUT_SHADOW }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden="true">
          <DioramaScene />
        </div>
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.paper2, color: C.clay, boxShadow: CUT_SHADOW }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <PaperCard key={f.l} interactive className="p-4">
            <span
              className="relative flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.paper1 }}
              aria-hidden="true"
            >
              <span
                className="absolute inset-[2px] rounded-md"
                style={{ background: C.claySoft }}
              />
              <f.Icon size={14} strokeWidth={2} style={{ color: C.clay, position: "relative" }} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </PaperCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <PaperCard className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </PaperCard>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <PaperCard className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </PaperCard>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.clay,
            boxShadow: CUT_SHADOW,
            ["--tw-ring-color" as string]: C.clay,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.paper2,
            color: C.ink,
            boxShadow: CUT_SHADOW,
            ["--tw-ring-color" as string]: C.clay,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.clay }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.clay,
            boxShadow: CUT_SHADOW,
            ["--tw-ring-color" as string]: C.clay,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <PaperCard className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.sage} 0deg, ${C.sage} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
              boxShadow: CUT_SHADOW,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.paper2 }}
            >
              <span
                className="text-[30px] font-bold leading-none"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde laag geeft je profiel meer diepte en vertrouwen bij opdrachtgevers.
              Houd je dekking zo hoog mogelijk.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </PaperCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <PaperCard key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#f3efe7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.paper1,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.clay,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </PaperCard>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Mountain}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <PaperCard interactive className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.clay }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.paper1,
                      color: warn ? C.warn : C.ink,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Sparkles size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-bold tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.warn,
                            }
                          : {
                              ...bodyF,
                              background: C.clay,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.clay,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </PaperCard>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <PaperCard className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ ...mono, background: C.paper1, color: C.ink, boxShadow: CUT_SHADOW }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-bold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.clay }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </PaperCard>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.clay,
            boxShadow: CUT_SHADOW,
            ["--tw-ring-color" as string]: C.clay,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <PaperCard key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: C.clay }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </PaperCard>
        ))}
      </div>

      <PaperCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paper1 }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const m = factMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f3efe7]"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...display, color: C.clay }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </PaperCard>
    </div>
  );
}
