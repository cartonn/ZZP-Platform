"use client";

// Concept 372 — "Marqueterie" · Houtinlegwerk.
// Luxe fineer-inlegwerk: geometrische houtinlay-patronen (parket/marqueterie) in warme
// fineerkleuren, fijne inlegnaden en boomnerf-textuur — de ambachtelijke precisie van een
// antieke secretaire of schaakbord-intarsia. Kaarten zijn ingelegde houtpanelen met
// contrasterende fineer-randen; KPI's zijn parket-tegels.
// Noten (#6b4a2f) · esdoorn (#c9a86a) · palissander (#4a2c22) · ebben (#201812).
// Fonts: Cormorant (display), Jakarta (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Hexagon,
  Layers,
  Feather,
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

// — Palet: warme fineerkleuren, inlegnaden en boomnerf —
const C = {
  ebony: "#201812",
  ebonySoft: "#2a2018",
  walnut: "#6b4a2f",
  walnutDeep: "#513622",
  rosewood: "#4a2c22",
  maple: "#c9a86a",
  mapleLight: "#e3caa0",
  cream: "#f2e6cf",
  creamSoft: "#d9c6a3",
  muted: "#a08a68",
  faint: "#7a6650",
  brass: "#b8873f",
  garnet: "#9a3b2c",
  seam: "rgba(32,24,18,0.85)",
  hair: "rgba(201,168,106,0.16)",
  inlay: "rgba(201,168,106,0.4)",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const alt = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  veneer: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, veneer: C.walnut, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, veneer: C.rosewood, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, veneer: C.brass, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, veneer: C.garnet, alarm: true };
  }
}

// Hex naar rgba (voor nerf/gloed-overlays).
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Boomnerf-textuur voor een fineervlak — fijne, licht golvende nerflijnen.
function grain(base: string): React.CSSProperties {
  return {
    background: base,
    backgroundImage: `repeating-linear-gradient(96deg, ${hexA("#ffffff", 0.05)} 0 1px, transparent 1px 5px), repeating-linear-gradient(92deg, ${hexA("#000000", 0.1)} 0 1px, transparent 1px 9px)`,
  };
}

// Ingelegd houtpaneel: fineervlak met dubbele inleg-rand (marqueterie-naad).
function Inlay({
  children,
  className = "",
  veneer = C.ebonySoft,
  rim = C.maple,
}: {
  children: React.ReactNode;
  className?: string;
  veneer?: string;
  rim?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        ...grain(veneer),
        border: `1px solid ${C.seam}`,
        boxShadow: `inset 0 0 0 2px ${hexA(rim, 0.32)}, inset 0 0 0 3px ${C.seam}, inset 0 1px 0 ${hexA("#ffffff", 0.06)}`,
      }}
    >
      {children}
    </div>
  );
}

// — Parket-rozet: geruite intarsia-ster als terugkerend motief —
function Parquet({ size = 130 }: { size?: number }) {
  const c = size / 2;
  const tints = [C.walnut, C.maple, C.rosewood, C.brass];
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i / 12) * Math.PI * 2;
    const a1 = ((i + 0.5) / 12) * Math.PI * 2;
    const a2 = ((i + 1) / 12) * Math.PI * 2;
    const rr = c - 5;
    const mid = c * 0.42;
    return (
      <path
        key={i}
        d={`M${c} ${c} L${c + Math.cos(a0) * mid} ${c + Math.sin(a0) * mid} L${c + Math.cos(a1) * rr} ${c + Math.sin(a1) * rr} L${c + Math.cos(a2) * mid} ${c + Math.sin(a2) * mid} Z`}
        fill={hexA(tints[i % 4] ?? C.walnut, 0.85)}
        stroke={C.seam}
        strokeWidth="1.2"
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect
        x="2"
        y="2"
        width={size - 4}
        height={size - 4}
        fill={C.ebony}
        stroke={C.seam}
        strokeWidth="2"
      />
      {rays}
      <circle
        cx={c}
        cy={c}
        r={c * 0.2}
        fill={hexA(C.maple, 0.9)}
        stroke={C.seam}
        strokeWidth="1.4"
      />
      <circle cx={c} cy={c} r={c * 0.09} fill={C.rosewood} stroke={C.seam} strokeWidth="1" />
    </svg>
  );
}

// — Schaakbord-inlay hoekornament —
function Checker({ size = 44 }: { size?: number }) {
  const n = 4;
  const s = size / n;
  const cells = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x * s}
          y={y * s}
          width={s}
          height={s}
          fill={(x + y) % 2 === 0 ? hexA(C.maple, 0.8) : hexA(C.rosewood, 0.85)}
          stroke={C.seam}
          strokeWidth="0.5"
        />,
      );
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {cells}
    </svg>
  );
}

