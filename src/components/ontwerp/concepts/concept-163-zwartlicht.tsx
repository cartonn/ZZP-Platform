"use client";

// Concept 163 — "Zwartlicht" · UV-echtheidscontrole (dark). Bijna-zwart oppervlak (#0a0a0f) met
// UV-fluorescerende beveiligingskenmerken die 'oplichten' onder blacklight — zoals echtheidskenmerken
// op een paspoort of bankbiljet: fluor-magenta, cyaan en groen. Fijne fluor-lijn-art; de gloed valt
// alleen op GEVERIFIEERDE/echte elementen — verificatie = echtheid zichtbaar maken. Onderscheidend van
// röntgen (cyaan X-ray-lijnwerk) en neon (verzadigd stadslicht): dit is subtiele UV-security-glow op
// documenten/credentials, donkerder en ingetogener. Status nooit kleur-alleen: altijd label + icoon.
// Deterministisch — geen random/Date. UI-taal Nederlands. Fonts: Space Grotesk (display) + JetBrains Mono.

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
  ScanLine,
  Fingerprint,
  Sparkles,
  ScanEye,
  Radar,
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

// ── Palet — near-black met UV-fluor accenten (magenta/cyaan/groen), gloed spaarzaam ──
const C = {
  base: "#0a0a0f",
  base2: "#0d0d14",
  panel: "#111119",
  panelUp: "#15151f",
  line: "#222232",
  lineSoft: "#1a1a26",
  ink: "#eef0f6",
  sub: "#9a9cb4",
  subSoft: "#5f6180",
  // UV-fluor kernen
  uv: "#c05bff", // fluor-magenta/violet — primair UV
  uvSoft: "#a24df0",
  cyan: "#3ff0e0", // fluor-cyaan — echt/geverifieerd
  cyanSoft: "#2bc9bd",
  lime: "#8dff5a", // fluor-groen — betaald/veilig
  limeSoft: "#6fd63f",
  amber: "#ffcf5a", // waarschuwing (verloopt)
  amberSoft: "#e0b03f",
  rose: "#ff5f8a", // afgewezen/fout
  roseSoft: "#e04f78",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// UV-gloed helpers — gloed valt ALLEEN op geverifieerde/echte elementen.
const glow = (hex: string, s = 1) => ({
  boxShadow: `0 0 0 1px ${hex}44, 0 0 ${14 * s}px ${hex}33, inset 0 0 ${18 * s}px ${hex}10`,
});
const textGlow = (hex: string) => ({ color: hex, textShadow: `0 0 12px ${hex}66` });
// Fijne UV-guilloche — security-lijnwerk op de achtergrond (heel subtiel).
const guilloche =
  "repeating-linear-gradient(45deg, rgba(192,91,255,0.04) 0 1px, transparent 1px 13px)," +
  "repeating-linear-gradient(-45deg, rgba(63,240,224,0.03) 0 1px, transparent 1px 17px)";
const panelShadow = {
  boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset, 0 18px 44px -26px rgba(0,0,0,0.9)",
};

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; hex: string; glowing: boolean };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Echt & geverifieerd", Icon: Check, hex: C.cyan, glowing: true };
    case "SUBMITTED":
      return { label: "Onder de lamp", Icon: Radar, hex: C.uv, glowing: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, hex: C.amber, glowing: false };
    case "REJECTED":
      return { label: "Niet echt bevonden", Icon: XCircle, hex: C.rose, glowing: false };
  }
}

