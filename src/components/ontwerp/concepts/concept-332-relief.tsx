"use client";

// Concept 332 — "Reliëf" · neumorfisme, levend tactiel mono-reliëf (soft).
// Monochroom soft-UI: alles lijkt geëmboss/geperst uit één materiaal. Subtiele dubbele schaduw
// (licht van linksboven, donker rechtsonder) geeft opstaande knoppen en ingedrukte velden.
// Eén ingetogen accent (indigo). De 2026-trend "living/tactile interface" — maar VERFIJND:
// contrast blijft bewaakt (tekst nooit low-contrast), status altijd label + icoon. Ingedrukte
// (inset) panelen dragen inhoud; opstaande (raised) elementen zijn interactief; actieve staat is
// "ingedrukt". Rustig, materieel, premium.
// Fonts: --font-lab-manrope (koppen) + --font-lab-jakarta (tekst) + --font-lab-mono (cijfers).

import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  Fingerprint,
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

/* ---------- Palet (monochroom klei-grijs, één indigo accent) ---------- */

const C = {
  base: "#e7eaf0", // het materiaal
  baseHi: "#f4f6fb",
  baseLo: "#d3d8e2",
  ink: "#2a2f3a", // hoog contrast op klei
  inkSoft: "#464c5a",
  sub: "#5c6373",
  faint: "#868da0",
  accent: "#4f56d6",
  accentInk: "#3a40b8", // donker genoeg voor tekst op klei
  accentSoft: "#e0e2f7",
  ok: "#1c7a4a",
  okSoft: "#dbeee4",
  info: "#2560c4",
  infoSoft: "#dce8fb",
  warn: "#9a6100",
  warnSoft: "#f3e7cf",
  alert: "#bb2f2f",
  alertSoft: "#f5dedd",
  // schaduwkleuren voor het reliëf
  light: "#ffffff",
  dark: "#b9bfcb",
};

const head = { fontFamily: "var(--font-lab-manrope), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f56d6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7eaf0]";

// Reliëf-schaduwen — de kern van de designtaal.
const raised = `6px 6px 14px ${C.dark}, -6px -6px 14px ${C.light}`;
const raisedSm = `4px 4px 9px ${C.dark}, -4px -4px 9px ${C.light}`;
const inset = `inset 5px 5px 11px ${C.dark}, inset -5px -5px 11px ${C.light}`;
const insetSm = `inset 3px 3px 7px ${C.dark}, inset -3px -3px 7px ${C.light}`;

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.baseLo };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Bouwstenen ---------- */

// Opstaand paneel — lijkt uit het materiaal geperst.
function Raised({
  children,
  className = "",
  sm = false,
}: {
  children: React.ReactNode;
  className?: string;
  sm?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{ background: C.base, boxShadow: sm ? raisedSm : raised }}
    >
      {children}
    </div>
  );
}

// Ingedrukt paneel — inhoudsvlak, "geperst in het materiaal".
function Inset({
  children,
  className = "",
  sm = false,
}: {
  children: React.ReactNode;
  className?: string;
  sm?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl ${className}`}
      style={{ background: C.base, boxShadow: sm ? insetSm : inset }}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: C.base, boxShadow: insetSm }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const w = 76;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Reliëf-voortgang: een ingedrukte goot met een opstaande gevulde balk.
function ReliefBar({ value, color = C.accent }: { value: number; color?: string }) {
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full"
      style={{ background: C.base, boxShadow: insetSm }}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(6, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${C.accent})`,
          boxShadow: `2px 2px 5px ${C.dark}`,
        }}
      />
    </div>
  );
}

