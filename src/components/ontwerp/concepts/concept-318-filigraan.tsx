"use client";

// Concept 318 — "Filigraan" · Ultra-fijne hairline-filigrein / juweel-precisie.
// Warm-wit vlak (#faf8f2) met piepdunne 1px inkt-lijnen, delicate hoekornamenten en een
// dun goud-accent (#9a7b3f). Luxe-minimalisme: veel wit, haarscherpe details, fijne
// typografische capitalen (Cormorant-serif, ruim gespatieerd). Rustig en kostbaar rond
// gevoelige documenten & verificatie — vertrouwen door precisie, niet door drukte.
// Fonts: --font-lab-cormorant (display-serif) + --font-lab-inter (tekst) + --font-lab-mono (cijfers).

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
  Gem,
  FileText,
  Mail,
  RotateCw,
  Feather,
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

void NAV;

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#faf8f2",
  paper: "#fffdf8",
  paperAlt: "#f4f1e8",
  wash: "#f6f1e3",
  gold: "#9a7b3f",
  goldSoft: "#b89a5e",
  goldFaint: "#dccca3",
  ink: "#211d16",
  sub: "#4a4436",
  muted: "#6f6857",
  faint: "#9c9482",
  warn: "#a15a1e",
  alert: "#9c2b2b",
  ok: "#3f6b4e",
  line: "rgba(33,29,22,0.14)",
  lineSoft: "rgba(33,29,22,0.08)",
  hair: "rgba(154,123,63,0.4)",
  hairSoft: "rgba(154,123,63,0.2)",
};

const serif = { fontFamily: "var(--font-lab-cormorant)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a7b3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f2]";

/* ---------- Filigrein-hoekornament (deterministisch, dun SVG) ---------- */

function FiligreeCorner({
  size = 20,
  color = C.gold,
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
      <path d="M1 10 V1 H10" stroke={color} strokeWidth="0.75" strokeLinecap="round" />
      <path
        d="M4 4 C9 4 11 6 11 11"
        stroke={color}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M4 4 C4 9 6 11 11 11"
        stroke={color}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="4" cy="4" r="0.9" fill={color} />
      <circle cx="11" cy="11" r="0.7" fill={color} opacity="0.7" />
    </svg>
  );
}

function Corners({ color = C.goldFaint }: { color?: string }) {
  return (
    <>
      <FiligreeCorner color={color} className="pointer-events-none absolute left-2 top-2" />
      <FiligreeCorner
        color={color}
        className="pointer-events-none absolute right-2 top-2"
        style={{ transform: "scaleX(-1)" }}
      />
      <FiligreeCorner
        color={color}
        className="pointer-events-none absolute bottom-2 left-2"
        style={{ transform: "scaleY(-1)" }}
      />
      <FiligreeCorner
        color={color}
        className="pointer-events-none absolute bottom-2 right-2"
        style={{ transform: "scale(-1,-1)" }}
      />
    </>
  );
}

// Dunne sierlijn met een centrale ruit — delicaat scheidingsteken.
function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden="true">
      <span className="h-px flex-1" style={{ background: C.hairSoft }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ border: `0.75px solid ${C.gold}` }} />
      <span className="h-px flex-1" style={{ background: C.hairSoft }} />
    </div>
  );
}

/* ---------- Kaart met haarlijn-kader ---------- */

