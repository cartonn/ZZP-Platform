"use client";

// Concept 31 — "Perron" · Split-flap vertrekbord — mechanisch tijdschema.
// Een station-/luchthaven-vertrekbord als interface: diep antraciet canvas, split-flap-tegels
// (mechanische letter/cijfer-kaartjes) voor koppen en cijfers, amber signaalkleur, en
// monospace timetable-rijen met kolommen zoals een dienstregeling. Micro-interactie: bij
// hover/actief "klapt" een tegel om (CSS flip, motion-safe). Opdrachten zijn vertrekregels,
// verificatie-statussen zijn bord-status. Mechanisch/analoog — geen scanlines, geen cyber.
// Palet: canvas #0d0f12, fg #f0ede4, accent amber #f5a623, tweede accent groen #4ade80.
// Fonts: --font-lab-spline-mono (display/cijfers) + --font-lab-space (body).

import { useState } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Loader2,
  Send,
  TrainFront,
  Radio,
  Gauge,
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

const C = {
  canvas: "#0d0f12",
  panel: "#14171c",
  panelHi: "#191d23",
  tile: "#1c2128",
  tileDeep: "#0f1216",
  gap: "#05070a",
  ink: "#f0ede4",
  inkSoft: "#c8c4b8",
  muted: "#8b8778",
  faint: "#5f5c52",
  amber: "#f5a623",
  amberDim: "#c78516",
  green: "#4ade80",
  greenDim: "#2f9e5a",
  red: "#f87171",
  blue: "#7dd3fc",
  border: "rgba(240,237,228,0.09)",
  borderHi: "rgba(245,166,35,0.4)",
};

const display = { fontFamily: "var(--font-lab-spline-mono)" };
const body = { fontFamily: "var(--font-lab-space)" };

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

type Tone = { label: string; short: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        short: "OP TIJD",
        fg: C.green,
        bg: "rgba(74,222,128,0.1)",
        Icon: Check,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        short: "VERWACHT",
        fg: C.amber,
        bg: "rgba(245,166,35,0.1)",
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        short: "VERTRAAGD",
        fg: C.amber,
        bg: "rgba(245,166,35,0.1)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        short: "GEANNULEERD",
        fg: C.red,
        bg: "rgba(248,113,113,0.1)",
        Icon: AlertTriangle,
      };
  }
}

/* ---------- Split-flap tegel: mechanisch omklappend kaartje ---------- */
function Flap({
  ch,
  color = C.amber,
  delay = 0,
  big = false,
}: {
  ch: string;
  color?: string;
  delay?: number;
  big?: boolean;
}) {
  const dim = big ? "h-[42px] w-[30px] text-[26px]" : "h-[26px] w-[19px] text-[15px]";
  const isSpace = ch === " ";
  return (
    <span
      className={`relative inline-flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-[3px] font-semibold leading-none motion-safe:group-hover:animate-[flap_0.55s_ease-in-out] motion-safe:group-focus-visible:animate-[flap_0.55s_ease-in-out]`}
      style={{
        background: isSpace ? "transparent" : `linear-gradient(180deg, ${C.tile}, ${C.tileDeep})`,
        border: isSpace ? "1px solid transparent" : `1px solid ${C.border}`,
        color,
        transformOrigin: "center center",
        boxShadow: isSpace ? "none" : "0 1px 0 rgba(255,255,255,0.04) inset",
        animationDelay: `${delay}ms`,
        ...display,
      }}
      aria-hidden="true"
    >
      <span className="tabular-nums">{isSpace ? " " : ch}</span>
      {!isSpace && (
        <span
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2"
          style={{ background: C.gap }}
        />
      )}
    </span>
  );
}

function SplitFlap({
  text,
  color = C.amber,
  big = false,
  className = "",
}: {
  text: string;
  color?: string;
  big?: boolean;
  className?: string;
}) {
  const chars = text.toUpperCase().split("");
  return (
    <span
      className={`group inline-flex flex-wrap gap-[3px] align-middle ${className}`}
      style={{ perspective: "260px" }}
      aria-label={text}
      role="img"
    >
      {chars.map((ch, i) => (
        <Flap key={`${ch}-${i}`} ch={ch} color={color} delay={i * 32} big={big} />
      ))}
    </span>
  );
}

