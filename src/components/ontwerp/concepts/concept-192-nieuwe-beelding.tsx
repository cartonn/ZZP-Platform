"use client";

// Concept 192 — "Nieuwe Beelding" · De Stijl / Mondriaan neoplasticisme. Streng orthogonaal raster met
// DIKKE zwarte scheidingslijnen; vlakken in primair rood / geel / blauw op veel wit; asymmetrische maar
// gebalanceerde compositie waarin elk paneel een scherm-blok is. Iconisch Nederlands (Mondriaan/Rietveld):
// strikt horizontaal-verticaal, geen diagonalen, geen zweven. Onderscheidt zich van "bauhaus" (geometrisch
// speels), "suprematie" (zwevende vormen) en "manifest" (constructivistische diagonaal): dit is rustig,
// rechthoekig, primair. Status-kleuren blijven binnen het De Stijl-palet, nooit kleur-alleen: label +
// icoon + vorm. UI Nederlands. Fonts: Space Grotesk (display) + Geist (tekst) + Geist Mono (cijfers).

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
  RefreshCw,
  Square,
  Grid2x2,
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

// ── Palet — De Stijl: puur wit, dik zwart, en de drie primairen. Geen tussentinten, geen gradiënt. ──
const C = {
  paper: "#f5f2e9", // warm papier-wit (grond)
  white: "#ffffff", // puur wit-vlak
  ink: "#0f0d0a", // dik zwart (lijnen + tekst)
  inkSoft: "#4a463d", // secundaire tekst
  inkFaint: "#7c766a", // labels
  red: "#d81f26", // Mondriaan-rood
  yellow: "#f6c700", // Mondriaan-geel
  blue: "#1436a8", // Mondriaan-blauw
  onColor: "#ffffff",
  onYellow: "#0f0d0a",
};

const display = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

const BW = 3; // basis lijndikte (thin)
const BW2 = 4; // dik

// ── Status-model — binnen het primair-palet. Onderscheid via icoon + label + VLAK-vorm (gevuld blauw /
//    wit-omlijnd / geel-hoek / rood-kruis). Kleur ondersteunt; de vorm en het label dragen. ──
type Fill = "blue" | "outline" | "yellow" | "red";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fill: Fill;
  bg: string;
  fg: string;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      // Gevuld blauw — vertrouwen, stabiel primair vlak
      return { label: "Geverifieerd", Icon: Check, fill: "blue", bg: C.blue, fg: C.onColor };
    case "SUBMITTED":
      // Wit-omlijnd — in behandeling, leeg vlak binnen zwarte lijn
      return { label: "In beoordeling", Icon: Clock, fill: "outline", bg: C.white, fg: C.ink };
    case "EXPIRING":
      // Geel vlak — vraagt aandacht, waarschuwing binnen palet
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fill: "yellow",
        bg: C.yellow,
        fg: C.onYellow,
      };
    case "REJECTED":
      // Rood vlak — afgewezen, kruis
      return { label: "Afgewezen", Icon: XCircle, fill: "red", bg: C.red, fg: C.onColor };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em]"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `${BW}px solid ${C.ink}` }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Blok — het fundamentele De Stijl-element: een rechthoek met dikke zwarte rand. Geen ronde hoeken. ──
