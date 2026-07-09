"use client";

// Concept 207 — "Steendruk" · fijnkunst-lithografie uit een prentstudio. De interface is een afdruk op
// kalksteen-crème: één diep inktblauw op het steen, tonale krijt-korrel (aquatint) in zachte grijsverlopen,
// registratie-kruisjes op de plaatranden en ruime plaatmarges. Onderscheidt zich bewust van riso (grof
// duotone), letterpress (reliëf) en cyanotype (blauwdruk-belichting): dit is tonale steen-lithografie met
// krijt-korrel en drukregistratie. Editorial, tijdloos, ambachtelijk-premium. Korrel/tonen zijn puur decor —
// alle content blijft messcherp en toegankelijk; status altijd via label + icoon + vorm, nooit kleur alleen.
// Deterministisch (geen random/Date). UI Nederlands. Fonts: Fraunces (fijnkunst-display) + Newsreader (tekst)
// + IBM Plex Mono (registratie/cijfers).

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
  Stamp,
  Feather,
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

// ── Palet — kalksteen-crème als drager, één diep inktblauw uit de pers, warme oud-rood-registratie. Tonen
//    komen uit krijt-grijs, niet uit kleur. ──
const C = {
  stone: "#efe9dd", // kalksteen-crème (drager)
  stoneDeep: "#e6ded0", // dieper steen (marge)
  paper: "#faf6ec", // afgedrukt vlak (kaart)
  paperHi: "#f2ecdd", // opgetild / hover
  line: "#d9cfba", // fijne plaatrand
  lineSoft: "#e4dccb",
  grain: "rgba(31,45,74,0.05)", // krijt-korrel toon
  ink: "#1c2540", // diep inktblauw (primaire tekst)
  inkSoft: "#4a5470", // tonaal grijsblauw
  inkFaint: "#8a8674", // krijt-grijs label
  blue: "#22346a", // drukinkt-accent
  blueHi: "#33509c",
  blueDeep: "#161f3c",
  onInk: "#f7f2e6",
  red: "#9a3b2e", // registratie oud-rood
  // status (tonaal, ingehouden)
  ok: "#3d6249",
  okBg: "#e2ead9",
  wait: "#22346a",
  waitBg: "#e0e2ec",
  warn: "#8a5a1c",
  warnBg: "#f0e5cf",
  bad: "#9a3b2e",
  badBg: "#eddcd4",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Krijt-korrel als herbruikbaar achtergrond-laagje (aquatint-toon). Puur decor, aria-hidden.
const grainStyle: React.CSSProperties = {
  backgroundImage: `radial-gradient(${C.grain} 0.6px, transparent 0.7px), radial-gradient(${C.grain} 0.6px, transparent 0.7px)`,
  backgroundSize: "4px 4px, 4px 4px",
  backgroundPosition: "0 0, 2px 2px",
};

// ── Status-model — vorm draagt mee: gevuld / omlijnd / krijtstreep / dubbele plaatrand. ──
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
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...mono, background: m.bg, color: m.fg, ...borderFor(m) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Registratie-kruisje — drukwerk-uitlijnmerk op plaatranden. Decoratief.
function RegMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-3 w-3 ${className}`}
      aria-hidden="true"
      style={{ color: C.red }}
    >
      <span
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
        style={{ background: "currentColor" }}
      />
      <span
        className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
        style={{ background: "currentColor" }}
      />
      <span
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ boxShadow: "inset 0 0 0 1px currentColor" }}
      />
    </span>
  );
}

// ── Plaat — een afdruk-vlak op de steen: warm papier, fijne plaatrand, krijt-korrel, registratie op de hoeken. ──
function Plate({
  children,
  className = "",
  style,
  interactive = false,
  reg = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  reg?: boolean;
}) {
  return (
    <div
      className={`group/plate relative overflow-hidden rounded-md ${
        interactive ? "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: C.paper,
        boxShadow: `0 1px 0 ${C.stoneDeep}, inset 0 0 0 1px ${C.line}, 0 14px 30px -26px rgba(22,31,60,0.5)`,
        ...style,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-70"
        style={grainStyle}
        aria-hidden="true"
      />
      {reg && (
        <>
          <RegMark className="left-1.5 top-1.5" />
          <RegMark className="right-1.5 top-1.5" />
          <RegMark className="bottom-1.5 left-1.5" />
          <RegMark className="bottom-1.5 right-1.5" />
        </>
      )}
      {interactive && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover/plate:opacity-100"
          style={{ background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)` }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Sectie-kop — inkt-glyph + fijnkunst-titel + wegtonende krijt-liniaal.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
        style={{ background: C.waitBg, boxShadow: `inset 0 0 0 1px ${C.blue}33` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.8} style={{ color: C.blue }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[20px] font-semibold leading-none tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
      <span
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{ background: `linear-gradient(90deg, ${C.blue}44, transparent)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match-ring — inktboog in tonaal verloop op krijt-rest, mono-cijfer in het hart.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.blueHi} 0deg, ${C.blue} ${deg}deg, ${C.lineSoft} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paper }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.blue }}
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

