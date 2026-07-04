"use client";

// Concept 72 — "Bon" · thermische kassabon / receipt.
// Warm papierwit met inkt-zwarte dot-matrix tekst en één stempel-rood accent. Alles ademt kassabon:
// getande scheurranden (CSS clip-path zigzag-tanden), stippellijn-scheidingen, monospace bon-tekst,
// een nep-barcode (reeks verticale strepen met vaste breedtes), en "totaal"-regels met opgetelde
// bedragen. Subtiele papier-ruis via SVG feTurbulence. Volledig deterministisch — geen random.
// Palet: papier #f6f4ee, inkt-zwart #1a1a1a, stempel-rood #d1352b (+ ingetogen groen voor "voldaan").
// Fonts: --font-lab-plex-mono (bon-tekst) + --font-lab-franklin (labels).

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ArrowRight,
  Check,
  Plus,
  MapPin,
  Receipt,
  ScanLine,
  Printer,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f6f4ee",
  paperAlt: "#fbfaf4",
  paperDim: "#eeece3",
  ink: "#1a1a1a",
  inkSoft: "#57544c",
  faint: "#8b887e",
  red: "#d1352b",
  green: "#2f7048",
  line: "rgba(26,26,26,0.24)",
  lineSoft: "rgba(26,26,26,0.14)",
};

const receipt = { fontFamily: "var(--font-lab-plex-mono)" };
const label = { fontFamily: "var(--font-lab-franklin)" };

const DASHED = `1px dashed ${C.line}`;

/* ---------- Papier-ruis (deterministisch) ---------- */

function PaperNoise() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="bon-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="11"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#bon-noise)" opacity="0.035" />
    </svg>
  );
}

// Getande scheurrand — vaste tanden, overflow-clipped zodat het altijd de breedte vult.
function TornEdge({ side }: { side: "top" | "bottom" }) {
  const teeth = Array.from({ length: 64 });
  return (
    <div className="flex w-full overflow-hidden" style={{ height: 8 }} aria-hidden="true">
      {teeth.map((_, i) => (
        <span
          key={i}
          style={{
            flex: "0 0 auto",
            width: 11,
            height: 8,
            background: C.paperAlt,
            clipPath:
              side === "bottom"
                ? "polygon(0 0, 100% 0, 50% 100%)"
                : "polygon(0 100%, 100% 100%, 50% 0)",
          }}
        />
      ))}
    </div>
  );
}

// Nep-barcode uit een vaste breedte-reeks (geen random).
const BARCODE = [
  3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 1, 3, 1,
  1,
];
function Barcode({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-end gap-[2px]" style={{ height: 34 }} aria-hidden="true">
        {BARCODE.map((w, i) => (
          <span
            key={i}
            style={{ width: w, height: "100%", background: i % 5 === 0 ? C.red : C.ink }}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] tracking-[0.32em]" style={{ ...receipt, color: C.inkSoft }}>
        {code}
      </p>
    </div>
  );
}

function Dotted({ className = "" }: { className?: string }) {
  return <div className={className} style={{ borderTop: DASHED }} aria-hidden="true" />;
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.green, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.inkSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.red, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.red, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Stamp({ children, color = C.red }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
      style={{ ...receipt, color, border: `1.5px solid ${color}`, transform: "rotate(-2deg)" }}
    >
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ ...receipt, color: m.color, border: `1px solid ${m.color}88` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.ink }: { data: number[]; color?: string }) {
  const w = 88;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const bw = w / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {data.map((v, i) => {
        const bh = ((v - min) / span) * (h - 4) + 3;
        return (
          <rect
            key={i}
            x={i * bw + 1}
            y={h - bh}
            width={bw - 2}
            height={bh}
            fill={color}
            opacity={0.28 + (i / data.length) * 0.7}
          />
        );
      })}
    </svg>
  );
}

// Bon-kaart met getande boven- en onderrand.
function Bon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ filter: "drop-shadow(0 12px 26px rgba(26,26,26,0.14))" }}
    >
      <TornEdge side="top" />
      <div className="relative" style={{ background: C.paperAlt }}>
        <PaperNoise />
        <div className="relative">{children}</div>
      </div>
      <TornEdge side="bottom" />
    </div>
  );
}

