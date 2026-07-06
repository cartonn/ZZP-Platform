"use client";

// Concept 127 — "Cyanotype" · zonnedruk & silhouet (Anna Atkins).
// Diep Pruisisch-blauw canvas (#123a5c) waarop witte/lichtblauwe SILHOUETTEN en contouren
// staan als een fotografische zonnedruk: zachte belichtings-vignetten, korrelige rand,
// botanisch-silhouet-motieven (varenblad, twijgen) als decoratie. Eén samenhangend
// monochroom-blauw palet met wit (#eaf2f6) als "licht" en licht cyaan-wit (#7fb8d4) accent.
// ONDERSCHEIDEND van Blauwdruk (technische drafting met raster/annotaties) en Röntgen
// (lijn-art op antraciet): dit is een fotografische CYANOTYPE-zonnedruk — silhouet, geen raster.
// Data-panelen liggen als belichte fotopapier-vlakken met witte contour-rand en zachte gloed;
// verificatie-status met label+icoon in wit op blauw (hoog contrast).
// Fonts: Libre Franklin (UI) + Spline Sans Mono (labels/cijfer-tags).

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Sun,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Leaf,
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

// Monochroom Pruisisch-blauw cyanotype-palet. Wit = "licht" (onbelicht papier).
const C = {
  prussian: "#123a5c", // Pruisisch blauw — het belichte papier
  prussianDeep: "#0d2c46", // diepste schaduw
  prussianSoft: "#1a4c74", // opgelicht vlak
  panel: "#153f6180", // half-transparant fotopapier-vlak
  white: "#eaf2f6", // licht — onbelicht wit
  whiteSoft: "#b7cdd9", // vergrijsd wit
  cyan: "#7fb8d4", // licht cyaan-wit accent
  cyanBright: "#a9d4e6", // heldere lichtrand
  green: "#8fd3b6", // zacht licht-jade voor geverifieerd
  amber: "#e6c58a", // gedempt zon-amber voor aandacht
  red: "#e8927f", // gedempt licht-terracotta
  line: "rgba(234,242,246,0.14)",
  lineStrong: "rgba(234,242,246,0.28)",
};

const ui = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Korrel: fijne belichtings-ruis over het fotopapier.
const grain =
  "repeating-radial-gradient(circle at 20% 30%, rgba(234,242,246,0.025) 0 0.5px, transparent 0.5px 3px)," +
  "repeating-radial-gradient(circle at 70% 65%, rgba(127,184,212,0.03) 0 0.5px, transparent 0.5px 4px)";

// Belichtings-vignetten: zacht licht dat door het papier straalt.
const vignette =
  "radial-gradient(120% 90% at 22% 8%, rgba(42,86,120,0.85), transparent 55%)," +
  "radial-gradient(120% 100% at 88% 100%, rgba(10,32,52,0.6), transparent 60%)," +
  "radial-gradient(80% 60% at 60% 40%, rgba(169,212,230,0.05), transparent 70%)";

// Volledig canvas: vignet + korrel + diepe blauwbasis.
const sunSurface = vignette + "," + grain;