/* ---------- Mechanische staafgrafiek (perron-signaal) ---------- */
function BarSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => {
        const h = 6 + ((d - min) / span) * 26;
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="w-[6px] rounded-[1px]"
            style={{
              height: h,
              background: last ? color : `${color}5a`,
              boxShadow: last ? `0 0 6px ${color}88` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Bord-paneel (het antraciet vertrekbord) ---------- */
function Board({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 48px -34px rgba(0,0,0,0.9)",
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, color = C.amber }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.34em]"
      style={{ color, ...display }}
    >
      {children}
    </p>
  );
}

function MatchGauge({ value, color = C.amber }: { value: number; color?: string }) {
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="relative h-[6px] w-16 overflow-hidden rounded-full"
        style={{ background: C.tileDeep }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}88` }}
        />
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color, ...display }}>
        {value}
      </span>
    </span>
  );
}

const KEYFRAMES = `
@keyframes flap {
  0% { transform: rotateX(0deg); }
  45% { transform: rotateX(-88deg); }
  55% { transform: rotateX(-88deg); }
  100% { transform: rotateX(0deg); }
}
@keyframes blink {
  0%, 62% { opacity: 1; }
  63%, 100% { opacity: 0.25; }
}
`;

export function Concept31() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{KEYFRAMES}</style>
      {/* Subtiele mechanische vignettering */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -10%, rgba(245,166,35,0.05), transparent 60%), radial-gradient(120% 90% at 50% 120%, rgba(0,0,0,0.5), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Rail */}
        <aside className="hidden w-[232px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-[17px] font-bold"
              style={{
                color: C.canvas,
                background: `linear-gradient(180deg, ${C.amber}, ${C.amberDim})`,
                boxShadow: `0 8px 22px -10px ${C.amber}`,
                ...display,
              }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-[0.14em]" style={display}>
                PERRON
              </div>
              <div className="text-[10px] tracking-wide" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <div
            className="mb-4 flex items-center justify-between rounded-md px-3 py-2 text-[10.5px] tracking-[0.2em]"
            style={{
              background: C.tileDeep,
              border: `1px solid ${C.border}`,
              color: C.muted,
              ...display,
            }}
          >
            <span className="flex items-center gap-1.5">
              <Radio size={12} aria-hidden="true" style={{ color: C.green }} />
              LIVE
            </span>
            <span
              className="tabular-nums motion-safe:animate-[blink_1.6s_steps(1)_infinite]"
              style={{ color: C.green }}
            >
              09:24
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.panelHi : "transparent",
                    border: `1px solid ${on ? C.borderHi : "transparent"}`,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.amber : C.faint }} />
                  <span className="flex-1 font-medium tracking-wide">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.amber, boxShadow: `0 0 8px ${C.amber}` }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Board className="p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md text-[12px] font-semibold"
                  style={{
                    color: C.canvas,
                    background: `linear-gradient(180deg, ${C.amber}, ${C.amberDim})`,
                    ...display,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Board>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-5 sm:px-7"
            style={{ borderColor: C.border }}
          >
            <div className="min-w-0">
              <h2
                className="truncate text-[13px] font-semibold uppercase tracking-[0.24em]"
                style={display}
              >
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-md px-3.5 py-2 text-[12px] tracking-wide transition-all hover:border-[rgba(245,166,35,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70 sm:flex"
                style={{ border: `1px solid ${C.border}`, color: C.muted, background: C.tileDeep }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-md p-2.5 transition-all hover:border-[rgba(245,166,35,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
                style={{
                  border: `1px solid ${C.border}`,
                  color: C.inkSoft,
                  background: C.tileDeep,
                }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.amber, boxShadow: `0 0 8px ${C.amber}` }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-md px-3.5 py-1.5 text-[12px] font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
                  style={{
                    color: on ? C.canvas : C.muted,
                    background: on ? C.amber : "transparent",
                    border: `1px solid ${on ? C.amber : C.border}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================ Dashboard ============================ */
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.amber, C.blue, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Vertrekbord-hero */}
      <Board className="overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b px-6 py-3"
          style={{ borderColor: C.border, background: C.tileDeep }}
        >
          <span
            className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.28em]"
            style={{ color: C.muted, ...display }}
          >
            <TrainFront size={13} aria-hidden="true" style={{ color: C.amber }} /> Vertrekbord ·{" "}
            {PROFIEL.plaats}
          </span>
          <span
            className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.green, ...display }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full motion-safe:animate-[blink_1.6s_steps(1)_infinite]"
              style={{ background: C.green }}
              aria-hidden="true"
            />
            Actueel
          </span>
        </div>
        <div className="px-6 py-7">
          <Kicker>Goedemorgen</Kicker>
          <div className="mt-3">
            <SplitFlap text={PROFIEL.naam.split(" ")[0] ?? "Sanne"} color={C.amber} big />
          </div>
          <p className="mt-4 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie opdrachten staan op het bord met een match boven 80%. Je vertrouwensniveau is hoog
            — één credential nadert de vertrektijd en vraagt aandacht.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[11.5px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium tracking-wide"
              style={{
                color: C.green,
                background: "rgba(74,222,128,0.1)",
                border: `1px solid rgba(74,222,128,0.3)`,
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 credentials op tijd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium tracking-wide"
              style={{
                color: C.amber,
                background: "rgba(245,166,35,0.1)",
                border: `1px solid rgba(245,166,35,0.3)`,
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG vertrekt over 23 dagen
            </span>
          </div>
        </div>
      </Board>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.amber;
          return (
            <Board key={k.label} className="p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: C.muted, ...display }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2.5 text-[24px] font-semibold tabular-nums leading-none tracking-tight"
                style={{ ...display, color: col }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <BarSpark data={k.spark} color={col} />
              </div>
            </Board>
          );
        })}
      </div>

      {/* Vertrekregels + credentials */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]"
              style={display}
            >
              <TrainFront size={14} aria-hidden="true" style={{ color: C.amber }} /> Beste matches
            </h2>
            <span className="text-[11px] tracking-wide" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Board className="overflow-hidden">
            {/* Kolomkoppen als dienstregeling */}
            <div
              className="hidden grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] sm:grid"
              style={{ borderColor: C.border, color: C.faint, background: C.tileDeep, ...display }}
            >
              <span>Spoor</span>
              <span>Bestemming</span>
              <span className="text-right">Tarief</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y" style={{ borderColor: C.border }}>
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(245,166,35,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f5a623]/70 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-4"
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-md text-[13px] font-bold tabular-nums"
                    style={{
                      color: C.amber,
                      background: C.tileDeep,
                      border: `1px solid ${C.border}`,
                      ...display,
                    }}
                    aria-label={`Spoor ${i + 1}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12.5px] font-semibold tabular-nums sm:inline"
                    style={{ color: C.inkSoft, ...display }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <MatchGauge value={o.match} color={C.amber} />
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </span>
                </button>
              ))}
            </div>
          </Board>
        </div>

        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em]"
            style={display}
          >
            <ShieldCheck size={14} aria-hidden="true" style={{ color: C.green }} /> Credentials
          </h2>
          <Board className="p-4">
            <div className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: st.fg, boxShadow: `0 0 8px ${st.fg}88` }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: st.fg, ...display }}
                    >
                      {st.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </Board>
        </div>
      </div>
    </div>
  );
}

/* ============================ Marktplaats ============================ */
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Kicker color={C.blue}>Dienstregeling</Kicker>
        <div className="mt-3">
          <SplitFlap text="Vertrekstaat" color={C.ink} />
        </div>
      </div>

      <Board className="flex items-center gap-3 px-4 py-2.5 focus-within:border-[rgba(245,166,35,0.4)]">
        <Search size={16} aria-hidden="true" style={{ color: C.amber }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5f5c52]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...display }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Board>

      {filtered.length === 0 ? (
        <Board className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-md"
            style={{ background: C.tileDeep, border: `1px solid ${C.borderHi}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.amber }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen vertrekken gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-semibold tracking-wide transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
            style={{ color: C.canvas, background: C.amber }}
          >
            Zoekopdracht wissen
          </button>
        </Board>
      ) : (
        <Board className="overflow-hidden">
          <div
            className="hidden grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b px-5 py-2.5 text-[10px] uppercase tracking-[0.16em] md:grid"
            style={{ borderColor: C.border, color: C.faint, background: C.tileDeep, ...display }}
          >
            <span>Tijd</span>
            <span>Bestemming</span>
            <span>Perron</span>
            <span className="text-right">Tarief</span>
            <span className="text-right">Match</span>
          </div>
          <div className="divide-y" style={{ borderColor: C.border }}>
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(245,166,35,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f5a623]/70 md:grid-cols-[auto_1fr_auto_auto_auto] md:gap-4"
              >
                <span
                  className="hidden text-[13px] font-semibold tabular-nums md:inline"
                  style={{ color: C.amber, ...display }}
                >
                  {o.start.replace("Per ", "").replace("Flexibel", "FLEX")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SplitFlap
                      text={o.titel.split(" —")[0] ?? o.titel}
                      color={C.ink}
                      className="hidden sm:inline-flex"
                    />
                    <p className="truncate text-[14px] font-medium sm:hidden">{o.titel}</p>
                  </div>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 truncate text-[11.5px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded px-2 py-0.5 text-[10px] tracking-wide"
                        style={{
                          color: C.inkSoft,
                          background: C.tileDeep,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="hidden text-[12px] font-semibold tabular-nums md:inline"
                  style={{ color: C.inkSoft, ...display }}
                >
                  {o.id.replace("OPD-", "")}
                </span>
                <span
                  className="hidden text-[12.5px] font-semibold tabular-nums md:inline"
                  style={{ color: C.inkSoft, ...display }}
                >
                  {o.tarief.replace(" / uur", "")}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <MatchGauge value={o.match} color={C.amber} />
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    style={{ color: C.faint }}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            ))}
          </div>
        </Board>
      )}
    </div>
  );
}

