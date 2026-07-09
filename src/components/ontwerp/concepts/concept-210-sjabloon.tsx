"use client";

// Concept 210 — "Sjabloon" · industrieel spray-stencil / uitgesneden-letter-signage. 2026-trend: robuuste,
// functionele markering (kratlabels, magazijnborden, veiligheidstape) als tegengif voor gladde SaaS-esthetiek.
// Stencil-gevoel via condensed mono + uppercase + letter-spacing en "onderbroken" koppen (subtiele horizontale
// strepen over grote titels, alsof de sjabloon-bruggen de letters doorsnijden). Kraftpapier/beton-basis met één
// zeer gedoseerd industrieel accent (veiligheidsgeel). Waarschuwingstape spaarzaam. Onderscheidt zich van
// letterpers/riso/typemachine: dit is spray-stencil/industriële markering, geen druktechniek. Content strak en
// zeer leesbaar; status altijd label + icoon, nooit alleen kleur. UI Nederlands. Deterministisch (geen random/Date).

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
  Package,
  Boxes,
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

// ── Palet — beton/kraft-basis, inkt-antraciet tekst, één veiligheidsgeel accent (zeer gedoseerd). ──
const C = {
  bg: "#e7e3da", // beton/kraft
  bgAlt: "#ded9ce", // dieper kraft-vlak
  panel: "#f2efe8", // labelpapier
  panelHi: "#e9e5db", // hover/opgetild
  ink: "#20211d", // stencil-inkt
  inkSoft: "#57574f", // secundair
  inkFaint: "#8a897e", // labels
  line: "#cbc6b9", // fijne rand
  lineStrong: "#ada799", // sterkere rand / stempel
  yellow: "#f2c200", // veiligheidsgeel (het enige accent)
  yellowDeep: "#c99e00",
  yellowInk: "#241f00", // tekst op geel
  yellowBg: "#f7ecb4", // zacht geel vlak
  // status (industrieel, maar toegankelijk contrast)
  ok: "#2f7d45",
  okBg: "#dcecdf",
  wait: "#1f5c99",
  waitBg: "#dbe7f2",
  warn: "#9a6a00", // amber-bruin, leesbaar op licht
  warnBg: "#f6ead0",
  bad: "#b23325",
  badBg: "#f2ddd9",
};

const stencilF = { fontFamily: "var(--font-lab-plex-mono)" }; // IBM Plex Mono — industrieel/condensed
const bodyF = { fontFamily: "var(--font-lab-geist)" };

// Waarschuwingstape — diagonale geel/inkt-strepen. Puur decoratief, spaarzaam gebruikt.
const tape = {
  background: `repeating-linear-gradient(-45deg, ${C.yellow} 0 12px, ${C.ink} 12px 24px)`,
};

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ok, bg: C.okBg };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.wait, bg: C.waitBg };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnBg };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{
        ...stencilF,
        background: m.bg,
        color: m.fg,
        boxShadow: `inset 0 0 0 1.5px ${m.fg}66`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Stencil-kop — grote uppercase titel met "sjabloon-bruggen": subtiele horizontale strepen die de letters
// doorsnijden zoals bij een uitgesneden sjabloon. De tekst blijft volledig leesbaar (strepen zijn zacht).
function Stencil({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`relative inline-block uppercase ${className}`}
      style={{ ...stencilF, color: C.ink, ...style }}
    >
      <span className="relative z-10">{children}</span>
      {/* sjabloon-bruggen: twee dunne kraft-kleurige strepen over de letterhoogte */}
      <span
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `repeating-linear-gradient(0deg, transparent 0 34%, ${C.bg}cc 34% 37%, transparent 37% 64%, ${C.bg}cc 64% 67%, transparent 67%)`,
          mixBlendMode: "normal",
        }}
        aria-hidden="true"
      />
    </span>
  );
}