function Row({
  l,
  v,
  strong = false,
  color = C.ink,
}: {
  l: React.ReactNode;
  v: React.ReactNode;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        className="truncate text-[12px]"
        style={{ ...receipt, color: strong ? C.ink : C.inkSoft, fontWeight: strong ? 600 : 400 }}
      >
        {l}
      </span>
      <span
        className="shrink-0 text-[12px] tabular-nums"
        style={{ ...receipt, color, fontWeight: strong ? 700 : 500 }}
      >
        {v}
      </span>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept72() {
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
      style={{
        ...label,
        color: C.ink,
        background: `repeating-linear-gradient(180deg, ${C.paper}, ${C.paper} 22px, ${C.paperDim} 22px, ${C.paperDim} 23px)`,
      }}
    >
      <PaperNoise />
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk — bon-stub */}
        <aside
          className="shrink-0 md:w-[236px]"
          style={{ borderRight: DASHED, background: C.paperAlt }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 p-5" style={{ borderBottom: DASHED }}>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
                style={{ background: C.ink }}
                aria-hidden="true"
              >
                <Receipt size={18} strokeWidth={2} color={C.paper} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[15px] font-bold tracking-[0.02em]"
                  style={{ ...receipt, color: C.ink }}
                >
                  BON
                </div>
                <div
                  className="text-[9px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  ZZP · zorg
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="relative flex shrink-0 items-center gap-2 rounded-[4px] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b] md:w-full"
                    style={{
                      ...receipt,
                      color: on ? C.paper : C.inkSoft,
                      background: on ? C.ink : "transparent",
                    }}
                  >
                    <span aria-hidden="true" style={{ color: on ? C.red : C.faint }}>
                      {on ? "▶" : "·"}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div className="hidden p-4 md:block" style={{ borderTop: DASHED }}>
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[11px] font-bold"
                  style={{ ...receipt, color: C.paper, background: C.ink }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[10px] font-semibold"
                    style={{ ...receipt, color: C.green }}
                  >
                    <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
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

/* ---------- Bon-kop ---------- */

function BonHead({ titel, sub, code }: { titel: string; sub?: string; code: string }) {
  return (
    <div className="px-5 pt-5 text-center sm:px-8">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.34em]"
        style={{ ...receipt, color: C.faint }}
      >
        ZZP · ZORG · UTRECHT
      </p>
      <h1
        className="mt-2 text-[19px] font-bold uppercase tracking-[0.06em]"
        style={{ ...receipt, color: C.ink }}
      >
        {titel}
      </h1>
      {sub && (
        <p className="mt-1 text-[11px]" style={{ ...receipt, color: C.inkSoft }}>
          {sub}
        </p>
      )}
      <p className="mt-1 text-[10px] tracking-[0.2em]" style={{ ...receipt, color: C.faint }}>
        BON {code} · KASSA 03 · 07:42
      </p>
      <Dotted className="mt-3" />
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Bon>
        <BonHead
          titel={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
          sub={`${PROFIEL.rol}`}
          code="A-2041"
        />

        <div className="px-5 pb-2 pt-3 sm:px-8">
          {warn && (
            <div
              className="mb-3 flex items-start gap-2.5 rounded-[4px] p-3"
              style={{ border: `1.5px solid ${C.red}`, background: "rgba(209,53,43,0.05)" }}
              role="alert"
            >
              <AlertTriangle
                size={16}
                strokeWidth={2.2}
                color={C.red}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-bold uppercase tracking-[0.04em]"
                  style={{ ...receipt, color: C.red }}
                >
                  {warn.titel}
                </p>
                <p className="mt-0.5 text-[11.5px]" style={{ ...receipt, color: C.inkSoft }}>
                  {warn.detail}
                </p>
                <button
                  onClick={() => onGo("verificatie")}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
                  style={{ ...receipt, color: C.paper, background: C.red }}
                >
                  {warn.cta} <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...receipt, color: C.faint }}
          >
            Kerncijfers
          </p>
          <div className="mt-1.5 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="flex items-center justify-between gap-3 py-1.5"
                style={{ borderBottom: `1px dotted ${C.lineSoft}` }}
              >
                <div className="min-w-0">
                  <p className="truncate text-[11.5px]" style={{ ...receipt, color: C.inkSoft }}>
                    {k.label}
                  </p>
                  <p
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...receipt, color: C.ink }}
                  >
                    {k.value}{" "}
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: k.up ? C.green : C.red }}
                    >
                      {k.up ? "▲" : "▼"} {k.trend}
                    </span>
                  </p>
                </div>
                <Spark data={k.spark} color={k.up ? C.ink : C.red} />
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-3 pt-2 sm:px-8">
          <div className="flex items-center justify-between">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ ...receipt, color: C.faint }}
            >
              Beste matches
            </p>
            <button
              onClick={() => onGo("marktplaats")}
              className="text-[10px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
              style={{ ...receipt, color: C.red }}
            >
              Alle bonnen →
            </button>
          </div>
          <Dotted className="mt-2" />
          {loading ? (
            <div className="space-y-2 py-3" role="status" aria-live="polite">
              <span className="sr-only">Bon wordt geprint…</span>
              <p
                className="flex items-center gap-2 text-[11px]"
                style={{ ...receipt, color: C.faint }}
              >
                <Printer size={13} strokeWidth={2.2} className="animate-pulse" aria-hidden="true" />{" "}
                PRINTEN…
              </p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span
                    className="h-3 flex-1 animate-pulse rounded"
                    style={{ background: C.paperDim }}
                  />
                  <span
                    className="h-3 w-12 animate-pulse rounded"
                    style={{ background: C.paperDim }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <ul className="py-1">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-baseline justify-between gap-3 py-1.5 text-left transition-colors hover:bg-[rgba(26,26,26,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d1352b]"
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span
                        className="text-[12px] font-bold tabular-nums"
                        style={{ ...receipt, color: o.match >= 90 ? C.red : C.ink }}
                      >
                        {o.match}%
                      </span>
                      <span className="truncate text-[12px]" style={{ ...receipt, color: C.ink }}>
                        {o.titel}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[11px] tabular-nums"
                      style={{ ...receipt, color: C.inkSoft }}
                    >
                      {o.tarief}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Dotted className="mt-1" />
          <div className="mt-3 flex items-center justify-between">
            <Barcode code="ZZP-2041-DASH" />
            <div className="text-right">
              <Stamp color={C.green}>
                <Check size={12} strokeWidth={3} aria-hidden="true" /> Op koers
              </Stamp>
              <p className="mt-2 text-[10px]" style={{ ...receipt, color: C.faint }}>
                Bedankt & tot ziens
              </p>
            </div>
          </div>
        </div>
      </Bon>
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
    <div className="mx-auto max-w-3xl space-y-5">
      <div
        className="flex items-center gap-3 rounded-[4px] px-4 py-3"
        style={{ background: C.paperAlt, border: DASHED }}
      >
        <Search size={16} strokeWidth={2.2} color={C.red} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[12px] uppercase tracking-[0.04em] outline-none placeholder:text-[#8b887e]"
          style={{ ...receipt, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...receipt, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Bon>
          <div className="p-10 text-center">
            <ScanLine
              size={26}
              strokeWidth={2}
              color={C.red}
              className="mx-auto"
              aria-hidden="true"
            />
            <p
              className="mt-3 text-[15px] font-bold uppercase tracking-[0.06em]"
              style={{ ...receipt, color: C.ink }}
            >
              Geen bon gevonden
            </p>
            <p
              className="mx-auto mt-2 max-w-xs text-[11.5px]"
              style={{ ...receipt, color: C.inkSoft }}
            >
              Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-4 rounded-[3px] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
              style={{ ...receipt, color: C.paper, background: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        </Bon>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="block w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
                >
                  <Bon>
                    <div
                      className="p-4"
                      style={on ? { boxShadow: `inset 0 0 0 2px ${C.red}` } : undefined}
                    >
                      <div className="flex items-baseline justify-between">
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{ ...receipt, color: C.faint }}
                        >
                          {o.id} {on && <span style={{ color: C.red }}>· geselecteerd</span>}
                        </span>
                        <span
                          className="text-[16px] font-bold tabular-nums"
                          style={{ ...receipt, color: o.match >= 90 ? C.red : C.ink }}
                        >
                          {o.match}%
                        </span>
                      </div>
                      <p
                        className="mt-1 text-[14px] font-bold"
                        style={{ ...receipt, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[11px]"
                        style={{ ...receipt, color: C.inkSoft }}
                      >
                        <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.tarief}
                      </p>
                      <Dotted className="my-2" />
                      <ul className="space-y-0.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <li
                            key={r}
                            className="flex items-center gap-1.5 text-[11px]"
                            style={{ ...receipt, color: C.green }}
                          >
                            <Check size={11} strokeWidth={3} aria-hidden="true" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Bon>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Bon>
                <BonHead
                  titel={sel.titel}
                  sub={`${sel.opdrachtgever} · ${sel.plaats}`}
                  code={sel.id.replace("OPD-", "")}
                />
                <div className="px-5 pb-4 sm:px-8">
                  <Row l="Tarief" v={sel.tarief} strong />
                  <Row l="Omvang" v={sel.uren} />
                  <Row l="Start" v={sel.start} />
                  <Dotted className="my-2" />
                  <Row
                    l="Match-score"
                    v={`${sel.match}%`}
                    strong
                    color={sel.match >= 90 ? C.red : C.ink}
                  />
                  <Dotted className="my-3" />
                  <Barcode code={`ZZP-${sel.id.replace("OPD-", "")}`} className="mb-3" />
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-[3px] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
                    style={{ ...receipt, color: C.paper, background: C.red }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Bon>
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
    <div className="mx-auto max-w-2xl space-y-5">
      <Bon>
        <BonHead
          titel={opdracht.titel}
          sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
          code={opdracht.id.replace("OPD-", "")}
        />
        <div className="px-5 pb-4 sm:px-8">
          <Row l="Tarief" v={opdracht.tarief} strong />
          <Row l="Omvang" v={opdracht.uren} />
          <Row l="Startdatum" v={opdracht.start} />
          <Row
            l="Match-score"
            v={`${opdracht.match}%`}
            strong
            color={opdracht.match >= 90 ? C.red : C.ink}
          />
          <Dotted className="my-2" />
          <div className="flex flex-wrap gap-1.5 py-1">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-[3px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...receipt, color: C.inkSoft, border: `1px solid ${C.lineSoft}` }}
              >
                {t}
              </span>
            ))}
          </div>

          <Dotted className="my-3" />
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ ...receipt, color: C.faint }}
          >
            Waarom deze match
          </p>
          <ul className="mt-2 space-y-1">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12px]"
                style={{ ...receipt, color: C.ink }}
              >
                <Check
                  size={13}
                  strokeWidth={2.8}
                  color={C.green}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[12px]"
                style={{ ...receipt, color: C.inkSoft }}
              >
                <AlertTriangle
                  size={13}
                  strokeWidth={2.4}
                  color={C.red}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {r}
              </li>
            ))}
          </ul>

          <Dotted className="my-3" />
          <div className="flex items-end justify-between gap-3">
            <Barcode code={`ZZP-${opdracht.id.replace("OPD-", "")}-X`} />
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className="flex shrink-0 items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b] disabled:opacity-90"
              style={{ ...receipt, color: C.paper, background: state === "sent" ? C.green : C.red }}
            >
              {state === "idle" && (
                <>
                  <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" /> Reageren
                </>
              )}
              {state === "sending" && (
                <>
                  <Printer
                    size={14}
                    strokeWidth={2.6}
                    className="animate-pulse"
                    aria-hidden="true"
                  />{" "}
                  Printen…
                </>
              )}
              {state === "sent" && (
                <>
                  <Check size={14} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        </div>
      </Bon>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Bon>
        <BonHead titel="Certificaten" sub="Je bewijsstukken worden privé bewaard" code="VERIF" />
        <div className="px-5 pb-4 sm:px-8">
          <div className="grid grid-cols-3 gap-2 pb-2">
            {[
              { l: "Verified", v: `${verified}/${total}`, color: C.green },
              { l: "Verloopt", v: "1", color: C.red },
              { l: "Wacht", v: "1", color: C.inkSoft },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-[3px] p-2 text-center"
                style={{ border: `1px solid ${C.lineSoft}` }}
              >
                <p
                  className="text-[16px] font-bold tabular-nums"
                  style={{ ...receipt, color: s.color }}
                >
                  {s.v}
                </p>
                <p
                  className="text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...receipt, color: C.faint }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
          <Dotted className="my-2" />
          <ul>
            {CREDENTIALS.map((c) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: `1px dotted ${C.lineSoft}` }}
                >
                  <Icon
                    size={17}
                    strokeWidth={2}
                    color={m.color}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[12.5px] font-semibold"
                      style={{ ...receipt, color: C.ink }}
                    >
                      {c.naam}
                    </p>
                    <p className="truncate text-[10.5px]" style={{ ...receipt, color: C.inkSoft }}>
                      {c.detail}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              );
            })}
          </ul>
          <Dotted className="my-3" />
          <Barcode code="ZZP-VERIF-OK" />
        </div>
      </Bon>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Bon>
        <BonHead titel="Volgende acties" sub="Op volgorde van urgentie" code="TODO" />
        <div className="px-5 pb-4 sm:px-8">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const color = warn ? C.red : C.ink;
            return (
              <div
                key={a.titel}
                className="py-2.5"
                style={{
                  borderBottom: i < ACTIES.length - 1 ? `1px dotted ${C.lineSoft}` : "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-[13px] font-bold tabular-nums"
                    style={{ ...receipt, color }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle
                          size={13}
                          strokeWidth={2.4}
                          color={C.red}
                          aria-hidden="true"
                        />
                      ) : (
                        <Check size={13} strokeWidth={2.6} color={C.inkSoft} aria-hidden="true" />
                      )}
                      <span
                        className="text-[9.5px] font-bold uppercase tracking-[0.12em]"
                        style={{ ...receipt, color: warn ? C.red : C.faint }}
                      >
                        {warn ? "Waarschuwing" : "Melding"}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[12.5px] font-semibold"
                      style={{ ...receipt, color: C.ink }}
                    >
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ ...receipt, color: C.inkSoft }}>
                      {a.detail}
                    </p>
                  </div>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className="shrink-0 self-center rounded-[3px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
                    style={{
                      ...receipt,
                      color: warn ? C.paper : C.ink,
                      background: warn ? C.red : "transparent",
                      border: warn ? "none" : `1px solid ${C.line}`,
                    }}
                  >
                    {a.cta}
                  </button>
                </div>
              </div>
            );
          })}
          <Dotted className="my-3" />
          <Barcode code="ZZP-TODO-03" />
        </div>
      </Bon>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const totaal = FACTUREN.reduce((s, f) => s + digits(f.bedrag), 0);
  const btw = Math.round(totaal * 0.21);

  const statusMeta: Record<string, { color: string; Icon: typeof Check; label: string }> = {
    Betaald: { color: C.green, Icon: Check, label: "Voldaan" },
    Openstaand: { color: C.red, Icon: Clock, label: "Open" },
    Concept: { color: C.inkSoft, Icon: Printer, label: "Concept" },
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1352b]"
          style={{ ...receipt, color: C.paper, background: C.ink }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>
      <Bon>
        <BonHead titel="Facturen" sub="Overzicht deze maand" code="FIN" />
        <div className="px-5 pb-4 sm:px-8">
          <div
            className="grid grid-cols-[auto_auto_1fr_auto] items-baseline gap-x-3 gap-y-0 text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ ...receipt, color: C.faint }}
          >
            <span>Nr</span>
            <span className="hidden sm:inline">Datum</span>
            <span>Klant</span>
            <span className="text-right">Bedrag</span>
          </div>
          <Dotted className="my-1.5" />
          {FACTUREN.map((f) => {
            const meta = statusMeta[f.status] ?? { color: C.inkSoft, Icon: Check, label: f.status };
            const Icon = meta.Icon;
            return (
              <div
                key={f.nr}
                className="grid grid-cols-[auto_auto_1fr_auto] items-baseline gap-x-3 py-1.5"
              >
                <span
                  className="text-[10.5px] font-semibold tabular-nums"
                  style={{ ...receipt, color: C.inkSoft }}
                >
                  {f.nr.replace("FAC-2025-", "#")}
                </span>
                <span
                  className="hidden text-[10.5px] tabular-nums sm:inline"
                  style={{ ...receipt, color: C.faint }}
                >
                  {f.datum}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[12px] font-semibold"
                    style={{ ...receipt, color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.06em]"
                    style={{ ...receipt, color: meta.color }}
                  >
                    <Icon size={10} strokeWidth={2.6} aria-hidden="true" /> {meta.label}
                  </span>
                </span>
                <span
                  className="text-right text-[12.5px] font-bold tabular-nums"
                  style={{ ...receipt, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </div>
            );
          })}
          <Dotted className="my-2" />
          <Row l="Subtotaal" v={`€ ${totaal.toLocaleString("nl-NL")}`} />
          <Row l="Waarvan btw (21%)" v={`€ ${btw.toLocaleString("nl-NL")}`} />
          <Row l="Ontvangen" v={`€ ${betaald.toLocaleString("nl-NL")}`} color={C.green} />
          <div
            className="my-1 border-t-2 border-double"
            style={{ borderColor: C.ink }}
            aria-hidden="true"
          />
          <Row l="OPENSTAAND TOTAAL" v={`€ ${open.toLocaleString("nl-NL")}`} strong color={C.red} />
          <Dotted className="my-3" />
          <div className="flex items-end justify-between">
            <Barcode code="ZZP-FIN-2025" />
            <Stamp color={open > 0 ? C.red : C.green}>{open > 0 ? "Te innen" : "Voldaan"}</Stamp>
          </div>
        </div>
      </Bon>
    </div>
  );
}
