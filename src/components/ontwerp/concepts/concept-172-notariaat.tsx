"use client";

// Concept 172 — "Notariaat" · ledger-serif formeel / notarieel. 2026-trend: type-dominant layouts
// met elegante serif-headlines + ledger-tabellen met tabulaire cijfers ("leest als een goed
// vormgegeven belastingaangifte, geen pitch deck"). Ivoor/perkament-wit, hairline-regels, tabular-nums
// overal, en een embossed reliëf-zegel als "geverifieerd"-motief. Vertrouwen via juridische formaliteit
// en rust. Status nooit kleur-alleen: altijd label + icoon. Deterministisch — geen random/Date.
// UI-taal Nederlands. Fonts: Fraunces (serif-display) + Newsreader (serif-tekst) + IBM Plex Mono (ledger).

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
  Stamp,
  ScrollText,
  TriangleAlert,
  ChevronRight,
  RefreshCw,
  BookMarked,
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

// ── Palet — ivoor/perkament met notarieel burgundy-zegel & goudfolie ───────────────
const C = {
  bg: "#f4efe4", // perkament
  bgDeep: "#ebe3d3", // secundair perkamentvlak
  card: "#fffdf6", // papier-wit
  ink: "#2b2620", // inktzwart-bruin
  inkSoft: "#5b5346", // secundaire tekst
  inkFaint: "#948b7b", // labels
  hair: "#dcd2bd", // hairline-regel
  hairStrong: "#c7ba9f", // sterkere regel
  seal: "#8a3033", // notarieel burgundy (zegel)
  sealSoft: "#efe1de",
  gold: "#a98a3f", // goudfolie
  goldSoft: "#f0e7cf",
  ok: "#3f6b46",
  okSoft: "#e4ecde",
  warn: "#9a6a24",
  warnSoft: "#f2e7cd",
  info: "#34506e",
  infoSoft: "#e1e8ef",
  danger: "#8a3033",
  dangerSoft: "#efe1de",
  white: "#ffffff",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyF = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// ── Embossed reliëf-zegel — "geverifieerd"-motief met tekst op een cirkelpad ────────
function Seal({ size = 84, label = "GEVERIFIEERD" }: { size?: number; label?: string }) {
  const c = size / 2;
  const rText = c * 0.78;
  const rosette = [];
  const petals = 16;
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    const rad = (a * Math.PI) / 180;
    const x1 = c + Math.cos(rad) * c * 0.34;
    const y1 = c + Math.sin(rad) * c * 0.34;
    const x2 = c + Math.cos(rad) * c * 0.5;
    const y2 = c + Math.sin(rad) * c * 0.5;
    rosette.push(
      <line
        key={i}
        x1={x1.toFixed(2)}
        y1={y1.toFixed(2)}
        x2={x2.toFixed(2)}
        y2={y2.toFixed(2)}
        stroke={C.seal}
        strokeWidth={size > 60 ? 1.4 : 1}
        opacity={0.65}
      />,
    );
  }
  const id = `seal-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.7))" }}
    >
      <defs>
        <path
          id={`${id}-path`}
          d={`M ${c} ${c} m -${rText} 0 a ${rText} ${rText} 0 1 1 ${rText * 2} 0 a ${rText} ${rText} 0 1 1 -${rText * 2} 0`}
          fill="none"
        />
      </defs>
      <circle cx={c} cy={c} r={c - 1} fill="none" stroke={C.seal} strokeWidth={1.4} opacity={0.9} />
      <circle
        cx={c}
        cy={c}
        r={c * 0.9}
        fill="none"
        stroke={C.seal}
        strokeWidth={0.7}
        opacity={0.5}
      />
      <circle
        cx={c}
        cy={c}
        r={c * 0.56}
        fill="none"
        stroke={C.seal}
        strokeWidth={0.8}
        opacity={0.7}
      />
      {rosette}
      {size > 56 && (
        <text
          style={{ ...mono }}
          fontSize={size * 0.088}
          letterSpacing={size * 0.028}
          fill={C.seal}
          fontWeight={600}
        >
          <textPath href={`#${id}-path`} startOffset="2%">
            {label} · ZZP · {label} · ZZP ·
          </textPath>
        </text>
      )}
      <g transform={`translate(${c} ${c})`}>
        <circle r={c * 0.24} fill={C.sealSoft} />
        <path
          d={`M ${(-c * 0.11).toFixed(2)} 0 L ${(-c * 0.03).toFixed(2)} ${(c * 0.08).toFixed(2)} L ${(c * 0.13).toFixed(2)} ${(-c * 0.1).toFixed(2)}`}
          fill="none"
          stroke={C.seal}
          strokeWidth={size * 0.05}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// ── Status — nooit kleur-alleen (icoon + label + tint) ─────────────────────────────
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
      style={{ ...mono, background: m.bg, color: m.fg, borderRadius: 3 }}
    >
      <m.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Notariële kaart — papier-wit met hairline-rand, minimale afronding (formeel document).
