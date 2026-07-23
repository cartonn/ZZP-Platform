"use client";

// Concept 464 — "Colofon" · Redactionele drukkers-esthetiek. Het colofon van een fijn gezette drukwerk:
// papierkleur #f4f1ea, drukinkt-zwart #1a1815, één steunkleur vermiljoen #c8402f + proces-cyaan #2b7a8c.
// Fijne kaderlijnen, dubbele filets, kleine-caps, registratiekruisjes en foliëring. Serif-zetwerk voor de
// kop, monospace voor drukkers-metadata. Technisch-precies, ambachtelijk. Beweging respecteert reduced-motion.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Plus,
  Printer,
  Search,
  ShieldCheck,
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

// — Palet: papier + drukinkt + steunkleuren —
const C = {
  paper: "#f4f1ea",
  paperDeep: "#ebe7dc",
  panel: "#faf8f3",
  ink: "#1a1815",
  inkSoft: "#4a453d",
  inkMute: "#6b655c",
  inkFaint: "#948d80",
  line: "#1a1815",
  lineSoft: "#d5cfc2",
  hair: "#c7c0b0",
  red: "#c8402f",
  redSoft: "#f2ddd8",
  cyan: "#2b7a8c",
  cyanSoft: "#d7e8ec",
  ok: "#3f7d4f",
  okSoft: "#dce9de",
  warn: "#b5761f",
  warnSoft: "#f0e4cd",
  bad: "#c8402f",
  badSoft: "#f2ddd8",
  info: "#2b7a8c",
  infoSoft: "#d7e8ec",
};

const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const mono = {
  fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums" as const,
};
const sans = {
  fontFamily: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
};

// — Registratiekruis: drukkers-uitlijnmarkering —
function RegMark({ size = 18 }: { size?: number }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={c - 4} fill="none" stroke={C.red} strokeWidth="0.8" />
      <line x1={c} y1="0" x2={c} y2={size} stroke={C.red} strokeWidth="0.8" />
      <line x1="0" y1={c} x2={size} y2={c} stroke={C.red} strokeWidth="0.8" />
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.ok, soft: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.info, soft: C.infoSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warn,
        soft: C.warnSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.bad,
        soft: C.badSoft,
      };
  }
}

// — Paneel: papiervlak met fijne kaderlijn en drukmarkering-hoek —
function Panel({
  children,
  className = "",
  as: Tag = "div",
  marks = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  marks?: boolean;
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.ink }}
    >
      {marks && (
        <span className="pointer-events-none absolute -right-[7px] -top-[7px]" aria-hidden="true">
          <RegMark size={14} />
        </span>
      )}
      {children}
    </Tag>
  );
}

function SmallCaps({
  children,
  color = C.inkMute,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${className}`}
      style={{ color, ...sans }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 hover:bg-[#a8331f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1815] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none ${className}`}
      style={{ color: C.paper, background: C.red, border: `1px solid ${C.line}`, ...sans }}
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
      className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1815] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.paper : C.ink,
        background: active ? C.ink : "transparent",
        border: `1px solid ${C.line}`,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline: fijne inktlijn met foliëring —
function InkLine({ data, tone = C.ink }: { data: number[]; tone?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline points={line} fill="none" stroke={tone} strokeWidth="1.1" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.1" fill={C.hair} />
      ))}
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={C.red} stroke={C.paper} strokeWidth="1" />
    </svg>
  );
}

