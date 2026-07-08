"use client";

// Concept 188 — "Vouwkaart" · een gevouwen papieren wegenkaart. Vouwlijnen (crease lines) delen het
// scherm in panelen; warm papier met subtiele kreukels en één inkt-accent. Kaart-legenda-typografie,
// coördinaat-labels en opvouwbare secties. Onderscheidt zich van atlas/portolaan (die kaart-CONTENT
// tonen): dit gaat om het FYSIEKE gevouwen-papier-object — vouwen, panelen die open- en dichtklappen.
// Micro-interactie: een sectie "vouwt open" bij klik (deterministisch, CSS grid-rows-transition — geen
// random/Date). Status nooit kleur-alleen (label + icoon). UI-taal Nederlands. Fonts: Newsreader
// (display) + Libre Franklin (tekst) + IBM Plex Mono (legenda/coördinaten).

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
  ChevronDown,
  Compass,
  RefreshCw,
  Milestone,
  Route,
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

// ── Palet — warm papier (vergeeld), zachte vouwschaduwen, één diepe inkt-accent (kaart-blauwgroen),
//    plus een rode routelijn-vonk zoals op een wegenkaart. Alles ademt oud gevouwen kaartpapier. ──
const C = {
  paper: "#f0e9d8", // warm vergeeld papier
  paperDeep: "#e6dcc4", // panelen / diepere vouw
  card: "#faf5e8", // schoon paneel
  ink: "#2c3b38", // diepe kaart-inkt (blauwgroen-zwart)
  inkSoft: "#586460", // secundaire tekst
  inkFaint: "#8f9186", // labels / coördinaten
  line: "#d8cdb4", // fijne rand
  fold: "#c9bfa4", // vouwlijn-kleur
  accent: "#1f6f66", // inkt-accent (kaart-teal)
  accentDeep: "#15544d",
  accentSoft: "#d7e7e3",
  route: "#c0533b", // rode routelijn-vonk
  routeSoft: "#f2ddd4",
  // Semantisch (status)
  ok: "#3f7d54",
  okSoft: "#dceadf",
  warn: "#a9781f",
  warnSoft: "#f2e6cc",
  info: "#1f6f66",
  infoSoft: "#d7e7e3",
  danger: "#b64a3a",
  dangerSoft: "#f2ddd4",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const bodyF = { fontFamily: "var(--font-lab-franklin)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Vouwlijnen — verticale + horizontale creases die het paneel in kaart-vlakken delen.
//    Deterministisch: vaste posities, subtiele licht/schaduw-lijn zoals een echte vouw. ──
function Creases({ cols = 3, rows = 2 }: { cols?: number; rows?: number }) {
  const vs = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const hs = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {vs.map((x) => (
        <span
          key={`v${x}`}
          className="absolute inset-y-0"
          style={{
            left: `${x}%`,
            width: 2,
            background: `linear-gradient(90deg, ${C.fold}00, ${C.fold}88, ${C.white}66)`,
          }}
        />
      ))}
      {hs.map((y) => (
        <span
          key={`h${y}`}
          className="absolute inset-x-0"
          style={{
            top: `${y}%`,
            height: 2,
            background: `linear-gradient(180deg, ${C.fold}00, ${C.fold}88, ${C.white}66)`,
          }}
        />
      ))}
    </div>
  );
}

// Kaart-kompas-mark — een klein legenda-kompas als merkteken.
function CompassMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-sm"
      style={{
        width: size,
        height: size,
        background: C.accent,
        boxShadow: `0 0 0 1px ${C.accentDeep}`,
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
        <path d="M12 2 L15 12 L12 22 L9 12 Z" fill={C.white} opacity="0.9" />
        <path d="M2 12 L12 9 L22 12 L12 15 Z" fill={C.paper} opacity="0.6" />
        <circle cx="12" cy="12" r="1.4" fill={C.route} />
      </svg>
    </span>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.ok, bg: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.info, bg: C.infoSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.warn, bg: C.warnSoft };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Paneel — een gevouwen kaartvlak met vouwlijnen en zachte papierschaduw ──
function Panel({
  children,
  className = "",
  style,
  interactive = false,
  creases = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
  creases?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-sm ${
        interactive
          ? "transition-shadow duration-200 hover:shadow-[0_10px_26px_-14px_rgba(44,59,56,0.4)]"
          : ""
      } ${className}`}
      style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}, 0 1px 0 ${C.white}`, ...style }}
    >
      {creases && <Creases />}
      {children}
    </div>
  );
}

