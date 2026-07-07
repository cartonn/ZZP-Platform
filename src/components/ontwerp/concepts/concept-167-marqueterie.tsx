"use client";

// Concept 167 — "Marqueterie" · houtinleg & intarsia. Warme fineer-esthetiek: ingelegde
// geometrische houtpatronen (marqueterie/intarsia) in noten/eiken/kersen-tinten, een warm
// goud-bruin palet, ambachtelijke inleg-randen (dunne messing/crème filets) en subtiele
// nerf-textuur via gradients. Ambachtelijk-warm, premium meubelmakerij — géén karton/kraft,
// maar edel HOUT met inleg. Status nooit kleur-alleen: altijd label + icoon (+ tint).
// Deterministisch — geen random/Date. UI-taal Nederlands, code Engels.
// Fonts: Fraunces (inleg-serif display) + Spline Sans (tekst) + JetBrains Mono (data/labels).

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
  Diamond,
  TreePine,
  Layers,
  Ruler,
  Award,
  Sparkles,
  ChevronRight,
  Info,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warme fineer-houtsoorten + messing/crème inleg ────────────────────────
const C = {
  // Ondergronden — geschaafd parket / crème passe-partout
  parchment: "#f3e7d0",
  parchmentDeep: "#ecdcbf",
  panel: "#f8f0df",
  // Houtsoorten
  walnutDeep: "#33210f", // donker noten (koppen/velden)
  walnut: "#4c3016", // noten
  oak: "#c39a5f", // eiken
  oakLight: "#dcb87e", // licht eiken
  cherry: "#8a4526", // kersen (accent-inleg)
  cherryDeep: "#6d3319",
  // Metaal / filet-inleg
  brass: "#b98a3e",
  brassBright: "#e6c483",
  filet: "#efdcb2", // crème inleg-lijn
  // Tekst
  ink: "#2c1c0d",
  inkSoft: "#5c4526",
  inkFaint: "#8a7048",
  // Status
  ok: "#3f7d3a",
  okSoft: "#e5efd8",
  warn: "#b06a1e",
  warnSoft: "#f6e6cc",
  danger: "#a53328",
  dangerSoft: "#f4ddd6",
  white: "#fffaf0",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const sans = { fontFamily: "var(--font-lab-spline)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// ── Nerf-textuur (houtvezel) — fijne lijnen langs de nerf + diepte-overlay ─────────
function grain(base: string, light: string, dark: string, angle = 96): string {
  return [
    `linear-gradient(180deg, rgba(255,248,232,0.10), rgba(0,0,0,0.14))`,
    `repeating-linear-gradient(${angle}deg, ${dark} 0px, ${base} 1.5px, ${light} 3px, ${base} 4.5px, ${dark} 6px)`,
  ].join(", ");
}
const veneerWalnut = grain("#4c3016", "#5c3c1e", "#331f0d");
const veneerOak = grain("#c39a5f", "#d4ad70", "#a9804a");
const veneerCherry = grain("#8a4526", "#9c5330", "#6d3319");

// Marqueterie-band — ingelegd ruit/parket-motief (dunne crème filets tussen houtruiten).
function marquetryBand(a: string, b: string): string {
  return [
    `repeating-linear-gradient(45deg, ${a} 0 11px, ${C.filet} 11px 12px, ${b} 12px 23px, ${C.filet} 23px 24px)`,
    `repeating-linear-gradient(-45deg, transparent 0 11px, rgba(0,0,0,0.10) 11px 12px)`,
  ].join(", ");
}

// Inleg-rand — dunne messing filet rond een houten veld (het kern-ambachtsdetail).
const inlayBorder = `1px solid ${C.brass}`;
const inlayShadow = {
  boxShadow: `inset 0 0 0 1px ${C.brassBright}, 0 10px 24px -14px rgba(51,33,15,0.55)`,
};
const inlayShadowSm = {
  boxShadow: `inset 0 0 0 1px ${C.brassBright}, 0 6px 16px -12px rgba(51,33,15,0.5)`,
};

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.white, bg: C.ok, ring: "#2f5f2b" };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.ink,
        bg: C.oakLight,
        ring: C.brass,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.white,
        bg: C.warn,
        ring: "#8a5216",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.white, bg: C.danger, ring: "#7e281f" };
  }
}

