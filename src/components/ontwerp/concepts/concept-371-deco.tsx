"use client";

// Concept 371 — "Deco" · Art Deco / Gatsby geometrisch goud.
// Symmetrische deco-waaiers en zonnestralen, chevron- en trapmotieven, fijne dubbele
// goudlijnen (linework) op diep onyx/smaragd. Hoge symmetrie, statig en luxueus.
// Onyx (#12100e) & smaragd (#0f2e26) met champagne-goud (#c9a24b) en crème (#f3ead6).
// Fonts: Cormorant (display), Jakarta (body), Space Mono (cijfers/labels).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Gem,
  Crown,
  Sparkle,
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

// — Palet: onyx & smaragd met champagne-goud en crème —
const C = {
  onyx: "#12100e",
  onyxSoft: "#1b1813",
  emerald: "#0f2e26",
  emeraldSoft: "#123a30",
  panel: "#171410",
  gold: "#c9a24b",
  goldBright: "#e2c274",
  goldDeep: "#8f6f2c",
  cream: "#f3ead6",
  creamSoft: "#d8cdb4",
  muted: "#9a8f78",
  faint: "#6f6552",
  ruby: "#a8433a",
  line: "rgba(201,162,75,0.28)",
  lineSoft: "rgba(201,162,75,0.14)",
};

const head = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const alt = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-space-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Bekrachtigd", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "In beraad", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true };
  }
}

// — Deco-zonnestraal / waaier: symmetrische stralenbundel als KPI-frame —
function Sunburst({
  size = 120,
  color = C.gold,
  rays = 24,
}: {
  size?: number;
  color?: string;
  rays?: number;
}) {
  const c = size / 2;
  const r = c - 2;
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    const long = i % 2 === 0;
    const inner = long ? c * 0.34 : c * 0.52;
    return (
      <line
        key={i}
        x1={c + Math.cos(a) * inner}
        y1={c + Math.sin(a) * inner}
        x2={c + Math.cos(a) * r}
        y2={c + Math.sin(a) * r}
        stroke={color}
        strokeWidth={long ? 1 : 0.55}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {lines}
      <circle cx={c} cy={c} r={c * 0.3} fill="none" stroke={color} strokeWidth="0.8" />
      <circle
        cx={c}
        cy={c}
        r={c * 0.24}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.6"
      />
    </svg>
  );
}

// — Deco-waaier (kwartcirkel schelp) als voortgangsmeter —
function FanGauge({ value }: { value: number }) {
  const w = 120;
  const h = 66;
  const cx = w / 2;
  const cy = h - 4;
  const rings = 5;
  const arcs = Array.from({ length: rings }, (_, i) => {
    const rr = 12 + i * 11;
    const on = value >= ((i + 1) / rings) * 100 - 10;
    return (
      <path
        key={i}
        d={`M${cx - rr} ${cy} A${rr} ${rr} 0 0 1 ${cx + rr} ${cy}`}
        fill="none"
        stroke={on ? C.gold : C.lineSoft}
        strokeWidth={on ? 1.4 : 0.8}
      />
    );
  });
  const spokes = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI - (i / 6) * Math.PI;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={cx + Math.cos(a) * 60}
        y2={cy - Math.sin(a) * 60}
        stroke={C.lineSoft}
        strokeWidth="0.5"
      />
    );
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {spokes}
      {arcs}
    </svg>
  );
}

// — Chevron-band (herhaald trapmotief) —
function ChevronBand({ count = 9, color = C.gold }: { count?: number; color?: string }) {
  return (
    <svg
      width={count * 14}
      height="10"
      viewBox={`0 0 ${count * 14} 10`}
      aria-hidden="true"
      className="max-w-full"
    >
      {Array.from({ length: count }, (_, i) => (
        <path
          key={i}
          d={`M${i * 14} 8 L${i * 14 + 7} 2 L${i * 14 + 14} 8`}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={0.4 + (i % 3) * 0.2}
        />
      ))}
    </svg>
  );
}

// — Deco-sparkline: verticale gouden staafjes met crème toppen —
function Spark({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const hgt = 14 + ((d - min) / range) * 22;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[3px] rounded-t-sm"
            style={{
              height: hgt,
              background: last ? (up ? C.goldBright : C.ruby) : C.goldDeep,
              opacity: last ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}

// Subtiele deco-textuur: fijne diagonale goudraster + vignet.
const decoBg: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(201,162,75,0.028) 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, rgba(201,162,75,0.028) 0 1px, transparent 1px 22px), radial-gradient(circle at 50% 0%, rgba(15,46,38,0.55), transparent 60%)",
};

function Overline({ children, color = C.gold }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.42em]" style={{ color, ...mono }}>
      {children}
    </p>
  );
}

