"use client";

// Concept 373 — "Gebrand" · Glas-in-lood / stained glass.
// Kathedraal-glaspanelen: juweel-tinten (kobalt, robijn, smaragd, amber) gescheiden door
// zwarte lood-lijnen (leading), met een subtiele binnengloed alsof licht door gekleurd glas valt.
// Mozaïek-segmenten als kaarten met dikke donkere randen. Diep, kleurrijk, sacraal-premium.
// Kobalt (#1b3a8f) · robijn (#9c2436) · smaragd (#1d6b53) · amber (#d69a2d) op lood-zwart/steen.
// Fonts: Cormorant (display), Manrope (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Sun,
  Diamond,
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

// — Palet: juweel-tinten op lood-zwart / donkere steen —
const C = {
  stone: "#14120f",
  stoneSoft: "#1c1915",
  lead: "#0b0a08",
  panel: "#191510",
  cobalt: "#1b3a8f",
  cobaltGlow: "#3a5fc0",
  ruby: "#9c2436",
  rubyGlow: "#c8495c",
  emerald: "#1d6b53",
  emeraldGlow: "#3f9c7e",
  amber: "#d69a2d",
  amberGlow: "#f0be5c",
  cream: "#f0e6d2",
  creamSoft: "#cdc0a6",
  muted: "#948a74",
  faint: "#6a6252",
  line: "rgba(11,10,8,0.9)",
  hair: "rgba(240,230,210,0.1)",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  glass: string;
  glow: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: Check,
        glass: C.emerald,
        glow: C.emeraldGlow,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        glass: C.cobalt,
        glow: C.cobaltGlow,
        alarm: false,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        glass: C.amber,
        glow: C.amberGlow,
        alarm: true,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        glass: C.ruby,
        glow: C.rubyGlow,
        alarm: true,
      };
  }
}

// Glaspaneel: donkere lood-rand met binnengloed van een juweel-tint.
function Glass({
  children,
  className = "",
  tint = C.cobalt,
  glow = C.cobaltGlow,
  strong = false,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: string;
  glow?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: `radial-gradient(120% 120% at 30% 0%, ${hexA(glow, strong ? 0.22 : 0.13)}, ${hexA(tint, strong ? 0.16 : 0.08)} 45%, ${C.panel} 100%)`,
        border: `3px solid ${C.lead}`,
        boxShadow: `inset 0 1px 0 ${hexA(glow, 0.25)}, inset 0 0 34px ${hexA(tint, 0.16)}`,
      }}
    >
      {children}
    </div>
  );
}

// Hex naar rgba helper (voor gloed-overlays).
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// — Rozetvenster: concentrische glas-segmenten door lood-lijnen gescheiden —
function Rosace({ size = 130 }: { size?: number }) {
  const c = size / 2;
  const tints = [C.cobalt, C.ruby, C.emerald, C.amber];
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a0 = (i / 8) * Math.PI * 2;
    const a1 = ((i + 1) / 8) * Math.PI * 2;
    const rr = c - 6;
    const x0 = c + Math.cos(a0) * rr;
    const y0 = c + Math.sin(a0) * rr;
    const x1 = c + Math.cos(a1) * rr;
    const y1 = c + Math.sin(a1) * rr;
    return (
      <path
        key={i}
        d={`M${c} ${c} L${x0} ${y0} A${rr} ${rr} 0 0 1 ${x1} ${y1} Z`}
        fill={hexA(tints[i % 4] ?? C.cobalt, 0.55)}
        stroke={C.lead}
        strokeWidth="2.5"
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={c - 3} fill={C.panel} stroke={C.lead} strokeWidth="3" />
      {petals}
      <circle
        cx={c}
        cy={c}
        r={c * 0.42}
        fill={hexA(C.amber, 0.6)}
        stroke={C.lead}
        strokeWidth="2.5"
      />
      <circle
        cx={c}
        cy={c}
        r={c * 0.18}
        fill={hexA(C.cream, 0.5)}
        stroke={C.lead}
        strokeWidth="2"
      />
    </svg>
  );
}

// — Sparkline als glas-mozaïeksegmenten (verticale scherven) —
function Spark({ data, tint, glow }: { data: number[]; tint: string; glow: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const hgt = 12 + ((d - min) / range) * 24;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[5px]"
            style={{
              height: hgt,
              background: last ? glow : hexA(tint, 0.7),
              border: `1px solid ${C.lead}`,
            }}
          />
        );
      })}
    </div>
  );
}

