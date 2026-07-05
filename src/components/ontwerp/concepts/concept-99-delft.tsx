"use client";

// Concept 99 — "Delft" · Delfts-blauw tegeltableau / keramiek als vertrouwenstaal.
// Zacht porseleinwit vlak (#f6f4ee) waarop elk kernscherm in een "tegel-veld" zit: dunne
// kobaltblauwe (#1e3a8a) dubbele kaderlijn, sierhoekjes in elke hoek en een tableau-raster.
// Klassiek-Nederlands ambacht, maar strak-modern — één diep kobalt op porseleinwit, serif-
// accenttitels (Newsreader). Vertrouwen via herkomst & vakmanschap; nadrukkelijk niet kitsch.
// Fonts: --font-lab-newsreader (serif display) + --font-lab-inter (body/labels).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Plus,
  MapPin,
  Flower2,
  ScrollText,
  RotateCw,
  Mail,
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
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

void NAV;
void DOCUMENTEN;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#f6f4ee",
  porcelain: "#fdfdfb",
  porcelainAlt: "#f1f0ea",
  glaze: "#eef2fb",
  cobalt: "#1e3a8a",
  cobaltSoft: "#3252a8",
  cobaltFaint: "#7f96cf",
  ink: "#17233f",
  muted: "#586080",
  faint: "#8a90a8",
  warn: "#b45309",
  alert: "#b91c1c",
  line: "rgba(30,58,138,0.32)",
  lineSoft: "rgba(30,58,138,0.14)",
  hairline: "rgba(23,35,63,0.08)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f4ee]";

/* ---------- Delfts sierhoekje (deterministisch SVG-motief) ---------- */

// Klassiek tegel-hoekje: een gestileerd bloemblad-motief in kobalt, geen externe image.
function DelftCorner({
  size = 22,
  color = C.cobalt,
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* hoek-kader */}
      <path d="M2 8 V2 H8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* bloemblad-waaier vanuit de hoek */}
      <path
        d="M4 4 C8 4 10 6 10 10 M4 4 C4 8 6 10 10 10 M4 4 C7 5 8 7 8 10 M4 4 C5 7 7 8 10 8"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="4" cy="4" r="1.3" fill={color} />
    </svg>
  );
}

// Vier sierhoekjes rond een tegel-veld.
function TileCorners({ color = C.cobaltFaint }: { color?: string }) {
  return (
    <>
      <DelftCorner color={color} className="absolute left-1.5 top-1.5" />
      <DelftCorner
        color={color}
        className="absolute right-1.5 top-1.5"
        style={{ transform: "scaleX(-1)" }}
      />
      <DelftCorner
        color={color}
        className="absolute bottom-1.5 left-1.5"
        style={{ transform: "scaleY(-1)" }}
      />
      <DelftCorner
        color={color}
        className="absolute bottom-1.5 right-1.5"
        style={{ transform: "scale(-1,-1)" }}
      />
    </>
  );
}

/* ---------- Tegel-veld (het handtekening-oppervlak) ---------- */

