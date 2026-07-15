"use client";

// Concept 321 — "Mistral" · Kinetische variabele-typografie, motion-first.
// De typografie IS de interface: oversized display-koppen dragen de hiërarchie, cijfers zijn
// tabulair, en een ticker-strip houdt de status letterlijk in beweging. Voor gevoelige
// documenten en verklaarbare matching werkt dit omdat de blik meteen naar het grootste woord
// (de status / het bedrag / het match-getal) getrokken wordt — geen ruis, alleen wat telt.
// Fonts: --font-lab-anton (oversized display) + --font-lab-space (kinetische nav/subkop)
//        + --font-lab-inter (tekst) + --font-lab-mono (ticker & cijfers).

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Check,
  Plus,
  Zap,
  MapPin,
  ChevronRight,
  RefreshCw,
  WifiOff,
  Send,
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

/* ---------- Palet & typografie ---------- */

const C = {
  paper: "#f4f3ee",
  paperAlt: "#eceae2",
  card: "#ffffff",
  ink: "#0b0b0c",
  sub: "#57564f",
  faint: "#8f8d84",
  accent: "#2f5bff",
  accentDeep: "#1e3ad9",
  accentSoft: "#e6ebff",
  jade: "#0a7d52",
  jadeSoft: "#e0f2e9",
  warn: "#b45309",
  warnSoft: "#fbeed9",
  alert: "#c62828",
  alertSoft: "#fbe5e5",
  line: "#dedcd3",
  lineSoft: "#e8e6dd",
};

