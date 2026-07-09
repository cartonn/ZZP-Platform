"use client";

// Concept 208 — "Parelmoer" · nacre / iriserende folie op ultra-clean wit (holographic-foil-trend 2026, licht
// & premium). Zachte parelmoer-verlopen (mint → lila → perzik) glanzen alleen op sleutelelementen: de actieve
// tab, de match-ring, de primaire knop. De rest is smetteloos wit met haarfijne randen, zodat het chic blijft
// i.p.v. Y2K-kitsch. Onderscheidt zich bewust van hologram/chroom/spectraal (donker/neon): dit is zacht
// parelmoer op wit, elegant en modern. Het iriserende is NOOIT de enige statusdrager — status altijd via
// label + icoon + vorm. Deterministisch (geen random/Date). UI Nederlands. Fonts: Bricolage Grotesque
// (display), Plus Jakarta Sans (tekst), Geist Mono (cijfers).

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
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BadgeCheck,
  Sparkles,
  Gem,
  Layers,
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

// ── Palet — smetteloos wit als basis, inkt-antraciet tekst, zachte parelmoer-tinten (mint/lila/perzik) alleen
//    als iriserend accent. Neutraal accent (indigo) draagt de functionele betekenis, folie is glans. ──
const C = {
  bg: "#f7f7fb", // koel-wit
  bgHi: "#fdfdff",
  panel: "#ffffff", // smetteloos wit
  panelHi: "#f5f5fa", // hover / gevuld neutraal
  line: "#e7e7f0", // haarfijne rand
  lineSoft: "#eeeef5",
  ink: "#161623", // antraciet-inkt
  inkSoft: "#54546a", // secundair
  inkFaint: "#9192a6", // labels
  accent: "#5b53d6", // functioneel accent (indigo)
  accentHi: "#7b74ee",
  accentDeep: "#3d3699",
  onAccent: "#ffffff",
  // parelmoer-tinten (glans, geen betekenis)
  mint: "#bff0e0",
  lila: "#dcd2f7",
  perzik: "#ffe0d2",
  hemel: "#d3e6ff",
  // status
  ok: "#2f9469",
  okBg: "#e4f5ec",
  wait: "#5b53d6",
  waitBg: "#ebe9fb",
  warn: "#b0761b",
  warnBg: "#f8eed6",
  bad: "#cf4a44",
  badBg: "#fbe6e4",
};

// Zachte parelmoer-gradient — mint → lila → perzik → hemel. Herbruikbaar als glans-laag of gevuld vlak.
const nacre = `linear-gradient(115deg, ${C.mint} 0%, ${C.hemel} 26%, ${C.lila} 52%, ${C.perzik} 78%, ${C.mint} 100%)`;
const nacreConic = `conic-gradient(from 210deg at 50% 50%, ${C.perzik}, ${C.lila}, ${C.hemel}, ${C.mint}, ${C.perzik})`;

const display = { fontFamily: "var(--font-lab-bricolage)" };
const bodyF = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

// ── Status-model — vorm draagt mee: gevuld / omlijnd / streep / dubbel. Nooit alleen kleur. ──
type Variant = "solid" | "outline" | "dashed" | "double";
type StatusStyle = {
  label: string;
  Icon: LucideIcon;
  fg: string;
  bg: string;
  border: string;
  variant: Variant;
};
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.ok,
        bg: C.okBg,
        border: C.ok,
        variant: "solid",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.wait,
        bg: C.waitBg,
        border: C.wait,
        variant: "outline",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnBg,
        border: C.warn,
        variant: "dashed",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.bad,
        bg: C.badBg,
        border: C.bad,
        variant: "double",
      };
  }
}

