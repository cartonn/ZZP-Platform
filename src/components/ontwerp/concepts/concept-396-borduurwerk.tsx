"use client";

// Concept 396 — "Borduurwerk" · Kruissteek & draad op aida-raster.
// Textiel-ambacht: een fijn stramien/aida-raster als achtergrond, kruissteek-motieven (kleine x-en
// via SVG), draad-kleuren op linnen, gestikte randen (dashed borders als "steken"). Warm en tactiel,
// maar ordelijk en rustig leesbaar. Palet: linnen #efe9dd met indigo #2b3a67, framboos #b13a5e,
// mosgroen #5b7a4a. Fonts: humanist sans + mono cijfers.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  Grid3x3,
  Sparkle,
  Bell,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: linnen basis met drie draad-kleuren —
const C = {
  linen: "#efe9dd",
  linenHi: "#f7f3ea",
  linenLo: "#e6dfcf",
  cloth: "#faf7f0",
  ink: "#2a2820",
  inkSoft: "#453f31",
  muted: "#756e5c",
  faint: "#a39a83",
  line: "rgba(42,40,32,0.12)",
  indigo: "#2b3a67",
  indigoBright: "#3f5390",
  indigoWash: "rgba(43,58,103,0.12)",
  berry: "#b13a5e",
  berryWash: "rgba(177,58,94,0.13)",
  moss: "#5b7a4a",
  mossWash: "rgba(91,122,74,0.15)",
  amber: "#a9772a",
  amberWash: "rgba(169,119,42,0.15)",
};

const sans = { fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif' };
const mono = {
  fontFamily: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace',
};

// — Aida-raster: fijn stramien als repeating gradient —
const AIDA = `repeating-linear-gradient(0deg, transparent 0 11px, rgba(42,40,32,0.05) 11px 12px), repeating-linear-gradient(90deg, transparent 0 11px, rgba(42,40,32,0.05) 11px 12px)`;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.moss,
        wash: C.mossWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.indigo,
        wash: C.indigoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.amber,
        wash: C.amberWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, tone: C.berry, wash: C.berryWash };
  }
}

// — Kruissteek-motief: rij kleine x-en (draad) —
function StitchRow({ tone, count = 9 }: { tone: string; count?: number }) {
  return (
    <svg
      width={count * 10}
      height="10"
      viewBox={`0 0 ${count * 10} 10`}
      aria-hidden="true"
      className="block"
    >
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} transform={`translate(${i * 10 + 1},1)`}>
          <line x1="0" y1="0" x2="8" y2="8" stroke={tone} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="8" y1="0" x2="0" y2="8" stroke={tone} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// — Enkel kruissteek-icoon (gevuld vlak met x) —
function Cross({
  size = 44,
  tone = C.indigo,
  soft = false,
}: {
  size?: number;
  tone?: string;
  soft?: boolean;
}) {
  const pad = size * 0.28;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        background: soft ? C.linen : tone,
        borderRadius: 6,
        border: soft ? `1.5px dashed ${tone}` : "none",
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line
          x1={pad}
          y1={pad}
          x2={size - pad}
          y2={size - pad}
          stroke={soft ? tone : "#fff"}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1={size - pad}
          y1={pad}
          x2={pad}
          y2={size - pad}
          stroke={soft ? tone : "#fff"}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// — Gestikt paneel: doek op linnen met dashed "steek"-rand —
function Panel({
  children,
  className = "",
  tone = C.line,
  aida = false,
  as: Wrap = "div",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
  aida?: boolean;
  as?: "div" | "section" | "li" | "article";
}) {
  return (
    <Wrap
      className={`relative ${className}`}
      style={{
        background: C.cloth,
        border: `1.5px dashed ${tone}`,
        borderRadius: 10,
        boxShadow: "0 2px 0 rgba(42,40,32,0.05)",
      }}
    >
      {aida && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[9px]"
          style={{ backgroundImage: AIDA, backgroundPosition: "center", opacity: 0.6 }}
        />
      )}
      <span className="relative block">{children}</span>
    </Wrap>
  );
}

function Overline({ children, tone = C.indigo }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </p>
  );
}

function Tag({
  children,
  tone = C.muted,
  wash,
  filled = false,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold"
      style={{
        color: filled ? "#fff" : tone,
        background: filled ? tone : (wash ?? "transparent"),
        border: `1.25px dashed ${filled ? tone : tone}`,
        borderRadius: 5,
        ...sans,
      }}
    >
      {children}
    </span>
  );
}

function PrimaryBtn({
  children,
  onClick,
  className = "",
  tone = C.indigo,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: "#fff",
        background: tone,
        borderRadius: 8,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.inkSoft,
        background: active ? C.indigo : C.cloth,
        border: `1.5px dashed ${active ? C.indigo : C.line}`,
        borderRadius: 8,
        ...sans,
      }}
    >
      {children}
    </button>
  );
}

function Spark({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.75"
        strokeDasharray="3 2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        id={`bd-${id}`}
      />
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <line x1="-2" y1="-2" x2="2" y2="2" stroke={tone} strokeWidth="1.4" />
          <line x1="2" y1="-2" x2="-2" y2="2" stroke={tone} strokeWidth="1.4" />
        </g>
      ))}
      {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill={tone} />}
    </svg>
  );
}

