"use client";

// Concept 205 — "Leder" · verfijnd skeuomorfisme (de skeuo-revival van 2026), terughoudend en messcherp
// leesbaar. Een gestikt leder-portfolio: warme cognac/tan-vlakken met stiksel-randen (border-dashed +
// inset-schaduw), embossed labels en tactiele diepte via inset + drop-shadow — geen goedkope bevels. De
// content leeft op lichte "papier"-kaarten die op het leer liggen; verificatie toont zich als gestempelde
// was-zegels. Elegant, niet kitscherig. Deterministisch (geen random/Date). UI Nederlands.
// Fonts: Fraunces (display, warm serif) + Inter (tekst) + IBM Plex Mono (cijfers/labels).

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
  BadgeCheck,
  Stamp,
  BookOpen,
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

// ── Palet — leer & papier: diep cognac-leder als canvas, licht perkament als leesvlak, wax-groen zegel. ──
const C = {
  leather: "#5a3a24", // diep leder-canvas
  leatherHi: "#6d4a30", // opgetild leer / kop
  leatherLo: "#48301d", // schaduw-leer
  stitch: "#caa878", // stiksel-goud
  paper: "#f5ecdd", // perkament-kaart
  paperHi: "#fbf5ea", // opgelicht papier
  paperLo: "#ebe0cd", // ingedrukt papier
  edge: "#dccbaf", // papier-rand
  ink: "#2c2114", // inkt op perkament
  inkSoft: "#6a5a44", // secundaire inkt
  inkFaint: "#9a8767", // labels
  gold: "#a9762c", // embossed goud-accent
  goldHi: "#c8934a",
  onLeather: "#f3e6d2", // tekst op leer
  onLeatherSoft: "#c9ad86",
  // wax-zegel-statussen
  ok: "#2f6b3f",
  okBg: "#dce9d4",
  wait: "#8a6a1f",
  waitBg: "#efe3c4",
  warn: "#a5591b",
  warnBg: "#f0dcc2",
  bad: "#93331f",
  badBg: "#eccfbf",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Gestikte leder-textuur (subtiel, deterministisch): fijne korrel + zachte lichtval van boven.
const leatherSurface: React.CSSProperties = {
  background: `radial-gradient(120% 90% at 50% -10%, ${C.leatherHi}, ${C.leather} 55%, ${C.leatherLo})`,
};
// Stiksel-rand — gestreepte binnenlijn die het leder "genaaid" maakt.
function stitchBorder(inset = 8): React.CSSProperties {
  return {
    boxShadow: `inset 0 0 0 ${inset}px ${C.leather}, inset 0 0 0 ${inset + 1.5}px ${C.stitch}44`,
  };
}

// ── Status-model — wax-zegel; vorm draagt mee via variant zodat kleur nooit alleen staat. ──
type Variant = "solid" | "outline" | "dashed" | "double";
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; variant: Variant };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Gezegeld", Icon: BadgeCheck, fg: C.ok, bg: C.okBg, variant: "solid" };
    case "SUBMITTED":
      return {
        label: "Ter beoordeling",
        Icon: Clock,
        fg: C.wait,
        bg: C.waitBg,
        variant: "outline",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnBg,
        variant: "dashed",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.bad, bg: C.badBg, variant: "double" };
  }
}
function borderFor(v: Variant, color: string): React.CSSProperties {
  if (v === "dashed") return { border: `1.5px dashed ${color}` };
  if (v === "double") return { border: `2.5px double ${color}` };
  if (v === "outline") return { border: `1px solid ${color}` };
  return { border: `1px solid ${color}55` };
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...bodyF, background: m.bg, color: m.fg, ...borderFor(m.variant, m.fg) }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Wax-zegel — ronde gestempelde schijf met embossed rand; alleen voor geverifieerd/gezegeld.
function WaxSeal({ label = "Geverifieerd", size = 66 }: { label?: string; size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 38% 32%, ${C.goldHi}, ${C.gold} 60%, #7d551c)`,
        boxShadow: `0 6px 14px -4px rgba(40,24,8,0.55), inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 5px rgba(0,0,0,0.3)`,
      }}
      role="img"
      aria-label={label}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: size - 12,
          height: size - 12,
          border: `1.5px dashed rgba(255,255,255,0.5)`,
        }}
      >
        <ShieldCheck
          size={size * 0.4}
          strokeWidth={2}
          style={{ color: "#fff4e2" }}
          aria-hidden="true"
        />
      </span>
    </span>
  );
}