// Dubbele goudlijn-frame (deco linework) om elk paneel.
function Frame({
  children,
  className = "",
  emerald = false,
}: {
  children: React.ReactNode;
  className?: string;
  emerald?: boolean;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: emerald ? C.emerald : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: `inset 0 0 0 3px ${C.onyx}, inset 0 0 0 4px ${C.lineSoft}`,
      }}
    >
      <span
        className="pointer-events-none absolute left-1.5 top-1.5 h-2 w-2 border-l border-t"
        style={{ borderColor: C.gold }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 border-r border-t"
        style={{ borderColor: C.gold }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-1.5 left-1.5 h-2 w-2 border-b border-l"
        style={{ borderColor: C.gold }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-1.5 right-1.5 h-2 w-2 border-b border-r"
        style={{ borderColor: C.gold }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function Tag({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em]"
      style={{
        color: alarm ? C.ruby : C.gold,
        border: `1px solid ${alarm ? "rgba(168,67,58,0.55)" : C.line}`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-[#12100e]";

export function Concept371() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...body, background: C.onyx, color: C.cream, ...decoBg }}
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
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="relative flex h-12 w-12 items-center justify-center"
          style={{ border: `1px solid ${C.gold}`, boxShadow: `inset 0 0 0 3px ${C.onyx}` }}
          aria-hidden="true"
        >
          <Gem size={19} color={C.gold} />
        </span>
        <div>
          <p className="text-[26px] font-semibold leading-none tracking-[0.02em]" style={head}>
            Deco
          </p>
          <p
            className="mt-1 text-[9.5px] uppercase leading-none tracking-[0.4em]"
            style={{ color: C.muted, ...mono }}
          >
            Atelier · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          className={`hidden items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-[#1b1813] sm:inline-flex ${ring}`}
          style={{ color: C.gold, border: `1px solid ${C.line}`, ...mono }}
        >
          <Search size={12} aria-hidden="true" />
          Zoeken
        </button>
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] sm:inline-flex"
          style={{ color: C.cream, border: `1px solid ${C.line}`, ...mono }}
        >
          <Crown size={12} aria-hidden="true" style={{ color: C.gold }} />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center text-[12px]"
          style={{
            border: `1px solid ${C.gold}`,
            color: C.gold,
            boxShadow: `inset 0 0 0 3px ${C.onyx}`,
            ...mono,
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
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.lineSoft }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`relative shrink-0 px-4 py-3.5 text-[14px] transition-colors ${ring}`}
            style={{ color: on ? C.gold : C.muted, ...alt }}
          >
            <span
              className="mr-2 align-top text-[9px] tabular-nums"
              style={{ color: on ? C.goldBright : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px flex justify-center"
                aria-hidden="true"
              >
                <span className="h-px w-full" style={{ background: C.gold }} />
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-14">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="self-center">
          <div className="mb-4">
            <ChevronBand count={7} />
          </div>
          <Overline>Salon · Vandaag</Overline>
          <h1
            className="mt-4 text-[46px] font-semibold leading-[0.98] tracking-[0.01em] md:text-[62px]"
            style={head}
          >
            Goedemorgen,
            <br />
            <span style={{ color: C.gold }}>{PROFIEL.naam.split(" ")[0]}.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
            Uw praktijk staat statig op orde. Eén verfijning vandaag houdt het geheel in balans.
          </p>
          <div className="mt-6">
            <ChevronBand count={16} color={C.goldDeep} />
          </div>
        </div>

        <Frame emerald className="overflow-hidden p-6">
          <div className="absolute -right-8 -top-8 opacity-[0.16]" aria-hidden="true">
            <Sunburst size={160} />
          </div>
          <div className="relative">
            <Overline>Eerste verfijning</Overline>
            <h2 className="mt-3 text-[24px] font-semibold leading-tight" style={head}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
              {primair.detail}
            </p>
            <button
              onClick={onActies}
              className={`group mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#e2c274] ${ring}`}
              style={{ background: C.gold, color: C.onyx, ...mono }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </Frame>
      </section>

      <section>
        <SectionHead nr="I" title="Kerncijfers" note="Deze maand" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Frame key={k.label} className="overflow-hidden p-5">
              <div className="absolute -right-6 -top-6 opacity-[0.12]" aria-hidden="true">
                <Sunburst size={88} />
              </div>
              <div className="relative">
                <p
                  className="text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[32px] font-semibold tabular-nums leading-none tracking-[0.01em]"
                  style={{ ...head, color: C.cream }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <Spark data={k.spark} up={k.up} />
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: k.up ? C.gold : C.ruby, ...mono }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
              </div>
            </Frame>
          ))}
        </div>
      </section>

      <section>
        <SectionHead
          nr="II"
          title="Aanbevolen opdrachten"
          note="Op maat"
          action={{ label: "Volledige marktplaats", onClick: onOpen }}
        />
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[1fr_auto] items-center gap-4 p-4 text-left transition-colors hover:bg-[#1b1813] ${ring}`}
                style={{ border: `1px solid ${C.lineSoft}` }}
              >
                <span className="min-w-0">
                  <span
                    className="block truncate text-[18px] font-semibold"
                    style={{ ...head, color: C.cream }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[12px]"
                    style={{ color: C.muted, ...mono }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchBadge value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.gold }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SectionHead({
  nr,
  title,
  note,
  action,
}: {
  nr: string;
  title: string;
  note: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className="mb-6 flex items-end justify-between border-b pb-3"
      style={{ borderColor: C.line }}
    >
      <div className="flex items-center gap-3">
        <span className="text-[13px] tracking-[0.1em]" style={{ color: C.gold, ...mono }}>
          {nr}
        </span>
        <h2 className="text-[24px] font-semibold" style={head}>
          {title}
        </h2>
      </div>
      {action ? (
        <button
          onClick={action.onClick}
          className={`text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-[#e2c274] ${ring}`}
          style={{ color: C.gold, ...mono }}
        >
          {action.label}
        </button>
      ) : (
        <span
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{ color: C.faint, ...mono }}
        >
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
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: strong ? C.goldBright : C.gold, ...mono }}
      >
        {value}%
      </span>
      <span
        className="hidden h-1 w-12 overflow-hidden sm:block"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <span
          className="block h-full"
          style={{ width: `${value}%`, background: strong ? C.goldBright : C.gold }}
        />
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
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Galerij</Overline>
          <h1 className="mt-3 text-[38px] font-semibold leading-none" style={head}>
            Marktplaats
          </h1>
        </div>
        <span
          className="text-[11px] uppercase tracking-[0.16em]"
          style={{ color: C.muted, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          opdrachten
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5"
          style={{ border: `1px solid ${C.line}`, background: C.panel }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.gold }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#6f6552]"
            style={{ color: C.cream, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`px-3.5 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${ring}`}
                style={
                  on
                    ? { background: C.gold, color: C.onyx, ...mono }
                    : { color: C.muted, border: `1px solid ${C.lineSoft}`, ...mono }
                }
              >
                {s === "match" ? "Match" : "Tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Frame className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <Sunburst size={100} color={C.goldDeep} />
            <p className="mt-6 text-[26px] font-semibold" style={head}>
              Geen opdracht gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Er past niets bij {q ? `“${q}”` : "uw zoekterm"}. Verruim de zoekopdracht om de
              galerij opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[#e2c274] ${ring}`}
              style={{ background: C.gold, color: C.onyx, ...mono }}
            >
              Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </Frame>
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
  return (
    <Frame className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span className="mt-1 text-[12px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3
            className="text-[20px] font-semibold leading-snug"
            style={{ ...head, color: C.cream }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.goldBright : C.gold, ...head }}
          >
            {opdracht.match}%
          </span>
          <span className="text-[13px]" style={{ color: C.creamSoft, ...mono }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#e2c274] ${ring}`}
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-[#e2c274] ${ring}`}
          style={{ color: C.gold, ...mono }}
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
    </Frame>
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
      <p
        className="text-[9.5px] uppercase tracking-[0.24em]"
        style={{ color: alarm ? C.ruby : C.gold, ...mono }}
      >
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.creamSoft }}>
            {alarm ? (
              <AlertTriangle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.ruby }}
              />
            ) : (
              <Check
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.gold }}
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
        className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:text-[#e2c274] ${ring}`}
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Frame emerald className="overflow-hidden p-6 md:p-9">
        <div className="absolute -right-10 -top-10 opacity-[0.14]" aria-hidden="true">
          <Sunburst size={220} />
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.14em]" style={{ color: C.gold, ...mono }}>
              {opdracht.id}
            </span>
            <Tag>{opdracht.match}% match</Tag>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[40px] font-semibold leading-[1.02] tracking-[0.01em] md:text-[52px]"
            style={{ ...head, color: C.cream }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: C.creamSoft, ...mono }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#e2c274] ${ring}`}
              style={{ background: C.gold, color: C.onyx, ...mono }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#123a30] ${ring}`}
              style={{ color: C.gold, border: `1px solid ${C.gold}`, ...mono }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Frame>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Frame key={m.l} className="p-4">
            <p
              className="text-[9.5px] uppercase tracking-[0.2em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums"
              style={{ ...head, color: C.cream }}
            >
              {m.v}
            </p>
          </Frame>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <Sparkle size={14} aria-hidden="true" style={{ color: C.gold }} />
          <Overline>Verklaarbare matching</Overline>
        </div>
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
          Transparant onderbouwd op uw geverifieerde profiel — de sterke punten én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Frame className="p-5">
            <Overline>Sterke punten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.creamSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.gold }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
          <Frame className="p-5">
            <Overline color={C.ruby}>Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ruby }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Frame>
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
        style={{ borderColor: C.line }}
      >
        <div className="max-w-md">
          <Overline>Bekrachtiging</Overline>
          <h1 className="mt-3 text-[38px] font-semibold leading-none" style={head}>
            Verificatie
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
            <span className="font-medium" style={{ color: C.gold }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten bekrachtigd. Eén vraagt binnenkort om
            vernieuwing.
          </p>
        </div>
        <Frame emerald className="flex items-center gap-4 p-5">
          <FanGauge value={ratio} />
          <div>
            <p
              className="text-[44px] font-semibold tabular-nums leading-none"
              style={{ ...head, color: C.gold }}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.muted }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[9.5px] uppercase tracking-[0.2em]"
              style={{ color: C.faint, ...mono }}
            >
              bekrachtigd
            </p>
          </div>
        </Frame>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Frame className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${ring}`}
                >
                  <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <st.Icon
                        size={15}
                        aria-hidden="true"
                        style={{ color: st.alarm ? C.ruby : C.gold }}
                      />
                      <span
                        className="truncate text-[17px] font-semibold"
                        style={{ ...head, color: C.cream }}
                      >
                        {c.naam}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag alarm={st.alarm}>{st.label}</Tag>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.gold,
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
                    <div className="mt-3 border-t pl-8 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.creamSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na uw
                        uitdrukkelijke toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#e2c274] ${ring}`}
                          style={{ background: C.gold, color: C.onyx, ...mono }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`px-4 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors hover:bg-[#1b1813] ${ring}`}
                          style={{ color: C.creamSoft, border: `1px solid ${C.lineSoft}`, ...mono }}
                        >
                          Geschiedenis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Frame>
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
      <div className="border-b pb-6" style={{ borderColor: C.line }}>
        <Overline>Agenda · volgende stappen</Overline>
        <h1 className="mt-3 text-[38px] font-semibold leading-none" style={head}>
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.creamSoft }}>
          Handel deze op volgorde af — elke voltooide actie houdt uw praktijk in balans.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Frame className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr_auto]">
                <span
                  className="flex h-12 w-12 items-center justify-center text-[15px] font-semibold tabular-nums"
                  style={
                    warn
                      ? { background: C.ruby, color: C.cream, ...mono }
                      : {
                          border: `1px solid ${C.gold}`,
                          color: C.gold,
                          boxShadow: `inset 0 0 0 3px ${C.onyx}`,
                          ...mono,
                        }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.ruby }} />
                    ) : (
                      <Sparkle size={15} aria-hidden="true" style={{ color: C.gold }} />
                    )}
                    <h2
                      className="text-[18px] font-semibold leading-snug"
                      style={{ ...head, color: C.cream }}
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
                  className={`justify-self-start px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors sm:justify-self-end ${ring}`}
                  style={
                    warn
                      ? { background: C.ruby, color: C.cream, ...mono }
                      : { border: `1px solid ${C.gold}`, color: C.gold, ...mono }
                  }
                >
                  {a.cta}
                </button>
              </Frame>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.line }}
      >
        <div>
          <Overline>Grootboek</Overline>
          <h1 className="mt-3 text-[38px] font-semibold leading-none" style={head}>
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[#e2c274] ${ring}`}
          style={{ background: C.gold, color: C.onyx, ...mono }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "2 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Frame key={s.l} className="p-5">
            <p
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums"
              style={{ ...head, color: s.alarm ? C.ruby : C.gold }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Frame>
        ))}
      </section>

      <Frame className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_8rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[9.5px] uppercase tracking-[0.18em] ${i === 4 ? "text-right" : ""}`}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#1b1813] sm:grid-cols-[8rem_1fr_5rem_8rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-semibold sm:order-2"
                  style={{ ...head, color: C.cream }}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag alarm={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.ruby : C.cream, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[9.5px] uppercase tracking-[0.24em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-semibold tabular-nums"
            style={{ ...head, color: C.gold }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Frame>
    </div>
  );
}