function Card({
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
      className={`relative rounded-[6px] ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(154,123,63,0.06)",
      }}
    >
      {corners && <Corners />}
      {children}
    </Tag>
  );
}

/* ---------- Fijne typografische capitalen ---------- */

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.42em]"
      style={{ ...body, color: C.gold }}
    >
      <span className="h-1 w-1 rotate-45" style={{ background: C.gold }} aria-hidden="true" />
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2.5 text-[30px] leading-[1.04] tracking-[0.01em] sm:text-[38px]"
      style={{ ...serif, color: C.ink, fontWeight: 500 }}
    >
      {children}
    </h1>
  );
}

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.ok, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In behandeling", color: C.gold, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, Icon: XCircle };
  }
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{
        ...body,
        color: m.color,
        background: `${m.color}0d`,
        border: `1px solid ${m.color}33`,
      }}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Fijne sparkline ---------- */

function Spark({ data, color = C.gold }: { data: number[]; color?: string }) {
  const w = 100;
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
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <>
          <circle cx={last[0]} cy={last[1]} r="2.4" fill="none" stroke={color} strokeWidth="0.75" />
          <circle cx={last[0]} cy={last[1]} r="1" fill={color} />
        </>
      )}
    </svg>
  );
}

// Match-score als dun juweel-medaillon.
function ScoreJewel({ value, size = 46 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const strong = value >= 90;
  const stroke = strong ? C.gold : C.goldSoft;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.hairSoft} strokeWidth="1" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span
        className="text-[13px] tabular-nums"
        style={{ ...serif, color: C.ink, fontWeight: 600 }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept318() {
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
      {/* zeer fijn ruit-filigrein op de achtergrond */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${C.hairSoft} 0 0.5px, transparent 0.5px 34px), repeating-linear-gradient(-45deg, ${C.hairSoft} 0 0.5px, transparent 0.5px 34px)`,
          opacity: 0.35,
        }}
      />

      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(255,253,248,0.7)" }}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: C.paper, border: `1px solid ${C.gold}` }}
                aria-hidden="true"
              >
                <Corners color={C.goldFaint} />
                <Gem size={18} strokeWidth={1.4} color={C.gold} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[19px] tracking-[0.06em]"
                  style={{ ...serif, color: C.ink, fontWeight: 500 }}
                >
                  Filigraan
                </div>
                <div
                  className="text-[8.5px] font-medium uppercase tracking-[0.3em]"
                  style={{ color: C.faint }}
                >
                  ZZP · atelier
                </div>
              </div>
            </div>

            <nav
              className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col"
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
                    className={`relative flex shrink-0 items-center gap-2.5 rounded-[4px] px-3.5 py-2.5 text-left text-[12px] tracking-[0.02em] transition-colors md:w-full ${RING}`}
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? C.wash : "transparent",
                      border: `1px solid ${on ? C.hair : "transparent"}`,
                      fontWeight: on ? 600 : 500,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rotate-45"
                      style={{
                        border: `0.75px solid ${on ? C.gold : C.goldFaint}`,
                        background: on ? C.gold : "transparent",
                      }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.line}`, background: "rgba(244,241,232,0.6)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px]"
                style={{ ...serif, color: C.paper, background: C.gold, fontWeight: 600 }}
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
                  style={{ color: C.gold }}
                >
                  <ShieldCheck size={11} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
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
  void activeId;
  void onSelect;
  const warn = ACTIES[0];
  const [feed, setFeed] = useState<"loading" | "error" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("error"), 720);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Overline>Overzicht</Overline>
          <Title>Goedemorgen, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-[4px] px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: C.gold, background: C.paper, border: `1px solid ${C.hair}` }}
        >
          <Gem size={13} strokeWidth={1.6} aria-hidden="true" /> {OPDRACHTEN.length} matches
        </div>
      </header>

      <Divider />

      {warn && (
        <div
          className="flex flex-col gap-3 rounded-[6px] p-4 sm:flex-row sm:items-center"
          style={{ border: `1px solid ${C.warn}44`, background: `${C.warn}0a` }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[5px]"
            style={{ background: C.paper, border: `1px solid ${C.warn}44` }}
          >
            <AlertTriangle size={18} strokeWidth={1.8} color={C.warn} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold">{warn.titel}.</span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            type="button"
            onClick={() => onGo("verificatie")}
            className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors ${RING}`}
            style={{ background: C.warn }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} corners className="flex flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-[9.5px] font-semibold uppercase leading-tight tracking-[0.14em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ ...mono, color: k.up ? C.ok : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.2} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-4 text-[27px] tabular-nums leading-none"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.gold : C.warn} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <div
            className="flex items-center justify-between p-5"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[16px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              <Gem size={15} strokeWidth={1.6} color={C.gold} aria-hidden="true" /> Beste matches
            </h3>
            <button
              type="button"
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${RING}`}
              style={{ color: C.gold }}
            >
              Marktplaats <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <ul className="p-2.5">
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`flex w-full items-center gap-3.5 rounded-[4px] p-3 text-left transition-colors hover:bg-[#f6f1e3] ${RING}`}
                >
                  <ScoreJewel value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px]"
                      style={{ ...serif, color: C.ink, fontWeight: 600 }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={12} strokeWidth={1.8} aria-hidden="true" /> {o.opdrachtgever} ·{" "}
                      {o.plaats} · <span style={mono}>{o.tarief}</span>
                    </span>
                  </span>
                  <ArrowUpRight
                    size={15}
                    strokeWidth={1.8}
                    color={C.faint}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3
              className="flex items-center gap-2 text-[14px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              <Feather size={14} strokeWidth={1.6} color={C.gold} aria-hidden="true" /> Nu oppakken
            </h3>
            <ul className="mt-3 space-y-2.5">
              {ACTIES.slice(0, 2).map((a) => {
                const w = a.urgentie === "warning";
                const col = w ? C.warn : C.gold;
                return (
                  <li
                    key={a.titel}
                    className="flex gap-3 rounded-[4px] p-2.5"
                    style={{ border: `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45"
                      style={{ background: col }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                        {a.titel}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: C.muted }}>
                        {a.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => onGo("acties")}
              className={`mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${RING}`}
              style={{ color: C.gold }}
            >
              Alle acties <ArrowRight size={12} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </Card>

          {/* Live feed — loading + error-state */}
          <Card className="p-5">
            <h3
              className="flex items-center gap-2 text-[13px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              <Mail size={14} strokeWidth={1.6} color={C.gold} aria-hidden="true" /> Correspondentie
            </h3>
            {feed === "loading" && (
              <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <span className="sr-only">Correspondentie wordt geladen…</span>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className="block h-3 animate-pulse rounded-[2px]"
                    style={{ background: C.lineSoft, width: i === 0 ? "80%" : "58%" }}
                  />
                ))}
              </div>
            )}
            {feed === "error" && (
              <div
                className="mt-3 flex flex-col gap-2 rounded-[4px] p-3 sm:flex-row sm:items-center"
                style={{ background: `${C.alert}0a`, border: `1px solid ${C.alert}33` }}
                role="alert"
              >
                <XCircle size={16} strokeWidth={1.8} color={C.alert} aria-hidden="true" />
                <p className="flex-1 text-[12px]" style={{ color: C.ink }}>
                  Postvak onbereikbaar. Kon de berichten niet laden.
                </p>
                <button
                  type="button"
                  onClick={() => setFeed("ok")}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors ${RING}`}
                  style={{ background: C.gold }}
                >
                  <RotateCw size={12} strokeWidth={2.2} aria-hidden="true" /> Opnieuw
                </button>
              </div>
            )}
            {feed === "ok" && (
              <ul className="mt-3 space-y-3">
                {BERICHTEN.slice(0, 2).map((b) => (
                  <li key={b.van} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px]"
                      style={{
                        ...serif,
                        color: C.gold,
                        background: C.wash,
                        border: `1px solid ${C.hair}`,
                        fontWeight: 600,
                      }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="truncate text-[12px] font-semibold"
                          style={{ color: C.ink }}
                        >
                          {b.van}
                        </span>
                        {b.ongelezen && (
                          <span
                            className="h-1 w-1 shrink-0 rotate-45"
                            style={{ background: C.gold }}
                            aria-label="ongelezen"
                          />
                        )}
                      </span>
                      <span className="block truncate text-[11px]" style={{ color: C.muted }}>
                        {b.preview}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[10px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
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
        <Overline>Marktplaats</Overline>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-[5px] px-4 py-3"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <Search size={16} strokeWidth={1.8} color={C.gold} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9c9482]"
          style={{ ...body, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card corners className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[6px]"
            style={{ background: C.wash, border: `1px solid ${C.hair}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={1.6} color={C.gold} />
          </span>
          <p className="mt-4 text-[22px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12px]" style={{ color: C.muted }}>
            Geen match past bij &quot;{q}&quot;. Verruim je zoekopdracht.
          </p>
          <button
            type="button"
            onClick={() => setQ("")}
            className={`mt-5 rounded-[4px] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
            style={{ background: C.gold }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
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
                  className={`relative w-full rounded-[6px] p-4 text-left transition-colors hover:bg-[#fffdf8] ${RING}`}
                  style={{
                    background: on ? C.paper : "transparent",
                    border: `1px solid ${on ? C.gold : C.line}`,
                  }}
                >
                  {on && <Corners color={C.goldFaint} />}
                  <div className="flex items-start gap-3.5">
                    <ScoreJewel value={o.match} size={52} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        <span>{o.id}</span>
                        {on && <span style={{ color: C.gold }}>· gekozen</span>}
                      </div>
                      <p
                        className="truncate text-[16px]"
                        style={{ ...serif, color: C.ink, fontWeight: 600 }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={1.8} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · <span style={mono}>{o.tarief}</span>
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.sub,
                              background: C.paperAlt,
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            {t}
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
              <Card corners>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ ...mono, color: C.gold }}
                  >
                    {sel.id}
                  </span>
                  <Gem size={14} strokeWidth={1.6} color={C.gold} aria-hidden="true" />
                </div>
                <div className="p-5">
                  <p
                    className="text-[18px] leading-snug"
                    style={{ ...serif, color: C.ink, fontWeight: 600 }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <Divider className="my-4" />
                  <dl className="grid grid-cols-2 gap-3 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div key={m.l}>
                        <dt
                          className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd
                          className="mt-0.5 tabular-nums"
                          style={{ ...serif, color: C.ink, fontWeight: 600 }}
                        >
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    onClick={() => onOpen(sel.id)}
                    className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-[4px] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
                    style={{ background: C.gold }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </Card>
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
      <Card corners>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.26em]"
              style={{ ...mono, color: C.gold }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-2.5 text-[28px] leading-[1.06] tracking-[0.01em] sm:text-[34px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-[3px] px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.sub,
                    background: C.paperAlt,
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <ScoreJewel value={opdracht.match} size={74} />
        </div>
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-[13px] font-semibold text-white transition-colors disabled:opacity-90 ${RING}`}
            style={{ background: state === "sent" ? C.ok : C.gold }}
          >
            {state === "idle" && (
              <>
                <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[19px] tabular-nums"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div
          className="flex items-center gap-2 p-5"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Gem size={15} strokeWidth={1.6} color={C.gold} aria-hidden="true" />
          <h3 className="text-[16px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.ok }}
            >
              <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Pluspunten
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
                    strokeWidth={2.2}
                    color={C.ok}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" /> Aandachtspunten
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
                    strokeWidth={2}
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
      </Card>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.ok, Icon: ShieldCheck },
    { l: "Verloopt", v: "1", color: C.warn, Icon: AlertTriangle },
    { l: "In behandeling", v: "1", color: C.gold, Icon: Clock },
  ];
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Overline>Verificatie</Overline>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.l} corners className="flex items-center justify-between p-4">
              <div>
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] tabular-nums"
                  style={{ ...serif, color: C.ink, fontWeight: 500 }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}33` }}
              >
                <Icon size={20} strokeWidth={1.8} color={s.color} aria-hidden="true" />
              </span>
            </Card>
          );
        })}
      </div>

      {expiring && (
        <div
          className="flex items-center gap-3 rounded-[6px] p-4"
          style={{ background: `${C.warn}0a`, border: `1px solid ${C.warn}44` }}
          role="alert"
        >
          <AlertTriangle
            size={18}
            strokeWidth={1.8}
            color={C.warn}
            className="shrink-0"
            aria-hidden="true"
          />
          <p className="text-[12.5px]" style={{ color: C.ink }}>
            <span className="font-semibold">{expiring.naam}</span> — {expiring.detail}. Vernieuw op
            tijd om verifieerbaar te blijven.
          </p>
        </div>
      )}

      <Card>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px]"
                style={{ background: `${m.color}0d`, border: `1px solid ${m.color}33` }}
              >
                <Icon size={20} strokeWidth={1.8} color={m.color} aria-hidden="true" />
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
      </Card>

      <Card>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <FileText size={15} strokeWidth={1.6} color={C.gold} aria-hidden="true" />
          <h3 className="text-[15px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
            Documenten
          </h3>
        </div>
        <ul>
          {DOCUMENTEN.map((d, i) => {
            const m = credMeta(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-3 p-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold"
                  style={{ ...mono, background: C.paperAlt, color: C.sub }}
                  aria-hidden="true"
                >
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                    {d.naam}
                  </p>
                  <p className="text-[11px]" style={{ ...mono, color: C.faint }}>
                    {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: m.color }}
                >
                  <m.Icon size={13} strokeWidth={2} aria-hidden="true" /> {m.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Overline>Prioriteiten</Overline>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.gold;
          return (
            <Card key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}0a`, borderRight: `1px solid ${color}2e` }}
              >
                <span
                  className="text-[17px] tabular-nums"
                  style={{ ...serif, color, fontWeight: 500 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2} color={color} aria-hidden="true" />
                ) : (
                  <Gem size={15} strokeWidth={1.6} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
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
                className={`m-3 shrink-0 self-center rounded-[4px] px-4 py-2 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: warn ? "#fff" : C.gold,
                  background: warn ? C.warn : C.wash,
                  border: warn ? "none" : `1px solid ${C.hair}`,
                }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-[6px] p-4"
        style={{ background: C.wash, border: `1px solid ${C.hair}` }}
      >
        <Check size={18} strokeWidth={2} color={C.gold} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.sub }}>
          Verder is alles bijgewerkt. Nieuwe meldingen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.ok,
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
          <Overline>Financiën</Overline>
          <Title>Facturen</Title>
        </div>
        <button
          type="button"
          className={`inline-flex shrink-0 items-center gap-2 rounded-[4px] px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors ${RING}`}
          style={{ background: C.gold }}
        >
          <Plus size={14} strokeWidth={2.2} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card corners className="p-5">
          <p
            className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[24px] tabular-nums"
            style={{ ...serif, color: C.ok, fontWeight: 500 }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Card>
        <Card corners className="p-5">
          <p
            className="text-[9.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[24px] tabular-nums"
            style={{ ...serif, color: C.warn, fontWeight: 500 }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
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
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rotate-45"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
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
      </Card>

      <div
        className="flex items-center gap-3 rounded-[6px] p-4"
        style={{ background: C.paperAlt, border: `1px solid ${C.lineSoft}` }}
      >
        <Mail size={16} strokeWidth={1.8} color={C.gold} aria-hidden="true" />
        <p className="text-[12px]" style={{ color: C.muted }}>
          Tip: verstuur automatisch een nette herinnering bij facturen die langer dan 14 dagen
          openstaan.
        </p>
      </div>
    </div>
  );
}
