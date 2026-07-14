"use client";

// Concept 320 — "Handpalm" · mobiel-first, duim-zone-ontwerp.
// Alles bedienbaar met één hand: bottom-sheet-navigatie, grote raakvlakken onderaan, swipe-achtige
// kaarten en een sticky action-bar binnen duimbereik. Een realistische telefoon-frame staat
// gecentreerd op desktop; de kernschermen tonen als mobiele views. Licht, fris, één helder accent
// (indigo). 2026-trend: thumb-first, bottom-nav, gesture-hints.
// Fonts: --font-lab-manrope (kop) + --font-lab-inter (tekst) + --font-lab-mono (cijfers).
// Onderscheidend: de telefoon zelf is het canvas; navigatie en acties leven onderaan, in de duimzone.

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
  Home,
  Zap,
  Wallet,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  Send,
  SlidersHorizontal,
  Signal,
  Wifi,
  BatteryFull,
  Bell,
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
void DOCUMENTEN;
void SCREENS;

/* ---------- Palet & typografie ---------- */

const C = {
  stage: "#e7ebf2",
  stageAlt: "#dfe4ee",
  screen: "#f7f8fb",
  card: "#ffffff",
  ink: "#0f1620",
  sub: "#5a6472",
  faint: "#96a0af",
  accent: "#4f46e5",
  accentDark: "#3d34c9",
  accentSoft: "#ecebfd",
  jade: "#0f9d58",
  jadeSoft: "#e4f5ec",
  warn: "#c2740a",
  warnSoft: "#fbf1e0",
  alert: "#d23b3b",
  alertSoft: "#fbe9e9",
  line: "#e6e9f0",
  lineSoft: "#eef1f6",
};

const head = { fontFamily: "var(--font-lab-manrope)" };
const body = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = { label: string; color: string; soft: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.jade, soft: C.jadeSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.accent, soft: C.accentSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", color: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...body, color: m.color, background: m.soft }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 72;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace("#", "");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 3) - 1.5;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={`hp-area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#hp-area-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2" fill={color} />}
    </svg>
  );
}

// Ronde match-meter, geoptimaliseerd voor kleine schermen.
function MatchRing({ value, size = 46 }: { value: number; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[12px] font-bold tabular-nums" style={{ ...mono, color: C.accent }}>
        {value}
      </span>
    </span>
  );
}

// Sectie-kop binnen een scherm.
function ScreenHead({
  kicker,
  titel,
  sub,
  right,
}: {
  kicker: string;
  titel: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.accent }}
        >
          {kicker}
        </p>
        <h1
          className="mt-1 text-[22px] font-extrabold leading-tight"
          style={{ ...head, color: C.ink }}
        >
          {titel}
        </h1>
        {sub && (
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// Zachte gesture-hint: subtiele chevrons die "veeg" suggereren.
function SwipeHint() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold"
      style={{ ...body, color: C.faint }}
      aria-hidden="true"
    >
      <span style={{ animation: "hp-nudge 1.6s ease-in-out infinite" }}>
        <ChevronRight size={13} strokeWidth={2.6} />
      </span>
      veeg
    </span>
  );
}

/* ---------- Telefoon-frame (het handtekening-element) ---------- */

