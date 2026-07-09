"use client";

// Concept 228 — "Saffier" · juweel-premium-dark. Diep saffierblauw (#081228 → #12244a) met een
// goud/champagne-accent, subtiele edelsteen-facetten (dunne goudlijn-glans langs paneelranden) en
// elegante serif-koppen. Luxe maar strak: rijk, verfijnd en vertrouwenwekkend — een private-banking-gevoel
// voor de zorg-ZZP'er. Onderscheidt zich door het saffier/goud-palet, de serif-typografie en het facet-detail.
// Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen. Status = label + icoon. UI Nederlands.
// Fonts: --font-lab-fraunces (serif-koppen) + --font-lab-manrope (tekst).

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
  Gem,
  Sparkles,
  Star,
  Crown,
  LayoutGrid,
  Store,
  Briefcase,
  Receipt,
  ListChecks,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — saffier & champagne. Goud is spaarzaam (accent), niet decoratie. ──
const C = {
  bg: "#081228", // diep saffier
  bgDeep: "#060d1e", // dieper (vignet)
  panel: "#0d1c3d", // saffier-paneel
  panelHi: "#12244a", // hover / verhoogd
  line: "#1b2f57", // fijne saffierrand
  lineStrong: "#274073", // sterkere scheiding
  ink: "#eef2fb", // heldere tekst (blauw-wit)
  inkSoft: "#aab7d6", // secundair
  inkFaint: "#7181a6", // labels
  gold: "#e6c67a", // champagne-goud (hoofdaccent)
  goldSoft: "#f2ddab", // lichte glans
  goldDeep: "#c9a54f", // dieper goud (rand/tekst)
  goldBg: "rgba(230,198,122,0.10)",
  sapphire: "#7098ea", // helder saffier (in behandeling)
  sapphireBg: "rgba(112,152,234,0.14)",
  good: "#5fce9e", // smaragd (geverifieerd/betaald)
  goodBg: "rgba(95,206,158,0.13)",
  amber: "#e8a24f", // amber-oranje (aandacht) — los van goud
  amberBg: "rgba(232,162,79,0.14)",
  bad: "#e2718c", // robijn (afgewezen)
  badBg: "rgba(226,113,140,0.14)",
};

const serifF = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-manrope)" };

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: Star,
  acties: ListChecks,
};