function StatusTag({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-[0.02em] ${
        small ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ ...sans, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <m.Icon size={small ? 11 : 12.5} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Ingelegde ruit-marker — decoratief intarsia-teken.
function Inlay({ size = 12, color = C.brassBright }: { size?: number; color?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Diamond size={size} strokeWidth={1.6} style={{ color }} />
    </span>
  );
}

// Houten paneel met messing inleg-rand (de basis-kaart).
function Panel({
  children,
  className = "",
  bg = C.panel,
  shadow = inlayShadow,
  interactive = false,
  as = "div",
  style,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: React.CSSProperties;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLElement>) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-[14px] ${
        interactive
          ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_#e6c483,0_16px_30px_-16px_rgba(51,33,15,0.6)]"
          : ""
      } ${className}`}
      style={{ background: bg, border: inlayBorder, ...shadow, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Sectiekop — ingelegd label met ruit-filet en fijne onderlijn.
function SectionHead({
  children,
  Icon,
  kicker,
}: {
  children: React.ReactNode;
  Icon: LucideIcon;
  kicker?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {kicker && (
          <div
            className="mb-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.inkFaint }}
          >
            <Inlay size={9} /> {kicker}
          </div>
        )}
        <h2
          className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.01em] sm:text-[21px]"
          style={{ ...display, color: C.ink }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[8px]"
            style={{ background: veneerWalnut, boxShadow: `inset 0 0 0 1px ${C.brass}` }}
            aria-hidden="true"
          >
            <Icon size={14} strokeWidth={2.2} style={{ color: C.brassBright }} />
          </span>
          {children}
        </h2>
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2.1} style={{ color: C.brass }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-inlay — houtsoort per sterkte (waarde draagt zelf de betekenis, niet kleur-alleen).
function matchVeneer(m: number): { bg: string; fg: string } {
  if (m >= 90) return { bg: veneerCherry, fg: C.brassBright };
  if (m >= 84) return { bg: veneerWalnut, fg: C.brassBright };
  return { bg: veneerOak, fg: C.walnutDeep };
}

// Mini nerf-grafiek — dunne ingelegde staafjes.
function Grain({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="flex-1 rounded-t-[2px]"
            style={{
              height: `${Math.max(12, (v / max) * 100)}%`,
              background: last ? veneerCherry : veneerOak,
              boxShadow: `inset 0 0 0 0.5px ${last ? C.cherryDeep : C.brass}`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept167() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(1200px 600px at 15% -10%, ${C.parchment}, ${C.parchmentDeep})`,
      }}
    >
      {/* Bovenrand — smalle marqueterie-fries als terreinlijst */}
      <div
        className="h-2.5 w-full"
        style={{ background: marquetryBand(C.walnut, C.cherry) }}
        aria-hidden="true"
      />

      {/* Kop — ingelegd naambord */}
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8"
        style={{ background: veneerWalnut, boxShadow: `inset 0 -1px 0 ${C.brass}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-[10px]"
            style={{ background: veneerCherry, boxShadow: `inset 0 0 0 1px ${C.brassBright}` }}
            aria-hidden="true"
          >
            <TreePine size={22} strokeWidth={1.9} style={{ color: C.brassBright }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[20px] font-semibold tracking-[-0.01em]"
              style={{ ...display, color: C.white }}
            >
              Marqueterie
            </div>
            <div
              className="text-[10px] font-medium uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.brassBright }}
            >
              Werk · Verificatie · Omzet
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] sm:inline-flex"
            style={{
              ...sans,
              background: C.panel,
              color: C.walnutDeep,
              boxShadow: `inset 0 0 0 1px ${C.brass}`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.4} style={{ color: C.ok }} aria-hidden="true" />{" "}
            {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[12px] font-bold"
            style={{
              ...mono,
              background: C.oakLight,
              color: C.walnutDeep,
              boxShadow: `inset 0 0 0 1px ${C.brass}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher — ingelegde tabs op een houten rail */}
      <nav
        className="flex items-center gap-1.5 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.parchmentDeep, boxShadow: `inset 0 -1px 0 ${C.brass}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="group shrink-0 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold tracking-[0.01em] transition-[background,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                on
                  ? {
                      ...sans,
                      color: C.brassBright,
                      background: veneerWalnut,
                      boxShadow: `inset 0 0 0 1px ${C.brassBright}`,
                      ["--tw-ring-color" as string]: C.brass,
                    }
                  : {
                      ...sans,
                      color: C.inkSoft,
                      background: "transparent",
                      boxShadow: `inset 0 0 0 1px ${C.brass}55`,
                      ["--tw-ring-color" as string]: C.brass,
                    }
              }
            >
              <span className="mr-1.5 tabular-nums opacity-60" style={mono}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-9">
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

      {/* Onderrand — spiegelfries, sluit het kader */}
      <div
        className="h-2.5 w-full"
        style={{ background: marquetryBand(C.cherry, C.walnut) }}
        aria-hidden="true"
      />
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
    <div className="space-y-8">
      {/* Hero — ingelegd tableau met marqueterie-hoek */}
      <Panel
        bg={veneerWalnut}
        className="overflow-hidden"
        style={{ border: `1px solid ${C.brassBright}` }}
      >
        <div className="relative p-6 sm:p-9">
          <span
            className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rotate-12 rounded-[16px] opacity-70 sm:block"
            style={{ background: marquetryBand(C.cherry, C.oak) }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, background: C.panel, color: C.walnutDeep }}
            >
              <Sparkles
                size={12}
                strokeWidth={2.2}
                style={{ color: C.cherry }}
                aria-hidden="true"
              />{" "}
              {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[30px] font-semibold leading-[1.04] tracking-[-0.015em] sm:text-[42px]"
              style={{ ...display, color: C.white }}
            >
              Drie matches boven 85%. De omzet groeit gestaag.
            </h1>
            <p
              className="mt-3 max-w-lg text-[14.5px] leading-relaxed"
              style={{ color: C.brassBright }}
            >
              Eén taak vraagt aandacht: je VOG verloopt binnenkort. Handel het af en houd je profiel
              verifieerbaar — als een strak ingelegd fineer, zonder naden.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: C.brassBright,
                  color: C.walnutDeep,
                  boxShadow: `inset 0 0 0 1px ${C.brass}`,
                  ["--tw-ring-color" as string]: C.brassBright,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: "transparent",
                  color: C.white,
                  boxShadow: `inset 0 0 0 1px ${C.brassBright}`,
                  ["--tw-ring-color" as string]: C.brassBright,
                }}
              >
                <TriangleAlert size={15} strokeWidth={2.4} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} interactive shadow={inlayShadowSm} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okSoft : C.warnSoft,
                  color: k.up ? C.ok : C.warn,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Grain data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <SectionHead Icon={Star} kicker="Aanbevolen">
            Matches voor jou
          </SectionHead>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => {
              const mv = matchVeneer(o.match);
              return (
                <Panel key={o.id} interactive shadow={inlayShadowSm} className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.brass, borderRadius: 13 }}
                  >
                    <span
                      className="flex w-[70px] shrink-0 flex-col items-center justify-center rounded-l-[13px]"
                      style={{ background: mv.bg, boxShadow: `inset -1px 0 0 ${C.brass}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[22px] font-semibold leading-none"
                        style={{ ...display, color: mv.fg }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em]"
                        style={{ ...mono, color: mv.fg }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[16px] font-semibold tracking-[-0.01em]"
                            style={{ ...display, color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px]"
                            style={{ color: C.inkSoft }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className="mt-1 shrink-0"
                          style={{ color: C.brass }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              ...sans,
                              background: C.okSoft,
                              color: "#2f5f2b",
                              boxShadow: `inset 0 0 0 1px ${C.ok}44`,
                            }}
                          >
                            <Check size={11} strokeWidth={2.8} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-4">
          <SectionHead Icon={ShieldCheck} kicker="Vertrouwen">
            Status
          </SectionHead>
          <Panel shadow={inlayShadowSm} className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[54px] font-semibold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[22px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px]" style={{ color: C.inkSoft }}>
              Dekking certificaten · {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <div
              className="mt-3 h-3.5 w-full overflow-hidden rounded-full"
              style={{ background: C.parchmentDeep, boxShadow: `inset 0 0 0 1px ${C.brass}66` }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${dek}%`, background: veneerCherry }}
              />
            </div>
          </Panel>

          <Panel bg={veneerCherry} shadow={inlayShadow} className="overflow-hidden p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.brassBright, color: C.cherryDeep }}
            >
              <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[18px] font-semibold leading-tight"
              style={{ ...display, color: C.white }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.brassBright }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...sans,
                background: C.brassBright,
                color: C.cherryDeep,
                ["--tw-ring-color" as string]: C.brassBright,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Panel>
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
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead Icon={Layers} kicker="Marktplaats">
          Open opdrachten
        </SectionHead>
        <div
          className="flex items-center gap-2 rounded-[10px] px-3 py-1.5"
          style={{ background: C.panel, boxShadow: `inset 0 0 0 1px ${C.brass}` }}
        >
          <Search size={16} style={{ color: C.brass }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent py-1 text-[12.5px] outline-none placeholder:opacity-50"
            style={{ ...sans, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-[12px]"
            style={{ background: veneerOak, boxShadow: `inset 0 0 0 1px ${C.brass}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.walnutDeep }} />
          </span>
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...sans,
              background: veneerWalnut,
              color: C.brassBright,
              ["--tw-ring-color" as string]: C.brass,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const mv = matchVeneer(o.match);
            return (
              <Panel
                key={o.id}
                interactive
                shadow={inlayShadowSm}
                className="flex flex-col overflow-hidden"
              >
                <div className="flex items-stretch">
                  <span
                    className="flex w-14 shrink-0 flex-col items-center justify-center"
                    style={{ background: mv.bg, boxShadow: `inset -1px 0 0 ${C.brass}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[18px] font-semibold leading-none"
                      style={{ ...display, color: mv.fg }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-medium uppercase tracking-[0.12em]"
                      style={{ ...mono, color: mv.fg }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <h3
                      className="text-[15.5px] font-semibold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="p-4" style={{ borderTop: `1px solid ${C.brass}44` }}>
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
                          ...sans,
                          background: C.parchmentDeep,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.brass}55`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...sans,
                    background: veneerWalnut,
                    color: C.brassBright,
                    borderTop: `1px solid ${C.brass}`,
                    ["--tw-ring-color" as string]: C.brass,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                </button>
              </Panel>
            );
          })}
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
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...sans,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.brass}`,
          ["--tw-ring-color" as string]: C.brass,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel
        bg={veneerWalnut}
        className="overflow-hidden"
        style={{ border: `1px solid ${C.brassBright}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.brassBright, color: C.walnutDeep }}
            >
              <Inlay size={10} color={C.walnutDeep} /> {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.03] tracking-[-0.015em] sm:text-[38px]"
              style={{ ...display, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.brassBright }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center rounded-[12px] px-5 py-3"
            style={{ background: veneerCherry, boxShadow: `inset 0 0 0 1px ${C.brassBright}` }}
          >
            <span
              className="text-[52px] font-semibold leading-none"
              style={{ ...display, color: C.brassBright }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.brassBright }}
            >
              % match
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} interactive shadow={inlayShadowSm} className="p-4">
            <f.Icon size={16} strokeWidth={2.2} style={{ color: C.brass }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[17px] font-semibold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <SectionHead Icon={Check} kicker="Passend">
            Waarom dit past
          </SectionHead>
          <Panel shadow={inlayShadowSm} className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.ok, boxShadow: `inset 0 0 0 1px #2f5f2b` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.white }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-4">
          <SectionHead Icon={TriangleAlert} kicker="Afweging">
            Om te overwegen
          </SectionHead>
          <Panel shadow={inlayShadowSm} className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.warn, boxShadow: `inset 0 0 0 1px #8a5216` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.8} style={{ color: C.white }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-[12px] px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: veneerCherry,
            color: C.brassBright,
            boxShadow: `inset 0 0 0 1px ${C.brassBright}, 0 10px 24px -14px rgba(51,33,15,0.6)`,
            ["--tw-ring-color" as string]: C.cherry,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[12px] px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.brass}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Star size={15} strokeWidth={2.2} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const [busy, setBusy] = useState(false);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead Icon={ShieldCheck} kicker="Certificaten">
          Verificatie
        </SectionHead>
        <button
          onClick={() => setBusy((b) => !b)}
          className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: veneerWalnut,
            color: C.brassBright,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
        </button>
      </div>

      <Panel bg={veneerOak} className="overflow-hidden" style={{ border: `1px solid ${C.brass}` }}>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-5">
            <div
              className="text-[56px] font-semibold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.walnutDeep }}
            >
              {dek}
              <span className="text-[24px]">%</span>
            </div>
            <div className="max-w-xs">
              <div
                className="text-[16px] font-semibold"
                style={{ ...display, color: C.walnutDeep }}
              >
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.walnut }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Hogere dekking legt meer
                vertrouwen in — naadloos als een fineer.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{ ...sans, background: C.walnutDeep, color: C.brassBright }}
          >
            <Award size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Panel>

      {/* Loading-toestand — skeleton-fineer terwijl een nieuw certificaat wordt gelegd */}
      {busy && (
        <Panel className="flex items-center gap-4 p-5" role="status" aria-live="polite">
          <span
            className="h-11 w-11 shrink-0 animate-pulse rounded-[10px]"
            style={{ background: C.parchmentDeep }}
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <span
              className="block h-3.5 w-1/3 animate-pulse rounded-full"
              style={{ background: C.parchmentDeep }}
              aria-hidden="true"
            />
            <span
              className="block h-3 w-2/3 animate-pulse rounded-full"
              style={{ background: C.parchmentDeep }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[12px] font-medium" style={{ ...mono, color: C.inkFaint }}>
            Certificaat wordt ingelegd…
          </span>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel
              key={c.naam}
              interactive
              shadow={inlayShadowSm}
              className="flex items-stretch overflow-hidden"
            >
              <span
                className="flex w-12 shrink-0 items-center justify-center rounded-l-[13px]"
                style={{ background: m.bg, boxShadow: `inset -1px 0 0 ${m.ring}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[15px] font-semibold tracking-[-0.01em]"
                  style={{ ...display, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} small />
                  {actionable && (
                    <button
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...sans,
                        background: C.oakLight,
                        color: C.walnutDeep,
                        boxShadow: `inset 0 0 0 1px ${C.brass}`,
                        ["--tw-ring-color" as string]: C.brass,
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
            </Panel>
          );
        })}
      </div>

      {/* Error-voorbeeld — afgewezen inleg met verplichte herstelactie */}
      <Panel
        bg={C.dangerSoft}
        shadow={inlayShadowSm}
        className="flex flex-wrap items-center gap-3 p-4"
        style={{ border: `1px solid ${C.danger}` }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: C.danger }}
          aria-hidden="true"
        >
          <XCircle size={17} strokeWidth={2.4} style={{ color: C.white }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold" style={{ color: C.danger }}>
            Uploadfout · bestand groter dan 10 MB
          </div>
          <div className="text-[12px]" style={{ color: C.inkSoft }}>
            Comprimeer je scan van de VOG en dien opnieuw in om de inleg te voltooien.
          </div>
        </div>
        <button
          className="rounded-[9px] px-3 py-1.5 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.danger,
            color: C.white,
            ["--tw-ring-color" as string]: C.danger,
          }}
        >
          Opnieuw indienen
        </button>
      </Panel>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <div>
        <SectionHead Icon={Ruler} kicker="Werkbank">
          Volgende beste acties
        </SectionHead>
        <p className="mt-2 pl-9 text-[13px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — leg de bovenste eerst in.
        </p>
      </div>
      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel
                interactive
                shadow={inlayShadowSm}
                bg={warn ? veneerWalnut : C.panel}
                className="flex items-stretch overflow-hidden"
                style={warn ? { border: `1px solid ${C.brassBright}` } : undefined}
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[28px] font-semibold"
                  style={{
                    ...display,
                    background: warn ? marquetryBand(C.cherry, C.oak) : C.parchmentDeep,
                    color: warn ? C.white : C.walnut,
                    boxShadow: `inset -1px 0 0 ${C.brass}`,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={22} strokeWidth={2.2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                      style={{
                        ...mono,
                        background: warn ? C.brassBright : C.walnutDeep,
                        color: warn ? C.walnutDeep : C.brassBright,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-semibold tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.white : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ color: warn ? C.brassBright : C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...sans,
                            background: C.brassBright,
                            color: C.walnutDeep,
                            ["--tw-ring-color" as string]: C.brassBright,
                          }
                        : {
                            ...sans,
                            background: veneerWalnut,
                            color: C.brassBright,
                            ["--tw-ring-color" as string]: C.brass,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {/* Documenten-strook — verrijking met ingelegde bestandslijst */}
      <div className="space-y-4 pt-2">
        <SectionHead Icon={FileText} kicker="Archief">
          Recente documenten
        </SectionHead>
        <Panel className="overflow-hidden">
          <ul>
            {DOCUMENTEN.map((d, i) => (
              <li
                key={d.naam}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#efe2c9]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.brass}33` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: veneerOak, boxShadow: `inset 0 0 0 1px ${C.brass}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} strokeWidth={2.2} style={{ color: C.walnutDeep }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {d.naam}
                  </div>
                  <div className="text-[11.5px]" style={{ ...mono, color: C.inkFaint }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </div>
                </div>
                <StatusTag status={d.status} small />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.white, bg: C.ok, ring: "#2f5f2b" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.white, bg: C.warn, ring: "#8a5216" };
    return { label: "Concept", Icon: FileText, fg: C.walnutDeep, bg: C.oakLight, ring: C.brass };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead Icon={FileText} kicker="Omzet">
          Facturen
        </SectionHead>
        <button
          className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: veneerCherry,
            color: C.brassBright,
            ["--tw-ring-color" as string]: C.cherry,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, bg: veneerWalnut, fg: C.brassBright, meta: C.oakLight },
          { l: "Openstaand", v: `${open}`, bg: veneerOak, fg: C.walnutDeep, meta: C.walnut },
          { l: "Te factureren", v: "€ 1.350", bg: C.panel, fg: C.ink, meta: C.inkFaint },
        ].map((s) => (
          <Panel key={s.l} interactive shadow={inlayShadowSm} bg={s.bg} className="p-4">
            <div
              className="text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ ...mono, color: s.meta }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        {/* Tabelkop */}
        <div
          className="hidden grid-cols-[1fr,auto,auto] items-center gap-4 px-4 py-3 text-[10.5px] font-medium uppercase tracking-[0.1em] sm:grid"
          style={{ ...mono, background: C.parchmentDeep, color: C.inkFaint }}
        >
          <span>Factuur</span>
          <span className="w-28 text-center">Status</span>
          <span className="w-24 text-right">Bedrag</span>
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-1 items-center gap-3 p-4 transition-colors hover:bg-[#efe2c9] sm:grid-cols-[1fr,auto,auto] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.brass}33` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                    style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
                    aria-hidden="true"
                  >
                    <m.Icon size={15} strokeWidth={2.4} style={{ color: m.fg }} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13.5px] font-semibold tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {f.nr}
                    </div>
                    <div className="text-[12px]" style={{ color: C.inkSoft }}>
                      {f.klant} · {f.datum}
                    </div>
                  </div>
                </div>
                <span className="sm:w-28 sm:text-center">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      ...sans,
                      background: m.bg,
                      color: m.fg,
                      boxShadow: `inset 0 0 0 1px ${m.ring}`,
                    }}
                  >
                    <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                  </span>
                </span>
                <span
                  className="text-[16px] font-semibold tabular-nums sm:w-24 sm:text-right"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between p-4" style={{ background: veneerWalnut }}>
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.brassBright }}
          >
            <Inlay size={10} /> Totaal betaald
          </span>
          <span
            className="text-[18px] font-semibold tabular-nums"
            style={{ ...display, color: C.white }}
          >
            {betaald}
          </span>
        </div>
      </Panel>

      <p
        className="flex items-center justify-center gap-1.5 text-center text-[12px]"
        style={{ color: C.inkFaint }}
      >
        <Info size={13} strokeWidth={2.2} aria-hidden="true" /> Bedragen zijn indicatief en excl.
        btw — puur ter illustratie van de designtaal.
      </p>
    </div>
  );
}
