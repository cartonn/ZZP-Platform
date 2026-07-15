"use client";

// Concept 324 — "Zephyr" · Quiet luxury / stille elegantie.
// Bijna monochroom warm grijs-taupe canvas met één ingetogen accent: diep inkt-blauw.
// Vertrouwen ontstaat hier niet uit drukte maar uit rust: haarlijnen in plaats van
// kaders, serif-koppen met gewicht, en veel witruimte — de taal van een private-bank
// dossier. Voor gevoelige documenten, verificatie en matching leest kalmte als zorg.
// Fonts: --font-lab-newsreader (koppen) + --font-lab-geist (tekst) + --font-lab-geist-mono (cijfers).

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Search,
  FileText,
  ShieldCheck,
  ListChecks,
  Receipt,
  Command,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  Clock,
  TriangleAlert,
  MapPin,
  CalendarDays,
  Banknote,
  Plus,
  Minus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  CircleAlert,
  RotateCw,
  CornerDownLeft,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ─── Palet ─────────────────────────────────────────────────────────────────
// Warm taupe-grijs canvas, tone-on-tone oppervlakken, één accent: diep inkt-blauw.
const C = {
  canvas: "#ecebe4", // warm grijs-taupe basis
  panel: "#f3f2ec", // iets lichter, tone-on-tone paneel
  rail: "#e6e4db", // navigatie-rail
  raised: "#f7f6f1", // subtiel verhoogd oppervlak
  ink: "#211f1a", // hoofdtekst (warm bijna-zwart)
  soft: "#4c4840", // secundaire tekst
  muted: "#615c53", // meta / body-muted (≥4.5:1 op canvas)
  faint: "#8f897d", // decoratief / hint
  hair: "rgba(33,31,26,0.12)", // haarlijn
  hairSoft: "rgba(33,31,26,0.07)",
  accent: "#1c2b4a", // diep inkt-blauw — het énige accent
  accentSoft: "#2a3a5c", // lichtere inkt-blauw
  accentWash: "rgba(28,43,74,0.07)",
  accentLine: "rgba(28,43,74,0.22)",
  // Statuskleuren — spaarzaam, altijd met label + icoon (nooit kleur alleen).
  ok: "#3f5a3a", // verificatie-groen (gedempt salie)
  okWash: "rgba(63,90,58,0.10)",
  warn: "#8a5a1e", // amber-oker
  warnWash: "rgba(138,90,30,0.10)",
  bad: "#8a3324", // gedempt terracotta-rood
  badWash: "rgba(138,51,36,0.10)",
};

const serif = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

// Gegarandeerd niet-lege eerste opdracht (noUncheckedIndexedAccess-veilig).
const FIRST_OPDRACHT: Opdracht = OPDRACHTEN[0] ?? {
  id: "—",
  titel: "Geen opdracht",
  opdrachtgever: "—",
  plaats: "—",
  tarief: "—",
  match: 0,
  uren: "—",
  start: "—",
  tags: [],
  redenen: { plus: [], min: [] },
};

const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Search,
  opdracht: FileText,
  verificatie: ShieldCheck,
  documenten: FileText,
  facturen: Receipt,
  berichten: FileText,
  acties: ListChecks,
};

// ─── Kleine helpers ─────────────────────────────────────────────────────────

function credMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  fg: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, fg: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.accent, wash: C.accentWash };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, wash: C.warnWash };
    case "REJECTED":
      return { label: "Afgewezen", Icon: CircleAlert, fg: C.bad, wash: C.badWash };
  }
}

// Bedrag "€ 2.480" → 2480 (deterministisch, zonder Date/Math.random).
function parseBedrag(b: string): number {
  const digits = b.replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function euro(n: number): string {
  return "€ " + n.toLocaleString("nl-NL");
}

// ─── Overline: haarlijn-label in kapitalen ───────────────────────────────────
function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2.5 text-[10.5px] font-medium uppercase tracking-[0.28em]"
      style={{ ...body, color: C.faint }}
    >
      <span className="h-px w-4" style={{ background: C.accentLine }} aria-hidden="true" />
      {children}
    </span>
  );
}

