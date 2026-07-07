"use client";

// Concept 169 — "Getijden-almanak" · maritiem-tabellarische esthetiek. Nederlandse
// zeevaart-almanak / getijdentabel: dichte tabellarische informatie (getijtabellen-gevoel),
// maanstanden- en zon-op/onder-glyphs, fijne tabel-hairlines, kompas- en eb/vloed-motieven,
// klassiek zeevaart-papier (perkament/creme) met een koel marineblauw accent. Informatie-DICHT
// maar leesbaar — data-esthetiek. Onderscheidend van zeekaart (kaart/kompasroos) en data-terminal
// (fintech): dit is een GEDRUKTE ALMANAK vol tabellen/tijden. Status nooit kleur-alleen: altijd
// label + icoon. Deterministisch — geen random/Date. UI-taal Nederlands.
// Fonts: Newsreader (redactioneel serif) + IBM Plex (tekst) + mono (getallen/tijden).

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  Anchor,
  Compass,
  Waves,
  Moon,
  Sunrise,
  Sunset,
  Navigation,
  Wind,
  Droplets,
  TriangleAlert,
  ChevronRight,
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

// ── Palet — perkament-papier, marineblauwe inkt, koraal eb/vloed-accent ──────────
const C = {
  paper: "#f5efe0", // gebroken almanak-papier
  paperDeep: "#ede4d0", // rij-arcering / secundair vlak
  paperEdge: "#e4d9c0", // paginarand
  ink: "#12324e", // marineblauwe drukinkt
  inkSoft: "#3a5872", // secundaire inkt
  inkFaint: "#7c8ea0", // labels / meta
  navy: "#0d2740", // diep marineblauw (koppen/velden)
  navyDeep: "#081b2e", // diepste vlak (kompasroos-veld)
  sea: "#1f6f8b", // koel zee-accent (vloed)
  seaSoft: "#dbe7ea", // zee-tint (vlak)
  brass: "#b8892f", // messing/koper (kompas, zon)
  brassSoft: "#f0e2c4", // messing-tint
  coral: "#b5462f", // eb / waarschuwing
  coralSoft: "#f2ddd3",
  moss: "#3d6b4a", // geverifieerd (groen-blauw)
  mossSoft: "#dae8dd",
  line: "#c8b89b", // fijne hairline (perkament)
  lineDark: "#12324e",
  white: "#fbf8f0",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-plex)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Fijne dubbele hairline — het typografische almanak-motief.
const ruleTop = { borderTop: `1px solid ${C.line}` };

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.moss, bg: C.mossSoft, ring: C.moss };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.sea, bg: C.seaSoft, ring: C.sea };
    case "EXPIRING":
      return {
        label: "Verloopt spoedig",
        Icon: Sunset,
        fg: C.brass,
        bg: C.brassSoft,
        ring: C.brass,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.coral, bg: C.coralSoft, ring: C.coral };
  }
}

