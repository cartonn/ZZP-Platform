"use client";

// Concept 150 — "Manifest" · constructivistische avant-garde poster. Bold diagonale composities
// (schuine assen, geroteerde blokken), rood/zwart/crème, zware grotesk-typografie, propaganda-
// poster-energie maar strak en functioneel voor SaaS. Sterke diagonalen structureren de layout;
// data staat in geroteerde/diagonale banners — maar tekst blijft ALTIJD binnen zijn container en
// leesbaar (upright in parallelogram-clips, rotaties subtiel). Onderscheidend van bauhaus (primair-
// geometrisch orthogonaal), deco (symmetrie) en memphis: dit is CONSTRUCTIVISME met diagonale
// dynamiek. Status nooit kleur-alleen: altijd label + icoon + vulpatroon. Deterministisch — geen
// random/Date. Fonts: Bricolage Grotesque + Space Grotesk (display) + JetBrains Mono (data).

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  ShieldCheck,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  Zap,
  FileText,
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

// ── Palet — constructivistisch: rood, zwart, crème ───────────────────────────────
const C = {
  red: "#d81e2c",
  redDeep: "#b0141f",
  ink: "#111111",
  inkSoft: "#4a453d",
  inkFaint: "#7a7266",
  cream: "#efe9dd",
  creamDeep: "#e4ddcc",
  paper: "#f6f2e9",
  line: "#111111",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const grotesk = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Harde offset-schaduw (poster-print-gevoel).
const hardShadow = { boxShadow: `6px 6px 0 ${C.ink}` };
const hardShadowSm = { boxShadow: `4px 4px 0 ${C.ink}` };
const hardShadowRed = { boxShadow: `6px 6px 0 ${C.red}` };

// Parallelogram-clip voor diagonale banners (tekst blijft upright & leesbaar).
const slantRight = "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)";

// ── Status-model — nooit kleur-alleen (vulpatroon + icoon + label) ───────────────
type StatusStyle = { label: string; Icon: LucideIcon; bg: string; fg: string; border: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, bg: C.ink, fg: C.cream, border: C.ink };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, bg: C.cream, fg: C.ink, border: C.ink };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        bg: C.red,
        fg: C.white,
        border: C.red,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, bg: C.white, fg: C.red, border: C.red };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
      style={{ ...mono, background: m.bg, color: m.fg, border: `2px solid ${m.border}` }}
    >
      <m.Icon size={12} strokeWidth={2.8} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Diagonale sectiebanner — rood parallelogram met upright, contained tekst.
function Banner({
  index,
  children,
  tone = "red",
}: {
  index: string;
  children: React.ReactNode;
  tone?: "red" | "ink";
}) {
  const bg = tone === "red" ? C.red : C.ink;
  return (
    <div className="flex items-stretch gap-0" style={hardShadowSm}>
      <span
        className="flex items-center justify-center px-3 py-2 text-[13px] font-bold tabular-nums text-white"
        style={{ ...mono, background: C.ink, clipPath: slantRight }}
        aria-hidden="true"
      >
        {index}
      </span>
      <h2
        className="flex-1 px-4 py-2 text-[15px] font-bold uppercase tracking-[0.04em] text-white"
        style={{ ...grotesk, background: bg, marginLeft: "-10px", clipPath: slantRight }}
      >
        {children}
      </h2>
    </div>
  );
}