function borderFor(m: StatusStyle): React.CSSProperties {
  if (m.variant === "dashed") return { border: `1.5px dashed ${m.border}` };
  if (m.variant === "double") return { border: `2.5px double ${m.border}` };
  return { border: `1px solid ${m.border}` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Kaart — smetteloos wit met haarfijne rand en zachte schaduw. Bij hover verschijnt een dunne iriserende
//    glans-lijn bovenaan (folie-reflectie). Content blijft altijd op wit voor maximaal contrast. ──
function Card({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`group/card relative overflow-hidden rounded-2xl ${
        interactive ? "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: C.panel,
        boxShadow: `inset 0 0 0 1px ${C.line}, 0 12px 30px -22px rgba(30,30,60,0.28)`,
        ...style,
      }}
    >
      {interactive && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: nacre }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// Iriserende rand-wikkel — dun parelmoer-frame rond een wit binnenvlak. Voor sleutelelementen (hero, prioriteit).
function NacreFrame({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-[1.5px] ${className}`}
      style={{ background: nacre, ...style }}
    >
      <div className="relative overflow-hidden rounded-[15px]" style={{ background: C.panel }}>
        {children}
      </div>
    </div>
  );
}

function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl p-[1.5px]"
        style={{ background: nacre }}
        aria-hidden="true"
      >
        <span
          className="flex h-full w-full items-center justify-center rounded-[9px]"
          style={{ background: C.panel }}
        >
          <Icon size={16} strokeWidth={2} style={{ color: C.accent }} />
        </span>
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-semibold leading-none tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-[2px] flex-1 rounded-full sm:block"
        style={{ background: nacre, opacity: 0.7 }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — parelmoer-boog op koele rest, wit hart, mono-cijfer. Het iriserende deel toont de voortgang;
// het cijfer erbij draagt de waarde toegankelijk (nooit kleur/glans alleen).
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.perzik} 0deg, ${C.lila} ${deg * 0.5}deg, ${C.hemel} ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.panel }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.accent }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — koele staven, laatste staaf iriserend.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? undefined : C.waitBg,
            backgroundImage: i === data.length - 1 ? nacre : undefined,
          }}
        />
      ))}
    </div>
  );
}