const display = { fontFamily: "var(--font-lab-anton), sans-serif" };
const kinetic = { fontFamily: "var(--font-lab-space), sans-serif" };
const body = { fontFamily: "var(--font-lab-inter), sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5bff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee]";

/* ---------- Status → betekenis (label + icoon + kleur) ---------- */

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

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kinetisch woord: letters schuiven gestaffeld bij hover ---------- */

function Kinetic({
  text,
  className,
  style,
  active,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  return (
    <span className={`group/kin inline-flex ${className ?? ""}`} style={style}>
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden={ch === " " ? "true" : undefined}
          className="inline-block transition-transform duration-300 ease-out group-hover/kin:-translate-y-[0.14em]"
          style={{
            transitionDelay: `${i * 22}ms`,
            transform: active ? "translateY(-0.14em)" : undefined,
            whiteSpace: "pre",
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

/* ---------- Sparkline ---------- */

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 84;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = color.replace("#", "");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
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
        <linearGradient id={`ms-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#ms-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

/* ---------- Statusbadge ---------- */

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em]"
      style={{ ...mono, color: m.color, background: m.soft }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

/* ---------- Ticker-strip (nav-accent, altijd in beweging) ---------- */

function Ticker() {
  const items = [
    ...KPIS.map((k) => `${k.label.toUpperCase()} ${k.value} ${k.trend}`),
    `MATCH ${OPDRACHTEN[0]?.match ?? 0}% · ${OPDRACHTEN[0]?.plaats ?? ""}`,
    `VERTROUWEN ${PROFIEL.trust.toUpperCase()}`,
    "VOG VERLOOPT OVER 23 DAGEN",
  ];
  const strip = [...items, ...items];
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{ borderColor: C.ink, background: C.ink }}
      aria-hidden="true"
    >
      <div
        className="flex w-max gap-8 py-1.5"
        style={{ animation: "ms-marquee 26s linear infinite" }}
      >
        {strip.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="flex shrink-0 items-center gap-8 text-[11px] font-semibold tracking-[0.14em] text-white"
            style={mono}
          >
            {t}
            <span style={{ color: C.accent }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept321() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openDetail = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, color: C.ink }}
    >
      <style>{`
        @keyframes ms-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes ms-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ms-pulse { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
      `}</style>

      <div className="mx-auto flex min-h-[680px] max-w-[1200px] flex-col">
        {/* Kop met profiel */}
        <header className="flex items-end justify-between gap-4 px-5 pb-3 pt-5 sm:px-8">
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.accent }}
            >
              ZZP · Ontwerp-lab
            </p>
            <h1
              className="mt-1 text-[26px] leading-none sm:text-[34px]"
              style={{ ...display, letterSpacing: "0.01em" }}
            >
              MISTRAL
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-bold" style={{ ...kinetic }}>
                {PROFIEL.naam}
              </p>
              <p
                className="flex items-center justify-end gap-1 text-[11px] font-semibold"
                style={{ color: C.jade }}
              >
                <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
              </p>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ ...mono, background: C.ink }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        <Ticker />

        {/* Kinetische nav — oversized type */}
        <nav
          className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b px-5 py-3 sm:gap-x-7 sm:px-8"
          style={{ borderColor: C.line }}
          aria-label="Schermen"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`relative rounded-sm text-[17px] leading-none transition-colors sm:text-[20px] ${RING}`}
                style={{
                  ...kinetic,
                  fontWeight: on ? 700 : 500,
                  color: on ? C.ink : C.faint,
                }}
              >
                <Kinetic text={s.label} active={on} />
                <span
                  className="absolute -bottom-[10px] left-0 h-[3px] rounded-full transition-all duration-300"
                  style={{ width: on ? "100%" : "0%", background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div key={screen} className="flex-1" style={{ animation: "ms-rise 0.34s ease" }}>
          {screen === "dashboard" && <Dashboard onOpen={openDetail} onGo={setScreen} />}
          {screen === "marktplaats" && <Marktplaats onOpen={openDetail} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie onGo={setScreen} />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

type FeedState = "error" | "loading" | "ok";

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  // Feed toont eerst een verbindingsfout (deterministisch), retry → laden → inhoud.
  const [feed, setFeed] = useState<FeedState>("error");

  useEffect(() => {
    if (feed !== "loading") return;
    const t = window.setTimeout(() => setFeed("ok"), 850);
    return () => window.clearTimeout(t);
  }, [feed]);

  const warn = ACTIES[0];

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        {/* Links: KPI's als oversized cijfers */}
        <section aria-labelledby="kpi-h">
          <h2
            id="kpi-h"
            className="text-[12px] font-bold uppercase tracking-[0.2em]"
            style={{ ...mono, color: C.faint }}
          >
            Deze maand in cijfers
          </h2>
          <div
            className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl"
            style={{ background: C.line }}
          >
            {KPIS.map((k) => (
              <div
                key={k.label}
                className="group p-4 transition-colors hover:bg-[#fafaf7]"
                style={{ background: C.card }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.sub }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-1 text-[38px] leading-[0.9] tracking-tight transition-all duration-300 group-hover:tracking-normal"
                  style={{ ...display, fontVariantNumeric: "tabular-nums" }}
                >
                  {k.value}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-0.5 text-[12px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.jade : C.warn }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={13} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={13} strokeWidth={3} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                  <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
                </div>
              </div>
            ))}
          </div>

          {/* Next action — groot en kinetisch */}
          {warn && (
            <div
              className="mt-6 rounded-2xl p-5"
              style={{ background: C.ink, color: "#fff" }}
              role="alert"
            >
              <div
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.accent }}
              >
                <span
                  className="inline-flex h-2 w-2 rounded-full"
                  style={{ background: C.accent, animation: "ms-pulse 1.8s ease-in-out infinite" }}
                />
                Volgende beste actie
              </div>
              <p className="mt-3 text-[26px] leading-[0.95]" style={display}>
                {warn.titel}
              </p>
              <p className="mt-2 max-w-md text-[13.5px] leading-snug" style={{ color: "#c9c8c2" }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.accent }}
              >
                <Kinetic text={warn.cta} style={kinetic} />
                <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        {/* Rechts: activiteit-feed met error/loading/empty */}
        <section aria-labelledby="feed-h" className="flex flex-col">
          <div className="flex items-center justify-between">
            <h2
              id="feed-h"
              className="text-[12px] font-bold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.faint }}
            >
              Activiteit
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-[12px] font-bold ${RING}`}
              style={{ color: C.accent }}
            >
              Naar markt <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>

          <div
            className="mt-3 flex-1 rounded-2xl border p-1"
            style={{ borderColor: C.line, background: C.card }}
          >
            {feed === "error" && (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: C.alertSoft }}
                >
                  <WifiOff size={22} strokeWidth={2.2} color={C.alert} aria-hidden="true" />
                </span>
                <p className="mt-3 text-[15px] font-bold" style={kinetic}>
                  Verbinding verbroken
                </p>
                <p className="mt-1 max-w-[220px] text-[12.5px]" style={{ color: C.sub }}>
                  De activiteit kon niet geladen worden. Probeer het opnieuw.
                </p>
                <button
                  onClick={() => setFeed("loading")}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white ${RING}`}
                  style={{ background: C.ink }}
                >
                  <RefreshCw size={14} strokeWidth={2.6} aria-hidden="true" /> Opnieuw laden
                </button>
              </div>
            )}

            {feed === "loading" && (
              <div className="space-y-2 p-3" role="status" aria-live="polite">
                <span className="sr-only">Activiteit wordt geladen…</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-2">
                    <span
                      className="h-9 w-9 shrink-0 animate-pulse rounded-full"
                      style={{ background: C.lineSoft }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <span
                        className="block h-3 animate-pulse rounded-full"
                        style={{ background: C.lineSoft, width: "72%" }}
                      />
                      <span
                        className="block h-2.5 animate-pulse rounded-full"
                        style={{ background: C.lineSoft, width: "92%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {feed === "ok" && (
              <ul>
                {BERICHTEN.map((b, i) => (
                  <li
                    key={b.van}
                    className="flex items-center gap-3 p-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[13px] font-bold" style={kinetic}>
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
                      <p className="truncate text-[12px]" style={{ color: C.sub }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Beste match — snelkaart */}
          {OPDRACHTEN[0] && (
            <button
              onClick={() => onOpen(OPDRACHTEN[0]?.id)}
              className={`mt-4 w-full rounded-2xl border p-4 text-left transition-transform active:scale-[0.99] ${RING}`}
              style={{ borderColor: C.line, background: C.card }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.faint }}
                >
                  Beste match
                </span>
                <span
                  className="text-[30px] leading-none"
                  style={{ ...display, color: C.accent, fontVariantNumeric: "tabular-nums" }}
                >
                  {OPDRACHTEN[0].match}%
                </span>
              </div>
              <p className="mt-1 text-[16px] font-bold leading-tight" style={kinetic}>
                {OPDRACHTEN[0].titel}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px]" style={{ color: C.sub }}>
                <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {OPDRACHTEN[0].plaats} ·{" "}
                {OPDRACHTEN[0].tarief}
              </p>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[34px] leading-none sm:text-[46px]" style={display}>
          MARKTPLAATS
        </h2>
        <span
          className="hidden text-[13px] font-bold tabular-nums sm:block"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      <div
        className="mt-4 flex items-center gap-2.5 rounded-full border px-4 py-2.5"
        style={{ borderColor: C.line, background: C.card }}
      >
        <Search size={17} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#8f8d84]"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          className="mt-10 flex flex-col items-center justify-center rounded-2xl border py-14 text-center"
          style={{ borderColor: C.line }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.paperAlt }}
          >
            <Search size={24} strokeWidth={2} color={C.faint} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[22px]" style={display}>
            NIETS GEVONDEN
          </p>
          <p className="mt-1 max-w-[280px] text-[13px]" style={{ color: C.sub }}>
            Geen opdracht past bij &ldquo;{q}&rdquo;. Wis je zoekopdracht en probeer opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className={`mt-4 rounded-full px-5 py-2.5 text-[13px] font-bold text-white ${RING}`}
            style={{ background: C.ink }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((o) => {
            const open = o.id === expanded;
            return (
              <li key={o.id}>
                <div
                  className="overflow-hidden rounded-2xl border transition-colors"
                  style={{ borderColor: open ? C.accent : C.line, background: C.card }}
                >
                  <button
                    onClick={() => setExpanded(open ? "" : o.id)}
                    aria-expanded={open}
                    className={`flex w-full items-center gap-4 p-4 text-left ${RING}`}
                  >
                    <span
                      className="w-[76px] shrink-0 text-[40px] tabular-nums leading-none sm:text-[52px]"
                      style={{ ...display, color: o.match >= 90 ? C.accent : C.ink }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.14em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id} · {o.opdrachtgever}
                      </p>
                      <p className="truncate text-[18px] font-bold leading-tight" style={kinetic}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} ·{" "}
                        {o.tarief} · {o.uren}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      strokeWidth={2.4}
                      color={C.faint}
                      aria-hidden="true"
                      className="shrink-0 transition-transform duration-300"
                      style={{ transform: open ? "rotate(90deg)" : "none" }}
                    />
                  </button>

                  {open && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: C.lineSoft }}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                            style={{ ...mono, color: C.jade }}
                          >
                            <Check size={13} strokeWidth={3} aria-hidden="true" /> Waarom een match
                          </p>
                          <ul className="mt-1.5 space-y-1.5">
                            {o.redenen.plus.map((r) => (
                              <li key={r} className="flex items-start gap-2 text-[13px]">
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
                        </div>
                        <div>
                          <p
                            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                            style={{ ...mono, color: C.warn }}
                          >
                            <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" />{" "}
                            Aandachtspunten
                          </p>
                          <ul className="mt-1.5 space-y-1.5">
                            {o.redenen.min.map((r) => (
                              <li
                                key={r}
                                className="flex items-start gap-2 text-[13px]"
                                style={{ color: C.sub }}
                              >
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
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ background: C.paperAlt, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                        <button
                          onClick={() => onOpen(o.id)}
                          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white ${RING}`}
                          style={{ background: C.accent }}
                        >
                          Bekijk opdracht{" "}
                          <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
    <div className="px-5 py-6 sm:px-8">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px] font-bold ${RING}`}
        style={{ color: C.accent }}
      >
        <ChevronRight size={14} strokeWidth={2.6} className="rotate-180" aria-hidden="true" /> Terug
        naar markt
      </button>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.accent }}
          >
            {opdracht.id} · {opdracht.opdrachtgever}
          </p>
          <h2 className="mt-1 text-[30px] leading-[0.95] sm:text-[40px]" style={display}>
            {opdracht.titel}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.sub }}>
            <MapPin size={14} strokeWidth={2.2} aria-hidden="true" /> {opdracht.plaats}
          </p>

          <div
            className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
            style={{ background: C.line }}
          >
            {[
              { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
              { l: "Omvang", v: opdracht.uren.replace(" u/week", " u/w") },
              { l: "Start", v: opdracht.start.replace("Per ", "") },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div key={m.l} className="p-3.5" style={{ background: C.card }}>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[22px] tabular-nums leading-none" style={display}>
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-6 rounded-2xl border p-5"
            style={{ borderColor: C.line, background: C.card }}
          >
            <h3
              className="text-[13px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.ink }}
            >
              Waarom deze match
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.jade }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13.5px]">
                      <Check
                        size={16}
                        strokeWidth={2.6}
                        color={C.jade}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13.5px]"
                      style={{ color: C.sub }}
                    >
                      <AlertTriangle
                        size={16}
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
        </div>

        {/* Rechts: compliance + reageren */}
        <aside className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: C.ink, color: "#fff" }}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.accent }}
            >
              Compliance-eis
            </p>
            <p className="mt-2 text-[15px] font-bold leading-snug" style={kinetic}>
              BIG-registratie geverifieerd vereist
            </p>
            <div
              className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <BadgeCheck size={18} strokeWidth={2.4} color={C.jade} aria-hidden="true" />
              <span className="text-[13px] font-semibold">
                Jouw BIG-registratie is geverifieerd
              </span>
            </div>
          </div>

          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.99] disabled:opacity-90 ${RING}`}
            style={{ background: state === "sent" ? C.jade : C.accent }}
          >
            {state === "idle" && (
              <>
                <Send size={16} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Reactie versturen…"}
            {state === "sent" && (
              <>
                <Check size={16} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
          <p className="text-center text-[12px]" style={{ color: C.faint }}>
            Gemiddelde reactietijd opdrachtgever: 6 uur.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div className="px-5 py-6 sm:px-8">
      <h2 className="text-[34px] leading-none sm:text-[46px]" style={display}>
        VERIFICATIE
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl p-5" style={{ background: C.ink, color: "#fff" }}>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ ...mono, color: C.accent }}
          >
            Vertrouwensniveau
          </p>
          <p className="mt-2 text-[56px] tabular-nums leading-none" style={display}>
            {pct}%
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#c9c8c2" }}>
            {verified} van {total} bewijsstukken geverifieerd
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: C.accent }}
            />
          </div>
        </div>

        {expiring && (
          <div
            className="flex flex-col justify-center rounded-2xl border-2 p-5"
            style={{ borderColor: C.warn, background: C.warnSoft }}
            role="alert"
          >
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.warn }}
            >
              <AlertTriangle size={14} strokeWidth={2.6} aria-hidden="true" /> Verloop-waarschuwing
            </p>
            <p className="mt-2 text-[20px] font-bold leading-tight" style={kinetic}>
              {expiring.naam} verloopt binnenkort
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
              {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven voor opdrachtgevers.
            </p>
            <button
              onClick={() => onGo("acties")}
              className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold text-white ${RING}`}
              style={{ background: C.warn }}
            >
              <Zap size={14} strokeWidth={2.6} aria-hidden="true" /> Herstelactie starten
            </button>
          </div>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <li
              key={c.naam}
              className="flex items-center gap-4 rounded-2xl border p-4"
              style={{ borderColor: C.line, background: C.card }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.soft }}
              >
                <Icon size={21} strokeWidth={2.2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold" style={kinetic}>
                  {c.naam}
                </p>
                <p className="truncate text-[12.5px]" style={{ color: C.sub }}>
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
    <div className="px-5 py-6 sm:px-8">
      <h2 className="text-[34px] leading-none sm:text-[46px]" style={display}>
        ACTIES
      </h2>
      <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
        Op volgorde van urgentie — begin bovenaan.
      </p>

      <ul className="mt-5 space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.warn : C.accent;
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-2xl border p-4"
              style={{ borderColor: C.line, background: C.card }}
            >
              <span
                className="w-[52px] shrink-0 text-[40px] tabular-nums leading-none"
                style={{ ...display, color: C.faint }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color }}
                >
                  {warn ? (
                    <AlertTriangle size={11} strokeWidth={2.8} aria-hidden="true" />
                  ) : (
                    <Zap size={11} strokeWidth={2.8} aria-hidden="true" />
                  )}
                  {warn ? "Waarschuwing" : "Kans"}
                </span>
                <p className="mt-1 text-[17px] font-bold leading-tight" style={kinetic}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`shrink-0 self-center rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors ${RING}`}
                style={{
                  background: warn ? C.warn : C.accentSoft,
                  color: warn ? "#fff" : C.accentDeep,
                }}
              >
                {a.cta}
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-4 flex items-center gap-2.5 rounded-2xl p-4"
        style={{ background: C.jadeSoft }}
      >
        <Check size={16} strokeWidth={2.6} color={C.jade} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.sub }}>
          Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const tone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.jade, bg: C.jadeSoft },
    Openstaand: { fg: C.warn, bg: C.warnSoft },
    Concept: { fg: C.faint, bg: C.lineSoft },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[34px] leading-none sm:text-[46px]" style={display}>
          FACTUREN
        </h2>
        <button
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold text-white ${RING}`}
          style={{ background: C.accent }}
        >
          <Plus size={15} strokeWidth={2.8} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={{ background: C.jadeSoft }}>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.jade }}
          >
            Ontvangen
          </p>
          <p
            className="mt-1 text-[34px] tabular-nums leading-none"
            style={{ ...display, color: C.jade }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: C.warnSoft }}>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.warn }}
          >
            Openstaand
          </p>
          <p
            className="mt-1 text-[34px] tabular-nums leading-none"
            style={{ ...display, color: C.warn }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden rounded-2xl border"
        style={{ borderColor: C.line, background: C.card }}
      >
        <table className="w-full text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr
              className="border-b text-[10px] uppercase tracking-[0.12em]"
              style={{ borderColor: C.line, color: C.faint, ...mono }}
            >
              <th scope="col" className="px-4 py-2.5 font-bold">
                Nummer
              </th>
              <th scope="col" className="px-4 py-2.5 font-bold">
                Klant
              </th>
              <th scope="col" className="hidden px-4 py-2.5 font-bold sm:table-cell">
                Datum
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">
                Bedrag
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = tone[f.status] ?? { fg: C.faint, bg: C.lineSoft };
              return (
                <tr
                  key={f.nr}
                  className="border-b transition-colors last:border-0 hover:bg-[#fafaf7]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <td
                    className="px-4 py-3 text-[12.5px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] font-semibold" style={kinetic}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden px-4 py-3 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.sub }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[14px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...mono, color: t.fg, background: t.bg }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: t.fg }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
