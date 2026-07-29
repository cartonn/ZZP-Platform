"use client";

// Concept 518 — "Stellage" · Structureel steiger-/scaffolding-raster, refined-brutalist. Het
// onderliggende grid is een design-element: blootgelegde hairline-lijnen, kruis-markers op de
// snijpunten, mono-labels als bouwtekening-annotaties. Strakke rechte hoeken (nul radius), hoog
// contrast zwart-op-wit met één industrieel accent: veiligheids-oranje. Swiss-grid met blootgelegde
// constructie — brutalist maar verfijnd en leesbaar. Status altijd met label + icoon, nooit kleur alleen.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Grid2x2,
  Hash,
  Layers,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  SquareStack,
  X,
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

// ————————————————————————————— Palet — beton-wit + veiligheids-oranje —————————————————————————————
const C = {
  paper: "#f6f6f4",
  panel: "#ffffff",
  sink: "#f0f0ec",
  line: "#d7d7d0",
  lineSoft: "#e6e6e0",
  ink: "#0b0b0c",
  inkSoft: "#38383a",
  inkMute: "#6b6b6d",
  inkFaint: "#9a9a9a",
  accent: "#ff4d00",
  accentDeep: "#d63f00",
  accentSoft: "#ffe9df",
  pos: "#0a7d46",
  posSoft: "#e2f2e9",
  info: "#0b5fb0",
  infoSoft: "#e2edf8",
  warn: "#a86800",
  warnSoft: "#f6ecd6",
  neg: "#c22030",
  negSoft: "#f7e2e4",
};

const mono: CSSProperties = {
  fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f4]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: Hash };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// ————————————————————————————— Bouwkundige primitives —————————————————————————————

// Kruis-marker op een raster-snijpunt (het steiger-motief)
function Cross({ className = "", tone = C.line }: { className?: string; tone?: string }) {
  return (
    <span className={`pointer-events-none absolute z-10 h-3 w-3 ${className}`} aria-hidden="true">
      <span
        className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2"
        style={{ background: tone }}
      />
      <span
        className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2"
        style={{ background: tone }}
      />
    </span>
  );
}

