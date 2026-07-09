"use client";

// Concept 225 — "Anker" · maritiem-industrieel solide. Diep navy/staalblauw met koper/messing-accent,
// robuuste stevige randen, touw- en kettingdetail via inline-SVG en degelijke tabbladen. Uitstraling:
// betrouwbaar, verankerd vertrouwen, degelijk vakwerk — het tegenovergestelde van vluchtig. Onderscheidt
// zich met de donkere staaltint, de warme koperaccenten en de touw-/kettingmotieven als scheidingslijnen.
// Status = label + icoon (nooit alleen kleur), WCAG-AA-contrast op donker. Fonts: Space Grotesk (koppen)
// + IBM Plex Mono (codes/cijfers). Deterministisch: geen random, geen Date, geen netwerk/afbeeldingen.

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
  Anchor,
  Compass,
  Waves,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — diep navy/staal met koper & messing; pale steel voor tekst (AA op donker). ──
const C = {
  bg: "#0b1626", // diepzee-navy
  bgDeep: "#081019", // romp-donker
  panel: "#0f2035", // staalpaneel
  panelHi: "#14273f", // hover
  ink: "#e8eef6", // pale steel (hoofdtekst)
  inkSoft: "#9db0c6", // secundair
  inkFaint: "#6a7f98", // labels
  line: "#1e3350", // stalen rand
  copper: "#d4934a", // koper-hoofdaccent
  copperBright: "#e8a95e", // helder koper (tekst op donker)
  copperDeep: "#a86a2c", // dieper koper
  copperBg: "#2a1d10", // koper-vlak (donker)
  brass: "#c9b26a", // messing
  brassBg: "#241f10",
  teal: "#4fb6a6", // zeegroen (goed)
  tealBright: "#6fd0bf",
  tealBg: "#0e2a29",
  amber: "#e0a94a", // waarschuwing
  amberBright: "#f0c065",
  amberBg: "#2a2011",
  red: "#e0715f", // afgewezen
  redBright: "#f0917f",
  redBg: "#2a1512",
  steel: "#5b86b8", // staalblauw-accent
  steelBright: "#7fa6d4",
  steelBg: "#122236",
};

const headF = { fontFamily: "var(--font-lab-space)" };
const bodyF = { fontFamily: "var(--font-lab-space)" };
const monoF = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Status-model — vorm + icoon + label; nooit alleen kleur. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; border: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.tealBright,
        bg: C.tealBg,
        border: C.teal,
      };
    case "SUBMITTED":
      return {
        label: "In behandeling",
        Icon: Clock,
        fg: C.steelBright,
        bg: C.steelBg,
        border: C.steel,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.amberBright,
        bg: C.amberBg,
        border: C.amber,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.redBright, bg: C.redBg, border: C.red };
  }
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.04em]"
      style={{ ...bodyF, background: m.bg, color: m.fg, border: `1px solid ${m.border}66` }}
    >
      <m.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Robuuste stalen kaart — stevige rand, subtiele binnenglans, koperhoek-detail optioneel.