// Botanisch varenblad-silhouet (SVG) — het cyanotype-handtekeningmotief van Atkins.
function Fern({
  className = "",
  tone = C.cyan,
  size = 120,
  opacity = 0.5,
}: {
  className?: string;
  tone?: string;
  size?: number;
  opacity?: number;
}) {
  const leaflets = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 120"
      width={size}
      height={size * 2}
      className={className}
      style={{ opacity }}
      fill="none"
    >
      <path d="M30 118 C30 90 30 40 30 6" stroke={tone} strokeWidth="1.4" strokeLinecap="round" />
      {leaflets.map((i) => {
        const y = 14 + i * 11.5;
        const len = 22 - i * 1.9;
        return (
          <g key={i}>
            <path
              d={`M30 ${y} C ${30 - len * 0.5} ${y - 2}, ${30 - len} ${y + 3}, ${30 - len - 2} ${y + 9}`}
              stroke={tone}
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d={`M30 ${y} C ${30 + len * 0.5} ${y - 2}, ${30 + len} ${y + 3}, ${30 + len + 2} ${y + 9}`}
              stroke={tone}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.cyanBright };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tone: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.red };
  }
}

// Belicht fotopapier-vlak met witte contour-rand en zachte lichtgloed.
function Print({
  children,
  className = "",
  botanic = false,
  accent = C.line,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  botanic?: boolean;
  accent?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${
        interactive
          ? "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : ""
      } ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${accent}`,
        boxShadow:
          "inset 0 1px 0 rgba(234,242,246,0.08), inset 0 0 40px rgba(169,212,230,0.04), 0 12px 28px -16px rgba(0,0,0,0.7)",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: grain, backgroundSize: "60px 60px" }}
      />
      {botanic && (
        <Fern
          className="pointer-events-none absolute -right-6 -top-4 rotate-12"
          size={70}
          opacity={0.16}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Lichtrand-strip boven een vlak: zacht cyaan gloed-lijntje (zonnegloed).
function Glow() {
  return (
    <span
      aria-hidden="true"
      className="block h-[2px] w-full"
      style={{
        backgroundImage: `linear-gradient(90deg, transparent, ${C.cyanBright}, ${C.cyan}, transparent)`,
        opacity: 0.7,
      }}
    />
  );
}

function Pill({
  children,
  tone,
  solid = false,
}: {
  children: React.ReactNode;
  tone: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={
        solid
          ? { background: tone, color: C.prussianDeep }
          : { background: "rgba(234,242,246,0.06)", color: tone, border: `1px solid ${tone}` }
      }
    >
      {children}
    </span>
  );
}

function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return `${x},${y}`;
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={`0,100 ${pts.join(" ")} 100,100`}
        fill={tone}
        opacity={0.12}
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={tone}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Kop({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      {sub && (
        <div
          className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.cyan }}
        >
          {sub}
        </div>
      )}
      <div className="flex items-center gap-3">
        <h2
          className="text-[26px] font-semibold leading-none tracking-[-0.01em] sm:text-[32px]"
          style={{ ...ui, color: C.white }}
        >
          {children}
        </h2>
        <span
          className="h-px flex-1"
          style={{
            backgroundImage: `linear-gradient(90deg, ${C.cyan}, transparent)`,
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function Concept127() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...ui, background: C.prussian, backgroundImage: sunSurface, color: C.white }}
    >
      {/* Grote belichte varenblad-silhouetten als achtergrond-zonnedruk */}
      <Fern
        className="pointer-events-none absolute -left-8 top-24 -rotate-6"
        size={180}
        opacity={0.07}
      />
      <Fern
        className="pointer-events-none absolute -right-10 bottom-10 rotate-[200deg]"
        tone={C.cyanBright}
        size={150}
        opacity={0.06}
      />

      {/* Kop — zon-mark met varen-hart */}
      <header className="relative mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg"
            style={{
              background: C.prussianSoft,
              color: C.cyanBright,
              border: `1px solid ${C.cyan}`,
            }}
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: grain, backgroundSize: "30px 30px" }}
            />
            <Sun size={19} strokeWidth={2} className="relative" />
          </span>
          <div className="leading-none">
            <div
              className="text-[20px] font-semibold tracking-[-0.01em]"
              style={{ color: C.white }}
            >
              Cyanotype
            </div>
            <div
              className="mt-1 text-[10px] uppercase tracking-[0.26em]"
              style={{ ...mono, color: C.whiteSoft }}
            >
              ZZP · Platform
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.white }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.whiteSoft }}>
              {PROFIEL.rol}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[13px] font-semibold"
            style={{
              ...mono,
              background: C.prussianSoft,
              color: C.cyanBright,
              border: `1px solid ${C.lineStrong}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Navigatie — tab-strip met lichtgloed onder actief */}
      <nav
        className="relative mx-auto mt-6 flex max-w-5xl items-center gap-1 overflow-x-auto px-5 pb-4 md:px-10"
        aria-label="Hoofdnavigatie"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: on ? C.white : C.whiteSoft, fontWeight: on ? 700 : 500 }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute -bottom-[17px] left-2 right-2 h-[2px] rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(90deg, transparent, ${C.cyanBright}, transparent)`,
                  }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      <main className="relative mx-auto max-w-5xl px-5 py-9 md:px-10 md:py-12">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.cyanBright, C.green, C.cyan, C.amber];
  return (
    <div className="space-y-10">
      <section>
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ ...mono, color: C.cyan }}
        >
          Vandaag · {PROFIEL.plaats}
        </div>
        <h1
          className="mt-2 text-[32px] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-[42px]"
          style={{ color: C.white }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-md text-[14px] leading-relaxed" style={{ color: C.whiteSoft }}>
          Je afdruk is scherp belicht. Eén contour vraagt vandaag om licht — de rest staat vast.
        </p>
      </section>

      {/* Primaire actie — belicht paneel met varen-motief */}
      <Print botanic accent={C.cyan} className="p-0">
        <Glow />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
            </span>
            <h2
              className="mt-2 text-[23px] font-semibold leading-tight sm:text-[27px]"
              style={{ color: C.white }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: C.whiteSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
            style={{ background: C.cyanBright, color: C.prussianDeep }}
          >
            {primair.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </Print>

      {/* KPI-afdrukken */}
      <section>
        <Kop sub="In cijfers">Prestatie</Kop>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = tones[i % tones.length] as string;
            return (
              <Print key={k.label} interactive className="p-4">
                <div className="flex items-start justify-between">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: tone, boxShadow: `0 0 8px ${tone}` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ ...mono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                </div>
                <div
                  className="mt-3 text-[27px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
                  style={{ color: C.white }}
                >
                  {k.value}
                </div>
                <div className="mt-1 text-[11.5px]" style={{ color: C.whiteSoft }}>
                  {k.label}
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone} />
                </div>
              </Print>
            );
          })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <Kop sub="Beste match">Voor jou</Kop>
        <button
          onClick={onOpen}
          className="group mt-5 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Print
            interactive
            accent={C.lineStrong}
            className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
          >
            <span
              className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full"
              style={{
                background: C.prussianSoft,
                color: C.cyanBright,
                border: `1px solid ${C.cyan}`,
              }}
              aria-hidden="true"
            >
              <span
                className="relative text-[26px] font-semibold tabular-nums leading-none"
                style={mono}
              >
                {top.match}
              </span>
              <span
                className="relative text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={mono}
              >
                match
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[20px] font-semibold leading-tight" style={{ color: C.white }}>
                {top.titel}
              </h3>
              <div className="mt-1 text-[12.5px]" style={{ color: C.whiteSoft }}>
                {top.opdrachtgever} · {top.plaats} · {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <Pill key={t} tone={C.whiteSoft}>
                    {t}
                  </Pill>
                ))}
              </div>
            </div>
            <ArrowRight
              size={22}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.cyanBright }}
              aria-hidden="true"
            />
          </Print>
        </button>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 w-24 overflow-hidden rounded-full"
        style={{ background: "rgba(234,242,246,0.12)" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${C.cyan}, ${C.cyanBright})`,
            boxShadow: `0 0 8px ${C.cyan}`,
          }}
        />
      </div>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ ...mono, color: C.cyanBright }}
      >
        {value}%
      </span>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-7">
      <Kop sub="Open opdrachten">Marktplaats</Kop>

      <Print className="flex items-center gap-3 px-4 py-1">
        <Search size={17} style={{ color: C.whiteSoft }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none placeholder:opacity-45"
          style={{ color: C.white }}
        />
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums"
          style={{ ...mono, color: C.whiteSoft }}
        >
          {filtered.length}
        </span>
      </Print>

      {filtered.length === 0 ? (
        <Print botanic className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Leaf size={26} style={{ color: C.whiteSoft }} aria-hidden="true" />
          <p className="text-[20px] font-semibold" style={{ color: C.white }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.whiteSoft }}>
            Niets past bij “{q}”. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.cyanBright, color: C.prussianDeep }}
          >
            Zoekopdracht wissen
          </button>
        </Print>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Print interactive className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[18px] font-semibold leading-tight"
                      style={{ color: C.white }}
                    >
                      {o.titel}
                    </h3>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: C.whiteSoft }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <Pill key={t} tone={C.whiteSoft}>
                          {t}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MatchMeter value={o.match} />
                    <ArrowRight
                      size={19}
                      className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      style={{ color: C.cyanBright }}
                      aria-hidden="true"
                    />
                  </div>
                </Print>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-medium transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.whiteSoft }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.whiteSoft }}
          >
            {opdracht.id}
          </span>
          <Pill tone={C.cyanBright} solid>
            {opdracht.match}% match
          </Pill>
        </div>
        <h1
          className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
          style={{ color: C.white }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.whiteSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {feiten.map((m) => (
          <Print key={m.l} className="p-4">
            <m.Icon size={16} style={{ color: C.cyan }} aria-hidden="true" />
            <div
              className="mt-2 text-[18px] font-semibold tabular-nums leading-none"
              style={{ color: C.white }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.whiteSoft }}
            >
              {m.l}
            </div>
          </Print>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Print className="p-5" accent={C.green}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.6} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.white }}
              >
                <Check
                  size={16}
                  strokeWidth={2.4}
                  className="mt-0.5 shrink-0"
                  style={{ color: C.green }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Print>
        <Print className="p-5" accent={C.amber}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[14px] leading-snug"
                style={{ color: C.white }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: C.amber }}
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>
        </Print>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2.5"
          style={{ background: C.cyanBright, color: C.prussianDeep }}
        >
          Reageer op opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            border: `1px solid ${C.lineStrong}`,
            color: C.white,
            background: "rgba(234,242,246,0.05)",
          }}
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
      <Kop sub="Vertrouwen">Verificatie</Kop>

      {/* Zon-keurmerk: cirkelvormige belichtings-voortgang */}
      <Print botanic accent={C.cyan} className="flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="relative h-24 w-24 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="rgba(234,242,246,0.16)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={C.cyanBright}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              style={{ filter: `drop-shadow(0 0 3px ${C.cyan})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.white }}
            >
              {pct}%
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.whiteSoft }}
            >
              belicht
            </span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{ background: "rgba(234,242,246,0.08)", color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.whiteSoft }}>
            {verified} van {CREDENTIALS.length} credentials volledig belicht en geverifieerd. Eén
            dossier vraagt binnenkort actie — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Print>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Print className="flex items-center gap-4 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: "rgba(234,242,246,0.06)",
                    border: `1px solid ${st.tone}`,
                    color: st.tone,
                  }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[15px] font-semibold leading-tight"
                    style={{ color: C.white }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.whiteSoft }}>
                    {c.detail}
                  </div>
                </div>
                <Pill tone={st.tone}>
                  <st.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </Pill>
              </Print>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <Kop sub="De volgende beste stap">Volgende acties</Kop>
      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.cyanBright;
          return (
            <li key={a.titel}>
              <Print
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                accent={warn ? C.amber : C.line}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[16px] font-semibold tabular-nums"
                  style={{
                    ...mono,
                    background: "rgba(234,242,246,0.06)",
                    color: tone,
                    border: `1px solid ${tone}`,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sun size={14} strokeWidth={2.4} style={{ color: tone }} aria-hidden="true" />
                    )}
                    <h3
                      className="text-[17px] font-semibold leading-tight"
                      style={{ color: C.white }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.whiteSoft }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:self-center"
                  style={{ background: tone, color: C.prussianDeep }}
                >
                  {a.cta}
                </button>
              </Print>
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
    if (status === "Betaald") return C.green;
    if (status === "Openstaand") return C.amber;
    if (status === "Concept") return C.whiteSoft;
    return C.cyanBright;
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Kop sub="Omzet">Facturen</Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:hover:gap-2"
          style={{ background: C.cyanBright, color: C.prussianDeep }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Print className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.lineStrong}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.whiteSoft }}
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
                  className="transition-colors hover:bg-white/5"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.whiteSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3.5 text-[14px]" style={{ color: C.white }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3.5 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.whiteSoft }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3.5">
                    <Pill tone={tone}>
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </Pill>
                  </td>
                  <td
                    className="px-4 py-3.5 text-right text-[15px] font-semibold tabular-nums"
                    style={{ color: C.white }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.lineStrong}` }}>
              <td
                colSpan={4}
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.whiteSoft }}
              >
                Totaal betaald
              </td>
              <td
                className="px-4 py-4 text-right text-[19px] font-semibold tabular-nums"
                style={{ color: C.green }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Print>
    </div>
  );
}
