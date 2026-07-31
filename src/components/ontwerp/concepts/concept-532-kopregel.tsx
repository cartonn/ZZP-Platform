"use client";

// Concept 532 — "Kopregel" · Type-als-interface. Oversized koppen dragen de navigatie; typografie
// groeit voor prioriteit en krimpt bij hoge dichtheid. Schermtitels zijn grote type-ankers,
// data staat in mono-cijfers. Redactioneel-technisch: strak zwart-op-licht met één accent.
// Status wordt altijd getoond met label + icoon.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Dot,
  FileText,
  Hourglass,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
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

// ————————————————————————————— Palet — redactioneel, zwart-op-licht + één accent —————————————————————————————
const C = {
  bg: "#fbfbf9",
  paper: "#ffffff",
  sink: "#f4f3ef",
  sink2: "#eceae4",
  line: "#e4e2db",
  lineStrong: "#d3d0c7",
  ink: "#111110",
  inkSoft: "#38362f",
  inkMute: "#75726a",
  inkFaint: "#a6a29a",
  accent: "#d6432b", // één signaalkleur — vermiljoen
  accentSoft: "#fbe6e0",
  accentDeep: "#a12e1a",
  ok: "#2f6b3d",
  okSoft: "#e2efe3",
  warn: "#8a5a10",
  warnSoft: "#f6ebd4",
};

// Variabele-gewicht typografie-schaal. Groot = prioriteit, klein = dichtheid.
const serif: CSSProperties = {
  fontFamily: "'Times New Roman', Georgia, 'Iowan Old Style', 'Palatino', serif",
};
const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111110] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbf9]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { fg: string; bg: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { fg: C.ok, bg: C.okSoft, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { fg: C.inkSoft, bg: C.sink2, label: "In beoordeling", Icon: Hourglass, alarm: false };
    case "EXPIRING":
      return {
        fg: C.warn,
        bg: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { fg: C.accent, bg: C.accentSoft, label: "Afgekeurd", Icon: ShieldX, alarm: true };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald")
    return { fg: C.ok, bg: C.okSoft, label: "Betaald", Icon: Check, alarm: false };
  if (status === "Openstaand")
    return { fg: C.warn, bg: C.warnSoft, label: "Openstaand", Icon: Clock, alarm: false };
  return { fg: C.inkSoft, bg: C.sink2, label: "Concept", Icon: FileText, alarm: false };
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

// —————————————————————————————————————— Primitives ——————————————————————————————————————
function Panel({
  children,
  className = "",
  as: Tag = "div",
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  bare?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: bare ? "transparent" : C.paper,
        border: bare ? "none" : `1px solid ${C.line}`,
      }}
    >
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
  variant?: "solid" | "outline" | "accent" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12px]" : "px-5 py-3 text-[13px]";
  const base = `inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.06em] transition-all duration-150 active:translate-y-px ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }
      : variant === "accent"
        ? { background: C.accent, color: C.paper, border: `1px solid ${C.accentDeep}` }
        : variant === "outline"
          ? { background: C.paper, color: C.ink, border: `1px solid ${C.lineStrong}` }
          : { background: "transparent", color: C.inkSoft, border: "1px solid transparent" };
  const hover =
    variant === "solid" || variant === "accent" ? "hover:brightness-110" : "hover:bg-[#f4f3ef]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={{ ...sans, ...style }}
    >
      {children}
    </button>
  );
}

function StatusChip({ fg, bg, label, Icon, alarm, size = "md" }: Tone & { size?: "sm" | "md" }) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.06em] ${pad}`}
      style={{ color: fg, background: bg, border: `1px solid ${fg}33`, ...sans }}
    >
      <Icon size={size === "sm" ? 11 : 12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (actie vereist)</span>}
    </span>
  );
}

// Oversized eyebrow + label — kopregel-taal
function Eyebrow({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"
      style={{ color: accent ? C.accent : C.inkMute, ...sans }}
    >
      {children}
    </span>
  );
}

