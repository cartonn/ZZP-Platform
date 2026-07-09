"use client";

// Concept 230 — "Horizon" · ultra-wide panoramisch, cinematisch kalm. Horizontale ritmiek: brede
// full-bleed banden, een terugkerend horizon-lijn-motief en een rustige dageraad-landschapsgradient
// (nacht-blauw → schemer → perzik-gloed). Widescreen dashboards met horizontale secties, ruime
// letter-tracking en een serif-display voor filmische kalmte. Signatuur: de zon die als match-boog
// boven de horizon opkomt. Deterministisch — geen random, geen Date, geen netwerk/afbeeldingen.
// Status = label + icoon (nooit alleen kleur), hoog contrast (WCAG-AA). Fonts: Fraunces (display) +
// Inter (tekst). UI Nederlands, code Engels.

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
  FileText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Sunrise,
  Mountain,
  Compass,
  Send,
  Bookmark,
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

// ── Palet — dageraad boven een kalm landschap; warm papier, schemer-blauw, perzik-gloed. ──
const C = {
  bg: "#f6f2ea", // warm papier
  bg2: "#efe8dc", // zandband
  panel: "#ffffff", // paneel
  panelSoft: "#faf6ee", // zacht paneel
  line: "#e7ded0", // rand
  lineHi: "#d7cab5", // sterkere rand
  ink: "#25313b", // diep leisteen
  inkSoft: "#5c6872", // secundair
  inkFaint: "#8c96a0", // labels
  dusk: "#3f6f8f", // schemer-blauw (hoofdaccent)
  duskDeep: "#2c5674", // leesbaar donker blauw
  duskBg: "#e6eef3", // zacht blauw vlak
  dawn: "#d5824f", // dageraad-perzik/koraal
  dawnDeep: "#b3652f", // leesbaar koraal
  dawnBg: "#f6e6d7", // zacht perzik vlak
  gold: "#e0a94e", // ochtendgoud
  goldDeep: "#9c7016", // leesbaar goud
  goldBg: "#f6ecd4", // zacht goud vlak
  sage: "#4f8a63", // salie (geverifieerd/goed)
  sageDeep: "#357049",
  sageBg: "#e3f0e6", // zacht salie vlak
  terra: "#c0563f", // terracotta (afgewezen/fout)
  terraDeep: "#9c3f2c",
  terraBg: "#f6e0da",
  nightTop: "#20323f", // nacht bovenaan de dageraad
};

const displayF = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };

// ── Status-model — label + icoon + kleur (nooit kleur alleen). ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.sageDeep,
        bg: C.sageBg,
        ring: C.sage,
      };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.duskDeep, bg: C.duskBg, ring: C.dusk };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.goldDeep,
        bg: C.goldBg,
        ring: C.gold,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.terraDeep, bg: C.terraBg, ring: C.terra };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `1px solid ${m.ring}44` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Breed paneel met dunne bovenrand-horizon.