// Sharp-cornered "slab" kaart met dikke rand + harde schaduw.
function Slab({
  children,
  className = "",
  bg = C.paper,
  shadow = hardShadow,
  interactive = false,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: React.CSSProperties;
  interactive?: boolean;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative ${interactive ? "transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5" : ""} ${className}`}
      style={{ background: bg, border: `2.5px solid ${C.ink}`, ...shadow }}
    >
      {children}
    </Tag>
  );
}

// Mini staaf-diagram (constructivistische balken).
function Bars({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? tone : C.ink,
          }}
        />
      ))}
    </div>
  );
}

function matchTone(m: number): string {
  return m >= 88 ? C.ink : C.red;
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept150() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...grotesk,
        background: C.cream,
        color: C.ink,
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(17,17,17,0.035) 0 1px, transparent 1px 22px)",
      }}
    >
      {/* Kop — geroteerde blokken, diagonale energie */}
      <header
        className="relative overflow-hidden px-4 pb-6 pt-5 md:px-8"
        style={{ borderBottom: `3px solid ${C.ink}` }}
      >
        {/* Decoratief diagonaal rood blok (achter titel, tekstvrij) */}
        <span
          className="pointer-events-none absolute -right-16 -top-10 hidden h-40 w-72 rotate-[-8deg] md:block"
          style={{ background: C.red, opacity: 0.14 }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 rotate-[-6deg] items-center justify-center text-white"
              style={{ background: C.red, ...hardShadowSm }}
              aria-hidden="true"
            >
              <Zap size={22} strokeWidth={2.6} />
            </span>
            <div className="leading-none">
              <div
                className="text-[22px] font-extrabold uppercase tracking-[-0.02em]"
                style={display}
              >
                ZZP&nbsp;Manifest
              </div>
              <div
                className="mt-1 inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                style={{ ...mono, background: C.ink }}
              >
                Werk · Verificatie · Omzet
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-white sm:inline-flex"
              style={{ ...mono, background: C.ink }}
            >
              <ShieldCheck size={13} strokeWidth={2.8} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-11 w-11 rotate-[4deg] items-center justify-center text-[13px] font-extrabold text-white"
              style={{ ...display, background: C.ink, ...hardShadowRed }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
      </header>

      {/* Scherm-switcher — constructivistische blok-tabs */}
      <nav
        className="flex items-center gap-0 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ borderBottom: `2px solid ${C.ink}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={
                on
                  ? {
                      ...mono,
                      color: C.white,
                      background: C.red,
                      border: `2px solid ${C.ink}`,
                      marginLeft: i === 0 ? 0 : -2,
                      ["--tw-ring-color" as string]: C.ink,
                    }
                  : {
                      ...mono,
                      color: C.ink,
                      background: C.paper,
                      border: `2px solid ${C.ink}`,
                      marginLeft: i === 0 ? 0 : -2,
                      ["--tw-ring-color" as string]: C.red,
                    }
              }
            >
              {String(i + 1).padStart(2, "0")} {s.label}
            </button>
          );
        })}
      </nav>

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
    <div className="space-y-6">
      {/* Poster-hero */}
      <Slab bg={C.red} className="overflow-hidden">
        <div className="relative p-6 text-white sm:p-8">
          <span
            className="pointer-events-none absolute -bottom-8 -right-6 hidden h-44 w-44 rotate-45 sm:block"
            style={{ background: "rgba(255,255,255,0.10)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <span
              className="inline-block px-2 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-700"
              style={{ ...mono, background: C.white }}
            >
              Bulletin · {PROFIEL.rol}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[30px] font-extrabold uppercase leading-[0.98] tracking-[-0.02em] sm:text-[40px]"
              style={display}
            >
              Drie matches boven 85%. De omzet stijgt.
            </h1>
            <p className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed opacity-95">
              Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf
              verifieerbaar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{ ...mono, background: C.ink, color: C.white, ...hardShadowSm }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.white,
                  color: C.ink,
                  boxShadow: `4px 4px 0 ${C.ink}`,
                }}
              >
                <AlertTriangle size={15} strokeWidth={2.8} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
        </div>
      </Slab>

      {/* KPI-slabs */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Slab key={k.label} interactive shadow={hardShadowSm} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkSoft }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ ...mono, background: k.up ? C.ink : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowRight size={11} className="rotate-90" aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[27px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Bars data={k.spark} tone={C.red} />
            </div>
          </Slab>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Banner index="A">Aanbevolen matches</Banner>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Slab key={o.id} interactive shadow={hardShadowSm} className="overflow-hidden">
                <button
                  onClick={onOpen}
                  className="flex w-full items-stretch text-left focus-visible:outline-none"
                >
                  <span
                    className="flex w-16 shrink-0 flex-col items-center justify-center text-white"
                    style={{ background: matchTone(o.match) }}
                    aria-hidden="true"
                  >
                    <span className="text-[20px] font-extrabold leading-none" style={display}>
                      {o.match}
                    </span>
                    <span
                      className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={mono}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-extrabold uppercase tracking-[-0.01em]"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px] font-medium"
                          style={{ color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ArrowRight
                        size={18}
                        className="mt-1 shrink-0"
                        style={{ color: C.red }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em]"
                          style={{
                            ...mono,
                            background: C.creamDeep,
                            color: C.ink,
                            border: `1.5px solid ${C.ink}`,
                          }}
                        >
                          <Check size={11} strokeWidth={3} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Slab>
            ))}
          </div>
        </div>

        {/* Rechterkolom: dekking + aandacht */}
        <div className="space-y-4">
          <Banner index="B" tone="ink">
            Status
          </Banner>
          <Slab shadow={hardShadowSm} className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[52px] font-extrabold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[22px]">%</span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px] font-medium" style={{ color: C.inkSoft }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            {/* Constructivistische voortgangsbalk */}
            <div
              className="mt-3 h-3 w-full"
              style={{ background: C.creamDeep, border: `2px solid ${C.ink}` }}
              aria-hidden="true"
            >
              <div className="h-full" style={{ width: `${dek}%`, background: C.red }} />
            </div>
          </Slab>

          <Slab bg={C.ink} shadow={hardShadowRed} className="overflow-hidden p-5 text-white">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.red }}
            >
              <AlertTriangle size={12} strokeWidth={2.8} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[17px] font-extrabold uppercase leading-tight tracking-[-0.01em]"
              style={display}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed opacity-90">
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              style={{ ...mono, background: C.red, color: C.white }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Slab>
        </div>
      </div>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Banner index="01">Marktplaats · open opdrachten</Banner>
        <Slab shadow={hardShadowSm} className="flex items-center gap-2 px-3 py-1.5">
          <Search size={16} style={{ color: C.inkFaint }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ZOEK…"
            aria-label="Opdrachten zoeken"
            className="w-40 bg-transparent py-1 text-[12px] font-bold uppercase tracking-[0.06em] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </Slab>
      </div>

      {filtered.length === 0 ? (
        <Slab className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 rotate-[-6deg] items-center justify-center text-white"
            style={{ background: C.red }}
            aria-hidden="true"
          >
            <Search size={24} />
          </span>
          <p className="text-[18px] font-extrabold uppercase" style={display}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...mono, background: C.ink, ["--tw-ring-color" as string]: C.red }}
          >
            Zoekterm wissen
          </button>
        </Slab>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Slab key={o.id} interactive shadow={hardShadowSm} className="flex flex-col">
              <div className="flex items-stretch">
                <span
                  className="flex w-14 shrink-0 flex-col items-center justify-center text-white"
                  style={{ background: matchTone(o.match) }}
                  aria-hidden="true"
                >
                  <span className="text-[17px] font-extrabold leading-none" style={display}>
                    {o.match}
                  </span>
                  <span className="text-[8px] font-bold uppercase" style={mono}>
                    match
                  </span>
                </span>
                <div className="min-w-0 flex-1 border-l-[2.5px] p-4" style={{ borderColor: C.ink }}>
                  <h3
                    className="text-[16px] font-extrabold uppercase leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-1 text-[12px] font-medium" style={{ color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="border-t-[2.5px] p-4" style={{ borderColor: C.ink }}>
                <dl className="grid grid-cols-2 gap-y-2 text-[12px] font-medium">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]"
                      style={{
                        ...mono,
                        background: C.creamDeep,
                        color: C.ink,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 border-t-[2.5px] py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#b0141f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
                style={{ ...mono, background: C.red, borderColor: C.ink }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Slab>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.4} style={{ color: C.red }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors hover:bg-[#e4ddcc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          color: C.ink,
          border: `2px solid ${C.ink}`,
          ["--tw-ring-color" as string]: C.red,
        }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <Slab bg={C.ink} className="overflow-hidden p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="inline-block px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, background: C.red, color: C.white }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-extrabold uppercase leading-[1.0] tracking-[-0.02em] sm:text-[38px]"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px] font-medium opacity-90">
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center px-4"
            style={{ borderLeft: `3px solid ${C.red}` }}
          >
            <span className="text-[52px] font-extrabold leading-none" style={display}>
              {opdracht.match}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={mono}>
              % match
            </span>
          </div>
        </div>
      </Slab>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Slab key={f.l} interactive shadow={hardShadowSm} className="p-4">
            <f.Icon size={16} strokeWidth={2.6} style={{ color: C.red }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[17px] font-extrabold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkSoft }}
            >
              {f.l}
            </div>
          </Slab>
        ))}
      </div>

      {/* Verklaarbare matching */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Banner index="+" tone="ink">
            Waarom dit past
          </Banner>
          <Slab shadow={hardShadowSm} className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-white"
                    style={{ background: C.ink }}
                    aria-hidden="true"
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Slab>
        </div>
        <div className="space-y-4">
          <Banner index="!">Om te overwegen</Banner>
          <Slab shadow={hardShadowSm} className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-white"
                    style={{ background: C.red }}
                    aria-hidden="true"
                  >
                    <AlertTriangle size={12} strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Slab>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.red,
            ...hardShadow,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.paper,
            color: C.ink,
            border: `2.5px solid ${C.ink}`,
            ...hardShadowSm,
            ["--tw-ring-color" as string]: C.red,
          }}
        >
          <Star size={15} strokeWidth={2.6} aria-hidden="true" /> Bewaar
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Banner index="04">Verificatie &amp; certificaten</Banner>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.ink,
            ...hardShadowSm,
            ["--tw-ring-color" as string]: C.red,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Slab bg={C.red} className="flex flex-wrap items-center justify-between gap-4 p-6 text-white">
        <div className="flex items-center gap-5">
          <div
            className="text-[56px] font-extrabold leading-none tracking-[-0.03em]"
            style={display}
          >
            {dek}
            <span className="text-[24px]">%</span>
          </div>
          <div className="max-w-xs">
            <div className="text-[16px] font-extrabold uppercase" style={display}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[12.5px] font-medium leading-snug opacity-95">
              Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking = meer
              vertrouwen.
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em]"
          style={{ ...mono, background: C.white, color: C.ink }}
        >
          <ShieldCheck size={14} strokeWidth={2.8} aria-hidden="true" /> {PROFIEL.trust}
        </span>
      </Slab>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Slab key={c.naam} interactive shadow={hardShadowSm} className="flex items-stretch">
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg, borderRight: `2.5px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.6} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[15px] font-extrabold uppercase tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px] font-medium" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#b0141f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{ ...mono, background: C.red }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw indienen"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Slab>
          );
        })}
      </div>
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
      <div>
        <Banner index="05">Volgende beste acties</Banner>
        <p className="mt-2 px-1 text-[13px] font-medium" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>
      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Slab
                interactive
                shadow={hardShadowSm}
                bg={warn ? C.ink : C.paper}
                className="flex items-stretch overflow-hidden"
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[30px] font-extrabold text-white"
                  style={{ ...display, background: warn ? C.red : C.ink }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
                      style={{ ...mono, background: warn ? C.red : C.inkSoft }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} strokeWidth={3} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={3} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-extrabold uppercase tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.white : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] font-medium leading-relaxed"
                    style={{ color: warn ? "rgba(255,255,255,0.85)" : C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.red,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.white,
                          }
                        : {
                            ...mono,
                            background: C.ink,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.red,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Slab>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, bg: C.ink, fg: C.cream, border: C.ink };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, bg: C.red, fg: C.white, border: C.red };
    return { label: "Concept", Icon: FileText, bg: C.cream, fg: C.ink, border: C.ink };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Banner index="06">Facturen</Banner>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.red,
            ...hardShadowSm,
            ["--tw-ring-color" as string]: C.ink,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, bg: C.ink, fg: C.cream },
          { l: "Openstaand", v: `${open}`, bg: C.red, fg: C.white },
          { l: "Te factureren", v: "€ 1.350", bg: C.paper, fg: C.ink },
        ].map((s) => (
          <Slab key={s.l} interactive shadow={hardShadowSm} bg={s.bg} className="p-4">
            <div
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...mono, color: s.fg, opacity: 0.85 }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-extrabold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Slab>
        ))}
      </div>

      <Slab className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#e4ddcc]"
                style={{ borderTop: i === 0 ? "none" : `2px solid ${C.ink}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: m.bg, border: `2px solid ${m.border}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.6} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14px] font-extrabold uppercase tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: C.inkSoft }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    ...mono,
                    background: m.bg,
                    color: m.fg,
                    border: `2px solid ${m.border}`,
                  }}
                >
                  <m.Icon size={12} strokeWidth={2.8} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[16px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4 text-white"
          style={{ background: C.ink, borderTop: `2.5px solid ${C.ink}` }}
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.12em]" style={mono}>
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-extrabold tabular-nums"
            style={{ ...display, color: C.red }}
          >
            {betaald}
          </span>
        </div>
      </Slab>
    </div>
  );
}
