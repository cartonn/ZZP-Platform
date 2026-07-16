"use client";

// Concept 348 — "Kwintet" · een partituur als layout-metafoor, licht en warm.
// De vijf-lijns notenbalk is het ritme van het scherm: kern-cijfers staan als noten op de balk,
// maatstrepen scheiden de secties, en de informatie-hiërarchie leest als een staccato-cadans —
// kort, ritmisch, leesbaar. Palet: diep aubergine/paars als inkt, warm ivoor als papier, en één
// goud-accent voor wat glanst (match, waarde, actie). Anders dan een klassieke bladmuziek-render:
// hier is het modern, ruim, en gericht op vertrouwen — verificatie is de "toonsoort" die alles
// stemt. Elegante Cormorant-koppen op een heldere Jakarta-basis; cijfers in mono, als maatgetallen.
// Fonts: --font-lab-cormorant (koppen) + --font-lab-jakarta (body) + --font-lab-mono (cijfers).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
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
  ChevronRight,
  ChevronLeft,
  Music,
  Sparkles,
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

/* ---------- Palet — aubergine-inkt, ivoor-papier, goud-accent ---------- */

const C = {
  canvas: "#f4ecdf", // warm ivoor
  surface: "#fbf5ea", // blad
  surfaceAlt: "#f3e9d8",
  raise: "#ffffff",
  deep: "#2b1d33", // aubergine bijna-zwart (donkere balk)
  deepAlt: "#3a2745",
  ink: "#2c2030", // aubergine-inkt tekst
  inkSoft: "#4d3d52",
  sub: "#6f5f73", // secundaire tekst (contrast-veilig op ivoor)
  faint: "#9d8f9f",
  line: "#e2d4c2", // maatlijn / haarlijn
  lineSoft: "#ece0d0",
  staff: "#d8c9b6", // notenbalk-lijn
  aubergine: "#5a3a63", // primair paars
  aubergineSoft: "#efe4ef",
  gold: "#9a6f22", // goud-tekst (contrast-veilig op ivoor)
  goldBright: "#c9992f", // goud-fill op donker
  goldSoft: "#f4e9cf",
  // Status
  ok: "#3f6b4e",
  okSoft: "#e6efe4",
  info: "#3f5f80",
  infoSoft: "#e6ecf3",
  warn: "#9a6f22",
  warnSoft: "#f4e9cf",
  alert: "#933a2b",
  alertSoft: "#f4e2dc",
};

const display = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-jakarta), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a3a63] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf5ea]";

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
  return { fg: C.faint, soft: C.lineSoft };
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

/* ---------- Bouwstenen: de partituur-taal ---------- */