// Blootgelegd paneel: rechte hoeken, kruis-markers op elke hoek, mono-annotatie linksboven
function Bay({
  children,
  code,
  className = "",
  as: Tag = "div",
  accent = false,
}: {
  children: ReactNode;
  code?: string;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  accent?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{ background: C.panel, border: `1px solid ${accent ? C.accent : C.line}` }}
    >
      <Cross className="-left-1.5 -top-1.5" tone={accent ? C.accent : C.ink} />
      <Cross className="-right-1.5 -top-1.5" tone={accent ? C.accent : C.ink} />
      <Cross className="-bottom-1.5 -left-1.5" tone={accent ? C.accent : C.ink} />
      <Cross className="-bottom-1.5 -right-1.5" tone={accent ? C.accent : C.ink} />
      {code && (
        <span
          className="absolute -top-[9px] left-3 z-10 px-1 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ background: C.panel, color: accent ? C.accent : C.inkMute, ...mono }}
        >
          {code}
        </span>
      )}
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.06em] transition-all duration-150 ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.ink, color: "#fff", border: `1px solid ${C.ink}`, ...sans }
      : variant === "outline"
        ? { background: C.panel, color: C.ink, border: `1px solid ${C.ink}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:bg-[#ff4d00] hover:border-[#ff4d00]"
      : variant === "outline"
        ? "hover:bg-[#f0f0ec]"
        : "hover:bg-[#f0f0ec]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em]"
      style={{ color: base, background: soft, border: `1px solid ${base}`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als getrapte staafmeter — bouwkundig, geen ronde ring
function MatchBar({ value }: { value: number }) {
  const strong = value >= 90;
  const tone = strong ? C.pos : C.accent;
  const cells = 10;
  const filled = Math.round((value / 100) * cells);
  return (
    <span className="block" aria-label={`Match ${value} procent`}>
      <span className="flex items-baseline justify-between">
        <span
          className="text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint, ...mono }}
        >
          match
        </span>
        <span className="text-[13px] font-black leading-none" style={{ color: tone, ...mono }}>
          {value}%
        </span>
      </span>
      <span className="mt-1 flex gap-px" aria-hidden="true">
        {Array.from({ length: cells }).map((_, i) => (
          <span
            key={i}
            className="h-2 flex-1"
            style={{
              background: i < filled ? tone : C.lineSoft,
              border: `1px solid ${i < filled ? tone : C.line}`,
            }}
          />
        ))}
      </span>
    </span>
  );
}

function Anno({ children, tone = C.inkMute }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  code,
  title,
  sub,
  right,
}: {
  code: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div
      className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 pb-4"
      style={{ borderColor: C.ink }}
    >
      <div className="min-w-0">
        <Anno tone={C.accent}>
          <SquareStack size={12} aria-hidden="true" />
          {code}
        </Anno>
        <h1
          className="mt-2 text-[26px] font-black uppercase leading-[0.95] tracking-[-0.02em] md:text-[32px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Grid2x2,
  marktplaats: Search,
  opdracht: Layers,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};
const NAV_CODE: Record<ScreenKey, string> = {
  dashboard: "A0",
  marktplaats: "B1",
  opdracht: "B2",
  verificatie: "C3",
  acties: "D4",
  facturen: "E5",
  documenten: "F6",
  berichten: "G7",
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept518() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `${C.paper}`,
        backgroundImage: `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
      }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="st-fade px-4 pb-20 pt-6 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={() => setScreen("opdracht")}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onVerif={() => setScreen("verificatie")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes stFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .st-fade { animation: stFade 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .st-row { transition: background 0.14s ease; }
        .st-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) { .st-fade { animation: none !important; } .st-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{ background: C.panel, borderRight: `1px solid ${C.ink}` }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-5"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center"
          style={{ background: C.ink, color: "#fff" }}
          aria-hidden="true"
        >
          <SquareStack size={18} />
        </span>
        <span>
          <span
            className="block text-[14px] font-black uppercase tracking-[0.04em]"
            style={{ color: C.ink }}
          >
            Stellage
          </span>
          <span
            className="mt-0.5 block text-[9px] uppercase tracking-[0.2em]"
            style={{ color: C.accent, ...mono }}
          >
            constructie · zzp
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.22em]"
          style={{ color: C.inkFaint, ...mono }}
        >
          Secties
        </p>
        <ul className="space-y-px">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-bold uppercase tracking-[0.03em] transition-colors ${RING}`}
                  style={on ? { background: C.ink, color: "#fff" } : { color: C.inkSoft }}
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    style={{ color: on ? C.accent : C.inkFaint }}
                  />
                  <span className="flex-1">{s.label}</span>
                  <span
                    className="text-[9px]"
                    style={{ color: on ? C.accent : C.inkFaint, ...mono }}
                  >
                    {NAV_CODE[s.key]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="mb-3 p-3" style={{ background: C.sink, border: `1px solid ${C.line}` }}>
          <p
            className="text-[9px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.inkMute, ...mono }}
          >
            Dossier op orde
          </p>
          <p className="mt-1 text-[18px] font-black leading-none" style={{ color: C.ink, ...mono }}>
            {verified}/{CREDENTIALS.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center text-[11px] font-black"
            style={{ background: C.ink, color: "#fff", ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.05em]"
              style={{ color: C.pos }}
            >
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: `${C.paper}f2`,
        borderBottom: `1px solid ${C.ink}`,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2 px-3 py-2"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={14} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek in secties, opdrachten, documenten…
        </span>
        <span
          className="ml-auto hidden px-1.5 py-0.5 text-[10px] font-bold sm:inline"
          style={{ background: C.sink, color: C.inkMute, border: `1px solid ${C.line}`, ...mono }}
        >
          ⌘K
        </span>
      </div>
      <span
        className="hidden items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.04em] sm:inline-flex"
        style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}` }}
      >
        <Clock size={13} aria-hidden="true" />
        <span style={{ ...mono }}>{eur0.format(open)}</span> open
      </span>
    </header>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Schermen"
      className="flex gap-px overflow-x-auto px-4 py-2 md:hidden"
      style={{ borderBottom: `1px solid ${C.ink}`, background: C.panel }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-colors ${RING}`}
            style={
              on ? { background: C.ink, color: "#fff" } : { color: C.inkSoft, background: C.sink }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-8">
      <ScreenHead
        code="A0 · Dashboard"
        title={`Werkplaats — ${PROFIEL.naam.split(" ")[0]}`}
        sub="De constructie staat. Drie posten vragen om aandacht voordat je verder bouwt."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((k, i) => (
          <Bay key={k.label} code={`M${i + 1}`} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[26px] font-black leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className="text-[11px] font-bold"
                style={{ color: k.up ? C.pos : C.warn, ...mono }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
              <span className="inline-flex h-6 items-end gap-px" aria-hidden="true">
                {k.spark.map((d, j) => {
                  const max = Math.max(...k.spark);
                  const min = Math.min(...k.spark);
                  const h = 4 + ((d - min) / (max - min || 1)) * 18;
                  return (
                    <span
                      key={j}
                      className="w-1"
                      style={{
                        height: h,
                        background: j === k.spark.length - 1 ? C.accent : C.line,
                      }}
                    />
                  );
                })}
              </span>
            </div>
          </Bay>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Bay code="B1 · Aanbevolen posten" className="overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Anno tone={C.accent}>
              <Layers size={12} aria-hidden="true" /> Sterkste matches
            </Anno>
            <button
              type="button"
              onClick={onMarkt}
              className={`text-[11px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ color: C.accent }}
            >
              Alle posten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`st-row flex w-full items-center gap-3 px-4 py-3.5 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span className="w-24 shrink-0">
                    <MatchBar value={o.match} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span
                      className="block text-[13.5px] font-black"
                      style={{ color: C.ink, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-[0.1em]"
                      style={{ color: C.inkFaint, ...mono }}
                    >
                      p/uur
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Bay>

        <div className="space-y-6">
          <Bay code="C3 · Register" className="p-5">
            <Anno tone={C.pos}>
              <ShieldCheck size={12} aria-hidden="true" /> Vertrouwenssaldo
            </Anno>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[34px] font-black leading-none tracking-[-0.02em]"
                style={{ color: C.ink, ...mono }}
              >
                {ratio}%
              </span>
              <span className="text-[12px]" style={{ color: C.inkMute }}>
                dossier op orde
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-hidden="true">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2 flex-1"
                    style={{
                      background: c.status === "VERIFIED" ? C.pos : t.base,
                      border: `1px solid ${t.base}`,
                    }}
                  />
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd.
            </p>
          </Bay>

          <Bay code="D4 · Termijn" className="p-5" accent as="article">
            <Anno tone={C.accent}>
              <AlertTriangle size={12} aria-hidden="true" /> Termijn nadert
            </Anno>
            <h3 className="mt-2 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Bay>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match" ? b.match - a.match : parseEUR(b.tarief) - parseEUR(a.tarief),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <ScreenHead
        code="B1 · Marktplaats"
        title="Posten die passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} posten sluiten aan op je geverifieerde profiel.`}
      />

      <Bay code="Filter" className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2 px-3 py-2"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9a9a]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`flex h-5 w-5 items-center justify-center ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Match" : "Tarief"}
            </Btn>
          ))}
        </div>
      </Bay>

      {mode === "loading" ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Bay className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Bay>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.neg}
          titel="De markt kon niet laden"
          tekst="De posten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.accent}
          titel="Niets in deze sectie"
          tekst={`Geen post voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-4">
          {rows.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint, ...mono }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Bay className="flex flex-col items-center px-6 py-16 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center"
        style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p
        className="mt-4 text-[18px] font-black uppercase tracking-[0.02em]"
        style={{ color: C.ink }}
      >
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Bay>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.pos : C.accent;
  return (
    <Bay as="article" className="overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <span className="w-28 shrink-0 pt-0.5">
          <MatchBar value={opdracht.match} />
          <span
            className="mt-2 inline-block px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em]"
            style={{ color: "#fff", background: tone, ...mono }}
          >
            {strong ? "sterk" : "goed"}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden="true">·</span>
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[16.5px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[11px] font-bold"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-black" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint, ...mono }}
          >
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.04em] ${RING}`}
          style={{ color: C.accent }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.pos}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Bay>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone, ...mono }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.pos : C.accent;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-6">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Bay code="B2 · Opdracht" className="overflow-hidden">
        <div className="p-6">
          <div
            className="flex items-center gap-2 text-[11px]"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>{opdracht.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-black uppercase tracking-[0.1em]" style={{ color: tone }}>
              {strong ? "sterke match" : "goede match"} {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-2 max-w-2xl text-[26px] font-black uppercase leading-[1.02] tracking-[-0.02em] md:text-[30px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[11px] font-bold"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Btn variant="solid">
              Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.ink}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-black leading-none"
                style={{ color: C.ink, ...mono }}
              >
                {m.v}
              </p>
              <p
                className="mt-1 text-[10px] uppercase tracking-[0.06em]"
                style={{ color: C.inkFaint, ...mono }}
              >
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Bay>

      <Bay code="Motivering" className="p-6">
        <Anno tone={C.accent}>
          <ListChecks size={12} aria-hidden="true" /> Navolgbaar — geen verborgen score
        </Anno>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.pos, ...mono }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.pos }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.warn, ...mono }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Bay>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        code="C3 · Verificatie"
        title="Vertrouwensregister"
        sub={`${verified} van ${CREDENTIALS.length} certificaten geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <p
              className="text-[30px] font-black leading-none tracking-[-0.02em]"
              style={{ color: C.ink, ...mono }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...mono }}
            >
              op orde
            </p>
          </div>
        }
      />

      <Bay code="Telling" className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
            const t = credTone(st);
            const count = CREDENTIALS.filter((c) => c.status === st).length;
            return (
              <span key={st} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-black" style={{ color: t.base, ...mono }}>
                  {count}
                </span>
                <StatusTag {...t} />
              </span>
            );
          })}
        </div>
      </Bay>

      <Bay code="Dossier" className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${RING}`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center"
                    style={{ background: t.soft, color: t.base, border: `1px solid ${t.base}` }}
                    aria-hidden="true"
                  >
                    <t.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-4 pb-4 sm:pl-16"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 12 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Bay>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-6">
      <ScreenHead
        code="D4 · Acties"
        title="Wat aandacht vraagt"
        sub="Op volgorde van urgentie — werk van boven naar beneden."
      />
      <ol className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.accent : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Bay className="flex items-start gap-4 p-5" accent={warn}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-black"
                  style={{
                    background: warn ? tone : "transparent",
                    color: warn ? "#fff" : tone,
                    border: `1px solid ${tone}`,
                    ...mono,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Anno tone={tone}>
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Anno>
                  <h2
                    className="mt-1.5 text-[16px] font-bold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Bay>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const [sel, setSel] = useState<string>(FACTUREN[0]?.nr ?? "");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort((a, b) => parseEUR(b.bedrag) - parseEUR(a.bedrag));
  }, [sort]);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);

  const selected = FACTUREN.find((f) => f.nr === sel) ?? FACTUREN[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        code="E5 · Facturen"
        title="Grootboek"
        sub="Klik een regel voor de opbouw."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.pos, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.info,
            Icon: Hash,
          },
        ].map((s, i) => (
          <Bay key={s.l} code={`T${i + 1}`} className="p-4">
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...mono }}
              >
                {s.l}
              </p>
              <s.Icon size={13} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[22px] font-black leading-none"
              style={{ color: s.tone, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Bay>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Bay code="Regels" className="overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Anno tone={C.accent}>
              <Receipt size={12} aria-hidden="true" /> Grootboekregels
            </Anno>
            <div className="flex items-center gap-1.5" role="group" aria-label="Facturen sorteren">
              {(["datum", "bedrag"] as const).map((s) => (
                <Btn
                  key={s}
                  size="sm"
                  variant={sort === s ? "solid" : "outline"}
                  onClick={() => setSort(s)}
                >
                  {s === "datum" ? "Datum" : "Bedrag"}
                </Btn>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 480 }}>
              <caption className="sr-only">Overzicht van facturen</caption>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkMute, ...mono }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const t = factuurTone(f.status);
                  const on = f.nr === sel;
                  return (
                    <tr
                      key={f.nr}
                      className={`st-row cursor-pointer ${RING}`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => setSel(f.nr)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSel(f.nr);
                        }
                      }}
                      style={{
                        borderTop: `1px solid ${C.lineSoft}`,
                        background: on ? C.accentSoft : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px]"
                        style={{ color: on ? C.accentDeep : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[13px] font-black"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"
                          style={{ color: t.base }}
                        >
                          <t.Icon size={12} aria-hidden="true" /> {t.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Bay>

        {selected && <Opbouw factuur={selected} />}
      </div>
    </div>
  );
}

function Opbouw({ factuur }: { factuur: (typeof FACTUREN)[number] }) {
  const total = parseEUR(factuur.bedrag);
  const subtotal = Math.round(total / 1.21);
  const btw = total - subtotal;
  const t = factuurTone(factuur.status);
  return (
    <Bay code="Opbouw" as="article" className="overflow-hidden">
      <div className="p-5" style={{ background: C.sink, borderBottom: `1px solid ${C.line}` }}>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: C.inkMute, ...mono }}
        >
          Factuur
        </p>
        <p className="text-[17px] font-black" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[12.5px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} mono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold" style={{ color: t.base }}>
            <t.Icon size={12} aria-hidden="true" /> {t.label}
          </span>
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} mono />
        <Row label="Btw 21%" value={eur0.format(btw)} mono />
        <div className="my-3 h-0.5" style={{ background: C.ink }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[12px] font-black uppercase tracking-[0.12em]"
            style={{ color: C.ink, ...mono }}
          >
            Totaal
          </span>
          <span className="text-[20px] font-black" style={{ color: C.ink, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn variant="solid" size="sm" full>
            {factuur.status === "Concept"
              ? "Versturen"
              : factuur.status === "Openstaand"
                ? "Herinnering"
                : "Download"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn variant="outline" size="sm">
            PDF
          </Btn>
        </div>
      </div>
    </Bay>
  );
}

function Row({
  label,
  value,
  mono: isMono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="min-w-0 flex-1 self-end border-b border-dotted"
        style={{ borderColor: C.line }}
        aria-hidden="true"
      />
      <span
        className="shrink-0 text-right text-[12.5px] font-bold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