// ─── Statuschip: altijd label + icoon ────────────────────────────────────────
function StatusChip({
  label,
  Icon,
  fg,
  wash,
}: {
  label: string;
  Icon: LucideIcon;
  fg: string;
  wash: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ ...body, color: fg, background: wash, border: `1px solid ${fg}22` }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

// ─── Sparkline uit spark:number[] ────────────────────────────────────────────
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 78;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stroke = up ? C.accent : C.warn;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPath = `M0,${h} L${pts.join(" L")} L${w},${h} Z`;
  const last = data[data.length - 1] ?? min;
  const lastY = h - 2 - ((last - min) / range) * (h - 4);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-hidden="true"
      role="presentation"
    >
      <path d={areaPath} fill={stroke} opacity={0.07} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r={2} fill={stroke} />
    </svg>
  );
}

// ─── Ingetogen tekstknop met hover-underline ─────────────────────────────────
function QuietLink({
  children,
  onClick,
  Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  Icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        ...body,
        color: C.accent,
        ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
      }}
    >
      <span className="border-b border-transparent pb-px transition-colors group-hover:border-current">
        {children}
      </span>
      {Icon ? (
        <Icon
          size={13}
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5"
        />
      ) : null}
    </button>
  );
}

// ─── Primaire, ingetogen knop ────────────────────────────────────────────────
function InkButton({
  children,
  onClick,
  Icon,
  ghost = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  Icon?: LucideIcon;
  ghost?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        ...body,
        color: ghost ? C.accent : C.raised,
        background: ghost ? "transparent" : C.accent,
        border: `1px solid ${ghost ? C.accentLine : C.accent}`,
        ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
      }}
    >
      {Icon ? <Icon size={14} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

// ─── Skeleton-regel (loading-state) ──────────────────────────────────────────
function SkeletonLine({ w = "100%" }: { w?: string }) {
  return (
    <div
      className="h-3 animate-pulse rounded"
      style={{ width: w, background: C.hair }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
//  Hoofd-component
// ============================================================================

export function Concept324() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [loading, setLoading] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(FIRST_OPDRACHT.id);
  const [activeOpdracht, setActiveOpdracht] = useState<Opdracht>(FIRST_OPDRACHT);
  const [syncError, setSyncError] = useState(true);

  // Zachte overgang tussen schermen → toont skeleton (loading-state).
  function go(k: ScreenKey) {
    setPaletteOpen(false);
    if (k === screen) return;
    setLoading(true);
    setScreen(k);
    window.setTimeout(() => setLoading(false), 420);
  }

  function openOpdracht(o: Opdracht) {
    setActiveOpdracht(o);
    go("opdracht");
  }

  // Toetsenbord: ⌘K / Ctrl+K opent het commando-menu, Escape sluit.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const currentLabel = SCREENS.find((s) => s.key === screen)?.label ?? "Dashboard";

  return (
    <div className="min-h-[720px] w-full" style={{ ...body, background: C.canvas, color: C.ink }}>
      <div className="mx-auto flex min-h-[720px] max-w-[1240px] flex-col md:flex-row">
        {/* ── Zij-rail / navigatie ────────────────────────────────────────── */}
        <Rail profiel={PROFIEL} screen={screen} onGo={go} onPalette={() => setPaletteOpen(true)} />

        {/* ── Werkgebied ──────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          <TopBar
            label={currentLabel}
            onPalette={() => setPaletteOpen(true)}
            trust={PROFIEL.trust}
          />

          <div className="px-5 pb-16 pt-7 sm:px-8 lg:px-12">
            {loading ? (
              <LoadingView />
            ) : screen === "dashboard" ? (
              <Dashboard onGo={go} onOpen={openOpdracht} />
            ) : screen === "marktplaats" ? (
              <Marktplaats
                query={query}
                setQuery={setQuery}
                expanded={expanded}
                setExpanded={setExpanded}
                onOpen={openOpdracht}
              />
            ) : screen === "opdracht" ? (
              <OpdrachtDetail opdracht={activeOpdracht} onBack={() => go("marktplaats")} />
            ) : screen === "verificatie" ? (
              <Verificatie syncError={syncError} onDismiss={() => setSyncError(false)} />
            ) : screen === "acties" ? (
              <Acties />
            ) : (
              <Facturen />
            )}
          </div>
        </main>
      </div>

      {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} onGo={go} /> : null}
    </div>
  );
}

// ─── Zij-rail ────────────────────────────────────────────────────────────────
function Rail({
  profiel,
  screen,
  onGo,
  onPalette,
}: {
  profiel: typeof PROFIEL;
  screen: ScreenKey;
  onGo: (k: ScreenKey) => void;
  onPalette: () => void;
}) {
  return (
    <aside
      className="shrink-0 md:w-[236px] md:border-r"
      style={{ background: C.rail, borderColor: C.hair }}
    >
      <div className="flex h-full flex-col">
        {/* Merk */}
        <div
          className="flex items-center gap-2.5 px-5 py-5 md:px-6"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-sm text-[13px] font-semibold"
            style={{ ...serif, background: C.accent, color: C.raised }}
            aria-hidden="true"
          >
            Z
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight" style={serif}>
              Zephyr
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: C.faint }}>
              Zorgplatform
            </div>
          </div>
        </div>

        {/* Navigatie */}
        <nav
          className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:gap-0.5 md:overflow-visible md:px-3 md:py-5"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const Icon = SCREEN_ICON[s.key];
            const active = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onGo(s.key)}
                aria-current={active ? "page" : undefined}
                className="group relative flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...body,
                  color: active ? C.accent : C.soft,
                  background: active ? C.accentWash : "transparent",
                  fontWeight: active ? 600 : 500,
                  ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
                }}
              >
                {active ? (
                  <span
                    className="absolute -left-3 top-1/2 hidden h-4 w-0.5 -translate-y-1/2 rounded-full md:block"
                    style={{ background: C.accent }}
                    aria-hidden="true"
                  />
                ) : null}
                <Icon size={16} aria-hidden="true" style={{ opacity: active ? 1 : 0.75 }} />
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden md:block">
          {/* Commando-hint */}
          <button
            type="button"
            onClick={onPalette}
            className="mx-3 mb-3 flex w-[calc(100%-1.5rem)] items-center justify-between rounded-md px-3 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...body,
              color: C.muted,
              border: `1px solid ${C.hair}`,
              ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
            }}
          >
            <span className="flex items-center gap-2">
              <Command size={13} aria-hidden="true" />
              Snel navigeren
            </span>
            <kbd
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                ...mono,
                background: C.canvas,
                color: C.faint,
                border: `1px solid ${C.hairSoft}`,
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Profiel */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ borderTop: `1px solid ${C.hairSoft}` }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold"
              style={{ background: C.accent, color: C.raised, ...body }}
              aria-hidden="true"
            >
              {profiel.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-semibold">{profiel.naam}</div>
              <div className="truncate text-[11px]" style={{ color: C.muted }}>
                {profiel.plaats}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Bovenbalk ───────────────────────────────────────────────────────────────
function TopBar({
  label,
  onPalette,
  trust,
}: {
  label: string;
  onPalette: () => void;
  trust: string;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-4 backdrop-blur-sm sm:px-8 lg:px-12"
      style={{
        background: "rgba(236,235,228,0.82)",
        borderBottom: `1px solid ${C.hair}`,
      }}
    >
      <div className="min-w-0">
        <Overline>ZZP-werkruimte</Overline>
        <h1
          className="mt-1 text-[22px] font-semibold leading-none tracking-tight sm:text-[26px]"
          style={serif}
        >
          {label}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium sm:inline-flex"
          style={{ ...body, color: C.ok, background: C.okWash, border: `1px solid ${C.ok}22` }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {trust}
        </span>
        <button
          type="button"
          onClick={onPalette}
          aria-label="Snel navigeren openen"
          className="grid h-9 w-9 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:hidden"
          style={{
            color: C.soft,
            border: `1px solid ${C.hair}`,
            ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
          }}
        >
          <Command size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

// ─── Sectiekop ───────────────────────────────────────────────────────────────
function SectionHead({
  overline,
  title,
  action,
}: {
  overline: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <Overline>{overline}</Overline>
        <h2 className="mt-1.5 text-[19px] font-semibold tracking-tight" style={serif}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

// ─── Loading-view (skeleton) ─────────────────────────────────────────────────
function LoadingView() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Scherm laden…</span>
      <div className="grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: C.hair }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-5" style={{ background: C.canvas }}>
            <SkeletonLine w="60%" />
            <SkeletonLine w="40%" />
            <SkeletonLine w="80%" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 py-4" style={{ borderTop: `1px solid ${C.hairSoft}` }}>
            <SkeletonLine w="45%" />
            <SkeletonLine w="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
//  Scherm 1 — Dashboard
// ============================================================================
function Dashboard({
  onGo,
  onOpen,
}: {
  onGo: (k: ScreenKey) => void;
  onOpen: (o: Opdracht) => void;
}) {
  return (
    <div className="space-y-11">
      {/* Kerncijfers met sparklines */}
      <section>
        <SectionHead overline="Vandaag" title="Kerncijfers" />
        <div
          className="grid grid-cols-2 gap-px lg:grid-cols-4"
          style={{ background: C.hair, border: `1px solid ${C.hair}` }}
        >
          {KPIS.map((k) => {
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <div
                key={k.label}
                className="group flex flex-col gap-3 p-5 transition-colors"
                style={{ background: C.canvas }}
              >
                <div className="text-[11.5px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div
                    className="text-[27px] font-semibold leading-none tracking-tight"
                    style={serif}
                  >
                    {k.value}
                  </div>
                  <Sparkline data={k.spark} up={k.up} />
                </div>
                <div
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  <Trend size={12} aria-hidden="true" />
                  {k.trend}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-11 lg:grid-cols-[1.4fr_1fr]">
        {/* Volgende acties */}
        <section>
          <SectionHead
            overline="Volgende beste actie"
            title="Wat vraagt nu je aandacht"
            action={
              <QuietLink Icon={ArrowRight} onClick={() => onGo("acties")}>
                Alle acties
              </QuietLink>
            }
          />
          <ul
            className="divide-y"
            style={{
              borderTop: `1px solid ${C.hair}`,
              borderBottom: `1px solid ${C.hair}`,
              borderColor: C.hairSoft,
            }}
          >
            {ACTIES.map((a) => {
              const warn = a.urgentie === "warning";
              return (
                <li key={a.titel} className="flex items-start gap-4 py-4">
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full"
                    style={{
                      color: warn ? C.warn : C.accent,
                      background: warn ? C.warnWash : C.accentWash,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold">{a.titel}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                        style={{
                          color: warn ? C.warn : C.muted,
                          background: warn ? C.warnWash : C.hairSoft,
                        }}
                      >
                        {warn ? "Urgent" : "Info"}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.muted }}>
                      {a.detail}
                    </p>
                  </div>
                  <div className="hidden shrink-0 self-center sm:block">
                    <QuietLink Icon={ArrowRight}>{a.cta}</QuietLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Aanbevolen opdracht + vertrouwen */}
        <section className="space-y-8">
          <div>
            <SectionHead
              overline="Beste match"
              title="Voor jou uitgelicht"
              action={
                <QuietLink Icon={ArrowRight} onClick={() => onGo("marktplaats")}>
                  Marktplaats
                </QuietLink>
              }
            />
            {OPDRACHTEN.slice(0, 1).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => onOpen(o)}
                className="group block w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  border: `1px solid ${C.hair}`,
                  background: C.raised,
                  ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
                }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-semibold leading-snug" style={serif}>
                        {o.titel}
                      </div>
                      <div className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </div>
                    </div>
                    <MatchDial value={o.match} />
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-[12px]">
                    <Meta Icon={Banknote} label="Tarief" value={o.tarief} />
                    <Meta Icon={Clock} label="Inzet" value={o.uren} />
                    <Meta Icon={CalendarDays} label="Start" value={o.start} />
                  </dl>
                </div>
              </button>
            ))}
          </div>

          {/* Vertrouwensniveau */}
          <div style={{ borderTop: `1px solid ${C.hair}` }} className="pt-6">
            <Overline>Vertrouwensniveau</Overline>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-full"
                style={{ background: C.okWash, color: C.ok }}
                aria-hidden="true"
              >
                <ShieldCheck size={18} />
              </span>
              <div>
                <div className="text-[15px] font-semibold" style={serif}>
                  {PROFIEL.trust}
                </div>
                <div className="text-[12px]" style={{ color: C.muted }}>
                  3 van 4 documenten geverifieerd
                </div>
              </div>
            </div>
            <div
              className="mt-4 h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: C.hair }}
              role="progressbar"
              aria-valuenow={75}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Verificatievoortgang"
            >
              <div className="h-full rounded-full" style={{ width: "75%", background: C.accent }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <dt
        className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide"
        style={{ color: C.faint }}
      >
        <Icon size={12} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-[13px] font-medium" style={{ color: C.ink }}>
        {value}
      </dd>
    </div>
  );
}

// Ronde match-indicator (serif-cijfer + haarlijn-ring).
function MatchDial({ value }: { value: number }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center">
      <svg
        width={44}
        height={44}
        viewBox="0 0 44 44"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle cx={22} cy={22} r={r} fill="none" stroke={C.hair} strokeWidth={2.5} />
        <circle
          cx={22}
          cy={22}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span className="text-[13px] font-semibold" style={{ ...mono, color: C.accent }}>
        {value}
      </span>
      <span className="sr-only">{value} procent match</span>
    </div>
  );
}

// ============================================================================
//  Scherm 2 — Marktplaats
// ============================================================================
function Marktplaats({
  query,
  setQuery,
  expanded,
  setExpanded,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OPDRACHTEN;
    return OPDRACHTEN.filter((o) =>
      [o.titel, o.opdrachtgever, o.plaats, ...o.tags].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Zoek */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: C.faint }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op functie, plaats of certificaat…"
            className="w-full rounded-md py-2.5 pl-9 pr-3 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              ...body,
              background: C.raised,
              color: C.ink,
              border: `1px solid ${C.hair}`,
              ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
            }}
            aria-label="Zoek opdrachten"
          />
        </label>
        <span className="text-[12px]" style={{ color: C.muted }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState query={query} onClear={() => setQuery("")} />
      ) : (
        <ul style={{ borderTop: `1px solid ${C.hair}` }}>
          {filtered.map((o) => {
            const open = expanded === o.id;
            return (
              <li key={o.id} style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
                <div className="flex items-start gap-4 py-5">
                  <MatchDial value={o.match} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpen(o)}
                      className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties) }}
                    >
                      <span
                        className="text-[16px] font-semibold leading-snug transition-colors group-hover:underline"
                        style={serif}
                      >
                        {o.titel}
                      </span>
                    </button>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      <span>{o.opdrachtgever}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} aria-hidden="true" />
                        {o.plaats}
                      </span>
                      <span>{o.tarief}</span>
                      <span>{o.uren}</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[11px]"
                          style={{
                            color: C.soft,
                            border: `1px solid ${C.hair}`,
                            background: C.panel,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : o.id)}
                        aria-expanded={open}
                        className="inline-flex items-center gap-1.5 rounded-sm text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...body,
                          color: C.accent,
                          ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
                        }}
                      >
                        {open ? (
                          <Minus size={13} aria-hidden="true" />
                        ) : (
                          <Plus size={13} aria-hidden="true" />
                        )}
                        Waarom deze match?
                      </button>

                      {open ? <Reasons redenen={o.redenen} /> : null}
                    </div>
                  </div>
                  <div className="hidden shrink-0 self-center sm:block">
                    <InkButton ghost Icon={ArrowRight} onClick={() => onOpen(o)}>
                      Bekijk
                    </InkButton>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Reasons({ redenen }: { redenen: Opdracht["redenen"] }) {
  return (
    <div
      className="mt-3 grid gap-4 sm:grid-cols-2"
      style={{ borderTop: `1px solid ${C.hairSoft}`, paddingTop: 12 }}
    >
      <div>
        <div
          className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide"
          style={{ color: C.ok }}
        >
          <Check size={12} aria-hidden="true" />
          Pluspunten
        </div>
        <ul className="space-y-1.5">
          {redenen.plus.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.soft }}>
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                style={{ background: C.ok }}
                aria-hidden="true"
              />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div
          className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide"
          style={{ color: C.warn }}
        >
          <TriangleAlert size={12} aria-hidden="true" />
          Aandachtspunten
        </div>
        <ul className="space-y-1.5">
          {redenen.min.map((m) => (
            <li key={m} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.soft }}>
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                style={{ background: C.warn }}
                aria-hidden="true"
              />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ border: `1px dashed ${C.hair}` }}
    >
      <span
        className="grid h-11 w-11 place-items-center rounded-full"
        style={{ background: C.panel, color: C.faint }}
        aria-hidden="true"
      >
        <Search size={18} />
      </span>
      <h3 className="mt-4 text-[16px] font-semibold" style={serif}>
        Geen opdrachten gevonden
      </h3>
      <p className="mt-1.5 max-w-xs text-[13px]" style={{ color: C.muted }}>
        Er zijn geen resultaten voor “{query}”. Pas je zoekterm aan of bekijk alle opdrachten.
      </p>
      <div className="mt-5">
        <InkButton ghost onClick={onClear}>
          Zoekopdracht wissen
        </InkButton>
      </div>
    </div>
  );
}

// ============================================================================
//  Scherm 3 — Opdracht (detail)
// ============================================================================
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="max-w-3xl space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...body,
          color: C.muted,
          ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Terug naar marktplaats
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Overline>{opdracht.id}</Overline>
          <h2 className="mt-2 text-[27px] font-semibold leading-tight tracking-tight" style={serif}>
            {opdracht.titel}
          </h2>
          <div
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"
            style={{ color: C.muted }}
          >
            <span>{opdracht.opdrachtgever}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              {opdracht.plaats}
            </span>
          </div>
        </div>
        <MatchDial value={opdracht.match} />
      </div>

      {/* Kerngegevens — haarlijn-raster, geen kaders */}
      <dl
        className="grid grid-cols-3 gap-px"
        style={{ background: C.hair, border: `1px solid ${C.hair}` }}
      >
        <BigMeta Icon={Banknote} label="Tarief" value={opdracht.tarief} />
        <BigMeta Icon={Clock} label="Inzet" value={opdracht.uren} />
        <BigMeta Icon={CalendarDays} label="Startdatum" value={opdracht.start} />
      </dl>

      {/* Verklaarbare matching */}
      <section>
        <SectionHead overline="Verklaarbare matching" title="Waarom dit past" />
        <Reasons redenen={opdracht.redenen} />
      </section>

      {/* Compliance-vereiste */}
      <section style={{ borderTop: `1px solid ${C.hair}` }} className="pt-6">
        <Overline>Compliance-vereiste</Overline>
        <div
          className="mt-3 flex items-start gap-3 p-4"
          style={{ background: C.okWash, border: `1px solid ${C.ok}22` }}
        >
          <ShieldCheck
            size={18}
            aria-hidden="true"
            style={{ color: C.ok }}
            className="mt-0.5 shrink-0"
          />
          <div>
            <div className="text-[13.5px] font-semibold">Vereist certificaat aanwezig</div>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: C.soft }}>
              Deze opdracht vereist een geverifieerde{" "}
              <span className="font-medium" style={{ color: C.ink }}>
                BIG-registratie
              </span>
              . Jouw registratie is geverifieerd en geldig — je voldoet aan de eis.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <InkButton Icon={CornerDownLeft}>Direct reageren</InkButton>
        <InkButton ghost>Later bewaren</InkButton>
      </div>
    </div>
  );
}