// Kratlabel-kaart — labelpapier met stempel-rand.
function Crate({
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
      className={`rounded-[3px] ${className}`}
      style={{
        background: C.panel,
        boxShadow: `inset 0 0 0 1.5px ${C.line}, 0 1px 0 ${C.lineStrong}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — stencil-glyph in geel kader + uppercase titel + tape-liniaal.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
        style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2.2} style={{ color: C.yellowInk }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[17px] font-semibold uppercase leading-none tracking-[0.08em]"
          style={{ ...stencilF, color: C.ink }}
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
        className="ml-2 hidden h-1.5 flex-1 rounded-[1px] sm:block"
        style={{ ...tape, opacity: 0.5 }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.yellowDeep }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Groot stencil-cijfer (KPI / match / bedrag) — mono, uppercase, met een dunne onderstreep-stempel.
function BigNum({ value, accent = false }: { value: string; accent?: boolean }) {
  return (
    <div
      className="text-[26px] font-bold tabular-nums leading-none"
      style={{ ...stencilF, color: accent ? C.yellowDeep : C.ink, letterSpacing: "0.01em" }}
    >
      {value}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept210() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* beton-textuur: fijne rasterlijnen, zeer subtiel */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(${C.lineStrong}22 1px, transparent 1px), linear-gradient(90deg, ${C.lineStrong}22 1px, transparent 1px)`,
          backgroundSize: "46px 46px",
          opacity: 0.6,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — magazijnbord met tape-onderrand */}
        <header className="relative" style={{ background: C.bgAlt }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px]"
                style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
                aria-hidden="true"
              >
                <Boxes size={20} strokeWidth={2.2} style={{ color: C.yellowInk }} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.34em]"
                  style={{ ...stencilF, color: C.yellowDeep }}
                >
                  Sjabloon
                </div>
                <div
                  className="text-[23px] font-bold uppercase leading-none tracking-[0.06em]"
                  style={{ ...stencilF, color: C.ink }}
                >
                  Werkplaats
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...stencilF, color: C.inkFaint }}
                >
                  Opdrachten · Verificatie · Facturen
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-[2px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] sm:inline-flex"
                style={{
                  ...stencilF,
                  background: C.okBg,
                  color: C.ok,
                  boxShadow: `inset 0 0 0 1.5px ${C.ok}55`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[3px] text-[12px] font-bold"
                style={{ ...stencilF, background: C.ink, color: C.yellow }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* tape-onderrand */}
          <div className="h-1.5 w-full" style={tape} aria-hidden="true" />

          {/* Scherm-switcher — stencil-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-[3px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...stencilF,
                          background: C.ink,
                          color: C.yellow,
                          ["--tw-ring-color" as string]: C.yellowDeep,
                          ["--tw-ring-offset-color" as string]: C.bgAlt,
                        }
                      : {
                          ...stencilF,
                          background: C.panel,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1.5px ${C.line}`,
                          ["--tw-ring-color" as string]: C.yellowDeep,
                          ["--tw-ring-offset-color" as string]: C.bgAlt,
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
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px] uppercase tracking-[0.1em]"
            style={{ ...stencilF, borderColor: C.line, color: C.inkFaint }}
          >
            <Package size={12} aria-hidden="true" /> Gemarkeerd via sjabloon — robuust en
            functioneel, elke status draagt een label en een icoon.
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
      {/* Hero — groot stencil-signage-bord */}
      <Crate className="relative overflow-hidden" style={{ background: C.panel }}>
        <div className="h-1.5 w-full" style={tape} aria-hidden="true" />
        <div className="relative p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...stencilF, background: C.yellow, color: C.yellowInk }}
            >
              <Star size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <span
              className="text-[11px] uppercase tracking-[0.1em]"
              style={{ ...stencilF, color: C.inkFaint }}
            >
              Partij 01 · gereed voor verzending
            </span>
          </div>
          <Stencil className="mt-5 text-[34px] font-bold leading-[1.02] tracking-[0.02em] sm:text-[46px]">
            Drie sterke
            <br />
            matches klaar.
          </Stencil>
          <p
            className="mt-4 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén partij is gemarkeerd met geel: je VOG verloopt binnenkort. Verwerk de markering en
            houd je profiel verzendklaar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...stencilF,
                background: C.ink,
                color: C.yellow,
                ["--tw-ring-color" as string]: C.yellowDeep,
                ["--tw-ring-offset-color" as string]: C.panel,
              }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...stencilF,
                background: C.panelHi,
                color: C.ink,
                boxShadow: `inset 0 0 0 1.5px ${C.lineStrong}`,
                ["--tw-ring-color" as string]: C.yellowDeep,
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
      </Crate>

      {/* KPI-kratlabels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Crate key={k.label} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...stencilF, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[2px] px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...stencilF,
                  background: k.up ? C.okBg : C.panelHi,
                  color: k.up ? C.ok : C.inkSoft,
                  boxShadow: `inset 0 0 0 1px ${k.up ? C.ok + "44" : C.line}`,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div className="mt-3">
              <BigNum value={k.value} accent={i === 0} />
            </div>
            <div
              className="mt-3 h-1 w-full rounded-[1px]"
              style={i === 0 ? { background: C.yellow } : { background: C.line }}
              aria-hidden="true"
            />
          </Crate>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Verzendlijst met matches */}
        <section className="space-y-4">
          <SectionHead
            title="Verzendlijst"
            sub="Aanbevolen opdrachten, op match gerangschikt"
            Icon={Package}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Crate key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.yellowDeep }}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[3px]"
                    style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[18px] font-bold tabular-nums leading-none"
                      style={{ ...stencilF, color: C.yellowInk }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-semibold uppercase tracking-[0.1em]"
                      style={{ ...stencilF, color: C.yellowInk }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold uppercase tracking-[0.02em]"
                      style={{ ...stencilF, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[12.5px]"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-medium"
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
                  <ChevronRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.inkFaint }}
                    aria-hidden="true"
                  />
                </button>
              </Crate>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Crate className="p-5">
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[3px]"
                style={{ background: C.ink }}
                aria-hidden="true"
              >
                <span
                  className="text-[22px] font-bold tabular-nums leading-none"
                  style={{ ...stencilF, color: C.yellow }}
                >
                  {dek}
                </span>
                <span
                  className="text-[8px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...stencilF, color: C.yellow }}
                >
                  procent
                </span>
              </span>
              <div className="min-w-0">
                <StatusTag status="VERIFIED" />
                <p className="mt-2 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten geverifieerd. Opdrachtgevers zien
                  alleen geverifieerde documenten.
                </p>
              </div>
            </div>
          </Crate>

          {/* Prioriteit — gemarkeerde partij met tape */}
          <Crate className="relative overflow-hidden" style={{ background: C.ink }}>
            <div className="absolute inset-x-0 top-0 h-1.5" style={tape} aria-hidden="true" />
            <div className="relative p-5 pt-6">
              <span
                className="inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...stencilF, background: C.yellow, color: C.yellowInk }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Gemarkeerd
              </span>
              <h3
                className="mt-2.5 text-[18px] font-bold uppercase leading-tight tracking-[0.02em]"
                style={{ ...stencilF, color: C.panel }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "#cfccc2" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...stencilF,
                  background: C.yellow,
                  color: C.yellowInk,
                  ["--tw-ring-color" as string]: C.yellow,
                  ["--tw-ring-offset-color" as string]: C.ink,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Crate>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek, skeleton, empty- én foutstate ─────────────
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
        <SectionHead title="Magazijn" sub="Open opdrachten op voorraad" Icon={Search} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[3px] px-3.5 py-2"
            style={{ background: C.panel, boxShadow: `inset 0 0 0 1.5px ${C.line}` }}
          >
            <Search size={15} style={{ color: C.yellowDeep }} aria-hidden="true" />
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
            aria-label="Voorraad verversen"
            className="flex h-10 w-10 items-center justify-center rounded-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.panel,
              boxShadow: `inset 0 0 0 1.5px ${C.line}`,
              ["--tw-ring-color" as string]: C.yellowDeep,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.yellowDeep }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[3px] p-4"
          role="alert"
          style={{ background: C.badBg, boxShadow: `inset 0 0 0 1.5px ${C.bad}66` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.bad }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div
              className="text-[14px] font-semibold uppercase tracking-[0.04em]"
              style={{ ...stencilF, color: C.ink }}
            >
              Voorraad niet volledig geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de partijen ontbreekt. Ververs de voorraad om opnieuw te proberen.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase focus-visible:outline-none focus-visible:ring-2"
            style={{ ...stencilF, color: C.bad, ["--tw-ring-color" as string]: C.bad }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Crate key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-[3px]"
                  style={{ background: C.panelHi }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.panelHi }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.line }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.line }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.line }}
                />
              </div>
            </Crate>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Crate className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[3px]"
            style={{ background: C.yellow, boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}` }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.8} style={{ color: C.yellowInk }} />
          </span>
          <p
            className="text-[18px] font-bold uppercase tracking-[0.04em]"
            style={{ ...stencilF, color: C.ink }}
          >
            Niet op voorraad
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen partij gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en de rekken vullen
            zich opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...stencilF,
              background: C.ink,
              color: C.yellow,
              ["--tw-ring-color" as string]: C.yellowDeep,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            Zoekterm wissen
          </button>
        </Crate>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Crate key={o.id} className="flex flex-col overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ background: C.bgAlt }}
              >
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...stencilF, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{ ...stencilF, background: C.yellow, color: C.yellowInk }}
                >
                  {o.match} match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[16px] font-semibold uppercase leading-tight tracking-[0.02em]"
                  style={{ ...stencilF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 text-[12px]">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[2px] px-2 py-0.5 text-[10.5px] font-medium"
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
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...stencilF,
                  borderTop: `1.5px solid ${C.line}`,
                  color: C.yellowDeep,
                  ["--tw-ring-color" as string]: C.yellowDeep,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Crate>
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
        className="inline-flex items-center gap-1.5 rounded-[3px] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...stencilF,
          background: C.panel,
          color: C.ink,
          boxShadow: `inset 0 0 0 1.5px ${C.line}`,
          ["--tw-ring-color" as string]: C.yellowDeep,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar magazijn
      </button>

      <Crate className="relative overflow-hidden" style={{ background: C.panel }}>
        <div className="h-1.5 w-full" style={tape} aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-[2px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em]"
                style={{ ...stencilF, background: C.yellow, color: C.yellowInk }}
              >
                {opdracht.id}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.1em]"
                style={{ ...stencilF, color: C.inkFaint }}
              >
                Partij 01 · start {opdracht.start}
              </span>
            </div>
            <Stencil className="mt-3 max-w-2xl text-[26px] font-bold leading-[1.06] tracking-[0.02em] sm:text-[34px]">
              {opdracht.titel}
            </Stencil>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[4px]"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <span
              className="text-[34px] font-bold tabular-nums leading-none"
              style={{ ...stencilF, color: C.yellow }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...stencilF, color: C.yellow }}
            >
              match %
            </span>
          </span>
        </div>
      </Crate>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Crate key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[3px]"
              style={{ background: C.yellowBg, boxShadow: `inset 0 0 0 1px ${C.yellowDeep}55` }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.yellowDeep }} />
            </span>
            <div
              className="mt-3 text-[16px] font-bold tabular-nums leading-none"
              style={{ ...stencilF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...stencilF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Crate>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Crate className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: C.okBg }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Crate>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Crate className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: C.warnBg, boxShadow: `inset 0 0 0 1px ${C.warn}55` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Crate>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...stencilF,
            background: C.ink,
            color: C.yellow,
            ["--tw-ring-color" as string]: C.yellowDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[3px] px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.05em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...stencilF,
            background: C.panel,
            color: C.ink,
            boxShadow: `inset 0 0 0 1.5px ${C.line}`,
            ["--tw-ring-color" as string]: C.yellowDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.yellowDeep }} aria-hidden="true" />{" "}
          Bewaar
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
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...stencilF,
            background: C.ink,
            color: C.yellow,
            ["--tw-ring-color" as string]: C.yellowDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Crate className="relative overflow-hidden" style={{ background: C.panel }}>
        <div className="h-1.5 w-full" style={tape} aria-hidden="true" />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[4px]"
            style={{ background: C.ink }}
            aria-hidden="true"
          >
            <span
              className="text-[34px] font-bold tabular-nums leading-none"
              style={{ ...stencilF, color: C.yellow }}
            >
              {dek}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...stencilF, color: C.yellow }}
            >
              procent
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[19px] font-bold uppercase tracking-[0.04em]"
              style={{ ...stencilF, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk geverifieerd certificaat markeert je profiel als betrouwbaar. Houd je dekking
              hoog, dan blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
              style={{
                ...stencilF,
                background: C.okBg,
                color: C.ok,
                boxShadow: `inset 0 0 0 1.5px ${C.ok}55`,
              }}
            >
              <BadgeCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Crate>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Crate key={c.naam} className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                style={{ background: m.bg, boxShadow: `inset 0 0 0 1.5px ${m.fg}55` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-semibold uppercase tracking-[0.02em]"
                  style={{ ...stencilF, color: C.ink }}
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
                      className="rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...stencilF,
                        background: C.panelHi,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
                        ["--tw-ring-color" as string]: C.yellowDeep,
                        ["--tw-ring-offset-color" as string]: C.panel,
                      }}
                    >
                      {c.status === "EXPIRING"
                        ? "Vernieuwen"
                        : c.status === "REJECTED"
                          ? "Opnieuw"
                          : "Bekijk"}
                    </button>
                  )}
                </div>
              </div>
            </Crate>
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
        title="Werkorders"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={TriangleAlert}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Crate className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={warn ? tape : { background: C.wait }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] text-[16px] font-bold tabular-nums"
                    style={
                      warn
                        ? {
                            ...stencilF,
                            background: C.yellow,
                            color: C.yellowInk,
                            boxShadow: `inset 0 0 0 1.5px ${C.yellowDeep}`,
                          }
                        : {
                            ...stencilF,
                            background: C.panelHi,
                            color: C.wait,
                            boxShadow: `inset 0 0 0 1.5px ${C.line}`,
                          }
                    }
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={
                          warn
                            ? { ...stencilF, background: C.yellow, color: C.yellowInk }
                            : {
                                ...stencilF,
                                background: C.waitBg,
                                color: C.wait,
                                boxShadow: `inset 0 0 0 1px ${C.wait}44`,
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
                        className="text-[16px] font-semibold uppercase tracking-[0.02em]"
                        style={{ ...stencilF, color: C.ink }}
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
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...stencilF,
                              background: C.yellow,
                              color: C.yellowInk,
                              ["--tw-ring-color" as string]: C.yellowDeep,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                          : {
                              ...stencilF,
                              background: C.panelHi,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1.5px ${C.line}`,
                              ["--tw-ring-color" as string]: C.yellowDeep,
                              ["--tw-ring-offset-color" as string]: C.panel,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Crate>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Crate className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[11px] font-bold"
                style={{ ...stencilF, background: C.ink, color: C.yellow }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold uppercase tracking-[0.02em]"
                    style={{ ...stencilF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.yellowDeep }}
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
                style={{ ...stencilF, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Crate>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okBg };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnBg };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.panelHi };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Vrachtbrief" sub="Omzet &amp; openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...stencilF,
            background: C.ink,
            color: C.yellow,
            ["--tw-ring-color" as string]: C.yellowDeep,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, accent: true },
          { l: "Openstaand", v: `${open}`, accent: false },
          { l: "Te factureren", v: "€ 1.350", accent: false },
        ].map((s) => (
          <Crate key={s.l} className="p-4">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ ...stencilF, color: C.inkFaint }}
            >
              {s.l}
            </div>
            <div className="mt-3">
              <BigNum value={s.v} accent={s.accent} />
            </div>
          </Crate>
        ))}
      </div>

      <Crate className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgAlt }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...stencilF, color: C.inkFaint }}
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
                    style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ ...stencilF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...stencilF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{
                          ...stencilF,
                          background: m.bg,
                          color: m.fg,
                          boxShadow: `inset 0 0 0 1.5px ${m.fg}55`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-bold tabular-nums"
                      style={{ ...stencilF, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.ink }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...stencilF, color: C.yellow }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...stencilF, color: C.yellow }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Crate>
    </div>
  );
}
