"use client";

// Concept 422 — "Plakblok" · tactiele plaknotities (warm-speels).
// Warme bureau-/prikbord-esthetiek: next-actions en matches als sticky notes in zachte gele/perzik/
// mint-tinten, elk met een minieme rotatie (±1-2°) en zachte slagschaduw op een warm linnen/kurk-
// oppervlak. Bold schreefloze "handschrift"-koppen, maar altijd leesbaar. Speels maar strak; knoppen
// zien er indrukbaar uit. Facturen/verificatie zijn strakkere notitie-index-kaarten. Accent marker-
// oranje #e8590c, achtergrond #f7f4ec, ink #2a2620. Motion-reduce-respect, aria/focus, Nederlands.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Minus,
  Paperclip,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  StickyNote,
  Wind,
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

// — Palet: warm linnen/kurk, marker-oranje, notitie-tinten geel/perzik/mint —
const C = {
  bg: "#f7f4ec",
  bgDeep: "#efe9db",
  cork: "#e7dcc4",
  paper: "#fffdf7",
  paperSoft: "#faf6ec",
  raise: "#f2ece0",
  ink: "#2a2620",
  inkSoft: "#4f473b",
  inkMute: "#7d7362",
  inkFaint: "#a89c86",
  line: "rgba(42,38,32,0.12)",
  lineSoft: "rgba(42,38,32,0.07)",
  marker: "#e8590c",
  markerHi: "#f56a1e",
  markerDeep: "#c14608",
  markerWash: "rgba(232,89,12,0.12)",
  // notitie-tinten
  geel: "#fde9a8",
  geelInk: "#8a6a12",
  perzik: "#ffd9c2",
  perzikInk: "#a85a2e",
  mint: "#cdead0",
  mintInk: "#3f7a4c",
  lila: "#e2d6f2",
  lilaInk: "#6a4f9c",
  ok: "#4f9a5f",
  okInk: "#3a7346",
  okWash: "rgba(79,154,95,0.14)",
  warn: "#d98a1f",
  warnInk: "#a5680f",
  warnWash: "rgba(217,138,31,0.16)",
  info: "#e8590c",
  infoInk: "#c14608",
  infoWash: "rgba(232,89,12,0.12)",
  bad: "#cf5340",
  badInk: "#a53a29",
  badWash: "rgba(207,83,64,0.16)",
};

const hand = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  letterSpacing: "-0.015em",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', ui-monospace, SFMono-Regular, Menlo, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

// Zachte papier-vezel textuur voor het kurk-oppervlak.
const FIBER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#f)' opacity='0.6'/></svg>",
  );

const NOTE_TINTS = [
  { bg: C.geel, ink: C.geelInk },
  { bg: C.perzik, ink: C.perzikInk },
  { bg: C.mint, ink: C.mintInk },
  { bg: C.lila, ink: C.lilaInk },
];

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.ok,
        ink: C.okInk,
        wash: C.okWash,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.info,
        ink: C.infoInk,
        wash: C.infoWash,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.warn,
        ink: C.warnInk,
        wash: C.warnWash,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.bad,
        ink: C.badInk,
        wash: C.badWash,
      };
  }
}