/* ============================ Opdracht detail ============================ */
function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Board className="overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b px-6 py-3"
          style={{ borderColor: C.border, background: C.tileDeep }}
        >
          <span
            className="text-[10.5px] uppercase tabular-nums tracking-[0.24em]"
            style={{ color: C.muted, ...display }}
          >
            {opdracht.id} · Perron {opdracht.plaats}
          </span>
          <span
            className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.green, ...display }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full motion-safe:animate-[blink_1.6s_steps(1)_infinite]"
              style={{ background: C.green }}
              aria-hidden="true"
            />
            Op tijd
          </span>
        </div>
        <div className="px-6 py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3">
                <SplitFlap text={opdracht.titel.split(" —")[0] ?? opdracht.titel} color={C.amber} />
              </div>
              <h1
                className="text-[20px] font-semibold leading-tight tracking-tight"
                style={display}
              >
                {opdracht.titel}
              </h1>
              <p
                className="mt-2 flex items-center gap-1.5 text-[13px]"
                style={{ color: C.inkSoft }}
              >
                <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-semibold tracking-wide transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70 disabled:opacity-90"
              style={{
                color: C.canvas,
                background: state === "sent" ? C.green : C.amber,
                boxShadow: `0 12px 30px -14px ${state === "sent" ? C.green : C.amber}`,
              }}
            >
              {state === "sending" && (
                <Loader2 size={15} aria-hidden="true" className="animate-spin" />
              )}
              {state === "sent" && <Check size={15} aria-hidden="true" />}
              {state === "idle" && <Send size={14} aria-hidden="true" />}
              {state === "idle"
                ? "Reageer op opdracht"
                : state === "sending"
                  ? "Versturen…"
                  : "Reactie verstuurd"}
            </button>
          </div>
        </div>
      </Board>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.amber },
          { l: "Omvang", v: opdracht.uren, c: C.blue },
          { l: "Start", v: opdracht.start, c: C.ink },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Board key={m.l} className="p-4">
            <p
              className="text-[9.5px] font-medium uppercase tracking-[0.18em]"
              style={{ color: C.muted, ...display }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[15px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c, ...display }}
            >
              {m.v}
            </p>
          </Board>
        ))}
      </div>

      <Board className="p-6">
        <h3
          className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.18em]"
          style={display}
        >
          <Gauge size={15} aria-hidden="true" style={{ color: C.amber }} /> Waarom deze match
        </h3>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.green, ...display }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ background: "rgba(74,222,128,0.12)" }}
                  >
                    <Check size={12} aria-hidden="true" style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.amber, ...display }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{ background: "rgba(245,166,35,0.12)" }}
                  >
                    <Minus size={12} aria-hidden="true" style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Board>
    </div>
  );
}

