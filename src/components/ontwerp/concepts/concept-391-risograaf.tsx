"use client";

// Concept 391 — "Risograaf" · Duotone overprint & korrel.
// Riso-print esthetiek: twee spot-kleuren (fluor-roze #ff4d8d + federal-blue #2d3bdb) die overlappen
// tot een derde, donkere tint. Zichtbare korrel/halftone-raster, subtiele mis-registratie (1–2px
// offset op accenten), papier-wit (#f7f4ec). Speels-print maar strak en leesbaar. Fonts: Space Grotesk
// (koppen) + IBM Plex Mono (labels/cijfers), via generieke stacks — geen externe font-import nodig.

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
  CircleDot,
  Bell,
  Zap,
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

// — Palet: twee riso-spotkleuren + hun overprint-mix, op papier-wit —
const C = {
  paper: "#f7f4ec",
  paperAlt: "#efe9dc",
  card: "#fffdf7",
  ink: "#1c1834",
  inkSoft: "#3a3556",
  muted: "#6a6480",
  faint: "#9a94aa",
  pink: "#ff4d8d",
  pinkWash: "rgba(255,77,141,0.14)",
  blue: "#2d3bdb",
  blueWash: "rgba(45,59,219,0.13)",
  overprint: "#7a1f8f", // roze × blauw overlap-tint
  overWash: "rgba(122,31,143,0.12)",
  line: "rgba(28,24,52,0.16)",
  lineSoft: "rgba(28,24,52,0.09)",
  ok: "#1f7a56",
  okWash: "rgba(31,122,86,0.13)",
  warn: "#c24a12",
  warnWash: "rgba(194,74,18,0.14)",
  reject: "#c02637",
};

const head = { fontFamily: '"Space Grotesk", "Segoe UI", system-ui, sans-serif' };
const mono = { fontFamily: '"IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace' };

// — Gedeelde korrel/halftone-textuur als data-URI (SVG-ruis), voor de papier-look —
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="120" height="120" filter="url(#n)" opacity="0.5"/></svg>',
  );

function grainStyle(opacity = 0.16): React.CSSProperties {
  return {
    backgroundImage: `url("${GRAIN}")`,
    backgroundSize: "120px 120px",
    opacity,
    mixBlendMode: "multiply",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, tone: C.ok, wash: C.okWash };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.blue,
        wash: C.blueWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.reject,
        wash: "rgba(192,38,55,0.13)",
      };
  }
}

// — Riso-kaart: dikke inkt-omlijning + mis-registratie-schaduw (roze óf blauw offset 3px) —
function Riso({
  children,
  className = "",
  offset = "blue",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  offset?: "blue" | "pink" | "none";
  as?: "div" | "section" | "li";
}) {
  const shadowColor = offset === "pink" ? C.pink : offset === "blue" ? C.blue : "transparent";
  return (
    <Tag
      className={`relative rounded-[6px] ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${C.ink}`,
        boxShadow: offset === "none" ? "none" : `4px 4px 0 0 ${shadowColor}`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[5px]"
        style={grainStyle(0.12)}
      />
      <span className="relative block">{children}</span>
    </Tag>
  );
}

// — Mono-overline label —
function Overline({ children, tone = C.overprint }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...mono }}
    >
      {children}
    </p>
  );
}

// — Riso-chip; overprint-variant toont de overlap-mix —
function Chip({
  children,
  tone = C.ink,
  wash,
  bordered = true,
}: {
  children: React.ReactNode;
  tone?: string;
  wash?: string;
  bordered?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{
        color: tone,
        background: wash ?? "transparent",
        border: bordered ? `1.25px solid ${tone}` : "none",
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

// — Halftone-schijf met cijfer/icoon (spotkleur-vlak) —
function Dot({
  children,
  size = 44,
  tone = C.blue,
  outline = false,
}: {
  children: React.ReactNode;
  size?: number;
  tone?: string;
  outline?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: outline ? "transparent" : tone,
        color: outline ? tone : C.paper,
        border: `1.5px solid ${outline ? tone : C.ink}`,
      }}
      aria-hidden="true"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={grainStyle(0.18)}
      />
      <span className="relative">{children}</span>
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
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d3bdb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] active:translate-x-0 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 ${className}`}
      style={{
        color: C.paper,
        background: C.pink,
        border: `1.5px solid ${C.ink}`,
        boxShadow: `3px 3px 0 0 ${C.blue}`,
        ...mono,
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
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d3bdb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] ${className}`}
      style={{
        color: active ? C.paper : C.ink,
        background: active ? C.blue : "transparent",
        border: `1.5px solid ${C.ink}`,
        ...mono,
      }}
    >
      {children}
    </button>
  );
}

