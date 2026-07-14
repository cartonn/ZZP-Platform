"use client";

// Concept 314 — "Lichtkrant" · LED-matrix ticker-bord (stationsbord / reclamekrant).
// Dot-matrix koppen in silkscreen-pixels, een doorlopend scrollende status-strip bovenaan,
// amber + emerald "pixels" op houtskool-donker. Elke KPI en actie leest als een oplichtende
// regel op een lichtkrant: fijne puntenraster-textuur, zachte pixel-glow, tabulaire LED-cijfers.
// Fonts: Silkscreen (pixel-kop) + Space Grotesk (display) + Geist (tekst) + JetBrains Mono (cijfers).
// Micro-interactie: hover laat pixels feller oplichten, tabs "flippen" naar aan. Dark thema —
// onderscheidend van Scorebord (stadion-jumbotron) door de doorlopende krant-ticker & pixel-regels.

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  Radio,
  MapPin,
  Zap,
  FileText,
  MessageSquare,
  Bell,
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
  BERICHTEN,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#0b0e0d", // houtskool-donker
  bgDeep: "#070908",
  panel: "#111614", // paneel iets lichter
  panelHi: "#161d1a",
  amber: "#ffb43a", // LED-amber
  emerald: "#3ee89a", // LED-emerald
  red: "#ff5a5a", // LED-rood
  text: "#dbe6df", // zacht LED-wit
  muted: "#7c8f85",
  faint: "#4a5c53",
  line: "rgba(62,232,154,0.16)",
  lineSoft: "rgba(219,230,223,0.08)",
};

const pixel = { fontFamily: "var(--font-lab-silkscreen)" };
const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Fijne LED-puntenraster + zachte bord-verlichting.
const dotMatrix =
  "repeating-linear-gradient(0deg, rgba(219,230,223,0.028) 0 1px, transparent 1px 5px)," +
  "repeating-linear-gradient(90deg, rgba(219,230,223,0.028) 0 1px, transparent 1px 5px)," +
  "radial-gradient(130% 90% at 50% -10%, rgba(62,232,154,0.06), transparent 55%)," +
  "radial-gradient(110% 70% at 50% 120%, rgba(255,180,58,0.04), transparent 60%)";

const glow = (color: string, blur = 12) => `0 0 ${blur}px ${color}55, 0 0 ${blur * 2}px ${color}22`;

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  lamp: "on" | "warn" | "off";
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.emerald, lamp: "on" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.amber, lamp: "warn" };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber, lamp: "warn" };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red, lamp: "off" };
  }
}

// Bord-paneel met matrix-binnenkant en optioneel gloeiende rand.
function Board({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.panelHi}, ${C.panel})`,
        border: `1px solid ${tone ? `${tone}40` : C.line}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 36px rgba(0,0,0,0.5)${tone ? `, ${glow(tone, 7)}` : ""}`,
      }}
    >
      {children}
    </div>
  );
}

// LED-cijfer met glow.
function Digit({
  children,
  tone,
  size = 30,
}: {
  children: React.ReactNode;
  tone: string;
  size?: number;
}) {
  return (
    <span
      className="tabular-nums leading-none"
      style={{
        ...mono,
        fontSize: size,
        fontWeight: 600,
        color: tone,
        textShadow: glow(tone, 9),
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
}

// Sparkline als LED-track.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 3px ${tone})` }}
      />
    </svg>
  );
}

// Match% als LED-segmentbalk (die oplicht).
function PixelBar({ value, tone = C.emerald }: { value: number; tone?: string }) {
  const cells = 16;
  const filled = Math.round((value / 100) * cells);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: cells }).map((_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className="h-4 w-[6px] rounded-[1px] transition-all"
              style={{
                background: on ? tone : "rgba(255,255,255,0.06)",
                boxShadow: on ? glow(tone, 4) : "none",
              }}
            />
          );
        })}
      </div>
      <span className="tabular-nums" style={{ ...mono, fontSize: 15, color: tone }}>
        {value}%
      </span>
    </div>
  );
}