/* ============================ Verificatie ============================ */
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.green}>Bord-status</Kicker>
        <div className="mt-3">
          <SplitFlap text="Verificatie" color={C.ink} />
        </div>
      </div>

      <Board className="overflow-hidden">
        <div
          className="flex flex-col gap-5 border-b p-6 sm:flex-row sm:items-center"
          style={{ borderColor: C.border }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "rgba(74,222,128,0.1)",
              border: `1px solid rgba(74,222,128,0.32)`,
            }}
          >
            <ShieldCheck size={30} aria-hidden="true" style={{ color: C.green }} />
          </div>
          <div className="flex-1">
            <p className="text-[17px] font-semibold" style={display}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="font-semibold tabular-nums">{verified}</span> van{" "}
              <span className="font-semibold tabular-nums">{CREDENTIALS.length}</span> credentials
              op tijd · <span style={{ color: C.amber }}>{attention} vraagt actie</span>
            </p>
          </div>
          <div className="flex items-end gap-1.5" aria-hidden="true">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <span
                  key={c.naam}
                  className="w-2.5 rounded-sm"
                  style={{
                    height: c.status === "VERIFIED" ? 40 : 22,
                    background: st.fg,
                    boxShadow: `0 0 8px ${st.fg}88`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div
          className="hidden grid-cols-[auto_1fr_auto] items-center gap-4 border-b px-5 py-2.5 text-[10px] uppercase tracking-[0.16em] sm:grid"
          style={{ borderColor: C.border, color: C.faint, background: C.tileDeep, ...display }}
        >
          <span>Bewijsstuk</span>
          <span>Toelichting</span>
          <span className="text-right">Status</span>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.bg, border: `1px solid ${st.fg}44` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={17}
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                      style={{ color: st.fg }}
                    />
                  ) : (
                    <st.Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: st.fg,
                    background: st.bg,
                    border: `1px solid ${st.fg}33`,
                    ...display,
                  }}
                >
                  {st.short}
                </span>
              </div>
            );
          })}
        </div>
      </Board>
    </div>
  );
}