function Spark({ data, tone = C.ink }: { data: number[]; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return (
    <span className="inline-flex h-6 items-end gap-[2px]" aria-hidden="true">
      {data.map((d, j) => {
        const h = 3 + ((d - min) / (max - min || 1)) * 18;
        const last = j === data.length - 1;
        return (
          <span
            key={j}
            className="w-[3px]"
            style={{ height: h, background: last ? tone : `${tone}30` }}
          />
        );
      })}
    </span>
  );
}

// Groot type-anker als schermtitel
function TitleAnchor({
  index,
  eyebrow,
  title,
  sub,
  right,
}: {
  index: string;
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8" style={{ borderBottom: `2px solid ${C.ink}` }}>
      <div className="flex items-end justify-between gap-4 pb-1">
        <Eyebrow>
          <span style={{ ...mono }}>{index}</span>
          <span className="h-px w-8" style={{ background: C.lineStrong }} aria-hidden="true" />
          {eyebrow}
        </Eyebrow>
        {right && <div className="hidden pb-2 sm:block">{right}</div>}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <h1
          className="max-w-3xl text-[40px] font-black leading-[0.95] tracking-[-0.035em] sm:text-[52px] md:text-[64px]"
          style={{ color: C.ink, ...sans }}
        >
          {title}
        </h1>
      </div>
      {sub && (
        <p
          className="max-w-2xl pb-4 text-[15px] leading-relaxed"
          style={{ color: C.inkMute, ...serif }}
        >
          {sub}
        </p>
      )}
      {right && <div className="pb-4 sm:hidden">{right}</div>}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept532() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.bg }}
    >
      <Masthead screen={screen} setScreen={setScreen} />
      <main key={screen} className="kr-enter mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 md:px-8">
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

      <style>{`
        @keyframes krEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .kr-enter { animation: krEnter 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .kr-row { transition: background 0.16s ease; }
        .kr-row:hover { background: ${C.sink}; }
        .kr-nav { transition: color 0.16s ease; }
        @media (prefers-reduced-motion: reduce) { .kr-enter { animation: none !important; } .kr-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Masthead / nav ——————————————————————————————————————
const NAV_NR: Record<ScreenKey, string> = {
  dashboard: "01",
  marktplaats: "02",
  opdracht: "03",
  verificatie: "04",
  acties: "05",
  facturen: "06",
  documenten: "07",
  berichten: "08",
};

function Masthead({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (a, f) => a + parseEUR(f.bedrag),
    0,
  );
  return (
    <header
      className="sticky top-0 z-20"
      style={{
        background: `${C.bg}f2`,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center"
            style={{ background: C.ink, color: C.paper }}
            aria-hidden="true"
          >
            <span className="text-[15px] font-black leading-none">K</span>
          </span>
          <div className="leading-none">
            <span
              className="block text-[15px] font-black tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              KOPREGEL
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.24em]"
              style={{ color: C.inkFaint }}
            >
              ZZP-editie
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-2 px-3 py-1.5 text-[12px] font-bold sm:inline-flex"
            style={{ background: C.warnSoft, color: C.warn, border: `1px solid ${C.warn}33` }}
          >
            <Clock size={13} aria-hidden="true" />
            <span style={{ ...mono }}>{eur0.format(open)}</span> open
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center text-[11px] font-black"
            style={{ background: C.sink, color: C.ink, border: `1px solid ${C.line}`, ...mono }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <nav aria-label="Schermen" className="mx-auto max-w-5xl overflow-x-auto px-4 sm:px-6 md:px-8">
        <ul className="flex gap-1" style={{ borderTop: `1px solid ${C.line}` }}>
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`kr-nav group relative flex items-baseline gap-1.5 whitespace-nowrap px-3 py-3 text-[13px] font-bold uppercase tracking-[0.04em] ${RING}`}
                  style={{ color: on ? C.ink : C.inkFaint }}
                >
                  <span
                    className="text-[9px]"
                    style={{ ...mono, color: on ? C.accent : C.inkFaint }}
                  >
                    {NAV_NR[s.key]}
                  </span>
                  {s.label}
                  {on && (
                    <span
                      className="absolute inset-x-0 -bottom-px h-[3px]"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
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
    <div>
      <TitleAnchor
        index="01"
        eyebrow="Overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Je werkweek in koppen. Wat groot staat vraagt aandacht; de rest is context. Drie punten hieronder verdienen vandaag je tijd."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onVerif}>
              Certificaten
            </Btn>
            <Btn variant="accent" size="sm" onClick={onActies}>
              Acties <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      {/* KPI — grote mono-cijfers als data-ankers */}
      <section
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ border: `1px solid ${C.line}` }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="p-5"
            style={{
              borderRight: i % 2 === 0 ? `1px solid ${C.line}` : "none",
              borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              ...(i < 3 ? { borderRight: `1px solid ${C.line}` } : {}),
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[34px] font-black leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {k.value}
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 text-[12px] font-bold"
                style={{ color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={13} aria-hidden="true" />
                ) : (
                  <Minus size={13} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Spark data={k.spark} tone={C.accent} />
            </div>
          </div>
        ))}
      </section>

      {/* Marktplaats + zijkolom */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.7fr_1fr]">
        <section>
          <div
            className="mb-3 flex items-baseline justify-between"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 className="pb-2 text-[22px] font-black tracking-[-0.02em]" style={{ color: C.ink }}>
              Beste matches
            </h2>
            <button
              type="button"
              onClick={onMarkt}
              className={`pb-2 text-[12px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ color: C.accent }}
            >
              Alle opdrachten →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className={`kr-row flex w-full items-center gap-4 py-4 text-left ${RING}`}
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <span className="w-14 shrink-0 text-right">
                    <span
                      className="block text-[26px] font-black leading-none tracking-[-0.03em]"
                      style={{ color: o.match >= 90 ? C.accent : C.ink, ...mono }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: C.inkFaint }}
                    >
                      match
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[16px] font-bold tracking-[-0.01em]"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span
                      className="block text-[14px] font-black"
                      style={{ color: C.ink, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: C.inkFaint }}
                    >
                      p/uur
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-8">
          {/* Vertrouwen */}
          <section>
            <div className="mb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
              <h2
                className="pb-2 text-[22px] font-black tracking-[-0.02em]"
                style={{ color: C.ink }}
              >
                Vertrouwen
              </h2>
            </div>
            <div className="flex items-end gap-3">
              <span
                className="text-[56px] font-black leading-[0.8] tracking-[-0.04em]"
                style={{ color: C.ink, ...mono }}
              >
                {ratio}
                <span className="align-top text-[24px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
              <span
                className="pb-2 text-[12px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.inkMute }}
              >
                geverifieerd
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {CREDENTIALS.map((c) => {
                const t = credTone(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-2">
                    <t.Icon size={14} aria-hidden="true" style={{ color: t.fg }} />
                    <span
                      className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                      style={{ color: C.inkSoft }}
                    >
                      {c.naam}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Btn variant="outline" size="sm" full className="mt-4" onClick={onVerif}>
              Bekijk certificaten
            </Btn>
          </section>

          {/* Primaire actie */}
          <section
            style={{ background: C.accentSoft, border: `1px solid ${C.accent}33` }}
            className="p-5"
          >
            <Eyebrow accent>
              <AlertTriangle size={13} aria-hidden="true" /> Vraagt aandacht
            </Eyebrow>
            <h3
              className="mt-2 text-[19px] font-black leading-tight tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {primair.titel}
            </h3>
            <p
              className="mt-1.5 text-[13px] leading-relaxed"
              style={{ color: C.inkSoft, ...serif }}
            >
              {primair.detail}
            </p>
            <Btn variant="accent" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </section>
        </div>
      </div>
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
    <div>
      <TitleAnchor
        index="02"
        eyebrow="Marktplaats"
        title="Opdrachten"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde profiel.`}
      />

      <div
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}
      >
        <div
          className="flex flex-1 items-center gap-2.5 px-3 py-2.5"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten filteren"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a6a29a]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Filter wissen"
              className={`flex h-5 w-5 items-center justify-center ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
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
      </div>

      {mode === "loading" ? (
        <ul aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="space-y-3 py-6" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div
                className="h-6 w-2/3 animate-pulse motion-reduce:animate-none"
                style={{ background: C.sink2 }}
              />
              <div
                className="h-4 w-1/2 animate-pulse motion-reduce:animate-none"
                style={{ background: C.sink }}
              />
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.accent}
          titel="Er ging iets mis"
          tekst="De opdrachten konden niet worden geladen. Probeer het opnieuw."
          cta="Opnieuw"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.ink}
          titel="Niets gevonden"
          tekst={`Geen resultaat voor ${q ? `“${q}”` : "je filter"}. Verruim je zoekopdracht.`}
          cta="Filter wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul>
          {rows.map((o, i) => (
            <li key={o.id}>
              <MarktRij opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-center gap-4">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-4 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
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
    <div
      className="flex flex-col items-center px-6 py-20 text-center"
      style={{ border: `1px solid ${C.line}`, background: C.paper }}
    >
      <Icon size={30} aria-hidden="true" style={{ color: tone }} />
      <p className="mt-4 text-[28px] font-black tracking-[-0.03em]" style={{ color: C.ink }}>
        {titel}
      </p>
      <p
        className="mt-2 max-w-sm text-[14px] leading-relaxed"
        style={{ color: C.inkMute, ...serif }}
      >
        {tekst}
      </p>
      <Btn variant="solid" className="mt-6" onClick={onCta}>
        {cta}
      </Btn>
    </div>
  );
}

function MarktRij({
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
  return (
    <article style={{ borderBottom: `1px solid ${C.line}` }}>
      <div className="flex items-start gap-5 py-6">
        <span className="w-16 shrink-0 text-right">
          <span
            className="block text-[38px] font-black leading-[0.85] tracking-[-0.04em]"
            style={{ color: strong ? C.accent : C.ink, ...mono }}
          >
            {opdracht.match}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint }}
          >
            match %
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-[10px] font-bold"
            style={{ color: C.inkFaint, ...mono }}
          >
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <Dot size={12} aria-hidden="true" />
            <span>{opdracht.id}</span>
          </div>
          <h3
            className="mt-1 text-[22px] font-black leading-tight tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className={`inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em] ${RING}`}
              style={{ color: C.accent }}
            >
              {open ? <X size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
              Waarom deze match
            </button>
            <Btn variant="solid" size="sm" onClick={onOpen}>
              Reageer <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[20px] font-black" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.inkFaint }}
          >
            per uur
          </span>
        </span>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 sm:pl-[84px]">
            <RedenKolom
              titel="In je voordeel"
              tone={C.ok}
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
    </article>
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
        className="flex items-center gap-2 pb-2 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone, borderBottom: `1px solid ${tone}33` }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <Circle
              size={5}
              aria-hidden="true"
              className="mt-1.5 shrink-0"
              style={{ color: tone, fill: tone }}
            />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Start", v: opdracht.start, s: "aanvang" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div>
      <Btn variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft size={13} aria-hidden="true" /> Terug
      </Btn>

      <div
        style={{ borderTop: `2px solid ${C.ink}`, borderBottom: `1px solid ${C.line}` }}
        className="pb-6 pt-3"
      >
        <div
          className="flex items-center gap-2 text-[10px] font-bold"
          style={{ color: C.inkFaint, ...mono }}
        >
          <span>{opdracht.id}</span>
          <Dot size={12} aria-hidden="true" />
          <span style={{ color: strong ? C.accent : C.inkMute }}>
            {strong ? "TOP MATCH" : "GOEDE MATCH"}
          </span>
        </div>
        <h1
          className="mt-2 max-w-3xl text-[38px] font-black leading-[0.96] tracking-[-0.035em] sm:text-[50px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.inkMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
              style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="accent">
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline">Bewaar</Btn>
        </div>
      </div>

      {/* Feiten als grote mono-cijfers */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {feiten.map((m, i) => (
          <div
            key={m.l}
            className="py-6"
            style={{
              borderRight: i < 3 ? `1px solid ${C.line}` : "none",
              paddingLeft: i === 0 ? 0 : 20,
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[28px] font-black leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {m.v}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: C.inkFaint }}>
              {m.s}
            </p>
          </div>
        ))}
      </section>

      {/* Redenen */}
      <section className="mt-8">
        <div className="mb-1" style={{ borderBottom: `1px solid ${C.line}` }}>
          <Eyebrow>
            <span style={{ ...mono }}>§</span> Waarom deze match — navolgbaar
          </Eyebrow>
          <h2
            className="pb-3 pt-2 text-[26px] font-black tracking-[-0.02em]"
            style={{ color: C.ink }}
          >
            Geen verborgen score
          </h2>
        </div>
        <p
          className="mb-6 max-w-2xl text-[14px] leading-relaxed"
          style={{ color: C.inkMute, ...serif }}
        >
          Afgezet tegen je geverifieerde profiel. Je ziet precies wat in je voordeel spreekt en wat
          goed is om vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <RedenDetail
            titel="In je voordeel"
            tone={C.ok}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenDetail
            titel="Goed om te weten"
            tone={C.warn}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </section>

      {/* Vereiste certificaten */}
      <section className="mt-8" style={{ borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
        <Eyebrow>
          <ShieldCheck size={13} aria-hidden="true" /> Vereiste certificaten
        </Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            return (
              <StatusChip key={c.naam} {...t} label={`${c.naam.split(" ")[0]} · ${t.label}`} />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RedenDetail({
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
        className="flex items-center gap-2 pb-2 text-[12px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone, borderBottom: `2px solid ${tone}` }}
      >
        <Icon size={14} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-4 space-y-3.5">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[14.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <Icon
              size={16}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div>
      <TitleAnchor
        index="04"
        eyebrow="Verificatie"
        title="Certificaten"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <div className="text-right">
            <span
              className="block text-[44px] font-black leading-[0.8] tracking-[-0.04em]"
              style={{ color: C.ink, ...mono }}
            >
              {ratio}%
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute }}
            >
              geverifieerd
            </span>
          </div>
        }
      />

      <div
        className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3"
        style={{ borderBottom: `1px solid ${C.line}`, paddingBottom: 16 }}
      >
        {(["VERIFIED", "SUBMITTED", "EXPIRING", "REJECTED"] as CredStatus[]).map((st) => {
          const t = credTone(st);
          const count = CREDENTIALS.filter((c) => c.status === st).length;
          return (
            <span key={st} className="inline-flex items-center gap-2">
              <span className="text-[22px] font-black" style={{ color: t.fg, ...mono }}>
                {count}
              </span>
              <StatusChip {...t} size="sm" />
            </span>
          );
        })}
      </div>

      <ul>
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-4 py-5 text-left ${RING}`}
              >
                <t.Icon size={22} aria-hidden="true" style={{ color: t.fg }} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[18px] font-bold tracking-[-0.01em]"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="block truncate text-[12.5px]"
                    style={{ color: t.alarm ? t.fg : C.inkMute }}
                  >
                    {c.detail}
                  </span>
                </span>
                <span className="hidden sm:inline-flex">
                  <StatusChip {...t} />
                </span>
                <ChevronRight
                  size={18}
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
                  <div className="pb-5 sm:pl-[38px]">
                    <span className="mb-3 inline-flex sm:hidden">
                      <StatusChip {...t} size="sm" />
                    </span>
                    <p
                      className="max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft, ...serif }}
                    >
                      {c.detail}. Je bewijsstuk wordt versleuteld bewaard en alleen na jouw
                      toestemming door een opdrachtgever ingezien.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Btn size="sm" variant={t.alarm ? "accent" : "solid"}>
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Bekijken"}
                      </Btn>
                      <Btn size="sm" variant="outline">
                        Details
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div>
      <TitleAnchor
        index="05"
        eyebrow="Acties"
        title="Wat vraagt je aandacht"
        sub="Op volgorde van urgentie. Elke regel is één beslissing."
      />
      <ol>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel} style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="flex items-start gap-5 py-6">
                <span
                  className="w-12 shrink-0 text-[36px] font-black leading-none tracking-[-0.04em]"
                  style={{ color: warn ? C.accent : C.inkFaint, ...mono }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <Eyebrow accent={warn}>
                    {warn ? (
                      <AlertTriangle size={13} aria-hidden="true" />
                    ) : (
                      <Dot size={16} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Eyebrow>
                  <h2
                    className="mt-1.5 text-[21px] font-black leading-tight tracking-[-0.02em]"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[14px] leading-relaxed"
                    style={{ color: C.inkSoft, ...serif }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "accent" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </div>
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
    <div>
      <TitleAnchor
        index="06"
        eyebrow="Facturen"
        title="Facturatie"
        sub="Klik een regel voor de opbouw van het bedrag."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={13} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", fg: C.ok, Icon: Check },
          { l: "Openstaand", v: totals.open, sub: "1 factuur · 9 dagen", fg: C.warn, Icon: Clock },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            fg: C.inkSoft,
            Icon: FileText,
          },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-5"
            style={{ borderRight: i < 2 ? `1px solid ${C.line}` : "none" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.fg }} />
            </div>
            <p
              className="mt-1.5 text-[26px] font-black leading-none tracking-[-0.03em]"
              style={{ color: C.ink, ...mono }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: C.inkFaint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div
            className="mb-1 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 className="pb-2 text-[22px] font-black tracking-[-0.02em]" style={{ color: C.ink }}>
              Overzicht
            </h2>
            <div
              className="flex items-center gap-2 pb-2"
              role="group"
              aria-label="Facturen sorteren"
            >
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
                <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
                  {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] ${i === 3 ? "text-right" : ""}`}
                      style={{ color: C.inkMute }}
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
                      className={`kr-row cursor-pointer ${RING}`}
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
                        borderBottom: `1px solid ${C.line}`,
                        background: on ? C.sink : undefined,
                      }}
                    >
                      <td
                        className="px-3 py-3.5 text-[12px] font-bold"
                        style={{ color: on ? C.accent : C.inkSoft, ...mono }}
                      >
                        {f.nr}
                      </td>
                      <td className="px-3 py-3.5 text-[13px] font-bold" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td className="px-3 py-3.5 text-[12px]" style={{ color: C.inkMute, ...mono }}>
                        {f.datum}
                      </td>
                      <td
                        className="px-3 py-3.5 text-right text-[13px] font-black"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.04em]"
                          style={{ color: t.fg }}
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
        </section>

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
    <Panel as="article">
      <div className="p-5" style={{ borderBottom: `2px solid ${C.ink}` }}>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: C.inkMute }}
        >
          Factuur
        </p>
        <p className="text-[22px] font-black tracking-[-0.02em]" style={{ color: C.ink, ...mono }}>
          {factuur.nr}
        </p>
      </div>
      <div className="space-y-3 p-5 text-[13px]">
        <Row label="Klant" value={factuur.klant} />
        <Row label="Datum" value={factuur.datum} isMono />
        <div className="flex items-baseline justify-between">
          <span className="text-[12px]" style={{ color: C.inkMute }}>
            Status
          </span>
          <StatusChip {...t} size="sm" />
        </div>
        <div className="my-3 h-px" style={{ background: C.line }} />
        <Row label="Subtotaal" value={eur0.format(subtotal)} isMono />
        <Row label="Btw 21%" value={eur0.format(btw)} isMono />
        <div className="my-3 h-px" style={{ background: C.ink }} />
        <div className="flex items-baseline justify-between">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.ink }}
          >
            Totaal
          </span>
          <span className="text-[24px] font-black" style={{ color: C.ink, ...mono }}>
            {factuur.bedrag}
          </span>
        </div>
        <div className="mt-5 flex gap-2.5">
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
    </Panel>
  );
}

function Row({ label, value, isMono = false }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-[12px]" style={{ color: C.inkMute }}>
        {label}
      </span>
      <span
        className="shrink-0 text-right text-[13px] font-bold"
        style={{ color: C.ink, ...(isMono ? mono : sans) }}
      >
        {value}
      </span>
    </div>
  );
}