function Band({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 20px 50px -40px rgba(37,49,59,0.5)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop met dunne horizon-onderstreping.
function SectionHead({
  title,
  sub,
  Icon,
  tint = C.dusk,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: C.panelSoft, border: `1px solid ${tint}33` }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[20px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ ...displayF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value, tint }: { Icon: LucideIcon; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={14} strokeWidth={2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Kalme, brede sparkline met horizonlijn (deterministisch uit de mock-reeks).
function Spark({ data, color, id }: { data: number[]; color: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 20 - 3;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id={`hor-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.22" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="27" x2="100" y2="27" stroke={C.line} strokeWidth="1" />
      <polygon points={`0,28 ${line} 100,28`} fill={`url(#hor-fill-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Signatuur: de opkomende zon als match-boog boven een horizonlijn.
function SunHorizon({ value, size = 150 }: { value: number; size?: number }) {
  // De zon rijst met het percentage: hoger match = hoger boven de horizon.
  const rise = (value / 100) * 40; // 0..40 px omhoog
  const cy = 60 - rise;
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ width: size, height: size * 0.66, border: `1px solid ${C.lineHi}` }}
    >
      <svg viewBox="0 0 150 100" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hor-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.nightTop} />
            <stop offset="0.55" stopColor={C.dusk} />
            <stop offset="1" stopColor={C.dawn} />
          </linearGradient>
          <radialGradient id="hor-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe9c2" />
            <stop offset="0.7" stopColor={C.gold} />
            <stop offset="1" stopColor={C.dawn} />
          </radialGradient>
          <clipPath id="hor-clip">
            <rect x="0" y="0" width="150" height="70" />
          </clipPath>
        </defs>
        <rect x="0" y="0" width="150" height="70" fill="url(#hor-sky)" />
        <circle cx="75" cy={cy} r="20" fill="url(#hor-sun)" clipPath="url(#hor-clip)" />
        <line x1="0" y1="70" x2="150" y2="70" stroke={C.dawnDeep} strokeWidth="1.5" />
        <rect x="0" y="70" width="150" height="30" fill={C.bg2} />
      </svg>
      <div className="absolute inset-x-0 bottom-1.5 flex flex-col items-center">
        <span
          className="text-[22px] font-semibold tabular-nums leading-none"
          style={{ ...displayF, color: C.ink }}
        >
          {value}
          <span className="text-[12px]" style={{ color: C.dawnDeep }}>
            %
          </span>
        </span>
        <span
          className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...bodyF, color: C.inkFaint }}
        >
          match
        </span>
      </div>
    </div>
  );
}

// Horizontale voortgangsbalk met dageraad-verloop.
function DawnBar({ value }: { value: number }) {
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: C.bg2 }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${C.dusk}, ${C.gold}, ${C.dawn})`,
        }}
      />
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept230() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* dageraad-sfeer: een brede, kalme gloed langs de bovenrand */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72"
        style={{
          background: `linear-gradient(180deg, ${C.dawnBg}88, transparent), radial-gradient(1200px 240px at 50% -60px, ${C.goldBg}, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — breed, panoramisch */}
        <header
          className="sticky top-0 z-30 border-b"
          style={{ background: `${C.bg}e6`, backdropFilter: "blur(12px)", borderColor: C.line }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-10">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                style={{ background: `linear-gradient(180deg, ${C.dusk}, ${C.dawn})` }}
                aria-hidden="true"
              >
                <Sunrise size={19} strokeWidth={2} style={{ color: "#fff" }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...displayF, color: C.ink }}
                >
                  Horizon
                </div>
                <div
                  className="mt-1 flex items-center gap-1.5 text-[11.5px]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  <Compass size={11} strokeWidth={2} style={{ color: C.dusk }} aria-hidden="true" />
                  {PROFIEL.rol}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.sageBg,
                  color: C.sageDeep,
                  border: `1px solid ${C.sage}33`,
                }}
              >
                <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{
                  ...displayF,
                  background: C.duskBg,
                  color: C.duskDeep,
                  border: `1px solid ${C.dusk}33`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — brede, rustige tabs met horizon-onderstreping */}
          <nav
            className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 md:px-10"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-3.5 py-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    color: on ? C.ink : C.inkSoft,
                    ["--tw-ring-color" as string]: C.dusk,
                    ["--tw-ring-offset-color" as string]: C.bg,
                  }}
                >
                  {s.label}
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, ${C.dusk}, ${C.dawn})`,
                      opacity: on ? 1 : 0,
                    }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-10 md:py-9">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-12 md:px-10">
          <div
            className="flex flex-wrap items-center justify-center gap-2 border-t pt-6 text-center text-[12px]"
            style={{ ...bodyF, borderColor: C.line, color: C.inkFaint }}
          >
            <Sunrise size={13} strokeWidth={2} style={{ color: C.dawn }} aria-hidden="true" />
            Kalm en weids — elke status draagt een woord én een icoon, dus niets hangt alleen aan
            kleur.
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
  const sparkColors = [C.dusk, C.dawn, C.sageDeep, C.goldDeep];

  return (
    <div className="space-y-8">
      {/* Panoramische dageraad-band als hero */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: `1px solid ${C.lineHi}` }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(105deg, ${C.nightTop}, ${C.dusk} 46%, ${C.dawn} 88%)`,
          }}
          aria-hidden="true"
        />
        {/* horizonlijn + gelaagde bergen */}
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
          aria-hidden="true"
        >
          <path
            d="M0 90 L180 58 L360 84 L560 50 L760 82 L980 46 L1200 78 L1200 120 L0 120 Z"
            fill="#ffffff18"
          />
          <path
            d="M0 104 L220 78 L440 100 L680 74 L900 100 L1120 80 L1200 96 L1200 120 L0 120 Z"
            fill="#ffffff28"
          />
          <line x1="0" y1="66" x2="1200" y2="66" stroke="#ffffff44" strokeWidth="1" />
        </svg>
        <div className="relative grid gap-6 p-6 sm:p-9 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
              style={{
                ...bodyF,
                background: "#ffffff26",
                color: "#fff",
                border: "1px solid #ffffff44",
              }}
            >
              <Sunrise size={13} strokeWidth={2.2} aria-hidden="true" /> Goedemorgen
            </span>
            <h1
              className="mt-5 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[42px]"
              style={{ ...displayF, color: "#fff" }}
            >
              Dag {PROFIEL.naam.split(" ")[0]} — de dag
              <br />
              opent met <span style={{ color: "#ffe4c4" }}>drie heldere matches</span>.
            </h1>
            <p
              className="mt-4 max-w-xl text-[14.5px] leading-relaxed"
              style={{ ...bodyF, color: "#ffffffdd" }}
            >
              Je koers ligt vast. Eén ding vraagt aandacht aan de horizon — je VOG verloopt
              binnenkort — de rest van het uitzicht is helder.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: "#fff",
                  color: C.ink,
                  ["--tw-ring-color" as string]: "#fff",
                  ["--tw-ring-offset-color" as string]: C.dusk,
                }}
              >
                Bekijk je matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: "#ffffff22",
                  color: "#fff",
                  border: "1px solid #ffffff55",
                  ["--tw-ring-color" as string]: "#fff",
                  ["--tw-ring-offset-color" as string]: C.dusk,
                }}
              >
                <TriangleAlert size={15} strokeWidth={2.2} aria-hidden="true" /> Regel dat ene ding
              </button>
            </div>
          </div>

          {/* Vertrouwens-kaart met horizon */}
          <div
            className="flex flex-col justify-center gap-3 rounded-xl p-5"
            style={{ background: "#ffffffee", border: "1px solid #ffffff" }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                Vertrouwen
              </span>
              <StatusChip status="VERIFIED" />
            </div>
            <div className="flex items-end gap-2">
              <span
                className="text-[40px] font-semibold tabular-nums leading-none"
                style={{ ...displayF, color: C.ink }}
              >
                {dek}%
              </span>
              <span className="mb-1.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                dekking
              </span>
            </div>
            <DawnBar value={dek} />
            <p className="text-[12px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Opdrachtgevers
              zien alleen gecontroleerde documenten.
            </p>
          </div>
        </div>
      </div>

      {/* KPI-strip — horizontaal, panoramisch */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Band key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11.5px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{
                  ...bodyF,
                  background: k.up ? C.sageBg : C.goldBg,
                  color: k.up ? C.sageDeep : C.goldDeep,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[27px] font-semibold tabular-nums leading-none"
              style={{ ...displayF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark
                data={k.spark}
                color={sparkColors[i % sparkColors.length] ?? C.dusk}
                id={`kpi-${i}`}
              />
            </div>
          </Band>
        ))}
      </div>

      {/* Horizontale secties */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <section className="space-y-4">
          <SectionHead
            title="Aan de horizon"
            sub="Opdrachten die op koers liggen"
            Icon={Mountain}
            tint={C.dusk}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Band key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ["--hov" as string]: C.panelSoft,
                    ["--tw-ring-color" as string]: C.dusk,
                  }}
                >
                  <span
                    className="w-1.5 shrink-0"
                    style={{ background: `linear-gradient(180deg, ${C.dusk}, ${C.dawn})` }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-1 items-center gap-4 p-4">
                    <div className="w-16 shrink-0 text-center">
                      <div
                        className="text-[24px] font-semibold tabular-nums leading-none"
                        style={{ ...displayF, color: C.dusk }}
                      >
                        {o.match}
                      </div>
                      <div
                        className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{ ...bodyF, color: C.inkFaint }}
                      >
                        match
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[16px] font-semibold"
                        style={{ ...displayF, color: C.ink }}
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
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                            style={{ ...bodyF, background: C.sageBg, color: C.sageDeep }}
                          >
                            <Check size={11} strokeWidth={2.6} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="shrink-0"
                      style={{ color: C.inkFaint }}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              </Band>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead
            title="Vraagt aandacht"
            sub="Aan de horizon"
            Icon={TriangleAlert}
            tint={C.goldDeep}
          />
          <Band className="overflow-hidden" style={{ borderColor: `${C.gold}66` }}>
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.dawn})` }}
              aria-hidden="true"
            />
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ ...bodyF, background: C.goldBg, color: C.goldDeep }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[18px] font-semibold leading-tight"
                style={{ ...displayF, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.ink,
                  color: "#fff",
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Band>

          <Band className="overflow-hidden">
            <div
              className="flex items-center gap-2 border-b px-5 py-3.5"
              style={{ borderColor: C.line }}
            >
              <Send size={15} strokeWidth={2} style={{ color: C.dusk }} aria-hidden="true" />
              <span className="text-[14px] font-semibold" style={{ ...displayF, color: C.ink }}>
                Berichten
              </span>
            </div>
            <div>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ ...displayF, background: C.duskBg, color: C.duskDeep }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-[13px] font-semibold"
                        style={{ ...bodyF, color: C.ink }}
                      >
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.dawn }}
                          aria-label="Ongelezen bericht"
                        />
                      )}
                    </div>
                    <p
                      className="mt-0.5 truncate text-[12px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ ...bodyF, color: C.inkFaint }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </div>
          </Band>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);
  const metaTints = [C.dusk, C.dawn, C.sageDeep, C.goldDeep] as const;

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
        <SectionHead
          title="Marktplaats"
          sub="Het volledige uitzicht op open opdrachten"
          Icon={Search}
          tint={C.dusk}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={15} style={{ color: C.dusk }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              ["--hov" as string]: C.panelSoft,
              ["--tw-ring-color" as string]: C.dusk,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.dusk }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.terraBg, border: `1px solid ${C.terra}44` }}
        >
          <XCircle size={19} strokeWidth={2.2} style={{ color: C.terraDeep }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold" style={{ ...displayF, color: C.ink }}>
              Niet het hele uitzicht geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten bleven achter de horizon. Ververs om het volledige beeld te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.terraDeep, ["--tw-ring-color" as string]: C.terra }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Band key={i} className="flex items-center gap-4 p-5">
              <span
                className="h-14 w-14 shrink-0 animate-pulse rounded-full"
                style={{ background: C.bg2 }}
              />
              <div className="flex-1 space-y-2">
                <span
                  className="block h-4 w-2/3 animate-pulse rounded-full"
                  style={{ background: C.bg2 }}
                />
                <span
                  className="block h-3 w-1/3 animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
              <span
                className="hidden h-8 w-28 animate-pulse rounded-full sm:block"
                style={{ background: C.bg2 }}
              />
            </Band>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Band className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Mountain size={30} strokeWidth={1.6} style={{ color: C.inkFaint }} />
          </span>
          <p className="text-[20px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Een lege horizon
          </p>
          <p
            className="max-w-sm text-[13px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het veld, dan
            komt het hele uitzicht terug.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.dusk,
              color: "#fff",
              ["--tw-ring-color" as string]: C.dusk,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Band>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <Band
              key={o.id}
              className="overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              <div className="grid gap-0 md:grid-cols-[auto_1fr_auto]">
                {/* Match-boog links, panoramisch */}
                <div
                  className="flex items-center justify-center gap-4 border-b p-5 md:border-b-0 md:border-r"
                  style={{ borderColor: C.line, background: C.panelSoft }}
                >
                  <SunHorizon value={o.match} size={132} />
                </div>
                {/* Middenblok */}
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11.5px] font-medium tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {o.id}
                    </span>
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: C.lineHi }}
                      aria-hidden="true"
                    />
                    <span className="text-[11.5px]" style={{ ...bodyF, color: C.inkFaint }}>
                      {o.opdrachtgever}
                    </span>
                  </div>
                  <h3
                    className="mt-1 text-[19px] font-semibold leading-tight"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <dl className="mt-3 grid grid-cols-2 gap-y-2.5 sm:grid-cols-4">
                    <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                    <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                    <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                    <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                        style={{
                          ...bodyF,
                          background: C.bg2,
                          color: C.inkSoft,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Actie rechts */}
                <div
                  className="flex items-center border-t p-5 md:border-l md:border-t-0"
                  style={{ borderColor: C.line }}
                >
                  <button
                    onClick={onOpen}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:w-auto"
                    style={{
                      ...bodyF,
                      background: C.dusk,
                      color: "#fff",
                      ["--tw-ring-color" as string]: C.dusk,
                      ["--tw-ring-offset-color" as string]: C.panel,
                    }}
                  >
                    Bekijk <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </Band>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.dawnDeep },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.dusk },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.sageDeep },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.goldDeep },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ["--hov" as string]: C.panelSoft,
          ["--tw-ring-color" as string]: C.dusk,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      {/* Panoramische kop-band */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: `1px solid ${C.lineHi}` }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(105deg, ${C.nightTop}, ${C.dusk} 50%, ${C.dawn} 92%)`,
          }}
          aria-hidden="true"
        />
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full"
          aria-hidden="true"
        >
          <path
            d="M0 96 L240 70 L480 92 L720 66 L960 92 L1200 74 L1200 120 L0 120 Z"
            fill="#ffffff20"
          />
          <line x1="0" y1="60" x2="1200" y2="60" stroke="#ffffff44" strokeWidth="1" />
        </svg>
        <div className="relative flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums"
                style={{
                  ...bodyF,
                  background: "#ffffff26",
                  color: "#fff",
                  border: "1px solid #ffffff44",
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: "#ffffffcc" }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[34px]"
              style={{ ...displayF, color: "#fff" }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: "#ffffffdd" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <SunHorizon value={opdracht.match} size={190} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Band key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: C.panelSoft, border: `1px solid ${f.tint}33` }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3 text-[18px] font-semibold tabular-nums leading-none"
              style={{ ...displayF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Band>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.sageDeep} />
          <Band className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.sageBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.sageDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Band>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} tint={C.goldDeep} />
          <Band className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.goldBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.goldDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Band>
        </section>
      </div>

      <Band className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} strokeWidth={2} style={{ color: C.dusk }} aria-hidden="true" />
          <span className="text-[15px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium"
              style={{
                ...bodyF,
                background: C.duskBg,
                color: C.duskDeep,
                border: `1px solid ${C.dusk}33`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </Band>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...bodyF,
            background: applied ? C.sageBg : `linear-gradient(100deg, ${C.dusk}, ${C.dawn})`,
            color: applied ? C.sageDeep : "#fff",
            ["--tw-ring-color" as string]: C.dusk,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: saved ? C.duskBg : C.panel,
            color: C.ink,
            border: `1px solid ${saved ? C.dusk : C.line}`,
            ["--tw-ring-color" as string]: C.dusk,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark
            size={16}
            strokeWidth={2.2}
            style={{ color: C.dusk }}
            fill={saved ? C.dusk : "none"}
            aria-hidden="true"
          />
          {saved ? "Bewaard" : "Bewaar"}
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
        <SectionHead
          title="Jouw certificaten"
          sub="Documenten die je koers betrouwbaar maken"
          Icon={ShieldCheck}
          tint={C.sageDeep}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.dusk,
            color: "#fff",
            ["--tw-ring-color" as string]: C.dusk,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      {/* Panoramische dekkings-band */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ border: `1px solid ${C.lineHi}` }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(100deg, ${C.dusk}, ${C.sage} 90%)` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <div className="flex flex-1 items-center gap-5" style={{ minWidth: 260 }}>
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={{ background: "#ffffff2e", border: "1px solid #ffffff55" }}
              aria-hidden="true"
            >
              <BadgeCheck size={26} strokeWidth={2} style={{ color: "#fff" }} />
            </span>
            <div>
              <div
                className="text-[24px] font-semibold tabular-nums"
                style={{ ...displayF, color: "#fff" }}
              >
                {verified} / {CREDENTIALS.length} geverifieerd
              </div>
              <p
                className="mt-1.5 max-w-sm text-[13px] leading-relaxed"
                style={{ ...bodyF, color: "#ffffffdd" }}
              >
                Elk gecontroleerd certificaat verheldert je horizon. Nog even en het hele uitzicht
                staat op groen.
              </p>
            </div>
          </div>
          <div className="w-full max-w-xs rounded-xl p-4" style={{ background: "#ffffffee" }}>
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                Dekking
              </span>
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ ...displayF, color: C.sageDeep }}
              >
                {dek}%
              </span>
            </div>
            <DawnBar value={dek} />
            <span
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium"
              style={{ ...bodyF, color: C.sageDeep }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Band key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: m.bg, border: `1px solid ${m.ring}44` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold"
                  style={{ ...displayF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-3 py-1 text-[12px] font-semibold transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.panelSoft,
                        color: C.duskDeep,
                        border: `1px solid ${C.line}`,
                        ["--hov" as string]: C.bg2,
                        ["--tw-ring-color" as string]: C.dusk,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijken"}
                    </button>
                  )}
                </div>
              </div>
            </Band>
          );
        })}
      </div>

      {/* Documenten */}
      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé bewaard"
          Icon={FileText}
          tint={C.dusk}
        />
        <Band className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.panelSoft }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: C.duskBg }}
                          aria-hidden="true"
                        >
                          <FileText size={14} strokeWidth={2} style={{ color: C.duskDeep }} />
                        </span>
                        <span
                          className="text-[13.5px] font-semibold"
                          style={{ ...bodyF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Band>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Vandaag op je koers"
          sub="Van dringend naar rustig aan de horizon"
          Icon={Compass}
          tint={C.dusk}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.sageBg : C.goldBg,
            color: openCount === 0 ? C.sageDeep : C.goldDeep,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={12} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "punt" : "punten"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.goldDeep : C.dusk;
          const tintBg = warn ? C.goldBg : C.duskBg;
          const bar = isDone ? C.sage : warn ? C.gold : C.dusk;
          return (
            <li key={a.titel}>
              <Band className="overflow-hidden" style={isDone ? { opacity: 0.68 } : undefined}>
                <div className="flex items-stretch">
                  <span className="w-1.5 shrink-0" style={{ background: bar }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                      style={{
                        ...displayF,
                        background: isDone ? C.sageBg : tintBg,
                        color: isDone ? C.sageDeep : tint,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={19} strokeWidth={2.6} />
                      ) : warn ? (
                        <TriangleAlert size={18} strokeWidth={2.2} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em]"
                          style={{ ...bodyF, background: tintBg, color: tint }}
                        >
                          {warn ? (
                            <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Sunrise size={10} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-semibold ${isDone ? "line-through" : ""}`}
                          style={{ ...displayF, color: C.ink }}
                        >
                          {a.titel}
                        </h3>
                      </div>
                      <p
                        className="mt-1.5 text-[13.5px] leading-relaxed"
                        style={{ ...bodyF, color: C.inkSoft }}
                      >
                        {a.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...bodyF,
                                  background: C.ink,
                                  color: "#fff",
                                  ["--tw-ring-color" as string]: C.gold,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                              : {
                                  ...bodyF,
                                  background: C.duskBg,
                                  color: C.duskDeep,
                                  ["--tw-ring-color" as string]: C.dusk,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...bodyF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.sageDeep,
                            ["--tw-ring-color" as string]: C.sage,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.6} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Band>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Band className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.sageBg }}
            aria-hidden="true"
          >
            <Sunrise size={26} strokeWidth={2} style={{ color: C.sageDeep }} />
          </span>
          <p className="text-[18px] font-semibold" style={{ ...displayF, color: C.ink }}>
            Een heldere horizon
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. We laten het weten zodra er een nieuwe kans opkomt.
          </p>
        </Band>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.sageDeep, bg: C.sageBg, ring: C.sage };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.goldDeep, bg: C.goldBg, ring: C.gold };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bg2, ring: C.line };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Omzet en openstaand, van dichtbij tot horizon"
          Icon={Coins}
          tint={C.dawnDeep}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.dusk,
            color: "#fff",
            ["--tw-ring-color" as string]: C.dusk,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.sageDeep, tintBg: C.sageBg },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.goldDeep, tintBg: C.goldBg },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Send, tint: C.dawnDeep, tintBg: C.dawnBg },
        ].map((s) => (
          <Band key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: s.tintBg }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.2} style={{ color: s.tint }} />
              </span>
              <div className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[27px] font-semibold tabular-nums leading-none"
              style={{ ...displayF, color: C.ink }}
            >
              {s.v}
            </div>
          </Band>
        ))}
      </div>

      <Band className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.panelSoft }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...bodyF, color: C.inkFaint }}
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
                  <tr key={f.nr} style={{ borderTop: i === 0 ? undefined : `1px solid ${C.line}` }}>
                    <td
                      className="px-5 py-4 text-[13.5px] font-semibold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: `1px solid ${m.ring}44`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.panelSoft, borderTop: `1px solid ${C.lineHi}` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...displayF, color: C.sageDeep }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Band>
    </div>
  );
}