// Pixel-kop in silkscreen.
function PixelKop({ children, tone = C.text }: { children: React.ReactNode; tone?: string }) {
  return (
    <h2
      className="text-[15px] leading-tight sm:text-[18px]"
      style={{ ...pixel, color: tone, letterSpacing: "0.04em", textShadow: glow(tone, 6) }}
    >
      {children}
    </h2>
  );
}

// Sectie-eyebrow.
function Eyebrow({ children, tone = C.amber }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.28em]"
      style={{ ...pixel, color: tone }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone, boxShadow: glow(tone, 4) }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

export function Concept314() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.bg, backgroundImage: dotMatrix, color: C.text }}
    >
      <style>{`
        @keyframes lk-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lk-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes lk-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Doorlopende status-ticker bovenaan — de lichtkrant */}
      <div
        className="relative overflow-hidden border-b"
        style={{ borderColor: C.line, background: C.bgDeep }}
        aria-label="Live statusberichten"
      >
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16"
          style={{ background: `linear-gradient(90deg, ${C.bgDeep}, transparent)` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16"
          style={{ background: `linear-gradient(270deg, ${C.bgDeep}, transparent)` }}
          aria-hidden="true"
        />
        <div
          className="flex whitespace-nowrap py-2"
          style={{ animation: "lk-scroll 32s linear infinite" }}
        >
          {[0, 1].map((rep) => (
            <div key={rep} className="flex shrink-0 items-center" aria-hidden={rep === 1}>
              {TICKER.map((t, i) => (
                <span key={`${rep}-${i}`} className="flex items-center">
                  <span
                    className="mx-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]"
                    style={{ ...pixel, color: t.tone }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: t.tone, boxShadow: glow(t.tone, 4) }}
                    />
                    {t.text}
                  </span>
                  <span style={{ color: C.faint }}>•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-7 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{
              background: C.panelHi,
              border: `1px solid ${C.emerald}55`,
              color: C.emerald,
              boxShadow: glow(C.emerald, 7),
            }}
            aria-hidden="true"
          >
            <Radio size={18} strokeWidth={2} />
          </span>
          <div className="leading-none">
            <div
              className="text-[16px]"
              style={{ ...pixel, color: C.text, letterSpacing: "0.02em" }}
            >
              LICHTKRANT
            </div>
            <div
              className="mt-1.5 text-[9px] uppercase tracking-[0.3em]"
              style={{ color: C.muted }}
            >
              ZZP · Live bord
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] sm:inline-flex"
            style={{ ...pixel, color: C.emerald, border: `1px solid ${C.emerald}44` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: C.emerald,
                boxShadow: glow(C.emerald, 4),
                animation: "lk-blink 2s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
            Online
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.text }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md text-[12px]"
            style={{
              ...mono,
              background: C.panel,
              color: C.amber,
              border: `1px solid ${C.amber}44`,
              boxShadow: glow(C.amber, 5),
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tabs — LED-regels die naar "aan" flippen */}
      <nav
        className="mx-auto mt-6 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-md px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                ...pixel,
                color: on ? C.bg : C.muted,
                background: on ? C.emerald : "transparent",
                border: `1px solid ${on ? "transparent" : C.lineSoft}`,
                boxShadow: on ? glow(C.emerald, 7) : "none",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-11">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      {/* Footer — NAV als pixel-lijst */}
      <footer className="mx-auto max-w-5xl px-5 pb-9 md:px-10">
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border px-4 py-3"
          style={{ borderColor: C.lineSoft, background: C.bgDeep }}
        >
          {NAV.map((n) => (
            <span
              key={n}
              className="text-[9px] uppercase tracking-[0.2em]"
              style={{ ...pixel, color: C.faint }}
            >
              {n}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

const TICKER: { text: string; tone: string }[] = [
  { text: "3 nieuwe matches boven 85%", tone: C.emerald },
  { text: "VOG verloopt over 23 dagen", tone: C.amber },
  { text: "Factuur FAC-2025-118 openstaand · € 1.350", tone: C.amber },
  { text: "BIG-registratie geverifieerd", tone: C.emerald },
  { text: "Omzet deze maand € 8.240 · +12%", tone: C.emerald },
  { text: "Reactietijd opdrachtgevers ~6 uur", tone: C.text },
];

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.emerald, C.amber, C.emerald, C.amber];
  const [loading, setLoading] = useState(true);
  // Presentatie-only: laat één keer een skeleton→data-overgang zien.
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-9">
      <section>
        <Eyebrow>Vandaag · {PROFIEL.plaats}</Eyebrow>
        <h1
          className="mt-3 text-[26px] leading-tight sm:text-[32px]"
          style={{ ...pixel, color: C.text, letterSpacing: "0.01em" }}
        >
          Goedemorgen,{" "}
          <span style={{ color: C.emerald, textShadow: glow(C.emerald, 10) }}>
            {PROFIEL.naam.split(" ")[0]}
          </span>
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          Eén regel op het bord vraagt vandaag actie — de rest van de lichtkrant kleurt groen.
        </p>
      </section>

      {/* Primaire actie als alarm-regel */}
      <Board tone={C.amber} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.2em]"
              style={{ ...pixel, color: C.amber }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2.5 text-[18px] leading-tight sm:text-[20px]"
              style={{ ...display, fontWeight: 700, color: C.text }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.muted }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-md px-6 py-3 text-[10px] uppercase tracking-[0.12em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
            style={{ ...pixel, background: C.amber, color: C.bg, boxShadow: glow(C.amber, 9) }}
          >
            {primair.cta}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </Board>

      {/* KPI's als oplichtende regels */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <PixelKop>Prestatie</PixelKop>
          <Eyebrow tone={C.emerald}>Standen</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Board key={i} className="p-4">
                  <div className="space-y-3">
                    <div
                      className="h-3 w-24 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.11) 37%, rgba(255,255,255,0.05) 63%)",
                        backgroundSize: "400% 100%",
                        animation: "lk-shimmer 1.4s ease infinite",
                      }}
                    />
                    <div
                      className="h-7 w-20 rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.11) 37%, rgba(255,255,255,0.05) 63%)",
                        backgroundSize: "400% 100%",
                        animation: "lk-shimmer 1.4s ease infinite",
                      }}
                    />
                    <div
                      className="h-8 w-full rounded"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%)",
                        backgroundSize: "400% 100%",
                        animation: "lk-shimmer 1.4s ease infinite",
                      }}
                    />
                  </div>
                </Board>
              ))
            : KPIS.map((k, i) => {
                const tone = tones[i % tones.length] as string;
                return (
                  <Board
                    key={k.label}
                    className="group p-4 transition-transform hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="text-[9px] uppercase tracking-[0.12em]"
                        style={{ ...pixel, color: C.muted }}
                      >
                        {k.label}
                      </span>
                      <span
                        className="text-[10px] tabular-nums"
                        style={{
                          ...mono,
                          color: k.up ? C.emerald : C.red,
                          textShadow: glow(k.up ? C.emerald : C.red, 4),
                        }}
                      >
                        {k.up ? "▲" : "▼"} {k.trend}
                      </span>
                    </div>
                    <div className="mt-3 transition-transform group-hover:scale-[1.03] motion-reduce:group-hover:scale-100">
                      <Digit tone={tone} size={30}>
                        {k.value}
                      </Digit>
                    </div>
                    <div className="mt-3">
                      <Spark data={k.spark} tone={tone} />
                    </div>
                  </Board>
                );
              })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <PixelKop>Beste match</PixelKop>
          <Eyebrow>Voor jou</Eyebrow>
        </div>
        <button
          onClick={onOpen}
          className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Board
            tone={C.emerald}
            className="flex flex-col gap-5 p-5 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-md px-5 py-3"
              style={{
                background: C.bg,
                border: `1px solid ${C.emerald}44`,
                boxShadow: "inset 0 0 18px rgba(0,0,0,0.6)",
              }}
            >
              <Digit tone={C.emerald} size={36}>
                {top.match}
              </Digit>
              <span
                className="mt-1 text-[8px] uppercase tracking-[0.22em]"
                style={{ ...pixel, color: C.muted }}
              >
                match
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-[18px] leading-tight"
                style={{ ...display, fontWeight: 700, color: C.text }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-2 py-0.5 text-[9px] uppercase tracking-[0.06em]"
                    style={{
                      ...pixel,
                      background: C.panelHi,
                      color: C.text,
                      border: `1px solid ${C.lineSoft}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.emerald }}
              aria-hidden="true"
            />
          </Board>
        </button>
      </section>

      {/* Berichten-preview */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <PixelKop>Berichten</PixelKop>
          <Eyebrow tone={C.amber}>Postvak</Eyebrow>
        </div>
        <Board>
          <ul style={{ borderColor: C.lineSoft }}>
            {BERICHTEN.map((m) => (
              <li
                key={m.van}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px]"
                  style={{
                    ...mono,
                    background: C.panelHi,
                    color: C.emerald,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                  aria-hidden="true"
                >
                  {m.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold" style={{ color: C.text }}>
                      {m.van}
                    </span>
                    {m.ongelezen && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: C.amber, boxShadow: glow(C.amber, 4) }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                    {m.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.tijd}
                </span>
              </li>
            ))}
          </ul>
        </Board>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const allTags = Array.from(new Set(OPDRACHTEN.flatMap((o) => o.tags)));
  const filtered = OPDRACHTEN.filter((o) => {
    const matchQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const matchTag = !tag || o.tags.includes(tag);
    return matchQ && matchTag;
  });

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <PixelKop>Marktplaats</PixelKop>
        <Eyebrow tone={C.emerald}>Live · {String(filtered.length).padStart(2, "0")} open</Eyebrow>
      </div>

      <Board className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.muted }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.text }}
        />
      </Board>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter op specialisatie">
        <button
          onClick={() => setTag(null)}
          aria-pressed={tag === null}
          className="rounded px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{
            ...pixel,
            color: tag === null ? C.bg : C.muted,
            background: tag === null ? C.emerald : "transparent",
            border: `1px solid ${tag === null ? "transparent" : C.lineSoft}`,
          }}
        >
          Alles
        </button>
        {allTags.map((t) => {
          const on = tag === t;
          return (
            <button
              key={t}
              onClick={() => setTag(on ? null : t)}
              aria-pressed={on}
              className="rounded px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                ...pixel,
                color: on ? C.bg : C.muted,
                background: on ? C.amber : "transparent",
                border: `1px solid ${on ? "transparent" : C.lineSoft}`,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Board className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Search size={26} style={{ color: C.muted }} aria-hidden="true" />
          <p className="text-[15px]" style={{ ...pixel, color: C.text }}>
            Geen regels gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.muted }}>
            Niets past bij deze filters. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => {
              setQ("");
              setTag(null);
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[9px] uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ ...pixel, background: C.emerald, color: C.bg, boxShadow: glow(C.emerald, 7) }}
          >
            Filters wissen
          </button>
        </Board>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <Board className="flex flex-col gap-4 p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] tabular-nums" style={{ ...mono, color: C.amber }}>
                      {o.id}
                    </span>
                    <h3
                      className="mt-0.5 text-[17px] leading-tight"
                      style={{ ...display, fontWeight: 700, color: C.text }}
                    >
                      {o.titel}
                    </h3>
                    <div
                      className="mt-0.5 flex items-center gap-1.5 text-[12.5px]"
                      style={{ ...mono, color: C.muted }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats} ·{" "}
                      {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded px-2 py-0.5 text-[9px] uppercase tracking-[0.06em]"
                          style={{
                            ...pixel,
                            background: C.panelHi,
                            color: C.text,
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <PixelBar value={o.match} tone={o.match >= 85 ? C.emerald : C.amber} />
                    <ArrowRight
                      size={18}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.emerald }}
                      aria-hidden="true"
                    />
                  </div>
                </Board>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ ...pixel, color: C.muted }}
      >
        <ArrowRight size={12} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Board tone={C.emerald} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.amber }}>
              {opdracht.id}
            </span>
            <h1
              className="mt-1.5 max-w-xl text-[22px] leading-tight sm:text-[26px]"
              style={{ ...display, fontWeight: 700, color: C.text }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 text-[13px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="text-center" aria-label={`Matchscore ${opdracht.match} van 100`}>
            <Digit tone={C.emerald} size={48}>
              {opdracht.match}
            </Digit>
            <div
              className="text-[8px] uppercase tracking-[0.22em]"
              style={{ ...pixel, color: C.muted }}
            >
              % match
            </div>
          </div>
        </div>
      </Board>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, tone: C.emerald },
          { l: "Omvang", v: opdracht.uren, tone: C.amber },
          { l: "Start", v: opdracht.start, tone: C.emerald },
          { l: "Match", v: `${opdracht.match}%`, tone: C.emerald },
        ].map((m) => (
          <Board key={m.l} className="p-4">
            <div
              className="text-[9px] uppercase tracking-[0.12em]"
              style={{ ...pixel, color: C.muted }}
            >
              {m.l}
            </div>
            <div className="mt-2.5">
              <Digit tone={m.tone} size={18}>
                {m.v}
              </Digit>
            </div>
          </Board>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Board tone={C.emerald} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]"
            style={{ ...pixel, color: C.emerald }}
          >
            <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.text }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.emerald, boxShadow: glow(C.emerald, 4) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Board>
        <Board tone={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]"
            style={{ ...pixel, color: C.amber }}
          >
            <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.text }}
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: C.amber, boxShadow: glow(C.amber, 4) }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Board>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-md px-7 py-3.5 text-[10px] uppercase tracking-[0.12em] transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
          style={{ ...pixel, background: C.emerald, color: C.bg, boxShadow: glow(C.emerald, 9) }}
        >
          Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3.5 text-[10px] uppercase tracking-[0.12em] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ ...pixel, border: `1px solid ${C.line}`, color: C.text }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <PixelKop>Verificatie</PixelKop>
        <Eyebrow tone={C.emerald}>Vertrouwen</Eyebrow>
      </div>

      <Board tone={C.emerald} className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <div className="shrink-0 text-center sm:text-left">
          <Digit tone={C.emerald} size={48}>
            {pct}%
          </Digit>
          <div
            className="text-[8px] uppercase tracking-[0.22em]"
            style={{ ...pixel, color: C.muted }}
          >
            gedekt
          </div>
        </div>
        <div className="sm:border-l sm:pl-6" style={{ borderColor: C.line }}>
          <div
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]"
            style={{ ...pixel, color: C.emerald }}
          >
            <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {verified} van {CREDENTIALS.length} credentials staan op groen. Eén regel kleurt amber —
            vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Board>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Board
                className="flex items-center gap-4 p-4"
                tone={c.status === "EXPIRING" ? C.amber : undefined}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: C.bg,
                    border: `1px solid ${st.tone}66`,
                    color: st.tone,
                    boxShadow: st.lamp !== "off" ? glow(st.tone, 6) : "none",
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14px] font-semibold leading-tight"
                    style={{ color: C.text }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[9px] uppercase tracking-[0.06em]"
                  style={{ ...pixel, color: st.tone, border: `1px solid ${st.tone}55` }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: st.tone,
                      boxShadow: st.lamp !== "off" ? glow(st.tone, 4) : "none",
                    }}
                    aria-hidden="true"
                  />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Board>
            </li>
          );
        })}
      </ul>

      {/* Documenten */}
      <div className="pt-1">
        <div className="mb-4 flex items-center justify-between">
          <PixelKop tone={C.amber}>Documenten</PixelKop>
          <Eyebrow>Privé kluis</Eyebrow>
        </div>
        <Board className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[9px] uppercase tracking-[0.12em]"
                    style={{ ...pixel, color: C.muted }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENTEN.map((d) => {
                const st = statusMeta(d.status);
                return (
                  <tr
                    key={d.naam}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-2 text-[13px] font-medium"
                        style={{ color: C.text }}
                      >
                        <FileText size={14} style={{ color: C.faint }} aria-hidden="true" />{" "}
                        {d.naam}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-4 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] uppercase tracking-[0.06em]"
                        style={{ ...pixel, color: st.tone, border: `1px solid ${st.tone}55` }}
                      >
                        <st.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                        <span className="hidden sm:inline">{st.label}</span>
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.muted }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Board>
      </div>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <PixelKop>Volgende acties</PixelKop>
        <Eyebrow tone={C.amber}>Next-action-engine</Eyebrow>
      </div>

      {/* Error-toestand — presentatie-only demonstratie */}
      <Board tone={C.red} className="flex items-start gap-3 p-4">
        <XCircle
          size={18}
          style={{ color: C.red }}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold" style={{ color: C.text }}>
            Synchronisatie onderbroken
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
            De koppeling met je agenda liep vast. Eén actie kon niet worden bijgewerkt.
          </p>
        </div>
        <button
          className="shrink-0 rounded px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ ...pixel, color: C.red, border: `1px solid ${C.red}55` }}
        >
          Opnieuw
        </button>
      </Board>

      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.emerald;
          return (
            <li key={a.titel}>
              <Board
                tone={warn ? C.amber : undefined}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                  style={{
                    background: C.bg,
                    border: `1px solid ${tone}55`,
                    boxShadow: "inset 0 0 14px rgba(0,0,0,0.6)",
                  }}
                  aria-hidden="true"
                >
                  <Digit tone={tone} size={20}>
                    {i + 1}
                  </Digit>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Zap size={13} strokeWidth={2.4} style={{ color: tone }} aria-hidden="true" />
                    )}
                    <h3
                      className="text-[15px] leading-tight"
                      style={{ ...display, fontWeight: 700, color: C.text }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-md px-5 py-2.5 text-[9px] uppercase tracking-[0.1em] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:self-center"
                  style={{ ...pixel, background: tone, color: C.bg, boxShadow: glow(tone, 7) }}
                >
                  {a.cta}
                </button>
              </Board>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): string => {
    if (status === "Betaald") return C.emerald;
    if (status === "Openstaand") return C.amber;
    return C.muted;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PixelKop>Facturen</PixelKop>
          <div className="mt-2">
            <Eyebrow tone={C.emerald}>Omzet</Eyebrow>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[9px] uppercase tracking-[0.1em] transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{ ...pixel, background: C.emerald, color: C.bg, boxShadow: glow(C.emerald, 7) }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Board className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[9px] uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...pixel, color: C.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const tone = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px] font-semibold" style={{ color: C.text }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[9px] uppercase tracking-[0.06em]"
                      style={{ ...pixel, color: tone, border: `1px solid ${tone}55` }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone, boxShadow: glow(tone, 3) }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-[14px] tabular-nums" style={{ ...mono, color: C.text }}>
                      {f.bedrag}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.line}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[9px] uppercase tracking-[0.16em]"
                style={{ ...pixel, color: C.muted }}
              >
                Totaal betaald
              </td>
              <td className="px-4 py-4 text-right">
                <Digit tone={C.emerald} size={18}>
                  {total}
                </Digit>
              </td>
            </tr>
          </tfoot>
        </table>
      </Board>

      <div className="flex items-center gap-2 text-[11px]" style={{ color: C.faint }}>
        <Bell size={13} aria-hidden="true" />
        <MessageSquare size={13} aria-hidden="true" />
        <span style={{ ...mono }}>Herinneringen verstuur je automatisch na 14 dagen.</span>
      </div>
    </div>
  );
}
