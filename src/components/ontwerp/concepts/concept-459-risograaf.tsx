"use client";

// Concept 459 — "Risograaf" · Risograph-overdruk met spot-inkten & halftone-korrel.
// Twee spot-inkten die overdrukken — fluor-roze #ff4f79 + inkt-blauw #2340d0 (soms geel) — over een
// mat, warm gerecycled-papier grond (#f3efe4). Zichtbare halftone-rasterpunten, lichte
// mis-registratie (kanalen net verschoven voor speels print-craft), overprint-multiply waar twee
// inkten elkaar raken. Bold en energiek, maar geordend: body-tekst blijft helder, korrel subtiel.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Droplet,
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

// — Palet: spot-inkten op gerecycled papier —
const C = {
  paper: "#f3efe4",
  paperDeep: "#e9e3d3",
  card: "#faf7ee",
  cardSoft: "#f0ebdd",
  ink: "#1d1b16", // bijna-zwart schrijfinkt
  inkSoft: "#4a463c",
  inkMute: "#78725f",
  inkFaint: "#a49c85",
  line: "#d8d0bc",
  lineSoft: "#e4dccb",
  // spot-inkten
  pink: "#ff4f79",
  pinkDeep: "#e0325c",
  pinkWash: "rgba(255,79,121,0.14)",
  blue: "#2340d0",
  blueDeep: "#1a30a6",
  blueWash: "rgba(35,64,208,0.13)",
  yellow: "#f5b915",
  yellowWash: "rgba(245,185,21,0.18)",
  // overprint (multiply van roze + blauw ≈ diep paars)
  over: "#7b2ea8",
  // status
  ok: "#2340d0", // geverifieerd draagt de blauwe inkt
  okWash: "rgba(35,64,208,0.13)",
  warn: "#e0791a",
  warnWash: "rgba(224,121,26,0.16)",
  bad: "#e0325c",
  badWash: "rgba(224,50,92,0.15)",
  info: "#6b6555",
  infoWash: "rgba(107,101,85,0.12)",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Halftone-korrel: fijne rasterpunten in een spot-inkt, subtiel over een grond.
function halftone(color: string, size = 4, alpha = 0.1): React.CSSProperties {
  const rgba = color;
  return {
    backgroundImage: `radial-gradient(${rgba} 0.9px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity: alpha,
  };
}

// Papiergrond met een subtiele dubbel-inkt halftone waas.
function paperBg(base: string): React.CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage:
      "radial-gradient(rgba(35,64,208,0.05) 0.8px, transparent 1px)," +
      "radial-gradient(rgba(255,79,121,0.05) 0.8px, transparent 1px)",
    backgroundSize: "5px 5px, 5px 5px",
    backgroundPosition: "0 0, 2px 2px",
  };
}

// Mis-registratie-kop: twee spot-inkt-kopieën net verschoven achter de zwarte inkt.
function RisoHead({
  children,
  className = "",
  style,
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3" | "span";
}) {
  return (
    <Tag className={`relative inline-block ${className}`} style={style}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        style={{
          left: "-1.5px",
          top: "1px",
          color: C.pink,
          opacity: 0.55,
          mixBlendMode: "multiply",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        style={{
          left: "1.5px",
          top: "-1px",
          color: C.blue,
          opacity: 0.45,
          mixBlendMode: "multiply",
        }}
      >
        {children}
      </span>
      <span className="relative" style={{ color: C.ink }}>
        {children}
      </span>
    </Tag>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.blue,
        wash: C.blueWash,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.info, wash: C.infoWash };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warn,
        wash: C.warnWash,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: C.bad, wash: C.badWash };
  }
}

// — Kaart met inkt-hairline + halftone-hoek —
function Card({
  children,
  className = "",
  as: Tag = "div",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tone?: string;
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-[3px] ${className}`}
      style={{
        background: C.card,
        border: `1.5px solid ${C.ink}`,
        boxShadow: tone ? `3px 3px 0 ${tone}` : "2px 2px 0 rgba(29,27,22,0.14)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.pinkDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: "#fff", background: tone, ...bodyFont }}
    >
      <Droplet size={11} aria-hidden="true" />
      {children}
    </p>
  );
}

function InkButton({
  children,
  onClick,
  tone = C.pink,
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
      className={`group inline-flex items-center justify-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-bold transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4] active:translate-y-0 active:shadow-none motion-reduce:transition-none ${className}`}
      style={{
        color: "#fff",
        background: tone,
        border: `1.5px solid ${C.ink}`,
        boxShadow: `2px 2px 0 ${C.ink}`,
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
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[12.5px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? "#fff" : C.ink,
        background: active ? C.blue : C.card,
        border: `1.5px solid ${C.ink}`,
        boxShadow: active ? `2px 2px 0 ${C.ink}` : "none",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Spot-inkt sparkline met halftone-vulling —
function InkLine({ data, tone, id }: { data: number[]; tone: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 10) - 5;
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
      <defs>
        <pattern id={`ht-${id}`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={tone} opacity="0.4" />
        </pattern>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#ht-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={C.paper} stroke={tone} strokeWidth="2" />
    </svg>
  );
}

// — Match-meter als halftone-balk —
function Meter({ value, tone = C.pink }: { value: number; tone?: string }) {
  return (
    <span className="hidden items-center gap-2.5 sm:flex" aria-hidden="true">
      <span
        className="relative h-2.5 w-24 overflow-hidden rounded-[2px]"
        style={{ background: C.paperDeep, border: `1px solid ${C.line}` }}
      >
        <span
          className="block h-full"
          style={{
            width: `${value}%`,
            background: tone,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </span>
      <span className="text-[12.5px] font-bold" style={{ color: tone, ...num }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept459() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, ...paperBg(C.paper) }}
    >
      <style>{`
        @keyframes risoRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .riso-rise { animation: risoRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .riso-rise { animation: none !important; } }
      `}</style>

      {/* korrel-waas over de hele achtergrond */}
      <span
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={halftone(C.blue, 4, 0.05)}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="riso-rise pt-7">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-center gap-3.5">
        <span
          className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[4px]"
          style={{
            background: C.pink,
            border: `1.5px solid ${C.ink}`,
            boxShadow: `2px 2px 0 ${C.blue}`,
          }}
          aria-hidden="true"
        >
          <span className="absolute inset-0" style={halftone("#fff", 3, 0.3)} />
          <Printer size={22} color="#fff" strokeWidth={2.4} />
        </span>
        <div>
          <RisoHead as="span" className="text-[20px] font-extrabold leading-none tracking-tight">
            Risograaf
          </RisoHead>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.plaats} · spot-inkt editie
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: "#fff", background: C.blue, border: `1.5px solid ${C.ink}`, ...bodyFont }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-[3px]"
          style={{ background: C.card, border: `1.5px solid ${C.ink}`, color: C.ink }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="h-4.5 w-4.5 absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full px-1 text-[9px] font-extrabold"
              style={{ background: C.pink, color: "#fff", border: `1px solid ${C.ink}`, ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.ink, ...bodyFont }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...bodyFont }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] text-[13px] font-extrabold"
          style={{
            background: C.yellow,
            border: `1.5px solid ${C.ink}`,
            color: C.ink,
            ...bodyFont,
          }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-[3px] px-4 py-2 text-[12.5px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4] motion-reduce:transition-none"
              style={{
                color: on ? "#fff" : C.ink,
                background: on ? C.pink : C.card,
                border: `1.5px solid ${C.ink}`,
                boxShadow: on ? `2px 2px 0 ${C.blue}` : "none",
                ...bodyFont,
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
    <div className="space-y-7">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-7 md:p-9" tone={C.blue}>
          <span
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            aria-hidden="true"
            style={{ background: C.pink, ...halftone("#fff", 5, 1), opacity: 0.14 }}
          />
          <Eyebrow>Vandaag · vers van de pers</Eyebrow>
          <RisoHead
            as="h1"
            className="mt-4 text-[32px] font-extrabold leading-[1.05] tracking-[-0.02em] md:text-[44px]"
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </RisoHead>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je praktijk als een strak overdruk-vel: elke laag verifieerbaar, helder gezet, in
            register. Loop je acties langs — alles ligt op de juiste kleur.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <InkButton onClick={onActies} tone={C.pink}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </InkButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </Card>

        <Card className="p-7" tone={C.warn}>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.warn}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.warn }} />
          </div>
          <RisoHead as="h2" className="mt-4 text-[20px] font-extrabold leading-snug">
            {primair.titel}
          </RisoHead>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-6">
            <InkButton onClick={onActies} tone={C.warn} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </InkButton>
          </div>
          <p
            className="mt-5 flex items-center gap-2 border-t pt-4 text-[12px]"
            style={{ color: C.inkMute, borderColor: C.lineSoft, ...num }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.blue }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Card>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow tone={C.blue}>Oplage · deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = i % 2 === 0 ? C.pink : C.blue;
            return (
              <Card key={k.label} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: C.inkMute, ...bodyFont }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-[2px] px-1.5 py-0.5 text-[9.5px] font-extrabold"
                    style={{ color: "#fff", background: k.up ? C.blue : C.warn, ...num }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[27px] font-extrabold leading-none tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <InkLine data={k.spark} tone={tone} id={`k459-${i}`} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Open opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4]"
              style={{ color: C.pinkDeep, ...bodyFont }}
            >
              Alle →
            </button>
          </div>
          <Card>
            <ul>
              {OPDRACHTEN.map((o, i) => {
                const tone = o.match >= 90 ? C.pink : C.blue;
                return (
                  <li
                    key={o.id}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <button
                      type="button"
                      onClick={onOpen}
                      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f0ebdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d1b16] motion-reduce:transition-none"
                    >
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-[4px]"
                        style={{ background: tone, border: `1.5px solid ${C.ink}`, color: "#fff" }}
                      >
                        <span className="text-[13px] font-extrabold leading-none" style={num}>
                          {o.match}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block truncate text-[15px] font-bold"
                          style={{ color: C.ink, ...bodyFont }}
                        >
                          {o.titel}
                        </span>
                        <span
                          className="mt-0.5 block truncate text-[12px]"
                          style={{ color: C.inkMute }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Meter value={o.match} tone={tone} />
                        <ChevronRight
                          size={17}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                          style={{ color: C.inkFaint }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow tone={C.blue}>Certificaten</Eyebrow>
          </div>
          <Card className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[4px]"
                      style={{
                        background: st.wash,
                        border: `1.5px solid ${st.ink}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[12.5px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
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
    <div className="space-y-7">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <RisoHead
          as="h1"
          className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
        >
          Open opdrachten
        </RisoHead>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten beschikbaar
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[3px] px-4 py-3"
          style={{ background: C.card, border: `1.5px solid ${C.ink}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#a49c85]"
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
              {s === "match" ? "Beste match" : "Tarief"}
            </GhostButton>
          ))}
          <GhostButton onClick={() => setLoading((v) => !v)} active={loading} ariaPressed={loading}>
            {loading ? "Stop" : "Laden…"}
          </GhostButton>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="p-6">
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div className="h-3 w-24 rounded-[2px]" style={{ background: C.paperDeep }} />
                  <div className="h-5 w-2/3 rounded-[2px]" style={{ background: C.cardSoft }} />
                  <div className="h-3 w-1/2 rounded-[2px]" style={{ background: C.paperDeep }} />
                  <div className="h-2.5 w-full rounded-[2px]" style={{ background: C.paperDeep }} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-[6px]"
              style={{ background: C.blueWash, border: `1.5px solid ${C.blue}`, color: C.blue }}
              aria-hidden="true"
            >
              <Search size={26} />
            </span>
            <RisoHead as="h2" className="mt-5 text-[22px] font-extrabold">
              Leeg drukvel
            </RisoHead>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en trek een
              nieuwe afdruk.
            </p>
            <div className="mt-6">
              <InkButton onClick={() => setQ("")} tone={C.pink}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </InkButton>
            </div>
          </div>
        </Card>
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
  const tone = strong ? C.pink : C.blue;
  return (
    <Card className="p-6" tone={tone}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: C.ink, border: `1.5px solid ${C.ink}`, ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <RisoHead as="h3" className="mt-2 text-[19px] font-extrabold leading-snug">
            {opdracht.titel}
          </RisoHead>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-[2px] px-2.5 py-0.5 text-[10.5px] font-bold"
                style={{
                  color: C.ink,
                  background: C.yellowWash,
                  border: `1px solid ${C.line}`,
                  ...bodyFont,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="relative inline-flex h-16 w-16 items-center justify-center rounded-[6px]"
            style={{
              background: tone,
              border: `1.5px solid ${C.ink}`,
              boxShadow: `2px 2px 0 ${C.ink}`,
            }}
          >
            <span className="absolute inset-0 rounded-[5px]" style={halftone("#fff", 4, 0.28)} />
            <span className="relative flex flex-col items-center">
              <span
                className="text-[17px] font-extrabold leading-none"
                style={{ color: "#fff", ...num }}
              >
                {opdracht.match}
              </span>
              <span
                className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "rgba(255,255,255,0.85)", ...bodyFont }}
              >
                match
              </span>
            </span>
          </span>
          <span className="text-[13px] font-extrabold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-1.5 text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7ee]"
          style={{ color: C.ink, border: `1.5px solid ${C.ink}`, ...bodyFont }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <InkButton onClick={onOpen} tone={tone}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </InkButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Voor jou" tone={C.blue} Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Let op"
              tone={C.warn}
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
      className="rounded-[3px] p-4"
      style={{ background: C.cardSoft, border: `1.5px solid ${tone}` }}
    >
      <p
        className="inline-flex items-center gap-1.5 rounded-[2px] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em]"
        style={{ color: "#fff", background: tone, ...bodyFont }}
      >
        <Icon size={11} aria-hidden="true" />
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
  const tone = strong ? C.pink : C.blue;
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4]"
        style={{ color: C.ink, border: `1.5px solid ${C.ink}`, background: C.card, ...bodyFont }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="p-7 md:p-9" tone={tone}>
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full"
          aria-hidden="true"
          style={{ background: tone, opacity: 0.12 }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-[2px] px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.ink, border: `1.5px solid ${C.ink}`, ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-[2px] px-2.5 py-0.5 text-[11px] font-extrabold"
            style={{ color: "#fff", background: tone, ...bodyFont }}
          >
            <Printer size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <RisoHead
          as="h1"
          className="mt-4 max-w-2xl text-[30px] font-extrabold leading-[1.06] tracking-[-0.02em] md:text-[42px]"
        >
          {opdracht.titel}
        </RisoHead>
        <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <InkButton tone={C.pink}>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </InkButton>
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
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-extrabold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-extrabold tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgelezen van je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant en zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6" tone={C.blue}>
            <p
              className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: "#fff", background: C.blue, ...bodyFont }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
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
                    style={{ color: C.blue }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6" tone={C.warn}>
            <p
              className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em]"
              style={{ color: "#fff", background: C.warn, ...bodyFont }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
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
                    style={{ color: C.warn }}
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
    <div className="space-y-6">
      <Card className="p-7 md:p-9" tone={C.blue}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie · veilig bewaard</Eyebrow>
            <RisoHead
              as="h1"
              className="mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.01em]"
            >
              Jouw certificaten
            </RisoHead>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-extrabold" style={{ color: C.blue }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
            <div className="mt-4 max-w-xs">
              <Meter value={ratio} tone={C.blue} />
            </div>
          </div>
          <span
            className="relative inline-flex h-24 w-24 items-center justify-center rounded-[8px]"
            style={{
              background: C.blue,
              border: `1.5px solid ${C.ink}`,
              boxShadow: `3px 3px 0 ${C.pink}`,
            }}
          >
            <span className="absolute inset-0 rounded-[7px]" style={halftone("#fff", 5, 0.25)} />
            <span className="relative flex flex-col items-center">
              <span
                className="text-[26px] font-extrabold leading-none"
                style={{ color: "#fff", ...num }}
              >
                {ratio}
              </span>
              <span
                className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "rgba(255,255,255,0.85)", ...bodyFont }}
              >
                % op orde
              </span>
            </span>
          </span>
        </div>
      </Card>

      <Card>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1.5px solid ${C.ink}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              {h}
            </span>
          ))}
        </div>
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
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#f0ebdd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1d1b16] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[4px]"
                      style={{
                        background: st.wash,
                        border: `1.5px solid ${st.ink}`,
                        color: st.ink,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink, ...bodyFont }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                  </span>
                  <span className="hidden sm:flex">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-bold"
                      style={{ color: "#fff", background: st.ink, ...bodyFont }}
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
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 sm:pl-[76px]">
                      <div
                        className="rounded-[3px] p-4"
                        style={{ background: C.cardSoft, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <InkButton tone={c.status === "EXPIRING" ? C.warn : C.blue}>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </InkButton>
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
        <div className="mb-4">
          <Eyebrow tone={C.blue}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Card key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[4px]"
                  style={{ background: C.cardSoft, border: `1.5px solid ${C.ink}`, color: C.ink }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
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
                  className="inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-[10px] font-bold"
                  style={{ color: "#fff", background: st.ink }}
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
    <div className="space-y-6">
      <div>
        <Eyebrow>Acties · op volgorde van urgentie</Eyebrow>
        <RisoHead
          as="h1"
          className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
        >
          Wat nu aandacht vraagt
        </RisoHead>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden — zo blijf je verifieerbaar en betaald, in register.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.pink;
          return (
            <li key={a.titel}>
              <Card className="p-6" tone={tone}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-[4px] text-[15px] font-extrabold"
                    style={{
                      background: tone,
                      border: `1.5px solid ${C.ink}`,
                      color: "#fff",
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
                      style={{ color: "#fff", background: tone, ...bodyFont }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} aria-hidden="true" />
                      ) : (
                        <Droplet size={10} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <RisoHead as="h2" className="mt-2 text-[19px] font-extrabold leading-snug">
                      {a.titel}
                    </RisoHead>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <InkButton tone={tone}>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </InkButton>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): { ink: string; Icon: LucideIcon | null } {
  if (status === "Openstaand") return { ink: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.blue, Icon: Check };
  return { ink: C.info, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <RisoHead
            as="h1"
            className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
          >
            Facturen
          </RisoHead>
        </div>
        <InkButton tone={C.pink}>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </InkButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false, tone: C.blue },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true, tone: C.warn },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false, tone: C.info },
        ].map((s) => (
          <Card key={s.l} className="p-6" tone={s.tone}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-[3px]"
                  style={{ background: C.warnWash, color: C.warn }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-extrabold tracking-[-0.01em]"
              style={{ color: s.alarm ? C.warn : C.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            <div
              className="grid grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5"
              style={{ borderBottom: `1.5px solid ${C.ink}` }}
            >
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <span
                  key={h}
                  className={`text-[9.5px] font-extrabold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  {h}
                </span>
              ))}
            </div>
            <ul>
              {FACTUREN.map((f, i) => {
                const ft = factuurTone(f.status);
                const acc = f.status === "Openstaand";
                return (
                  <li
                    key={f.nr}
                    className="grid grid-cols-[8rem_1fr_5rem_9rem_6rem] items-center gap-4 px-6 py-4 transition-colors hover:bg-[#f0ebdd]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span className="text-[11.5px] font-bold" style={{ color: C.inkMute, ...num }}>
                      {f.nr}
                    </span>
                    <span
                      className="min-w-0 truncate text-[14px] font-bold"
                      style={{ color: C.ink, ...bodyFont }}
                    >
                      {f.klant}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </span>
                    <span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10.5px] font-bold"
                        style={{ color: "#fff", background: ft.ink, ...bodyFont }}
                      >
                        {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                        {f.status}
                      </span>
                    </span>
                    <span
                      className="text-right text-[14px] font-extrabold"
                      style={{ color: acc ? C.warn : C.ink, ...num }}
                    >
                      {f.bedrag}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div
              className="flex items-baseline justify-between px-6 py-4"
              style={{ borderTop: `1.5px solid ${C.ink}` }}
            >
              <span
                className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em]"
                style={{ color: C.inkMute, ...bodyFont }}
              >
                <Check size={12} aria-hidden="true" style={{ color: C.blue }} /> Totaal betaald
              </span>
              <span className="text-[20px] font-extrabold" style={{ color: C.ink, ...num }}>
                {totaalBetaald}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
