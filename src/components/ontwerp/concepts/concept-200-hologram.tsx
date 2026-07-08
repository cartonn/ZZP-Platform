"use client";

// Concept 200 — "Hologram" · holografische, iriserende echtheids-folie als verificatie- en vertrouwenstaal.
// Mijlpaal-concept (nr. 200). Zoals de regenboog-folie op ID-kaarten en echtheidskenmerken: verificatie is
// een holografisch zegel dat van kleur verschuift (CSS conic/linear-gradient iridescentie) op een donker
// basisvlak, zodat de folie oplicht — een security-/authenticiteitsgevoel. Onderscheidt zich expliciet van
// chroom (vlak metallic), zwartlicht (UV-glow op zwart), reglet/guilloché (fijne lijnpatronen) en spectraal/
// refractie (prisma-breking): dit is specifiek holografische FOLIE als echtheidszegel. De folie is altijd
// ACCENT — randen, zegels, chips — nooit onder de tekst; tekst staat op donkere, contrastrijke vlakken en
// blijft leesbaar. Status altijd via label + icoon + vorm, nooit kleur alleen. Deterministisch (geen random/Date).
// UI Nederlands. Fonts: Sora (display) + Plus Jakarta Sans (tekst) + IBM Plex Mono (serienummers/cijfers).

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
  BadgeCheck,
  Sparkles,
  ScanLine,
  Fingerprint,
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

// ── Palet — donker basisvlak zodat de folie oplicht. Iriserende hues zijn accenten; tekst leest op donkere plaat. ──
const C = {
  bg: "#070810", // diepe basis (near-black indigo)
  bgDeep: "#04040b", // dieper vlak (masthead)
  panel: "#0f1120", // kaart-oppervlak
  panelHi: "#171a2e", // opgetild vlak / hover
  line: "#242844", // fijne rand
  lineSoft: "#1a1d33",
  ink: "#eef0fb", // primaire tekst (hoog contrast)
  inkSoft: "#a9b0cf", // secundaire tekst
  inkFaint: "#6d7599", // labels / serienummers
  // iriserende folie-hues
  h1: "#ff7ad0", // magenta
  h2: "#ffd86e", // goud
  h3: "#5cf0c0", // mint
  h4: "#66c8ff", // cyaan
  h5: "#b98cff", // violet
  // status (leesbaar op donker)
  ok: "#3ee6a0",
  okBg: "rgba(62,230,160,0.12)",
  wait: "#66c8ff",
  waitBg: "rgba(102,200,255,0.12)",
  warn: "#ffce54",
  warnBg: "rgba(255,206,84,0.12)",
  bad: "#ff738a",
  badBg: "rgba(255,115,138,0.12)",
  onFoil: "#0a0a14",
};

// Iriserende gradients — de folie zelf. Conic voor het zegel, lineair voor banden/randen.
const HOLO_CONIC = `conic-gradient(from 200deg at 50% 50%, ${C.h1}, ${C.h2}, ${C.h3}, ${C.h4}, ${C.h5}, ${C.h1})`;
const HOLO_LINE = `linear-gradient(115deg, ${C.h1}, ${C.h2}, ${C.h3}, ${C.h4}, ${C.h5}, ${C.h1})`;
const HOLO_SOFT = `linear-gradient(115deg, rgba(255,122,208,0.9), rgba(255,216,110,0.9), rgba(92,240,192,0.9), rgba(102,200,255,0.9), rgba(185,140,255,0.9))`;