function Panel({
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
      className={`rounded-[8px] ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px -30px rgba(0,0,0,0.9)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Touw-scheidingslijn — inline-SVG kabelmotief; signatuurdetail van dit concept.
function RopeDivider() {
  return (
    <svg
      viewBox="0 0 200 6"
      preserveAspectRatio="none"
      className="h-1.5 w-full"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <pattern id="c225-rope" x="0" y="0" width="12" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 3 Q3 0 6 3 T12 3" fill="none" stroke={C.copperDeep} strokeWidth="1.4" />
          <path
            d="M0 3 Q3 6 6 3 T12 3"
            fill="none"
            stroke={C.copper}
            strokeWidth="1.4"
            opacity="0.7"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="200" height="6" fill="url(#c225-rope)" />
    </svg>
  );
}

// Ketting-schakel accent (klein, verticaal) — voor sectie-scheiding in detailweergave.
function ChainLink({ tint = C.copper }: { tint?: string }) {
  return (
    <svg width="14" height="26" viewBox="0 0 14 26" aria-hidden="true" role="presentation">
      <rect x="3" y="1" width="8" height="11" rx="4" fill="none" stroke={tint} strokeWidth="1.6" />
      <rect
        x="3"
        y="10"
        width="8"
        height="11"
        rx="4"
        fill="none"
        stroke={tint}
        strokeWidth="1.6"
        opacity="0.7"
      />
    </svg>
  );
}

function SectionHead({
  title,
  sub,
  Icon,
  tint = C.copper,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
        style={{ background: C.bgDeep, border: `1px solid ${tint}55` }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2} style={{ color: tint }} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[19px] font-bold leading-tight" style={{ ...headF, color: C.ink }}>
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

function Meta({ Icon, value, tint }: { Icon: LucideIcon; value: string; tint: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: C.inkSoft }}>
      <Icon size={15} strokeWidth={2} style={{ color: tint }} aria-hidden="true" />
      <span className="truncate text-[13px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Sparkline in koper op donker.
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
      <polygon points={area} fill={color} opacity={0.14} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Kompas-match: ring met koper-naald en percentage.
function MatchGauge({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? 96 : size === "sm" ? 48 : 66;
  const r = dim / 2 - 6;
  const circ = 2 * Math.PI * r;
  const num = size === "lg" ? "text-[26px]" : size === "sm" ? "text-[14px]" : "text-[18px]";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" aria-hidden="true">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={C.line} strokeWidth="5" />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke={C.copper}
          strokeWidth="5"
          strokeLinecap="butt"
          strokeDasharray={`${(value / 100) * circ} ${circ}`}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className={`${num} font-bold tabular-nums`} style={{ ...monoF, color: C.ink }}>
          {value}
        </span>
        {size !== "sm" && (
          <span
            className="text-[8px] font-bold uppercase tracking-[0.18em]"
            style={{ ...headF, color: C.copperBright }}
          >
            match
          </span>
        )}
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept225() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* diepzee-sfeer: donkere vignetten, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(900px 500px at 100% -10%, ${C.steelBg}, transparent 60%), radial-gradient(700px 500px at -5% 100%, ${C.copperBg}88, transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <header
          className="sticky top-0 z-30"
          style={{
            background: `${C.bgDeep}f0`,
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: C.copperBg, border: `1px solid ${C.copper}66` }}
                aria-hidden="true"
              >
                <Anchor size={20} strokeWidth={2} style={{ color: C.copperBright }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[19px] font-bold tracking-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  Anker
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  Verankerd overzicht, {PROFIEL.naam.split(" ")[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.tealBg,
                  color: C.tealBright,
                  border: `1px solid ${C.teal}55`,
                }}
              >
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[8px] text-[12px] font-bold"
                style={{
                  ...monoF,
                  background: C.steelBg,
                  color: C.steelBright,
                  border: `1px solid ${C.line}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          <nav
            className="mx-auto flex max-w-6xl items-center gap-0 overflow-x-auto px-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 px-4 py-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...headF,
                    color: on ? C.copperBright : C.inkSoft,
                    ["--tw-ring-color" as string]: C.copper,
                  }}
                >
                  {s.label}
                  <span
                    className="absolute inset-x-2 bottom-0 h-[2px] rounded-full"
                    style={{ background: on ? C.copper : "transparent" }}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9">
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

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <RopeDivider />
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2 text-center text-[12px]"
            style={{ ...bodyF, color: C.inkFaint }}
          >
            <Anchor size={13} strokeWidth={2} style={{ color: C.copper }} aria-hidden="true" />{" "}
            Degelijk en verankerd — elke status draagt een woord én een icoon, dus niets hangt
            alleen aan kleur.
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
  const sparkColors = [C.copper, C.steel, C.teal, C.brass];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="overflow-hidden">
          <div className="relative p-7 sm:p-9">
            <span
              className="inline-flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.05em]"
              style={{
                ...bodyF,
                background: C.bgDeep,
                color: C.copperBright,
                border: `1px solid ${C.copper}44`,
              }}
            >
              <Compass size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-5 text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[38px]"
              style={{ ...headF, color: C.ink }}
            >
              Koers gezet, {PROFIEL.naam.split(" ")[0]}.
              <br />
              <span style={{ color: C.copperBright }}>Drie opdrachten</span> voor anker.
            </h1>
            <p
              className="mt-4 max-w-md text-[14.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Stabiele week. Eén ding vraagt aandacht — je VOG verloopt binnenkort — de rest ligt
              stevig vast.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-[6px] px-5 py-3 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.copper,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.copperBright,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                Bekijk opdrachten <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-[6px] px-5 py-3 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: "transparent",
                  color: C.ink,
                  border: `1px solid ${C.line}`,
                  ["--tw-ring-color" as string]: C.copper,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                <TriangleAlert
                  size={15}
                  strokeWidth={2.2}
                  style={{ color: C.amberBright }}
                  aria-hidden="true"
                />{" "}
                Regel je VOG
              </button>
            </div>
          </div>
          <RopeDivider />
        </Panel>

        <Panel>
          <div className="flex flex-col items-center justify-center gap-4 p-7 text-center">
            <MatchGauge value={dek} size="lg" />
            <StatusChip status="VERIFIED" />
            <p className="text-[12.5px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten liggen vast. Opdrachtgevers zien
              alleen geverifieerde documenten.
            </p>
          </div>
        </Panel>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <span
                className="text-[11.5px] font-medium uppercase tracking-[0.04em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] font-bold"
                style={{
                  ...monoF,
                  background: k.up ? C.tealBg : C.amberBg,
                  color: k.up ? C.tealBright : C.amberBright,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[25px] font-bold tabular-nums leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} color={sparkColors[i % sparkColors.length] ?? C.copper} />
            </div>
          </Panel>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <SectionHead
            title="Voor jou geselecteerd"
            sub="Opdrachten die passen bij je koers"
            Icon={Compass}
            tint={C.steel}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[color:var(--hov)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ["--hov" as string]: C.panelHi,
                    ["--tw-ring-color" as string]: C.copper,
                  }}
                >
                  <MatchGauge value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-bold"
                      style={{ ...headF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[13px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11.5px] font-medium"
                          style={{ ...bodyF, background: C.tealBg, color: C.tealBright }}
                        >
                          <Check size={12} strokeWidth={2.6} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Panel>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHead title="Vraagt aandacht" sub="Snel geregeld" Icon={Waves} tint={C.amber} />
          <Panel style={{ borderColor: `${C.amber}55` }}>
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ ...headF, background: C.amber, color: C.bgDeep }}
              >
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Aandacht
              </span>
              <h3
                className="mt-3 text-[17px] font-bold leading-tight"
                style={{ ...headF, color: C.ink }}
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
                className="mt-4 inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...headF,
                  background: C.amber,
                  color: C.bgDeep,
                  ["--tw-ring-color" as string]: C.amberBright,
                  ["--tw-ring-offset-color" as string]: C.panel,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck
                size={16}
                strokeWidth={2}
                style={{ color: C.tealBright }}
                aria-hidden="true"
              />
              <span className="text-[14px] font-bold" style={{ ...headF, color: C.ink }}>
                Vertrouwensniveau
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Je profiel ligt op{" "}
              <strong style={{ color: C.tealBright }}>{PROFIEL.trust.toLowerCase()}</strong> voor
              anker. Dat geeft voorrang bij nieuwe matches.
            </p>
            <div
              className="mt-4 h-2.5 w-full overflow-hidden rounded-[3px]"
              style={{ background: C.bgDeep }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-[3px]"
                style={{
                  width: `${dek}%`,
                  background: `linear-gradient(90deg, ${C.copperDeep}, ${C.copper})`,
                }}
              />
            </div>
          </Panel>
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
  const metaTints = [C.steel, C.copper, C.teal, C.brass] as const;

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
        <SectionHead title="Marktplaats" sub="Alle open opdrachten aan boord" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[6px] px-3.5 py-2.5"
            style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
          >
            <Search size={16} style={{ color: C.copper }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[13px] outline-none placeholder:opacity-60"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opdrachten verversen"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.bgDeep,
              border: `1px solid ${C.line}`,
              ["--tw-ring-color" as string]: C.copper,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.copper }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-[8px] p-4"
          role="alert"
          style={{ background: C.redBg, border: `1px solid ${C.red}55` }}
        >
          <XCircle size={20} strokeWidth={2.2} style={{ color: C.redBright }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold" style={{ ...headF, color: C.ink }}>
              Niet alles kon laden
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een paar opdrachten lieten op zich wachten. Ververs gerust om het opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[4px] px-3 py-1 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.redBright, ["--tw-ring-color" as string]: C.red }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-16 w-16 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.bgDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-4 w-3/4 animate-pulse rounded-[4px]"
                    style={{ background: C.line }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-[4px]"
                    style={{ background: C.bgDeep }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded-[4px]"
                  style={{ background: C.bgDeep }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded-[4px]"
                  style={{ background: C.bgDeep }}
                />
              </div>
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: C.bgDeep, border: `1px solid ${C.copper}44` }}
            aria-hidden="true"
          >
            <Anchor size={34} strokeWidth={1.6} style={{ color: C.copper }} />
          </span>
          <p className="text-[20px] font-bold" style={{ ...headF, color: C.ink }}>
            Niets gevonden
          </p>
          <p
            className="max-w-sm text-[13.5px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Geen opdracht voor &ldquo;{q}&rdquo;. Probeer een andere zoekterm — of wis het veld, dan
            komen alle opdrachten weer boven.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[6px] px-5 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...headF,
              background: C.copper,
              color: C.bgDeep,
              ["--tw-ring-color" as string]: C.copperBright,
              ["--tw-ring-offset-color" as string]: C.panel,
            }}
          >
            Toon alles
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <span
                  className="rounded-[4px] px-2 py-1 text-[11px] font-bold tabular-nums"
                  style={{ ...monoF, background: C.bgDeep, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <MatchGauge value={o.match} size="sm" />
              </div>
              <div className="px-5 pb-3 pt-3">
                <h3
                  className="text-[16.5px] font-bold leading-tight"
                  style={{ ...headF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3.5 grid grid-cols-2 gap-y-2.5">
                  <Meta Icon={MapPin} value={o.plaats} tint={metaTints[0]} />
                  <Meta Icon={Coins} value={o.tarief} tint={metaTints[1]} />
                  <Meta Icon={Clock} value={o.uren} tint={metaTints[2]} />
                  <Meta Icon={CalendarDays} value={o.start} tint={metaTints[3]} />
                </dl>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
                      style={{ ...bodyF, background: C.steelBg, color: C.steelBright }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...headF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.copperBright,
                  ["--tw-ring-color" as string]: C.copper,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Panel>
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
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.copper },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.steel },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.teal },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.brass },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...headF,
          background: C.panel,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.copper,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={15} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-[4px] px-2.5 py-1 text-[11px] font-bold tabular-nums"
                style={{
                  ...monoF,
                  background: C.bgDeep,
                  color: C.copperBright,
                  border: `1px solid ${C.copper}44`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[25px] font-bold leading-[1.12] tracking-tight sm:text-[32px]"
              style={{ ...headF, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchGauge value={opdracht.match} size="lg" />
        </div>
        <RopeDivider />
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[6px]"
              style={{ background: C.bgDeep, border: `1px solid ${f.tint}44` }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2} style={{ color: f.tint }} />
            </span>
            <div
              className="mt-3 text-[17px] font-bold tabular-nums leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...headF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ChainLink tint={C.teal} />
            <SectionHead title="Waarom dit past" Icon={Check} tint={C.teal} />
          </div>
          <Panel className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px]"
                    style={{ background: C.tealBg }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={2.6} style={{ color: C.tealBright }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ChainLink tint={C.amber} />
            <SectionHead title="Om te overwegen" Icon={TriangleAlert} tint={C.amber} />
          </div>
          <Panel className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px]"
                    style={{ background: C.amberBg }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={12} strokeWidth={2.4} style={{ color: C.amberBright }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={16}
            strokeWidth={2}
            style={{ color: C.tealBright }}
            aria-hidden="true"
          />
          <span className="text-[15px] font-bold" style={{ ...headF, color: C.ink }}>
            Wat de opdrachtgever vraagt
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium"
              style={{
                ...bodyF,
                background: C.steelBg,
                color: C.steelBright,
                border: `1px solid ${C.line}`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {t}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => setApplied(true)}
          disabled={applied}
          className="flex flex-1 items-center justify-center gap-2 rounded-[6px] px-6 py-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: applied ? C.tealBg : C.copper,
            color: applied ? C.tealBright : C.bgDeep,
            border: applied ? `1px solid ${C.teal}66` : "none",
            ["--tw-ring-color" as string]: C.copperBright,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          {applied ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Je reactie is verstuurd
            </>
          ) : (
            <>
              Reageren op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
        <button
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          className="flex items-center justify-center gap-2 rounded-[6px] px-6 py-4 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: saved ? C.copperBg : C.panel,
            color: C.ink,
            border: `1px solid ${saved ? C.copper : C.line}`,
            ["--tw-ring-color" as string]: C.copper,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Bookmark
            size={16}
            strokeWidth={2.2}
            style={{ color: C.copperBright }}
            fill={saved ? C.copper : "none"}
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
          sub="Documenten die je verankeren in vertrouwen"
          Icon={ShieldCheck}
          tint={C.teal}
        />
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.copper,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.copperBright,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Document toevoegen
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <MatchGauge value={dek} size="lg" />
          <div className="max-w-sm">
            <div className="text-[20px] font-bold" style={{ ...headF, color: C.ink }}>
              {verified} van {CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1.5 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk gecontroleerd certificaat verankert je profiel steviger. Je bent bijna rond — nog
              even en alles ligt vast.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em]"
              style={{
                ...bodyF,
                background: C.tealBg,
                color: C.tealBright,
                border: `1px solid ${C.teal}55`,
              }}
            >
              <BadgeCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
        <RopeDivider />
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} className="flex items-center gap-4 p-5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: m.bg, border: `1px solid ${m.border}55` }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold" style={{ ...headF, color: C.ink }}>
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusChip status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-[4px] px-3 py-1 text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...headF,
                        background: C.bgDeep,
                        color: C.copperBright,
                        border: `1px solid ${C.line}`,
                        ["--tw-ring-color" as string]: C.copper,
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
            </Panel>
          );
        })}
      </div>

      <section className="space-y-3">
        <SectionHead
          title="Je documenten"
          sub="Veilig en privé onder dek"
          Icon={FileText}
          tint={C.steel}
        />
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgDeep }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...headF, color: C.inkFaint }}
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
                          className="flex h-8 w-8 items-center justify-center rounded-[5px]"
                          style={{ background: C.bgDeep, border: `1px solid ${C.line}` }}
                          aria-hidden="true"
                        >
                          <FileText size={15} strokeWidth={2} style={{ color: C.copper }} />
                        </span>
                        <span
                          className="text-[13.5px] font-bold"
                          style={{ ...headF, color: C.ink }}
                        >
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px]"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...monoF, color: C.inkSoft }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={d.status} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
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
          title="Vandaag voor jou"
          sub="Van belangrijk naar minder — vink af"
          Icon={Compass}
          tint={C.steel}
        />
        <span
          className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em]"
          style={{
            ...bodyF,
            background: openCount === 0 ? C.tealBg : C.amberBg,
            color: openCount === 0 ? C.tealBright : C.amberBright,
            border: `1px solid ${openCount === 0 ? C.teal : C.amber}55`,
          }}
        >
          {openCount === 0 ? (
            <>
              <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Alles gedaan
            </>
          ) : (
            <>{openCount} open</>
          )}
        </span>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const isDone = !!done[a.titel];
          const tint = warn ? C.amber : C.steel;
          const tintBright = warn ? C.amberBright : C.steelBright;
          const tintBg = warn ? C.amberBg : C.steelBg;
          const bar = isDone ? C.teal : warn ? C.amber : C.steel;
          return (
            <li key={a.titel}>
              <Panel className="overflow-hidden" style={isDone ? { opacity: 0.7 } : undefined}>
                <div className="flex items-stretch">
                  <span className="w-1.5 shrink-0" style={{ background: bar }} aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-start gap-4 p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-[16px] font-bold tabular-nums"
                      style={{
                        ...monoF,
                        background: isDone ? C.tealBg : tintBg,
                        color: isDone ? C.tealBright : tintBright,
                        border: `1px solid ${isDone ? C.teal : tint}44`,
                      }}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <Check size={20} strokeWidth={2.6} />
                      ) : warn ? (
                        <TriangleAlert size={19} strokeWidth={2.2} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]"
                          style={{ ...headF, background: tintBg, color: tintBright }}
                        >
                          {warn ? (
                            <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                          ) : (
                            <Compass size={11} strokeWidth={2.4} aria-hidden="true" />
                          )}
                          {warn ? "Aandacht" : "Kans"}
                        </span>
                        <h3
                          className={`text-[16px] font-bold ${isDone ? "line-through" : ""}`}
                          style={{ ...headF, color: C.ink }}
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
                          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: warn ? C.copper : C.bgDeep,
                            color: warn ? C.bgDeep : C.copperBright,
                            border: warn ? "none" : `1px solid ${C.line}`,
                            ["--tw-ring-color" as string]: C.copper,
                            ["--tw-ring-offset-color" as string]: C.panel,
                          }}
                        >
                          {a.cta} <ArrowRight size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDone((d) => ({ ...d, [a.titel]: !d[a.titel] }))}
                          className="inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                          style={{
                            ...headF,
                            background: "transparent",
                            color: isDone ? C.inkFaint : C.tealBright,
                            ["--tw-ring-color" as string]: C.teal,
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
              </Panel>
            </li>
          );
        })}
      </ol>

      {openCount === 0 && (
        <Panel className="flex flex-col items-center gap-2 p-10 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.bgDeep, border: `1px solid ${C.teal}44` }}
            aria-hidden="true"
          >
            <Anchor size={28} strokeWidth={2} style={{ color: C.tealBright }} />
          </span>
          <p className="text-[18px] font-bold" style={{ ...headF, color: C.ink }}>
            Alles vast
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Alles afgevinkt. We laten het weten zodra er iets nieuws binnenkomt.
          </p>
        </Panel>
      )}
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.tealBright, bg: C.tealBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.amberBright, bg: C.amberBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgDeep };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead
          title="Je facturen"
          sub="Degelijk overzicht van omzet en openstaand"
          Icon={Coins}
          tint={C.copper}
        />
        <button
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...headF,
            background: C.copper,
            color: C.bgDeep,
            ["--tw-ring-color" as string]: C.copperBright,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald deze maand", v: betaald, Icon: Check, tint: C.tealBright },
          { l: "Openstaand", v: `${open}`, Icon: Clock, tint: C.amberBright },
          { l: "Nog te factureren", v: "€ 1.350", Icon: Send, tint: C.copperBright },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[6px]"
                style={{ background: C.bgDeep, border: `1px solid ${s.tint}44` }}
                aria-hidden="true"
              >
                <s.Icon size={16} strokeWidth={2.2} style={{ color: s.tint }} />
              </span>
              <div
                className="text-[11.5px] font-medium uppercase tracking-[0.04em]"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                {s.l}
              </div>
            </div>
            <div
              className="mt-3 text-[25px] font-bold tabular-nums leading-none"
              style={{ ...monoF, color: C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[11px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...headF, color: C.inkFaint }}
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
                      className="px-5 py-4 text-[13.5px] font-bold tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ ...monoF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.04em]"
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...monoF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.copperBg, borderTop: `1px solid ${C.copper}44` }}>
                <td
                  colSpan={4}
                  className="px-5 py-4 text-[12px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...headF, color: C.copperBright }}
                >
                  Totaal betaald deze maand
                </td>
                <td
                  className="px-5 py-4 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...monoF, color: C.copperBright }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