// Papier-kaart — leesvlak dat op het leer ligt met een fijne rand en zachte slagschaduw.
function Paper({
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
      className={`rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.paperHi}, ${C.paper})`,
        boxShadow: `0 10px 24px -14px rgba(30,16,4,0.6), inset 0 0 0 1px ${C.edge}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Embossed label op leer — ingeperste kapitalen met licht reliëf.
function Emboss({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.28em]"
      style={{ ...mono, color: C.onLeatherSoft, textShadow: `0 1px 0 rgba(0,0,0,0.4)` }}
    >
      {children}
    </span>
  );
}

function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const deg = (value / 100) * 360;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${C.goldHi} 0deg, ${C.gold} ${deg}deg, ${C.paperLo} ${deg}deg 360deg)`,
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.2)`,
      }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-[4px] flex flex-col items-center justify-center rounded-full"
        style={{ background: C.paperHi }}
      >
        <span
          className="text-[15px] font-semibold tabular-nums leading-none"
          style={{ ...mono, color: C.gold }}
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

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-7 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            background: i === data.length - 1 ? C.gold : C.paperLo,
          }}
        />
      ))}
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept205() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, ...leatherSurface, color: C.onLeather }}
    >
      {/* Gestikte buitenrand van het portfolio */}
      <div className="min-h-screen" style={stitchBorder(10)}>
        <header className="relative">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-10">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${C.goldHi}, ${C.gold} 65%, #7d551c)`,
                  boxShadow: `0 6px 14px -5px rgba(30,16,4,0.7), inset 0 1px 2px rgba(255,255,255,0.4)`,
                }}
                aria-hidden="true"
              >
                <BookOpen size={22} strokeWidth={2} style={{ color: "#fff4e2" }} />
              </span>
              <div className="leading-tight">
                <Emboss>Leder · Portfolio</Emboss>
                <div
                  className="text-[26px] font-semibold leading-none tracking-tight"
                  style={{ ...display, color: C.onLeather }}
                >
                  Handschrift
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
                  boxShadow: `inset 0 0 0 1px ${C.ok}44`,
                }}
              >
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  ...mono,
                  color: "#fff4e2",
                  background: `radial-gradient(circle at 35% 30%, ${C.goldHi}, ${C.gold} 70%)`,
                  boxShadow: `inset 0 1px 2px rgba(255,255,255,0.4)`,
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — leren tabbladen met stiksel */}
          <nav
            className="mx-auto flex max-w-6xl items-center gap-1.5 overflow-x-auto px-5 pb-5 md:px-10"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="relative shrink-0 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: `linear-gradient(180deg, ${C.paperHi}, ${C.paper})`,
                          color: C.ink,
                          boxShadow: `0 4px 10px -4px rgba(20,10,2,0.6), inset 0 0 0 1px ${C.edge}`,
                          ["--tw-ring-color" as string]: C.gold,
                          ["--tw-ring-offset-color" as string]: C.leather,
                        }
                      : {
                          ...bodyF,
                          background: "rgba(0,0,0,0.14)",
                          color: C.onLeatherSoft,
                          boxShadow: `inset 0 0 0 1px rgba(202,168,120,0.28)`,
                          ["--tw-ring-color" as string]: C.gold,
                          ["--tw-ring-offset-color" as string]: C.leather,
                        }
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-6 md:px-10 md:py-8">
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

        <footer className="mx-auto max-w-6xl px-5 pb-10 md:px-10">
          <div
            className="flex items-center justify-center gap-2 pt-6 text-[11px]"
            style={{
              ...mono,
              color: C.onLeatherSoft,
              borderTop: `1px dashed rgba(202,168,120,0.35)`,
            }}
          >
            <Stamp size={12} aria-hidden="true" /> Gestempeld en genaaid — elk geverifieerd stuk
            draagt zijn zegel.
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-7">
      {/* Hero — perkament met wax-zegel */}
      <Paper className="relative overflow-hidden p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                ...bodyF,
                background: C.waitBg,
                color: C.gold,
                boxShadow: `inset 0 0 0 1px ${C.gold}44`,
              }}
            >
              <Star size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-tight sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              Je portfolio is scherp — drie sterke matches liggen klaar.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Eén stuk vraagt aandacht: je VOG verloopt binnenkort. Regel het en houd je portfolio
              compleet gezegeld.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                  color: "#fff4e2",
                  boxShadow: `0 6px 14px -6px rgba(30,16,4,0.7), inset 0 1px 1px rgba(255,255,255,0.4)`,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.paper,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...bodyF,
                  background: C.paperLo,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.edge}`,
                  ["--tw-ring-color" as string]: C.gold,
                  ["--tw-ring-offset-color" as string]: C.paper,
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
          <WaxSeal size={96} />
        </div>
      </Paper>

      {/* KPI-kaarten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Paper key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  ...mono,
                  background: k.up ? C.okBg : C.paperLo,
                  color: k.up ? C.ok : C.inkSoft,
                }}
              >
                {k.trend}
              </span>
            </div>
            <div
              className="mt-2 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Paper>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-3">
          <Emboss>Aanbevolen matches</Emboss>
          <div className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <Paper key={o.id}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.gold }}
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
                            background: C.paperLo,
                            color: C.inkSoft,
                            boxShadow: `inset 0 0 0 1px ${C.edge}`,
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
              </Paper>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Emboss>Vertrouwen</Emboss>
          <Paper className="p-5">
            <div className="flex items-center gap-5">
              <WaxSeal size={76} />
              <div>
                <div
                  className="text-[24px] font-semibold tabular-nums leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  {dek}%
                </div>
                <p className="mt-1.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {verified}/{CREDENTIALS.length} certificaten gezegeld. Opdrachtgevers zien alleen
                  geverifieerde documenten.
                </p>
              </div>
            </div>
          </Paper>

          {/* Prioriteit — donker leren kaartje met stiksel */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ ...leatherSurface, ...stitchBorder(6), color: C.onLeather }}
          >
            <Emboss>Voorgrond</Emboss>
            <h3
              className="mt-2 text-[19px] font-semibold leading-tight tracking-tight"
              style={{ ...display, color: C.onLeather }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: C.onLeatherSoft }}
            >
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...bodyF,
                background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
                color: "#fff4e2",
                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4)`,
                ["--tw-ring-color" as string]: C.gold,
                ["--tw-ring-offset-color" as string]: C.leather,
              }}
            >
              {warn.cta} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — met zoek + skeleton + empty ─────────────────────────────────────
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
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
        <h2
          className="text-[22px] font-semibold tracking-tight"
          style={{ ...display, color: C.onLeather }}
        >
          Marktplaats
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: C.paper, boxShadow: `inset 0 0 0 1px ${C.edge}` }}
          >
            <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
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
              background: C.paper,
              boxShadow: `inset 0 0 0 1px ${C.edge}`,
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.leather,
            }}
          >
            <Search
              size={15}
              className={loading ? "animate-pulse" : ""}
              style={{ color: C.gold }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Paper key={i} className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-12 w-12 shrink-0 animate-pulse rounded-full"
                  style={{ background: C.paperLo }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.paperLo }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.edge }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.edge }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.edge }}
                />
              </div>
            </Paper>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Paper className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: C.waitBg }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={1.6} style={{ color: C.gold }} />
          </span>
          <p
            className="text-[20px] font-semibold tracking-tight"
            style={{ ...display, color: C.ink }}
          >
            Niets in het register
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen match voor &ldquo;{q}&rdquo;. Pas je zoekterm aan en het register vult zich
            opnieuw.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...bodyF,
              background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
              color: "#fff4e2",
              ["--tw-ring-color" as string]: C.gold,
              ["--tw-ring-offset-color" as string]: C.leather,
            }}
          >
            Zoekterm wissen
          </button>
        </Paper>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Paper key={o.id} className="flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4">
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
              <div className="px-4 pb-4">
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
                        background: C.paperLo,
                        color: C.inkSoft,
                        boxShadow: `inset 0 0 0 1px ${C.edge}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: `1px dashed ${C.edge}`,
                  color: C.gold,
                  ["--tw-ring-color" as string]: C.gold,
                }}
              >
                Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Paper>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ───────────────────────────────────────────────────────────────
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
          background: C.paper,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.edge}`,
          ["--tw-ring-color" as string]: C.gold,
          ["--tw-ring-offset-color" as string]: C.leather,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Paper className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: C.waitBg, color: C.gold }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.06] tracking-tight sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchRing value={opdracht.match} size={80} />
        </div>
      </Paper>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Paper key={f.l} className="p-4">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: C.waitBg }}
              aria-hidden="true"
            >
              <f.Icon size={15} strokeWidth={2} style={{ color: C.gold }} />
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
          </Paper>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <Emboss>Waarom dit past</Emboss>
          <Paper className="p-5">
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
          </Paper>
        </section>
        <section className="space-y-3">
          <Emboss>Om te overwegen</Emboss>
          <Paper className="p-5">
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
          </Paper>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
            color: "#fff4e2",
            boxShadow: `0 6px 14px -6px rgba(30,16,4,0.7), inset 0 1px 1px rgba(255,255,255,0.4)`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.leather,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: C.paper,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.edge}`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.leather,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie — gestempelde zegels ──────────────────────────────────────────────
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="flex items-center gap-2 text-[22px] font-semibold tracking-tight"
          style={{ ...display, color: C.onLeather }}
        >
          <Stamp size={20} style={{ color: C.goldHi }} aria-hidden="true" /> Zegelkamer
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
            color: "#fff4e2",
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4)`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.leather,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Paper className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <WaxSeal size={100} />
          <div className="max-w-sm">
            <div
              className="text-[22px] font-semibold tracking-tight"
              style={{ ...display, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} gezegeld · {dek}%
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk gezegeld certificaat brengt je portfolio scherper in beeld. Houd je dekking hoog,
              dan blijf je onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <div className="mt-3">
              <StatusTag status="VERIFIED" />
            </div>
          </div>
        </div>
      </Paper>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Paper key={c.naam} className="flex items-center gap-3.5 p-4">
              {c.status === "VERIFIED" ? (
                <WaxSeal size={44} label={m.label} />
              ) : (
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg, ...borderFor(m.variant, m.fg) }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2.2} style={{ color: m.fg }} />
                </span>
              )}
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
                        background: C.paperLo,
                        color: C.ink,
                        boxShadow: `inset 0 0 0 1px ${C.edge}`,
                        ["--tw-ring-color" as string]: C.gold,
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
            </Paper>
          );
        })}
      </div>
    </div>
  );
}