// — Verticale voortgang als gestapelde glasscherven —
function GlassGauge({ value, tint, glow }: { value: number; tint: string; glow: string }) {
  const segs = 6;
  const on = Math.round((value / 100) * segs);
  return (
    <div className="flex flex-col-reverse gap-1" aria-hidden="true">
      {Array.from({ length: segs }, (_, i) => (
        <span
          key={i}
          className="h-3 w-8"
          style={{
            background: i < on ? (i === on - 1 ? glow : hexA(tint, 0.7)) : hexA(C.cream, 0.06),
            border: `1.5px solid ${C.lead}`,
          }}
        />
      ))}
    </div>
  );
}

function Overline({
  children,
  color = C.amberGlow,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.34em]" style={{ color, ...body }}>
      {children}
    </p>
  );
}

function Tag({
  children,
  tint = C.cobalt,
  glow = C.cobaltGlow,
}: {
  children: React.ReactNode;
  tint?: string;
  glow?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: glow,
        background: hexA(tint, 0.22),
        border: `1.5px solid ${C.lead}`,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#f0be5c] focus-visible:ring-offset-[#14120f]";

const bg: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(circle at 50% -10%, rgba(58,95,192,0.1), transparent 55%), radial-gradient(circle at 90% 110%, rgba(214,154,45,0.08), transparent 50%), repeating-linear-gradient(90deg, rgba(11,10,8,0.4) 0 1px, transparent 1px 42px)",
};

export function Concept373() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...body, background: C.stone, color: C.cream, ...bg }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-24 pt-8">
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
  return (
    <header
      className="flex items-center justify-between border-b py-6"
      style={{ borderColor: C.hair }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-12 w-12 items-center justify-center"
          style={{
            background: `radial-gradient(circle at 40% 30%, ${hexA(C.amberGlow, 0.6)}, ${hexA(C.ruby, 0.4)})`,
            border: `3px solid ${C.lead}`,
          }}
          aria-hidden="true"
        >
          <Diamond size={18} color={C.cream} />
        </span>
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-[0.01em]" style={display}>
            Gebrand
          </p>
          <p
            className="mt-1 text-[9.5px] uppercase leading-none tracking-[0.34em]"
            style={{ color: C.muted }}
          >
            Atelier · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className={`hidden items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-125 sm:inline-flex ${ring}`}
          style={{
            color: C.amberGlow,
            background: hexA(C.amber, 0.16),
            border: `1.5px solid ${C.lead}`,
          }}
        >
          <Search size={13} aria-hidden="true" /> Zoeken
        </button>
        <span
          className="hidden items-center gap-1.5 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] sm:inline-flex"
          style={{
            color: C.emeraldGlow,
            background: hexA(C.emerald, 0.22),
            border: `1.5px solid ${C.lead}`,
          }}
        >
          <Sun size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold"
          style={{
            color: C.cream,
            background: `radial-gradient(circle at 35% 25%, ${hexA(C.cobaltGlow, 0.6)}, ${hexA(C.cobalt, 0.5)})`,
            border: `3px solid ${C.lead}`,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

const NAV_TINTS: { t: string; g: string }[] = [
  { t: C.cobalt, g: C.cobaltGlow },
  { t: C.ruby, g: C.rubyGlow },
  { t: C.emerald, g: C.emeraldGlow },
  { t: C.amber, g: C.amberGlow },
  { t: C.cobalt, g: C.cobaltGlow },
  { t: C.ruby, g: C.rubyGlow },
];

function tintAt(i: number): { t: string; g: string } {
  const len = NAV_TINTS.length;
  return NAV_TINTS[((i % len) + len) % len] ?? { t: C.cobalt, g: C.cobaltGlow };
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav className="flex items-stretch gap-1.5 overflow-x-auto py-4" aria-label="Hoofdnavigatie">
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        const { t, g } = tintAt(i);
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold transition-all ${ring}`}
            style={{
              color: on ? C.cream : C.creamSoft,
              background: on ? hexA(t, 0.5) : hexA(t, 0.12),
              border: `2px solid ${C.lead}`,
              boxShadow: on ? `inset 0 0 16px ${hexA(g, 0.35)}` : "none",
            }}
          >
            <span
              className="block h-2.5 w-2.5 rotate-45"
              style={{ background: g, border: `1px solid ${C.lead}` }}
              aria-hidden="true"
            />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
        <Glass
          tint={C.cobalt}
          glow={C.cobaltGlow}
          strong
          className="flex flex-col justify-between overflow-hidden p-8"
        >
          <div>
            <Overline>Vandaag</Overline>
            <h1
              className="mt-4 text-[46px] font-semibold leading-[0.98] tracking-[0.01em] md:text-[60px]"
              style={display}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.amberGlow }}>{PROFIEL.naam.split(" ")[0]}.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
              Het licht valt gunstig vandaag. Eén handeling houdt uw praktijk helder en in balans.
            </p>
          </div>
        </Glass>

        <Glass
          tint={C.ruby}
          glow={C.rubyGlow}
          className="flex flex-col justify-between overflow-hidden p-6"
        >
          <div className="absolute -right-6 -top-6 opacity-40" aria-hidden="true">
            <Rosace size={130} />
          </div>
          <div className="relative">
            <Overline color={C.rubyGlow}>Nu doen</Overline>
            <h2 className="mt-3 text-[23px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onActies}
            className={`group relative mt-5 inline-flex items-center gap-2 self-start px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
            style={{ background: hexA(C.amber, 0.9), color: C.lead, border: `2px solid ${C.lead}` }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Glass>
      </section>

      <section>
        <SectionHead title="Kerncijfers" note="Deze maand" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const pal = tintAt(i);
            return (
              <Glass key={k.label} tint={pal.t} glow={pal.g} className="p-5">
                <p className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[34px] font-semibold tabular-nums leading-none"
                  style={{ ...display, color: C.cream }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <Spark data={k.spark} tint={pal.t} glow={pal.g} />
                  <span
                    className="text-[10.5px] font-semibold tabular-nums"
                    style={{ color: k.up ? pal.g : C.rubyGlow }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
              </Glass>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHead
          title="Aanbevolen opdrachten"
          note="Op maat"
          action={{ label: "Naar marktplaats", onClick: onOpen }}
        />
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => {
            const pal = tintAt(i);
            return (
              <li key={o.id}>
                <button
                  onClick={onOpen}
                  className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-all hover:brightness-110 ${ring}`}
                  style={{ background: hexA(pal.t, 0.14), border: `2px solid ${C.lead}` }}
                >
                  <span
                    className="block h-9 w-3.5"
                    style={{ background: pal.g, border: `2px solid ${C.lead}` }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[18px] font-semibold"
                      style={{ ...display, color: C.cream }}
                    >
                      {o.titel}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <MatchBadge value={o.match} />
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.amberGlow }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function SectionHead({
  title,
  note,
  action,
}: {
  title: string;
  note: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="mb-5 flex items-end justify-between border-b pb-3"
      style={{ borderColor: C.hair }}
    >
      <h2 className="text-[26px] font-semibold" style={display}>
        {title}
      </h2>
      {action ? (
        <button
          onClick={action.onClick}
          className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-[#f0be5c] ${ring}`}
          style={{ color: C.amberGlow }}
        >
          {action.label}
        </button>
      ) : (
        <span className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: C.faint }}>
          {note}
        </span>
      )}
    </div>
  );
}

function MatchBadge({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Match ${value} procent`}>
      <span
        className="px-2 py-1 text-[14px] font-semibold tabular-nums"
        style={{
          color: C.cream,
          background: strong ? hexA(C.emerald, 0.55) : hexA(C.cobalt, 0.45),
          border: `1.5px solid ${C.lead}`,
        }}
      >
        {value}%
      </span>
    </span>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.hair }}
      >
        <div>
          <Overline>Panelen</Overline>
          <h1 className="mt-2 text-[40px] font-semibold leading-none" style={display}>
            Marktplaats
          </h1>
        </div>
        <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          opdrachten
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5"
          style={{ background: hexA(C.cobalt, 0.14), border: `2px solid ${C.lead}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.amberGlow }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6a6252]"
            style={{ color: C.cream }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-all ${ring}`}
                style={
                  on
                    ? {
                        background: hexA(C.amber, 0.85),
                        color: C.lead,
                        border: `2px solid ${C.lead}`,
                      }
                    : {
                        color: C.creamSoft,
                        background: hexA(C.cream, 0.05),
                        border: `2px solid ${C.lead}`,
                      }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Glass tint={C.cobalt} glow={C.cobaltGlow} className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <Rosace size={120} />
            <p className="mt-6 text-[28px] font-semibold" style={display}>
              Geen paneel gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Er past niets bij {q ? `“${q}”` : "uw zoekterm"}. Verruim de zoekopdracht om de
              panelen opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
              style={{
                background: hexA(C.amber, 0.9),
                color: C.lead,
                border: `2px solid ${C.lead}`,
              }}
            >
              Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </Glass>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtCard opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtCard({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pal = tintAt(index);
  return (
    <Glass tint={pal.t} glow={pal.g} className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-1 block h-12 w-3"
          style={{ background: pal.g, border: `2px solid ${C.lead}` }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3
            className="text-[21px] font-semibold leading-snug"
            style={{ ...display, color: C.cream }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t} tint={pal.t} glow={pal.g}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.emeraldGlow : C.cobaltGlow, ...display }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[13px] font-medium" style={{ color: C.creamSoft }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 border-t pt-3" style={{ borderColor: C.hair }}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-[#f0be5c] ${ring}`}
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[#f0be5c] ${ring}`}
          style={{ color: C.amberGlow }}
        >
          Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ReasonList title="Sterke punten" items={opdracht.redenen.plus} kind="plus" />
            <ReasonList title="Aandachtspunten" items={opdracht.redenen.min} kind="min" />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function ReasonList({
  title,
  items,
  kind,
}: {
  title: string;
  items: string[];
  kind: "plus" | "min";
}) {
  const alarm = kind === "min";
  return (
    <div>
      <Overline color={alarm ? C.rubyGlow : C.emeraldGlow}>{title}</Overline>
      <ul className="mt-2 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.creamSoft }}>
            {alarm ? (
              <AlertTriangle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.rubyGlow }}
              />
            ) : (
              <Check
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.emeraldGlow }}
              />
            )}
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#f0be5c] ${ring}`}
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass tint={C.cobalt} glow={C.cobaltGlow} strong className="overflow-hidden p-6 md:p-9">
        <div className="absolute -right-10 -top-10 opacity-45" aria-hidden="true">
          <Rosace size={200} />
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.12em]" style={{ color: C.amberGlow }}>
              {opdracht.id}
            </span>
            <Tag tint={C.emerald} glow={C.emeraldGlow}>
              {opdracht.match}% match
            </Tag>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[40px] font-semibold leading-[1.02] tracking-[0.01em] md:text-[52px]"
            style={{ ...display, color: C.cream }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.creamSoft }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
              style={{
                background: hexA(C.amber, 0.92),
                color: C.lead,
                border: `2px solid ${C.lead}`,
              }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
              style={{
                color: C.cream,
                background: hexA(C.cream, 0.06),
                border: `2px solid ${C.lead}`,
              }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Glass>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, p: tintAt(0) },
          { l: "Omvang", v: opdracht.uren, p: tintAt(1) },
          { l: "Start", v: opdracht.start, p: tintAt(2) },
          { l: "Match", v: `${opdracht.match}%`, p: tintAt(3) },
        ].map((m) => (
          <Glass key={m.l} tint={m.p.t} glow={m.p.g} className="p-4">
            <p className="text-[9.5px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums"
              style={{ ...display, color: C.cream }}
            >
              {m.v}
            </p>
          </Glass>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <Sun size={14} aria-hidden="true" style={{ color: C.amberGlow }} />
          <Overline>Verklaarbare matching</Overline>
        </div>
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
          Transparant onderbouwd op uw geverifieerde profiel — de sterke punten én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Glass tint={C.emerald} glow={C.emeraldGlow} className="p-5">
            <Overline color={C.emeraldGlow}>Sterke punten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.hair, color: C.creamSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.emeraldGlow }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
          <Glass tint={C.ruby} glow={C.rubyGlow} className="p-5">
            <Overline color={C.rubyGlow}>Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.hair, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.rubyGlow }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.hair }}
      >
        <div className="max-w-md">
          <Overline color={C.emeraldGlow}>Bewijs</Overline>
          <h1 className="mt-2 text-[40px] font-semibold leading-none" style={display}>
            Verificatie
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
            <span className="font-medium" style={{ color: C.emeraldGlow }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén vraagt binnenkort om
            vernieuwing.
          </p>
        </div>
        <Glass tint={C.emerald} glow={C.emeraldGlow} className="flex items-center gap-4 p-5">
          <GlassGauge value={ratio} tint={C.emerald} glow={C.emeraldGlow} />
          <div>
            <p
              className="text-[44px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.emeraldGlow }}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p className="mt-1 text-[9.5px] uppercase tracking-[0.18em]" style={{ color: C.faint }}>
              geverifieerd
            </p>
          </div>
        </Glass>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Glass tint={st.glass} glow={st.glow} className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${ring}`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center"
                    style={{ background: hexA(st.glass, 0.5), border: `2px solid ${C.lead}` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} style={{ color: C.cream }} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block truncate text-[17px] font-semibold"
                      style={{ ...display, color: C.cream }}
                    >
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag tint={st.glass} glow={st.glow}>
                      {st.label}
                    </Tag>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.amberGlow,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={15} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 border-t pl-14 pt-3" style={{ borderColor: C.hair }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.creamSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na uw
                        uitdrukkelijke toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
                          style={{
                            background: hexA(C.amber, 0.9),
                            color: C.lead,
                            border: `2px solid ${C.lead}`,
                          }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
                          style={{
                            color: C.creamSoft,
                            background: hexA(C.cream, 0.05),
                            border: `2px solid ${C.lead}`,
                          }}
                        >
                          Geschiedenis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="border-b pb-6" style={{ borderColor: C.hair }}>
        <Overline>Agenda · volgende stappen</Overline>
        <h1 className="mt-2 text-[40px] font-semibold leading-none" style={display}>
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.creamSoft }}>
          Handel deze op volgorde af — elke voltooide actie houdt uw praktijk helder en in balans.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const pal = warn ? { t: C.amber, g: C.amberGlow } : tintAt(i + 1);
          return (
            <li key={a.titel}>
              <Glass
                tint={pal.t}
                glow={pal.g}
                className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr_auto]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center text-[15px] font-semibold tabular-nums"
                  style={{
                    background: hexA(pal.t, 0.45),
                    color: C.cream,
                    border: `2px solid ${C.lead}`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.amberGlow }} />
                    ) : (
                      <Sun size={15} aria-hidden="true" style={{ color: pal.g }} />
                    )}
                    <h2
                      className="text-[18px] font-semibold leading-snug"
                      style={{ ...display, color: C.cream }}
                    >
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className={`justify-self-start px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 sm:justify-self-end ${ring}`}
                  style={
                    warn
                      ? {
                          background: hexA(C.amber, 0.9),
                          color: C.lead,
                          border: `2px solid ${C.lead}`,
                        }
                      : {
                          color: C.cream,
                          background: hexA(pal.t, 0.3),
                          border: `2px solid ${C.lead}`,
                        }
                  }
                >
                  {a.cta}
                </button>
              </Glass>
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

function factuurTint(status: string): { t: string; g: string } {
  if (status === "Openstaand") return { t: C.ruby, g: C.rubyGlow };
  if (status === "Concept") return { t: C.amber, g: C.amberGlow };
  return { t: C.emerald, g: C.emeraldGlow };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.hair }}
      >
        <div>
          <Overline>Register</Overline>
          <h1 className="mt-2 text-[40px] font-semibold leading-none" style={display}>
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-125 ${ring}`}
          style={{ background: hexA(C.amber, 0.9), color: C.lead, border: `2px solid ${C.lead}` }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "2 voldaan", p: tintAt(2), alarm: false },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            p: { t: C.ruby, g: C.rubyGlow },
            alarm: true,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            p: { t: C.amber, g: C.amberGlow },
            alarm: false,
          },
        ].map((s) => (
          <Glass key={s.l} tint={s.p.t} glow={s.p.g} className="p-5">
            <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums"
              style={{ ...display, color: s.alarm ? C.rubyGlow : C.cream }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass tint={C.cobalt} glow={C.cobaltGlow} className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.hair }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const ft = factuurTint(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[rgba(240,230,210,0.04)] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderColor: C.hair }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-semibold sm:order-2"
                  style={{ ...display, color: C.cream }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag tint={ft.t} glow={ft.g}>
                    {f.status}
                  </Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.rubyGlow : C.cream }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span className="text-[9.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ ...display, color: C.emeraldGlow }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Glass>
    </div>
  );
}