// — Sparkline als ingelegde fineer-lamellen —
function Spark({ data }: { data: number[] }) {
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
              background: last ? C.mapleLight : hexA(C.maple, 0.6),
              border: `0.5px solid ${C.seam}`,
            }}
          />
        );
      })}
    </div>
  );
}

// — Voortgang als parket-lamellen (ingelegde staafjes) —
function InlayGauge({ value }: { value: number }) {
  const segs = 8;
  const on = Math.round((value / 100) * segs);
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: segs }, (_, i) => (
        <span
          key={i}
          className="h-8 w-2"
          style={{
            background:
              i < on ? (i === on - 1 ? C.mapleLight : hexA(C.maple, 0.8)) : hexA(C.cream, 0.06),
            border: `1px solid ${C.seam}`,
            transform: i % 2 === 0 ? "skewX(-8deg)" : "skewX(8deg)",
          }}
        />
      ))}
    </div>
  );
}

function Overline({ children, color = C.brass }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.34em]" style={{ color, ...body }}>
      {children}
    </p>
  );
}

function Tag({
  children,
  veneer = C.walnut,
  alarm,
}: {
  children: React.ReactNode;
  veneer?: string;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: alarm ? C.mapleLight : C.cream,
        background: hexA(veneer, 0.5),
        border: `1px solid ${C.seam}`,
        boxShadow: `inset 0 0 0 1px ${hexA(C.maple, 0.25)}`,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#c9a86a] focus-visible:ring-offset-[#201812]";

const pageBg: React.CSSProperties = {
  ...grain(C.ebony),
  backgroundImage: `repeating-linear-gradient(96deg, ${hexA("#ffffff", 0.03)} 0 1px, transparent 1px 6px), repeating-linear-gradient(0deg, ${hexA("#000000", 0.14)} 0 1px, transparent 1px 12px), radial-gradient(circle at 50% -5%, ${hexA(C.walnut, 0.35)}, transparent 55%)`,
};

const VENEERS: string[] = [C.walnut, C.rosewood, C.brass, C.walnutDeep];

function veneerAt(i: number): string {
  const len = VENEERS.length;
  return VENEERS[((i % len) + len) % len] ?? C.walnut;
}

export function Concept372() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{ ...body, background: C.ebony, color: C.cream, ...pageBg }}
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
          className="flex h-12 w-12 items-center justify-center overflow-hidden"
          style={{
            border: `1px solid ${C.seam}`,
            boxShadow: `inset 0 0 0 2px ${hexA(C.maple, 0.3)}`,
          }}
          aria-hidden="true"
        >
          <Checker size={44} />
        </span>
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-[0.01em]" style={display}>
            Marqueterie
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
          className={`hidden items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:brightness-110 sm:inline-flex ${ring}`}
          style={{ ...grain(C.walnutDeep), color: C.mapleLight, border: `1px solid ${C.seam}` }}
        >
          <Search size={13} aria-hidden="true" /> Zoeken
        </button>
        <span
          className="hidden items-center gap-1.5 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] sm:inline-flex"
          style={{ ...grain(C.walnut), color: C.cream, border: `1px solid ${C.seam}` }}
        >
          <Feather size={12} aria-hidden="true" style={{ color: C.mapleLight }} /> {PROFIEL.trust}
        </span>
        <span
          className="flex h-11 w-11 items-center justify-center text-[13px] font-semibold"
          style={{
            ...grain(C.rosewood),
            color: C.mapleLight,
            border: `1px solid ${C.seam}`,
            boxShadow: `inset 0 0 0 2px ${hexA(C.maple, 0.3)}`,
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
    <nav className="flex items-stretch gap-1.5 overflow-x-auto py-4" aria-label="Hoofdnavigatie">
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        const v = veneerAt(i);
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold transition-all ${ring}`}
            style={{
              color: on ? C.cream : C.creamSoft,
              ...(on ? grain(v) : { background: hexA(v, 0.16) }),
              border: `1px solid ${C.seam}`,
              boxShadow: on ? `inset 0 0 0 1.5px ${hexA(C.maple, 0.4)}` : "none",
            }}
          >
            <span
              className="block h-2.5 w-2.5 rotate-45"
              style={{
                background: on ? C.mapleLight : hexA(C.maple, 0.5),
                border: `0.5px solid ${C.seam}`,
              }}
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
        <Inlay veneer={C.walnutDeep} className="flex flex-col justify-between overflow-hidden p-8">
          <div>
            <Overline>Vandaag</Overline>
            <h1
              className="mt-4 text-[46px] font-semibold leading-[0.98] tracking-[0.01em] md:text-[60px]"
              style={display}
            >
              Goedemorgen,
              <br />
              <span style={{ color: C.mapleLight }}>{PROFIEL.naam.split(" ")[0]}.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
              Elk paneel ligt strak ingelegd. Eén afgewerkte naad vandaag houdt het geheel gaaf en
              in balans.
            </p>
          </div>
        </Inlay>

        <Inlay veneer={C.rosewood} className="flex flex-col justify-between overflow-hidden p-6">
          <div className="absolute -right-6 -top-6 opacity-50" aria-hidden="true">
            <Parquet size={130} />
          </div>
          <div className="relative">
            <Overline color={C.mapleLight}>Nu doen</Overline>
            <h2 className="mt-3 text-[23px] font-semibold leading-snug" style={display}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.creamSoft }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onActies}
            className={`group relative mt-5 inline-flex items-center gap-2 self-start px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
            style={{ ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Inlay>
      </section>

      <section>
        <SectionHead title="Kerncijfers" note="Deze maand" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Inlay key={k.label} veneer={veneerAt(i)} className="p-5">
              <p
                className="text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: C.creamSoft }}
              >
                {k.label}
              </p>
              <p
                className="mt-2 text-[34px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.cream }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <Spark data={k.spark} />
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.mapleLight : C.garnet }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
            </Inlay>
          ))}
        </div>
      </section>

      <section>
        <SectionHead
          title="Aanbevolen opdrachten"
          note="Op maat"
          action={{ label: "Naar marktplaats", onClick: onOpen }}
        />
        <ul className="space-y-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 p-4 text-left transition-all hover:brightness-110 ${ring}`}
                style={{
                  background: hexA(veneerAt(i), 0.16),
                  border: `1px solid ${C.seam}`,
                  boxShadow: `inset 0 0 0 1.5px ${hexA(C.maple, 0.22)}`,
                }}
              >
                <span
                  className="h-9 w-3.5"
                  style={{ ...grain(veneerAt(i)), border: `1px solid ${C.seam}` }}
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
                    style={{ color: C.mapleLight }}
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
      <h2 className="text-[26px] font-semibold" style={alt}>
        {title}
      </h2>
      {action ? (
        <button
          onClick={action.onClick}
          className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-[#e3caa0] ${ring}`}
          style={{ color: C.brass }}
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
          ...grain(strong ? C.walnut : C.rosewood),
          border: `1px solid ${C.seam}`,
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
          style={{
            background: hexA(C.walnutDeep, 0.4),
            border: `1px solid ${C.seam}`,
            boxShadow: `inset 0 0 0 1.5px ${hexA(C.maple, 0.2)}`,
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.mapleLight }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#7a6650]"
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
                    ? { ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }
                    : {
                        color: C.creamSoft,
                        background: hexA(C.cream, 0.05),
                        border: `1px solid ${C.seam}`,
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
        <Inlay veneer={C.walnutDeep} className="p-0">
          <div className="flex flex-col items-center py-16 text-center">
            <Parquet size={120} />
            <p className="mt-6 text-[28px] font-semibold" style={display}>
              Geen paneel gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Er past niets bij {q ? `“${q}”` : "uw zoekterm"}. Verruim de zoekopdracht om de
              panelen opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
              style={{ ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }}
            >
              Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </Inlay>
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
  const v = veneerAt(index);
  return (
    <Inlay veneer={C.ebonySoft} rim={v} className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <span
          className="mt-1 h-12 w-3"
          style={{ ...grain(v), border: `1px solid ${C.seam}` }}
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
              <Tag key={t} veneer={v}>
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="text-[24px] font-semibold tabular-nums leading-none"
            style={{ color: opdracht.match >= 90 ? C.mapleLight : C.maple, ...display }}
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
          onClick={() => setOpen((val) => !val)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:text-[#e3caa0] ${ring}`}
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[#e3caa0] ${ring}`}
          style={{ color: C.brass }}
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
    </Inlay>
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
      <Overline color={alarm ? C.garnet : C.maple}>{title}</Overline>
      <ul className="mt-2 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.creamSoft }}>
            {alarm ? (
              <AlertTriangle
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.garnet }}
              />
            ) : (
              <Check
                size={13}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                style={{ color: C.maple }}
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
        className={`inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[#e3caa0] ${ring}`}
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Inlay veneer={C.walnutDeep} className="overflow-hidden p-6 md:p-9">
        <div className="absolute -right-10 -top-10 opacity-55" aria-hidden="true">
          <Parquet size={200} />
        </div>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] tracking-[0.12em]" style={{ color: C.brass }}>
              {opdracht.id}
            </span>
            <Tag veneer={C.walnut}>{opdracht.match}% match</Tag>
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
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
              style={{ ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className={`inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
              style={{
                color: C.cream,
                background: hexA(C.cream, 0.06),
                border: `1px solid ${C.seam}`,
              }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Inlay>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, ve: veneerAt(0) },
          { l: "Omvang", v: opdracht.uren, ve: veneerAt(1) },
          { l: "Start", v: opdracht.start, ve: veneerAt(2) },
          { l: "Match", v: `${opdracht.match}%`, ve: veneerAt(3) },
        ].map((m) => (
          <Inlay key={m.l} veneer={m.ve} className="p-4">
            <p className="text-[9.5px] uppercase tracking-[0.16em]" style={{ color: C.creamSoft }}>
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[22px] font-semibold tabular-nums"
              style={{ ...display, color: C.cream }}
            >
              {m.v}
            </p>
          </Inlay>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <Layers size={14} aria-hidden="true" style={{ color: C.brass }} />
          <Overline>Verklaarbare matching</Overline>
        </div>
        <p className="max-w-xl text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
          Transparant onderbouwd op uw geverifieerde profiel — de sterke punten én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Inlay veneer={C.ebonySoft} rim={C.maple} className="p-5">
            <Overline color={C.maple}>Sterke punten</Overline>
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
                    style={{ color: C.maple }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Inlay>
          <Inlay veneer={C.ebonySoft} rim={C.garnet} className="p-5">
            <Overline color={C.garnet}>Aandachtspunten</Overline>
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
                    style={{ color: C.garnet }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Inlay>
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
          <Overline color={C.maple}>Bewijs</Overline>
          <h1 className="mt-2 text-[40px] font-semibold leading-none" style={display}>
            Verificatie
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.creamSoft }}>
            <span className="font-medium" style={{ color: C.mapleLight }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén vraagt binnenkort om
            vernieuwing.
          </p>
        </div>
        <Inlay veneer={C.walnut} className="flex items-center gap-4 p-5">
          <InlayGauge value={ratio} />
          <div>
            <p
              className="text-[44px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.mapleLight }}
            >
              {ratio}
              <span className="text-[22px]" style={{ color: C.creamSoft }}>
                %
              </span>
            </p>
            <p
              className="mt-1 text-[9.5px] uppercase tracking-[0.18em]"
              style={{ color: C.creamSoft }}
            >
              geverifieerd
            </p>
          </div>
        </Inlay>
      </div>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Inlay veneer={C.ebonySoft} rim={st.veneer} className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${ring}`}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center"
                    style={{ ...grain(st.veneer), border: `1px solid ${C.seam}` }}
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
                    <Tag veneer={st.veneer} alarm={st.alarm}>
                      {st.label}
                    </Tag>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.brass,
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
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
                          style={{
                            ...grain(C.maple),
                            color: C.ebony,
                            border: `1px solid ${C.seam}`,
                          }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
                          style={{
                            color: C.creamSoft,
                            background: hexA(C.cream, 0.05),
                            border: `1px solid ${C.seam}`,
                          }}
                        >
                          Geschiedenis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Inlay>
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
          Handel deze op volgorde af — elke voltooide actie houdt het inlegwerk gaaf en in balans.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const v = warn ? C.brass : veneerAt(i + 1);
          return (
            <li key={a.titel}>
              <Inlay
                veneer={C.ebonySoft}
                rim={v}
                className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[auto_1fr_auto]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center text-[15px] font-semibold tabular-nums"
                  style={{
                    ...grain(v),
                    color: warn ? C.ebony : C.cream,
                    border: `1px solid ${C.seam}`,
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.brass }} />
                    ) : (
                      <Hexagon size={15} aria-hidden="true" style={{ color: C.maple }} />
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
                  className={`justify-self-start px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 sm:justify-self-end ${ring}`}
                  style={
                    warn
                      ? { ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }
                      : { color: C.cream, ...grain(v), border: `1px solid ${C.seam}` }
                  }
                >
                  {a.cta}
                </button>
              </Inlay>
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

function factuurVeneer(status: string): string {
  if (status === "Openstaand") return C.garnet;
  if (status === "Concept") return C.brass;
  return C.walnut;
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
          className={`inline-flex items-center gap-2 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] transition-all hover:brightness-110 ${ring}`}
          style={{ ...grain(C.maple), color: C.ebony, border: `1px solid ${C.seam}` }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "2 voldaan", ve: C.walnut, alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", ve: C.garnet, alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", ve: C.brass, alarm: false },
        ].map((s) => (
          <Inlay key={s.l} veneer={s.ve} className="p-5">
            <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.creamSoft }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-semibold tabular-nums"
              style={{ ...display, color: C.cream }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: s.alarm ? C.mapleLight : C.creamSoft }}>
              {s.sub}
            </p>
          </Inlay>
        ))}
      </section>

      <Inlay veneer={C.ebonySoft} className="p-5">
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
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[rgba(201,168,106,0.05)] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
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
                  <Tag veneer={factuurVeneer(f.status)} alarm={acc}>
                    {f.status}
                  </Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-semibold tabular-nums sm:order-5"
                  style={{ color: acc ? C.mapleLight : C.cream }}
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
            style={{ ...display, color: C.mapleLight }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Inlay>
    </div>
  );
}