function BigMeta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="p-4" style={{ background: C.canvas }}>
      <dt
        className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide"
        style={{ color: C.faint }}
      >
        <Icon size={12} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1.5 text-[16px] font-semibold" style={serif}>
        {value}
      </dd>
    </div>
  );
}

// ============================================================================
//  Scherm 4 — Verificatie
// ============================================================================
function Verificatie({ syncError, onDismiss }: { syncError: boolean; onDismiss: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="max-w-3xl space-y-6">
      <SectionHead
        overline={`${verified} van ${CREDENTIALS.length} geverifieerd`}
        title="Certificaten & documenten"
        action={
          <InkButton ghost Icon={Plus}>
            Document toevoegen
          </InkButton>
        }
      />

      {/* Foutbanner (error-state) — dismissible */}
      {syncError ? (
        <div
          role="alert"
          className="flex items-start gap-3 px-4 py-3"
          style={{ background: C.badWash, border: `1px solid ${C.bad}22` }}
        >
          <CircleAlert
            size={16}
            aria-hidden="true"
            style={{ color: C.bad }}
            className="mt-0.5 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ color: C.bad }}>
              Verificatiestatus van 1 document kon niet worden opgehaald
            </div>
            <p className="mt-0.5 text-[12px]" style={{ color: C.soft }}>
              De koppeling met het register reageerde niet. Probeer het opnieuw of controleer later.
            </p>
          </div>
          <button
            type="button"
            className="mr-1 inline-flex items-center gap-1 rounded-sm text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.bad,
              ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
            }}
          >
            <RotateCw size={12} aria-hidden="true" />
            Opnieuw
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Melding sluiten"
            className="rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              color: C.muted,
              ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <ul style={{ borderTop: `1px solid ${C.hair}` }}>
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const needsAction = c.status === "EXPIRING" || c.status === "REJECTED";
          return (
            <li
              key={c.naam}
              className="flex flex-wrap items-center gap-3 py-4"
              style={{ borderBottom: `1px solid ${C.hairSoft}` }}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-sm"
                style={{ background: C.panel, color: m.fg }}
                aria-hidden="true"
              >
                <m.Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">{c.naam}</div>
                <div className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </div>
              </div>
              <StatusChip label={m.label} Icon={m.Icon} fg={m.fg} wash={m.wash} />
              {needsAction ? (
                <QuietLink Icon={ArrowUpRight}>
                  {c.status === "EXPIRING" ? "Vernieuwen" : "Opnieuw indienen"}
                </QuietLink>
              ) : (
                <span
                  className="w-[92px] shrink-0 text-right text-[11px]"
                  style={{ color: C.faint }}
                >
                  Geen actie nodig
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
        Documenten zijn standaard privé. Alleen opdrachtgevers waarmee je een gesprek voert zien je
        verificatiestatus — nooit het onderliggende bestand.
      </p>
    </div>
  );
}

// ============================================================================
//  Scherm 5 — Acties
// ============================================================================
function Acties() {
  return (
    <div className="max-w-3xl space-y-6">
      <SectionHead overline="Next-action-engine" title="Aanbevolen stappen" />
      <ol className="space-y-px" style={{ background: C.hair, border: `1px solid ${C.hair}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="flex flex-wrap items-start gap-4 p-5"
              style={{ background: C.canvas }}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold"
                style={{ ...mono, background: C.panel, color: C.accent }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold" style={serif}>
                    {a.titel}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{
                      color: warn ? C.warn : C.accent,
                      background: warn ? C.warnWash : C.accentWash,
                    }}
                  >
                    {warn ? (
                      <TriangleAlert size={10} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={10} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <div className="shrink-0 self-center">
                <InkButton ghost={!warn} Icon={ArrowRight}>
                  {a.cta}
                </InkButton>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ============================================================================
//  Scherm 6 — Facturen
// ============================================================================
function statusMetaFactuur(s: string): { fg: string; wash: string; Icon: LucideIcon } {
  if (s === "Betaald") return { fg: C.ok, wash: C.okWash, Icon: Check };
  if (s === "Openstaand") return { fg: C.warn, wash: C.warnWash, Icon: Clock };
  return { fg: C.muted, wash: C.hairSoft, Icon: FileText }; // Concept
}

function Facturen() {
  const totals = useMemo(() => {
    let betaald = 0;
    let openstaand = 0;
    for (const f of FACTUREN) {
      const n = parseBedrag(f.bedrag);
      if (f.status === "Betaald") betaald += n;
      else if (f.status === "Openstaand") openstaand += n;
    }
    return { betaald, openstaand };
  }, []);

  return (
    <div className="space-y-7">
      <SectionHead
        overline="Facturatie"
        title="Facturen"
        action={
          <InkButton ghost Icon={Plus}>
            Nieuwe factuur
          </InkButton>
        }
      />

      {/* Totalen */}
      <div
        className="grid grid-cols-2 gap-px sm:grid-cols-3"
        style={{ background: C.hair, border: `1px solid ${C.hair}` }}
      >
        <TotalTile label="Ontvangen" value={euro(totals.betaald)} fg={C.ok} />
        <TotalTile label="Openstaand" value={euro(totals.openstaand)} fg={C.warn} />
        <TotalTile
          label="Facturen"
          value={String(FACTUREN.length)}
          fg={C.accent}
          className="hidden sm:block"
        />
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hair}` }}>
              {["Factuur", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`py-2.5 text-[10.5px] font-medium uppercase tracking-wide ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.faint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const m = statusMetaFactuur(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-black/[0.015]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td
                    className="py-3.5 pr-4 text-[12.5px] font-medium"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="py-3.5 pr-4 text-[13px]">{f.klant}</td>
                  <td className="py-3.5 pr-4 text-[12.5px]" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ color: m.fg, background: m.wash, border: `1px solid ${m.fg}22` }}
                    >
                      <m.Icon size={11} aria-hidden="true" />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="py-3.5 text-right text-[13px] font-semibold"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1.5px solid ${C.hair}` }}>
              <td colSpan={4} className="py-3 text-[12px] font-medium" style={{ color: C.muted }}>
                Totaal ontvangen + openstaand
              </td>
              <td
                className="py-3 text-right text-[13.5px] font-semibold"
                style={{ ...mono, color: C.accent }}
              >
                {euro(totals.betaald + totals.openstaand)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function TotalTile({
  label,
  value,
  fg,
  className = "",
}: {
  label: string;
  value: string;
  fg: string;
  className?: string;
}) {
  return (
    <div className={`p-5 ${className}`} style={{ background: C.canvas }}>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: C.faint }}>
        {label}
      </div>
      <div
        className="mt-2 text-[22px] font-semibold tracking-tight"
        style={{ ...serif, color: fg }}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================================
//  Commando-menu (interactie) — ⌘K
// ============================================================================
function CommandPalette({ onClose, onGo }: { onClose: () => void; onGo: (k: ScreenKey) => void }) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
      style={{ background: "rgba(33,31,26,0.34)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg"
        style={{
          background: C.raised,
          border: `1px solid ${C.hair}`,
          boxShadow: "0 24px 60px -24px rgba(28,43,74,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Snel navigeren"
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: `1px solid ${C.hairSoft}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ga naar scherm…"
            className="w-full bg-transparent text-[14px] focus:outline-none"
            style={{ ...body, color: C.ink }}
            aria-label="Zoek een scherm"
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ ...mono, color: C.faint, border: `1px solid ${C.hairSoft}` }}
          >
            esc
          </kbd>
        </div>

        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px]" style={{ color: C.muted }}>
              Geen scherm gevonden voor “{q}”.
            </li>
          ) : (
            results.map((s) => {
              const Icon = SCREEN_ICON[s.key];
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onGo(s.key);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      ...body,
                      color: C.soft,
                      ...({ "--tw-ring-color": C.accentLine } as React.CSSProperties),
                    }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: C.accent }} />
                    <span className="flex-1 font-medium">{s.label}</span>
                    <CornerDownLeft size={13} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div
          className="flex items-center justify-between px-4 py-2.5 text-[11px]"
          style={{ borderTop: `1px solid ${C.hairSoft}`, color: C.faint }}
        >
          <span>Zephyr · snel navigeren</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft size={11} aria-hidden="true" /> om te openen
          </span>
        </div>
      </div>
    </div>
  );
}
