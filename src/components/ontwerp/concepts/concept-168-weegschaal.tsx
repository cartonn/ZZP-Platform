"use client";

// Concept 168 — "Weegschaal" · balans & eerlijkheid (messing). De justitie-/apothekersweegschaal
// als metafoor: symmetrisch evenwicht is het layout-principe, messing/brons weegschaal-motieven,
// twee-zijdige balans (past bij eerlijke, verklaarbare matching én tweezijdige beoordelingen
// opdrachtgever ↔ ZZP'er). Warm neutraal + messing accent, klassiek-vertrouwd maar strak-modern.
// Onderscheidend van klinische apotheek-labels: dit draait om BALANS/evenwicht als visuele taal.
// Status nooit kleur-alleen: altijd label + icoon (+ tint). Deterministisch — geen random/Date.
// UI-taal Nederlands, code Engels. Fonts: Newsreader (serif display) + Instrument Sans + JetBrains Mono.

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
  Minus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  TriangleAlert,
  Scale,
  Equal,
  Landmark,
  Handshake,
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
  BERICHTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — warm neutraal papier + messing/brons accent ──────────────────────────
const C = {
  // Ondergronden
  paper: "#faf6ee",
  paperSoft: "#f2ecdf",
  paperDeep: "#e8e0cf",
  ivory: "#fffdf7",
  // Messing / brons
  brass: "#a9863f",
  brassDeep: "#846421",
  brassBright: "#cba85f",
  brassPale: "#efe3c4",
  bronze: "#6f5527",
  bronzeDeep: "#4d3a1a",
  // Tekst
  ink: "#2a2620",
  inkSoft: "#5f584b",
  inkFaint: "#8c8474",
  line: "#d8cdb2",
  // Status
  ok: "#3d7a44",
  okSoft: "#e6efdb",
  warn: "#a9741f",
  warnSoft: "#f5e8cf",
  danger: "#a53a2e",
  dangerSoft: "#f4ddd7",
  white: "#fffdf7",
};

const display = { fontFamily: "var(--font-lab-newsreader)" };
const sans = { fontFamily: "var(--font-lab-instrument)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Messing-verloop — voor beslagwerk/accenten (subtiel, niet glimmend-goedkoop).
const brassFill = `linear-gradient(145deg, ${C.brassBright}, ${C.brass} 45%, ${C.brassDeep})`;
const bronzeFill = `linear-gradient(160deg, ${C.bronze}, ${C.bronzeDeep})`;

// Fijne lijn + zachte slagschaduw — klassiek passe-partout kader.
const cardShadow = `inset 0 0 0 1px ${C.line}, 0 1px 0 ${C.line}, 0 12px 26px -20px rgba(77,58,26,0.4)`;

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, fg: C.white, bg: C.ok, ring: "#2c5a31" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.ink, bg: C.brassPale, ring: C.brass };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.white,
        bg: C.warn,
        ring: "#83590f",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.white, bg: C.danger, ring: "#7e2b21" };
  }
}