function StatusTag({ status, compact = false }: { status: CredStatus; compact?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"} font-medium tracking-[0.04em]`}
      style={{ ...mono, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}55` }}
    >
      <m.Icon size={compact ? 10 : 12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Kompasroos — decoratief maar strak (SVG, geen gloed). Kern-motief van de almanak.
function CompassRose({ size = 56, stroke = C.brass }: { size?: number; stroke?: string }) {
  const c = size / 2;
  const pts = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const star = [0, 90, 180, 270].map((a) => {
    const [tx, ty] = pts(c - 3, a);
    const [lx, ly] = pts((c - 3) * 0.24, a + 45);
    const [rx, ry] = pts((c - 3) * 0.24, a - 45);
    return `${tx},${ty} ${rx},${ry} ${c},${c} ${lx},${ly}`;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={c - 2} fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.5} />
      <circle
        cx={c}
        cy={c}
        r={(c - 2) * 0.62}
        fill="none"
        stroke={stroke}
        strokeWidth={0.6}
        opacity={0.35}
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const [x1, y1] = pts(c - 3, a);
        return (
          <line
            key={a}
            x1={c}
            y1={c}
            x2={x1}
            y2={y1}
            stroke={stroke}
            strokeWidth={0.5}
            opacity={0.35}
          />
        );
      })}
      {star.map((p, i) => (
        <polygon
          key={i}
          points={p}
          fill={i % 2 === 0 ? stroke : "none"}
          stroke={stroke}
          strokeWidth={0.7}
          opacity={i % 2 === 0 ? 0.85 : 0.55}
        />
      ))}
      <circle cx={c} cy={c} r={1.6} fill={stroke} />
    </svg>
  );
}

// Maanfase-glyph — deterministische schijngestalte per index (0..7).
function MoonGlyph({ phase, size = 16 }: { phase: number; size?: number }) {
  const p = ((phase % 8) + 8) % 8;
  const full = p === 4;
  const newMoon = p === 0;
  const waxing = p < 4;
  const frac = full ? 1 : newMoon ? 0 : p < 4 ? p / 4 : (8 - p) / 4;
  return (
    <span
      className="relative inline-block"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: newMoon ? C.navyDeep : C.brass,
          boxShadow: `inset 0 0 0 1px ${C.navy}`,
        }}
      />
      {!full && !newMoon && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: C.navyDeep,
            clipPath: waxing ? `inset(0 0 0 ${frac * 100}%)` : `inset(0 ${frac * 100}% 0 0)`,
          }}
        />
      )}
    </span>
  );
}

// Kop met genummerd tabel-bordje (almanak-sectie-index).
function SectionHead({
  index,
  title,
  sub,
  Icon,
}: {
  index: string;
  title: string;
  sub?: string;
  Icon: LucideIcon;
}) {
  return (
    <div
      className="flex items-end justify-between gap-3 pb-2"
      style={{ borderBottom: `2px solid ${C.ink}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center text-[12px] font-semibold tabular-nums"
          style={{ ...mono, background: C.navy, color: C.brass }}
        >
          {index}
        </span>
        <div>
          <h2
            className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
            style={{ ...display, color: C.ink }}
          >
            {title}
          </h2>
          {sub && (
            <p
              className="mt-1 text-[11px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <Icon size={18} strokeWidth={1.6} style={{ color: C.brass }} aria-hidden="true" />
    </div>
  );
}

// Perkament-paneel met fijne rand.
function Panel({
  children,
  className = "",
  bg = C.paper,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{ background: bg, boxShadow: `0 0 0 1px ${C.line}`, ...style }}
    >
      {children}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={12} strokeWidth={1.8} style={{ color: C.brass }} aria-hidden="true" />
      <span className="truncate" style={body}>
        {value}
      </span>
    </div>
  );
}

// Match-getij: hoog getij (hoge match) → vloed-tint.
function matchTide(m: number): { bg: string; fg: string; label: string } {
  if (m >= 90) return { bg: C.mossSoft, fg: C.moss, label: "Springtij" };
  if (m >= 84) return { bg: C.seaSoft, fg: C.sea, label: "Vloed" };
  return { bg: C.brassSoft, fg: C.brass, label: "Doodtij" };
}

// Getij-sparkline — golfvormige lijn (peil), deterministisch geschaald.
function TideLine({ data, w = 96, h = 30 }: { data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts: [number, number][] = data.map((v, i) => {
    const x = i * step;
    const y = h - 3 - ((v - min) / span) * (h - 6);
    return [x, y];
  });
  const path = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1] ?? [0, 0];
  const [lx, ly] = last;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={area} fill={C.sea} opacity={0.1} />
      <path d={path} fill="none" stroke={C.sea} strokeWidth={1.4} strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2.4} fill={C.brass} stroke={C.paper} strokeWidth={1} />
    </svg>
  );
}

// Deterministische getijdentabel-rijen (vaste tijden — geen Date).
const GETIJ_ROWS: { tijd: string; peil: string; type: "hoog" | "laag"; maan: number }[] = [
  { tijd: "03:14", peil: "1,82 m", type: "hoog", maan: 2 },
  { tijd: "09:41", peil: "0,21 m", type: "laag", maan: 3 },
  { tijd: "15:38", peil: "1,74 m", type: "hoog", maan: 4 },
  { tijd: "22:02", peil: "0,34 m", type: "laag", maan: 5 },
];