function Sheet({
  children,
  className = "",
  style,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  return (
    <div
      className={`transition-colors duration-200 ${interactive ? "hover:bg-[#fffefb]" : ""} ${className}`}
      style={{ background: C.card, border: `1px solid ${C.hair}`, borderRadius: 4, ...style }}
    >
      {children}
    </div>
  );
}

// Sectie-kop — serif-titel met notarieel nummer en dubbele hairline.
function SectionHead({ title, sub, artikel }: { title: string; sub?: string; artikel?: string }) {
  return (
    <div
      className="flex items-end justify-between gap-3 pb-2"
      style={{ borderBottom: `2px solid ${C.ink}` }}
    >
      <div className="min-w-0">
        {artikel && (
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ ...mono, color: C.seal }}
          >
            {artikel}
          </div>
        )}
        <h2
          className="text-[22px] font-semibold leading-tight tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
      </div>
      {sub && (
        <span
          className="hidden shrink-0 pb-1 text-[11px] italic sm:block"
          style={{ ...bodyF, color: C.inkFaint }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// Match-gradering — grote serif-cijfer met geruimde ledger-balk (hairline-vulling).
function MatchGrade({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "text-[38px]" : size === "sm" ? "text-[20px]" : "text-[28px]";
  return (
    <div className="shrink-0 text-right">
      <div className="flex items-baseline justify-end gap-0.5">
        <span
          className={`${dims} font-semibold tabular-nums leading-none`}
          style={{ ...display, color: C.seal }}
        >
          {value}
        </span>
        <span className="text-[12px] font-semibold" style={{ ...mono, color: C.gold }}>
          %
        </span>
      </div>
      <div className="mt-1 flex items-center justify-end gap-1">
        <span
          className="text-[8px] font-semibold uppercase tracking-[0.16em]"
          style={{ ...mono, color: C.inkFaint }}
        >
          gradering
        </span>
      </div>
      <div
        className="mt-1 h-1 w-16"
        style={{ background: C.hair, borderRadius: 2 }}
        aria-hidden="true"
      >
        <div className="h-1" style={{ width: `${value}%`, background: C.seal, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function Meta({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-2 py-1"
      style={{ borderBottom: `1px dotted ${C.hair}` }}
    >
      <span
        className="flex items-center gap-1.5 text-[12px]"
        style={{ ...bodyF, color: C.inkFaint }}
      >
        <Icon size={13} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" /> {label}
      </span>
      <span className="text-[13px] font-medium tabular-nums" style={{ ...mono, color: C.ink }}>
        {value}
      </span>
    </div>
  );
}

// Skeleton-regel (loading-state).
function SkeletonRow() {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ borderTop: `1px solid ${C.hair}` }}
      aria-hidden="true"
    >
      <span className="h-3 w-2/5 animate-pulse" style={{ background: C.bgDeep, borderRadius: 2 }} />
      <span className="h-3 w-16 animate-pulse" style={{ background: C.bgDeep, borderRadius: 2 }} />
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────────
export function Concept172() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* Kop — notariële briefkop met zegel en dubbele regel */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.hairStrong}` }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-4">
            <Seal size={54} />
            <div className="leading-tight">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ ...mono, color: C.seal }}
              >
                Notariaat
              </div>
              <div
                className="text-[26px] font-semibold leading-none tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                Register
              </div>
              <div
                className="mt-1 text-[10px] uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                Akte · Verificatie · Grootboek
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] sm:inline-flex"
              style={{ ...mono, background: C.okSoft, color: C.ok, borderRadius: 3 }}
            >
              <ShieldCheck size={12} strokeWidth={2} aria-hidden="true" /> {PROFIEL.trust}
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center text-[13px] font-semibold"
              style={{
                ...display,
                background: C.bgDeep,
                color: C.seal,
                borderRadius: 4,
                border: `1px solid ${C.hairStrong}`,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>

        {/* Scherm-switcher — formele onderstreepte tabs */}
        <nav
          className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 md:px-8"
          aria-label="Schermen"
          style={{ borderTop: `1px solid ${C.hair}` }}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 px-3.5 py-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...display,
                  color: on ? C.seal : C.inkFaint,
                  ["--tw-ring-color" as string]: C.seal,
                }}
              >
                {s.label}
                <span
                  className="absolute inset-x-2 bottom-0 h-[2px]"
                  style={{ background: on ? C.seal : "transparent" }}
                  aria-hidden="true"
                />
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
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-8">
      {/* Akte-hoofd */}
      <Sheet className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1.7fr_1fr]">
          <div className="p-6 sm:p-8">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ ...mono, color: C.seal }}
            >
              Akte van bevindingen · {PROFIEL.rol}
            </div>
            <h1
              className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]"
              style={{ ...display, color: C.ink }}
            >
              Drie matches boven de 85%. Het grootboek loopt op.
            </h1>
            <p
              className="mt-3 max-w-lg text-[15px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Eén post vraagt uw aandacht: uw VOG verloopt binnenkort. Vernieuw haar en houd uw
              dossier onberispelijk verifieerbaar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.seal,
                  color: C.white,
                  borderRadius: 4,
                  ["--tw-ring-color" as string]: C.seal,
                  ["--tw-ring-offset-color" as string]: C.card,
                }}
              >
                Bekijk matches <ArrowRight size={15} aria-hidden="true" />
              </button>
              <button
                onClick={onActies}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.bgDeep,
                  color: C.ink,
                  borderRadius: 4,
                  border: `1px solid ${C.hairStrong}`,
                  ["--tw-ring-color" as string]: C.seal,
                  ["--tw-ring-offset-color" as string]: C.card,
                }}
              >
                <TriangleAlert
                  size={14}
                  strokeWidth={2.2}
                  style={{ color: C.warn }}
                  aria-hidden="true"
                />{" "}
                Los post op
              </button>
            </div>
          </div>
          <div
            className="flex flex-col items-center justify-center gap-3 p-6"
            style={{ background: C.bgDeep, borderLeft: `1px solid ${C.hair}` }}
          >
            <Seal size={104} />
            <div className="text-center">
              <div className="text-[13px] font-semibold" style={{ ...display, color: C.ink }}>
                Dossier gewaarmerkt
              </div>
              <div className="text-[11px]" style={{ ...bodyF, color: C.inkSoft }}>
                {verified} van {CREDENTIALS.length} stukken bekrachtigd
              </div>
            </div>
          </div>
        </div>
      </Sheet>

      {/* KPI — ledger-tabel met tabulaire cijfers */}
      <Sheet className="overflow-hidden">
        <div
          className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{
            ...mono,
            color: C.inkFaint,
            background: C.bgDeep,
            borderBottom: `1px solid ${C.hair}`,
          }}
        >
          Staat van kerncijfers
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="p-4"
              style={{
                borderRight: i % 4 !== 3 ? `1px solid ${C.hair}` : undefined,
                borderBottom: i < 2 ? `1px solid ${C.hair}` : undefined,
              }}
            >
              <div className="text-[11px]" style={{ ...bodyF, color: C.inkFaint }}>
                {k.label}
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  className="text-[26px] font-semibold tabular-nums leading-none"
                  style={{ ...display, color: C.ink }}
                >
                  {k.value}
                </span>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ ...mono, color: k.up ? C.ok : C.warn }}
                >
                  {k.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Matches — als notariële ledger-regels */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen matches"
            sub="op gradering gerangschikt"
            artikel="Artikel I"
          />
          <Sheet className="overflow-hidden">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  borderTop: i === 0 ? undefined : `1px solid ${C.hair}`,
                  ["--tw-ring-color" as string]: C.seal,
                }}
              >
                <span
                  className="w-8 shrink-0 text-[13px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.gold }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[16px] font-semibold leading-tight"
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
                <MatchGrade value={o.match} size="sm" />
                <ChevronRight
                  size={16}
                  className="shrink-0"
                  style={{ color: C.inkFaint }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </Sheet>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead title="Waarmerk" sub="dekking" artikel="Artikel II" />
          <Sheet className="p-5">
            <div className="flex items-center gap-5">
              <Seal size={84} />
              <div>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[34px] font-semibold tabular-nums leading-none"
                    style={{ ...display, color: C.seal }}
                  >
                    {dek}
                  </span>
                  <span className="text-[15px]" style={{ ...mono, color: C.gold }}>
                    %
                  </span>
                </div>
                <div className="mt-1">
                  <StatusTag status="VERIFIED" />
                </div>
                <p
                  className="mt-2 text-[13px] leading-relaxed"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  {verified}/{CREDENTIALS.length} stukken bekrachtigd. Opdrachtgevers zien
                  uitsluitend gewaarmerkte documenten.
                </p>
              </div>
            </div>
          </Sheet>

          {/* Recente inschrijvingen — loading-state (skeleton) */}
          <Sheet className="overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.inkFaint, background: C.bgDeep }}
            >
              <RefreshCw size={12} className="animate-spin" aria-hidden="true" /> Inschrijvingen
              laden…
            </div>
            <SkeletonRow />
            <SkeletonRow />
          </Sheet>

          {/* Prioriteit */}
          <Sheet style={{ background: C.warnSoft, borderColor: C.warn }}>
            <div className="p-5">
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, background: C.warn, color: C.white, borderRadius: 3 }}
              >
                <TriangleAlert size={11} strokeWidth={2.4} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[18px] font-semibold leading-tight"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[13px] leading-relaxed"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...mono,
                  background: C.warn,
                  color: C.white,
                  borderRadius: 4,
                  ["--tw-ring-color" as string]: C.warn,
                  ["--tw-ring-offset-color" as string]: C.warnSoft,
                }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </Sheet>
        </section>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead title="Marktplaats" sub="openstaande opdrachten" artikel="Register III" />
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ background: C.card, border: `1px solid ${C.hairStrong}`, borderRadius: 4 }}
        >
          <Search size={15} style={{ color: C.gold }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdracht of plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[13px] outline-none placeholder:opacity-50"
            style={{ ...bodyF, color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Sheet className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <ScrollText
            size={44}
            strokeWidth={1.4}
            style={{ color: C.inkFaint }}
            aria-hidden="true"
          />
          <p className="text-[20px] font-semibold" style={{ ...display, color: C.ink }}>
            Geen inschrijving gevonden
          </p>
          <p className="max-w-xs text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
            Het register bevat geen post voor &ldquo;{q}&rdquo;. Pas uw zoekterm aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              ...mono,
              background: C.seal,
              color: C.white,
              borderRadius: 4,
              ["--tw-ring-color" as string]: C.seal,
              ["--tw-ring-offset-color" as string]: C.card,
            }}
          >
            Zoekterm wissen
          </button>
        </Sheet>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <Sheet key={o.id} interactive className="flex flex-col overflow-hidden">
              <div
                className="flex items-start justify-between gap-3 p-4"
                style={{ borderBottom: `1px solid ${C.hair}` }}
              >
                <div className="min-w-0">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ ...mono, color: C.gold }}
                  >
                    {o.id}
                  </span>
                  <h3
                    className="mt-1 text-[17px] font-semibold leading-tight"
                    style={{ ...display, color: C.ink }}
                  >
                    {o.titel}
                  </h3>
                  <p className="mt-0.5 text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {o.opdrachtgever}
                  </p>
                </div>
                <MatchGrade value={o.match} size="sm" />
              </div>
              <div className="px-4 py-3">
                <Meta Icon={MapPin} label="Plaats" value={o.plaats} />
                <Meta Icon={Coins} label="Tarief" value={o.tarief} />
                <Meta Icon={Clock} label="Omvang" value={o.uren} />
                <Meta Icon={CalendarDays} label="Aanvang" value={o.start} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ ...mono, background: C.bgDeep, color: C.inkSoft, borderRadius: 3 }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...mono,
                  borderTop: `1px solid ${C.hair}`,
                  color: C.seal,
                  ["--tw-ring-color" as string]: C.seal,
                }}
              >
                Bekijk akte <ArrowRight size={14} aria-hidden="true" />
              </button>
            </Sheet>
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
    { l: "Aanvang", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          ...mono,
          background: C.card,
          color: C.ink,
          borderRadius: 4,
          border: `1px solid ${C.hairStrong}`,
          ["--tw-ring-color" as string]: C.seal,
          ["--tw-ring-offset-color" as string]: C.bg,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar register
      </button>

      <Sheet className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ ...mono, color: C.seal }}
            >
              Akte {opdracht.id}
            </span>
            <h1
              className="mt-2 max-w-2xl text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[36px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchGrade value={opdracht.match} size="lg" />
        </div>
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{ borderTop: `1px solid ${C.hair}` }}
        >
          {feiten.map((f, i) => (
            <div
              key={f.l}
              className="p-4"
              style={{ borderRight: i % 4 !== 3 ? `1px solid ${C.hair}` : undefined }}
            >
              <div
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.inkFaint }}
              >
                <f.Icon size={12} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />{" "}
                {f.l}
              </div>
              <div
                className="mt-1.5 text-[17px] font-semibold tabular-nums"
                style={{ ...display, color: C.ink }}
              >
                {f.v}
              </div>
            </div>
          ))}
        </div>
      </Sheet>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Bevindingen ten gunste" artikel="§ 1" />
          <Sheet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.4}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ok }}
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </section>
        <section className="space-y-3">
          <SectionHead title="Voorbehoud" artikel="§ 2" />
          <Sheet className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <TriangleAlert
                    size={14}
                    strokeWidth={2.2}
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
                    aria-hidden="true"
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </Sheet>
        </section>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.seal,
            color: C.white,
            borderRadius: 4,
            ["--tw-ring-color" as string]: C.seal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          Onderteken reactie <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.card,
            color: C.ink,
            borderRadius: 4,
            border: `1px solid ${C.hairStrong}`,
            ["--tw-ring-color" as string]: C.seal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Star size={15} strokeWidth={2} style={{ color: C.gold }} aria-hidden="true" /> Leg vast
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead title="Verificatie" sub="stukken & bekrachtiging" artikel="Register IV" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.seal,
            color: C.white,
            borderRadius: 4,
            ["--tw-ring-color" as string]: C.seal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Stuk indienen
        </button>
      </div>

      <Sheet className="overflow-hidden">
        <div
          className="flex flex-wrap items-center gap-6 p-6"
          style={{ background: C.bgDeep, borderBottom: `1px solid ${C.hair}` }}
        >
          <Seal size={96} />
          <div className="max-w-sm">
            <div className="flex items-baseline gap-1">
              <span
                className="text-[36px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.seal }}
              >
                {dek}
              </span>
              <span className="text-[16px]" style={{ ...mono, color: C.gold }}>
                %
              </span>
            </div>
            <div className="text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} stukken bekrachtigd
            </div>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ ...bodyF, color: C.inkSoft }}>
              Elk gewaarmerkt stuk verhoogt uw vertrouwensgraad bij opdrachtgevers. Houd uw dossier
              volledig.
            </p>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: C.card }}>
              {["Stuk", "Bevinding", "Status", ""].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${i === 3 ? "text-right" : ""}`}
                  style={{ ...mono, color: C.inkFaint, borderBottom: `1px solid ${C.hair}` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CREDENTIALS.map((c, i) => {
              const actionable = c.status !== "VERIFIED";
              return (
                <tr
                  key={c.naam}
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${C.hair}` }}
                  className="transition-colors hover:bg-[#faf6ec]"
                >
                  <td
                    className="px-4 py-3 text-[14px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </td>
                  <td className="px-4 py-3 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
                    {c.detail}
                  </td>
                  <td className="px-4 py-3">
                    <StatusTag status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {actionable && (
                      <button
                        className="px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-[#faf6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        style={{
                          ...mono,
                          background: C.bgDeep,
                          color: C.seal,
                          borderRadius: 3,
                          border: `1px solid ${C.hair}`,
                          ["--tw-ring-color" as string]: C.seal,
                          ["--tw-ring-offset-color" as string]: C.card,
                        }}
                      >
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Inzien"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Sheet>
    </div>
  );
}

// ── Acties ───────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <SectionHead
        title="Volgende beste posten"
        sub="op urgentie gerangschikt"
        artikel="Register V"
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Sheet interactive style={warn ? { borderColor: C.warn } : undefined}>
                <div className="flex items-center gap-4 p-5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center text-[15px] font-semibold tabular-nums"
                    style={{
                      ...display,
                      background: warn ? C.warnSoft : C.bgDeep,
                      color: warn ? C.warn : C.seal,
                      borderRadius: 4,
                      border: `1px solid ${warn ? C.warn : C.hair}`,
                    }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={18} strokeWidth={2.2} /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                        style={{
                          ...mono,
                          background: warn ? C.warn : C.info,
                          color: C.white,
                          borderRadius: 3,
                        }}
                      >
                        {warn ? "Urgent" : "Kans"}
                      </span>
                      <h3
                        className="text-[16px] font-semibold"
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
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        ...mono,
                        background: warn ? C.warn : C.seal,
                        color: C.white,
                        borderRadius: 4,
                        ["--tw-ring-color" as string]: warn ? C.warn : C.seal,
                        ["--tw-ring-offset-color" as string]: C.card,
                      }}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Sheet>
            </li>
          );
        })}
      </ol>

      {/* Correspondentie */}
      <section className="space-y-3">
        <SectionHead title="Correspondentie" sub="recente berichten" artikel="Register VI" />
        <Sheet className="overflow-hidden">
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${C.hair}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{
                  ...display,
                  background: C.bgDeep,
                  color: C.seal,
                  borderRadius: 4,
                  border: `1px solid ${C.hair}`,
                }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-semibold"
                    style={{ ...display, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.seal }}
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
        </Sheet>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHead title="Grootboek" sub="omzet & openstaand" artikel="Register VII" />
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.seal,
            color: C.white,
            borderRadius: 4,
            ["--tw-ring-color" as string]: C.seal,
            ["--tw-ring-offset-color" as string]: C.bg,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe post
        </button>
      </div>

      {/* Error-strook — synchronisatie mislukt (error-state) */}
      <div
        className="flex flex-wrap items-center gap-3 p-4"
        style={{ background: C.dangerSoft, border: `1px solid ${C.danger}`, borderRadius: 4 }}
        role="alert"
      >
        <XCircle size={18} strokeWidth={2.2} style={{ color: C.danger }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold" style={{ ...display, color: C.ink }}>
            Grootboek niet bijgewerkt
          </div>
          <div className="text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
            De laatste boeking kon niet worden ingelezen. Betaalstatussen kunnen verouderd zijn.
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            ...mono,
            background: C.card,
            color: C.ink,
            borderRadius: 4,
            border: `1px solid ${C.hairStrong}`,
            ["--tw-ring-color" as string]: C.danger,
            ["--tw-ring-offset-color" as string]: C.dangerSoft,
          }}
        >
          <RefreshCw size={13} aria-hidden="true" /> Opnieuw boeken
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, Icon: BookMarked },
          { l: "Openstaand", v: `${open}`, Icon: Clock },
          { l: "Te factureren", v: "€ 1.350", Icon: Stamp },
        ].map((s) => (
          <Sheet key={s.l} interactive className="p-4">
            <div
              className="flex items-center gap-1.5 text-[11px]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              <s.Icon size={13} strokeWidth={1.8} style={{ color: C.gold }} aria-hidden="true" />{" "}
              {s.l}
            </div>
            <div
              className="mt-1.5 text-[26px] font-semibold tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {s.v}
            </div>
          </Sheet>
        ))}
      </div>

      <Sheet className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgDeep }}>
                {["Nummer", "Debiteur", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...mono, color: C.inkFaint, borderBottom: `1px solid ${C.hair}` }}
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
                    className="transition-colors hover:bg-[#faf6ec]"
                    style={{ borderTop: i === 0 ? undefined : `1px solid ${C.hair}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13.5px]" style={{ ...bodyF, color: C.inkSoft }}>
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{ ...mono, background: m.bg, color: m.fg, borderRadius: 3 }}
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
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.65)" }}
                >
                  Totaal geïnd
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-semibold tabular-nums"
                  style={{ ...display, color: C.goldSoft }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Sheet>
    </div>
  );
}