// — Sticky note: gekleurde plaknotitie met rotatie, zachte slagschaduw en optioneel plak-punaise —
function Note({
  children,
  className = "",
  tint,
  rotate = 0,
  pin = false,
  tape = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  tint: { bg: string; ink: string };
  rotate?: number;
  pin?: boolean;
  tape?: boolean;
  as?: "div" | "li" | "section";
}) {
  return (
    <Tag
      className={`relative ${className}`}
      style={{
        background: tint.bg,
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 1px 1px rgba(42,38,32,0.10), 0 14px 26px -14px rgba(42,38,32,0.42)",
        borderRadius: "6px 6px 8px 6px",
        color: C.ink,
      }}
    >
      {pin && (
        <span
          className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${C.markerHi}, ${C.markerDeep})`,
            boxShadow: "0 3px 6px -1px rgba(42,38,32,0.5)",
            border: "1.5px solid rgba(255,255,255,0.5)",
          }}
        />
      )}
      {tape && (
        <span
          className="absolute left-1/2 top-0 h-5 w-16 -translate-x-1/2 -translate-y-2/3 rotate-[-3deg]"
          aria-hidden="true"
          style={{
            background: "rgba(255,255,255,0.5)",
            borderLeft: "1px solid rgba(42,38,32,0.08)",
            borderRight: "1px solid rgba(42,38,32,0.08)",
            boxShadow: "0 1px 3px rgba(42,38,32,0.12)",
          }}
        />
      )}
      {children}
    </Tag>
  );
}

// — Strakke index-kaart (voor facturen/verificatie): wit met dunne gelinieerde rand —
function IndexCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(42,38,32,0.05), 0 10px 24px -18px rgba(42,38,32,0.35)",
        color: C.ink,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.markerDeep }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em]"
      style={{ color: tone, ...body }}
    >
      <Pin size={11} aria-hidden="true" style={{ transform: "rotate(-20deg)" }} />
      {children}
    </p>
  );
}

function Chip({
  children,
  tone,
  ink,
  wash,
  alarm = false,
}: {
  children: React.ReactNode;
  tone: string;
  ink: string;
  wash: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ color: ink, background: wash, border: `1px solid ${tone}44`, ...body }}
    >
      {children}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// — Indrukbare marker-knop: dikke rand + onderrand voor een "3D indrukbaar"-gevoel —
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
      className={`group inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-bold transition-all duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] active:translate-y-[2px] active:shadow-none motion-reduce:transition-none ${className}`}
      style={{
        color: "#fff8f2",
        background: C.marker,
        boxShadow: `0 4px 0 0 ${C.markerDeep}, 0 8px 16px -6px rgba(193,70,8,0.5)`,
        ...body,
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec] active:translate-y-[1px] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.markerDeep : C.inkSoft,
        background: active ? C.markerWash : C.paper,
        border: `1.5px solid ${active ? C.marker : C.line}`,
        boxShadow: active ? "none" : "0 2px 0 0 rgba(42,38,32,0.08)",
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Marker-sparkline: dikke krijtstreek —
function MarkerLine({ data, tone }: { data: number[]; tone: string }) {
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
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={tone} stroke={C.paper} strokeWidth="1.4" />
    </svg>
  );
}

// — Match-badge: ronde "stempel"-cirkel —
function MatchStamp({ value, size = 54 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tint = strong ? C.mint : C.geel;
  const ink = strong ? C.mintInk : C.geelInk;
  return (
    <span
      className="inline-flex flex-col items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: tint,
        border: `2px dashed ${ink}66`,
        color: ink,
        transform: "rotate(-6deg)",
      }}
      aria-hidden="true"
    >
      <span className="text-[15px] font-extrabold leading-none" style={{ ...num }}>
        {value}
      </span>
      <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em]">match</span>
    </span>
  );
}

export function Concept422() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `${C.cork}`,
        backgroundImage: `radial-gradient(circle at 20% 15%, rgba(255,253,247,0.5), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,253,247,0.4), transparent 50%)`,
      }}
    >
      <style>{`
        @keyframes plakPop { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .plak-pop { animation: plakPop 0.42s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .plak-pop { animation: none !important; } }
      `}</style>

      {/* kurk/linnen vezel-textuur */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${FIBER}")`,
          backgroundSize: "150px 150px",
          opacity: 0.5,
          mixBlendMode: "multiply",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="plak-pop pt-7">
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
          style={{
            background: C.marker,
            color: "#fff8f2",
            transform: "rotate(-5deg)",
            boxShadow: `0 3px 0 0 ${C.markerDeep}`,
          }}
          aria-hidden="true"
        >
          <StickyNote size={19} />
        </span>
        <div>
          <p className="text-[20px] font-extrabold leading-none" style={{ color: C.ink, ...hand }}>
            Plakblok
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.plaats} · je prikbord
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.okInk, border: `1px solid ${C.ok}44`, background: C.okWash, ...body }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold"
              style={{ background: C.marker, color: "#fff8f2", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[14px] font-bold" style={{ color: C.ink, ...body }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[11px]" style={{ color: C.inkMute, ...body }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-extrabold"
          style={{
            background: C.geel,
            border: `1px solid ${C.geelInk}33`,
            color: C.geelInk,
            transform: "rotate(4deg)",
            ...body,
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
      <div
        className="flex items-center gap-1.5 overflow-x-auto rounded-xl p-1.5"
        style={{
          background: C.paperSoft,
          border: `1px solid ${C.line}`,
          boxShadow: "inset 0 1px 2px rgba(42,38,32,0.05)",
        }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          const tint = NOTE_TINTS[i % NOTE_TINTS.length]!;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf6ec] motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                background: on ? tint.bg : "transparent",
                boxShadow: on ? "0 2px 6px -2px rgba(42,38,32,0.35)" : undefined,
                transform: on ? "rotate(-1.5deg)" : undefined,
                ...body,
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
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Note className="p-7 md:p-9" tint={{ bg: C.geel, ink: C.geelInk }} rotate={-1} tape>
          <Eyebrow tone={C.geelInk}>Vandaag · je prikbord</Eyebrow>
          <h1
            className="mt-4 text-[32px] font-extrabold leading-[1.04] md:text-[44px]"
            style={{ color: C.ink, ...hand }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}!
          </h1>
          <p
            className="mt-3 max-w-md text-[14px] font-medium leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Alles wat vandaag telt hangt hier op één prikbord. Loop je notities langs, houd je
            certificaten geverifieerd en je facturen betaald — snel geregeld.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Naar marktplaats</GhostButton>
          </div>
        </Note>

        <Note className="p-7" tint={{ bg: C.perzik, ink: C.perzikInk }} rotate={1.5} pin>
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.perzikInk}>Vraagt aandacht</Eyebrow>
            <AlertTriangle size={18} aria-hidden="true" style={{ color: C.perzikInk }} />
          </div>
          <h2
            className="mt-4 text-[20px] font-extrabold leading-snug"
            style={{ color: C.ink, ...hand }}
          >
            {primair.titel}
          </h2>
          <p
            className="mt-2 text-[13.5px] font-medium leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            {primair.detail}
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </PrimaryButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px dashed ${C.perzikInk}44` }}>
            <p
              className="flex items-center gap-2 text-[12px] font-semibold"
              style={{ color: C.perzikInk, ...num }}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
            </p>
          </div>
        </Note>
      </section>

      <section>
        <div className="mb-4">
          <Eyebrow>Deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tint = NOTE_TINTS[i % NOTE_TINTS.length]!;
            const rot = [-1.5, 1, -1, 1.5][i % 4]!;
            return (
              <Note key={k.label} className="p-5" tint={tint} rotate={rot}>
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: tint.ink, ...body }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-extrabold"
                    style={{
                      color: k.up ? C.okInk : C.warnInk,
                      background: "rgba(255,255,255,0.55)",
                      ...num,
                    }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[27px] font-extrabold leading-none"
                  style={{ color: C.ink, ...num, letterSpacing: "-0.02em" }}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <MarkerLine data={k.spark} tone={tint.ink} />
                </div>
              </Note>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <Eyebrow>Beste matches</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="rounded text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec]"
              style={{ color: C.markerDeep, ...body }}
            >
              Alle →
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-1">
            {OPDRACHTEN.map((o, i) => {
              const tint = NOTE_TINTS[i % NOTE_TINTS.length]!;
              const rot = [-1, 1, -1.5][i % 3]!;
              return (
                <Note key={o.id} tint={tint} rotate={rot} className="">
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md px-5 py-4 text-left transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8590c] motion-reduce:transition-none"
                  >
                    <MatchStamp value={o.match} size={46} />
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-extrabold"
                        style={{ color: C.ink, ...hand }}
                      >
                        {o.titel}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px] font-medium"
                        style={{ color: tint.ink }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ChevronRight
                      size={18}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: tint.ink }}
                    />
                  </button>
                </Note>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <Eyebrow>Certificaten</Eyebrow>
          </div>
          <IndexCard className="p-5">
            <ul className="space-y-1">
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.lineSoft}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
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
          </IndexCard>
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
        <h1
          className="mt-3 text-[32px] font-extrabold leading-none"
          style={{ color: C.ink, ...hand }}
        >
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px] font-semibold" style={{ color: C.inkMute, ...num }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten opgeprikt
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-5 py-3"
          style={{ background: C.paper, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] font-medium outline-none placeholder:text-[#a89c86]"
            style={{ color: C.ink, ...body }}
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
        <ul className="grid gap-5 sm:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <Note
                tint={NOTE_TINTS[i % NOTE_TINTS.length]!}
                rotate={[-1, 1, -1.5, 1][i]!}
                className="p-6"
              >
                <div className="animate-pulse space-y-3 motion-reduce:animate-none">
                  <div
                    className="h-3 w-20 rounded-full"
                    style={{ background: "rgba(255,255,255,0.6)" }}
                  />
                  <div
                    className="h-5 w-2/3 rounded-full"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  />
                  <div
                    className="h-3 w-1/2 rounded-full"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  />
                </div>
              </Note>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <Note tint={{ bg: C.geel, ink: C.geelInk }} rotate={-1} className="p-6" tape>
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: `2px dashed ${C.geelInk}55`,
                color: C.geelInk,
              }}
              aria-hidden="true"
            >
              <Wind size={26} />
            </span>
            <p className="mt-5 text-[22px] font-extrabold" style={{ color: C.ink, ...hand }}>
              Leeg prikbord
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[13.5px] font-medium"
              style={{ color: C.inkSoft }}
            >
              Geen notities bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm en prik opnieuw.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Note>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
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
  const tint = NOTE_TINTS[index % NOTE_TINTS.length]!;
  const rot = [-1.2, 1.2, -1][index % 3]!;
  return (
    <Note tint={tint} rotate={rot} pin className="p-6">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: tint.ink, background: "rgba(255,255,255,0.5)", ...num }}
            >
              № {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[11px] font-bold" style={{ color: tint.ink, ...num }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[19px] font-extrabold leading-snug"
            style={{ color: C.ink, ...hand }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px] font-medium" style={{ color: tint.ink }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                style={{ color: C.inkSoft, background: "rgba(255,255,255,0.55)", ...body }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <MatchStamp value={opdracht.match} size={58} />
          <span className="text-[13px] font-extrabold" style={{ color: tint.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffdf7]"
          style={{ color: tint.ink, background: "rgba(255,255,255,0.55)", ...body }}
        >
          {open ? <Minus size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3">
            <RedenBlok
              titel="Sterke punten"
              tone={C.okInk}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Aandachtspunten"
              tone={C.warnInk}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Note>
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
      className="rounded-lg p-4"
      style={{ background: "rgba(255,255,255,0.55)", border: `1px dashed ${tone}44` }}
    >
      <p
        className="text-[10px] font-extrabold uppercase tracking-[0.16em]"
        style={{ color: tone, ...body }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[12.5px] font-medium"
            style={{ color: C.inkSoft }}
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
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8590c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f4ec]"
        style={{ color: C.inkSoft, border: `1.5px solid ${C.line}`, background: C.paper, ...body }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Note tint={{ bg: C.geel, ink: C.geelInk }} rotate={-1} tape className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
            style={{ color: C.geelInk, background: "rgba(255,255,255,0.55)", ...num }}
          >
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold"
            style={{ color: "#fff8f2", background: C.marker, ...body }}
          >
            <Pin size={11} aria-hidden="true" /> {strong ? "Sterke match" : "Goede match"} ·{" "}
            {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[30px] font-extrabold leading-[1.06] md:text-[42px]"
          style={{ color: C.ink, ...hand }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: C.geelInk }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Bewaren</GhostButton>
        </div>
      </Note>

      <IndexCard>
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
                borderLeft: i % 4 === 0 ? "none" : `1px dashed ${C.lineSoft}`,
                borderTop: i >= 2 ? `1px dashed ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[9.5px] font-extrabold uppercase tracking-[0.16em]"
                style={{ color: C.inkMute, ...body }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[18px] font-extrabold"
                style={{ color: C.ink, ...num, letterSpacing: "-0.01em" }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </IndexCard>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p
          className="mt-3 max-w-xl text-[13.5px] font-medium leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Recht van je geverifieerde profiel afgeprikt — wat aansluit én waar je op moet letten,
          zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Note tint={{ bg: C.mint, ink: C.mintInk }} rotate={-1} className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.mintInk, background: "rgba(255,255,255,0.55)" }}
                aria-hidden="true"
              >
                <Check size={15} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: C.mintInk, ...body }}
              >
                Sterke punten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.mintInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Note>
          <Note tint={{ bg: C.perzik, ink: C.perzikInk }} rotate={1} className="p-6">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                style={{ color: C.perzikInk, background: "rgba(255,255,255,0.55)" }}
                aria-hidden="true"
              >
                <AlertTriangle size={14} />
              </span>
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: C.perzikInk, ...body }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.perzikInk }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Note>
        </div>
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
      <Note tint={{ bg: C.mint, ink: C.mintInk }} rotate={-0.8} tape className="p-7 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow tone={C.mintInk}>Verificatie · vertrouwensniveau</Eyebrow>
            <h1
              className="mt-3 text-[28px] font-extrabold leading-tight"
              style={{ color: C.ink, ...hand }}
            >
              Jouw certificaten
            </h1>
            <p
              className="mt-3 text-[13.5px] font-medium leading-relaxed"
              style={{ color: C.inkSoft }}
            >
              <span className="font-extrabold" style={{ color: C.mintInk }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{
              background: "rgba(255,255,255,0.6)",
              border: `2.5px dashed ${C.mintInk}66`,
              transform: "rotate(-6deg)",
            }}
            aria-hidden="true"
          >
            <span
              className="text-[26px] font-extrabold leading-none"
              style={{ color: C.mintInk, ...num }}
            >
              {ratio}
            </span>
            <span
              className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.16em]"
              style={{ color: C.mintInk }}
            >
              % verifieerd
            </span>
          </span>
        </div>
      </Note>

      <IndexCard>
        <div
          className="hidden grid-cols-[1fr_11rem_2.5rem] items-center gap-4 px-6 py-3.5 sm:grid"
          style={{ borderBottom: `1px dashed ${C.lineSoft}` }}
        >
          {["Certificaat", "Status", ""].map((h, i) => (
            <span
              key={h || i}
              className="text-[9.5px] font-extrabold uppercase tracking-[0.18em]"
              style={{ color: C.inkMute, ...body }}
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
                style={{ borderTop: idx === 0 ? "none" : `1px dashed ${C.lineSoft}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8590c] motion-reduce:transition-none sm:grid-cols-[1fr_11rem_2.5rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                      style={{
                        color: st.ink,
                        background: st.wash,
                        border: `1px solid ${st.tone}44`,
                      }}
                      aria-hidden="true"
                    >
                      <st.Icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="block truncate text-[15px] font-bold"
                        style={{ color: C.ink, ...body }}
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
                    <Chip tone={st.tone} ink={st.ink} wash={st.wash} alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Chip>
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
                        className="rounded-lg p-4"
                        style={{ background: C.paperSoft, border: `1px dashed ${C.lineSoft}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] font-medium leading-relaxed"
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
              </li>
            );
          })}
        </ul>
      </IndexCard>

      <div>
        <div className="mb-4">
          <Eyebrow tone={C.markerDeep}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <IndexCard key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: C.raise, border: `1px solid ${C.line}`, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <Paperclip size={16} />
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
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={{ color: st.ink, background: st.wash, border: `1px solid ${st.tone}44` }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </IndexCard>
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
        <Eyebrow>Acties · op volgorde</Eyebrow>
        <h1
          className="mt-3 text-[32px] font-extrabold leading-none"
          style={{ color: C.ink, ...hand }}
        >
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] font-medium" style={{ color: C.inkSoft }}>
          Notitie voor notitie afwerken — zo blijf je verifieerbaar en betaald, zonder iets te
          missen.
        </p>
      </div>

      <ol className="grid gap-6 sm:grid-cols-2">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tint = warn
            ? { bg: C.perzik, ink: C.perzikInk }
            : NOTE_TINTS[(i + 2) % NOTE_TINTS.length]!;
          const rot = [-1.5, 1.5, -1][i % 3]!;
          return (
            <li key={a.titel}>
              <Note tint={tint} rotate={rot} pin className="flex h-full flex-col p-6">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[13px] font-extrabold"
                    style={{ background: "rgba(255,255,255,0.55)", color: tint.ink, ...num }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
                    style={{ color: tint.ink, background: "rgba(255,255,255,0.55)", ...body }}
                  >
                    {warn ? (
                      <AlertTriangle size={10} aria-hidden="true" />
                    ) : (
                      <Pin size={10} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                </div>
                <h2
                  className="mt-3 text-[19px] font-extrabold leading-snug"
                  style={{ color: C.ink, ...hand }}
                >
                  {a.titel}
                </h2>
                <p
                  className="mt-1.5 flex-1 text-[13.5px] font-medium leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <div className="mt-4">
                  <PrimaryButton className="w-full">
                    {a.cta}
                    <ArrowRight size={13} aria-hidden="true" />
                  </PrimaryButton>
                </div>
              </Note>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): {
  ink: string;
  wash: string;
  tone: string;
  Icon: LucideIcon | null;
} {
  if (status === "Openstaand")
    return { ink: C.warnInk, wash: C.warnWash, tone: C.warn, Icon: AlertTriangle };
  if (status === "Betaald") return { ink: C.okInk, wash: C.okWash, tone: C.ok, Icon: Check };
  return { ink: C.inkMute, wash: C.raise, tone: C.line, Icon: FileText };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1
            className="mt-3 text-[32px] font-extrabold leading-none"
            style={{ color: C.ink, ...hand }}
          >
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <IndexCard key={s.l} className="p-6">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-extrabold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: C.warnWash, color: C.warnInk }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[27px] font-extrabold"
              style={{ color: s.alarm ? C.warnInk : C.ink, ...num, letterSpacing: "-0.01em" }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px] font-medium" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </IndexCard>
        ))}
      </section>

      <IndexCard>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-6 pb-3 pt-5 sm:grid"
          style={{ borderBottom: `1px dashed ${C.lineSoft}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] font-extrabold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.inkMute, ...body }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-6 py-4 transition-colors hover:bg-[#faf6ec] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px dashed ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[11.5px] font-bold"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={{ color: C.ink, ...body }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[11.5px] sm:order-3 sm:inline"
                  style={{ color: C.inkMute, ...num }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                    style={{
                      color: ft.ink,
                      background: ft.wash,
                      border: `1px solid ${ft.tone}44`,
                      ...body,
                    }}
                  >
                    {ft.Icon && <ft.Icon size={11} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[14px] font-extrabold sm:order-5"
                  style={{ color: acc ? C.warnInk : C.ink, ...num }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between px-6 py-4"
          style={{ borderTop: `1px dashed ${C.lineSoft}` }}
        >
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: C.inkMute, ...body }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] font-extrabold" style={{ color: C.ink, ...num }}>
            {totaalBetaald}
          </span>
        </div>
      </IndexCard>
    </div>
  );
}
