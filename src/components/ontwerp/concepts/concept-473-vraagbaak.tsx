"use client";

// Concept 473 — "Vraagbaak" · Query-first + progressive disclosure. Eén prominente slimme commandobalk
// bovenaan stuurt de hele interface: typ een vraag of commando ("matches boven 90%", "verlopende
// certificaten", "openstaande facturen") en de juiste weergave verschijnt. Antwoorden komen als rustige
// kaarten die stap voor stap meer detail onthullen. Licht, veel witruimte, één helder indigo-accent.
// Puur lokaal (useState); geen backend. "Slim zoeken", geen ander etiket.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Command,
  CornerDownLeft,
  FileText,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkle,
  TrendingDown,
  TrendingUp,
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

// — Palet: licht, rustig, één indigo-accent —
const C = {
  bg: "#fbfbfd",
  surface: "#ffffff",
  surfaceAlt: "#f4f4f7",
  surfaceHi: "#eef0f6",
  line: "#e6e6ec",
  lineHi: "#d6d6de",
  ink: "#18181b",
  inkSoft: "#3f3f46",
  inkMute: "#71717a",
  inkFaint: "#a1a1aa",
  indigo: "#4338ca",
  indigoHi: "#3730a3",
  indigoSoft: "#ecebfb",
  green: "#15803d",
  greenSoft: "#dcfce7",
  amber: "#b45309",
  amberSoft: "#fef3c7",
  red: "#b91c1c",
  redSoft: "#fee2e2",
  blue: "#1d4ed8",
  blueSoft: "#dbeafe",
};

const bodyFont = { fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" };
const num = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        soft: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In behandeling", Icon: Clock, alarm: false, ink: C.blue, soft: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.red, soft: C.redSoft };
  }
}

// Interpretatie van een vrije vraag/commando → welke weergave + eventuele filters.
type Intent = { screen: ScreenKey; minMatch: number; term: string; uitleg: string };

function parseCommand(raw: string): Intent {
  const t = raw.toLowerCase().trim();
  const matchNum = t.match(/(?:boven|>|vanaf|minstens)?\s*(\d{2,3})\s*%?/);
  const drempel = matchNum?.[1] ? Math.min(100, parseInt(matchNum[1], 10)) : 0;

  if (!t) return { screen: "dashboard", minMatch: 0, term: "", uitleg: "Overzicht van vandaag" };
  if (/(factu|omzet|betaal|openstaan|verstuur)/.test(t))
    return { screen: "facturen", minMatch: 0, term: "", uitleg: "Facturen en omzet" };
  if (/(verificat|certifica|diploma|vog|big|reanimat|document)/.test(t))
    return {
      screen: "verificatie",
      minMatch: 0,
      term: "",
      uitleg: "Certificaten en verificatiestatus",
    };
  if (/(actie|aandacht|doen|urgent|verloop|belangrijk|nu)/.test(t))
    return { screen: "acties", minMatch: 0, term: "", uitleg: "Wat vandaag je aandacht vraagt" };
  if (/(match|opdracht|marktplaats|reactie|boven|%)/.test(t))
    return {
      screen: "marktplaats",
      minMatch: /(match|boven|%|vanaf|minstens|>)/.test(t) ? drempel : 0,
      term: "",
      uitleg:
        drempel > 0 ? `Opdrachten met een match vanaf ${drempel}%` : "Opdrachten die bij je passen",
    };
  return {
    screen: "marktplaats",
    minMatch: 0,
    term: raw.trim(),
    uitleg: `Opdrachten gevonden voor “${raw.trim()}”`,
  };
}

const CHIPS: { label: string; cmd: string; Icon: LucideIcon }[] = [
  { label: "Matches boven 90%", cmd: "matches boven 90%", Icon: Sparkle },
  {
    label: "Wat vraagt mijn aandacht?",
    cmd: "wat vraagt vandaag mijn aandacht",
    Icon: AlertTriangle,
  },
  { label: "Verlopende certificaten", cmd: "verlopende certificaten", Icon: ShieldCheck },
  { label: "Openstaande facturen", cmd: "openstaande facturen", Icon: FileText },
];