function MatchBar({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2.5 w-16 overflow-hidden"
        style={{ background: C.linenLo, borderRadius: 3, border: `1px dashed ${C.line}` }}
      >
        <span
          className="block h-full"
          style={{ width: `${value}%`, background: strong ? C.moss : C.amber, borderRadius: 3 }}
        />
      </span>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: strong ? C.moss : C.muted, ...mono }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept396() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.linen }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: AIDA, opacity: 0.5 }}
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-7">
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
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="flex items-center justify-between gap-4 pt-7">
      <div className="flex items-center gap-3.5">
        <Cross size={46} tone={C.indigo} />
        <div>
          <p className="text-[19px] font-bold leading-none tracking-[-0.01em]" style={sans}>
            Borduurwerk
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-none" style={{ color: C.faint }}>
            Tactiel · ordelijk · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{
            color: C.moss,
            background: C.mossWash,
            border: `1.25px dashed ${C.moss}`,
            borderRadius: 5,
          }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{
            background: C.cloth,
            color: C.muted,
            border: `1.5px dashed ${C.line}`,
            borderRadius: 8,
          }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center text-[9px] font-bold text-white"
              style={{ background: C.berry, borderRadius: 4 }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.inkSoft }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px] font-semibold" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-bold"
          style={{ background: C.indigo, color: "#fff", borderRadius: 8, ...mono }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1 overflow-x-auto p-1.5"
        style={{ background: C.cloth, border: `1.5px dashed ${C.line}`, borderRadius: 10 }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f0] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.muted,
                background: on ? C.indigo : "transparent",
                borderRadius: 7,
                ...sans,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col justify-center">
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[38px] font-bold leading-[1.02] tracking-[-0.02em] md:text-[46px]"
            style={sans}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <div className="mt-3">
            <StitchRow tone={C.berry} count={12} />
          </div>
          <p className="mt-4 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
            Steek voor steek bijgehouden: alles wat telt staat vooraan, de rest ligt netjes in het
            stramien. Dit vraagt nu je aandacht.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryBtn onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryBtn>
            <GhostBtn onClick={onOpen}>Bekijk marktplaats</GhostBtn>
          </div>
        </div>

        <Panel aida tone={C.berry} className="p-6">
          <div className="flex items-center justify-between">
            <Overline tone={C.berry}>Belangrijkste nu</Overline>
            <Cross size={38} tone={C.berry} />
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em]" style={sans}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryBtn onClick={onActies} tone={C.berry} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryBtn>
          </div>
        </Panel>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span className="text-[11.5px] font-semibold" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [C.indigo, C.berry, C.moss, C.amber][i % 4] as string;
            return (
              <Panel key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-[10.5px] font-bold tabular-nums"
                    style={{
                      color: k.up ? C.moss : C.berry,
                      background: k.up ? C.mossWash : C.berryWash,
                      borderRadius: 4,
                      ...mono,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[29px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={mono}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} id={`kpi-${i}`} />
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Overline>Open opdrachten</Overline>
            <button
              type="button"
              onClick={onOpen}
              className="text-[12px] font-bold transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd]"
              style={{ color: C.indigo }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  style={{
                    background: C.cloth,
                    border: `1.5px dashed ${C.line}`,
                    borderRadius: 10,
                  }}
                >
                  <Cross size={44} tone={i === 0 ? C.indigo : C.moss} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold" style={sans}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[12.5px]"
                      style={{ color: C.muted }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchBar value={o.match} />
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.faint }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-4">
            <Overline>Certificaten</Overline>
          </div>
          <Panel aida className="p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] font-bold" style={sans}>
                {verified} van {CREDENTIALS.length} geverifieerd
              </p>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: C.moss, ...mono }}
              >
                {Math.round((verified / CREDENTIALS.length) * 100)}%
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-3">
                    <Cross size={34} tone={st.tone} soft />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold" style={sans}>
                        {c.naam}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.faint }}>
                        {c.detail}
                      </span>
                    </span>
                    <Tag tone={st.tone} wash={st.wash}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Tag>
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
    <div className="space-y-7">
      <div>
        <Overline>De marktplaats</Overline>
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
          Open opdrachten
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{ background: C.cloth, border: `1.5px dashed ${C.line}`, borderRadius: 8 }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] font-medium outline-none placeholder:text-[#a39a83]"
            style={{ color: C.ink, ...sans }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostBtn
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostBtn>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel aida className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Cross size={64} tone={C.indigo} soft />
            <p className="mt-5 text-[22px] font-bold" style={sans}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryBtn onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryBtn>
            </div>
          </div>
        </Panel>
      ) : (
        <ul className="space-y-4">
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
    <Panel aida={index === 0} tone={index === 0 ? C.indigo : C.line} className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Tag tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Tag>
            <span
              className="truncate text-[12px] font-semibold tabular-nums"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[18.5px] font-bold leading-snug tracking-[-0.01em]" style={sans}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t} tone={C.indigo} wash={C.indigoWash}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="inline-flex h-14 w-14 items-center justify-center text-[16px] font-bold tabular-nums"
            style={{
              background: strong ? C.indigo : C.moss,
              color: "#fff",
              borderRadius: 8,
              ...mono,
            }}
            aria-hidden="true"
          >
            {opdracht.match}
          </span>
          <span
            className="text-[14px] font-bold tabular-nums"
            style={{ color: C.inkSoft, ...mono }}
          >
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f0]"
          style={{ color: C.indigo, background: C.indigoWash, borderRadius: 6 }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryBtn onClick={onOpen} tone={C.moss}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryBtn>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="Pluspunten"
              tone={C.moss}
              wash={C.mossWash}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.amber}
              wash={C.amberWash}
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
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="p-4"
      style={{ background: wash, border: `1.25px dashed ${tone}`, borderRadius: 8 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: tone }}>
          {titel}
        </p>
        <StitchRow tone={tone} count={5} />
      </div>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
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
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-7">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12.5px] font-bold transition-all hover:-translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dd] motion-reduce:transition-none motion-reduce:hover:translate-x-0"
        style={{
          color: C.inkSoft,
          background: C.cloth,
          border: `1.5px dashed ${C.line}`,
          borderRadius: 8,
        }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Panel aida tone={C.indigo} className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <Tag tone={C.faint}>{opdracht.id}</Tag>
          <Tag tone={strong ? C.indigo : C.moss} filled>
            <Sparkle size={12} aria-hidden="true" /> {opdracht.match}% match
          </Tag>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[42px]"
          style={sans}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[15px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-4">
          <StitchRow tone={C.berry} count={14} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryBtn tone={C.moss}>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryBtn>
          <GhostBtn>Opdracht bewaren</GhostBtn>
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]"
              style={mono}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Cross size={34} tone={C.moss} />
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.moss }}
              >
                Pluspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.moss }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Cross size={34} tone={C.amber} />
              <p
                className="text-[13px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.amber }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px]"
                  style={{ color: C.muted }}
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
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const R = 34;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-7">
      <Panel aida tone={C.indigo} className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em]"
              style={sans}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 92, height: 92 }}>
            <svg width={92} height={92} viewBox="0 0 92 92" aria-hidden="true">
              <circle cx="46" cy="46" r={R} fill="none" stroke={C.linenLo} strokeWidth="9" />
              <circle
                cx="46"
                cy="46"
                r={R}
                fill="none"
                stroke={C.moss}
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDasharray="4 3"
                transform="rotate(-90 46 46)"
                style={{ strokeDashoffset: 0, opacity: 0.35 }}
              />
              <circle
                cx="46"
                cy="46"
                r={R}
                fill="none"
                stroke={C.moss}
                strokeWidth="9"
                strokeLinecap="butt"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 46 46)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold tabular-nums leading-none" style={mono}>
                {ratio}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Panel className="p-5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2b3a67] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f0]"
                  style={{ borderRadius: 8 }}
                >
                  <Cross size={44} tone={st.tone} soft />
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-bold" style={sans}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag tone={st.tone} wash={st.wash}>
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Tag>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 pl-[60px]">
                      <div
                        className="p-4"
                        style={{
                          background: st.wash,
                          border: `1.25px dashed ${st.tone}`,
                          borderRadius: 8,
                        }}
                      >
                        <p
                          className="max-w-xl text-[13.5px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryBtn tone={st.tone}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryBtn>
                          <GhostBtn>Historie</GhostBtn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline>Volgende acties</Overline>
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[14px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.berry : C.indigo;
          const wash = warn ? C.berryWash : C.indigoWash;
          return (
            <li key={a.titel}>
              <Panel aida={warn} tone={warn ? C.berry : C.line} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{
                      background: wash,
                      color: tone,
                      border: `1.5px dashed ${tone}`,
                      borderRadius: 8,
                      ...mono,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: tone, background: wash, borderRadius: 4 }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Grid3x3 size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug" style={sans}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryBtn tone={tone}>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryBtn>
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

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={sans}>
            Facturen
          </h1>
        </div>
        <PrimaryBtn tone={C.moss}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryBtn>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", tone: C.moss, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.berry, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.indigo, alarm: false },
        ].map((s) => (
          <Panel key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[11px] font-bold uppercase tracking-[0.05em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center"
                  style={{ background: C.berryWash, color: C.berry, borderRadius: 5 }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.berry : C.ink, ...mono }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1.5px dashed ${C.line}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const paid = f.status === "Betaald";
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition-colors hover:bg-[#f2ecdf] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1.25px dashed ${C.line}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14.5px] font-bold sm:order-2"
                  style={sans}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11.5px] font-bold"
                    style={{
                      color: acc ? C.berry : paid ? C.moss : C.muted,
                      background: acc ? C.berryWash : paid ? C.mossWash : C.linenLo,
                      border: `1.25px dashed ${acc ? C.berry : paid ? C.moss : C.faint}`,
                      borderRadius: 5,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {paid && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.berry : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-bold tabular-nums" style={mono}>
            {totaalBetaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