// Notenbalk-motief: vijf lijnen met noten die een reeks waarden "spelen".
function StaffMotif({
  data,
  color = C.aubergine,
  accent = C.goldBright,
  w = 300,
  h = 88,
}: {
  data: number[];
  color?: string;
  accent?: string;
  w?: number;
  h?: number;
}) {
  const lines = 5;
  const top = 12;
  const gap = (h - top * 2) / (lines - 1);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const noteY = (v: number) => h - top - ((v - min) / span) * (h - top * 2);
  const step = (w - 40) / (data.length - 1 || 1);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: h }}
      aria-hidden="true"
    >
      {/* Vijf notenbalk-lijnen */}
      {Array.from({ length: lines }).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={top + i * gap}
          x2={w}
          y2={top + i * gap}
          stroke={C.staff}
          strokeWidth={1}
        />
      ))}
      {/* Verbindende frase-lijn */}
      <path
        d={data
          .map(
            (v, i) => `${i === 0 ? "M" : "L"}${(20 + i * step).toFixed(1)} ${noteY(v).toFixed(1)}`,
          )
          .join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.4}
        strokeLinecap="round"
      />
      {/* Noten */}
      {data.map((v, i) => {
        const cx = 20 + i * step;
        const cy = noteY(v);
        const on = i === data.length - 1;
        return (
          <g key={i}>
            <line
              x1={cx + 4.5}
              y1={cy}
              x2={cx + 4.5}
              y2={cy - 22}
              stroke={on ? accent : color}
              strokeWidth={1.4}
              strokeOpacity={on ? 1 : 0.55}
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={5.2}
              ry={4}
              fill={on ? accent : color}
              transform={`rotate(-18 ${cx} ${cy})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

// Maatstreep — verticale scheiding, zoals tussen twee maten.
function BarLine({ tall = false }: { tall?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: 1, height: tall ? 28 : 18, background: C.line, display: "inline-block" }}
    />
  );
}

// Statuschip in partituur-stijl: soft-vlak + icoon + label. Nooit alleen kleur.
function StatusPill({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const t = credTone(status);
  const Icon = t.Icon;
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${sm ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11px]"} font-semibold`}
      style={{ ...body, color: t.fg, background: t.soft, border: `1px solid ${t.fg}22` }}
    >
      <Icon size={sm ? 11 : 12} strokeWidth={2.2} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Klein maatgetal-label (kicker) in kapitalen met letterspatie.
function Kicker({ children, tone = C.gold }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[10.5px] uppercase"
      style={{ ...body, color: tone, letterSpacing: "0.22em", fontWeight: 700 }}
    >
      {children}
    </p>
  );
}

// Ring die de "toonsoort" (verificatie/match) toont — goud op aubergine.
function KeyRing({
  value,
  size = 92,
  dark = false,
}: {
  value: number;
  size?: number;
  dark?: boolean;
}) {
  const stroke = size >= 88 ? 5 : 4;
  const r = size / 2 - stroke - 1;
  const circ = 2 * Math.PI * r;
  const track = dark ? "rgba(201,153,47,0.18)" : C.goldSoft;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.goldBright}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="tabular-nums"
          style={{
            ...display,
            color: dark ? "#fbf5ea" : C.ink,
            fontSize: size >= 88 ? 30 : 22,
            fontWeight: 600,
          }}
        >
          {value}
        </span>
        <span
          className="mt-0.5 text-[8px] uppercase"
          style={{
            ...body,
            color: dark ? "#c9b6cd" : C.faint,
            letterSpacing: "0.18em",
            fontWeight: 700,
          }}
        >
          match
        </span>
      </span>
    </span>
  );
}

// Paginakop met notenbalk-onderrand.
function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-3 pt-7 sm:px-8">
      <div className="min-w-0 max-w-2xl">
        <Kicker>{kicker}</Kicker>
        <h1
          className="mt-1.5 text-[36px] leading-[1.02] tracking-[-0.01em] sm:text-[44px]"
          style={{ ...display, color: C.ink, fontWeight: 600 }}
        >
          {title}
        </h1>
        {sub && (
          <p
            className="mt-2 max-w-xl text-[13.5px] leading-relaxed"
            style={{ ...body, color: C.sub }}
          >
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept348() {
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
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes kw-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes kw-pulse{0%,100%{opacity:.5}50%{opacity:.85}}
      @keyframes kw-play{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>

      {/* Kop-balk (aubergine) — de dirigent bovenaan */}
      <header style={{ background: C.deep }}>
        <div className="flex h-16 items-center gap-3 px-5 sm:px-8">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: C.goldBright, color: C.deep }}
            aria-hidden="true"
          >
            <Music size={17} strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <p className="text-[17px]" style={{ ...display, color: "#fbf5ea", fontWeight: 600 }}>
              Kwintet
            </p>
            <p
              className="text-[9.5px] uppercase"
              style={{ color: "#c9b6cd", letterSpacing: "0.2em", fontWeight: 700 }}
            >
              Zelfstandig · in maat
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`rounded-full p-2 transition-colors hover:bg-white/10 ${RING}`}
              style={{ color: "#e6d8e8", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Search size={16} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-full p-2 transition-colors hover:bg-white/10 ${RING}`}
              style={{ color: "#e6d8e8", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                style={{ background: C.goldBright }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: "rgba(201,153,47,0.16)",
                  color: C.goldBright,
                  border: "1px solid rgba(201,153,47,0.3)",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: "#fbf5ea" }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px]"
                  style={{ color: C.goldBright }}
                >
                  <BadgeCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs als notenbalk-register */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 sm:px-6" aria-label="Hoofdnavigatie">
          {SCREENS.map((s, i) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`group relative flex shrink-0 items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-[12.5px] transition-colors ${RING}`}
                style={{ color: on ? "#fbf5ea" : "#b7a3ba", fontWeight: on ? 700 : 500 }}
              >
                <span
                  className="text-[9px] tabular-nums"
                  style={{ ...mono, color: on ? C.goldBright : "#8f7d92" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon
                  size={14}
                  aria-hidden="true"
                  style={{ color: on ? C.goldBright : "#8f7d92" }}
                />
                {s.label}
                {on && (
                  <span
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    style={{
                      background: C.goldBright,
                      transformOrigin: "left",
                      animation: "kw-play 0.35s ease",
                    }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "kw-fade 0.36s ease" }}>
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
    <div className="px-6 py-7 sm:px-8" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-3 w-24 rounded"
        style={{ background: C.lineSoft, animation: "kw-pulse 1.3s infinite" }}
      />
      <div
        className="mt-3 h-9 w-72 rounded"
        style={{ background: C.lineSoft, animation: "kw-pulse 1.3s infinite" }}
      />
      <div
        className="mt-6 h-40 rounded-2xl"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "kw-pulse 1.3s infinite",
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              animation: "kw-pulse 1.3s infinite",
            }}
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
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);
  const hero = KPIS[0] ?? { label: "", value: "", trend: "", up: true, spark: [0] };
  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };
  const first = PROFIEL.naam.split(" ")[0];

  return (
    <div>
      <PageHead
        kicker={
          <>
            <Sparkles size={11} aria-hidden="true" /> Openingsmaat · deze week
          </>
        }
        title={`In goede maat, ${first}`}
        sub="Je praktijk als partituur: de kern-cijfers spelen boven, de kansen volgen in cadans, en verificatie stemt het geheel."
      />

      <div className="space-y-6 px-6 py-5 sm:px-8">
        {/* Hero-balk (aubergine) met notenbalk-motief */}
        <div className="overflow-hidden rounded-2xl" style={{ background: C.deep }}>
          <div className="flex flex-wrap items-center justify-between gap-5 p-6">
            <div className="min-w-0">
              <Kicker tone={C.goldBright}>{hero.label}</Kicker>
              <p
                className="mt-2 text-[52px] tabular-nums leading-none"
                style={{ ...display, color: "#fbf5ea", fontWeight: 600 }}
              >
                {hero.value}
              </p>
              <p
                className="mt-2 flex items-center gap-2 text-[12.5px]"
                style={{ color: "#c9b6cd" }}
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                  style={{ background: "rgba(201,153,47,0.16)", color: C.goldBright }}
                >
                  {hero.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {hero.trend}
                </span>
                t.o.v. vorige maat · je speelt op tempo
              </p>
            </div>
            <KeyRing value={matchAvg} size={98} dark />
          </div>
          <div className="px-4 pb-4">
            <StaffMotif data={hero.spark} w={620} h={92} color="#8a6f92" accent={C.goldBright} />
          </div>
        </div>

        {/* KPI-maten in vier maatvakken, gescheiden door maatstrepen */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {KPIS.map((k, i) => (
              <div
                key={k.label}
                className="p-5"
                style={{
                  borderRight: i % 4 !== 3 ? `1px solid ${C.lineSoft}` : "none",
                  borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : "none",
                }}
              >
                <p className="text-[11px] font-medium" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <p
                  className="mt-1.5 text-[24px] tabular-nums leading-none"
                  style={{ ...display, color: C.ink, fontWeight: 600 }}
                >
                  {k.value}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                    style={{ ...mono, color: k.up ? C.ok : C.warn }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={11} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={11} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                  <div className="flex-1">
                    <StaffMotif data={k.spark} w={120} h={30} color={C.aubergine} accent={C.gold} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Volgende maat (attentie) */}
          {warn && (
            <div
              className="rounded-2xl p-6 lg:col-span-2"
              style={{ background: C.goldSoft, border: `1px solid ${C.gold}33` }}
              role="alert"
            >
              <Kicker tone={C.gold}>
                <AlertTriangle size={11} strokeWidth={2.4} aria-hidden="true" /> Volgende maat
              </Kicker>
              <h2
                className="mt-2.5 text-[26px] leading-tight"
                style={{ ...display, color: C.ink, fontWeight: 600 }}
              >
                {warn.titel}
              </h2>
              <p
                className="mt-1.5 max-w-md text-[13.5px] leading-relaxed"
                style={{ color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.deep, color: C.goldBright }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Nieuwste bericht: error→loading→ok */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.aubergine}>Laatste noot</Kicker>
            <div className="mt-3">
              {feed === "error" && (
                <div className="py-3 text-center" role="alert">
                  <XCircle
                    size={18}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
                    Berichten konden niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f3e9d8] ${RING}`}
                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2 py-1" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  <span
                    className="block h-3 rounded"
                    style={{
                      background: C.lineSoft,
                      width: "65%",
                      animation: "kw-pulse 1.3s infinite",
                    }}
                  />
                  <span
                    className="block h-3 rounded"
                    style={{
                      background: C.lineSoft,
                      width: "88%",
                      animation: "kw-pulse 1.3s infinite",
                    }}
                  />
                </div>
              )}
              {feed === "ok" && BERICHTEN[0] && (
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10.5px] font-bold"
                      style={{ background: C.aubergineSoft, color: C.aubergine }}
                      aria-hidden="true"
                    >
                      {BERICHTEN[0].initialen}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                        {BERICHTEN[0].van}
                      </p>
                      <p className="text-[10.5px]" style={{ color: C.faint }}>
                        {BERICHTEN[0].tijd}
                      </p>
                    </div>
                  </div>
                  <p
                    className="mt-2.5 text-[13px] leading-relaxed"
                    style={{ ...display, color: C.inkSoft, fontWeight: 500 }}
                  >
                    “{BERICHTEN[0].preview}”
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Beste matches — als frase van drie */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px]" style={{ ...display, color: C.ink, fontWeight: 600 }}>
              Sterkste frases
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold transition-colors hover:opacity-70 ${RING}`}
              style={{ color: C.aubergine }}
            >
              Alle opdrachten <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`group rounded-2xl p-5 text-left transition-colors hover:border-[#5a3a6355] ${RING}`}
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <KeyRing value={o.match} size={62} />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[18px] leading-snug"
                  style={{ ...display, color: C.ink, fontWeight: 600 }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="text-[14px] font-bold tabular-nums"
                    style={{ ...mono, color: C.gold }}
                  >
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ color: C.faint }}>
                    {o.uren}
                  </span>
                </div>
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
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        kicker="Repertoire · open opdrachten"
        title="Marktplaats"
        sub="Opdrachten in cadans, geordend naar de kracht van de koppeling met je geverifieerde profiel."
        right={
          <div className="inline-flex items-center gap-3" role="tablist" aria-label="Sorteren">
            <span
              className="text-[10.5px] uppercase"
              style={{ color: C.faint, letterSpacing: "0.16em", fontWeight: 700 }}
            >
              Maatsoort
            </span>
            <div
              className="inline-flex items-center gap-0.5 rounded-full p-0.5"
              style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
            >
              {(["match", "tarief"] as const).map((s) => {
                const on = s === sort;
                return (
                  <button
                    key={s}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setSort(s)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                    style={{
                      background: on ? C.deep : "transparent",
                      color: on ? "#fbf5ea" : C.sub,
                    }}
                  >
                    {s === "match" ? "Match" : "Tarief"}
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      <div className="px-6 py-5 sm:px-8">
        <div
          className="mb-4 flex items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.surfaceAlt }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={19} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[20px]" style={{ ...display, color: C.ink, fontWeight: 600 }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht en probeer opnieuw.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 rounded-full px-5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f3e9d8] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o, i) => (
              <li
                key={o.id}
                className="overflow-hidden rounded-2xl"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                  {/* Maatnummer + ring */}
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold tabular-nums"
                      style={{
                        ...mono,
                        background: i === 0 ? C.goldSoft : C.surfaceAlt,
                        color: i === 0 ? C.gold : C.faint,
                      }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <BarLine tall />
                    <KeyRing value={o.match} size={60} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: C.surfaceAlt, color: C.sub }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3
                      className="mt-1 text-[19px] leading-snug"
                      style={{ ...display, color: C.ink, fontWeight: 600 }}
                    >
                      {o.titel}
                    </h3>
                    <p
                      className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                      <span className="font-bold tabular-nums" style={{ ...mono, color: C.gold }}>
                        {o.tarief}
                      </span>
                      <BarLine />
                      <span style={{ color: C.sub }}>{o.uren}</span>
                      <BarLine />
                      <span style={{ color: C.sub }}>{o.start}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                    style={{ background: C.deep, color: C.goldBright }}
                  >
                    Bekijk <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
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
      <div className="px-6 pt-6 sm:px-8">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:opacity-70 ${RING}`}
          style={{ color: C.sub }}
        >
          <ChevronLeft size={14} aria-hidden="true" /> Marktplaats
        </button>
      </div>

      <PageHead
        kicker={`${opdracht.id} · ${opdracht.opdrachtgever}`}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats} · ${opdracht.start}`}
        right={
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
            style={{
              background: state === "sent" ? C.ok : C.deep,
              color: state === "sent" ? "#fbf5ea" : C.goldBright,
            }}
          >
            {state === "idle" && (
              <>
                <Send size={15} strokeWidth={2.2} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={2.6} aria-hidden="true" /> Verstuurd
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:px-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Kerncijfers als maatvakken */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { l: "Tarief", v: opdracht.tarief },
                { l: "Omvang", v: opdracht.uren },
                { l: "Start", v: opdracht.start },
                { l: "Match", v: `${opdracht.match}%` },
              ].map((m, i) => (
                <div
                  key={m.l}
                  className="p-4"
                  style={{
                    borderRight: i % 4 !== 3 ? `1px solid ${C.lineSoft}` : "none",
                    borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : "none",
                  }}
                >
                  <p
                    className="text-[10px] uppercase"
                    style={{ color: C.faint, letterSpacing: "0.12em", fontWeight: 700 }}
                  >
                    {m.l}
                  </p>
                  <p
                    className="mt-1.5 text-[20px] tabular-nums leading-none"
                    style={{ ...display, color: C.ink, fontWeight: 600 }}
                  >
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-2xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[22px]" style={{ ...display, color: C.ink, fontWeight: 600 }}>
              Waarom deze koppeling
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel — elke reden telt mee.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Kicker tone={C.ok}>
                  <Check size={12} strokeWidth={2.6} aria-hidden="true" /> In je voordeel
                </Kicker>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2.5 text-[13.5px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
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
                <Kicker tone={C.warn}>
                  <AlertTriangle size={12} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
                </Kicker>
                <ul className="mt-3 space-y-2.5">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2.5 text-[13.5px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
                          strokeWidth={2.4}
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
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-6" style={{ background: C.deep }}>
            <div className="flex items-center gap-4">
              <KeyRing value={opdracht.match} size={78} dark />
              <div>
                <Kicker tone={C.goldBright}>Toonsoort</Kicker>
                <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "#c9b6cd" }}>
                  Sterke aansluiting op je profiel. Reageer nu voor de beste timing.
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.aubergine}>
              <ShieldCheck size={12} strokeWidth={2.2} aria-hidden="true" /> Vereiste bewijsstukken
            </Kicker>
            <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              Je voldoet aan de kern-eisen voor deze opdracht.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} size="sm" />
                  </li>
                );
              })}
            </ul>
          </div>
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
        kicker="Toonsoort · bewijsstukken"
        title="Verificatie"
        sub="Elk geverifieerd bewijsstuk stemt je profiel. Samen bepalen ze je vertrouwensniveau — de toonsoort waarin je speelt."
      />

      <div className="space-y-5 px-6 py-5 sm:px-8">
        <div
          className="flex flex-wrap items-center gap-6 rounded-2xl p-6"
          style={{ background: C.deep }}
        >
          <KeyRing value={pct} size={104} dark />
          <div className="min-w-[200px] flex-1">
            <Kicker tone={C.goldBright}>
              <BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
            </Kicker>
            <p
              className="mt-2 text-[30px] tabular-nums leading-none"
              style={{ ...display, color: "#fbf5ea", fontWeight: 600 }}
            >
              {verified} van {total} geverifieerd
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed" style={{ color: "#c9b6cd" }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige toonsoort. Opdrachtgevers zien alleen je niveau, nooit je documenten.
            </p>
          </div>
        </div>

        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
            role="alert"
          >
            <AlertTriangle
              size={20}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.deep, color: C.goldBright }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[14.5px]"
                    style={{ ...display, color: C.ink, fontWeight: 600 }}
                  >
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
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
        kicker="Cadans · te doen"
        title="Volgende acties"
        sub="Je actielijst in staccato — kort, op volgorde van urgentie, af te vinken maat voor maat."
      />

      <div className="space-y-3 px-6 py-5 sm:px-8">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const soft = warn ? C.warnSoft : C.infoSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-2xl p-4"
              style={{
                background: C.surface,
                border: `1px solid ${warn ? `${C.warn}33` : C.line}`,
              }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] tabular-nums"
                style={{ ...display, background: soft, color: tone, fontWeight: 600 }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <span
                  className="text-[10px] uppercase"
                  style={{ color: tone, letterSpacing: "0.16em", fontWeight: 700 }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </span>
                <p
                  className="mt-1 text-[19px] leading-snug"
                  style={{ ...display, color: C.ink, fontWeight: 600 }}
                >
                  {a.titel}
                </p>
                <p className="mt-1 max-w-lg text-[13px] leading-relaxed" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? C.deep : C.surfaceAlt,
                  color: warn ? C.goldBright : C.ink,
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: C.goldSoft, border: `1px solid ${C.gold}33` }}
        >
          <Music size={16} strokeWidth={2.2} style={{ color: C.gold }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
            Verder loopt alles in maat. Nieuwe acties verschijnen hier vanzelf.
          </p>
        </div>
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
        kicker="Cadans · omzet"
        title="Facturen"
        sub="Je omzet in maat: wat binnen is en wat nog onderweg is, overzichtelijk op een rij."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.deep, color: C.goldBright }}
          >
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />

      <div className="space-y-5 px-6 py-5 sm:px-8">
        <div
          className="flex flex-wrap items-center gap-6 rounded-2xl p-6"
          style={{ background: C.deep }}
        >
          <KeyRing value={pct} size={84} dark />
          <div className="flex flex-1 flex-wrap gap-8">
            <div>
              <p
                className="text-[10.5px] uppercase"
                style={{ color: C.goldBright, letterSpacing: "0.14em", fontWeight: 700 }}
              >
                Ontvangen
              </p>
              <p
                className="mt-1 text-[28px] tabular-nums leading-none"
                style={{ ...display, color: "#fbf5ea", fontWeight: 600 }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <BarLine tall />
            <div>
              <p
                className="text-[10.5px] uppercase"
                style={{ color: "#d9a2ad", letterSpacing: "0.14em", fontWeight: 700 }}
              >
                Openstaand
              </p>
              <p
                className="mt-1 text-[28px] tabular-nums leading-none"
                style={{ ...display, color: "#fbf5ea", fontWeight: 600 }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-2xl"
          style={{ border: `1px solid ${C.line}`, background: C.surface }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase"
                style={{ background: C.surfaceAlt, color: C.faint, letterSpacing: "0.1em" }}
              >
                <th className="px-4 py-3 font-bold">Nummer</th>
                <th className="px-4 py-3 font-bold">Klant</th>
                <th className="hidden px-4 py-3 font-bold sm:table-cell">Datum</th>
                <th className="px-4 py-3 text-right font-bold">Bedrag</th>
                <th className="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3.5 text-[14px]"
                      style={{ ...display, color: C.ink, fontWeight: 500 }}
                    >
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
                        style={{ color: t.fg, background: t.soft }}
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
    </div>
  );
}