const display = { fontFamily: "var(--font-lab-sora)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Iriserende tekst (spaarzaam — alleen koppen/merk), leest doordat de folie helder is op donker.
const foilText: React.CSSProperties = {
  background: HOLO_LINE,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

// ── Status-model — vorm draagt mee: gevuld (solid) / omlijnd (outline) / streep (dashed) / dubbel (double). ──
type Variant = "solid" | "outline" | "dashed" | "double";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.ok,
        bg: C.okBg,
        border: C.ok,
        variant: "solid",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.wait,
        bg: C.waitBg,
        border: C.wait,
        variant: "outline",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnBg,
        border: C.warn,
        variant: "dashed",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.bad,
        bg: C.badBg,
        border: C.bad,
        variant: "double",
      };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "dashed") return { border: `1.5px dashed ${m.border}` };
  if (m.variant === "double") return { border: `2.5px double ${m.border}` };
  return { border: `1px solid ${m.border}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Holografisch echtheidszegel — een iriserend muntvlak met donker hart. Kern van de verificatietaal. ──
function HoloSeal({
  size = 56,
  Icon = ShieldCheck,
  spin = false,
}: {
  size?: number;
  Icon?: LucideIcon;
  spin?: boolean;
}) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-0 rounded-full ${spin ? "motion-safe:animate-[spin_9s_linear_infinite]" : ""}`}
        style={{ background: HOLO_CONIC }}
      />
      {/* radiale glans + rand */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 25%, rgba(255,255,255,0.55), transparent 60%)",
        }}
      />
      <span
        className="absolute inset-[3px] flex items-center justify-center rounded-full"
        style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
      >
        <Icon size={size * 0.36} strokeWidth={2} style={{ color: C.h4 }} />
      </span>
    </span>
  );
}

// ── Kaart — donkere plaat met een iriserende hairline-rand die bij hover feller oplicht (folie-accent). ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
  foil = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  foil?: boolean; // true = permanente iriserende rand, anders subtiele lijn die bij hover foliekleurt
}) {
  return (
    <div
      className={`group/card rounded-2xl p-px transition-shadow duration-300 ${interactive ? "hover:shadow-[0_18px_44px_-22px_rgba(102,200,255,0.4)]" : ""}`}
      style={{ background: foil ? HOLO_LINE : C.line }}
    >
      <div
        className={`relative h-full overflow-hidden rounded-[15px] ${interactive ? "transition-transform duration-300 hover:-translate-y-0.5" : ""} ${className}`}
        style={{ background: C.panel, ...style }}
      >
        {interactive && !foil && (
          <span
            className="pointer-events-none absolute inset-0 rounded-[15px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            style={{
              boxShadow: `inset 0 0 0 1px transparent`,
              background: `linear-gradient(180deg, rgba(102,200,255,0.06), transparent 40%)`,
            }}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    </div>
  );
}

// Sectie-kop — folie-glyph + display-titel + iriserende liniaal.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-lg p-px" style={{ background: HOLO_LINE }} aria-hidden="true">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[7px]"
          style={{ background: C.panel }}
        >
          <Icon size={16} strokeWidth={2} style={{ color: C.h4 }} />
        </span>
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-semibold leading-none tracking-tight"
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
        style={{ background: HOLO_SOFT, opacity: 0.5 }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.h4 }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — iriserende boog op donkere rest, mono-cijfer in het hart.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.h4} 0deg, ${C.h3} ${deg * 0.5}deg, ${C.h1} ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.panel }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.h4 }}
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

// Mini staaf-spark — laatste staaf iriserend.
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
            background: i === data.length - 1 ? HOLO_LINE : "rgba(102,200,255,0.18)",
          }}
        />
      ))}
    </div>
  );
}