const ZON: { label: string; tijd: string; Icon: LucideIcon }[] = [
  { label: "Zon op", tijd: "05:26", Icon: Sunrise },
  { label: "Zon onder", tijd: "22:01", Icon: Sunset },
  { label: "Getijverschil", tijd: "1,61 m", Icon: Waves },
  { label: "Windkracht", tijd: "3 Bft ZW", Icon: Wind },
];

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept169() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...body,
        background: C.paper,
        color: C.ink,
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0 33px, ${C.line}22 33px 34px)`,
      }}
    >
      {/* Kop — almanak-titelblok met kompasroos */}
      <header style={{ background: C.navy }}>
        <div
          className="h-1 w-full"
          style={{
            background: `repeating-linear-gradient(90deg, ${C.brass} 0 2px, transparent 2px 8px)`,
          }}
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3.5">
            <span className="hidden sm:block">
              <CompassRose size={48} stroke={C.brass} />
            </span>
            <div className="leading-tight">
              <div
                className="text-[11px] uppercase tracking-[0.34em]"
                style={{ ...mono, color: C.brass }}
              >
                Nautische Almanak
              </div>
              <div
                className="text-[24px] font-semibold leading-none tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                Getijden &amp; Diensten
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Editie MMXXVI · Peilstation Utrecht
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className="hidden items-center gap-1.5 px-2.5 py-1 text-[11px] tracking-[0.06em] sm:inline-flex"
              style={{ ...mono, background: C.brassSoft, color: C.navy }}
            >
              <Anchor size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center text-[12px] font-semibold"
              style={{ ...mono, background: C.brass, color: C.navyDeep }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — almanak-register (tabbladen als index-lemmata) */}
        <nav
          className="mx-auto flex max-w-6xl items-stretch gap-0 overflow-x-auto px-4 md:px-8"
          aria-label="Schermen"
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group relative shrink-0 px-3.5 py-2.5 text-[12px] tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...mono,
                  color: on ? C.brass : C.inkFaint,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                <span className="tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>{" "}
                {s.label}
                <span
                  className="absolute bottom-0 left-0 h-[3px] w-full transition-opacity"
                  style={{ background: C.brass, opacity: on ? 1 : 0 }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
        className="mx-auto max-w-6xl px-4 pb-8 md:px-8"
        style={{ ...mono, color: C.inkFaint }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10px] uppercase tracking-[0.2em]"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <span>Getijden herleid uit LAT · presentatie-almanak</span>
          <span className="flex items-center gap-1.5">
            <Compass size={11} strokeWidth={1.8} aria-hidden="true" /> Koers vast · pagina 169
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — almanak-titelpagina met getijband */}
      <Panel bg={C.navy} className="overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.6fr_1fr]">
          <div
            className="pointer-events-none absolute -right-10 -top-10 hidden lg:block"
            aria-hidden="true"
            style={{ opacity: 0.4 }}
          >
            <CompassRose size={200} stroke={C.brass} />
          </div>
          <div className="relative">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
              style={{ ...mono, background: C.brass, color: C.navyDeep }}
            >
              <Navigation size={11} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 max-w-xl text-[30px] font-semibold leading-[1.05] tracking-[-0.01em] sm:text-[40px]"
              style={{ ...display, color: C.white }}
            >
              Gunstig tij: drie diensten boven 85% match.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14px] leading-relaxed"
              style={{ ...body, color: C.inkFaint }}
            >
              Het peil staat hoog. Eén post vraagt aandacht — je VOG nadert de kim. Zet koers en
              blijf verifieerbaar aan boord.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.brass,
                  color: C.navyDeep,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                Bekijk diensten <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium tracking-[0.02em] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: "transparent",
                  color: C.white,
                  boxShadow: `inset 0 0 0 1px ${C.inkFaint}`,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" /> Los post op
              </button>
            </div>
          </div>

          {/* Getijband — zon/maan-blok */}
          <div
            className="relative grid grid-cols-2 gap-px"
            style={{ background: `${C.inkFaint}44` }}
          >
            {ZON.map((z) => (
              <div
                key={z.label}
                className="flex flex-col gap-1 p-3.5"
                style={{ background: C.navyDeep }}
              >
                <z.Icon size={15} strokeWidth={1.6} style={{ color: C.brass }} aria-hidden="true" />
                <span
                  className="mt-1 text-[19px] font-semibold tabular-nums leading-none"
                  style={{ ...mono, color: C.white }}
                >
                  {z.tijd}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {z.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* KPI-tabel — almanak-datastrook */}
      <section>
        <SectionHead index="I" title="Peilwaarden" sub="Etmaal-overzicht" Icon={Waves} />
        <div className="mt-4 grid grid-cols-2 gap-px lg:grid-cols-4" style={{ background: C.line }}>
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="group flex flex-col gap-2 p-4 transition-colors hover:bg-[#ede4d0]"
              style={{ background: C.paper }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] tabular-nums"
                  style={{
                    ...mono,
                    background: k.up ? C.mossSoft : C.brassSoft,
                    color: k.up ? C.moss : C.brass,
                  }}
                >
                  {k.up ? (
                    <Sunrise size={9} aria-hidden="true" />
                  ) : (
                    <Sunset size={9} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <div
                className="text-[27px] font-semibold leading-none tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <TideLine data={k.spark} />
            </div>
          ))}
        </div>
      </section>

      {/* Getijdentabel + status-kolom */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr]">
        <section>
          <SectionHead
            index="II"
            title="Aanbevolen diensten"
            sub="Op tij gesorteerd"
            Icon={Anchor}
          />
          <div
            className="mt-4 space-y-px"
            style={{ background: C.line, boxShadow: `0 0 0 1px ${C.line}` }}
          >
            {OPDRACHTEN.map((o) => {
              const tide = matchTide(o.match);
              return (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-stretch gap-0 text-left transition-colors hover:bg-[#ede4d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ background: C.paper, ["--tw-ring-color" as string]: C.brass }}
                >
                  <span
                    className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 py-4"
                    style={{ background: tide.bg }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[22px] font-semibold tabular-nums leading-none"
                      style={{ ...display, color: tide.fg }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] uppercase tracking-[0.1em]"
                      style={{ ...mono, color: tide.fg }}
                    >
                      {tide.label}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-semibold leading-tight"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12px]"
                          style={{ ...body, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.brass }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1"
                          style={{ ...body, color: C.moss }}
                        >
                          <Check size={11} strokeWidth={2.4} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          {/* Verificatie-dekking als peil-meter */}
          <div>
            <SectionHead
              index="III"
              title="Waterlijn"
              sub="Certificaat-dekking"
              Icon={ShieldCheck}
            />
            <Panel className="mt-4 p-5">
              <div className="flex items-end justify-between">
                <div
                  className="text-[46px] font-semibold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.ink }}
                >
                  {dek}
                  <span className="text-[20px]" style={{ color: C.inkFaint }}>
                    %
                  </span>
                </div>
                <StatusTag status="VERIFIED" />
              </div>
              <div className="mt-2 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                {verified}/{CREDENTIALS.length} certificaten boven de waterlijn
              </div>
              <div
                className="relative mt-3 h-6 w-full overflow-hidden"
                style={{ background: C.seaSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
                aria-hidden="true"
              >
                <div
                  className="absolute bottom-0 left-0 top-0"
                  style={{
                    width: `${dek}%`,
                    background: `repeating-linear-gradient(90deg, ${C.sea}cc 0 6px, ${C.sea}99 6px 12px)`,
                  }}
                />
                <div className="absolute inset-y-0 flex items-center" style={{ left: `${dek}%` }}>
                  <Droplets size={12} strokeWidth={2} style={{ color: C.navy, marginLeft: -6 }} />
                </div>
              </div>
            </Panel>
          </div>

          {/* Prioriteit — stormwaarschuwing */}
          <Panel bg={C.coralSoft} className="p-5" style={{ boxShadow: `0 0 0 1px ${C.coral}55` }}>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, background: C.coral, color: C.white }}
            >
              <TriangleAlert size={11} strokeWidth={2.2} aria-hidden="true" /> Stormsein
            </span>
            <h3
              className="mt-2.5 text-[17px] font-semibold leading-tight"
              style={{ ...display, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...body, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                background: C.coral,
                color: C.white,
                ["--tw-ring-color" as string]: C.coral,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </Panel>
        </section>
      </div>

      {/* Getijdentabel — het signatuur-motief: dichte tabel met maanfasen */}
      <section>
        <SectionHead
          index="IV"
          title="Getijdentabel"
          sub="Hoog- en laagwater · maanstand"
          Icon={Moon}
        />
        <Panel className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left" style={mono}>
            <thead>
              <tr style={{ background: C.navy }}>
                {["Tij", "Tijd", "Peil (NAP)", "Maanstand", "Faseduiding"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: C.brass }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GETIJ_ROWS.map((r, i) => (
                <tr
                  key={r.tijd}
                  className="transition-colors hover:bg-[#ede4d0]"
                  style={{ background: i % 2 === 0 ? C.paper : C.paperDeep, ...ruleTop }}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-[12px]"
                      style={{ color: r.type === "hoog" ? C.sea : C.coral }}
                    >
                      {r.type === "hoog" ? (
                        <Waves size={13} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Anchor size={12} strokeWidth={2} aria-hidden="true" />
                      )}
                      {r.type === "hoog" ? "Hoogwater" : "Laagwater"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[14px] tabular-nums" style={{ color: C.ink }}>
                    {r.tijd}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] tabular-nums" style={{ color: C.inkSoft }}>
                    {r.peil}
                  </td>
                  <td className="px-4 py-2.5">
                    <MoonGlyph phase={r.maan} size={16} />
                  </td>
                  <td className="px-4 py-2.5 text-[12px]" style={{ color: C.inkFaint }}>
                    {
                      [
                        "Nieuwe maan",
                        "Wassend",
                        "Eerste kwartier",
                        "Wassend",
                        "Volle maan",
                        "Afnemend",
                        "Laatste kwartier",
                        "Afnemend",
                      ][r.maan]
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>
    </div>
  );
}

// ── Marktplaats ──────────────────────────────────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead
          index="V"
          title="Vaargebied"
          sub="Open diensten in de kaartsectie"
          Icon={Compass}
        />
        <Panel className="flex items-center gap-2 px-3 py-1.5">
          <Search size={15} style={{ color: C.brass }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek dienst of haven…"
            aria-label="Diensten zoeken"
            className="w-44 bg-transparent py-1 text-[12px] tracking-[0.02em] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </Panel>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Compass size={34} strokeWidth={1.4} style={{ color: C.inkFaint }} aria-hidden="true" />
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen bestemming gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...body, color: C.inkSoft }}>
            Buiten bereik voor &ldquo;{q}&rdquo;. Verleg je koers met een andere zoekterm.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: C.navy,
              color: C.brass,
              ["--tw-ring-color" as string]: C.navy,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const tide = matchTide(o.match);
            return (
              <Panel
                key={o.id}
                className="group flex flex-col transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-stretch" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <span
                    className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 py-3"
                    style={{ background: tide.bg }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[19px] font-semibold tabular-nums leading-none"
                      style={{ ...display, color: tide.fg }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[7.5px] uppercase tracking-[0.08em]"
                      style={{ ...mono, color: tide.fg }}
                    >
                      {tide.label}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-3.5">
                    <div
                      className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em]"
                      style={{ ...mono, color: C.inkFaint }}
                    >
                      {o.id}
                    </div>
                    <h3
                      className="mt-1 text-[15px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[11.5px]" style={{ ...body, color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="p-3.5">
                  <dl className="grid grid-cols-2 gap-y-1.5 text-[11.5px]">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10px] tracking-[0.02em]"
                        style={{
                          ...mono,
                          background: C.paperDeep,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium tracking-[0.04em] transition-colors hover:bg-[#0d2740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...mono,
                    background: C.navy,
                    color: C.brass,
                    ["--tw-ring-color" as string]: C.brass,
                  }}
                >
                  Bekijk dienst <ArrowRight size={14} aria-hidden="true" />
                </button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Aanvang", v: opdracht.start, Icon: CalendarDays },
    { l: "Haven", v: opdracht.plaats, Icon: MapPin },
  ];
  const tide = matchTide(opdracht.match);
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] tracking-[0.02em] transition-colors hover:bg-[#ede4d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          background: C.paper,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.brass,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar vaargebied
      </button>

      <Panel bg={C.navy} className="overflow-hidden">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -bottom-16 -right-10 hidden md:block"
            aria-hidden="true"
            style={{ opacity: 0.35 }}
          >
            <CompassRose size={180} stroke={C.brass} />
          </div>
          <div className="relative min-w-0">
            <span
              className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
              style={{ ...mono, background: C.brass, color: C.navyDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[34px]"
              style={{ ...display, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...body, color: C.inkFaint }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="relative flex flex-col items-center px-5 py-2"
            style={{ borderLeft: `1px solid ${C.brass}66` }}
          >
            <span
              className="text-[50px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.brass }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              % · {tide.label}
            </span>
          </div>
        </div>
      </Panel>

      <div
        className="grid grid-cols-2 gap-px lg:grid-cols-4"
        style={{ background: C.line, boxShadow: `0 0 0 1px ${C.line}` }}
      >
        {feiten.map((f) => (
          <div
            key={f.l}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-[#ede4d0]"
            style={{ background: C.paper }}
          >
            <f.Icon size={15} strokeWidth={1.6} style={{ color: C.brass }} aria-hidden="true" />
            <div
              className="text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section>
          <SectionHead index="+" title="Gunstige stroming" sub="Waarom dit past" Icon={Check} />
          <Panel className="mt-4 p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...body, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.mossSoft, boxShadow: `inset 0 0 0 1px ${C.moss}66` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.moss }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section>
          <SectionHead index="!" title="Tegenstroom" sub="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="mt-4 p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...body, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.brassSoft, boxShadow: `inset 0 0 0 1px ${C.brass}66` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.brass }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-medium tracking-[0.04em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.brass,
            color: C.navyDeep,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          Meld je aan voor deze dienst <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-medium tracking-[0.04em] transition-colors hover:bg-[#ede4d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.paper,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Star size={15} strokeWidth={1.8} aria-hidden="true" /> In logboek
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead
          index="VI"
          title="Scheepspapieren"
          sub="Verificatie &amp; certificaten"
          Icon={ShieldCheck}
        />
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.navy,
            color: C.brass,
            ["--tw-ring-color" as string]: C.navy,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Papier toevoegen
        </button>
      </div>

      <Panel bg={C.navy} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-5">
            <div
              className="text-[52px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.brass }}
            >
              {dek}
              <span className="text-[22px]" style={{ color: C.inkFaint }}>
                %
              </span>
            </div>
            <div className="max-w-xs">
              <div className="text-[15px] font-semibold" style={{ ...display, color: C.white }}>
                {verified}/{CREDENTIALS.length} boven de waterlijn
              </div>
              <p className="mt-1 text-[12px] leading-snug" style={{ ...body, color: C.inkFaint }}>
                Opdrachtgevers zien alleen geverifieerde papieren. Hoger peil = meer vertrouwen bij
                het aanmonsteren.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] tracking-[0.04em]"
            style={{ ...mono, background: C.brass, color: C.navyDeep }}
          >
            <Anchor size={13} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Panel>

      {/* Verificatie als register-tabel met statusovergangen */}
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ background: C.paperDeep }}>
              {["Certificaat", "Duiding", "Status", "Handeling"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const actionable = c.status !== "VERIFIED";
              return (
                <tr
                  key={c.naam}
                  className="transition-colors hover:bg-[#ede4d0]"
                  style={i === 0 ? undefined : ruleTop}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center"
                        style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.ring}55` }}
                        aria-hidden="true"
                      >
                        <m.Icon size={15} strokeWidth={2} style={{ color: m.fg }} />
                      </span>
                      <span
                        className="text-[13.5px] font-semibold"
                        style={{ ...display, color: C.ink }}
                      >
                        {c.naam}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ ...body, color: C.inkSoft }}>
                    {c.detail}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    {actionable ? (
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] transition-colors hover:bg-[#0d2740] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...mono,
                          background: C.navy,
                          color: C.brass,
                          ["--tw-ring-color" as string]: C.navy,
                        }}
                      >
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Voortgang"}
                        <ArrowRight size={11} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                        Geen actie
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {/* Loading-toestand — skeleton in het inkomend-papier-paneel */}
      <section>
        <SectionHead index="—" title="Ingekomen ter beoordeling" sub="Peiling loopt" Icon={Clock} />
        <Panel className="mt-4 divide-y" style={{ borderColor: C.line }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <span
                className="h-8 w-8 shrink-0 animate-pulse"
                style={{ background: C.paperDeep }}
                aria-hidden="true"
              />
              <div className="flex-1 space-y-2">
                <span
                  className="block h-3 w-1/3 animate-pulse"
                  style={{ background: C.paperDeep }}
                  aria-hidden="true"
                />
                <span
                  className="block h-2.5 w-1/2 animate-pulse"
                  style={{ background: C.paperEdge }}
                  aria-hidden="true"
                />
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Peilt…
              </span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        index="VII"
        title="Koersorders"
        sub="Volgende beste manoeuvres — bovenste eerst"
        Icon={Navigation}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel
                className="flex items-stretch overflow-hidden transition-transform hover:-translate-y-0.5"
                bg={warn ? C.coralSoft : C.paper}
                style={warn ? { boxShadow: `0 0 0 1px ${C.coral}55` } : undefined}
              >
                <span
                  className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 text-[24px] font-semibold tabular-nums"
                  style={{
                    ...display,
                    background: warn ? C.coral : C.navy,
                    color: warn ? C.white : C.brass,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={20} strokeWidth={2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]"
                      style={{
                        ...mono,
                        background: warn ? C.coral : C.navy,
                        color: warn ? C.white : C.brass,
                      }}
                    >
                      {warn ? (
                        <Wind size={10} strokeWidth={2.2} aria-hidden="true" />
                      ) : (
                        <Star size={10} strokeWidth={2.2} aria-hidden="true" />
                      )}
                      {warn ? "Storm op komst" : "Gunstig tij"}
                    </span>
                    <h3
                      className="text-[15.5px] font-semibold leading-tight"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ ...body, color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.coral,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.coral,
                          }
                        : {
                            ...mono,
                            background: C.navy,
                            color: C.brass,
                            ["--tw-ring-color" as string]: C.navy,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook als scheepspost — verrijking */}
      <section>
        <SectionHead index="—" title="Scheepspost" sub="Ingekomen berichten" Icon={FileText} />
        <Panel className="mt-4">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-[#ede4d0]"
              style={i === 0 ? undefined : ruleTop}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{ ...mono, background: C.navy, color: C.brass }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.coral }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...body, color: C.inkSoft }}>
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ ...mono, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Voldaan", Icon: Check, fg: C.moss, bg: C.mossSoft, ring: C.moss };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.brass, bg: C.brassSoft, ring: C.brass };
    return { label: "Concept", Icon: FileText, fg: C.sea, bg: C.seaSoft, ring: C.sea };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead
          index="VIII"
          title="Vrachtbrief"
          sub="Facturen &amp; afrekening"
          Icon={FileText}
        />
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.brass,
            color: C.navyDeep,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-px sm:grid-cols-3"
        style={{ background: C.line, boxShadow: `0 0 0 1px ${C.line}` }}
      >
        {[
          { l: "Voldaan (mnd)", v: betaald, bg: C.navy, fg: C.brass, faint: C.inkFaint },
          { l: "Openstaand", v: `${open}`, bg: C.paper, fg: C.ink, faint: C.inkFaint },
          { l: "Te factureren", v: "€ 1.350", bg: C.paper, fg: C.ink, faint: C.inkFaint },
        ].map((s) => (
          <div key={s.l} className="flex flex-col gap-2 p-4" style={{ background: s.bg }}>
            <div
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ ...mono, color: s.faint }}
            >
              {s.l}
            </div>
            <div
              className="text-[26px] font-semibold tabular-nums leading-none tracking-[-0.01em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr style={{ background: C.navy }}>
              {["Nummer", "Bevrachter", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.brass }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = factMeta(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#ede4d0]"
                  style={{
                    background: i % 2 === 0 ? C.paper : C.paperDeep,
                    ...(i === 0 ? {} : ruleTop),
                  }}
                >
                  <td
                    className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]" style={{ ...body, color: C.inkSoft }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] tabular-nums"
                    style={{ ...mono, color: C.inkFaint }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] tracking-[0.04em]"
                      style={{
                        ...mono,
                        background: m.bg,
                        color: m.fg,
                        boxShadow: `inset 0 0 0 1px ${m.ring}55`,
                      }}
                    >
                      <m.Icon size={11} strokeWidth={2.2} aria-hidden="true" /> {m.label}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: C.navy }}>
              <td
                colSpan={4}
                className="px-4 py-3 text-[11px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Totaal voldaan · dit etmaal
              </td>
              <td
                className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                style={{ ...display, color: C.brass }}
              >
                {betaald}
              </td>
            </tr>
          </tfoot>
        </table>
      </Panel>

      {/* Fout-toestand — voorbeeld inline foutmelding (koersfout) */}
      <Panel
        bg={C.coralSoft}
        className="flex flex-wrap items-center gap-3 p-4"
        style={{ boxShadow: `0 0 0 1px ${C.coral}55` }}
      >
        <XCircle size={18} strokeWidth={2} style={{ color: C.coral }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
            Synchronisatie mislukt
          </div>
          <p className="text-[12px]" style={{ ...body, color: C.inkSoft }}>
            De koppeling met de boekhouding gaf geen antwoord. Controleer de verbinding en probeer
            opnieuw.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium tracking-[0.02em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.coral,
            color: C.white,
            ["--tw-ring-color" as string]: C.coral,
          }}
        >
          Opnieuw <ArrowRight size={12} aria-hidden="true" />
        </button>
      </Panel>
    </div>
  );
}