// ── Status-model — icoon + label + kleur (nooit kleur alleen). ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.good, bg: C.goodBg };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, fg: C.sapphire, bg: C.sapphireBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.amber, bg: C.amberBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `1px solid ${m.fg}33` }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Facet-paneel — saffier met een dunne goudglans langs de bovenrand (het signatuurdetail).
function Facet({
  children,
  className = "",
  style,
  gleam = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gleam?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[16px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: `0 20px 44px -30px ${C.bgDeep}`,
        ...style,
      }}
    >
      {gleam && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${C.goldDeep}88, transparent)`,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Sectie-kop — klein goud facet-icoon + serif-titel.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
        style={{ background: C.goldBg, border: `1px solid ${C.goldDeep}44` }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={1.8} style={{ color: C.gold }} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[20px] font-semibold leading-tight" style={{ ...serifF, color: C.ink }}>
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// Sparkline — champagne-lijn met zachte vulling.
function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 22 - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,28 ${line} 100,28`;
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="h-7 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <polygon points={area} fill={color} opacity={0.12} />
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

// Match-juweel — goud/saffier facet-ring rond het percentage.
function GemMatch({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? { box: "h-24 w-24", vb: 96, r: 40, sw: 6, num: "text-[26px]", lbl: "text-[9px]" }
      : size === "sm"
        ? { box: "h-12 w-12", vb: 48, r: 20, sw: 4, num: "text-[13px]", lbl: "text-[7px]" }
        : { box: "h-16 w-16", vb: 64, r: 27, sw: 5, num: "text-[17px]", lbl: "text-[8px]" };
  const circ = 2 * Math.PI * dims.r;
  const gid = `saffier-gem-${size}-${value}`;
  return (
    <span
      className={`relative flex ${dims.box} shrink-0 items-center justify-center`}
      aria-hidden="true"
    >
      <svg viewBox={`0 0 ${dims.vb} ${dims.vb}`} className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.goldSoft} />
            <stop offset="1" stopColor={C.gold} />
          </linearGradient>
        </defs>
        <circle
          cx={dims.vb / 2}
          cy={dims.vb / 2}
          r={dims.r}
          fill="none"
          stroke={C.line}
          strokeWidth={dims.sw}
        />
        <circle
          cx={dims.vb / 2}
          cy={dims.vb / 2}
          r={dims.r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={dims.sw}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span
          className={`${dims.num} font-semibold tabular-nums`}
          style={{ ...serifF, color: C.gold }}
        >
          {value}
        </span>
        <span
          className={`${dims.lbl} font-semibold uppercase tracking-[0.14em]`}
          style={{ ...bodyF, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// ── Root — sidebar-shell ─────────────────────────────────────────────────────────
export function Concept228() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const current = SCREENS.find((s) => s.key === screen);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* saffier-facet-sfeer: diepe radialen, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(760px 480px at 10% -8%, ${C.panelHi}, transparent 60%), radial-gradient(680px 460px at 100% 8%, ${C.goldBg}, transparent 62%), radial-gradient(900px 600px at 50% 120%, ${C.bgDeep}, transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-[1240px] gap-0 md:gap-6 md:px-6 md:py-6">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                style={{
                  background: `linear-gradient(140deg, ${C.panelHi}, ${C.panel})`,
                  border: `1px solid ${C.goldDeep}55`,
                  boxShadow: `0 0 0 1px ${C.bgDeep}, 0 10px 26px -14px ${C.gold}55`,
                }}
                aria-hidden="true"
              >
                <Gem size={20} strokeWidth={1.8} style={{ color: C.gold }} />
              </span>
              <div className="leading-tight">
                <div className="text-[17px] font-semibold" style={{ ...serifF, color: C.ink }}>
                  Saffier
                </div>
                <div className="text-[11px]" style={{ ...bodyF, color: C.inkFaint }}>
                  Premium zorgnetwerk
                </div>
              </div>
            </div>

            <Facet className="p-2" gleam={false}>
              <nav className="space-y-0.5" aria-label="Schermen">
                {SCREENS.map((s) => {
                  const on = s.key === screen;
                  const Icon = SCREEN_ICON[s.key];
                  return (
                    <button
                      key={s.key}
                      onClick={() => setScreen(s.key)}
                      aria-current={on ? "page" : undefined}
                      className="group flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: on ? C.goldBg : "transparent",
                        color: on ? C.ink : C.inkSoft,
                        border: `1px solid ${on ? C.goldDeep + "44" : "transparent"}`,
                        fontWeight: on ? 600 : 500,
                        ["--tw-ring-color" as string]: C.gold,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.9}
                        style={{ color: on ? C.gold : C.inkFaint }}
                        aria-hidden="true"
                      />
                      {s.label}
                      {on && (
                        <span
                          className="ml-auto h-1.5 w-1.5 rounded-full"
                          style={{ background: C.gold }}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </Facet>

            <Facet className="p-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    ...serifF,
                    background: C.panelHi,
                    color: C.gold,
                    border: `1px solid ${C.goldDeep}44`,
                  }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <div
                    className="truncate text-[13px] font-semibold"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {PROFIEL.naam}
                  </div>
                  <div className="truncate text-[11px]" style={{ ...bodyF, color: C.inkFaint }}>
                    {PROFIEL.plaats}
                  </div>
                </div>
              </div>
              <span
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold"
                style={{
                  ...bodyF,
                  background: C.goodBg,
                  color: C.good,
                  border: `1px solid ${C.good}33`,
                }}
              >
                <Crown size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
            </Facet>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="min-w-0 flex-1 px-4 py-5 md:px-0 md:py-0">
          {/* Mobiele topbar + horizontale nav */}
          <div className="md:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                  style={{ background: C.panelHi, border: `1px solid ${C.goldDeep}55` }}
                  aria-hidden="true"
                >
                  <Gem size={17} strokeWidth={1.8} style={{ color: C.gold }} />
                </span>
                <span className="text-[16px] font-semibold" style={{ ...serifF, color: C.ink }}>
                  Saffier
                </span>
              </div>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  ...serifF,
                  background: C.panelHi,
                  color: C.gold,
                  border: `1px solid ${C.goldDeep}44`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
            <nav className="mb-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Schermen">
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      ...bodyF,
                      background: on ? C.goldBg : C.panel,
                      color: on ? C.gold : C.inkSoft,
                      border: `1px solid ${on ? C.goldDeep + "55" : C.line}`,
                      ["--tw-ring-color" as string]: C.gold,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Scherm-kop */}
          <div className="mb-5 hidden items-center justify-between gap-4 md:flex">
            <div>
              <div
                className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...bodyF, color: C.goldDeep }}
              >
                <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
              </div>
              <h1
                className="mt-1 text-[28px] font-semibold leading-tight"
                style={{ ...serifF, color: C.ink }}
              >
                {current?.label}
              </h1>
            </div>
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
              <input
                placeholder="Zoeken…"
                aria-label="Zoeken"
                className="w-36 bg-transparent text-[13px] outline-none placeholder:opacity-50"
                style={{ ...bodyF, color: C.ink }}
              />
            </div>
          </div>

          <main>
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onActies={() => setScreen("acties")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onMatches={() => setScreen("marktplaats")} />}
            {screen === "facturen" && <Facturen />}
          </main>

          <footer className="mt-8 border-t pt-5" style={{ borderColor: C.line }}>
            <p
              className="flex flex-wrap items-center justify-center gap-2 text-center text-[12px]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              <Gem size={12} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />{" "}
              Verfijnd en vertrouwenwekkend — elke status draagt een woord én een icoon, nooit
              alleen kleur.
            </p>
          </footer>
        </div>
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
  const sparkColors = [C.gold, C.sapphire, C.good, C.amber];

  return (
    <div className="space-y-5">
      {/* Welkomst-facet */}
      <Facet>
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1
              className="text-[26px] font-semibold leading-[1.1] sm:text-[34px]"
              style={{ ...serifF, color: C.ink }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Drie zorgvuldig geselecteerde opdrachten wachten op u. Uw dossier is grotendeels op
              orde — één certificaat vraagt binnenkort aandacht.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
                  color: C.bgDeep,
                  boxShadow: `0 14px 30px -14px ${C.gold}`,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk uw matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.panelHi,
                  color: C.ink,
                  border: `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.amber }}
                  aria-hidden="true"
                />{" "}
                Regel dossier
              </button>
            </div>
          </div>

          {/* Vertrouwens-juweel */}
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-[14px] p-5 text-center"
            style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
          >
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90" aria-hidden="true">
                <defs>
                  <linearGradient id="c228-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={C.goldSoft} />
                    <stop offset="1" stopColor={C.good} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="50" fill="none" stroke={C.line} strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#c228-ring)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(dek / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span
                  className="text-[28px] font-semibold tabular-nums leading-none"
                  style={{ ...serifF, color: C.gold }}
                >
                  {dek}%
                </span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  dekking
                </span>
              </div>
            </div>
            <StatusChip status="VERIFIED" />
            <p className="text-[12px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
              enkel gecontroleerde documenten.
            </p>
          </div>
        </div>
      </Facet>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Facet key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  ...bodyF,
                  background: k.up ? C.goodBg : C.amberBg,
                  color: k.up ? C.good : C.amber,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2.5 text-[25px] font-semibold tabular-nums leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.gold} />
            </div>
          </Facet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-3.5">
          <SectionHead
            title="Voor u geselecteerd"
            sub="Opdrachten die bij uw dossier passen"
            Icon={Sparkles}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Facet key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--hov" as string]: C.panelHi, ["--tw-ring-color" as string]: C.gold }}
                >
                  <GemMatch value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-semibold"
                      style={{ ...serifF, color: C.ink }}
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
                          style={{ ...bodyF, background: C.goodBg, color: C.good }}
                        >
                          <Check size={11} strokeWidth={2.8} aria-hidden="true" /> {r}
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
                </button>
              </Facet>
            ))}
          </div>
        </section>

        {/* Aandacht + rangschikking */}
        <section className="space-y-3.5">
          <SectionHead title="Vraagt aandacht" sub="Eén handeling" Icon={TriangleAlert} />
          <Facet style={{ background: `linear-gradient(150deg, ${C.panelHi}, ${C.panel})` }}>
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{
                  ...bodyF,
                  background: C.amberBg,
                  color: C.amber,
                  border: `1px solid ${C.amber}33`,
                }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[17px] font-semibold leading-tight"
                style={{ ...serifF, color: C.ink }}
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
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Facet>

          <Facet className="p-5">
            <div className="flex items-center gap-2">
              <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
              <span className="text-[14px] font-semibold" style={{ ...serifF, color: C.ink }}>
                Reputatie
              </span>
            </div>
            <div className="mt-3 space-y-2.5">
              {[
                { l: "Reactietijd", v: "< 2 uur" },
                { l: "Voltooide opdrachten", v: "37" },
                { l: "Beoordeling", v: "4,9 / 5" },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between">
                  <span className="text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {r.l}
                  </span>
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{ ...serifF, color: C.gold }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </Facet>
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

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 640);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Marktplaats"
          sub="Alle open opdrachten, met zorg gerangschikt"
          Icon={Store}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{ background: C.panel, border: `1px solid ${C.line}` }}
          >
            <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              border: `1px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.gold }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[14px] p-4"
          role="alert"
          style={{ background: C.badBg, border: `1px solid ${C.bad}44` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold" style={{ ...serifF, color: C.ink }}>
              Niet alle opdrachten geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de lijst kon niet worden opgehaald. Ververs gerust om het opnieuw te
              proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-3 py-1 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Facet key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-full"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-full"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-full"
                  style={{ background: C.line }}
                />
              </div>
            </Facet>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Facet className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.goldBg, border: `1px solid ${C.goldDeep}44` }}
            aria-hidden="true"
          >
            <Gem size={28} strokeWidth={1.6} style={{ color: C.gold }} />
          </span>
          <p className="text-[19px] font-semibold" style={{ ...serifF, color: C.ink }}>
            Geen opdracht gevonden
          </p>
          <p
            className="max-w-sm text-[13px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Er is geen resultaat voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het
            veld om alles te tonen.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
              color: C.bgDeep,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Facet>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Facet key={o.id} className="flex flex-col">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
                  style={{
                    ...bodyF,
                    background: C.bgDeep,
                    color: C.goldDeep,
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {o.id}
                </span>
                <GemMatch value={o.match} size="sm" />
              </div>
              <div className="px-5 pb-2 pt-3">
                <h3
                  className="text-[17px] font-semibold leading-tight"
                  style={{ ...serifF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2.5">
                  {[
                    { Icon: MapPin, v: o.plaats },
                    { Icon: Coins, v: o.tarief },
                    { Icon: Clock, v: o.uren },
                    { Icon: CalendarDays, v: o.start },
                  ].map((m, mi) => (
                    <div key={mi} className="flex items-center gap-2" style={{ color: C.inkSoft }}>
                      <m.Icon
                        size={14}
                        strokeWidth={1.9}
                        style={{ color: C.goldDeep }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[12.5px]" style={bodyF}>
                        {m.v}
                      </span>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ ...bodyF, background: C.sapphireBg, color: C.sapphire }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-3.5 text-[12.5px] font-semibold transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.gold,
                  ["--hov" as string]: C.panelHi,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Facet>
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
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.inkSoft,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.gold,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Facet>
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums"
                style={{
                  ...bodyF,
                  background: C.goldBg,
                  color: C.gold,
                  border: `1px solid ${C.goldDeep}44`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.12] sm:text-[32px]"
              style={{ ...serifF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <GemMatch value={opdracht.match} size="lg" />
        </div>
      </Facet>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Facet key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[11px]"
              style={{ background: C.goldBg, border: `1px solid ${C.goldDeep}33` }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={1.9} style={{ color: C.gold }} />
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Facet>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Facet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.goodBg }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.8} style={{ color: C.good }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Facet>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Facet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.4} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Facet>
        </section>
      </div>

      <Facet className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
          <span className="text-[14px] font-semibold" style={{ ...serifF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={{
                ...bodyF,
                background: C.panelHi,
                color: C.inkSoft,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck
                size={13}
                strokeWidth={2.2}
                style={{ color: C.good }}
                aria-hidden="true"
              />{" "}
              {t}
            </span>
          ))}
        </div>
      </Facet>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:translate-y-0"
          style={{
            ...bodyF,
            background: applied ? C.goodBg : `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
            color: applied ? C.good : C.bgDeep,
            border: applied ? `1px solid ${C.good}44` : "none",
            boxShadow: applied ? "none" : `0 16px 30px -14px ${C.gold}`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.8} aria-hidden="true" /> Uw reactie is verstuurd
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
            background: saved ? C.goldBg : C.panel,
            color: C.ink,
            border: `1px solid ${saved ? C.goldDeep + "66" : C.line}`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star
            size={16}
            strokeWidth={2}
            style={{ color: C.gold }}
            fill={saved ? C.gold : "none"}
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Uw certificaten"
          sub="Documenten die uw vertrouwen bewijzen"
          Icon={ShieldCheck}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Facet>
        <div className="flex flex-wrap items-center gap-6 p-6 sm:p-7">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="c228-verif" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={C.goldSoft} />
                  <stop offset="1" stopColor={C.good} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" fill="none" stroke={C.line} strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#c228-verif)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(dek / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
              />
            </svg>
            <span
              className="absolute text-[24px] font-semibold tabular-nums"
              style={{ ...serifF, color: C.gold }}
            >
              {dek}%
            </span>
          </div>
          <div className="max-w-sm">
            <div className="text-[19px] font-semibold" style={{ ...serifF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat verhoogt uw vertrouwensniveau en uw plek in de
              rangschikking bij opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
              style={{
                ...bodyF,
                background: C.goodBg,
                color: C.good,
                border: `1px solid ${C.good}33`,
              }}
            >
              <Crown size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Facet>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Facet key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: m.bg, border: `1px solid ${m.fg}33` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold"
                  style={{ ...serifF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.gold,
                        border: `1px solid ${C.line}`,
                        ["--tw-ring-color" as string]: C.gold,
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
            </Facet>
          );
        })}
      </div>

      <section className="space-y-3">
        <SectionHead title="Uw documenten" sub="Veilig en privé bewaard" Icon={FileText} />
        <Facet>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgDeep }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
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
                          className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                          style={{ background: C.goldBg }}
                          aria-hidden="true"
                        >
                          <FileText size={14} strokeWidth={2} style={{ color: C.gold }} />
                        </span>
                        <span
                          className="text-[13px] font-semibold"
                          style={{ ...bodyF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Facet>
      </section>
    </div>
  );
}

// ── Acties (next-action-engine) ──────────────────────────────────────────────────
function Acties({ onMatches }: { onMatches: () => void }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const openCount = sorted.filter((a) => !done[a.titel]).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Aanbevolen handelingen"
          sub="Van belangrijk naar minder urgent"
          Icon={ListChecks}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.goodBg : C.amberBg,
            color: openCount === 0 ? C.good : C.amber,
            border: `1px solid ${(openCount === 0 ? C.good : C.amber) + "33"}`,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.8} aria-hidden="true" /> Alles afgehandeld
            </>
          ) : (
            <>
              {openCount} open {openCount === 1 ? "handeling" : "handelingen"}
            </>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tone = isDone ? C.good : warn ? C.amber : C.sapphire;
          return (
            <li key={a.titel}>
              <Facet style={isDone ? { opacity: 0.68 } : undefined}>
                <div className="flex items-stretch">
                  <span className="w-1 shrink-0" style={{ background: tone }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-semibold tabular-nums"
                      style={{
                        ...serifF,
                        background: isDone ? C.goodBg : C.panelHi,
                        color: tone,
                        border: `1px solid ${tone}33`,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? <Check size={18} strokeWidth={2.8} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.05em]"
                          style={{
                            ...bodyF,
                            background: warn ? C.amberBg : C.sapphireBg,
                            color: warn ? C.amber : C.sapphire,
                          }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[15px] font-semibold ${isDone ? "line-through" : ""}`}
                          style={{ ...serifF, color: C.ink }}
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
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          onClick={a.cta === "Bekijk matches" ? onMatches : undefined}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={
                            warn
                              ? {
                                  ...bodyF,
                                  background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
                                  color: C.bgDeep,
                                  ["--tw-ring-color" as string]: C.gold,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                              : {
                                  ...bodyF,
                                  background: C.panelHi,
                                  color: C.gold,
                                  border: `1px solid ${C.line}`,
                                  ["--tw-ring-color" as string]: C.gold,
                                  ["--tw-ring-offset-color" as string]: C.panel,
                                }
                          }
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...bodyF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.good,
                            ["--tw-ring-color" as string]: C.good,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          <Check size={14} strokeWidth={2.8} aria-hidden="true" />{" "}
                          {isDone ? "Ongedaan maken" : "Klaar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Facet>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Facet className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.goldBg, border: `1px solid ${C.goldDeep}44` }}
            aria-hidden="true"
          >
            <Sparkles size={26} strokeWidth={1.8} style={{ color: C.gold }} />
          </span>
          <p className="text-[17px] font-semibold" style={{ ...serifF, color: C.ink }}>
            Alles afgehandeld
          </p>
          <p className="max-w-xs text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            Uw dossier is volledig op orde. We laten het weten zodra er een nieuwe handeling
            verschijnt.
          </p>
        </Facet>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.good, bg: C.goodBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amber, bg: C.amberBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Uw facturen"
          sub="Overzicht van omzet en openstaande posten"
          Icon={Receipt}
        />
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(135deg, ${C.goldSoft}, ${C.gold})`,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tone: C.good },
          { l: "Openstaand", v: String(open), Icon: Clock, tone: C.amber },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Coins, tone: C.gold },
        ].map((s) => (
          <Facet key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[11px]"
                style={{ background: C.goldBg, border: `1px solid ${C.goldDeep}22` }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2} style={{ color: s.tone }} />
              </span>
              <div className="text-[12px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...serifF, color: C.ink }}
            >
              {s.v}
            </div>
          </Facet>
        ))}
      </div>

      <Facet>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
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
                      className="px-5 py-4 text-[13px] font-semibold tabular-nums"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: `1px solid ${m.fg}33`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...serifF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid ${C.lineStrong}`, background: C.bgDeep }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[11.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...serifF, color: C.gold }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Facet>
    </div>
  );
}