// — Halftone-sparkline: stippen-lijn i.p.v. gladde curve —
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 112;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
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
        strokeDasharray="1 3"
        strokeLinecap="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 2.6 : 1.6} fill={tone} />
      ))}
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2.5 w-16 overflow-hidden rounded-full"
        style={{ background: C.paperAlt, border: `1.25px solid ${C.ink}` }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: strong ? C.pink : C.blue,
          }}
        />
      </span>
      <span
        className="text-[13px] font-bold tabular-nums"
        style={{ color: strong ? C.pink : C.blue, ...mono }}
      >
        {value}%
      </span>
    </span>
  );
}

export function Concept391() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...mono, color: C.ink, background: C.paper }}
    >
      {/* Papier-korrel over het geheel */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={grainStyle(0.1)}
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
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-[6px]"
          style={{
            background: C.pink,
            color: C.paper,
            border: `1.5px solid ${C.ink}`,
            boxShadow: `2px 2px 0 0 ${C.blue}`,
          }}
          aria-hidden="true"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-[5px]"
            style={grainStyle(0.2)}
          />
          <Zap size={20} className="relative" />
        </span>
        <div>
          <p className="text-[20px] font-bold leading-none tracking-[-0.01em]" style={head}>
            Risograaf
          </p>
          <p
            className="mt-1 text-[10.5px] font-semibold uppercase leading-none tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Duotone · overprint · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] sm:inline-flex"
          style={{ color: C.ok, border: `1.25px solid ${C.ok}`, background: C.okWash }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[6px]"
          style={{ background: C.card, color: C.inkSoft, border: `1.5px solid ${C.ink}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="h-4.5 w-4.5 absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full px-1 text-[9px] font-bold"
              style={{ background: C.pink, color: C.paper, border: `1.25px solid ${C.ink}` }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.ink, ...head }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-[6px] text-[13px] font-bold"
          style={{ background: C.blue, color: C.paper, border: `1.5px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-[5px]"
            style={grainStyle(0.18)}
          />
          <span className="relative" style={mono}>
            {PROFIEL.initialen}
          </span>
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6">
      <div
        className="flex items-center gap-1.5 overflow-x-auto rounded-[6px] p-1.5"
        style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[4px] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d3bdb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9dc] motion-reduce:transition-none"
              style={{
                color: on ? C.paper : C.muted,
                background: on ? C.overprint : "transparent",
                border: on ? `1.5px solid ${C.ink}` : "1.5px solid transparent",
                ...mono,
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
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col justify-between gap-6">
          <div>
            <Overline>Vandaag · {PROFIEL.plaats}</Overline>
            <h1
              className="mt-4 text-[40px] font-bold leading-[1.0] tracking-[-0.02em] md:text-[52px]"
              style={head}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.pink }}>{PROFIEL.naam.split(" ")[0]}</span>
              <span style={{ color: C.blue }}>.</span>
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: C.muted }}>
              Twee inkten, één heldere blik. Wat telt drukt het hardst door; de rest zakt naar het
              papier. Dit vraagt nu je aandacht.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryButton onClick={onActies}>
                Volgende actie
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </PrimaryButton>
              <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
            </div>
          </div>
        </div>

        <Riso offset="pink" className="overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <Overline tone={C.warn}>Belangrijkste nu</Overline>
            <Dot size={38} tone={C.warn}>
              <AlertTriangle size={17} aria-hidden="true" />
            </Dot>
          </div>
          <h2 className="mt-4 text-[22px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Riso>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Geverifieerd profiel
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = i % 2 === 0 ? C.pink : C.blue;
            return (
              <Riso key={k.label} offset={i % 2 === 0 ? "blue" : "pink"} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{
                      color: k.up ? C.ok : C.warn,
                      background: k.up ? C.okWash : C.warnWash,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em]"
                  style={head}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Riso>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.overprint }}
          >
            Alles bekijken
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[6px] p-4 text-left transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d3bdb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ background: C.card, border: `1.5px solid ${C.ink}` }}
              >
                <Dot size={44} tone={o.match >= 90 ? C.pink : C.blue}>
                  <span className="text-[13px] font-bold tabular-nums" style={mono}>
                    {o.match}
                  </span>
                </Dot>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchMeter value={o.match} />
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
      </section>

      <section>
        <Overline>Certificaten</Overline>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            return (
              <Riso key={c.naam} offset="none" className="flex items-center gap-3 p-4">
                <Dot size={40} tone={st.tone} outline>
                  <st.Icon size={18} aria-hidden="true" />
                </Dot>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold" style={head}>
                    {c.naam}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Chip tone={st.tone} wash={st.wash} bordered>
                  <st.Icon size={11} aria-hidden="true" />
                  {st.label}
                  {st.alarm && <span className="sr-only"> (let op)</span>}
                </Chip>
              </Riso>
            );
          })}
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
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[6px] px-4 py-3"
          style={{ background: C.card, border: `1.5px solid ${C.ink}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#9a94aa]"
            style={{ color: C.ink, ...mono }}
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
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Riso offset="none" className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Dot size={64} tone={C.overprint} outline>
              <Search size={26} aria-hidden="true" />
            </Dot>
            <p className="mt-5 text-[22px] font-bold" style={head}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Riso>
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
    <Riso offset={strong ? "pink" : "blue"} className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Chip tone={C.faint}>#{String(index + 1).padStart(2, "0")}</Chip>
            <span
              className="truncate text-[11.5px] font-semibold"
              style={{ color: C.faint, ...mono }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t} tone={C.overprint} wash={C.overWash}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Dot size={54} tone={strong ? C.pink : C.blue}>
            <span className="text-[16px] font-bold tabular-nums" style={mono}>
              {opdracht.match}
            </span>
          </Dot>
          <span className="text-[14px] font-bold tabular-nums" style={{ color: C.ink, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            color: C.overprint,
            background: C.overWash,
            border: `1.25px solid ${C.overprint}`,
            ...mono,
          }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Pluspunten" tone={C.ok} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Riso>
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
    <div
      className="rounded-[6px] p-4"
      style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
    >
      <p
        className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: tone, ...mono }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
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
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.ink, background: C.card, border: `1.5px solid ${C.ink}`, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Riso offset="pink" className="overflow-hidden p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <Chip tone={C.faint}>{opdracht.id}</Chip>
          <Chip tone={strong ? C.pink : C.blue} wash={strong ? C.pinkWash : C.blueWash}>
            <CircleDot size={12} aria-hidden="true" /> {opdracht.match}% match
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Opdracht bewaren</GhostButton>
        </div>
      </Riso>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <Riso key={m.l} offset={i % 2 === 0 ? "blue" : "pink"} className="p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tabular-nums tracking-[-0.01em]"
              style={head}
            >
              {m.v}
            </p>
          </Riso>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Riso offset="none" className="p-5">
            <div className="flex items-center gap-2">
              <Dot size={34} tone={C.ok}>
                <Check size={16} aria-hidden="true" />
              </Dot>
              <p
                className="text-[12.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.ok, ...mono }}
              >
                Pluspunten
              </p>
            </div>
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
                    style={{ color: C.ok }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Riso>
          <Riso offset="none" className="p-5">
            <div className="flex items-center gap-2">
              <Dot size={34} tone={C.warn}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Dot>
              <p
                className="text-[12.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.warn, ...mono }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Riso>
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
      <Riso offset="pink" className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.02em]"
              style={head}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r={R} fill="none" stroke={C.paperAlt} strokeWidth="9" />
              <circle
                cx="48"
                cy="48"
                r={R}
                fill="none"
                stroke={C.overprint}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold tabular-nums leading-none" style={head}>
                {ratio}
              </span>
              <span
                className="text-[8.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Riso>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Riso offset="none" className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[5px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d3bdb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf7]"
                >
                  <Dot size={44} tone={st.tone} outline>
                    <st.Icon size={19} aria-hidden="true" />
                  </Dot>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-bold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Chip tone={st.tone} wash={st.wash}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Chip>
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
                        className="rounded-[6px] p-4"
                        style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
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
              </Riso>
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
        <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.blue;
          return (
            <li key={a.titel}>
              <Riso offset={warn ? "pink" : "blue"} className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <Dot size={48} tone={tone}>
                    <span className="text-[16px] font-bold tabular-nums" style={mono}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Dot>
                  <div className="min-w-0">
                    <Chip tone={tone} wash={warn ? C.warnWash : C.blueWash}>
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Zap size={11} aria-hidden="true" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </Chip>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug" style={head}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Riso>
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
          <h1 className="mt-3 text-[34px] font-bold leading-none tracking-[-0.02em]" style={head}>
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            tone: C.ok,
            alarm: false,
            off: "blue" as const,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            alarm: true,
            off: "pink" as const,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.blue,
            alarm: false,
            off: "blue" as const,
          },
        ].map((s) => (
          <Riso key={s.l} offset={s.off} className="p-5">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-bold tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px] font-semibold" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Riso>
        ))}
      </section>

      <Riso offset="none" className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1.5px solid ${C.ink}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[4px] px-1 py-3.5 transition-colors hover:bg-[#efe9dc] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] font-medium tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
                    style={{
                      color: acc ? C.warn : f.status === "Betaald" ? C.ok : C.muted,
                      background: acc ? C.warnWash : f.status === "Betaald" ? C.okWash : C.paperAlt,
                      border: `1.25px solid ${acc ? C.warn : f.status === "Betaald" ? C.ok : C.faint}`,
                      ...mono,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {f.status === "Betaald" && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold tabular-nums sm:order-5"
                  style={{ color: acc ? C.warn : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-bold tabular-nums" style={head}>
            {totaalBetaald}
          </span>
        </div>
      </Riso>
    </div>
  );
}