// Serienummer-tag — echtheidskenmerk (decoratief).
function Serial({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
      style={{
        ...mono,
        background: C.panelHi,
        color: C.inkFaint,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
    >
      {children}
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept200() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Donker basisvlak met zachte folie-schijn in de hoeken zodat de iridescentie oplicht */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(60% 40% at 12% 0%, rgba(255,122,208,0.10), transparent 60%), radial-gradient(55% 40% at 90% 8%, rgba(102,200,255,0.10), transparent 60%), radial-gradient(70% 50% at 50% 100%, rgba(185,140,255,0.08), transparent 65%)`,
        }}
        aria-hidden="true"
      />
      {/* Fijne folie-scanlijn-textuur (echtheidskenmerk) — heel subtiel */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `repeating-linear-gradient(115deg, transparent 0 6px, rgba(255,255,255,0.015) 6px 7px)`,
          opacity: 0.7,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — masthead met iriserende onderrand */}
        <header className="relative overflow-hidden" style={{ background: C.bgDeep }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: HOLO_LINE }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <HoloSeal size={44} Icon={Fingerprint} spin />
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.h4 }}
                >
                  Hologram
                </div>
                <div
                  className="text-[24px] font-semibold leading-none tracking-tight"
                  style={{ ...display, ...foilText }}
                >
                  Echtheidsfolie
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Verificatie · Vertrouwen · Zegel
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}55`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="rounded-full p-px"
                style={{ background: HOLO_LINE }}
                aria-hidden="true"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ ...mono, background: C.panel, color: C.ink }}
                >
                  {PROFIEL.initialen}
                </span>
              </span>
            </div>
          </div>

          {/* Scherm-switcher — pil-tabs met folie-rand op actief */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return on ? (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current="page"
                  className="relative shrink-0 rounded-full p-px transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: HOLO_LINE,
                    ["--tw-ring-color" as string]: C.h4,
                    ["--tw-ring-offset-color" as string]: C.bgDeep,
                  }}
                >
                  <span
                    className="block rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                    style={{ ...bodyF, background: C.panelHi, color: C.ink }}
                  >
                    {s.label}
                  </span>
                </button>
              ) : (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    background: C.panel,
                    color: C.inkSoft,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                    ["--tw-ring-color" as string]: C.h4,
                    ["--tw-ring-offset-color" as string]: C.bgDeep,
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Sparkles size={12} style={{ color: C.h3 }} aria-hidden="true" /> Iriserende folie als
            echtheidszegel — de kleur verschuift, het vertrouwen niet.
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
    <div className="space-y-8">
      {/* Hero — iriserende folie-rand, groot echtheidszegel */}
      <Card foil className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 130% at 100% 0%, rgba(255,122,208,0.10), transparent 55%), radial-gradient(80% 120% at 0% 100%, rgba(102,200,255,0.08), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:p-9">
          <div className="min-w-0 max-w-xl flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: C.waitBg,
                  color: C.h4,
                  boxShadow: `inset 0 0 0 1px ${C.h4}55`,
                }}
              >
                <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
              </span>
              <Serial>
                <ScanLine size={9} aria-hidden="true" /> ZZP · 2041 · ✓
              </Serial>
            </div>
            <h1
              className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[42px]"
              style={{ ...display, color: C.ink }}
            >
              Je profiel draagt een <span style={foilText}>echt</span> vertrouwenszegel.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Drie matches boven 85% zijn klaar om op te reageren. Eén ding vraagt aandacht: je VOG
              verloopt binnenkort — vernieuw het zodat je zegel geldig blijft.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: HOLO_LINE,
                  ["--tw-ring-color" as string]: C.h4,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold"
                  style={{ ...bodyF, background: C.panelHi, color: C.ink }}
                >
                  Bekijk matches <ArrowRight size={15} aria-hidden="true" />
                </span>
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.panel,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.h4,
                  ["--tw-ring-offset-color" as string]: C.panel,
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
          <HoloSeal size={104} Icon={ShieldCheck} spin />
        </div>
      </Card>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.ok + "55" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Sparkles}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.h4 }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold tracking-tight"
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
                          style={{
                            ...bodyF,
                            background: C.panelHi,
                            color: C.inkSoft,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }}
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
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card foil className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.h4} 0deg, ${C.h3} ${dek * 1.8}deg, ${C.h1} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.panel }}
                >
                  <span
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.h3 }}
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
          </Card>

          {/* Prioriteit — folie-rand, donker vlak */}
          <Card foil className="relative">
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  ...mono,
                  background: C.warnBg,
                  color: C.warn,
                  boxShadow: `inset 0 0 0 1px ${C.warn}55`,
                }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[20px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: HOLO_LINE,
                  ["--tw-ring-color" as string]: C.h4,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
                  style={{ ...bodyF, background: C.panelHi, color: C.ink }}
                >
                  {warn.cta} <ArrowRight size={13} aria-hidden="true" />
                </span>
              </button>
            </div>
          </Card>
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
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.h4 }} aria-hidden="true" />
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
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.h4,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.h4 }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.badBg, border: `1.5px dashed ${C.bad}` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
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
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <HoloSeal size={64} Icon={Search} />
          <p
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om nieuwe opdrachten te
            tonen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: HOLO_LINE,
              ["--tw-ring-color" as string]: C.h4,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            <span
              className="block rounded-full px-4 py-2 text-[12px] font-semibold"
              style={{ ...bodyF, background: C.panelHi, color: C.ink }}
            >
              Zoekterm wissen
            </span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div className="h-1 w-full" style={{ background: HOLO_LINE }} aria-hidden="true" />
              <div className="relative flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
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
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.h4,
                  ["--tw-ring-color" as string]: C.h4,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.h4,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card foil className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(80% 130% at 100% 0%, rgba(255,122,208,0.10), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.waitBg,
                  color: C.h4,
                  boxShadow: `inset 0 0 0 1px ${C.h4}55`,
                }}
              >
                {opdracht.id}
              </span>
              <Serial>
                <ScanLine size={9} aria-hidden="true" /> geverifieerd
              </Serial>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-[38px]"
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
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.waitBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.h4 }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okBg, boxShadow: `inset 0 0 0 1px ${C.ok}55` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}55` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: HOLO_LINE,
            ["--tw-ring-color" as string]: C.h4,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <span
            className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold"
            style={{ ...bodyF, background: C.panelHi, color: C.ink }}
          >
            Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
          </span>
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.h4,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.h4 }} aria-hidden="true" /> Bewaar
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
          className="inline-flex items-center gap-2 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: HOLO_LINE,
            ["--tw-ring-color" as string]: C.h4,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{ ...bodyF, background: C.panelHi, color: C.ink }}
          >
            <Plus size={14} aria-hidden="true" /> Toevoegen
          </span>
        </button>
      </div>

      {/* Vertrouwenszegel — het holografische echtheidskenmerk als kern van de verificatie */}
      <Card foil className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 130% at 0% 0%, rgba(102,200,255,0.10), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <span
              className="absolute inset-0 rounded-full motion-safe:animate-[spin_12s_linear_infinite]"
              style={{
                background: `conic-gradient(${C.h4} 0deg, ${C.h3} ${dek * 1.8}deg, ${C.h1} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
              }}
            />
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.panel }}
            >
              <span
                className="text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.h3 }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[20px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat versterkt je echtheidszegel. Houd je dekking hoog, dan
              blijft je profiel onmiskenbaar betrouwbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}55`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          const verifiedCard = c.status === "VERIFIED";
          return (
            <Card
              key={c.naam}
              interactive
              foil={verifiedCard}
              className="flex items-center gap-3.5 p-4"
            >
              {verifiedCard ? (
                <HoloSeal size={44} Icon={m.Icon} />
              ) : (
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg, ...borderFor(m) }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold tracking-tight"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.h4,
                        ["--tw-ring-offset-color" as string]: C.panel,
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
            </Card>
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
        Icon={Sparkles}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive foil={warn} className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? HOLO_LINE : "rgba(102,200,255,0.4)" }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.warnBg,
                            color: C.warn,
                            boxShadow: `inset 0 0 0 1px ${C.warn}55`,
                          }
                        : {
                            ...mono,
                            background: C.panelHi,
                            color: C.h4,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? {
                                ...mono,
                                background: C.warnBg,
                                color: C.warn,
                                boxShadow: `inset 0 0 0 1px ${C.warn}55`,
                              }
                            : {
                                ...mono,
                                background: C.waitBg,
                                color: C.h4,
                                boxShadow: `inset 0 0 0 1px ${C.h4}55`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[17px] font-semibold tracking-tight"
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
                    {warn ? (
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          background: HOLO_LINE,
                          ["--tw-ring-color" as string]: C.h4,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
                          style={{ ...bodyF, background: C.panelHi, color: C.ink }}
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </span>
                      </button>
                    ) : (
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...bodyF,
                          background: C.panelHi,
                          color: C.ink,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.h4,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.panelHi,
                  color: C.h4,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.h1 }}
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
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): {
    label: string;
    Icon: LucideIcon;
    fg: string;
    bg: string;
    border: string;
    dashed: boolean;
  } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg, border: C.ok, dashed: false };
    if (status === "Openstaand")
      return {
        label: "Openstaand",
        Icon: Clock,
        fg: C.warn,
        bg: C.warnBg,
        border: C.warn,
        dashed: true,
      };
    return {
      label: "Concept",
      Icon: FileText,
      fg: C.inkSoft,
      bg: C.panelHi,
      border: C.line,
      dashed: false,
    };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-full p-px transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: HOLO_LINE,
            ["--tw-ring-color" as string]: C.h4,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{ ...bodyF, background: C.panelHi, color: C.ink }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: HOLO_LINE }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: m.dashed ? `1.5px dashed ${m.border}` : `1px solid ${m.border}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, background: C.panelHi, color: C.inkFaint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, background: C.panelHi, ...foilText }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
