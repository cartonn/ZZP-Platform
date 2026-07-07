"use client";

// Concept 161 — "Kintsugi" · Japanse gouden reparatie-naad op keramiek. Warme off-white/steengrijze
// keramiek-oppervlakken met craquelé-textuur en onregelmatige GOUDEN naad-lijnen (kintsugi) als
// scheidslijnen en accenten. Metafoor: verificatie heelt breuken → een sterker, kostbaarder geheel.
// Ambachtelijk, rustig, premium. Goud (#b08528 / #c9a227) spaarzaam als accent op crème en steen —
// nooit als vlak. Onderscheidend van alle andere concepten: het gouden-naad-motief is de visuele taal
// (breuk → reparatie → vertrouwen). Status nooit kleur-alleen: altijd label + icoon. Deterministisch —
// geen random/Date. UI-taal Nederlands. Fonts: Fraunces (display, ambachtelijk) + JetBrains Mono (data).

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
  Sparkles,
  BadgeCheck,
  Gem,
  Hammer,
  Layers,
  Feather,
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

// ── Palet — keramiek & goud: warme crème/steen met spaarzaam bladgoud ────────────
const C = {
  gold: "#b08528",
  goldBright: "#c9a227",
  goldSoft: "#e8d59a",
  goldWash: "#f6efdc",
  cream: "#f7f2e9",
  creamDeep: "#efe7d7",
  porcelain: "#fbf8f2",
  stone: "#7c7367",
  stoneSoft: "#a89f91",
  stoneDeep: "#4b453c",
  ink: "#2c2822",
  clay: "#efe4d2",
  line: "#ddd2bd",
  lineSoft: "#e7dcc8",
  ok: "#3f7d54",
  okSoft: "#e6efe4",
  warn: "#b0721f",
  warnSoft: "#f6ead4",
  danger: "#a8452f",
  dangerSoft: "#f4e2da",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Gouden naad — de kern-metafoor. Een onregelmatige diagonale goud-gradient als scheidslijn.
const seam = `linear-gradient(90deg, transparent 0%, ${C.goldSoft} 8%, ${C.gold} 26%, ${C.goldBright} 42%, ${C.gold} 58%, ${C.goldBright} 74%, ${C.gold} 90%, transparent 100%)`;
// Craquelé — fijne haarscheurtjes in het glazuur (heel subtiel).
const craquele =
  "repeating-linear-gradient(63deg, transparent 0 34px, rgba(120,110,92,0.05) 34px 35px)," +
  "repeating-linear-gradient(151deg, transparent 0 47px, rgba(120,110,92,0.04) 47px 48px)";

// Zachte keramiek-schaduw (geen harde blok-schaduw — gegoten, glad).
const potShadow = {
  boxShadow: "0 1px 2px rgba(44,40,34,0.05), 0 12px 30px -18px rgba(44,40,34,0.35)",
};
const potShadowSm = {
  boxShadow: "0 1px 2px rgba(44,40,34,0.05), 0 6px 16px -12px rgba(44,40,34,0.3)",
};

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geheeld & geverifieerd",
        Icon: BadgeCheck,
        fg: C.ok,
        bg: C.okSoft,
        ring: "#bcd4bf",
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.stoneDeep, bg: C.clay, ring: C.line };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnSoft,
        ring: C.goldSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.danger, bg: C.dangerSoft, ring: "#e6c4b8" };
  }
}

function StatusTag({ status, subtle = false }: { status: CredStatus; subtle?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em]"
      style={{
        ...mono,
        background: subtle ? "transparent" : m.bg,
        color: m.fg,
        border: `1px solid ${m.ring}`,
      }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Horizontale gouden naad-lijn — scheidslijn tussen secties.
function Seam({ className = "" }: { className?: string }) {
  return (
    <div className={`h-px w-full ${className}`} style={{ background: seam }} aria-hidden="true" />
  );
}

// Keramiek-paneel — glad, warm, met craquelé-textuur en optionele gouden naadrand.
function Pot({
  children,
  className = "",
  bg = C.porcelain,
  shadow = potShadow,
  seamTop = false,
  interactive = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: React.CSSProperties;
  seamTop?: boolean;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative overflow-hidden rounded-[14px] ${
        interactive ? "transition-all duration-300 hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: bg,
        backgroundImage: craquele,
        border: `1px solid ${C.line}`,
        ...shadow,
        ...style,
      }}
    >
      {seamTop && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ background: seam }}
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  );
}