// Ronde reliëf-meter: opstaande knop met ingedrukte ring en boog.
function ReliefDial({ value, size = 74, label }: { value: number; size?: number; label?: string }) {
  const stroke = size >= 90 ? 7 : 5.5;
  const r = size / 2 - stroke - 4;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: C.base, boxShadow: raisedSm }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.baseLo}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-bold tabular-nums"
          style={{ ...mono, color: C.ink, fontSize: size >= 90 ? 20 : 14 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide"
            style={{ color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

// Interactieve reliëf-knop (raised → ingedrukt bij active).
function SoftButton({
  children,
  onClick,
  primary = false,
  className = "",
  disabled = false,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl text-[12.5px] font-semibold transition-all active:shadow-[inset_3px_3px_7px_#b9bfcb,inset_-3px_-3px_7px_#ffffff] disabled:opacity-80 ${RING} ${className}`}
      style={{
        background: primary ? C.accent : C.base,
        color: primary ? "#fff" : C.ink,
        boxShadow: primary ? `4px 4px 9px ${C.dark}, -4px -4px 9px ${C.light}` : raisedSm,
      }}
    >
      {children}
    </button>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-1 pt-7">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ ...mono, color: C.accentInk }}
        >
          <Fingerprint size={12} aria-hidden="true" /> {kicker}
        </p>
        <h1
          className="mt-2 text-[28px] font-extrabold leading-none tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[13px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept332() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 320);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.base, color: C.ink }}
    >
      <style>{`@keyframes rf-fade{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
      @keyframes rf-pulse{0%,100%{opacity:.55}50%{opacity:.85}}`}</style>

      {/* Top-balk als opstaand reliëf */}
      <header className="px-4 pt-4">
        <Raised className="flex h-16 items-center gap-3 px-4" sm>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-[15px] font-extrabold"
            style={{ ...head, background: C.accent, color: "#fff", boxShadow: raisedSm }}
            aria-hidden="true"
          >
            Z
          </span>
          <div className="leading-tight">
            <span className="text-[15px] font-extrabold tracking-tight" style={head}>
              Reliëf
            </span>
            <p className="text-[10.5px]" style={{ color: C.faint }}>
              ZZP-werkruimte
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              aria-label="Zoeken"
              className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:shadow-[inset_3px_3px_7px_#b9bfcb,inset_-3px_-3px_7px_#ffffff] ${RING}`}
              style={{ background: C.base, color: C.sub, boxShadow: raisedSm }}
            >
              <Search size={16} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:shadow-[inset_3px_3px_7px_#b9bfcb,inset_-3px_-3px_7px_#ffffff] ${RING}`}
              style={{ background: C.base, color: C.sub, boxShadow: raisedSm }}
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: C.accent }}
                aria-hidden="true"
              />
            </button>
            <div
              className="flex items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-3"
              style={{ boxShadow: insetSm }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ ...mono, background: C.accent, color: "#fff", boxShadow: raisedSm }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12px] font-bold">{PROFIEL.naam}</p>
                <p
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={10} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </Raised>
      </header>

      {/* Scherm-tabs als reliëf-pillen */}
      <nav className="flex gap-2 overflow-x-auto px-4 py-3" aria-label="Hoofdnavigatie">
        {SCREENS.map((s) => {
          const Icon = NAV_ICONS[s.key];
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[12.5px] transition-all ${RING}`}
              style={{
                color: on ? C.accentInk : C.sub,
                background: C.base,
                boxShadow: on ? insetSm : raisedSm,
                fontWeight: on ? 700 : 500,
              }}
            >
              <Icon size={15} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "rf-fade 0.34s ease" }}>
        {!ready ? (
          <ScreenSkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-7" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-52 rounded-2xl"
        style={{ background: C.base, boxShadow: insetSm, animation: "rf-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-3xl"
        style={{ background: C.base, boxShadow: inset, animation: "rf-pulse 1.3s infinite" }}
      />
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-3xl"
            style={{ background: C.base, boxShadow: raisedSm, animation: "rf-pulse 1.3s infinite" }}
          />
        ))}
      </div>
    </div>
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
  const [focus, setFocus] = useState(0);
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const hero = (KPIS[focus] ?? KPIS[0]) as (typeof KPIS)[number];
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Vandaag"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles uit één materiaal — wat opstaat is aan te raken, wat ingedrukt is draagt je gegevens."
      />

      <div className="space-y-5 px-6 py-5">
        {/* Hero — ingedrukt paneel met opstaande dial */}
        <Inset className="overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.accentInk }}
              >
                <Layers size={13} aria-hidden="true" /> {hero.label}
              </p>
              <p
                className="mt-2 text-[44px] font-extrabold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {hero.value}
              </p>
              <p className="mt-2 flex items-center gap-2 text-[12.5px]" style={{ color: C.sub }}>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{
                    background: C.base,
                    boxShadow: raisedSm,
                    color: hero.up ? C.ok : C.warn,
                  }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                t.o.v. vorige periode
              </p>
            </div>
            <ReliefDial value={matchAvg} size={92} label="match" />
          </div>

          <div
            className="mt-5 flex gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Kies kerncijfer"
          >
            {KPIS.map((k, i) => {
              const on = i === focus;
              return (
                <button
                  key={k.label}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFocus(i)}
                  className={`flex flex-1 shrink-0 flex-col items-start gap-1 rounded-2xl px-3 py-2.5 text-left transition-all ${RING}`}
                  style={{ background: C.base, boxShadow: on ? insetSm : raisedSm }}
                >
                  <span
                    className="whitespace-nowrap text-[10.5px] font-semibold"
                    style={{ color: on ? C.accentInk : C.sub }}
                  >
                    {k.label}
                  </span>
                  <span
                    className="text-[15px] font-bold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {k.value}
                  </span>
                </button>
              );
            })}
          </div>
        </Inset>

        {/* KPI-tegels — opstaand */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Raised key={k.label} className="p-4" sm>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={11} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={11} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-1.5 text-[22px] font-extrabold tabular-nums leading-none"
                style={{ ...mono, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-2.5">
                <MiniSpark data={k.spark} color={C.accent} />
              </div>
            </Raised>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende actie */}
          {warn && (
            <Raised className="p-5 lg:col-span-2">
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.warn }}
              >
                <AlertTriangle size={13} aria-hidden="true" /> Vraagt actie
              </p>
              <h2
                className="mt-2 text-[19px] font-extrabold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <SoftButton onClick={() => onGo("verificatie")} primary className="mt-4 px-4 py-2.5">
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </SoftButton>
            </Raised>
          )}

          {/* Berichten error→loading→ok */}
          <Raised className="p-5">
            <div className="flex items-center justify-between">
              <h3
                className="flex items-center gap-1.5 text-[13px] font-bold"
                style={{ ...head, color: C.ink }}
              >
                <Bell size={15} style={{ color: C.accent }} aria-hidden="true" /> Laatste bericht
              </h3>
              <button
                onClick={() => onGo("acties")}
                className={`text-[11px] font-bold ${RING}`}
                style={{ color: C.accentInk }}
              >
                Alles
              </button>
            </div>
            <Inset className="mt-3 p-3.5" sm>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <XCircle
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12px]" style={{ color: C.sub }}>
                    Kon berichten niet laden.
                  </p>
                  <SoftButton onClick={retry} className="mt-2 px-3 py-1.5">
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </SoftButton>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.baseLo,
                      width: "60%",
                      animation: "rf-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded-full"
                    style={{
                      background: C.baseLo,
                      width: "85%",
                      animation: "rf-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && BERICHTEN[0] && (
                <div>
                  <p className="text-[12.5px] font-bold" style={{ color: C.ink }}>
                    {BERICHTEN[0].van}
                  </p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: C.sub }}>
                    {BERICHTEN[0].preview}
                  </p>
                </div>
              )}
            </Inset>
          </Raised>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2
              className="flex items-center gap-2 text-[16px] font-extrabold"
              style={{ ...head, color: C.ink }}
            >
              <Layers size={16} style={{ color: C.accent }} aria-hidden="true" /> Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 text-[12.5px] font-bold ${RING}`}
              style={{ color: C.accentInk }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`text-left ${RING} rounded-3xl`}
              >
                <Raised className="h-full p-4" sm>
                  <div className="flex items-start justify-between">
                    <ReliefDial value={o.match} size={54} label="match" />
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[14.5px] font-extrabold leading-snug"
                    style={{ ...head, color: C.ink }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 truncate text-[12px]"
                    style={{ color: C.sub }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-[13px] font-bold tabular-nums"
                      style={{ ...mono, color: C.accentInk }}
                    >
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Raised>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = useMemo(
    () =>
      OPDRACHTEN.filter(
        (o) =>
          o.titel.toLowerCase().includes(q.toLowerCase()) ||
          o.plaats.toLowerCase().includes(q.toLowerCase()) ||
          o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
      ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief))),
    [q, sort],
  );

  return (
    <div>
      <PageHead
        kicker="Kansen"
        title="Marktplaats"
        sub="Opdrachten die bij je passen — tik een kaart aan om ze te openen."
        right={
          <div
            className="inline-flex items-center gap-1 rounded-2xl p-1"
            style={{ background: C.base, boxShadow: insetSm }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all ${RING}`}
                  style={{
                    background: C.base,
                    color: on ? C.accentInk : C.sub,
                    boxShadow: on ? raisedSm : "none",
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5">
        <Inset className="mb-4 flex items-center gap-2.5 px-4 py-3" sm>
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
        </Inset>

        {filtered.length === 0 ? (
          <Inset className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.base, boxShadow: raisedSm }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.accent }} />
            </span>
            <p className="mt-4 text-[15px] font-extrabold" style={{ ...head, color: C.ink }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <SoftButton onClick={() => setQ("")} className="mt-4 px-4 py-2">
              Zoekopdracht wissen
            </SoftButton>
          </Inset>
        ) : (
          <ul className="space-y-4">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Raised className="p-4" sm>
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
                        style={{
                          ...mono,
                          background: C.base,
                          boxShadow: insetSm,
                          color: i === 0 ? C.accentInk : C.faint,
                        }}
                      >
                        {i + 1}
                      </span>
                      <ReliefDial value={o.match} size={56} label="match" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10px] font-bold tabular-nums"
                          style={{ ...mono, color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{ background: C.base, boxShadow: insetSm, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1.5 text-[15px] font-extrabold"
                        style={{ ...head, color: C.ink }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                        <span
                          className="font-bold tabular-nums"
                          style={{ ...mono, color: C.accentInk }}
                        >
                          {o.tarief}
                        </span>
                        <span style={{ color: C.sub }}>{o.uren}</span>
                        <span style={{ color: C.sub }}>{o.start}</span>
                      </div>
                    </div>
                    <SoftButton
                      onClick={() => onOpen(o.id)}
                      primary
                      className="self-center px-3.5 py-2"
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </SoftButton>
                  </div>
                </Raised>
              </li>
            ))}
          </ul>
        )}
      </div>
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
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <SoftButton onClick={onBack} className="px-3.5 py-2">
              Terug
            </SoftButton>
            <SoftButton onClick={react} primary disabled={state !== "idle"} className="px-4 py-2">
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </SoftButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <Raised key={m.l} className="p-4" sm>
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[17px] font-extrabold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {m.v}
                </p>
              </Raised>
            ))}
          </div>

          <Inset className="p-5">
            <h3 className="text-[16px] font-extrabold" style={{ ...head, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.base, boxShadow: raisedSm }}
                      >
                        <Check
                          size={11}
                          strokeWidth={3}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.base, boxShadow: raisedSm }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.6}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Inset>
        </div>

        <div className="space-y-4">
          <Raised className="p-5">
            <div className="flex items-center gap-4">
              <ReliefDial value={opdracht.match} size={72} label="match" />
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: C.accentInk }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
                  Sterke koppeling met je profiel — reageer voor het beste resultaat.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ReliefBar value={opdracht.match} />
            </div>
          </Raised>
          <Raised className="p-5">
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.accentInk }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: C.base, boxShadow: insetSm, color: t.fg }}
                    >
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </Raised>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Vertrouwen"
        title="Verificatie"
        sub="Je vertrouwensniveau — elk geverifieerd bewijsstuk verstevigt je profiel."
      />
      <div className="space-y-5 px-6 py-5">
        <Inset className="flex flex-wrap items-center gap-5 p-6">
          <ReliefDial value={pct} size={92} label="verified" />
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.accentInk }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p
              className="mt-2 text-[24px] font-extrabold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {verified}/{total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.sub }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige score.
            </p>
            <div className="mt-3 max-w-xs">
              <ReliefBar value={pct} />
            </div>
          </div>
        </Inset>

        {expiring && (
          <Raised className="flex flex-wrap items-center gap-4 p-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: C.base, boxShadow: insetSm, color: C.warn }}
              aria-hidden="true"
            >
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om je vertrouwensniveau te behouden.
              </p>
            </div>
            <SoftButton onClick={() => onGo("acties")} className="px-3.5 py-2">
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </SoftButton>
          </Raised>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Raised key={c.naam} className="flex items-center gap-3.5 p-4" sm>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: C.base, boxShadow: insetSm, color: t.fg }}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </Raised>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Te doen"
        title="Volgende acties"
        sub="Geordend op urgentie — rond af en houd je werkruimte strak."
      />
      <div className="space-y-4 px-6 py-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.info;
          return (
            <Raised key={a.titel} className="flex flex-wrap items-start gap-4 p-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[15px] font-bold tabular-nums"
                style={{ ...mono, background: C.base, boxShadow: insetSm, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ ...mono, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold" style={{ ...head, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <SoftButton
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                primary={warn}
                className="px-3.5 py-2"
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </SoftButton>
            </Raised>
          );
        })}

        <Inset className="flex items-center gap-3 p-4" sm>
          <Fingerprint size={16} strokeWidth={2.2} style={{ color: C.accent }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles rustig. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </Inset>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Omzet"
        title="Facturen"
        sub="Overzicht van wat binnen is en wat nog onderweg is."
        right={
          <SoftButton primary className="px-3.5 py-2">
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </SoftButton>
        }
      />
      <div className="space-y-5 px-6 py-5">
        <Inset className="flex flex-wrap items-center gap-5 p-5">
          <ReliefDial value={pct} size={80} label="betaald" />
          <div className="flex flex-1 flex-wrap gap-6">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.ok }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[24px] font-extrabold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.warn }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[24px] font-extrabold tabular-nums"
                style={{ ...mono, color: C.ink }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
            <div className="min-w-[140px] flex-1 self-center">
              <ReliefBar value={pct} />
            </div>
          </div>
        </Inset>

        <Inset className="overflow-hidden p-1.5">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  <th className="px-4 py-3">Nummer</th>
                  <th className="px-4 py-3">Klant</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                  <th className="px-4 py-3 text-right">Bedrag</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {FACTUREN.map((f) => {
                  const t = factuurTone(f.status);
                  return (
                    <tr key={f.nr}>
                      <td className="px-2 py-2">
                        <Raised className="flex items-center px-3 py-3" sm>
                          <span
                            className="w-28 text-[12px] font-bold tabular-nums"
                            style={{ ...mono, color: C.sub }}
                          >
                            {f.nr}
                          </span>
                        </Raised>
                      </td>
                      <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                        {f.klant}
                      </td>
                      <td
                        className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                        style={{ ...mono, color: C.faint }}
                      >
                        {f.datum}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right text-[13px] font-bold tabular-nums"
                        style={{ ...mono, color: C.ink }}
                      >
                        {f.bedrag}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ color: t.fg, background: C.base, boxShadow: insetSm }}
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
        </Inset>
      </div>
    </div>
  );
}