// ── Acties (next-action) ──────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <h2
        className="text-[22px] font-semibold tracking-tight"
        style={{ ...display, color: C.onLeather }}
      >
        Volgende beste acties
      </h2>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Paper className="flex items-stretch overflow-hidden">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: warn ? C.warn : C.gold }}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums"
                    style={{
                      ...mono,
                      background: warn ? C.warnBg : C.waitBg,
                      color: warn ? C.warn : C.gold,
                      boxShadow: `inset 0 0 0 1px ${(warn ? C.warn : C.gold) + "44"}`,
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
                          background: warn ? C.warnBg : C.waitBg,
                          color: warn ? C.warn : C.gold,
                        }}
                      >
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
                    <button
                      className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={
                        warn
                          ? {
                              ...bodyF,
                              background: C.warn,
                              color: "#fff4e2",
                              ["--tw-ring-color" as string]: C.warn,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                          : {
                              ...bodyF,
                              background: C.paperLo,
                              color: C.ink,
                              boxShadow: `inset 0 0 0 1px ${C.edge}`,
                              ["--tw-ring-color" as string]: C.gold,
                              ["--tw-ring-offset-color" as string]: C.paper,
                            }
                      }
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Paper>
            </li>
          );
        })}
      </ol>

      <section className="space-y-3">
        <Emboss>Berichten</Emboss>
        <Paper>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={i === 0 ? undefined : { borderTop: `1px dashed ${C.edge}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  ...mono,
                  background: C.waitBg,
                  color: C.gold,
                  boxShadow: `inset 0 0 0 1px ${C.gold}33`,
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
                      style={{ background: C.gold }}
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
        </Paper>
      </section>
    </div>
  );
}

// ── Facturen ──────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { fg: string; bg: string; Icon: LucideIcon; dashed: boolean } => {
    if (status === "Betaald") return { fg: C.ok, bg: C.okBg, Icon: Check, dashed: false };
    if (status === "Openstaand") return { fg: C.warn, bg: C.warnBg, Icon: Clock, dashed: true };
    return { fg: C.inkSoft, bg: C.paperLo, Icon: FileText, dashed: false };
  };
  const betaald = "€ 8.622";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[22px] font-semibold tracking-tight"
          style={{ ...display, color: C.onLeather }}
        >
          Grootboek
        </h2>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...bodyF,
            background: `linear-gradient(180deg, ${C.goldHi}, ${C.gold})`,
            color: "#fff4e2",
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.4)`,
            ["--tw-ring-color" as string]: C.gold,
            ["--tw-ring-offset-color" as string]: C.leather,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald },
          { l: "Openstaand", v: `${FACTUREN.filter((f) => f.status === "Openstaand").length}` },
          { l: "Te factureren", v: "€ 1.350" },
        ].map((s) => (
          <Paper key={s.l} className="p-4">
            <div className="text-[11px] font-medium" style={{ ...bodyF, color: C.inkFaint }}>
              {s.l}
            </div>
            <div
              className="mt-1 text-[24px] font-semibold tabular-nums leading-none"
              style={{ ...mono, color: C.ink }}
            >
              {s.v}
            </div>
          </Paper>
        ))}
      </div>

      <Paper className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.paperLo }}>
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
                    style={i === 0 ? undefined : { borderTop: `1px dashed ${C.edge}` }}
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
                          border: m.dashed ? `1.5px dashed ${m.fg}` : `1px solid ${m.fg}44`,
                        }}
                      >
                        <m.Icon size={11} strokeWidth={2.4} aria-hidden="true" /> {f.status}
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
              <tr style={{ ...leatherSurface }}>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.onLeatherSoft }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-bold tabular-nums"
                  style={{ ...mono, color: C.onLeather }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Paper>
    </div>
  );
}