function StatusBar() {
  return (
    <div
      className="relative flex items-center justify-between px-6 pb-1 pt-2.5 text-[12px] font-semibold"
      style={{ ...mono, color: C.ink }}
    >
      <span>21:04</span>
      {/* Dynamic island */}
      <span
        className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full"
        style={{ background: "#0b0f16" }}
        aria-hidden="true"
      />
      <span className="flex items-center gap-1.5" aria-hidden="true">
        <Signal size={13} strokeWidth={2.4} />
        <Wifi size={13} strokeWidth={2.4} />
        <BatteryFull size={15} strokeWidth={2} />
      </span>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

const NAV_ITEMS: { key: ScreenKey; label: string; Icon: typeof Home }[] = [
  { key: "dashboard", label: "Start", Icon: Home },
  { key: "marktplaats", label: "Markt", Icon: Search },
  { key: "acties", label: "Acties", Icon: Zap },
  { key: "verificatie", label: "Bewijs", Icon: ShieldCheck },
  { key: "facturen", label: "Kassa", Icon: Wallet },
];

export function Concept320() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const inDetail = screen === "opdracht";

  return (
    <div
      className="flex min-h-[680px] w-full items-center justify-center overflow-hidden p-4 antialiased sm:p-8"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(120% 90% at 50% 0%, ${C.stage}, ${C.stageAlt} 70%)`,
      }}
    >
      <style>{`
        @keyframes hp-nudge { 0%,100% { transform: translateX(0); opacity: 0.5; } 50% { transform: translateX(3px); opacity: 1; } }
        @keyframes hp-slide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hp-sheet { from { transform: translateY(14px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Telefoon-behuizing */}
      <div
        className="relative w-full max-w-[400px] rounded-[44px] p-2.5"
        style={{
          background: "linear-gradient(160deg, #1a2029, #0b0f16)",
          boxShadow: "0 40px 80px -30px rgba(15,22,32,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Zijknoppen */}
        <span
          className="absolute -left-1 top-24 h-14 w-1 rounded-full"
          style={{ background: "#2a323d" }}
          aria-hidden="true"
        />
        <span
          className="absolute -right-1 top-32 h-20 w-1 rounded-full"
          style={{ background: "#2a323d" }}
          aria-hidden="true"
        />

        {/* Scherm */}
        <div
          className="relative flex h-[664px] flex-col overflow-hidden rounded-[36px]"
          style={{ background: C.screen }}
        >
          <StatusBar />

          {/* Header per scherm */}
          <TopBar inDetail={inDetail} onBack={() => setScreen("marktplaats")} />

          {/* Scroll-inhoud */}
          <div
            key={screen}
            className="flex-1 overflow-y-auto pb-4"
            style={{ animation: "hp-slide 0.32s ease" }}
          >
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>

          {/* Duim-zone: bottom-nav */}
          {!inDetail && <BottomNav screen={screen} onGo={setScreen} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Top-bar (titel + profiel/terug) ---------- */

function TopBar({ inDetail, onBack }: { inDetail: boolean; onBack: () => void }) {
  if (inDetail) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: `1px solid ${C.lineSoft}` }}
      >
        <button
          onClick={onBack}
          aria-label="Terug naar marktplaats"
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#eef1f6] ${RING}`}
        >
          <ChevronLeft size={20} strokeWidth={2.4} color={C.ink} aria-hidden="true" />
        </button>
        <span className="text-[13px] font-bold" style={{ ...head, color: C.ink }}>
          Opdracht
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ ...mono, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-bold" style={{ ...head, color: C.ink }}>
            {PROFIEL.naam.split(" ")[0]}
          </p>
          <p
            className="flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: C.jade }}
          >
            <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
          </p>
        </div>
      </div>
      <button
        aria-label="Meldingen"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#eef1f6] ${RING}`}
      >
        <Bell size={18} strokeWidth={2.2} color={C.sub} aria-hidden="true" />
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white"
          style={{ background: C.alert }}
          aria-label="ongelezen meldingen"
        />
      </button>
    </div>
  );
}

/* ---------- Bottom-nav (duim-zone) ---------- */

function BottomNav({ screen, onGo }: { screen: ScreenKey; onGo: (k: ScreenKey) => void }) {
  return (
    <nav
      className="shrink-0 px-2 pb-3 pt-1.5"
      style={{ borderTop: `1px solid ${C.line}`, background: C.card }}
      aria-label="Hoofdnavigatie"
    >
      <div className="flex items-stretch justify-between">
        {NAV_ITEMS.map((it) => {
          const on = it.key === screen;
          const Icon = it.Icon;
          return (
            <button
              key={it.key}
              onClick={() => onGo(it.key)}
              aria-current={on ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${RING}`}
            >
              <span
                className="flex h-9 w-12 items-center justify-center rounded-full transition-colors"
                style={{ background: on ? C.accentSoft : "transparent" }}
              >
                <Icon
                  size={20}
                  strokeWidth={on ? 2.6 : 2.1}
                  color={on ? C.accent : C.faint}
                  aria-hidden="true"
                />
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: on ? C.accent : C.faint }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Home-indicator */}
      <span
        className="mx-auto mt-1.5 block h-1 w-28 rounded-full"
        style={{ background: "#c7ccd6" }}
        aria-hidden="true"
      />
    </nav>
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
  const [feed, setFeed] = useState<"loading" | "ok">("loading");
  useEffect(() => {
    const t = window.setTimeout(() => setFeed("ok"), 800);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div>
      <ScreenHead
        kicker="Overzicht"
        titel="Goedenavond"
        sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
      />

      {/* KPI's — twee kolommen, groot en leesbaar */}
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-3"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-semibold" style={{ color: C.sub }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                style={{ ...mono, color: k.up ? C.jade : C.warn }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-1.5 text-[21px] font-extrabold tabular-nums leading-none"
              style={{ ...head, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-1.5">
              <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
            </div>
          </div>
        ))}
      </div>

      {/* Volgende-actie-blok */}
      {warn && (
        <div className="px-4 pt-4">
          <div
            className="rounded-2xl p-3.5"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
            role="alert"
          >
            <div className="flex items-start gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "#fff" }}
              >
                <AlertTriangle size={16} strokeWidth={2.4} color={C.warn} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  Volgende actie
                </p>
                <p className="mt-0.5 text-[13.5px] font-bold" style={{ color: C.ink }}>
                  {warn.titel}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                  {warn.detail}
                </p>
              </div>
            </div>
            <button
              onClick={() => onGo("verificatie")}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn }}
            >
              {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Matches — swipe-kaarten */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h2 className="text-[15px] font-extrabold" style={{ ...head, color: C.ink }}>
          Beste matches
        </h2>
        <button
          onClick={() => onGo("marktplaats")}
          className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[12px] font-bold ${RING}`}
          style={{ color: C.accent }}
        >
          Alles <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {OPDRACHTEN.map((o) => (
          <button
            key={o.id}
            onClick={() => onOpen(o.id)}
            className={`w-[220px] shrink-0 snap-start rounded-2xl p-3.5 text-left transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <MatchRing value={o.match} />
              <SwipeHint />
            </div>
            <p className="mt-2.5 truncate text-[14px] font-bold" style={{ color: C.ink }}>
              {o.titel}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
              style={{ color: C.sub }}
            >
              <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} · {o.tarief}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {o.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: C.accentSoft, color: C.accentDark }}
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Berichten — met loading-skeleton */}
      <div className="px-4 pt-5">
        <h2 className="pb-2 text-[15px] font-extrabold" style={{ ...head, color: C.ink }}>
          Berichten
        </h2>
        <div className="rounded-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          {feed === "loading" ? (
            <div className="space-y-3 p-3.5" role="status" aria-live="polite">
              <span className="sr-only">Berichten worden geladen…</span>
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 animate-pulse rounded-full"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <span
                      className="block h-3 animate-pulse rounded-full"
                      style={{ background: C.lineSoft, width: "70%" }}
                    />
                    <span
                      className="block h-2.5 animate-pulse rounded-full"
                      style={{ background: C.lineSoft, width: "90%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul>
              {BERICHTEN.slice(0, 3).map((b, i) => (
                <li
                  key={b.van}
                  className="flex items-center gap-3 p-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ ...mono, background: C.accentSoft, color: C.accentDark }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-bold" style={{ color: C.ink }}>
                        {b.van}
                      </p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.accent }}
                          aria-label="ongelezen"
                        />
                      )}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.sub }}>
                      {b.preview}
                    </p>
                  </div>
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
  const [chip, setChip] = useState("Alle");
  const chips = ["Alle", "BIG", "Avond", "GGZ", "Dagdienst"];
  const filtered = OPDRACHTEN.filter((o) => {
    const mQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const mC = chip === "Alle" || o.tags.some((t) => t.toLowerCase().includes(chip.toLowerCase()));
    return mQ && mC;
  });

  return (
    <div>
      <ScreenHead kicker="De markt" titel="Opdrachten" />

      <div className="space-y-2.5 px-4">
        <div
          className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={17} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#96a0af]"
            style={{ ...body, color: C.ink }}
          />
          <button
            aria-label="Filters"
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${RING}`}
            style={{ background: C.accentSoft }}
          >
            <SlidersHorizontal size={14} strokeWidth={2.2} color={C.accent} aria-hidden="true" />
          </button>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {chips.map((c) => {
            const on = c === chip;
            return (
              <button
                key={c}
                onClick={() => setChip(c)}
                aria-pressed={on}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                style={{
                  color: on ? "#fff" : C.sub,
                  background: on ? C.accent : C.card,
                  border: `1px solid ${on ? C.accent : C.line}`,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-4 pt-8 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={22} strokeWidth={2} color={C.faint} />
          </span>
          <p className="mt-3 text-[16px] font-extrabold" style={{ ...head, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-1 max-w-[240px] text-[12.5px]" style={{ color: C.sub }}>
            Geen opdracht past bij je zoekopdracht. Wis het filter en probeer opnieuw.
          </p>
          <button
            onClick={() => {
              setQ("");
              setChip("Alle");
            }}
            className={`mt-4 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white ${RING}`}
            style={{ background: C.accent }}
          >
            Filters wissen
          </button>
        </div>
      ) : (
        <ul className="space-y-2.5 px-4 pt-3">
          {filtered.map((o) => {
            const on = o.id === activeId;
            return (
              <li key={o.id}>
                <button
                  onClick={() => {
                    onSelect(o.id);
                    onOpen(o.id);
                  }}
                  className={`w-full rounded-2xl p-3.5 text-left transition-transform active:scale-[0.99] ${RING}`}
                  style={{
                    background: C.card,
                    border: `1px solid ${on ? C.accent : C.line}`,
                    boxShadow: on ? `0 0 0 3px ${C.accentSoft}` : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MatchRing value={o.match} size={50} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </p>
                      <p
                        className="truncate text-[14.5px] font-extrabold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className="text-[13px] font-bold tabular-nums"
                          style={{ ...mono, color: C.accent }}
                        >
                          {o.tarief}
                        </span>
                        <ChevronRight
                          size={17}
                          strokeWidth={2.4}
                          color={C.faint}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.accent }}
              >
                {opdracht.id}
              </p>
              <h1
                className="mt-1 text-[20px] font-extrabold leading-tight"
                style={{ ...head, color: C.ink }}
              >
                {opdracht.titel}
              </h1>
              <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
                {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <MatchRing value={opdracht.match} size={56} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: C.card, border: `1px solid ${C.line}`, color: C.sub }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Kerncijfers */}
        <div className="grid grid-cols-2 gap-2.5 px-4 pt-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-2xl p-3"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.faint }}
              >
                {m.l}
              </p>
              <p
                className="mt-1 text-[16px] font-extrabold tabular-nums"
                style={{ ...head, color: C.ink }}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>

        {/* Verklaarbare match */}
        <div className="px-4 pb-4 pt-4">
          <h2 className="pb-2 text-[15px] font-extrabold" style={{ ...head, color: C.ink }}>
            Waarom deze match
          </h2>
          <div
            className="rounded-2xl p-3.5"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.jade }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-2 space-y-2">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.ink }}>
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.jade}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
            <div className="my-3 h-px" style={{ background: C.lineSoft }} />
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.warn }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-2 space-y-2">
              {opdracht.redenen.min.map((r) => (
                <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.sub }}>
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.4}
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
      </div>

      {/* Sticky action-bar in duimbereik */}
      <div
        className="shrink-0 px-4 pb-4 pt-3"
        style={{
          borderTop: `1px solid ${C.line}`,
          background: C.card,
          animation: "hp-sheet 0.3s ease",
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className={`flex h-12 shrink-0 items-center justify-center rounded-2xl px-4 text-[13px] font-bold transition-colors ${RING}`}
            style={{ background: C.lineSoft, color: C.sub }}
          >
            Terug
          </button>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
            style={{ background: state === "sent" ? C.jade : C.accent }}
          >
            {state === "idle" && (
              <>
                <Send size={16} strokeWidth={2.6} aria-hidden="true" /> Reageer nu
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={16} strokeWidth={3} aria-hidden="true" /> Verstuurd
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <ScreenHead kicker="Vertrouwen" titel="Bewijsstukken" sub="Veilig en privé bewaard" />

      {/* Vertrouwens-meter */}
      <div className="px-4">
        <div
          className="rounded-2xl p-4"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold" style={{ color: C.sub }}>
                Verificatiegraad
              </p>
              <p
                className="text-[24px] font-extrabold tabular-nums"
                style={{ ...head, color: C.ink }}
              >
                {verified}/{total}
              </p>
            </div>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-[13px] font-bold tabular-nums"
              style={{ ...mono, background: C.jadeSoft, color: C.jade }}
            >
              {pct}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: C.lineSoft }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.jade }} />
          </div>
        </div>
      </div>

      {/* Verloop-waarschuwing */}
      {expiring && (
        <div className="px-4 pt-3">
          <div
            className="flex items-start gap-2.5 rounded-2xl p-3.5"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
            role="alert"
          >
            <AlertTriangle
              size={17}
              strokeWidth={2.4}
              color={C.warn}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
              </p>
              <button
                className={`mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white ${RING}`}
                style={{ background: C.warn }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lijst */}
      <ul className="space-y-2.5 px-4 pt-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <li
              key={c.naam}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.soft }}
              >
                <Icon size={19} strokeWidth={2.2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="truncate text-[11.5px]" style={{ color: C.sub }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <ScreenHead kicker="Prioriteiten" titel="Volgende acties" sub="Op volgorde van urgentie" />

      <ul className="space-y-2.5 px-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          const soft = warn ? C.warnSoft : C.accentSoft;
          return (
            <li key={a.titel}>
              <div
                className="rounded-2xl p-3.5"
                style={{ background: C.card, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold tabular-nums"
                    style={{ ...mono, background: soft, color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...mono, color }}
                    >
                      {warn ? "Waarschuwing" : "Melding"}
                    </span>
                    <p className="mt-0.5 text-[14px] font-bold" style={{ color: C.ink }}>
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug" style={{ color: C.sub }}>
                      {a.detail}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                  style={{
                    color: warn ? "#fff" : C.accent,
                    background: warn ? C.warn : C.accentSoft,
                  }}
                >
                  {a.cta} <ChevronRight size={15} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="px-4 pt-3">
        <div
          className="flex items-center gap-2.5 rounded-2xl p-3.5"
          style={{ background: C.jadeSoft, border: `1px solid ${C.jade}33` }}
        >
          <Check size={16} strokeWidth={2.6} color={C.jade} aria-hidden="true" />
          <p className="text-[12px]" style={{ color: C.sub }}>
            Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.jade,
    Openstaand: C.warn,
    Concept: C.faint,
  };
  const statusSoft: Record<string, string> = {
    Betaald: C.jadeSoft,
    Openstaand: C.warnSoft,
    Concept: C.lineSoft,
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
    <div>
      <ScreenHead
        kicker="Kassa"
        titel="Facturen"
        right={
          <button
            aria-label="Nieuwe factuur"
            className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform active:scale-95 ${RING}`}
            style={{ background: C.accent }}
          >
            <Plus size={19} strokeWidth={2.6} aria-hidden="true" />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 px-4">
        <div className="rounded-2xl p-3.5" style={{ background: C.jadeSoft }}>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.jade }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1 text-[19px] font-extrabold tabular-nums"
            style={{ ...head, color: C.jade }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="rounded-2xl p-3.5" style={{ background: C.warnSoft }}>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{ ...mono, color: C.warn }}
          >
            Openstaand
          </p>
          <p
            className="mt-1 text-[19px] font-extrabold tabular-nums"
            style={{ ...head, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 px-4 pt-3">
        {FACTUREN.map((f) => {
          const color = statusColor[f.status] ?? C.faint;
          const soft = statusSoft[f.status] ?? C.lineSoft;
          return (
            <li
              key={f.nr}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12.5px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.nr}
                </p>
                <p className="truncate text-[12px]" style={{ color: C.sub }}>
                  {f.klant} · {f.datum}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="text-[14px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ background: soft, color }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                  {f.status}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