// Sectie-kop — legenda-stijl met kompas-nummer en fijne kaart-scheidingslijn.
function SectionHead({ title, sub, Icon }: { title: string; sub?: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
        style={{ background: C.accentSoft, boxShadow: `inset 0 0 0 1px ${C.accent}44` }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: C.accentDeep }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[20px] font-semibold leading-none tracking-[-0.01em]"
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
        className="ml-2 hidden h-px flex-1 sm:block"
        style={{
          background: `repeating-linear-gradient(90deg, ${C.fold}, ${C.fold} 5px, transparent 5px, transparent 10px)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={1.9} style={{ color: C.accent }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// Match — een kaart-afstandspaal (mijlpaal) met percentage, kaart-teal ring.
function MatchMilestone({ value, size = 54 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.accent} 0deg, ${C.accentDeep} ${deg}deg, ${C.line} ${deg}deg 360deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.card }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...display, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[7px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Mini staaf-spark — kaart-teal, laatste staaf route-rood.
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
            background: i === data.length - 1 ? C.route : `${C.accent}44`,
          }}
        />
      ))}
    </div>
  );
}

// ── Opvouwbaar paneel — de kern-micro-interactie: klik vouwt de sectie open/dicht (grid-rows) ──
function FoldOut({
  title,
  coord,
  defaultOpen = false,
  children,
}: {
  title: string;
  coord: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Panel>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{ ["--tw-ring-color" as string]: C.accent }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-transform duration-300"
          style={{ background: C.accentSoft, transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <ChevronDown size={16} strokeWidth={2.2} style={{ color: C.accentDeep }} />
        </span>
        <span className="flex-1 text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
          {title}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.08em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          {coord}
        </span>
      </button>
      {/* grid-rows transition = deterministische "open-vouw" van het paneel */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t px-4 py-3" style={{ borderColor: C.line }}>
            {children}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept188() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.paper, color: C.ink }}
    >
      {/* Grote paginabrede vouwlijnen — het scherm als één opengevouwen kaart */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Creases cols={4} rows={3} />
        {/* Zachte kreukel-schaduwen op de vouwkruisingen */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120px 80px at 25% 33%, ${C.fold}22, transparent), radial-gradient(120px 80px at 75% 66%, ${C.fold}22, transparent)`,
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Kop — kaart-titelblok (cartouche) */}
        <header className="relative overflow-hidden" style={{ background: C.ink }}>
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <Creases cols={5} rows={2} />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1"
            style={{
              background: `repeating-linear-gradient(90deg, ${C.route}, ${C.route} 8px, transparent 8px, transparent 16px)`,
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
            <div className="flex items-center gap-3.5">
              <CompassMark size={46} />
              <div className="leading-tight">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.32em]"
                  style={{ ...mono, color: C.accentSoft }}
                >
                  Vouwkaart
                </div>
                <div
                  className="text-[24px] font-semibold leading-none tracking-[-0.01em]"
                  style={{ ...display, color: C.white }}
                >
                  Route &amp; Register
                </div>
                <div
                  className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.5)" }}
                >
                  Match · Verificatie · Omzet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
                style={{ ...bodyF, background: "rgba(255,255,255,0.1)", color: C.white }}
              >
                <ShieldCheck
                  size={12}
                  strokeWidth={2}
                  style={{ color: C.accentSoft }}
                  aria-hidden="true"
                />{" "}
                {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-sm text-[12px] font-bold"
                style={{
                  ...mono,
                  background: C.accentSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.accent}`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — legenda-tabs */}
          <nav
            className="relative mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-4 pb-4 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-sm px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c3b38]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.accentSoft,
                          color: C.ink,
                          ["--tw-ring-color" as string]: C.accentSoft,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.72)",
                          ["--tw-ring-color" as string]: C.accentSoft,
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

        <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-8">
          <div
            className="flex items-center justify-center gap-2 border-t pt-6 text-[11px] uppercase tracking-[0.08em]"
            style={{ ...mono, borderColor: C.line, color: C.inkFaint }}
          >
            <Route size={12} aria-hidden="true" /> Vouw open wat je nodig hebt — de rest blijft
            opgevouwen.
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
      {/* Hero — opengevouwen kaartblad met vouwlijnen en cartouche */}
      <Panel creases className="relative">
        <div className="relative max-w-xl p-6 sm:p-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ ...bodyF, background: C.accentSoft, color: C.accentDeep }}
          >
            <Compass size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[42px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je route ligt open.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: C.inkSoft }}
          >
            Eén omweg vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd de route naar
            meer werk onberispelijk verifieerbaar.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.accent }}
            >
              Bekijk matches <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-sm px-5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: C.paperDeep,
                color: C.ink,
                ["--tw-ring-color" as string]: C.accent,
              }}
            >
              <TriangleAlert
                size={14}
                strokeWidth={2.2}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los omweg op
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
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
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="Op match-percentage gerangschikt"
            Icon={Milestone}
          />
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Panel key={o.id} interactive>
                <button
                  onClick={onOpen}
                  className="relative flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.accent }}
                >
                  <MatchMilestone value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="truncate text-[15.5px] font-semibold tracking-[-0.01em]"
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
                          style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
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
              </Panel>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Vertrouwen" sub="Certificaat-dekking" Icon={ShieldCheck} />
          <Panel className="p-5">
            <div className="flex items-center gap-5">
              <span
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${C.accent} 0deg, ${C.accentDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
                }}
                aria-hidden="true"
              >
                <span
                  className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full"
                  style={{ background: C.card }}
                >
                  <span
                    className="text-[26px] font-semibold leading-none"
                    style={{ ...display, color: C.ink }}
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
          </Panel>

          {/* Prioriteit — inkt-cartouche */}
          <Panel className="relative" style={{ background: C.ink }}>
            <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
              <Creases cols={3} rows={2} />
            </div>
            <div className="relative p-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.warnSoft, color: C.warn }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[18px] font-semibold leading-tight tracking-[-0.01em]"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ ...bodyF, color: "rgba(255,255,255,0.72)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c3b38]"
                style={{
                  ...bodyF,
                  background: C.accentSoft,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.accentSoft,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Panel>
        </section>
      </div>

      {/* Opvouwbare legenda — de kern-micro-interactie */}
      <section className="space-y-3">
        <SectionHead title="Kaartlegenda" sub="Vouw een sectie open voor details" Icon={Compass} />
        <div className="space-y-3">
          <FoldOut title="Reisafstand & tarief" coord="N 52.09 · O 5.12" defaultOpen>
            <p className="text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Je gemiddelde reistijd naar open opdrachten is 22 minuten. Drie matches liggen binnen
              je voorkeurstarief van € 55 per uur of hoger.
            </p>
          </FoldOut>
          <FoldOut title="Verificatie-status" coord="N 52.37 · O 4.90">
            <p className="text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén document verloopt
              binnen 23 dagen — vernieuw het om je route open te houden.
            </p>
          </FoldOut>
          <FoldOut title="Openstaande facturen" coord="N 52.51 · O 5.47">
            <p className="text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Eén factuur staat 9 dagen open bij Thuiszorg De Linde (€ 1.350). Stuur een
              vriendelijke herinnering vanaf het facturen-blad.
            </p>
          </FoldOut>
        </div>
      </section>
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
        <SectionHead title="Marktplaats" sub="Open opdrachten" Icon={Route} />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-sm px-3.5 py-2"
            style={{ background: C.card, boxShadow: `0 0 0 1px ${C.line}` }}
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
            className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: C.card,
              boxShadow: `0 0 0 1px ${C.line}`,
              ["--tw-ring-color" as string]: C.accent,
            }}
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook — dismissible, echte error-state */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-sm p-4"
          role="alert"
          style={{ background: C.dangerSoft, boxShadow: `0 0 0 1px ${C.danger}55` }}
        >
          <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold" style={{ ...display, color: C.danger }}>
              Een deel van de kaart kon niet worden geladen
            </div>
            <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
              Er ging iets mis bij het ophalen van de nieuwste opdrachten. Probeer opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2"
            style={{ ...bodyF, color: C.danger, ["--tw-ring-color" as string]: C.danger }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.paperDeep }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paperDeep }}
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
            </Panel>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel
          creases
          className="relative flex flex-col items-center justify-center gap-3 p-16 text-center"
        >
          <div className="relative flex flex-col items-center gap-3">
            <CompassMark size={60} />
            <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
              Geen route gevonden
            </p>
            <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
              Niets gevonden voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om de kaart opnieuw uit te
              vouwen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-1 rounded-sm px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.accent }}
            >
              Zoekterm wissen
            </button>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Panel key={o.id} interactive className="flex flex-col">
              <div
                className="h-1 w-full"
                style={{
                  background: `repeating-linear-gradient(90deg, ${C.route}, ${C.route} 6px, transparent 6px, transparent 12px)`,
                }}
                aria-hidden="true"
              />
              <div className="relative flex items-center gap-3 p-4">
                <MatchMilestone value={o.match} size={48} />
                <div className="min-w-0">
                  <h3
                    className="text-[15px] font-semibold leading-tight tracking-[-0.01em]"
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
                      style={{ ...bodyF, background: C.paperDeep, color: C.inkSoft }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="relative mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px solid ${C.line}`,
                  color: C.ink,
                  ["--tw-ring-color" as string]: C.accent,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Panel>
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
        className="inline-flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...bodyF,
          background: C.card,
          color: C.ink,
          boxShadow: `0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.accent,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel creases className="relative">
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-block rounded-sm px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.accentSoft, color: C.accentDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[26px] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchMilestone value={opdracht.match} size={82} />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} interactive className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-sm"
              style={{ background: C.accentSoft }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={1.9} style={{ color: C.accentDeep }} />
            </span>
            <div
              className="mt-3 text-[16px] font-semibold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={2.6} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} />
          <Panel className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.4} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.accent }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-sm px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.card,
            color: C.ink,
            boxShadow: `0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.accent,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.route }} aria-hidden="true" /> Bewaar
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
        <SectionHead title="Verificatie" sub="Certificaten & documenten" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.accent }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Panel creases className="relative">
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${C.accent} 0deg, ${C.accentDeep} ${dek * 3.6}deg, ${C.line} ${dek * 3.6}deg 360deg)`,
            }}
            aria-hidden="true"
          >
            <span
              className="absolute inset-[9px] flex flex-col items-center justify-center rounded-full"
              style={{ background: C.card }}
            >
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[15px]" style={{ color: C.inkFaint }}>
                  %
                </span>
              </span>
            </span>
          </span>
          <div className="max-w-sm">
            <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elke geverifieerde mijlpaal maakt je route betrouwbaarder. Houd je dekking hoog, dan
              blijft je profiel onberispelijk voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ ...bodyF, background: C.okSoft, color: C.ok }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} interactive className="flex items-center gap-3.5 p-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm"
                style={{ background: m.bg }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#e6dcc4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...bodyF,
                        background: C.paperDeep,
                        color: C.ink,
                        ["--tw-ring-color" as string]: C.accent,
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
        Icon={Milestone}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Panel interactive className="flex items-stretch">
                <span
                  className="w-1.5 shrink-0"
                  style={{
                    background: warn
                      ? `repeating-linear-gradient(180deg, ${C.warn}, ${C.warn} 6px, transparent 6px, transparent 12px)`
                      : C.accent,
                  }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[16px] font-semibold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.accentSoft,
                      color: warn ? C.warn : C.accentDeep,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                        style={{
                          ...mono,
                          background: warn ? C.warnSoft : C.infoSoft,
                          color: warn ? C.warn : C.info,
                        }}
                      >
                        {warn ? (
                          <TriangleAlert size={10} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <Compass size={10} strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[15.5px] font-semibold tracking-[-0.01em]"
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
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.warn,
                            }
                          : {
                              ...bodyF,
                              background: C.ink,
                              color: C.white,
                              ["--tw-ring-color" as string]: C.accent,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>

      {/* Berichten-strook — verrijking */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={FileText} />
        <Panel>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.accentSoft,
                  color: C.ink,
                  boxShadow: `0 0 0 1px ${C.accent}44`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[13px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.route }}
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
        </Panel>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft };
    return { label: "Concept", Icon: FileText, fg: C.info, bg: C.infoSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet & openstaand" Icon={Coins} />
        <button
          className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-[12px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...bodyF, background: C.ink, ["--tw-ring-color" as string]: C.accent }}
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
          <Panel key={s.l} interactive className="p-4">
            <div
              className="h-1 w-10 rounded-full"
              style={{
                background: `repeating-linear-gradient(90deg, ${C.accent}, ${C.accent} 5px, transparent 5px, transparent 10px)`,
              }}
              aria-hidden="true"
            />
            <div className="mt-3 text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[26px] font-semibold leading-none tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paperDeep }}>
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
                    className="transition-colors hover:bg-[#e6dcc4]"
                    style={i === 0 ? undefined : { borderTop: `1px solid ${C.line}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
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
                        style={{ ...bodyF, background: m.bg, color: m.fg }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-semibold tabular-nums"
                      style={{ ...display, color: C.ink }}
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
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.6)" }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.accentSoft }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