export function Concept464() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ background: C.paper, color: C.ink, ...sans }}
    >
      <style>{`
        @keyframes colFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .col-fade { animation: colFade 0.4s ease both; }
        @media (prefers-reduced-motion: reduce) { .col-fade { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="col-fade pt-7">
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
        <footer
          className="mt-12 flex flex-wrap items-center justify-between gap-3 pt-5 text-[10.5px]"
          style={{ borderTop: `1px solid ${C.line}`, color: C.inkFaint, ...mono }}
        >
          <span>COLOFON · ZZP-EDITIE · GEZET IN SERIF &amp; MONO</span>
          <span>OPLAGE 001 · {PROFIEL.plaats.toUpperCase()}</span>
        </footer>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="pt-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RegMark size={22} />
          <div>
            <p className="text-[22px] leading-none" style={{ color: C.ink, ...serif }}>
              Colofon
            </p>
            <p
              className="mt-1.5 text-[10px] uppercase tracking-[0.2em]"
              style={{ color: C.inkMute, ...mono }}
            >
              Editie &amp; zetwerk · {PROFIEL.plaats}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:inline-flex"
            style={{ color: C.ok, border: `1px solid ${C.ok}`, background: C.okSoft, ...sans }}
          >
            <ShieldCheck size={12} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span
            className="relative inline-flex h-9 w-9 items-center justify-center"
            style={{ border: `1px solid ${C.line}`, color: C.inkMute }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            <Bell size={15} aria-hidden="true" />
            {ongelezen > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center text-[9px] font-bold"
                style={{ background: C.red, color: C.paper, ...mono }}
                aria-hidden="true"
              >
                {ongelezen}
              </span>
            )}
          </span>
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-semibold" style={{ color: C.ink, ...sans }}>
              {PROFIEL.naam}
            </span>
            <span
              className="block text-[10px] uppercase tracking-[0.12em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {PROFIEL.rol}
            </span>
          </span>
          <span
            className="inline-flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
            style={{ background: C.ink, color: C.paper, ...serif }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <div className="mt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="mt-[3px]" style={{ borderTop: `1px solid ${C.line}` }} />
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex items-stretch gap-0 overflow-x-auto"
        style={{ border: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8402f] motion-reduce:transition-none"
              style={{
                color: on ? C.paper : C.inkMute,
                background: on ? C.ink : "transparent",
                borderLeft: i === 0 ? "none" : `1px solid ${C.line}`,
                ...sans,
              }}
            >
              <span className="text-[9px]" style={{ color: on ? C.red : C.inkFaint, ...mono }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SectionHead({ nr, kicker, titel }: { nr: string; kicker: string; titel: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ color: C.red, ...mono }}>
          §{nr}
        </span>
        <SmallCaps>{kicker}</SmallCaps>
      </div>
      <h1
        className="mt-2 text-[30px] leading-[1.05] md:text-[38px]"
        style={{ color: C.ink, ...serif }}
      >
        {titel}
      </h1>
    </div>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-7 md:p-9" marks>
          <SmallCaps color={C.red}>Voorwoord · vandaag</SmallCaps>
          <h1
            className="mt-4 text-[34px] leading-[1.04] md:text-[46px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p
            className="mt-4 max-w-md text-[14px] leading-relaxed"
            style={{ color: C.inkSoft, ...serif }}
          >
            Je praktijk, netjes gezet als een editie: elk certificaat verifieerbaar, elke factuur op
            de juiste regel, elke match verklaard. Loop het colofon van vandaag langs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={13}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Panel>

        <Panel className="p-7">
          <div className="flex items-center justify-between">
            <SmallCaps color={C.warn}>Redactienoot</SmallCaps>
            <AlertTriangle size={16} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <h2 className="mt-3 text-[19px] leading-snug" style={{ color: C.ink, ...serif }}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft, ...serif }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={13} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div
            className="mt-5 flex items-center gap-2 pt-4 text-[11px]"
            style={{ borderTop: `1px solid ${C.lineSoft}`, color: C.inkMute, ...mono }}
          >
            <Check size={12} aria-hidden="true" style={{ color: C.ok }} />
            {verified}/{CREDENTIALS.length} CERT. GEVERIFIEERD · 7 OPEN REACTIES
          </div>
        </Panel>
      </section>

      <section>
        <SmallCaps className="mb-3 block">Kengetallen · deze maand</SmallCaps>
        <div
          className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4"
          style={{ border: `1px solid ${C.line}` }}
        >
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="p-5"
              style={{
                background: C.panel,
                borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <SmallCaps>{k.label}</SmallCaps>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: k.up ? C.ok : C.warn, ...mono }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p className="mt-3 text-[27px] leading-none" style={{ color: C.ink, ...serif }}>
                {k.value}
              </p>
              <div className="mt-3">
                <InkLine data={k.spark} tone={k.up ? C.ink : C.warn} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <SmallCaps>Katern · open opdrachten</SmallCaps>
            <button
              type="button"
              onClick={onOpen}
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#a8331f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1815]"
              style={{ color: C.red, ...sans }}
            >
              Volledige lijst →
            </button>
          </div>
          <Panel>
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f0ece2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8402f] motion-reduce:transition-none"
                  >
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center text-[12px] font-bold"
                      style={{
                        border: `1px solid ${C.line}`,
                        color: i === 0 ? C.red : C.inkMute,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px]"
                        style={{ color: C.ink, ...serif }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div>
          <SmallCaps className="mb-3 block">Register · certificaten</SmallCaps>
          <Panel className="p-5">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <st.Icon size={15} aria-hidden="true" style={{ color: st.ink }} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px]"
                        style={{ color: C.ink, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[10px] uppercase tracking-[0.1em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-6">
      <SectionHead nr="02" kicker="Marktplaats" titel="Open opdrachten" />
      <p
        className="-mt-3 text-[11px] uppercase tracking-[0.12em]"
        style={{ color: C.inkMute, ...mono }}
      >
        {String(filtered.length).padStart(2, "0")} van {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
        opdrachten in deze editie
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#948d80]"
            style={{ color: C.ink, ...sans }}
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
              {s === "match" ? "Match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Zetten…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Panel className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24" style={{ background: C.paperDeep }} />
                  <div className="h-5 w-2/3" style={{ background: C.lineSoft }} />
                  <div className="h-3 w-1/2" style={{ background: C.paperDeep }} />
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Panel className="p-6" marks>
          <div className="flex flex-col items-center py-14 text-center">
            <RegMark size={40} />
            <p className="mt-5 text-[22px]" style={{ color: C.ink, ...serif }}>
              Leeg katern
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft, ...serif }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en zet opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={13} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
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
  return (
    <Panel className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              Fol. {String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3 className="mt-1.5 text-[20px] leading-snug" style={{ color: C.ink, ...serif }}>
            {opdracht.titel}
          </h3>
          <p
            className="mt-1 text-[11.5px] uppercase tracking-[0.08em]"
            style={{ color: C.inkMute, ...mono }}
          >
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-medium"
                style={{ color: C.inkSoft, border: `1px solid ${C.hair}`, ...sans }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span
            className="inline-flex h-14 w-14 flex-col items-center justify-center"
            style={{ border: `1.5px solid ${strong ? C.red : C.line}` }}
          >
            <span
              className="text-[17px] leading-none"
              style={{ color: strong ? C.red : C.ink, ...serif }}
            >
              {opdracht.match}
            </span>
            <span
              className="mt-0.5 text-[7.5px] uppercase tracking-[0.12em]"
              style={{ color: C.inkFaint, ...mono }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1815]"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...sans }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Verantwoording
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="duration-400 grid transition-all motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Pleit vóór" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Errata"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RedenBlok({
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
    <div className="p-4" style={{ border: `1px solid ${C.lineSoft}`, background: C.paper }}>
      <SmallCaps color={tone}>{titel}</SmallCaps>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px]"
            style={{ color: C.inkSoft, ...serif }}
          >
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
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#f0ece2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1815]"
        style={{ color: C.ink, border: `1px solid ${C.line}`, ...sans }}
      >
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel className="p-7 md:p-9" marks>
        <div
          className="flex flex-wrap items-center gap-2 text-[11px]"
          style={{ color: C.inkMute, ...mono }}
        >
          <span className="px-2 py-0.5" style={{ border: `1px solid ${C.line}` }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 font-bold uppercase tracking-[0.1em]"
            style={{ background: C.red, color: C.paper }}
          >
            <Printer size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] leading-[1.06] md:text-[42px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p
          className="mt-2 text-[13px] uppercase tracking-[0.1em]"
          style={{ color: C.inkMute, ...mono }}
        >
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Panel>

      <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: `1px solid ${C.line}` }}>
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
              background: C.panel,
              borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
              borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
            }}
          >
            <SmallCaps>{m.l}</SmallCaps>
            <p className="mt-1.5 text-[18px]" style={{ color: C.ink, ...serif }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <SmallCaps color={C.red}>Verantwoording · verklaarbare matching</SmallCaps>
        <p
          className="mt-3 max-w-xl text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft, ...serif }}
        >
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant gezet, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <RedenPaneel
            titel="Pleit vóór"
            tone={C.ok}
            soft={C.okSoft}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenPaneel
            titel="Errata · let op"
            tone={C.warn}
            soft={C.warnSoft}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </section>
    </div>
  );
}

function RedenPaneel({
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
    <Panel className="p-6">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center"
          style={{ background: soft, color: tone, border: `1px solid ${tone}` }}
          aria-hidden="true"
        >
          <Icon size={14} />
        </span>
        <SmallCaps color={tone}>{titel}</SmallCaps>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[13.5px]"
            style={{ color: C.inkSoft, ...serif }}
          >
            <Icon
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-6">
      <Panel className="p-7 md:p-9" marks>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <SmallCaps color={C.red}>Verificatie · gewaarmerkt</SmallCaps>
            <h1 className="mt-3 text-[28px] leading-tight" style={{ color: C.ink, ...serif }}>
              Jouw certificaten
            </h1>
            <p
              className="mt-3 text-[13.5px] leading-relaxed"
              style={{ color: C.inkSoft, ...serif }}
            >
              <span className="font-semibold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center"
            style={{ border: `2px solid ${C.line}` }}
          >
            <span className="text-[30px] leading-none" style={{ color: C.red, ...serif }}>
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...mono }}
            >
              % op orde
            </span>
          </span>
        </div>
      </Panel>

      <Panel>
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f0ece2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c8402f] motion-reduce:transition-none sm:grid-cols-[1fr_12rem_2rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center"
                      style={{ background: st.soft, border: `1px solid ${st.ink}`, color: st.ink }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px]"
                        style={{ color: C.ink, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        color: st.ink,
                        background: st.soft,
                        border: `1px solid ${st.ink}`,
                        ...sans,
                      }}
                    >
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                  <span
                    className="hidden justify-self-end transition-transform motion-reduce:transition-none sm:block"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </button>
                <div
                  className="duration-400 grid transition-all motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[72px]">
                      <div
                        className="p-4"
                        style={{ background: C.paper, border: `1px solid ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft, ...serif }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
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
      </Panel>

      <div>
        <SmallCaps className="mb-3 block">Documentenkast</SmallCaps>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Panel key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center"
                  style={{ border: `1px solid ${C.line}`, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]" style={{ color: C.ink, ...serif }}>
                    {d.naam}
                  </span>
                  <span
                    className="block text-[10px] uppercase tracking-[0.08em]"
                    style={{ color: C.inkMute, ...mono }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    color: st.ink,
                    background: st.soft,
                    border: `1px solid ${st.ink}`,
                    ...sans,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-6">
      <SectionHead nr="05" kicker="Acties · op urgentie" titel="Wat nu aandacht vraagt" />
      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.red;
          const soft = warn ? C.warnSoft : C.redSoft;
          return (
            <li key={a.titel}>
              <Panel className="p-6">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-[15px]"
                    style={{ background: soft, border: `1px solid ${tone}`, color: tone, ...mono }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: tone, border: `1px solid ${tone}`, ...sans }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Printer size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2
                      className="mt-2 text-[19px] leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft, ...serif }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; soft: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.ok, soft: C.okSoft, Icon: Check };
  return { ink: C.inkMute, soft: C.paperDeep, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead nr="06" kicker="Facturen · grootboek" titel="Facturen" />
        <PrimaryButton>
          <Plus size={13} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section
        className="grid grid-cols-1 gap-0 sm:grid-cols-3"
        style={{ border: `1px solid ${C.line}` }}
      >
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s, i) => (
          <div
            key={s.l}
            className="p-6"
            style={{
              background: C.panel,
              borderLeft: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
            }}
          >
            <div className="flex items-center justify-between">
              <SmallCaps>{s.l}</SmallCaps>
              {s.alarm && <AlertTriangle size={14} aria-hidden="true" style={{ color: C.warn }} />}
            </div>
            <p className="mt-2 text-[26px]" style={{ color: s.alarm ? C.warn : C.ink, ...serif }}>
              {s.v}
            </p>
            <p
              className="mt-1 text-[11px] uppercase tracking-[0.08em]"
              style={{ color: C.inkMute, ...mono }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <Panel>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px solid ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <SmallCaps key={h} className={i === 4 ? "text-right" : ""}>
              {h}
            </SmallCaps>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const ft = factuurTone(f.status);
            const acc = f.status === "Openstaand";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#f0ece2] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-semibold"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] sm:order-2"
                  style={{ color: C.ink, ...serif }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color: ft.ink,
                      background: ft.soft,
                      border: `1px solid ${ft.ink}`,
                      ...sans,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-semibold sm:order-5"
                  style={{ color: acc ? C.warn : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <SmallCaps>
            <span className="inline-flex items-center gap-2">
              <Check size={12} aria-hidden="true" style={{ color: C.ok }} /> Totaal betaald
            </span>
          </SmallCaps>
          <span className="text-[20px]" style={{ color: C.ink, ...serif }}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