function StatusTag({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{
        ...mono,
        color: m.hex,
        background: `${m.hex}12`,
        border: `1px solid ${m.hex}44`,
        ...(m.glowing ? { boxShadow: `0 0 12px ${m.hex}33` } : {}),
      }}
    >
      <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Paneel — donkere plaat met guilloche-textuur; optioneel UV-rand-gloed.
function Panel({
  children,
  className = "",
  glowHex,
  interactive = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  glowHex?: string;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative overflow-hidden rounded-2xl ${interactive ? "transition-all duration-300 hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        background: C.panel,
        backgroundImage: guilloche,
        border: `1px solid ${glowHex ? `${glowHex}44` : C.line}`,
        ...(glowHex ? glow(glowHex) : panelShadow),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Sectiekop — UV-scan-icoon + display-titel.
function Kop({
  children,
  Icon,
  sub,
  hex = C.uv,
}: {
  children: React.ReactNode;
  Icon: LucideIcon;
  sub?: string;
  hex?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${hex}14`, border: `1px solid ${hex}44` }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2.2} style={{ color: hex }} />
      </span>
      <div className="leading-tight">
        <h2
          className="text-[16px] font-bold tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {children}
        </h2>
        {sub && (
          <p
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.subSoft }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.sub }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.subSoft }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-tint — hoge match licht UV-cyaan op (echt), lager blijft violet/gedempt.
function matchTone(m: number): { hex: string; glowing: boolean } {
  if (m >= 90) return { hex: C.cyan, glowing: true };
  if (m >= 84) return { hex: C.uv, glowing: true };
  return { hex: C.sub, glowing: false };
}

// Mini lijn-grafiek — dunne UV-lijn met eind-gloedpunt.
function Spark({ data, hex = C.uv }: { data: number[]; hex?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 26 - ((v - min) / span) * 22 - 2;
    return { x, y };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1] ?? { x: 100, y: 12 };
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={poly}
        fill="none"
        stroke={hex}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${hex}88)` }}
      />
      <circle
        cx={last.x}
        cy={last.y}
        r={2.2}
        fill={hex}
        style={{ filter: `drop-shadow(0 0 4px ${hex})` }}
      />
    </svg>
  );
}

// Match-ring — UV-boog die oplicht.
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const t = matchTone(value);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.hex}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={t.glowing ? { filter: `drop-shadow(0 0 4px ${t.hex})` } : undefined}
        />
      </svg>
      <span
        className="absolute text-[14px] font-bold tabular-nums"
        style={{ ...mono, color: t.hex }}
      >
        {value}
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept163() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...mono,
        background: C.base,
        color: C.ink,
        backgroundImage: `radial-gradient(120% 80% at 50% -10%, ${C.base2} 0%, ${C.base} 60%)`,
      }}
    >
      {/* Kop — UV-lamp-balk */}
      <header
        className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8"
        style={{
          background: C.base2,
          borderBottom: `1px solid ${C.line}`,
          backgroundImage: guilloche,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: `${C.uv}16`,
              border: `1px solid ${C.uv}55`,
              boxShadow: `0 0 18px ${C.uv}30`,
            }}
            aria-hidden="true"
          >
            <ScanEye size={20} strokeWidth={2} style={{ color: C.uv }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[19px] font-bold tracking-[-0.01em]"
              style={{ ...display, ...textGlow(C.uv) }}
            >
              Zwartlicht
            </div>
            <div
              className="text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ color: C.subSoft }}
            >
              Echtheid zichtbaar maken
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] sm:inline-flex"
            style={{
              color: C.cyan,
              background: `${C.cyan}12`,
              border: `1px solid ${C.cyan}44`,
              boxShadow: `0 0 12px ${C.cyan}22`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[12px] font-bold"
            style={{ color: C.uv, background: `${C.uv}14`, border: `1px solid ${C.uv}44` }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher — UV-tab-lint (actief licht op) */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.base, borderBottom: `1px solid ${C.lineSoft}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.04em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                color: on ? C.uv : C.sub,
                background: on ? `${C.uv}12` : "transparent",
                border: `1px solid ${on ? `${C.uv}55` : "transparent"}`,
                ...(on ? { boxShadow: `0 0 14px ${C.uv}22` } : {}),
                ["--tw-ring-color" as string]: C.uv,
                ["--tw-ring-offset-color" as string]: C.base,
              }}
            >
              <span
                className="mr-1.5 text-[10px] tabular-nums"
                style={{ color: on ? C.uvSoft : C.subSoft }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
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
    <div className="space-y-7">
      {/* Hero — document onder de UV-lamp */}
      <Panel glowHex={C.uv} className="p-6 sm:p-9">
        <span
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
          style={{ background: `radial-gradient(circle, ${C.uv}22 0%, transparent 70%)` }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: C.uv, background: `${C.uv}12`, border: `1px solid ${C.uv}44` }}
          >
            <Fingerprint size={12} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[30px] font-bold leading-[1.06] tracking-[-0.02em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches lichten op.
            <br />
            <span style={textGlow(C.cyan)}>Je echtheid</span> is zichtbaar.
          </h1>
          <p
            className="mt-4 max-w-lg text-[14.5px] leading-relaxed"
            style={{ ...mono, color: C.sub }}
          >
            Eén kenmerk dooft: je VOG verloopt binnenkort. Vernieuw het zodat je onder de lamp echt
            blijft — opdrachtgevers zien alleen wat oplicht.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: C.base,
                background: C.uv,
                boxShadow: `0 0 20px ${C.uv}55`,
                ["--tw-ring-color" as string]: C.uv,
                ["--tw-ring-offset-color" as string]: C.base,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: C.amber,
                background: "transparent",
                border: `1px solid ${C.amber}55`,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.base,
              }}
            >
              <TriangleAlert size={14} strokeWidth={2.4} aria-hidden="true" /> Los actie op
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, idx) => {
          const hex = k.up ? (idx === 0 ? C.cyan : C.uv) : C.amber;
          return (
            <Panel key={k.label} interactive className="p-4">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                  style={{ color: C.subSoft }}
                >
                  {k.label}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ color: hex, background: `${hex}14`, border: `1px solid ${hex}33` }}
                >
                  {k.trend}
                </span>
              </div>
              <div
                className="mt-2 text-[24px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </div>
              <div className="mt-2.5">
                <Spark data={k.spark} hex={hex} />
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Kop Icon={Star} sub="Onder de lamp gelegd" hex={C.uv}>
            Aanbevolen matches
          </Kop>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => {
              const t = matchTone(o.match);
              return (
                <Panel key={o.id} interactive glowHex={t.glowing ? t.hex : undefined}>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: t.hex }}
                  >
                    <MatchRing value={o.match} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[15.5px] font-bold tracking-[-0.01em]"
                        style={{ ...display, color: C.ink }}
                      >
                        {o.titel}
                      </div>
                      <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.sub }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              color: C.cyan,
                              background: `${C.cyan}0d`,
                              border: `1px solid ${C.cyan}33`,
                            }}
                          >
                            <Check size={10} strokeWidth={3} aria-hidden="true" /> {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className="shrink-0"
                      style={{ color: C.subSoft }}
                      aria-hidden="true"
                    />
                  </button>
                </Panel>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom: echtheids-dekking + prioriteit */}
        <div className="space-y-4">
          <Kop Icon={ShieldCheck} sub="Dekking echtheidskenmerken" hex={C.cyan}>
            Echtheid
          </Kop>
          <Panel glowHex={C.cyan} className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[52px] font-bold leading-none tracking-[-0.03em]"
                style={{ ...display, ...textGlow(C.cyan) }}
              >
                {dek}
                <span className="text-[22px]">%</span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
              {verified}/{CREDENTIALS.length} kenmerken lichten echt op
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${dek}%`, background: C.cyan, boxShadow: `0 0 10px ${C.cyan}` }}
              />
            </div>
          </Panel>

          <Panel glowHex={C.amber} className="p-5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.amber, background: `${C.amber}14` }}
            >
              <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-3 text-[17px] font-bold leading-tight"
              style={{ ...display, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.sub }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...mono,
                color: C.base,
                background: C.amber,
                ["--tw-ring-color" as string]: C.amber,
                ["--tw-ring-offset-color" as string]: C.base,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Kop Icon={ScanLine} sub="Open opdrachten · gescand" hex={C.uv}>
          Marktplaats
        </Kop>
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} style={{ color: C.uv }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ ...mono, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `${C.uv}12`, border: `1px solid ${C.uv}44` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.uv }} />
          </span>
          <p className="text-[19px] font-bold" style={{ ...display, color: C.ink }}>
            Niets licht op
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.sub }}>
            Geen opdracht gevonden voor “{q}”. Pas je zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              color: C.base,
              background: C.uv,
              ["--tw-ring-color" as string]: C.uv,
              ["--tw-ring-offset-color" as string]: C.base,
            }}
          >
            Zoekterm wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const t = matchTone(o.match);
            return (
              <Panel
                key={o.id}
                interactive
                glowHex={t.glowing ? t.hex : undefined}
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 p-4">
                  <MatchRing value={o.match} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-3 pt-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <dl className="grid grid-cols-2 gap-y-2 text-[12.5px]">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{
                          color: C.sub,
                          background: C.panelUp,
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...mono,
                    color: C.uv,
                    background: `${C.uv}0d`,
                    borderTop: `1px solid ${C.uv}33`,
                    ["--tw-ring-color" as string]: C.uv,
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
  const t = matchTone(opdracht.match);
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
        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          color: C.ink,
          background: C.panel,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.uv,
          ["--tw-ring-offset-color" as string]: C.base,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Panel glowHex={t.glowing ? t.hex : C.uv} className="p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: t.hex, background: `${t.hex}12`, border: `1px solid ${t.hex}44` }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-bold leading-[1.06] tracking-[-0.02em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.sub }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-1 pl-6"
            style={{ borderLeft: `1px solid ${t.hex}44` }}
          >
            <span
              className="text-[52px] font-bold leading-none"
              style={{ ...display, ...textGlow(t.hex) }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.sub }}
            >
              % match
            </span>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Panel key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2.2} style={{ color: C.uv }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.subSoft }}
            >
              {f.l}
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Kop Icon={Check} sub="Kenmerken die oplichten" hex={C.cyan}>
            Waarom dit past
          </Kop>
          <Panel className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `${C.cyan}14`,
                      border: `1px solid ${C.cyan}55`,
                      boxShadow: `0 0 8px ${C.cyan}33`,
                    }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.cyan }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-4">
          <Kop Icon={TriangleAlert} sub="Nog te controleren" hex={C.amber}>
            Om te overwegen
          </Kop>
          <Panel className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}55` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.amber }} />
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.base,
            background: C.uv,
            boxShadow: `0 0 20px ${C.uv}55`,
            ["--tw-ring-color" as string]: C.uv,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13.5px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.ink,
            background: C.panel,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.uv,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Star size={15} strokeWidth={2.2} style={{ color: C.uv }} aria-hidden="true" /> Bewaar
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
        <Kop Icon={ScanEye} sub="Elk kenmerk onder de lamp" hex={C.uv}>
          Verificatie &amp; certificaten
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.base,
            background: C.uv,
            ["--tw-ring-color" as string]: C.uv,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
        </button>
      </div>

      <Panel glowHex={C.cyan} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className="text-[56px] font-bold leading-none tracking-[-0.03em]"
              style={{ ...display, ...textGlow(C.cyan) }}
            >
              {dek}
              <span className="text-[24px]">%</span>
            </div>
            <div className="max-w-xs">
              <div className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
                {verified}/{CREDENTIALS.length} echt bevonden
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                Opdrachtgevers zien alleen kenmerken die oplichten. Meer geverifieerde kenmerken =
                hoger vertrouwen.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.04em]"
            style={{
              color: C.cyan,
              background: `${C.cyan}12`,
              border: `1px solid ${C.cyan}44`,
              boxShadow: `0 0 12px ${C.cyan}22`,
            }}
          >
            <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Panel key={c.naam} interactive glowHex={m.glowing ? m.hex : undefined} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: `${m.hex}12`,
                    border: `1px solid ${m.hex}44`,
                    ...(m.glowing ? { boxShadow: `0 0 12px ${m.hex}33` } : {}),
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2.2} style={{ color: m.hex }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14.5px] font-bold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.sub }}>
                    {c.detail}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusTag status={c.status} />
                    {actionable && (
                      <button
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.03em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...mono,
                          color: m.hex,
                          background: `${m.hex}0d`,
                          border: `1px solid ${m.hex}44`,
                          ["--tw-ring-color" as string]: m.hex,
                          ["--tw-ring-offset-color" as string]: C.base,
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
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Documenten + loading-skeleton — bewijst dat de designtaal states dekt */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kop Icon={FileText} sub="Privé opgeslagen · versleuteld" hex={C.uv}>
            Documenten
          </Kop>
          <Panel className="mt-4 overflow-hidden">
            <ul>
              {DOCUMENTEN.map((d, i) => {
                const m = credMeta(d.status);
                return (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-[#15151f]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: C.panelUp, border: `1px solid ${C.line}` }}
                      aria-hidden="true"
                    >
                      <FileText size={15} strokeWidth={2} style={{ color: C.sub }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11.5px]" style={{ color: C.subSoft }}>
                        {d.type} · {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.03em]"
                      style={{ color: m.hex }}
                    >
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
        <div>
          <Kop Icon={Sparkles} sub="Wordt gescand…" hex={C.uv}>
            Onder de lamp
          </Kop>
          <Panel className="mt-4 p-4">
            {/* Loading-skeleton met UV-scanlijn */}
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 shrink-0 animate-pulse rounded-lg"
                    style={{ background: C.panelUp }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2.5 animate-pulse rounded-full"
                      style={{ background: C.panelUp, width: `${80 - i * 14}%` }}
                    />
                    <div
                      className="h-2 animate-pulse rounded-full"
                      style={{ background: C.lineSoft, width: `${55 - i * 8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11.5px]" style={{ color: C.uv }}>
              <Radar size={13} strokeWidth={2.2} aria-hidden="true" /> Reanimatie / BLS wordt
              gecontroleerd op echtheid.
            </div>
          </Panel>
        </div>
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
      <Kop Icon={Sparkles} sub="Op volgorde van urgentie — pak de bovenste eerst" hex={C.uv}>
        Volgende beste acties
      </Kop>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const hex = warn ? C.amber : C.uv;
          return (
            <li key={a.titel}>
              <Panel
                interactive
                glowHex={warn ? C.amber : undefined}
                className="flex items-stretch"
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[26px] font-bold"
                  style={{
                    ...display,
                    background: warn ? `${C.amber}0d` : C.panelUp,
                    color: hex,
                    borderRight: `1px solid ${warn ? `${C.amber}33` : C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={22} strokeWidth={2.2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: hex, background: `${hex}14`, border: `1px solid ${hex}33` }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[15.5px] font-bold tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      ...mono,
                      color: C.base,
                      background: hex,
                      ["--tw-ring-color" as string]: hex,
                      ["--tw-ring-offset-color" as string]: C.base,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; hex: string; glowing: boolean } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, hex: C.lime, glowing: true };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, hex: C.amber, glowing: false };
    return { label: "Concept", Icon: FileText, hex: C.sub, glowing: false };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Kop Icon={FileText} sub="Verzonden & betaald" hex={C.lime}>
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.03em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            color: C.base,
            background: C.lime,
            ["--tw-ring-color" as string]: C.lime,
            ["--tw-ring-offset-color" as string]: C.base,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, hex: C.lime, glowing: true },
          { l: "Openstaand", v: `${open}`, hex: C.amber, glowing: false },
          { l: "Te factureren", v: "€ 1.350", hex: C.uv, glowing: false },
        ].map((s) => (
          <Panel key={s.l} interactive glowHex={s.glowing ? s.hex : undefined} className="p-4">
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ color: C.subSoft }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, ...(s.glowing ? textGlow(s.hex) : { color: C.ink }) }}
            >
              {s.v}
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="overflow-hidden">
        {/* Inline foutmelding-voorbeeld — bewijst error-state in de designtaal */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5"
          style={{ background: `${C.rose}0f`, borderBottom: `1px solid ${C.rose}33` }}
        >
          <TriangleAlert size={14} strokeWidth={2.2} style={{ color: C.rose }} aria-hidden="true" />
          <span className="text-[12px] font-medium" style={{ color: C.rose }}>
            Herinnering voor FAC-2025-118 kon niet worden verzonden — controleer het e-mailadres van
            de klant.
          </span>
        </div>
        <ul>
          {FACTUREN.map((f, i) => {
            const m = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#15151f]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `${m.hex}12`,
                    border: `1px solid ${m.hex}44`,
                    ...(m.glowing ? { boxShadow: `0 0 10px ${m.hex}33` } : {}),
                  }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2.2} style={{ color: m.hex }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-bold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.sub }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: m.hex, background: `${m.hex}12`, border: `1px solid ${m.hex}44` }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[16px] font-bold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between p-4"
          style={{ background: C.base2, borderTop: `1px solid ${C.line}` }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ color: C.subSoft }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ ...display, ...textGlow(C.lime) }}
          >
            {betaald}
          </span>
        </div>
      </Panel>
    </div>
  );
}