/* ============================ Acties ============================ */
function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: "rgba(245,166,35,0.1)", Icon: AlertTriangle },
    info: { fg: C.blue, bg: "rgba(125,211,252,0.1)", Icon: TrainFront },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.amber}>Attentie</Kicker>
        <div className="mt-3">
          <SplitFlap text="Volgende acties" color={C.ink} />
        </div>
        <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
          Wat nu telt — op volgorde van urgentie, als omroepberichten op het perron.
        </p>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Board
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.bg, border: `1px solid ${t.fg}44` }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-md px-4 py-1.5 text-[12px] font-semibold tracking-wide transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}44` }}
              >
                {a.cta}
              </button>
            </Board>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Facturen ============================ */
function Facturen() {
  const statusTone: Record<string, { fg: string; short: string }> = {
    Betaald: { fg: C.green, short: "VOLDAAN" },
    Openstaand: { fg: C.amber, short: "OPENSTAAND" },
    Concept: { fg: C.muted, short: "CONCEPT" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker color={C.green}>Ledger</Kicker>
          <div className="mt-3">
            <SplitFlap text="Facturen" color={C.ink} />
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12px] font-semibold tracking-wide transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]/70"
          style={{
            color: C.canvas,
            background: C.amber,
            boxShadow: `0 12px 30px -14px ${C.amber}`,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Board className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  color: C.faint,
                  borderBottom: `1px solid ${C.border}`,
                  background: C.tileDeep,
                  ...display,
                }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, short: f.status.toUpperCase() };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft, ...display }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...display }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={display}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                        style={{
                          color: t.fg,
                          background: `${t.fg}1f`,
                          border: `1px solid ${t.fg}33`,
                          ...display,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {t.short}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Board>
    </div>
  );
}