function Card({
  children,
  className = "",
  as: Tag = "div",
  interactive = false,
  tint = C.surface,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  interactive?: boolean;
  tint?: string;
}) {
  return (
    <Tag
      className={`vb-card relative rounded-2xl ${interactive ? "vb-card--int" : ""} ${className}`}
      style={{
        background: tint,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(24,24,27,0.04)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.indigo }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone, ...bodyFont }}
    >
      {children}
    </p>
  );
}

function SolidButton({
  children,
  onClick,
  tone = C.indigo,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[12.5px] font-bold text-white transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={{
        background: tone,
        boxShadow: `0 2px 8px -2px ${tone}66`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.indigo : C.surface,
        border: `1px solid ${active ? C.indigo : C.line}`,
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function SparkLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  const gid = `vb-grad-${id}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.22" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={tone} />
    </svg>
  );
}

// — De hoofd-commandobalk: stuurt de hele interface —
function CommandBar({
  value,
  onChange,
  onRun,
  uitleg,
  hint = "Vraag of zoek… bv. 'matches boven 90%'",
}: {
  value: string;
  onChange: (v: string) => void;
  onRun: (raw: string) => void;
  uitleg: string;
  hint?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="mt-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRun(value);
        }}
        role="search"
        aria-label="Slim zoeken en commando's"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all sm:px-5 sm:py-4"
          style={{
            background: C.surface,
            border: `1px solid ${focus ? C.indigo : C.line}`,
            boxShadow: focus
              ? `0 0 0 4px ${C.indigo}1f, 0 10px 30px -18px rgba(67,56,202,0.5)`
              : "0 1px 2px rgba(24,24,27,0.05)",
          }}
        >
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: C.indigoSoft, color: C.indigo }}
            aria-hidden="true"
          >
            <Command size={17} />
          </span>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder={hint}
            aria-label="Typ een vraag of commando"
            className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-[#a1a1aa]"
            style={{ color: C.ink, ...bodyFont }}
          />
          <button
            type="submit"
            className="hidden shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-bold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff] sm:inline-flex"
            style={{ background: C.indigo, ...bodyFont }}
          >
            Uitvoeren
            <CornerDownLeft size={13} aria-hidden="true" />
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold" style={{ color: C.inkFaint, ...bodyFont }}>
          Probeer:
        </span>
        {CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onRun(c.cmd)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all hover:border-[#4338ca] hover:text-[#4338ca] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd]"
            style={{
              color: C.inkSoft,
              background: C.surface,
              border: `1px solid ${C.line}`,
              ...bodyFont,
            }}
          >
            <c.Icon size={12} aria-hidden="true" />
            {c.label}
          </button>
        ))}
      </div>
      <p
        className="mt-3 flex items-center gap-1.5 text-[12px]"
        style={{ color: C.inkMute }}
        aria-live="polite"
      >
        <Sparkle size={12} aria-hidden="true" style={{ color: C.indigo }} />
        <span className="font-semibold" style={{ color: C.indigo }}>
          Toont:
        </span>{" "}
        {uitleg}
      </p>
    </div>
  );
}

// — Progressive-disclosure antwoordkaart: samenvatting → 'Meer tonen' onthult detail —
function AnswerCard({
  eyebrow,
  tone = C.indigo,
  titel,
  samenvatting,
  children,
  cta,
  onCta,
  defaultOpen = false,
}: {
  eyebrow: string;
  tone?: string;
  titel: string;
  samenvatting: React.ReactNode;
  children: React.ReactNode;
  cta?: string;
  onCta?: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden p-5" interactive>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
          <h3 className="mt-1.5 text-[16px] font-bold leading-snug" style={{ color: C.ink }}>
            {titel}
          </h3>
        </div>
        <span
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${tone}14`, color: tone }}
          aria-hidden="true"
        >
          <Sparkle size={15} />
        </span>
      </div>
      <div className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {samenvatting}
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 border-t pt-4" style={{ borderColor: C.line }}>
            {children}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded text-[12px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.indigo, ...bodyFont }}
        >
          {open ? "Minder tonen" : "Meer tonen"}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>
        {cta && (
          <button
            type="button"
            onClick={onCta}
            className="ml-auto inline-flex items-center gap-1 rounded text-[12px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
            style={{ color: C.inkMute, ...bodyFont }}
          >
            {cta}
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  );
}

export function Concept473() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [query, setQuery] = useState("");
  const [minMatch, setMinMatch] = useState(0);
  const [term, setTerm] = useState("");
  const [uitleg, setUitleg] = useState("Overzicht van vandaag");
  const active = OPDRACHTEN[0] as Opdracht;

  function run(raw: string) {
    const intent = parseCommand(raw);
    setQuery(raw);
    setScreen(intent.screen);
    setMinMatch(intent.minMatch);
    setTerm(intent.term);
    setUitleg(intent.uitleg);
  }

  function goto(s: ScreenKey) {
    setScreen(s);
    setMinMatch(0);
    setTerm("");
    setUitleg(
      s === "dashboard"
        ? "Overzicht van vandaag"
        : s === "marktplaats"
          ? "Opdrachten die bij je passen"
          : s === "verificatie"
            ? "Certificaten en verificatiestatus"
            : s === "acties"
              ? "Wat vandaag je aandacht vraagt"
              : s === "facturen"
                ? "Facturen en omzet"
                : "Opdrachtdetail",
    );
  }

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, background: C.bg }}
    >
      <style>{`
        @keyframes vbRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .vb-rise { animation: vbRise 0.44s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .vb-card--int { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s, border-color 0.25s; }
        .vb-card--int:hover { transform: translateY(-2px); box-shadow: 0 12px 28px -18px rgba(24,24,27,0.28); border-color: ${C.lineHi}; }
        @media (prefers-reduced-motion: reduce) { .vb-rise { animation: none !important; } .vb-card--int { transition: none !important; } .vb-card--int:hover { transform: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <CommandBar value={query} onChange={setQuery} onRun={run} uitleg={uitleg} />
        <NavBar screen={screen} goto={goto} />
        <main key={`${screen}-${minMatch}-${term}`} className="vb-rise pt-6">
          {screen === "dashboard" && <Dashboard run={run} goto={goto} />}
          {screen === "marktplaats" && (
            <Marktplaats minMatch={minMatch} term={term} onOpen={() => goto("opdracht")} />
          )}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => goto("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: C.indigo, color: "#fff" }}
          aria-hidden="true"
        >
          <Command size={19} strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-[19px] font-bold leading-none tracking-tight" style={{ color: C.ink }}>
            Vraagbaak
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            {PROFIEL.plaats} · stel je vraag
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.green, background: C.greenSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: C.surface, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={15} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: C.red, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13.5px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-bold"
          style={{ background: C.indigoSoft, color: C.indigo, ...num }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, goto }: { screen: ScreenKey; goto: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-5 border-b" style={{ borderColor: C.line }}>
      <div className="flex items-stretch gap-1 overflow-x-auto">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => goto(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-3 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd] motion-reduce:transition-none"
              style={{ color: on ? C.indigo : C.inkMute, ...bodyFont }}
            >
              {s.label}
              {on && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: C.indigo }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ run, goto }: { run: (raw: string) => void; goto: (s: ScreenKey) => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const sterkeMatches = OPDRACHTEN.filter((o) => o.match >= 90);
  const expiring = CREDENTIALS.filter((c) => c.status === "EXPIRING");
  const openstaand = FACTUREN.filter((f) => f.status === "Openstaand");

  return (
    <div className="space-y-6 pt-1">
      <div>
        <h1
          className="text-[26px] font-bold leading-tight tracking-[-0.01em] md:text-[32px]"
          style={{ color: C.ink }}
        >
          Dag {PROFIEL.naam.split(" ")[0]} — waar kan ik je mee helpen?
        </h1>
        <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Stel je vraag hierboven, of bekijk de antwoorden die er nu al toe doen. Elke kaart vat het
          kort samen; met “Meer tonen” zie je het detail.
        </p>
      </div>

      <section>
        <Eyebrow>Kerncijfers</Eyebrow>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.green : C.amber;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Card key={k.label} className="p-5" interactive>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-bold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <SparkLine data={k.spark} tone={tone} id={`k473-${i}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <Eyebrow>Antwoorden voor jou</Eyebrow>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnswerCard
            eyebrow="Matches"
            tone={C.indigo}
            titel={`${sterkeMatches.length} sterke matches boven 90%`}
            defaultOpen
            samenvatting={
              <>
                De hoogste is{" "}
                <span className="font-bold" style={{ color: C.ink }}>
                  {sterkeMatches[0]?.titel}
                </span>{" "}
                bij {sterkeMatches[0]?.opdrachtgever} met {sterkeMatches[0]?.match}% match.
              </>
            }
            cta="Naar de marktplaats"
            onCta={() => run("matches boven 90%")}
          >
            <ul className="space-y-2.5">
              {sterkeMatches.map((o) => (
                <li key={o.id} className="flex items-center gap-3">
                  <span
                    className="inline-flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg"
                    style={{ background: C.indigoSoft }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[12px] font-bold leading-none"
                      style={{ color: C.indigo, ...num }}
                    >
                      {o.match}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.inkMute }}>
                      {o.opdrachtgever} · {o.tarief}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </AnswerCard>

          <AnswerCard
            eyebrow="Aandacht"
            tone={C.amber}
            titel={primair.titel}
            samenvatting={primair.detail}
            cta="Alle acties"
            onCta={() => goto("acties")}
          >
            <div className="rounded-xl p-4" style={{ background: C.amberSoft }}>
              <p
                className="flex items-center gap-2 text-[12.5px] font-semibold"
                style={{ color: C.amber }}
              >
                <AlertTriangle size={14} aria-hidden="true" />
                {expiring.length} certificaat verloopt binnenkort
              </p>
              <p className="mt-1.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                {expiring[0]?.naam} — {expiring[0]?.detail}. Regel dit op tijd zodat je
                verifieerbaar blijft.
              </p>
            </div>
            <div className="mt-3">
              <SolidButton tone={C.amber} onClick={() => goto("acties")}>
                {primair.cta}
                <ArrowRight size={13} aria-hidden="true" />
              </SolidButton>
            </div>
          </AnswerCard>

          <AnswerCard
            eyebrow="Verificatie"
            tone={C.green}
            titel={`${ratio}% van je certificaten is in orde`}
            samenvatting={
              <>
                {verified} van {CREDENTIALS.length} geverifieerd. Je documenten blijven versleuteld
                en privé.
              </>
            }
            cta="Bekijk certificaten"
            onCta={() => goto("verificatie")}
          >
            <ul className="space-y-2">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: st.soft, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={13} />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: st.ink }}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </AnswerCard>

          <AnswerCard
            eyebrow="Facturen"
            tone={C.red}
            titel={`${openstaand.length} openstaande factuur`}
            samenvatting={
              <>
                {openstaand[0]?.klant} — {openstaand[0]?.bedrag}, {openstaand[0]?.datum} verstuurd.
                Een korte herinnering helpt vaak.
              </>
            }
            cta="Naar facturen"
            onCta={() => run("openstaande facturen")}
          >
            <div className="rounded-xl p-4" style={{ background: C.surfaceAlt }}>
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: C.inkMute }}>Betaald deze maand</span>
                <span className="font-bold" style={{ color: C.green, ...num }}>
                  € 8.622
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12.5px]">
                <span style={{ color: C.inkMute }}>Openstaand</span>
                <span className="font-bold" style={{ color: C.red, ...num }}>
                  € 1.350
                </span>
              </div>
            </div>
          </AnswerCard>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({
  minMatch,
  term,
  onOpen,
}: {
  minMatch: number;
  term: string;
  onOpen: () => void;
}) {
  const [q, setQ] = useState(term);
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.match >= minMatch &&
        (o.titel.toLowerCase().includes(needle) ||
          o.plaats.toLowerCase().includes(needle) ||
          o.opdrachtgever.toLowerCase().includes(needle)),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort, minMatch]);

  return (
    <div className="space-y-6 pt-1">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1
          className="mt-2 text-[28px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Opdrachten voor jou
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij jouw profiel
          {minMatch > 0 && (
            <span
              className="ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
              style={{ background: C.indigoSoft, color: C.indigo }}
            >
              filter: match ≥ {minMatch}%
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-xl px-5 py-3 focus-within:border-[#4338ca]"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Verfijn binnen deze resultaten…"
            aria-label="Opdrachten verfijnen"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a1a1aa]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-5">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-full" style={{ background: C.surfaceAlt }} />
                  <div className="h-5 w-2/3 rounded-full" style={{ background: C.surfaceAlt }} />
                  <div className="h-3 w-1/2 rounded-full" style={{ background: C.surfaceAlt }} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.surfaceAlt, color: C.inkMute }}
              aria-hidden="true"
            >
              <Search size={24} />
            </span>
            <p className="mt-5 text-[20px] font-bold" style={{ color: C.ink }}>
              Geen antwoord op deze vraag
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Niets gevonden{q ? ` bij “${q}”` : ""}
              {minMatch > 0 ? ` met een match vanaf ${minMatch}%` : ""}. Stel je vraag iets ruimer.
            </p>
            <div className="mt-6">
              <SolidButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </SolidButton>
            </div>
          </div>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
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
  const tone = strong ? C.indigo : C.blue;
  return (
    <Card className="p-5" interactive as="article">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
            >
              #{String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.inkSoft, background: C.surfaceAlt, ...bodyFont }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-full px-3 py-1.5"
            style={{ background: `${tone}14` }}
          >
            <span className="text-[18px] font-bold leading-none" style={{ color: tone, ...num }}>
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ color: tone }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <SolidButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={C.green}
              soft={C.greenSoft}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={C.amber}
              soft={C.amberSoft}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  tone,
  soft,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  soft: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: soft }}>
      <p
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        style={{ color: tone, ...bodyFont }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
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

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.indigo : C.blue;
  return (
    <div className="space-y-5 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfd]"
        style={{ color: C.ink, border: `1px solid ${C.line}`, background: C.surface, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.inkMute, border: `1px solid ${C.line}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
            style={{ background: tone, ...bodyFont }}
          >
            <Sparkle size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-[-0.01em] md:text-[34px]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <SolidButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </SolidButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
                borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-bold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <Eyebrow>Waarom deze match bij je past</Eyebrow>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — wat in je voordeel spreekt én wat goed is om te
          weten, open en zonder verborgen score.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.green, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> In jouw voordeel
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.amber, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <p className="mt-4 text-[12px] font-bold" style={{ color: tone, ...bodyFont }}>
          Match {opdracht.match}% —{" "}
          {strong ? "sterk afgestemd op jouw profiel." : "goed afgestemd op jouw profiel."}
        </p>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-1">
      <Card className="p-7 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.green}>Verificatie</Eyebrow>
            <h1
              className="mt-2 text-[24px] font-bold leading-tight tracking-[-0.01em]"
              style={{ color: C.ink }}
            >
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-bold" style={{ color: C.green }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort — die pak je op tijd op. Je documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <span
                className="relative h-2 w-28 overflow-hidden rounded-full"
                style={{ background: C.surfaceAlt }}
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${ratio}%`,
                    background: C.green,
                    transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </span>
              <span className="text-[12px] font-bold" style={{ color: C.green, ...num }}>
                {ratio}%
              </span>
            </div>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.greenSoft }}
          >
            <span className="text-[28px] font-bold leading-none" style={{ color: C.green, ...num }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              % in orde
            </span>
          </span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.line}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4338ca] motion-reduce:transition-none"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: st.soft, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="hidden w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex"
                      style={{ color: st.ink, background: st.soft, ...bodyFont }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                    />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 sm:pl-[76px]">
                      <div className="rounded-xl p-4" style={{ background: C.surfaceAlt }}>
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <SolidButton tone={c.status === "EXPIRING" ? C.amber : C.indigo}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </SolidButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div>
        <div className="mb-3">
          <Eyebrow>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: C.surfaceAlt, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.soft }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-1">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <h1
          className="mt-2 text-[28px] font-bold leading-none tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden. Open een actie voor de details en handel hem meteen af.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.indigo;
          const soft = warn ? C.amberSoft : C.indigoSoft;
          return (
            <li key={a.titel}>
              <ActieKaart
                index={i}
                titel={a.titel}
                detail={a.detail}
                cta={a.cta}
                tone={tone}
                soft={soft}
                warn={warn}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ActieKaart({
  index,
  titel,
  detail,
  cta,
  tone,
  soft,
  warn,
}: {
  index: number;
  titel: string;
  detail: string;
  cta: string;
  tone: string;
  soft: string;
  warn: boolean;
}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <Card className="p-5" interactive>
      <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold"
          style={{ background: soft, color: tone, ...num }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
            style={{ color: tone, background: soft, ...bodyFont }}
          >
            {warn ? (
              <AlertTriangle size={10} aria-hidden="true" />
            ) : (
              <Sparkle size={10} aria-hidden="true" />
            )}
            {warn ? "Urgent" : "Aanbevolen"}
          </span>
          <h2 className="mt-2 text-[17px] font-bold leading-snug" style={{ color: C.ink }}>
            {titel}
          </h2>
          <p className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {detail}
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1.5 rounded text-[12px] font-bold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]"
            style={{ color: tone, ...bodyFont }}
          >
            {open ? "Minder tonen" : "Meer tonen"}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
            />
          </button>
          <div
            className="grid transition-all duration-500 motion-reduce:transition-none"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div
                className="mt-3 rounded-xl p-4 text-[12.5px] leading-relaxed"
                style={{ background: C.surfaceAlt, color: C.inkSoft }}
              >
                Deze actie is automatisch bovenaan gezet op basis van urgentie en impact. Handel hem
                af en de eerstvolgende schuift naar boven — zo blijf je met minimale moeite
                verifieerbaar en actueel.
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
          <SolidButton tone={tone}>
            {cta}
            <ArrowRight size={13} aria-hidden="true" />
          </SolidButton>
        </div>
      </div>
    </Card>
  );
}

function factuurTone(status: string): { ink: string; soft: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.red, soft: C.redSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.green, soft: C.greenSoft, Icon: Check };
  return { ink: C.inkMute, soft: C.surfaceAlt, Icon: FileText };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");

  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5 pt-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-2 text-[28px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Jouw facturen
          </h1>
        </div>
        <SolidButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </SolidButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 8.622", sub: "3 facturen", alarm: false, tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.red },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.inkMute },
        ].map((s) => (
          <Card key={s.l} className="p-5" interactive>
            <div className="flex items-center justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.red }} />}
            </div>
            <p
              className="mt-2 text-[26px] font-bold tracking-[-0.01em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <GhostButton
            key={s}
            onClick={() => setSort(s)}
            active={sort === s}
            ariaPressed={sort === s}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </GhostButton>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.line}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-4 py-3 text-[9.5px] font-bold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => {
                const ft = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f4f4f7]"
                    style={{
                      background: i % 2 === 1 ? C.surfaceAlt : "transparent",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <td
                      className="px-4 py-3 text-[11.5px] font-bold"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                        style={{ color: ft.ink, background: ft.soft, ...bodyFont }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