// Ambachtelijke sectiekop — kleine gouden ruit + serif-titel.
function Kop({
  children,
  Icon,
  sub,
}: {
  children: React.ReactNode;
  Icon: LucideIcon;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: C.goldWash, border: `1px solid ${C.goldSoft}` }}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2} style={{ color: C.gold }} />
      </span>
      <div className="leading-tight">
        <h2
          className="text-[17px] font-semibold tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {children}
        </h2>
        {sub && (
          <p className="text-[11.5px] font-medium" style={{ ...mono, color: C.stoneSoft }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.stone }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-ring — gouden boog die zich sluit naarmate de match hoger is (breuk → heel).
function MatchRing({ value, size = 54 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.creamDeep}
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.gold}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span
        className="absolute text-[14px] font-semibold tabular-nums"
        style={{ ...mono, color: C.ink }}
      >
        {value}
      </span>
    </span>
  );
}

// Mini lijn-grafiek — dunne gouden lijn (spark).
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 26 - ((v - min) / span) * 22 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={C.gold}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept161() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...serif, background: C.cream, color: C.ink }}
    >
      {/* Kop — keramiek-plaat met gouden naad eronder */}
      <header
        className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8"
        style={{ background: C.porcelain, backgroundImage: craquele }}
      >
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: C.goldWash, border: `1px solid ${C.goldSoft}` }}
            aria-hidden="true"
          >
            <Gem size={20} strokeWidth={1.8} style={{ color: C.gold }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[20px] font-semibold tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              Kintsugi
            </div>
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.stoneSoft }}
            >
              Verificatie heelt · vertrouwen groeit
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
            style={{
              ...mono,
              background: C.goldWash,
              color: C.gold,
              border: `1px solid ${C.goldSoft}`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ ...mono, background: C.ink, color: C.goldSoft }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: seam }}
          aria-hidden="true"
        />
      </header>

      {/* Scherm-switcher — glad keramiek-lint met gouden onderstreep bij actief */}
      <nav
        className="flex items-center gap-1 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.cream }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...serif,
                color: on ? C.ink : C.stone,
                background: on ? C.porcelain : "transparent",
                border: on ? `1px solid ${C.line}` : "1px solid transparent",
                ["--tw-ring-color" as string]: C.goldSoft,
                ["--tw-ring-offset-color" as string]: C.cream,
              }}
            >
              <span
                className="mr-1.5 text-[10px] tabular-nums"
                style={{ ...mono, color: on ? C.gold : C.stoneSoft }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full"
                  style={{ background: seam }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>
      <Seam />

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
      {/* Hero — keramiek-schaal met gouden naad die 'm heelt */}
      <Pot bg={C.porcelain} seamTop className="p-6 sm:p-9">
        <div className="relative max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{
              ...mono,
              background: C.goldWash,
              color: C.gold,
              border: `1px solid ${C.goldSoft}`,
            }}
          >
            <Feather size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[40px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%.
            <br />
            <span style={{ color: C.gold }}>Je profiel heelt</span> tot iets kostbaars.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed" style={{ color: C.stone }}>
            Eén breuk vraagt aandacht: je VOG verloopt binnenkort. Herstel de naad en je
            vertrouwensniveau blijft heel — opdrachtgevers zien alleen wat geverifieerd is.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...serif,
                background: C.ink,
                color: C.goldSoft,
                ["--tw-ring-color" as string]: C.goldSoft,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...serif,
                background: C.white,
                color: C.ink,
                border: `1px solid ${C.line}`,
                ["--tw-ring-color" as string]: C.goldSoft,
              }}
            >
              <Hammer size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />{" "}
              Herstel naad
            </button>
          </div>
        </div>
      </Pot>

      {/* KPI-schalen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Pot key={k.label} interactive shadow={potShadowSm} className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-medium uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.stoneSoft }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
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
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2.5">
              <Spark data={k.spark} />
            </div>
          </Pot>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Kop Icon={Star} sub="Op maat gemaakt · met redenen">
            Aanbevolen matches
          </Kop>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => (
              <Pot key={o.id} interactive shadow={potShadowSm}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.goldSoft }}
                >
                  <MatchRing value={o.match} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[16px] font-semibold tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px]" style={{ color: C.stone }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {o.redenen.plus.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            ...mono,
                            background: C.goldWash,
                            color: C.stoneDeep,
                            border: `1px solid ${C.lineSoft}`,
                          }}
                        >
                          <Check
                            size={10}
                            strokeWidth={3}
                            style={{ color: C.gold }}
                            aria-hidden="true"
                          />{" "}
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0"
                    style={{ color: C.stoneSoft }}
                    aria-hidden="true"
                  />
                </button>
              </Pot>
            ))}
          </div>
        </div>

        {/* Rechterkolom: heling-status + prioriteit */}
        <div className="space-y-4">
          <Kop Icon={ShieldCheck} sub="Dekking certificaten">
            Heling
          </Kop>
          <Pot shadow={potShadowSm} seamTop className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[52px] font-semibold leading-none tracking-[-0.03em]"
                style={{ ...display, color: C.ink }}
              >
                {dek}
                <span className="text-[22px]" style={{ color: C.gold }}>
                  %
                </span>
              </div>
              <StatusTag status="VERIFIED" />
            </div>
            <div className="mt-2 text-[12.5px]" style={{ color: C.stone }}>
              {verified}/{CREDENTIALS.length} certificaten geheeld & geverifieerd
            </div>
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.creamDeep }}
              aria-hidden="true"
            >
              <div className="h-full rounded-full" style={{ width: `${dek}%`, background: seam }} />
            </div>
          </Pot>

          <Pot bg={C.ink} shadow={potShadowSm} className="p-5" style={{ backgroundImage: "none" }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, background: "rgba(201,162,39,0.16)", color: C.goldSoft }}
            >
              <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-3 text-[18px] font-semibold leading-tight"
              style={{ ...display, color: C.white }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.stoneSoft }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...serif,
                background: C.gold,
                color: C.ink,
                ["--tw-ring-color" as string]: C.goldSoft,
                ["--tw-ring-offset-color" as string]: C.ink,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Pot>
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
        <Kop Icon={Layers} sub="Open opdrachten in de zorg">
          Marktplaats
        </Kop>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ background: C.porcelain, border: `1px solid ${C.line}`, ...potShadowSm }}
        >
          <Search size={16} style={{ color: C.gold }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-52 bg-transparent text-[13px] outline-none placeholder:opacity-60"
            style={{ ...serif, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Pot className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.goldWash, border: `1px solid ${C.goldSoft}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.gold }} />
          </span>
          <p className="text-[19px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen scherven gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ color: C.stone }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan of bekijk alle opdrachten.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...serif,
              background: C.ink,
              color: C.goldSoft,
              ["--tw-ring-color" as string]: C.goldSoft,
            }}
          >
            Zoekterm wissen
          </button>
        </Pot>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Pot key={o.id} interactive shadow={potShadowSm} className="flex flex-col">
              <div className="flex items-center gap-3 p-4">
                <MatchRing value={o.match} size={48} />
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[15.5px] font-semibold leading-tight tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[12px]" style={{ color: C.stone }}>
                    {o.opdrachtgever}
                  </p>
                </div>
              </div>
              <Seam />
              <div className="p-4">
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
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{
                        ...mono,
                        background: C.clay,
                        color: C.stoneDeep,
                        border: `1px solid ${C.lineSoft}`,
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
                  ...serif,
                  background: C.goldWash,
                  color: C.gold,
                  borderTop: `1px solid ${C.goldSoft}`,
                  ["--tw-ring-color" as string]: C.goldSoft,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
              </button>
            </Pot>
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
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...serif,
          background: C.porcelain,
          color: C.ink,
          border: `1px solid ${C.line}`,
          ["--tw-ring-color" as string]: C.goldSoft,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Pot bg={C.ink} seamTop className="p-6 sm:p-9" style={{ backgroundImage: "none" }}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ ...mono, background: "rgba(201,162,39,0.16)", color: C.goldSoft }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[38px]"
              style={{ ...display, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.stoneSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-1 pl-6"
            style={{ borderLeft: `2px solid rgba(201,162,39,0.3)` }}
          >
            <span
              className="text-[52px] font-semibold leading-none"
              style={{ ...display, color: C.goldSoft }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.stoneSoft }}
            >
              % match
            </span>
          </div>
        </div>
      </Pot>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Pot key={f.l} interactive shadow={potShadowSm} className="p-4">
            <f.Icon size={16} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[16px] font-semibold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.stoneSoft }}
            >
              {f.l}
            </div>
          </Pot>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Kop Icon={Check} sub="Sterke naden">
            Waarom dit past
          </Kop>
          <Pot shadow={potShadowSm} className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft, border: `1px solid #bcd4bf` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Pot>
        </div>
        <div className="space-y-4">
          <Kop Icon={TriangleAlert} sub="Nog te dichten">
            Om te overwegen
          </Kop>
          <Pot shadow={potShadowSm} className="p-5">
            <ul className="space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft, border: `1px solid ${C.goldSoft}` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.6} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Pot>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serif,
            background: C.ink,
            color: C.goldSoft,
            ...potShadow,
            ["--tw-ring-color" as string]: C.goldSoft,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serif,
            background: C.porcelain,
            color: C.ink,
            border: `1px solid ${C.line}`,
            ["--tw-ring-color" as string]: C.goldSoft,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Bewaar
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
        <Kop Icon={ShieldCheck} sub="Elke breuk met goud gedicht">
          Verificatie &amp; certificaten
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serif,
            background: C.ink,
            color: C.goldSoft,
            ["--tw-ring-color" as string]: C.goldSoft,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
        </button>
      </div>

      <Pot bg={C.porcelain} seamTop className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div
              className="text-[56px] font-semibold leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}
              <span className="text-[24px]" style={{ color: C.gold }}>
                %
              </span>
            </div>
            <div className="max-w-xs">
              <div className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
                {verified}/{CREDENTIALS.length} geheeld
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.stone }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Elke geheelde naad verhoogt
                je vertrouwensniveau.
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold"
            style={{
              ...mono,
              background: C.goldWash,
              color: C.gold,
              border: `1px solid ${C.goldSoft}`,
            }}
          >
            <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Pot>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Pot key={c.naam} interactive shadow={potShadowSm} className="p-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: m.bg, border: `1px solid ${m.ring}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14.5px] font-semibold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: C.stone }}>
                    {c.detail}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <StatusTag status={c.status} />
                    {actionable && (
                      <button
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...serif,
                          background: C.goldWash,
                          color: C.gold,
                          border: `1px solid ${C.goldSoft}`,
                          ["--tw-ring-color" as string]: C.goldSoft,
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
            </Pot>
          );
        })}
      </div>

      {/* Documenten + loading-skeleton in één paneel (bewijst dat de designtaal states dekt) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Kop Icon={FileText} sub="Veilig & privé opgeslagen">
            Documenten
          </Kop>
          <Pot shadow={potShadowSm} className="mt-4 overflow-hidden">
            <ul>
              {DOCUMENTEN.map((d, i) => {
                const m = credMeta(d.status);
                return (
                  <li
                    key={d.naam}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-[#f6efdc]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: C.clay, border: `1px solid ${C.lineSoft}` }}
                      aria-hidden="true"
                    >
                      <FileText size={15} strokeWidth={2} style={{ color: C.stoneDeep }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13.5px] font-semibold"
                        style={{ ...serif, color: C.ink }}
                      >
                        {d.naam}
                      </div>
                      <div className="text-[11.5px]" style={{ ...mono, color: C.stoneSoft }}>
                        {d.type} · {d.grootte} · {d.bijgewerkt}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold"
                      style={{ ...mono, color: m.fg }}
                    >
                      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Pot>
        </div>
        <div>
          <Kop Icon={Sparkles} sub="Wordt gecontroleerd…">
            Nu in bewerking
          </Kop>
          <Pot shadow={potShadowSm} className="mt-4 p-4">
            {/* Loading-skeleton in keramiek-stijl */}
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 shrink-0 animate-pulse rounded-full"
                    style={{ background: C.creamDeep }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2.5 animate-pulse rounded-full"
                      style={{ background: C.creamDeep, width: `${80 - i * 14}%` }}
                    />
                    <div
                      className="h-2 animate-pulse rounded-full"
                      style={{ background: C.lineSoft, width: `${55 - i * 8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px]" style={{ ...mono, color: C.stoneSoft }}>
              Reanimatie / BLS wordt beoordeeld door de verificatiedienst.
            </p>
          </Pot>
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
      <Kop Icon={Hammer} sub="Op volgorde van urgentie — pak de bovenste eerst">
        Volgende beste acties
      </Kop>
      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Pot
                interactive
                shadow={potShadowSm}
                seamTop={warn}
                bg={warn ? C.goldWash : C.porcelain}
                className="flex items-stretch"
              >
                <span
                  className="flex w-14 shrink-0 items-center justify-center text-[26px] font-semibold"
                  style={{
                    ...display,
                    background: warn ? "transparent" : C.cream,
                    color: warn ? C.gold : C.stoneSoft,
                    borderRight: `1px solid ${warn ? C.goldSoft : C.lineSoft}`,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={22} strokeWidth={2} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.gold : C.clay,
                        color: warn ? C.white : C.stoneDeep,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.4} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-semibold tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.stone }}>
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      ...serif,
                      background: C.ink,
                      color: C.goldSoft,
                      ["--tw-ring-color" as string]: C.goldSoft,
                    }}
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Pot>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft, ring: "#bcd4bf" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.warn, bg: C.warnSoft, ring: C.goldSoft };
    return { label: "Concept", Icon: FileText, fg: C.stoneDeep, bg: C.clay, ring: C.lineSoft };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Kop Icon={FileText} sub="Verzonden & betaald">
          Facturen
        </Kop>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...serif,
            background: C.gold,
            color: C.ink,
            ["--tw-ring-color" as string]: C.goldSoft,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, bg: C.ink, fg: C.goldSoft, sub: C.stoneSoft },
          { l: "Openstaand", v: `${open}`, bg: C.goldWash, fg: C.ink, sub: C.stone },
          { l: "Te factureren", v: "€ 1.350", bg: C.porcelain, fg: C.ink, sub: C.stone },
        ].map((s) => (
          <Pot
            key={s.l}
            interactive
            shadow={potShadowSm}
            bg={s.bg}
            className="p-4"
            style={s.bg === C.ink ? { backgroundImage: "none" } : undefined}
          >
            <div
              className="text-[10.5px] font-medium uppercase tracking-[0.08em]"
              style={{ ...mono, color: s.sub }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Pot>
        ))}
      </div>

      <Pot className="overflow-hidden">
        {/* Inline foutmelding-voorbeeld — bewijst error-state in de designtaal */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5"
          style={{ background: C.dangerSoft, borderBottom: `1px solid #e6c4b8` }}
        >
          <TriangleAlert
            size={14}
            strokeWidth={2.2}
            style={{ color: C.danger }}
            aria-hidden="true"
          />
          <span className="text-[12px] font-medium" style={{ color: C.danger }}>
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
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#f6efdc]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: m.bg, border: `1px solid ${m.ring}` }}
                  aria-hidden="true"
                >
                  <m.Icon size={15} strokeWidth={2} style={{ color: m.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-semibold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px]" style={{ color: C.stone }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ ...mono, background: m.bg, color: m.fg, border: `1px solid ${m.ring}` }}
                >
                  <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                </span>
                <span
                  className="w-24 text-right text-[16px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between p-4" style={{ background: C.ink }}>
          <span
            className="text-[11px] font-medium uppercase tracking-[0.1em]"
            style={{ ...mono, color: C.stoneSoft }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-semibold tabular-nums"
            style={{ ...display, color: C.goldSoft }}
          >
            {betaald}
          </span>
        </div>
      </Pot>
    </div>
  );
}