function Tile({
  children,
  className = "",
  corners = false,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  corners?: boolean;
  as?: "div" | "section";
}) {
  return (
    <Tag
      className={`relative rounded-[10px] ${className}`}
      style={{
        background: C.porcelain,
        border: `1px solid ${C.line}`,
        boxShadow: `0 0 0 3px ${C.porcelain}, 0 0 0 4px ${C.lineSoft}, 0 16px 40px -34px rgba(30,58,138,0.5)`,
      }}
    >
      {corners && <TileCorners />}
      {children}
    </Tag>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.cobalt, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.cobaltSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
      style={{ ...body, color: C.cobalt }}
    >
      <Flower2 size={12} strokeWidth={1.8} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[27px] leading-[1.06] tracking-[0.005em] sm:text-[33px]"
      style={{ ...serif, color: C.ink, fontWeight: 500 }}
    >
      {children}
    </h1>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}10`,
        border: `1px solid ${m.color}40`,
      }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Kobalt sparkline op porselein.
function Spark({ data, color = C.cobalt }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="1.9" fill={color} />}
    </svg>
  );
}

// Match-uitlezing: kobalt tegel-medaillon met percentage.
function ScoreSeal({ value, size = 48 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.lineSoft} strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strong ? C.cobalt : C.cobaltSoft}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums" style={{ ...serif, color: C.ink }}>
        {value}
      </span>
    </span>
  );
}

/* ---------- Tableau (het handtekening-element) ---------- */

// Tegeltableau: elke opdracht als een porseleinen tegel in een raster; de match kleurt
// de kobalt-vulling van het onderste band. Herkomst & ambacht als vertrouwenssignaal.
function Tableau({ onSelect, activeId }: { onSelect: (id: string) => void; activeId?: string }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      style={{ padding: "2px" }}
      role="group"
      aria-label="Tegeltableau van matches"
    >
      {OPDRACHTEN.map((o) => {
        const on = activeId === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            aria-label={`${o.titel} — match ${o.match}%`}
            aria-pressed={on}
            className={`group relative flex flex-col overflow-hidden rounded-[8px] p-3.5 text-left transition-all hover:-translate-y-0.5 ${RING}`}
            style={{
              background: on ? C.glaze : C.porcelain,
              border: `1px solid ${on ? C.cobalt : C.line}`,
              boxShadow: on
                ? `inset 0 0 0 2px ${C.porcelain}, 0 14px 30px -22px ${C.cobalt}`
                : `inset 0 0 0 2px ${C.porcelain}`,
            }}
          >
            <TileCorners color={on ? C.cobaltSoft : C.cobaltFaint} />
            <div className="flex items-center justify-between">
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.faint }}
              >
                {o.id}
              </span>
              <ScoreSeal value={o.match} size={38} />
            </div>
            <p
              className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug"
              style={{ ...serif, color: C.ink }}
            >
              {o.titel}
            </p>
            <p
              className="mt-1 flex items-center gap-1 text-[11px]"
              style={{ ...body, color: C.muted }}
            >
              <MapPin size={11} strokeWidth={2} aria-hidden="true" /> {o.plaats}
            </p>
            {/* onderband: kobalt-vulling ∝ match */}
            <span
              className="mt-3 block h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${o.match}%`,
                  background: `linear-gradient(90deg, ${C.cobalt}, ${C.cobaltSoft})`,
                }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept99() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* zacht tegel-raster op de achtergrond */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(${C.lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${C.lineSoft} 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          opacity: 0.5,
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[244px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(253,253,251,0.8)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                style={{ background: C.porcelain, border: `1px solid ${C.cobalt}` }}
                aria-hidden="true"
              >
                <TileCorners color={C.cobaltFaint} />
                <Flower2 size={19} strokeWidth={1.8} color={C.cobalt} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[17px] tracking-[0.04em]"
                  style={{ ...serif, color: C.ink, fontWeight: 500 }}
                >
                  Delft
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: C.faint }}
                >
                  ZZP · tableau
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2.5 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-[7px] px-3.5 py-2.5 text-left text-[12.5px] font-medium tracking-[0.01em] transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.cobalt : C.muted,
                      background: on ? C.glaze : "transparent",
                      border: `1px solid ${on ? C.line : "transparent"}`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-[2px]"
                      style={{ background: on ? C.cobalt : C.lineSoft }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}`, background: "rgba(241,240,234,0.7)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...serif, color: C.porcelain, background: C.cobalt }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.cobalt }}
                >
                  <ShieldCheck size={11} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onGo={setScreen}
                activeId={activeId}
                onSelect={setActiveId}
              />
            )}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
  activeId,
  onSelect,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Tableau geopend</Kicker>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-[6px] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: C.cobalt, background: C.porcelain, border: `1px solid ${C.line}` }}
        >
          <Flower2 size={13} strokeWidth={2} aria-hidden="true" /> {OPDRACHTEN.length} matches
        </div>
      </header>

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-[10px] p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.warn}55`, background: `${C.warn}0e` }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[7px]"
            style={{ background: C.porcelain, border: `1px solid ${C.warn}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-[12px] font-semibold transition-colors ${RING}`}
            style={{ color: C.porcelain, background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Tile key={k.label} className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[10px] font-semibold uppercase leading-tight tracking-[0.09em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.cobalt : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.4} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[24px] tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.cobalt : C.warn} />
            </div>
          </Tile>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
        {/* Tableau */}
        <Tile className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3
              className="flex items-center gap-2 text-[14px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <Flower2 size={16} strokeWidth={1.8} color={C.cobalt} aria-hidden="true" /> Het
              tableau
            </h3>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.faint }}
            >
              band = match
            </span>
          </div>
          <Tableau activeId={activeId} onSelect={onSelect} />
          <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
            Elke tegel is een match; de kobalt-band toont de sterkte. Kies een tegel om te openen.
          </p>
        </Tile>

        <div className="space-y-5">
          {/* Beste matches lijst */}
          <Tile>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.hairline}` }}
            >
              <h3 className="text-[14px] font-semibold" style={{ ...serif, color: C.ink }}>
                Matches
              </h3>
              <button
                type="button"
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${RING}`}
                style={{ color: C.cobalt }}
              >
                Alles <ArrowRight size={12} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(o.id)}
                    className={`flex w-full items-center gap-3 rounded-[7px] p-3 text-left transition-colors hover:bg-[#eef2fb] focus-visible:ring-inset ${RING}`}
                  >
                    <ScoreSeal value={o.match} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                        {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={15} strokeWidth={2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </Tile>

          {/* Live feed — loading + error-state */}
          <Tile className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <ScrollText size={14} strokeWidth={2} color={C.cobalt} aria-hidden="true" /> Register
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Register wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-[3px]"
                    style={{ background: C.lineSoft, width: i === 0 ? "80%" : "60%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-[7px] p-3 sm:flex-row sm:items-center"
                style={{ background: `${C.alert}0d`, border: `1px solid ${C.alert}40` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={2} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Register onbereikbaar. Kon de laatste mutaties niet ophalen.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${RING}`}
                  style={{ color: C.porcelain, background: C.cobalt }}
                >
                  <RotateCw size={12} strokeWidth={2.4} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <p className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <Check size={14} strokeWidth={2.4} color={C.cobalt} aria-hidden="true" /> Register
                bijgewerkt — alle mutaties geladen.
              </p>
            )}
          </Tile>

          {/* Berichten-preview */}
          <Tile className="p-4">
            <h3
              className="flex items-center gap-2 text-[13px] font-semibold"
              style={{ ...serif, color: C.ink }}
            >
              <Mail size={14} strokeWidth={2} color={C.cobalt} aria-hidden="true" /> Correspondentie
            </h3>
            <ul className="mt-3 space-y-2.5">
              {BERICHTEN.slice(0, 2).map((b) => (
                <li key={b.van} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      ...serif,
                      color: C.cobalt,
                      background: C.glaze,
                      border: `1px solid ${C.line}`,
                    }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold" style={{ color: C.ink }}>
                        {b.van}
                      </span>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.cobalt }}
                          aria-label="ongelezen"
                        />
                      )}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </li>
              ))}
            </ul>
          </Tile>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Register</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-[8px] px-4 py-3"
        style={{ background: C.porcelain, border: `1px solid ${C.line}` }}
      >
        <Search size={16} strokeWidth={2} color={C.cobalt} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8a90a8]"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Tile className="p-12 text-center" corners>
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[8px]"
            style={{ background: C.glaze, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Flower2 size={24} strokeWidth={1.8} color={C.cobalt} />
          </span>
          <p className="mt-4 text-[19px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className={`mt-5 rounded-[6px] px-4 py-2 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={{ color: C.porcelain, background: C.cobalt }}
          >
            Zoekopdracht wissen
          </button>
        </Tile>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className={`w-full rounded-[10px] p-4 text-left transition-all hover:-translate-y-0.5 ${RING}`}
                  style={{
                    background: on ? C.glaze : C.porcelain,
                    border: `1px solid ${on ? C.cobalt : C.line}`,
                    boxShadow: on
                      ? `inset 0 0 0 2px ${C.porcelain}, 0 14px 30px -22px ${C.cobalt}`
                      : `inset 0 0 0 2px ${C.porcelain}`,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <ScoreSeal value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.cobalt }}>· gekozen</span>}
                      </div>
                      <p
                        className="truncate text-[15px] font-semibold"
                        style={{ ...serif, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                        {o.plaats} · {o.tarief}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.cobalt,
                              background: C.glaze,
                              border: `1px solid ${C.line}`,
                            }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Tile corners>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.hairline}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: C.cobalt }}
                  >
                    {sel.id}
                  </span>
                  <Flower2 size={15} strokeWidth={2} color={C.cobalt} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p
                    className="text-[16px] font-semibold leading-snug"
                    style={{ ...serif, color: C.ink }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-[6px] p-2.5"
                        style={{ background: C.porcelainAlt }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 font-semibold tabular-nums"
                          style={{ ...serif, color: C.ink }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-[6px] px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${RING}`}
                    style={{ color: C.porcelain, background: C.cobalt }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              </Tile>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Tile corners>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[4px] px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.muted,
                    background: C.porcelainAlt,
                    border: `1px solid ${C.hairline}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreSeal value={opdracht.match} size={76} />
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-[6px] px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-90 ${RING}`}
            style={{ color: C.porcelain, background: state === "sent" ? C.ink : C.cobalt }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Tile>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Tile key={m.l} className="p-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1.5 text-[18px] tabular-nums" style={{ ...serif, color: C.ink }}>
              {m.v}
            </p>
          </Tile>
        ))}
      </div>

      <Tile>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.hairline}` }}
        >
          <Flower2 size={16} strokeWidth={2} color={C.cobalt} aria-hidden="true" />
          <h3 className="text-[15px] font-semibold" style={{ ...serif, color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.hairline}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.cobalt }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    color={C.cobalt}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.hairline}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.2}
                    color={C.warn}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Tile>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.cobalt, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In behandeling", v: "1", color: C.cobaltSoft, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Tile key={s.l} className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.09em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p className="mt-1.5 text-[24px] tabular-nums" style={{ ...serif, color: C.ink }}>
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}40` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Tile>
          );
        })}
      </div>

      <Tile>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: `${m.color}10`, border: `1px solid ${m.color}40` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Tile>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.cobalt;
          return (
            <Tile key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}0e`, borderRight: `1px solid ${color}30` }}
              >
                <span className="text-[16px] tabular-nums" style={{ ...serif, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                ) : (
                  <Flower2 size={15} strokeWidth={2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.11em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`m-3 shrink-0 self-center rounded-[6px] px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: warn ? C.porcelain : C.cobalt,
                  background: warn ? C.warn : C.glaze,
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Tile>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[10px] p-4"
        style={{ background: C.glaze, border: `1px solid ${C.line}` }}
      >
        <Check size={18} strokeWidth={2.2} color={C.cobalt} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe mutaties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.cobalt,
    Openstaand: C.warn,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-[6px] px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${RING}`}
          style={{ color: C.porcelain, background: C.cobalt }}
        >
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Tile className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...serif, color: C.cobalt }}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Tile>
        <Tile className="p-5">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.11em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p className="mt-2 text-[22px] tabular-nums" style={{ ...serif, color: C.warn }}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Tile>
      </div>

      <Tile className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.hairline}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairline}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-[2px]"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{ color }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tile>
    </div>
  );
}