// Iriserende chip-label — puur decoratief studie-merk in mono, parelmoer-frame.
function Shimmer({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full p-[1px]"
      style={{ background: nacre }}
    >
      <span
        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...mono, color: C.inkSoft }}
      >
        {children}
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept208() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Zachte parelmoer-schijn hoog in beeld — heel licht, houdt de basis wit en chic. Decoratief. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[52vh]"
        style={{
          background: nacreConic,
          opacity: 0.1,
          maskImage: "radial-gradient(80% 100% at 50% 0%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(80% 100% at 50% 0%, black, transparent 72%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Masthead */}
        <header className="relative" style={{ background: C.bgHi }}>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
            style={{ background: nacre, opacity: 0.85 }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl p-[1.5px]"
                style={{ background: nacre }}
                aria-hidden="true"
              >
                <span
                  className="flex h-full w-full items-center justify-center rounded-[13px]"
                  style={{ background: C.panel }}
                >
                  <Gem size={19} strokeWidth={2} style={{ color: C.accent }} />
                </span>
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.accent }}
                >
                  Parelmoer
                </div>
                <div
                  className="text-[24px] font-semibold leading-none tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  Nacre
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Glans · Helder · Verificatie
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}33`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-full p-[1.5px]"
                style={{ background: nacre }}
                aria-hidden="true"
              >
                <span
                  className="flex h-full w-full items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ ...mono, background: C.panel, color: C.accent }}
                >
                  {PROFIEL.initialen}
                </span>
              </span>
            </div>
          </div>

          {/* Scherm-switcher — actieve tab krijgt parelmoer-frame */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              if (on) {
                return (
                  <span
                    key={s.key}
                    className="shrink-0 rounded-full p-[1.5px]"
                    style={{ background: nacre }}
                  >
                    <button
                      onClick={() => setScreen(s.key)}
                      aria-current="page"
                      className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...bodyF,
                        background: C.panel,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.bgHi,
                      }}
                    >
                      {s.label}
                    </button>
                  </span>
                );
              }
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    ...bodyF,
                    background: C.panel,
                    color: C.inkSoft,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                    ["--tw-ring-color" as string]: C.accent,
                    ["--tw-ring-offset-color" as string]: C.bgHi,
                  }}
                >
                  {s.label}
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Sparkles size={12} aria-hidden="true" /> Parelmoer glanst alleen op wat telt — de basis
            blijft wit, de betekenis draagt altijd label en icoon.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Primaire (iriserende) knop — parelmoer-vulling met donkere inkt-tekst voor contrast. ──
function NacreButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className}`}
      style={{
        ...bodyF,
        backgroundImage: nacre,
        color: C.ink,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.5)`,
        ["--tw-ring-color" as string]: C.accent,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
    >
      {children}
    </button>
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
      {/* Hero — parelmoer-frame rond wit binnenvlak */}
      <NacreFrame>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: nacreConic, opacity: 0.08 }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.waitBg,
                color: C.accent,
                boxShadow: `inset 0 0 0 1px ${C.accent}33`,
              }}
            >
              <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <Shimmer>glans · 01</Shimmer>
          </div>
          <h1
            className="mt-4 text-[32px] font-semibold leading-[1.05] tracking-tight sm:text-[44px]"
            style={{ ...display, color: C.ink }}
          >
            Drie sterke matches, in helder parelmoer.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén ding glanst met aandacht: je VOG verloopt binnenkort. Regel het en houd je profiel
            smetteloos in beeld.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NacreButton onClick={onOpen}>
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </NacreButton>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.panelHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.accent,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </NacreFrame>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.ok + "33" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Layers}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Card key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.accent }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[16px] font-semibold tracking-tight"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[12.5px]"
                          style={{ ...bodyF, color: C.inkSoft }}
                        >
                          {o.opdrachtgever} · {o.plaats} · {o.tarief}
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5 shrink-0"
                        style={{ color: C.inkFaint }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            ...bodyF,
                            background: C.panelHi,
                            color: C.inkSoft,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }}
                        >
                          <Check
                            size={11}
                            strokeWidth={2.6}
                            style={{ color: C.ok }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.ok} 0deg, ${C.ok} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.panel }}
                >
                  <span
                    className="text-[26px] font-semibold tabular-nums leading-none"
                    style={{ ...mono, color: C.ok }}
                  >
                    {dek}
                    <span className="text-[13px]" style={{ color: C.inkFaint }}>
                      %
                    </span>
                  </span>
                </span>
              </span>
              <div>
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Card>

          {/* Prioriteit — parelmoer-frame */}
          <NacreFrame>
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: nacreConic, opacity: 0.1 }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{
                  ...mono,
                  background: C.warnBg,
                  color: C.warn,
                  boxShadow: `inset 0 0 0 1px ${C.warn}44`,
                }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Vraagt aandacht
              </span>
              <h3
                className="mt-2.5 text-[20px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <NacreButton onClick={onActies} className="mt-4">
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </NacreButton>
            </div>
          </NacreFrame>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek-empty-state, skeleton-loading én foutstrook ─────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(true);

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Marktplaats" sub="Open opdrachten, helder gerangschikt" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.accent }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12.5px] outline-none placeholder:opacity-50"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.accent,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.accent }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          role="alert"
          style={{ background: C.badBg, border: `1.5px dashed ${C.bad}` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[15px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              Sommige matches konden niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        // Skeleton-loading
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.lineSoft }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.lineSoft }}
                />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="relative flex h-16 w-16 items-center justify-center rounded-full p-[1.5px]"
            style={{ background: nacre }}
            aria-hidden="true"
          >
            <span
              className="flex h-full w-full items-center justify-center rounded-full"
              style={{ background: C.panel }}
            >
              <Search size={28} strokeWidth={1.6} style={{ color: C.accent }} />
            </span>
          </span>
          <p
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen match gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en de lijst vult zich
            opnieuw.
          </p>
          <NacreButton onClick={() => setQ("")} className="mt-1">
            Zoekterm wissen
          </NacreButton>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} interactive className="flex flex-col">
              <div className="h-1 w-full" style={{ background: nacre }} aria-hidden="true" />
              <div className="relative flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
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
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.accent,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Card>
          ))}
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
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <NacreFrame>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: nacreConic, opacity: 0.08 }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.waitBg,
                  color: C.accent,
                  boxShadow: `inset 0 0 0 1px ${C.accent}33`,
                }}
              >
                {opdracht.id}
              </span>
              <Shimmer>zorg · match</Shimmer>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </NacreFrame>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <span
              className="relative flex h-8 w-8 items-center justify-center rounded-xl p-[1.5px]"
              style={{ background: nacre }}
              aria-hidden="true"
            >
              <span
                className="flex h-full w-full items-center justify-center rounded-[9px]"
                style={{ background: C.panel }}
              >
                <f.Icon size={15} strokeWidth={2} style={{ color: C.accent }} />
              </span>
            </span>
            <div
              className="mt-3 text-[17px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Card className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}44` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <NacreButton className="flex-1 justify-center py-3.5">
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </NacreButton>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.accent }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten &amp; documenten" Icon={ShieldCheck} />
        <NacreButton>
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </NacreButton>
      </div>

      <NacreFrame>
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: nacreConic, opacity: 0.07 }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.ok} 0deg, ${C.ok} ${dek * 3.6}deg, ${C.lineSoft} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.panel }}
            >
              <span
                className="text-[30px] font-semibold tabular-nums leading-none"
                style={{ ...mono, color: C.ok }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[20px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat laat je profiel helderder glanzen. Houd je dekking hoog,
              dan blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}33`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </NacreFrame>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: m.bg, ...borderFor(m) }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.accent,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
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
            </Card>
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
      <SectionHead
        title="Volgende beste acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Sparkles}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn ? C.warn : undefined,
                    backgroundImage: warn ? undefined : nacre,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={
                      warn
                        ? {
                            ...mono,
                            background: C.warnBg,
                            color: C.warn,
                            boxShadow: `inset 0 0 0 1px ${C.warn}44`,
                          }
                        : {
                            ...mono,
                            background: C.panelHi,
                            color: C.accent,
                            boxShadow: `inset 0 0 0 1px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? {
                                ...mono,
                                background: C.warnBg,
                                color: C.warn,
                                boxShadow: `inset 0 0 0 1px ${C.warn}44`,
                              }
                            : {
                                ...mono,
                                background: C.waitBg,
                                color: C.accent,
                                boxShadow: `inset 0 0 0 1px ${C.accent}33`,
                              }
                        }
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Star size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[17px] font-semibold tracking-tight"
                        style={{ ...display, color: C.ink }}
                      >
                        {a.titel}
                      </h3>
                    </div>
                    <p
                      className="mt-1.5 text-[13px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    {warn ? (
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...bodyF,
                          background: C.warn,
                          color: C.onAccent,
                          ["--tw-ring-color" as string]: C.warn,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                          ...bodyF,
                          background: C.panelHi,
                          color: C.ink,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.accent,
                          ["--tw-ring-offset-color" as string]: C.panel,
                        }}
                      >
                        {a.cta} <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Card>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.waitBg,
                  color: C.accent,
                  boxShadow: `inset 0 0 0 1px ${C.accent}33`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
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
        </Card>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): {
    label: string;
    Icon: LucideIcon;
    fg: string;
    bg: string;
    border: string;
    dashed: boolean;
  } => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg, border: C.ok, dashed: false };
    if (status === "Openstaand")
      return {
        label: "Openstaand",
        Icon: Clock,
        fg: C.warn,
        bg: C.warnBg,
        border: C.warn,
        dashed: true,
      };
    return {
      label: "Concept",
      Icon: FileText,
      fg: C.inkSoft,
      bg: C.panelHi,
      border: C.line,
      dashed: false,
    };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet &amp; openstaand" Icon={Coins} />
        <NacreButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </NacreButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Card key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: nacre }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.panelHi }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint }}
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
                    className="transition-colors"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
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
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: m.dashed ? `1.5px dashed ${m.border}` : `1px solid ${m.border}`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundImage: nacre }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.ink }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