function StatusTag({ status, small = false }: { status: CredStatus; small?: boolean }) {
  const m = credMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-[0.01em] ${
        small ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]"
      }`}
      style={{ ...sans, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <m.Icon size={small ? 11 : 12.5} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Weegschaal-motief — de kern. Een balk met twee schalen die kantelt naar het
//    zwaarste gewicht (deterministisch uit de gegeven waarden). ────────────────────
function BalanceBeam({
  left,
  right,
  leftLabel,
  rightLabel,
  size = "md",
}: {
  left: number;
  right: number;
  leftLabel: string;
  rightLabel: string;
  size?: "sm" | "md";
}) {
  const total = left + right || 1;
  // Kanteling: positief = links zwaarder (zakt), max ±9°.
  const tilt = Math.max(-9, Math.min(9, ((left - right) / total) * 18));
  const w = size === "sm" ? 200 : 260;
  const h = size === "sm" ? 96 : 118;
  const cx = w / 2;
  const beamY = size === "sm" ? 30 : 34;
  const arm = size === "sm" ? 74 : 96;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - Math.cos(rad) * arm;
  const ly = beamY + Math.sin(rad) * arm;
  const rx = cx + Math.cos(rad) * arm;
  const ry = beamY - Math.sin(rad) * arm;
  const panDrop = size === "sm" ? 26 : 32;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      className="max-w-full"
      role="img"
      aria-label={`Balans: ${leftLabel} ${left} tegenover ${rightLabel} ${right}`}
    >
      <defs>
        <linearGradient id="beam-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.brassBright} />
          <stop offset="0.5" stopColor={C.brass} />
          <stop offset="1" stopColor={C.brassDeep} />
        </linearGradient>
      </defs>
      {/* Staander */}
      <rect
        x={cx - 2.5}
        y={beamY}
        width={5}
        height={h - beamY - 12}
        fill="url(#beam-brass)"
        rx={2}
      />
      <ellipse
        cx={cx}
        cy={h - 8}
        rx={size === "sm" ? 26 : 34}
        ry={6}
        fill={C.brassDeep}
        opacity={0.5}
      />
      {/* Draaipunt */}
      <circle
        cx={cx}
        cy={beamY}
        r={6}
        fill="url(#beam-brass)"
        stroke={C.bronzeDeep}
        strokeWidth={1}
      />
      {/* Balk */}
      <line
        x1={lx}
        y1={ly}
        x2={rx}
        y2={ry}
        stroke="url(#beam-brass)"
        strokeWidth={size === "sm" ? 4 : 5}
        strokeLinecap="round"
      />
      {/* Kettingen + schalen */}
      {[
        { x: lx, y: ly, val: left },
        { x: rx, y: ry, val: right },
      ].map((p, i) => (
        <g key={i}>
          <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + panDrop} stroke={C.brass} strokeWidth={1.2} />
          <path
            d={`M ${p.x - 14} ${p.y + panDrop} Q ${p.x} ${p.y + panDrop + 10} ${p.x + 14} ${p.y + panDrop} Z`}
            fill="url(#beam-brass)"
            stroke={C.bronzeDeep}
            strokeWidth={0.8}
          />
          <text
            x={p.x}
            y={p.y + panDrop - 4}
            textAnchor="middle"
            fontSize={size === "sm" ? 11 : 13}
            fontWeight={700}
            fill={C.bronzeDeep}
            style={mono}
          >
            {p.val}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Messing-plaquette — sectiekop met gegraveerd label.
function Plaque({
  children,
  Icon,
  kicker,
}: {
  children: React.ReactNode;
  Icon: LucideIcon;
  kicker?: string;
}) {
  return (
    <div className="min-w-0">
      {kicker && (
        <div
          className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.24em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          {kicker}
        </div>
      )}
      <h2
        className="flex items-center gap-2.5 text-[20px] font-medium tracking-[-0.01em] sm:text-[23px]"
        style={{ ...display, color: C.ink }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: brassFill, boxShadow: `inset 0 0 0 1px ${C.brassDeep}` }}
          aria-hidden="true"
        >
          <Icon size={14} strokeWidth={2} style={{ color: C.white }} />
        </span>
        {children}
      </h2>
    </div>
  );
}

// Klassiek omkaderd papieren paneel.
function Card({
  children,
  className = "",
  bg = C.ivory,
  interactive = false,
  as = "div",
  style,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  interactive?: boolean;
  as?: "div" | "li";
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLElement>) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-[12px] ${
        interactive
          ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_0_#d8cdb2,0_18px_32px_-20px_rgba(77,58,26,0.5)]"
          : ""
      } ${className}`}
      style={{ background: bg, boxShadow: cardShadow, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={13} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-cijfer op een messing medaillon (waarde draagt de betekenis, niet kleur-alleen).
function matchTone(m: number): { bg: string; fg: string; sub: string } {
  if (m >= 90) return { bg: brassFill, fg: C.white, sub: C.brassPale };
  if (m >= 84) return { bg: C.brassPale, fg: C.bronzeDeep, sub: C.bronze };
  return { bg: C.paperDeep, fg: C.ink, sub: C.inkFaint };
}

// Mini-grafiek — symmetrisch gespiegelde staafjes rond een middenlijn (balans-idioom).
function MirrorBars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-center gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const last = i === data.length - 1;
        const hh = Math.max(8, (v / max) * 100);
        return (
          <span key={i} className="flex flex-1 flex-col items-center justify-center gap-[1px]">
            <span
              className="w-full rounded-t-[2px]"
              style={{ height: `${hh / 2}%`, background: last ? C.brass : C.line }}
            />
            <span
              className="w-full rounded-b-[2px]"
              style={{ height: `${hh / 2}%`, background: last ? C.brassBright : C.paperDeep }}
            />
          </span>
        );
      })}
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept168() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(1100px 520px at 50% -8%, ${C.paper}, ${C.paperSoft})`,
      }}
    >
      {/* Kop — symmetrisch: logo-links, balans-midden, profiel-rechts */}
      <header
        className="grid grid-cols-2 items-center gap-3 px-4 py-4 md:grid-cols-3 md:px-8"
        style={{ background: C.ivory, boxShadow: `inset 0 -1px 0 ${C.line}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: brassFill, boxShadow: `inset 0 0 0 1px ${C.brassDeep}` }}
            aria-hidden="true"
          >
            <Scale size={22} strokeWidth={1.9} style={{ color: C.white }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[20px] font-medium tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Weegschaal
            </div>
            <div
              className="text-[9.5px] font-medium uppercase tracking-[0.22em]"
              style={{ ...mono, color: C.inkFaint }}
            >
              Eerlijk · in balans
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <span
            className="flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em]"
            style={{
              ...mono,
              background: C.paperSoft,
              color: C.inkSoft,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            <Equal size={12} strokeWidth={2.4} style={{ color: C.brass }} aria-hidden="true" /> Werk
            · Verificatie · Omzet
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium sm:inline-flex"
            style={{
              ...sans,
              background: C.paperSoft,
              color: C.ink,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.2} style={{ color: C.ok }} aria-hidden="true" />{" "}
            {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
            style={{
              ...mono,
              background: brassFill,
              color: C.white,
              boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher — gecentreerde tabs op een messing rail */}
      <nav
        className="flex items-center justify-center gap-1 overflow-x-auto px-4 py-3 md:px-8"
        aria-label="Schermen"
        style={{ background: C.paperSoft, boxShadow: `inset 0 -1px 0 ${C.line}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium tracking-[0.01em] transition-[background,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={
                on
                  ? {
                      ...sans,
                      color: C.white,
                      background: brassFill,
                      boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
                      ["--tw-ring-color" as string]: C.brass,
                    }
                  : {
                      ...sans,
                      color: C.inkSoft,
                      background: "transparent",
                      ["--tw-ring-color" as string]: C.brass,
                    }
              }
            >
              <span className="mr-1.5 tabular-nums opacity-50" style={mono}>
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
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const inBehandeling = CREDENTIALS.length - verified;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Hero — evenwichtig tweeluik: boodschap links, weegschaal rechts */}
      <Card bg={C.ivory} className="overflow-hidden">
        <div className="grid grid-cols-1 items-center gap-6 p-6 sm:p-9 lg:grid-cols-[1.4fr,1fr]">
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ ...mono, background: C.paperSoft, color: C.inkSoft }}
            >
              <Handshake
                size={12}
                strokeWidth={2.2}
                style={{ color: C.brass }}
                aria-hidden="true"
              />{" "}
              {PROFIEL.rol}
            </span>
            <h1
              className="mt-4 text-[30px] font-medium leading-[1.05] tracking-[-0.015em] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches boven 85%. Alles netjes in balans.
            </h1>
            <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              Eén taak trekt de balans scheef: je VOG verloopt binnenkort. Breng het weer in
              evenwicht en blijf verifieerbaar voor opdrachtgevers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: brassFill,
                  color: C.white,
                  boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                Bekijk matches <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...sans,
                  background: C.paper,
                  color: C.ink,
                  boxShadow: `inset 0 0 0 1px ${C.line}`,
                  ["--tw-ring-color" as string]: C.brass,
                }}
              >
                <TriangleAlert size={15} strokeWidth={2.2} aria-hidden="true" /> Los actie op
              </button>
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-[12px] p-4"
            style={{ background: C.paperSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <BalanceBeam
              left={verified}
              right={inBehandeling}
              leftLabel="Geverifieerd"
              rightLabel="Nog te doen"
            />
            <div className="mt-1 flex w-full items-center justify-between px-2 text-[11px] font-medium">
              <span className="flex items-center gap-1" style={{ color: C.ok }}>
                <Check size={12} strokeWidth={2.6} aria-hidden="true" /> Geverifieerd
              </span>
              <span className="flex items-center gap-1" style={{ color: C.warn }}>
                <Clock size={12} strokeWidth={2.6} aria-hidden="true" /> Nog te doen
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI-panelen */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} interactive className="p-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
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
              className="mt-2 text-[27px] font-medium leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <MirrorBars data={k.spark} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Plaque Icon={Star} kicker="Aanbevolen">
            Matches voor jou
          </Plaque>
          <div className="space-y-4">
            {OPDRACHTEN.map((o) => {
              const mt = matchTone(o.match);
              return (
                <Card key={o.id} interactive className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ ["--tw-ring-color" as string]: C.brass, borderRadius: 11 }}
                  >
                    <span
                      className="flex w-[74px] shrink-0 flex-col items-center justify-center"
                      style={{ background: mt.bg, boxShadow: `inset -1px 0 0 ${C.line}` }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[22px] font-medium leading-none"
                        style={{ ...display, color: mt.fg }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em]"
                        style={{ ...mono, color: mt.sub }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[16px] font-medium tracking-[-0.01em]"
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
                      {/* Balans-strip: pluspunten vs afwegingen */}
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: C.ok }}
                        >
                          <Plus size={11} strokeWidth={2.8} aria-hidden="true" />{" "}
                          {o.redenen.plus.length} vóór
                        </span>
                        <span
                          className="h-3 w-px"
                          style={{ background: C.line }}
                          aria-hidden="true"
                        />
                        <span
                          className="flex items-center gap-1 text-[11px] font-medium"
                          style={{ color: C.warn }}
                        >
                          <Minus size={11} strokeWidth={2.8} aria-hidden="true" />{" "}
                          {o.redenen.min.length} afweging
                        </span>
                      </div>
                    </div>
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-4">
          <Plaque Icon={ShieldCheck} kicker="Vertrouwen">
            Balans
          </Plaque>
          <Card className="p-5">
            <div className="flex items-end justify-between">
              <div
                className="text-[54px] font-medium leading-none tracking-[-0.03em]"
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
              style={{ background: C.paperDeep, boxShadow: `inset 0 0 0 1px ${C.line}` }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${dek}%`, background: brassFill }}
              />
            </div>
          </Card>

          <Card bg={bronzeFill} className="overflow-hidden p-5" style={{ boxShadow: "none" }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.brassBright, color: C.bronzeDeep }}
            >
              <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
            </span>
            <h3
              className="mt-2.5 text-[18px] font-medium leading-tight"
              style={{ ...display, color: C.white }}
            >
              {warn.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.brassPale }}>
              {warn.detail}
            </p>
            <button
              onClick={onActies}
              className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                ...sans,
                background: C.brassBright,
                color: C.bronzeDeep,
                ["--tw-ring-color" as string]: C.brassBright,
              }}
            >
              {warn.cta} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </Card>
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
        <Plaque Icon={Landmark} kicker="Marktplaats">
          Open opdrachten
        </Plaque>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{ background: C.ivory, boxShadow: `inset 0 0 0 1px ${C.line}` }}
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
        <Card className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.paperSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} style={{ color: C.brass }} />
          </span>
          <p className="text-[19px] font-medium" style={{ ...display, color: C.ink }}>
            Geen resultaat
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
            Niets gevonden voor “{q}”. Pas je zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-full px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...sans,
              background: brassFill,
              color: C.white,
              ["--tw-ring-color" as string]: C.brass,
            }}
          >
            Zoekterm wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const mt = matchTone(o.match);
            return (
              <Card key={o.id} interactive className="flex flex-col overflow-hidden">
                <div className="flex items-stretch">
                  <span
                    className="flex w-14 shrink-0 flex-col items-center justify-center"
                    style={{ background: mt.bg, boxShadow: `inset -1px 0 0 ${C.line}` }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[18px] font-medium leading-none"
                      style={{ ...display, color: mt.fg }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-medium uppercase tracking-[0.1em]"
                      style={{ ...mono, color: mt.sub }}
                    >
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 p-4">
                    <h3
                      className="text-[15.5px] font-medium leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-1 text-[12px]" style={{ color: C.inkSoft }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                </div>
                <div className="p-4" style={{ borderTop: `1px solid ${C.line}` }}>
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
                          background: C.paperSoft,
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
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12px] font-medium tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    ...sans,
                    background: C.paperSoft,
                    color: C.brassDeep,
                    borderTop: `1px solid ${C.line}`,
                    ["--tw-ring-color" as string]: C.brass,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                </button>
              </Card>
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
  const plus = opdracht.redenen.plus.length;
  const min = opdracht.redenen.min.length;
  const verdict =
    plus > min ? "Weegt positief door" : plus === min ? "In evenwicht" : "Weeg goed af";

  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...sans,
          background: C.ivory,
          color: C.ink,
          boxShadow: `inset 0 0 0 1px ${C.line}`,
          ["--tw-ring-color" as string]: C.brass,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Card bg={C.ivory} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, background: C.paperSoft, color: C.brassDeep }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[28px] font-medium leading-[1.05] tracking-[-0.015em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center rounded-full px-5 py-4"
            style={{ background: brassFill, boxShadow: `inset 0 0 0 1px ${C.brassDeep}` }}
          >
            <span
              className="text-[46px] font-medium leading-none"
              style={{ ...display, color: C.white }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ ...mono, color: C.brassPale }}
            >
              % match
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {feiten.map((f) => (
          <Card key={f.l} interactive className="p-4">
            <f.Icon size={16} strokeWidth={2} style={{ color: C.brass }} aria-hidden="true" />
            <div
              className="mt-2.5 text-[17px] font-medium leading-none"
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
          </Card>
        ))}
      </div>

      {/* De weegschaal-kern: symmetrische afweging vóór ↔ afweging, met verdict */}
      <Card className="overflow-hidden">
        <div
          className="flex flex-col items-center gap-2 p-5"
          style={{ background: C.paperSoft, borderBottom: `1px solid ${C.line}` }}
        >
          <BalanceBeam
            left={plus}
            right={min}
            leftLabel="Pluspunten"
            rightLabel="Afwegingen"
            size="sm"
          />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
            style={{
              ...sans,
              background: C.ivory,
              color: C.brassDeep,
              boxShadow: `inset 0 0 0 1px ${C.line}`,
            }}
          >
            <Scale size={13} strokeWidth={2.2} aria-hidden="true" /> {verdict}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.line}` }}>
            <div
              className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.ok }}
            >
              <Plus size={13} strokeWidth={2.6} aria-hidden="true" /> Waarom dit past
            </div>
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.ok }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.white }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="p-5 md:border-l"
            style={{ borderColor: C.line, borderTop: `1px solid ${C.line}` }}
          >
            <div
              className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.warn }}
            >
              <Minus size={13} strokeWidth={2.6} aria-hidden="true" /> Om te overwegen
            </div>
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warn }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.8} style={{ color: C.white }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: brassFill,
            color: C.white,
            boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.ivory,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.line}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Star size={15} strokeWidth={2} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie ──────────────────────────────────────────────────────────────────
function Verificatie() {
  const [busy, setBusy] = useState(false);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const inBehandeling = CREDENTIALS.length - verified;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Plaque Icon={ShieldCheck} kicker="Certificaten">
          Verificatie
        </Plaque>
        <button
          onClick={() => setBusy((b) => !b)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: brassFill,
            color: C.white,
            boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Certificaat toevoegen
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 items-center gap-4 p-6 sm:grid-cols-[1fr,auto]">
          <div className="flex items-center gap-5">
            <div
              className="text-[56px] font-medium leading-none tracking-[-0.03em]"
              style={{ ...display, color: C.ink }}
            >
              {dek}
              <span className="text-[24px]" style={{ color: C.inkFaint }}>
                %
              </span>
            </div>
            <div className="max-w-xs">
              <div className="text-[16px] font-medium" style={{ ...display, color: C.ink }}>
                {verified}/{CREDENTIALS.length} geverifieerd
              </div>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: C.inkSoft }}>
                Opdrachtgevers zien alleen geverifieerde certificaten. Houd de balans in evenwicht
                voor het hoogste vertrouwen.
              </p>
            </div>
          </div>
          <div
            className="flex flex-col items-center rounded-[12px] p-3"
            style={{ background: C.paperSoft, boxShadow: `inset 0 0 0 1px ${C.line}` }}
          >
            <BalanceBeam
              left={verified}
              right={inBehandeling}
              leftLabel="Geverifieerd"
              rightLabel="Nog te doen"
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Loading-toestand — skeleton terwijl een certificaat wordt gewogen */}
      {busy && (
        <Card className="flex items-center gap-4 p-5" role="status" aria-live="polite">
          <span
            className="h-11 w-11 shrink-0 animate-pulse rounded-full"
            style={{ background: C.paperDeep }}
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2">
            <span
              className="block h-3.5 w-1/3 animate-pulse rounded-full"
              style={{ background: C.paperDeep }}
              aria-hidden="true"
            />
            <span
              className="block h-3 w-2/3 animate-pulse rounded-full"
              style={{ background: C.paperDeep }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[12px] font-medium" style={{ ...mono, color: C.inkFaint }}>
            Certificaat wordt gewogen…
          </span>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Card key={c.naam} interactive className="flex items-stretch overflow-hidden">
              <span
                className="flex w-12 shrink-0 items-center justify-center"
                style={{ background: m.bg, boxShadow: `inset -1px 0 0 ${m.ring}` }}
                aria-hidden="true"
              >
                <m.Icon size={20} strokeWidth={2} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1 p-4">
                <div
                  className="truncate text-[15px] font-medium tracking-[-0.01em]"
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
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        ...sans,
                        background: C.paperSoft,
                        color: C.brassDeep,
                        boxShadow: `inset 0 0 0 1px ${C.line}`,
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
            </Card>
          );
        })}
      </div>

      {/* Error-voorbeeld — afgewezen indiening met verplichte reden + herstelactie */}
      <Card
        bg={C.dangerSoft}
        className="flex flex-wrap items-center gap-3 p-4"
        style={{ boxShadow: `inset 0 0 0 1px ${C.danger}` }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.danger }}
          aria-hidden="true"
        >
          <XCircle size={17} strokeWidth={2.4} style={{ color: C.white }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium" style={{ color: C.danger }}>
            Afgewezen · reden verplicht bij herindiening
          </div>
          <div className="text-[12px]" style={{ color: C.inkSoft }}>
            Voeg een leesbare scan van de VOG toe en licht toe wat er is aangepast.
          </div>
        </div>
        <button
          className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: C.danger,
            color: C.white,
            ["--tw-ring-color" as string]: C.danger,
          }}
        >
          Opnieuw indienen
        </button>
      </Card>
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
        <Plaque Icon={Scale} kicker="Evenwicht">
          Volgende beste acties
        </Plaque>
        <p className="mt-2 pl-9 text-[13px]" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie — breng eerst het zwaarste weer in balans.
        </p>
      </div>
      <ol className="space-y-5">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card
                interactive
                bg={warn ? bronzeFill : C.ivory}
                className="flex items-stretch overflow-hidden"
                style={warn ? { boxShadow: "none" } : undefined}
              >
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[26px] font-medium"
                  style={{
                    ...display,
                    background: warn ? "rgba(0,0,0,0.18)" : C.paperSoft,
                    color: warn ? C.white : C.brassDeep,
                    boxShadow: `inset -1px 0 0 ${warn ? "rgba(0,0,0,0.25)" : C.line}`,
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
                        background: warn ? C.brassBright : C.paperSoft,
                        color: warn ? C.bronzeDeep : C.brassDeep,
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
                      className="text-[16px] font-medium tracking-[-0.01em]"
                      style={{ ...display, color: warn ? C.white : C.ink }}
                    >
                      {a.titel}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 text-[13px] leading-relaxed"
                    style={{ color: warn ? C.brassPale : C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            ...sans,
                            background: C.brassBright,
                            color: C.bronzeDeep,
                            ["--tw-ring-color" as string]: C.brassBright,
                          }
                        : {
                            ...sans,
                            background: brassFill,
                            color: C.white,
                            ["--tw-ring-color" as string]: C.brass,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>

      {/* Tweezijdige beoordeling — berichten als evenwicht opdrachtgever ↔ ZZP'er */}
      <div className="space-y-4 pt-2">
        <Plaque Icon={Handshake} kicker="Tweezijdig">
          Recente berichten
        </Plaque>
        <Card className="overflow-hidden">
          <ul>
            {BERICHTEN.map((b, i) => (
              <li
                key={b.van}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[#f2ecdf]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    ...mono,
                    background: C.paperSoft,
                    color: C.brassDeep,
                    boxShadow: `inset 0 0 0 1px ${C.line}`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13.5px] font-medium"
                      style={{ ...display, color: C.ink }}
                    >
                      {b.van}
                    </span>
                    {b.ongelezen && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em]"
                        style={{ ...mono, background: C.brassPale, color: C.brassDeep }}
                      >
                        Nieuw
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px]" style={{ color: C.inkSoft }}>
                    {b.preview}
                  </div>
                </div>
                <span className="text-[11px]" style={{ ...mono, color: C.inkFaint }}>
                  {b.tijd}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (status: string): StatusStyle => {
    if (status === "Betaald")
      return { label: "Betaald", Icon: Check, fg: C.white, bg: C.ok, ring: "#2c5a31" };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.white, bg: C.warn, ring: "#83590f" };
    return { label: "Concept", Icon: FileText, fg: C.ink, bg: C.brassPale, ring: C.brass };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Plaque Icon={FileText} kicker="Omzet">
          Facturen
        </Plaque>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...sans,
            background: brassFill,
            color: C.white,
            boxShadow: `inset 0 0 0 1px ${C.brassDeep}`,
            ["--tw-ring-color" as string]: C.brass,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        {[
          {
            l: "Betaald (mnd)",
            v: betaald,
            bg: bronzeFill,
            fg: C.white,
            meta: C.brassPale,
            dark: true,
          },
          {
            l: "Openstaand",
            v: `${open}`,
            bg: C.brassPale,
            fg: C.bronzeDeep,
            meta: C.bronze,
            dark: false,
          },
          {
            l: "Te factureren",
            v: "€ 1.350",
            bg: C.ivory,
            fg: C.ink,
            meta: C.inkFaint,
            dark: false,
          },
        ].map((s) => (
          <Card
            key={s.l}
            interactive
            bg={s.bg}
            className="p-4"
            style={s.dark ? { boxShadow: "none" } : undefined}
          >
            <div
              className="text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{ ...mono, color: s.meta }}
            >
              {s.l}
            </div>
            <div
              className="mt-2 text-[26px] font-medium leading-none tracking-[-0.02em]"
              style={{ ...display, color: s.fg }}
            >
              {s.v}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div
          className="hidden grid-cols-[1fr,auto,auto] items-center gap-4 px-4 py-3 text-[10.5px] font-medium uppercase tracking-[0.1em] sm:grid"
          style={{ ...mono, background: C.paperSoft, color: C.inkFaint }}
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
                className="grid grid-cols-1 items-center gap-3 p-4 transition-colors hover:bg-[#f2ecdf] sm:grid-cols-[1fr,auto,auto] sm:gap-4"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: m.bg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
                    aria-hidden="true"
                  >
                    <m.Icon size={15} strokeWidth={2.4} style={{ color: m.fg }} />
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13.5px] font-medium tracking-[-0.01em]"
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      ...sans,
                      background: m.bg,
                      color: m.fg,
                      boxShadow: `inset 0 0 0 1px ${m.ring}`,
                    }}
                  >
                    <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" /> {m.label}
                  </span>
                </span>
                <span
                  className="text-[16px] font-medium tabular-nums sm:w-24 sm:text-right"
                  style={{ ...mono, color: C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between p-4" style={{ background: bronzeFill }}>
          <span
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ ...mono, color: C.brassPale }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-medium tabular-nums"
            style={{ ...display, color: C.white }}
          >
            {betaald}
          </span>
        </div>
      </Card>

      <p
        className="flex items-center justify-center gap-1.5 text-center text-[12px]"
        style={{ color: C.inkFaint }}
      >
        <Info size={13} strokeWidth={2} aria-hidden="true" /> Bedragen zijn indicatief en excl. btw
        — puur ter illustratie van de designtaal.
      </p>
    </div>
  );
}