function Block({
  children,
  className = "",
  style,
  interactive = false,
  weight = BW2,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  weight?: number;
}) {
  return (
    <div
      className={`relative ${interactive ? "transition-transform duration-150 hover:-translate-y-0.5" : ""} ${className}`}
      style={{ background: C.white, border: `${weight}px solid ${C.ink}`, ...style }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — geen icoon-badge maar een primair kleurblokje + strak label.
function SectionHead({
  title,
  sub,
  accent = C.blue,
}: {
  title: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-end gap-3">
      <span
        className="mb-1 h-6 w-6 shrink-0"
        style={{ background: accent, border: `${BW}px solid ${C.ink}` }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <h2
          className="text-[22px] font-bold uppercase leading-none tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.2} style={{ color: C.ink }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-blok — geen ring maar een gevuld vierkant (neoplasticisme kent geen cirkels als kern-element).
function MatchBlock({ value, size = 56 }: { value: number; size?: number }) {
  const fill = value >= 90 ? C.blue : value >= 85 ? C.yellow : C.red;
  const fg = fill === C.yellow ? C.onYellow : C.onColor;
  return (
    <span
      className="flex shrink-0 flex-col items-center justify-center"
      style={{
        width: size,
        height: size,
        background: fill,
        border: `${BW2}px solid ${C.ink}`,
        color: fg,
      }}
      aria-hidden="true"
    >
      <span className="text-[18px] font-bold tabular-nums leading-none" style={mono}>
        {value}
      </span>
      <span className="text-[7px] font-bold uppercase tracking-[0.16em]" style={mono}>
        match
      </span>
    </span>
  );
}

// Spark — rechthoekige staven in primairen, dikke zwarte grondlijn.
function Spark({ data, accent = C.blue }: { data: number[]; accent?: string }) {
  const max = Math.max(...data);
  return (
    <div
      className="flex h-8 items-end gap-[3px] border-b-2"
      style={{ borderColor: C.ink }}
      aria-hidden="true"
    >
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(16, (v / max) * 100)}%`,
            background: i === data.length - 1 ? accent : C.ink,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept192() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      <div className="relative z-10">
        {/* Kop — masthead als De Stijl-compositie: brandblok links, primair-strook rechts */}
        <header
          className="relative"
          style={{ background: C.white, borderBottom: `${BW2}px solid ${C.ink}` }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-between gap-0 px-0">
            <div
              className="flex items-center gap-3.5 px-4 py-5 md:px-8"
              style={{ borderRight: `${BW2}px solid ${C.ink}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center"
                style={{ background: C.red, border: `${BW}px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <Grid2x2 size={20} strokeWidth={2.4} style={{ color: C.onColor }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.blue }}
                >
                  Nieuwe Beelding
                </div>
                <div
                  className="text-[26px] font-bold uppercase leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.ink }}
                >
                  Compositie
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            {/* primair-strook — drie kleurvakken als Rietveld-accent */}
            <div className="flex items-stretch">
              <span
                className="hidden w-8 md:block"
                style={{ background: C.yellow, borderRight: `${BW}px solid ${C.ink}` }}
                aria-hidden="true"
              />
              <span
                className="hidden w-8 md:block"
                style={{ background: C.red, borderRight: `${BW}px solid ${C.ink}` }}
                aria-hidden="true"
              />
              <span
                className="hidden w-8 md:block"
                style={{ background: C.blue, borderRight: `${BW2}px solid ${C.ink}` }}
                aria-hidden="true"
              />
              <div className="flex items-center gap-2.5 px-4 py-5 md:px-6">
                <span
                  className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.02em] sm:inline-flex"
                  style={{
                    ...bodyF,
                    background: C.blue,
                    color: C.onColor,
                    border: `${BW}px solid ${C.ink}`,
                  }}
                >
                  <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </span>
                <span
                  className="flex h-10 w-10 items-center justify-center text-[12px] font-bold"
                  style={{
                    ...mono,
                    background: C.yellow,
                    color: C.onYellow,
                    border: `${BW}px solid ${C.ink}`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
              </div>
            </div>
          </div>

          {/* Scherm-switcher — rechthoekige tabs gescheiden door dikke zwarte lijnen */}
          <nav
            className="mx-auto flex max-w-6xl items-stretch overflow-x-auto"
            aria-label="Schermen"
            style={{ borderTop: `${BW}px solid ${C.ink}` }}
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    background: on ? C.ink : C.white,
                    color: on ? C.white : C.inkSoft,
                    borderRight: i === SCREENS.length - 1 ? "none" : `${BW}px solid ${C.ink}`,
                    ["--tw-ring-color" as string]: C.blue,
                  }}
                >
                  {on && (
                    <span
                      className="mr-2 inline-block h-2 w-2 align-middle"
                      style={{ background: C.yellow }}
                      aria-hidden="true"
                    />
                  )}
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
            className="flex items-center justify-center gap-2 pt-6 text-[11px] uppercase tracking-[0.14em]"
            style={{ ...mono, borderTop: `${BW}px solid ${C.ink}`, color: C.inkFaint }}
          >
            <Square size={11} strokeWidth={2.4} aria-hidden="true" /> Horizontaal · verticaal ·
            primair — evenwicht uit ongelijke vlakken.
          </div>
        </footer>
      </div>
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
    <div className="space-y-6">
      {/* Hero — asymmetrische Mondriaan-compositie: één groot tekstvlak + primaire blokken */}
      <div
        className="grid grid-cols-1 gap-0 lg:grid-cols-[2fr_1fr]"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        <div className="relative p-6 sm:p-9" style={{ background: C.white }}>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.02em]"
            style={{
              ...bodyF,
              background: C.yellow,
              color: C.onYellow,
              border: `${BW}px solid ${C.ink}`,
            }}
          >
            <Star size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[34px] font-bold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[46px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches
            <br />
            boven <span style={{ color: C.red }}>85%</span>.
          </h1>
          <p
            className="mt-4 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén vlak vraagt aandacht: je VOG verloopt binnenkort. Houd de compositie in evenwicht en
            blijf onberispelijk verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-0">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                ...bodyF,
                background: C.blue,
                color: C.onColor,
                border: `${BW}px solid ${C.ink}`,
                ["--tw-ring-color" as string]: C.yellow,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                ...bodyF,
                background: C.white,
                color: C.ink,
                borderTop: `${BW}px solid ${C.ink}`,
                borderRight: `${BW}px solid ${C.ink}`,
                borderBottom: `${BW}px solid ${C.ink}`,
                ["--tw-ring-color" as string]: C.blue,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.4}
                style={{ color: C.red }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
        {/* primair-blokkenkolom */}
        <div className="grid grid-rows-2" style={{ borderLeft: `${BW2}px solid ${C.ink}` }}>
          <div className="flex flex-col justify-center p-5" style={{ background: C.red }}>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
            >
              Vertrouwen
            </span>
            <span
              className="mt-1 text-[40px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.onColor }}
            >
              {dek}%
            </span>
            <span className="mt-1 text-[12px]" style={{ ...bodyF, color: "rgba(255,255,255,0.9)" }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </span>
          </div>
          <div className="grid grid-cols-2" style={{ borderTop: `${BW2}px solid ${C.ink}` }}>
            <div style={{ background: C.yellow }} aria-hidden="true" />
            <div
              className="flex items-center justify-center"
              style={{ background: C.blue, borderLeft: `${BW2}px solid ${C.ink}` }}
            >
              <Grid2x2 size={30} strokeWidth={2} style={{ color: C.onColor }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI-blokken — vier gelijke cellen met één primair accent per cel */}
      <div
        className="grid grid-cols-2 gap-0 lg:grid-cols-4"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        {KPIS.map((k, i) => {
          const accent = [C.red, C.blue, C.yellow, C.blue][i % 4];
          return (
            <div
              key={k.label}
              className="p-4"
              style={{
                background: C.white,
                borderRight: i === 3 ? "none" : `${BW}px solid ${C.ink}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.04em]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  {k.label}
                </span>
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    ...mono,
                    background: k.up ? accent : C.white,
                    color: k.up ? (accent === C.yellow ? C.onYellow : C.onColor) : C.inkSoft,
                    border: `2px solid ${C.ink}`,
                  }}
                >
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[26px] font-bold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} accent={accent} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            accent={C.blue}
          />
          <div className="space-y-0" style={{ border: `${BW2}px solid ${C.ink}` }}>
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#faf8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  background: C.white,
                  borderTop: i === 0 ? "none" : `${BW}px solid ${C.ink}`,
                  ["--tw-ring-color" as string]: C.blue,
                }}
              >
                <MatchBlock value={o.match} />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[16px] font-bold uppercase tracking-[-0.01em]"
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
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.redenen.plus.slice(0, 2).map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: C.paper,
                          color: C.inkSoft,
                          border: `2px solid ${C.ink}`,
                        }}
                      >
                        <Check
                          size={11}
                          strokeWidth={2.8}
                          style={{ color: C.blue }}
                          aria-hidden="true"
                        />{" "}
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0"
                  style={{ color: C.ink }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" accent={C.red} />
          <Block className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center"
                style={{ background: C.paper, border: `${BW2}px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <span
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: `${dek}%`, background: C.blue }}
                />
                <span
                  className="relative text-[24px] font-bold tabular-nums leading-none"
                  style={{ ...mono, color: dek > 55 ? C.onColor : C.ink }}
                >
                  {dek}%
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
          </Block>

          {/* Prioriteit — geel waarschuwingsvlak */}
          <div className="p-5" style={{ background: C.yellow, border: `${BW2}px solid ${C.ink}` }}>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ ...mono, background: C.ink, color: C.yellow }}
            >
              <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[20px] font-bold uppercase leading-tight tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: "rgba(15,13,10,0.82)" }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                ...bodyF,
                background: C.ink,
                color: C.yellow,
                border: `${BW}px solid ${C.ink}`,
                ["--tw-ring-color" as string]: C.red,
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

// ── Marktplaats — met zoek-empty-state, skeleton-loading én foutstrook ─────────────
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

  const accents = [C.red, C.blue, C.yellow];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten" accent={C.blue} />
        <div className="flex items-stretch">
          <div
            className="flex items-center gap-2 px-3.5 py-2"
            style={{ background: C.white, border: `${BW}px solid ${C.ink}` }}
          >
            <Search size={15} style={{ color: C.ink }} aria-hidden="true" />
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
            className="flex h-full w-10 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            style={{
              background: C.yellow,
              borderTop: `${BW}px solid ${C.ink}`,
              borderRight: `${BW}px solid ${C.ink}`,
              borderBottom: `${BW}px solid ${C.ink}`,
              ["--tw-ring-color" as string]: C.blue,
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

      {/* Foutstrook — rood vlak met kruis */}
      {error && (
        <div
          className="flex items-start gap-3 p-4"
          role="alert"
          style={{ background: C.red, border: `${BW2}px solid ${C.ink}` }}
        >
          <XCircle size={18} strokeWidth={2.4} style={{ color: C.onColor }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[15px] font-bold uppercase"
              style={{ ...display, color: C.onColor }}
            >
              Matches niet geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: "rgba(255,255,255,0.9)" }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            style={{
              ...bodyF,
              background: C.white,
              color: C.ink,
              border: `2px solid ${C.ink}`,
              ["--tw-ring-color" as string]: C.yellow,
            }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Block key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse"
                  style={{ background: C.paper, border: `${BW}px solid ${C.ink}` }}
                />
                <div className="flex-1 space-y-2">
                  <span className="block h-4 w-3/4 animate-pulse" style={{ background: C.paper }} />
                  <span className="block h-3 w-1/2 animate-pulse" style={{ background: C.paper }} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span className="block h-3 w-full animate-pulse" style={{ background: C.paper }} />
                <span className="block h-3 w-5/6 animate-pulse" style={{ background: C.paper }} />
              </div>
            </Block>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Block className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center"
            style={{ background: C.yellow, border: `${BW2}px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={2} style={{ color: C.ink }} />
          </span>
          <p className="text-[22px] font-bold uppercase" style={{ ...display, color: C.ink }}>
            Geen vlak gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de compositie opnieuw te
            vullen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            style={{
              ...bodyF,
              background: C.blue,
              color: C.onColor,
              border: `${BW}px solid ${C.ink}`,
              ["--tw-ring-color" as string]: C.yellow,
            }}
          >
            Zoekterm wissen
          </button>
        </Block>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, i) => {
            const accent = accents[i % accents.length];
            return (
              <Block key={o.id} interactive className="flex flex-col">
                <div
                  className="h-2 w-full"
                  style={{ background: accent, borderBottom: `${BW}px solid ${C.ink}` }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-3 p-4">
                  <MatchBlock value={o.match} size={50} />
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-bold uppercase leading-tight tracking-[-0.01em]"
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
                        className="px-2 py-0.5 text-[10.5px] font-semibold"
                        style={{
                          ...bodyF,
                          background: C.paper,
                          color: C.inkSoft,
                          border: `2px solid ${C.ink}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold uppercase tracking-[0.02em] transition-colors hover:bg-[#faf8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    borderTop: `${BW}px solid ${C.ink}`,
                    color: C.ink,
                    ["--tw-ring-color" as string]: C.blue,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Block>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon; accent: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, accent: C.blue },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, accent: C.red },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, accent: C.yellow },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, accent: C.blue },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{
          ...bodyF,
          background: C.white,
          color: C.ink,
          border: `${BW}px solid ${C.ink}`,
          ["--tw-ring-color" as string]: C.blue,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <div
        className="grid grid-cols-1 gap-0 sm:grid-cols-[1fr_auto]"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        <div className="p-6 sm:p-8" style={{ background: C.white }}>
          <span
            className="inline-block px-2.5 py-1 text-[11px] font-bold"
            style={{ ...mono, background: C.blue, color: C.onColor, border: `2px solid ${C.ink}` }}
          >
            {opdracht.id}
          </span>
          <h1
            className="mt-3 max-w-2xl text-[30px] font-bold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <div
          className="flex items-center justify-center p-6"
          style={{ background: C.paper, borderTop: `${BW2}px solid ${C.ink}`, borderLeft: `0` }}
        >
          <MatchBlock value={opdracht.match} size={92} />
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-0 lg:grid-cols-4"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        {feiten.map((f, i) => (
          <div
            key={f.l}
            className="p-4"
            style={{
              background: C.white,
              borderRight: i === 3 ? "none" : `${BW}px solid ${C.ink}`,
              borderTop: i >= 2 ? `${BW}px solid ${C.ink}` : "none",
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: f.accent, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <f.Icon
                size={15}
                strokeWidth={2.2}
                style={{ color: f.accent === C.yellow ? C.onYellow : C.onColor }}
              />
            </span>
            <div
              className="mt-3 text-[17px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" accent={C.blue} />
          <Block className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.blue, border: `2px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.onColor }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" accent={C.red} />
          <Block className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.yellow, border: `2px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.onYellow }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </section>
      </div>

      <div className="flex flex-col gap-0 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onColor,
            border: `${BW}px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.yellow,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          style={{
            ...bodyF,
            background: C.white,
            color: C.ink,
            borderTop: `${BW}px solid ${C.ink}`,
            borderRight: `${BW}px solid ${C.ink}`,
            borderBottom: `${BW}px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.blue,
          }}
        >
          <Star size={15} strokeWidth={2.4} style={{ color: C.red }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" accent={C.blue} />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onColor,
            border: `${BW}px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.yellow,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <div
        className="grid grid-cols-1 gap-0 sm:grid-cols-[auto_1fr]"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        <div
          className="flex items-center justify-center p-6"
          style={{ background: C.paper, borderRight: `${BW2}px solid ${C.ink}` }}
        >
          <span
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden"
            style={{ background: C.white, border: `${BW2}px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <span
              className="absolute bottom-0 left-0 right-0"
              style={{ height: `${dek}%`, background: C.blue }}
            />
            <span
              className="relative text-[30px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: dek > 55 ? C.onColor : C.ink }}
            >
              {dek}%
            </span>
          </span>
        </div>
        <div className="flex flex-col justify-center p-6" style={{ background: C.white }}>
          <div className="text-[20px] font-bold uppercase" style={{ ...display, color: C.ink }}>
            {verified}/{CREDENTIALS.length} geverifieerd
          </div>
          <p
            className="mt-1 max-w-sm text-[13px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Elk geverifieerd vlak versterkt de compositie. Houd je dekking hoog, dan blijft je
            profiel onberispelijk voor opdrachtgevers.
          </p>
          <span
            className="mt-3 inline-flex w-fit items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase"
            style={{ ...bodyF, background: C.blue, color: C.onColor, border: `2px solid ${C.ink}` }}
          >
            <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Block key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg, border: `${BW}px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-bold uppercase tracking-[-0.01em]"
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
                      className="px-2.5 py-1 text-[11px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      style={{
                        ...bodyF,
                        background: C.paper,
                        color: C.ink,
                        border: `2px solid ${C.ink}`,
                        ["--tw-ring-color" as string]: C.blue,
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
            </Block>
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
        accent={C.red}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <div
                className="flex items-stretch"
                style={{ border: `${BW2}px solid ${C.ink}`, background: C.white }}
              >
                <span
                  className="w-3 shrink-0"
                  style={{
                    background: warn ? C.yellow : C.blue,
                    borderRight: `${BW}px solid ${C.ink}`,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.yellow : C.paper,
                      color: C.ink,
                      border: `${BW}px solid ${C.ink}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.4} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.red : C.blue,
                          color: C.onColor,
                          border: `2px solid ${C.ink}`,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.6} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[18px] font-bold uppercase tracking-[-0.01em]"
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
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      style={{
                        ...bodyF,
                        background: warn ? C.yellow : C.blue,
                        color: warn ? C.onYellow : C.onColor,
                        border: `${BW}px solid ${C.ink}`,
                        ["--tw-ring-color" as string]: C.red,
                      }}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" accent={C.blue} />
        <div style={{ border: `${BW2}px solid ${C.ink}`, background: C.white }}>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `${BW}px solid ${C.ink}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[11px] font-bold"
                style={{ ...mono, background: C.paper, color: C.ink, border: `2px solid ${C.ink}` }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-bold uppercase tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-2.5 w-2.5"
                      style={{ background: C.red, border: `1.5px solid ${C.ink}` }}
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
        </div>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; bg: string; fg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, bg: C.blue, fg: C.onColor };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, bg: C.yellow, fg: C.onYellow };
    return { label: "Concept", Icon: FileText, bg: C.white, fg: C.ink };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" accent={C.blue} />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onColor,
            border: `${BW}px solid ${C.ink}`,
            ["--tw-ring-color" as string]: C.yellow,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-0 sm:grid-cols-3"
        style={{ border: `${BW2}px solid ${C.ink}` }}
      >
        {[
          { l: "Betaald (mnd)", v: betaald, accent: C.blue },
          { l: "Openstaand", v: `${open}`, accent: C.yellow },
          { l: "Te factureren", v: "€ 1.350", accent: C.red },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-4"
            style={{
              background: C.white,
              borderRight: i === 2 ? "none" : `${BW}px solid ${C.ink}`,
            }}
          >
            <div
              className="h-2 w-10"
              style={{ background: s.accent, border: `1.5px solid ${C.ink}` }}
              aria-hidden="true"
            />
            <div
              className="mt-3 text-[11px] font-bold uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-bold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div style={{ border: `${BW2}px solid ${C.ink}`, background: C.white }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.ink }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.white }}
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
                    style={i === 0 ? undefined : { borderTop: `${BW}px solid ${C.ink}` }}
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: `2px solid ${C.ink}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.blue }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.85)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onColor }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