// Mini staaf-spark — tonaal krijt, laatste staaf volle inkt.
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[1px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.blue : C.waitBg,
          }}
        />
      ))}
    </div>
  );
}

// Kleine registratie-tag (prentstudio-sfeer) — puur decoratief label in mono.
function Reg({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
      style={{
        ...mono,
        background: C.paperHi,
        color: C.inkFaint,
        boxShadow: `inset 0 0 0 1px ${C.line}`,
      }}
    >
      {children}
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept207() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.stone, color: C.ink }}
    >
      {/* Steen-drager — grote krijt-korrel over het hele vlak + zachte tonale vignet. Decoratief. */}
      <span
        className="pointer-events-none fixed inset-0 z-0"
        style={grainStyle}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(120% 90% at 50% -10%, rgba(34,52,106,0.06), transparent 55%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Masthead — prentstudio-kop met plaatrand en registratie */}
        <header className="relative" style={{ background: C.stoneDeep }}>
          <span
            className="pointer-events-none absolute inset-0 opacity-60"
            style={grainStyle}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)` }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                style={{ background: C.blue, boxShadow: `0 8px 20px -8px ${C.blueDeep}` }}
                aria-hidden="true"
              >
                <Stamp size={20} strokeWidth={1.8} style={{ color: C.onInk }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...mono, color: C.red }}
                >
                  Steendruk
                </div>
                <div
                  className="text-[25px] font-semibold leading-none tracking-tight"
                  style={{ ...display, color: C.ink }}
                >
                  Prentstudio
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: C.inkFaint }}
                >
                  Lithografie · Tonen · Verificatie
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-sm px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{
                  ...mono,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1px ${C.ok}33`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ ...mono, background: C.blue, color: C.onInk }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — tab-plaatjes met inkt-onderstreep */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-sm px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.blue,
                          color: C.onInk,
                          ["--tw-ring-color" as string]: C.blue,
                          ["--tw-ring-offset-color" as string]: C.stoneDeep,
                        }
                      : {
                          ...bodyF,
                          background: C.paper,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.line}`,
                          ["--tw-ring-color" as string]: C.blue,
                          ["--tw-ring-offset-color" as string]: C.stoneDeep,
                        }
                  }
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
            <Feather size={12} aria-hidden="true" /> Eén inkt op de steen — tonen en korrel zijn
            decor, de content blijft messcherp en leesbaar.
          </div>
        </footer>
      </div>
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
      {/* Hoofd-afdruk — grote plaat met registratie op de hoeken */}
      <Plate reg className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 130% at 100% -10%, rgba(34,52,106,0.08), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-xl p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: C.waitBg,
                color: C.blue,
                boxShadow: `inset 0 0 0 1px ${C.blue}33`,
              }}
            >
              <Star size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <Reg>plaat · 01</Reg>
          </div>
          <h1
            className="mt-4 text-[33px] font-semibold leading-[1.04] tracking-tight sm:text-[46px]"
            style={{ ...display, color: C.ink }}
          >
            Drie sterke matches, scherp afgedrukt.
          </h1>
          <p
            className="mt-3 max-w-lg text-[15px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén ding vraagt aandacht in de marge: je VOG verloopt binnenkort. Regel het en houd je
            profiel onberispelijk in de studio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.blue,
                color: C.onInk,
                ["--tw-ring-color" as string]: C.blue,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.paperHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.line}`,
                ["--tw-ring-color" as string]: C.blue,
                ["--tw-ring-offset-color" as string]: C.paper,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Plate>

      {/* KPI-plaatjes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Plate key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.paperHi,
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
          </Plate>
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
              <Plate key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.blue }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[17px] font-semibold tracking-tight"
                          style={{ ...display, color: C.ink }}
                        >
                          {o.titel}
                        </div>
                        <div
                          className="mt-0.5 truncate text-[13px]"
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
                          className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            ...bodyF,
                            background: C.paperHi,
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
              </Plate>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Plate className="p-5">
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
                  style={{ background: C.paper }}
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
                <p className="mt-2 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Plate>

          {/* Prioriteit — volle inkt-plaat */}
          <Plate
            reg
            className="relative"
            style={{
              background: C.blue,
              boxShadow: `0 20px 40px -22px ${C.blueDeep}, inset 0 0 0 1px ${C.blueDeep}`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(80% 120% at 100% 0%, rgba(247,242,230,0.14), transparent 55%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(247,242,230,0.16)", color: C.onInk }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> In de marge
              </span>
              <h3
                className="mt-2.5 text-[21px] font-semibold leading-tight tracking-tight"
                style={{ ...display, color: C.onInk }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(247,242,230,0.82)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.onInk,
                  color: C.blue,
                  ["--tw-ring-color" as string]: C.onInk,
                  ["--tw-ring-offset-color" as string]: C.blue,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Plate>
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
        <SectionHead title="Marktplaats" sub="Open opdrachten in de oplage" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-sm px-3.5 py-2"
            style={{ background: C.paper, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.blue }} aria-hidden="true" />
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
            className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.paper,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.stone,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.blue }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-sm p-4"
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
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste oplage. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
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
            <Plate key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.paperHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paperHi }}
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
            </Plate>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        // Empty-state
        <Plate reg className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.waitBg, boxShadow: `inset 0 0 0 1px ${C.blue}33` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.5} style={{ color: C.blue }} />
          </span>
          <p
            className="text-[21px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen afdruk gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en de oplage vult zich
            opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: C.blue,
              color: C.onInk,
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.stone,
            }}
          >
            Zoekterm wissen
          </button>
        </Plate>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Plate key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, ${C.blueHi}, ${C.blueDeep})` }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[16px] font-semibold leading-tight tracking-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <div className="relative px-4 pb-4">
                <dl className="grid grid-cols-2 gap-y-2 text-[12.5px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...bodyF,
                        background: C.paperHi,
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
                  color: C.blue,
                  ["--tw-ring-color" as string]: C.blue,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Plate>
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
        className="inline-flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.paper,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.blue,
          ["--tw-ring-offset-color" as string]: C.stone,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Plate reg className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(90% 140% at 50% -10%, rgba(34,52,106,0.07), transparent 55%)`,
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-9">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-sm px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  ...mono,
                  background: C.waitBg,
                  color: C.blue,
                  boxShadow: `inset 0 0 0 1px ${C.blue}33`,
                }}
              >
                {opdracht.id}
              </span>
              <Reg>oplage · zorg</Reg>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[29px] font-semibold leading-[1.05] tracking-tight sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={82} />
        </div>
      </Plate>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Plate key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-sm"
              style={{ background: C.waitBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.8} style={{ color: C.blue }} />
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
          </Plate>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Plate className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
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
          </Plate>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Plate className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
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
          </Plate>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onInk,
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.stone,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.paper,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.stone,
          }}
        >
          <Star size={15} strokeWidth={1.8} style={{ color: C.blue }} aria-hidden="true" /> Bewaar
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
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onInk,
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.stone,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Plate reg className="relative">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 130% at 0% 0%, rgba(34,52,106,0.06), transparent 55%)`,
          }}
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
              style={{ background: C.paper }}
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
              className="text-[21px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 text-[13.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk geverifieerd certificaat drukt je profiel scherper af. Houd je dekking hoog, dan
              blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-[11px] font-semibold"
              style={{
                ...mono,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1px ${C.ok}33`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Plate>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Plate key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm"
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
                <div className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-sm px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.paperHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.blue,
                        ["--tw-ring-offset-color" as string]: C.paper,
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
            </Plate>
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
        Icon={Stamp}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Plate interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.blue }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[16px] font-semibold tabular-nums"
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
                            background: C.paperHi,
                            color: C.blue,
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
                        className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
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
                                color: C.blue,
                                boxShadow: `inset 0 0 0 1px ${C.blue}33`,
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
                      className="mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: C.onInk,
                              ["--tw-ring-color" as string]: C.warn,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                          : {
                              ...bodyF,
                              background: C.paperHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.line}`,
                              ["--tw-ring-color" as string]: C.blue,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Plate>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Plate>
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
                  color: C.blue,
                  boxShadow: `inset 0 0 0 1px ${C.blue}33`,
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
                      style={{ background: C.red }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
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
        </Plate>
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
      bg: C.paperHi,
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
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.blue,
            color: C.onInk,
            ["--tw-ring-color" as string]: C.blue,
            ["--tw-ring-offset-color" as string]: C.stone,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${open}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Plate key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.blueHi}, ${C.blueDeep})` }}
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
          </Plate>
        ))}
      </div>

      <Plate>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paperHi }}>
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
                        className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          ...mono,
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
              <tr style={{ background: C.blue }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(247,242,230,0.8)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onInk }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Plate>
    </div>
  );
}
