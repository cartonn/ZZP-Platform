"use client";

// Concept 189 — "Passepartout" · museum-passe-partout / galerie-omlijsting. Elk contentblok zit in
// een diep afgeschuind kaart-venster (beveled mat): een kartonnen passe-partout met schuine snede-rand
// en veel serene marge rond elk "kunstwerk". Museum-label-typografie: kleine, elegante serif-titel +
// mono catalogusnummer. Onderscheidt zich van een vitrine (glas-toonkast) en een simpel kader (platte
// rand): dit is de PASSE-PARTOUT-mat met beveled snede en ingetogen galerie-rust. Warm gebroken-wit/
// ivoor, houtskool-inkt, één ingetogen oker/goud accent. Diepte via deterministische inset-schaduw op
// de schuine snede — geen random/Date. Status nooit kleur-alleen (label + icoon + tint). UI Nederlands.
// Fonts: Fraunces (serif display) + Newsreader (label-serif) + Franklin (tekst) + IBM Plex Mono (data).

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
  RefreshCw,
  Frame,
  Landmark,
  BadgeCheck,
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

// ── Palet — museum passe-partout: warm ivoor mat-karton, schone papier-witte "kunstwerk"-vlakken,
//    houtskool-inkt, één ingetogen oker/goud accent. Bevel-tinten geven de schuine snede diepte. ──
const C = {
  bg: "#f1ece0", // galerie-wand, warm gebroken-wit
  matboard: "#e9e0ce", // mat-karton (de passe-partout zelf)
  matDeep: "#e2d7c0", // diepere mat-zone
  paper: "#fffdf8", // "kunstwerk" — schoon papier-wit
  paperSoft: "#faf6ec",
  ink: "#2b2620", // houtskool-inkt
  inkSoft: "#5a5248", // secundaire tekst
  inkFaint: "#948a78", // labels
  line: "#ddd0b6", // fijne oker-taupe rand
  lineSoft: "#e8ddc7",
  // Bevel — de schuine snede van het karton (licht vangt de bovenrand, schaduw valt onder)
  bevelLight: "#fbf6ea",
  bevelDark: "#cdbf9f",
  // Oker/goud accent — het enige "verguldsel"
  gold: "#a8823c",
  goldDeep: "#856327",
  goldSoft: "#efe4c8",
  // Semantisch (status) — gedempt, in dezelfde warme galerie-wereld
  ok: "#4d7850",
  okSoft: "#e3ecdd",
  warn: "#a9742a",
  warnSoft: "#f4e8d1",
  info: "#4a6688",
  infoSoft: "#e3e9f1",
  danger: "#a1454d",
  dangerSoft: "#f2e1e1",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const labelF = { fontFamily: "var(--font-lab-newsreader)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Passe-partout — het beveled venster. De mat (karton) omlijst met serene marge het "kunstwerk";
//    de schuine snede krijgt diepte via tegengestelde bevel-randen + deterministische inset-schaduw. ──
function Mat({
  children,
  className = "",
  matPad = "p-2.5",
  interactive = false,
  tone = "paper",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  matPad?: string;
  interactive?: boolean;
  tone?: "paper" | "ink" | "gold";
  style?: React.CSSProperties;
}) {
  const fill = tone === "ink" ? C.ink : tone === "gold" ? C.goldSoft : C.paper;
  return (
    <div
      className={`relative rounded-[6px] ${matPad} ${
        interactive ? "transition-transform duration-300 hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: `linear-gradient(150deg, ${C.matboard}, ${C.matDeep})`,
        boxShadow: `0 1px 0 ${C.bevelLight} inset, 0 14px 30px -20px rgba(43,38,32,0.5)`,
        ...style,
      }}
    >
      {/* Beveled snede-venster — het "kunstwerk" ligt verzonken achter de schuine kartonrand */}
      <div
        className="relative h-full overflow-hidden rounded-[3px]"
        style={{
          background: fill,
          borderStyle: "solid",
          borderWidth: 2.5,
          // Tegengestelde bevel-randen: boven/links in schaduw, onder/rechts vangt licht → verzonken snede
          borderTopColor: C.bevelDark,
          borderLeftColor: C.bevelDark,
          borderRightColor: C.bevelLight,
          borderBottomColor: C.bevelLight,
          boxShadow: `inset 0 2px 7px -3px rgba(43,38,32,0.35)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Museum-label — klein galerie-plaatje: catalogusnummer (mono) + serif-titel + herkomst.
function MuseumLabel({
  cat,
  title,
  sub,
  Icon,
}: {
  cat: string;
  title: string;
  sub?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
          style={{ background: C.goldSoft, boxShadow: `inset 0 0 0 1px ${C.gold}55` }}
          aria-hidden="true"
        >
          <Icon size={16} strokeWidth={1.8} style={{ color: C.goldDeep }} />
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.22em]" style={{ ...mono, color: C.gold }}>
          {cat}
        </div>
        <h2
          className="text-[19px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12.5px] italic" style={{ ...labelF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ──────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okSoft };
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
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.fg}22` }}
    >
      <m.Icon size={12} strokeWidth={2.3} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — ingetogen oker-boog met cijfer in het hart (galerie-medaillon).
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
        boxShadow: `0 2px 6px -3px rgba(43,38,32,0.5)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paper }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — gedempt oker, laatste staaf vol.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.gold : `${C.ink}1c`,
          }}
        />
      ))}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept189() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Galerie-wand — houtskool placard-band */}
      <header className="relative overflow-hidden" style={{ background: C.ink }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${C.gold}99, transparent)` }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px]"
              style={{ background: C.goldSoft, boxShadow: `inset 0 0 0 1px ${C.gold}` }}
              aria-hidden="true"
            >
              <Frame size={20} strokeWidth={1.8} style={{ color: C.goldDeep }} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                style={{ ...mono, color: C.gold }}
              >
                Passepartout
              </div>
              <div
                className="text-[23px] font-semibold leading-none tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                Het Kabinet
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: "rgba(255,255,255,0.5)" }}
              >
                Match · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
              style={{ ...bodyF, background: "rgba(255,255,255,0.1)", color: C.white }}
            >
              <ShieldCheck size={12} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />{" "}
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[3px] text-[12px] font-bold"
              style={{
                ...mono,
                background: C.goldSoft,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.gold}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — galerie-plaatjes als tabs */}
        <nav
          className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 rounded-[3px] px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b2620]"
                style={
                  on
                    ? {
                        ...bodyF,
                        background: C.gold,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.gold,
                      }
                    : {
                        ...bodyF,
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.72)",
                        ["--tw-ring-color" as string]: C.gold,
                      }
                }
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

      <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
        <div
          className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
          style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
        >
          <Landmark size={12} aria-hidden="true" /> Elk werk in zijn eigen passe-partout — serene
          marge, schuine snede, één blik goud.
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
      {/* Hero — het hoofdwerk in een brede passe-partout */}
      <Mat matPad="p-3">
        <div className="p-6 sm:p-9">
          <span
            className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.goldSoft, color: C.goldDeep }}
          >
            <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[42px]"
            style={{ ...display, color: C.ink }}
          >
            Drie werken boven 85% — je portfolio hangt op ooghoogte.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén lijst vraagt aandacht: je VOG verloopt binnenkort. Vernieuw hem en houd je collectie
            onberispelijk verifieerbaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.matboard,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.gold,
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
      </Mat>

      {/* KPI-vensters — vier kleine passe-partouts naast elkaar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Mat key={k.label} interactive>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold"
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
                className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </div>
          </Mat>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches — de wand met aanbevolen werken */}
        <section className="space-y-4">
          <MuseumLabel
            cat="Zaal I · Aanbevolen"
            title="Voor jou geselecteerd"
            sub="Op match-percentage gehangen"
            Icon={Frame}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Mat key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.gold }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-semibold tracking-[-0.01em]"
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
                          className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[11px] font-medium"
                          style={{ ...bodyF, background: C.matboard, color: C.inkSoft }}
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
              </Mat>
            ))}
          </div>
        </section>

        {/* Rechterkolom — vertrouwen + prioriteit */}
        <section className="space-y-4">
          <MuseumLabel
            cat="Herkomst"
            title="Vertrouwen"
            sub="Certificaat-dekking"
            Icon={ShieldCheck}
          />
          <Mat>
            <div className="flex items-center gap-5 p-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.paper }}
                >
                  <span
                    className="text-[26px] font-semibold leading-none"
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
                  alleen geverifieerde stukken.
                </p>
              </div>
            </div>
          </Mat>

          {/* Prioriteit — donker passe-partout venster */}
          <Mat tone="ink">
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[18px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(255,255,255,0.74)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b2620]"
                style={{
                  ...bodyF,
                  background: C.gold,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Mat>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MuseumLabel
          cat="Zaal II · Open"
          title="De marktplaats"
          sub="Werken die op je wachten"
          Icon={Landmark}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[3px] px-3.5 py-2"
            style={{ background: C.paper, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek werk of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.paper,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.gold,
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

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[4px] p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `inset 0 0 0 1px ${C.danger}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ ...display, color: C.danger }}>
              Enkele werken konden niet worden opgehaald
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het laden van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading — lege passe-partouts
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Mat key={i}>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                    style={{ background: C.matDeep }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3.5 w-3/4 animate-pulse rounded"
                      style={{ background: C.matDeep }}
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
              </div>
            </Mat>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state — lege wand
        <Mat matPad="p-3">
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-[4px]"
              style={{ background: C.goldSoft, boxShadow: `inset 0 0 0 1px ${C.gold}55` }}
              aria-hidden="true"
            >
              <Frame size={30} strokeWidth={1.5} style={{ color: C.goldDeep }} />
            </span>
            <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
              Lege lijst
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de wand opnieuw te
              hangen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-[3px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Mat>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Mat key={o.id} interactive className="flex flex-col">
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-3 p-4">
                  <MatchRing value={o.match} size={48} />
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
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
                        className="rounded-[3px] px-2 py-0.5 text-[10.5px] font-medium"
                        style={{ ...bodyF, background: C.matboard, color: C.inkSoft }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...bodyF,
                    borderTop: `1px solid ${C.line}`,
                    color: C.ink,
                    ["--tw-ring-color" as string]: C.gold,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </Mat>
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
        className="inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.paper,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.gold,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Mat matPad="p-3">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-9">
          <div className="min-w-0">
            <span
              className="inline-block rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.goldSoft, color: C.goldDeep }}
            >
              Cat. {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px] italic" style={{ ...labelF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </Mat>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Mat key={f.l} interactive>
            <div className="p-4">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-[3px]"
                style={{ background: C.goldSoft }}
                aria-hidden="true"
              >
                <f.Icon size={15} strokeWidth={1.9} style={{ color: C.goldDeep }} />
              </span>
              <div
                className="mt-3 text-[16px] font-semibold leading-none"
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
            </div>
          </Mat>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <MuseumLabel cat="Toelichting I" title="Waarom dit past" Icon={Check} />
          <Mat>
            <div className="p-5">
              <ul className="space-y-3">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                      style={{ background: C.okSoft }}
                      aria-hidden="true"
                    >
                      <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Mat>
        </section>
        <section className="space-y-3">
          <MuseumLabel cat="Toelichting II" title="Om te overwegen" Icon={TriangleAlert} />
          <Mat>
            <div className="p-5">
              <ul className="space-y-3">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                      style={{ background: C.warnSoft }}
                      aria-hidden="true"
                    >
                      <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Mat>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.paper,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.gold,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
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
        <MuseumLabel
          cat="Herkomst-dossier"
          title="Verificatie"
          sub="Certificaten &amp; documenten"
          Icon={ShieldCheck}
        />
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Mat matPad="p-3">
        <div className="flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.gold} 0deg, ${C.goldDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.paper }}
            >
              <span
                className="text-[30px] font-semibold leading-none"
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
            <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd stuk versterkt de collectie. Houd je dekking hoog, dan blijft je
              portfolio onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
            >
              <BadgeCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Mat>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Mat key={c.naam} interactive>
              <div className="flex items-center gap-3.5 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ background: m.bg }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
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
                        className="rounded-[3px] px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...bodyF,
                          background: C.matboard,
                          color: C.ink,
                          ["--tw-ring-color" as string]: C.gold,
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
              </div>
            </Mat>
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
      <MuseumLabel
        cat="Werklijst"
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={FileText}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Mat interactive>
                <div className="flex items-stretch">
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: warn ? C.warn : C.gold }}
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[16px] font-semibold tabular-nums"
                      style={{
                        ...display,
                        background: warn ? C.warnSoft : C.goldSoft,
                        color: warn ? C.warn : C.goldDeep,
                      }}
                      aria-hidden="true"
                    >
                      {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                          style={{
                            ...mono,
                            background: warn ? C.warnSoft : C.infoSoft,
                            color: warn ? C.warn : C.info,
                          }}
                        >
                          {warn ? (
                            <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Urgent" : "Kans"}
                        </span>
                        <h3
                          className="text-[15.5px] font-semibold tracking-[-0.01em]"
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
                        className="mt-3 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
                                background: C.ink,
                                color: C.white,
                                ["--tw-ring-color" as string]: C.gold,
                              }
                        }
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </Mat>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <MuseumLabel
          cat="Correspondentie"
          title="Berichten"
          sub="Recente gesprekken"
          Icon={FileText}
        />
        <Mat>
          <div>
            {BERICHTEN.map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3 p-4"
                style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-bold"
                  style={{
                    ...mono,
                    background: C.goldSoft,
                    color: C.ink,
                    boxShadow: `inset 0 0 0 1px ${C.gold}44`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-[13px] font-semibold"
                      style={{ ...display, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: C.gold }}
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
        </Mat>
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
        <MuseumLabel cat="Grootboek" title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.gold }}
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
          <Mat key={s.l} interactive>
            <div className="p-4">
              <div
                className="h-1 w-10 rounded-full"
                style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldDeep})` }}
                aria-hidden="true"
              />
              <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
              <div
                className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {s.v}
              </div>
            </div>
          </Mat>
        ))}
      </div>

      <Mat matPad="p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.matboard }}>
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
                    className="transition-colors"
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
                        className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
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
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.gold }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Mat>
    </div>
  );
}
