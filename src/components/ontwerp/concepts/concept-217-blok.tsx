"use client";

// Concept 217 — "Blok" · verfijnd neubrutalisme. 2026-trend: refined neubrutalism / hard-shadow color-blocking.
// Harde 2px zwarte randen, ferme offset-slagschaduwen (4px 4px 0 #000), platte heldere kleurvlakken en blokkerige
// knoppen die bij hover "indrukken" (schaduw krimpt, blok verschuift). Speels-krachtig maar VERFIJND: nette spacing,
// hoge leesbaarheid, geen chaos. Onderscheidt zich puur door de harde-rand + offset-schaduw taal en tactiele
// press-states. Status altijd label + icoon, nooit alleen kleur. UI Nederlands, code Engels. Volledig deterministisch
// (geen random/Date/network/images).

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
  Zap,
  Bell,
  TrendingUp,
  Sparkles,
  Send,
  Bookmark,
  Filter,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ── Palet — platte heldere vlakken op crème, alles omrand met inkt-zwart. ──
const C = {
  bg: "#fdfcf7", // crème basis
  bgAlt: "#f4f1e6", // dieper crème vlak
  panel: "#ffffff", // wit blok
  panelAlt: "#faf8f0", // subtiel gebroken wit
  ink: "#0a0a0a", // inkt (rand + tekst)
  inkSoft: "#3a3a38", // secundaire tekst
  inkFaint: "#6f6e68", // labels/gedempt
  blue: "#2b2bff", // accent-blauw
  blueSoft: "#e2e2ff", // zacht blauw vlak
  yellow: "#ffd23f", // accent-geel
  yellowSoft: "#fff3cc", // zacht geel vlak
  mint: "#3ddc97", // accent-mint
  mintSoft: "#d6f7e8", // zacht mint vlak
  coral: "#ff5d46", // waarschuwing / afwijzing
  coralSoft: "#ffe1db", // zacht coral vlak
  white: "#ffffff",
};

const displayF = { fontFamily: "var(--font-lab-bricolage)" }; // Bricolage Grotesque — display
const bodyF = { fontFamily: "var(--font-lab-space)" }; // Space Grotesk — body

// ── Shadow-helpers — de kern van de designtaal. ──
const SH = (x = 4, y = 4) => `${x}px ${y}px 0 ${C.ink}`;
const BORDER = `2px solid ${C.ink}`;

// ── Status-model — vorm + icoon + label; nooit kleur alleen. ──
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, fg: C.ink, bg: C.mint };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, fg: C.ink, bg: C.blueSoft };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: TriangleAlert, fg: C.ink, bg: C.yellow };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, fg: C.white, bg: C.coral };
  }
}

// ── Deterministische sparkline (geen random) ──
function Spark({ data, color = C.blue }: { data: number[]; color?: string }) {
  const w = 72;
  const h = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const last = data[data.length - 1] ?? min;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={h - ((last - min) / span) * h} r={2.6} fill={color} />
    </svg>
  );
}

// ── Blok-kaart — wit vlak, 2px rand, offset-schaduw. ──
function Block({
  children,
  className = "",
  style,
  shadow = 4,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  shadow?: number;
  as?: "div" | "section" | "li";
}) {
  return (
    <Tag
      className={`rounded-[6px] ${className}`}
      style={{ background: C.panel, border: BORDER, boxShadow: SH(shadow, shadow), ...style }}
    >
      {children}
    </Tag>
  );
}

// ── Press-knop — indruk-effect via translate + krimpende schaduw. ──
function PressButton({
  children,
  onClick,
  variant = "ink",
  className = "",
  ariaLabel,
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "ink" | "blue" | "yellow" | "mint" | "white" | "coral";
  className?: string;
  ariaLabel?: string;
  full?: boolean;
}) {
  const map: Record<
    "ink" | "blue" | "yellow" | "mint" | "white" | "coral",
    { bg: string; fg: string }
  > = {
    ink: { bg: C.ink, fg: C.white },
    blue: { bg: C.blue, fg: C.white },
    yellow: { bg: C.yellow, fg: C.ink },
    mint: { bg: C.mint, fg: C.ink },
    white: { bg: C.white, fg: C.ink },
    coral: { bg: C.coral, fg: C.white },
  };
  const v = map[variant];
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-[6px] px-4 py-2.5 text-[13px] font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[3px] active:translate-y-[3px] ${
        full ? "w-full" : ""
      } ${className}`}
      style={{
        ...bodyF,
        background: v.bg,
        color: v.fg,
        border: BORDER,
        boxShadow: SH(3, 3),
        ["--tw-ring-color" as string]: C.blue,
        ["--tw-ring-offset-color" as string]: C.bg,
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = SH(0, 0);
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = SH(3, 3);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = SH(3, 3);
      }}
    >
      {children}
    </button>
  );
}

// ── Status-chip — gekleurd blok met rand, label + icoon. ──
function StatusTag({ status, size = "sm" }: { status: CredStatus; size?: "sm" | "md" }) {
  const m = credMeta(status);
  const pad = size === "md" ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] font-bold ${pad}`}
      style={{ ...bodyF, background: m.bg, color: m.fg, border: BORDER }}
    >
      <m.Icon size={size === "md" ? 14 : 12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Sectie-kop — blokkerig icoon-vierkant + display-titel. ──
function SectionHead({
  title,
  sub,
  Icon,
  tint = C.yellow,
}: {
  title: string;
  sub?: string;
  Icon: LucideIcon;
  tint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]"
        style={{ background: tint, border: BORDER, boxShadow: SH(2, 2) }}
        aria-hidden="true"
      >
        <Icon size={18} strokeWidth={2.4} style={{ color: C.ink }} />
      </span>
      <div className="min-w-0">
        <h2
          className="text-[19px] font-extrabold leading-none tracking-[-0.01em]"
          style={{ ...displayF, color: C.ink }}
        >
          {title}
        </h2>
        {sub && (
          <p className="mt-1 text-[12.5px]" style={{ ...bodyF, color: C.inkFaint }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: C.inkSoft }}>
      <Icon size={14} strokeWidth={2.2} style={{ color: C.blue }} aria-hidden="true" />
      <span className="truncate text-[12.5px]" style={bodyF}>
        {value}
      </span>
    </div>
  );
}

// ── Match-badge — vierkant blok met groot cijfer. ──
function MatchBadge({
  value,
  size = 56,
  tint = C.mint,
}: {
  value: number;
  size?: number;
  tint?: string;
}) {
  return (
    <span
      className="flex shrink-0 flex-col items-center justify-center rounded-[6px]"
      style={{ width: size, height: size, background: tint, border: BORDER, boxShadow: SH(2, 2) }}
      aria-hidden="true"
    >
      <span
        className="font-extrabold tabular-nums leading-none"
        style={{ ...displayF, color: C.ink, fontSize: size * 0.34 }}
      >
        {value}
      </span>
      <span
        className="font-bold uppercase tracking-[0.08em]"
        style={{ ...bodyF, color: C.ink, fontSize: size * 0.14 }}
      >
        match
      </span>
    </span>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────────
export function Concept217() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...bodyF, background: C.bg, color: C.ink }}
    >
      {/* fijn stippenraster — subtiele tactiele achtergrond, geen drukte */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(${C.ink}0f 1.4px, transparent 1.4px)`,
          backgroundSize: "22px 22px",
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Kop — blokkerig logo + trust + avatar */}
        <header className="sticky top-0 z-30" style={{ background: C.bg, borderBottom: BORDER }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: C.blue, border: BORDER, boxShadow: SH(3, 3) }}
                aria-hidden="true"
              >
                <Zap size={22} strokeWidth={2.6} style={{ color: C.yellow }} fill={C.yellow} />
              </span>
              <div className="leading-tight">
                <div
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ ...bodyF, color: C.blue }}
                >
                  ZZP · Blok
                </div>
                <div
                  className="text-[22px] font-extrabold leading-none tracking-[-0.02em]"
                  style={{ ...displayF, color: C.ink }}
                >
                  Werkbank
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                aria-label="Meldingen"
                className="relative flex h-10 w-10 items-center justify-center rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px]"
                style={{
                  background: C.white,
                  border: BORDER,
                  boxShadow: SH(2, 2),
                  ["--tw-ring-color" as string]: C.blue,
                  ["--tw-ring-offset-color" as string]: C.bg,
                }}
              >
                <Bell size={17} strokeWidth={2.4} style={{ color: C.ink }} aria-hidden="true" />
                <span
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ background: C.coral, color: C.white, border: `1.5px solid ${C.ink}` }}
                  aria-hidden="true"
                >
                  3
                </span>
              </button>
              <span
                className="hidden items-center gap-1.5 rounded-[6px] px-3 py-2 text-[11.5px] font-bold sm:inline-flex"
                style={{
                  ...bodyF,
                  background: C.mint,
                  color: C.ink,
                  border: BORDER,
                  boxShadow: SH(2, 2),
                }}
              >
                <ShieldCheck size={13} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
              </span>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[6px] text-[12px] font-extrabold"
                style={{
                  ...displayF,
                  background: C.yellow,
                  color: C.ink,
                  border: BORDER,
                  boxShadow: SH(2, 2),
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
            </div>
          </div>

          {/* Scherm-switcher — blok-tabs */}
          <nav
            className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 pb-3.5 md:px-8"
            aria-label="Schermen"
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-[6px] px-3.5 py-1.5 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px]"
                  style={
                    on
                      ? {
                          ...bodyF,
                          background: C.ink,
                          color: C.white,
                          border: BORDER,
                          boxShadow: SH(3, 3),
                          ["--tw-ring-color" as string]: C.blue,
                          ["--tw-ring-offset-color" as string]: C.bg,
                        }
                      : {
                          ...bodyF,
                          background: C.white,
                          color: C.inkSoft,
                          border: BORDER,
                          boxShadow: SH(0, 0),
                          ["--tw-ring-color" as string]: C.blue,
                          ["--tw-ring-offset-color" as string]: C.bg,
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
          {screen === "acties" && <Acties onNaar={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-12 md:px-8">
          <div
            className="flex items-center justify-center gap-2 rounded-[6px] px-4 py-3 text-[11.5px] font-bold"
            style={{ ...bodyF, background: C.bgAlt, color: C.inkFaint, border: BORDER }}
          >
            <Sparkles size={13} aria-hidden="true" /> Blok — verfijnd neubrutalisme · elke status
            draagt een label én een icoon.
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
  const kpiTints = [C.mint, C.blueSoft, C.yellow, C.coralSoft];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Block className="relative overflow-hidden" shadow={5} style={{ background: C.blue }}>
        {/* geel hoek-blok */}
        <span
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rotate-12 rounded-[10px]"
          style={{ background: C.yellow, border: BORDER }}
          aria-hidden="true"
        />
        <div className="relative p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-bold"
              style={{ ...bodyF, background: C.yellow, color: C.ink, border: BORDER }}
            >
              <Star size={12} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.rol}
            </span>
            <span className="text-[11.5px] font-bold" style={{ ...bodyF, color: "#d7d7ff" }}>
              {PROFIEL.plaats} · verzendklaar
            </span>
          </div>
          <h1
            className="mt-5 text-[36px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[48px]"
            style={{ ...displayF, color: C.white }}
          >
            Drie sterke matches
            <br />
            staan voor je klaar.
          </h1>
          <p
            className="mt-4 max-w-lg text-[14px] leading-relaxed"
            style={{ ...bodyF, color: "#e4e4ff" }}
          >
            Eén ding vraagt aandacht: je VOG verloopt binnenkort. Los de markering op en houd je
            profiel onberispelijk zichtbaar voor opdrachtgevers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PressButton onClick={onOpen} variant="yellow">
              Bekijk matches <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
            </PressButton>
            <PressButton onClick={onActies} variant="white">
              <TriangleAlert
                size={15}
                strokeWidth={2.6}
                style={{ color: C.coral }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </PressButton>
          </div>
        </div>
      </Block>

      {/* KPI-blokken */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Block key={k.label} className="p-4" shadow={3} style={{ background: kpiTints[i] }}>
            <div className="flex items-start justify-between gap-2">
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.04em]"
                style={{ ...bodyF, color: C.inkSoft }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  ...bodyF,
                  background: C.white,
                  color: C.ink,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {k.up ? (
                  <TrendingUp size={10} strokeWidth={2.8} aria-hidden="true" />
                ) : (
                  <Clock size={10} strokeWidth={2.8} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div
              className="mt-3 text-[27px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...displayF, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-2">
              <Spark data={k.spark} color={C.ink} />
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Aanbevolen matches */}
        <section className="space-y-4">
          <SectionHead
            title="Aanbevolen"
            sub="Opdrachten op match gerangschikt"
            Icon={Sparkles}
            tint={C.mint}
          />
          <div className="space-y-4">
            {OPDRACHTEN.map((o, idx) => (
              <Block key={o.id} shadow={idx === 0 ? 4 : 3}>
                <button
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 rounded-[5px] p-4 text-left transition-colors hover:bg-[#faf8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ ["--tw-ring-color" as string]: C.blue }}
                >
                  <MatchBadge value={o.match} tint={idx === 0 ? C.mint : C.yellow} />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15.5px] font-extrabold tracking-[-0.01em]"
                      style={{ ...displayF, color: C.ink }}
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
                          className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            ...bodyF,
                            background: C.mintSoft,
                            color: C.ink,
                            border: `1.5px solid ${C.ink}`,
                          }}
                        >
                          <Check size={11} strokeWidth={3} aria-hidden="true" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    strokeWidth={2.6}
                    className="shrink-0"
                    style={{ color: C.ink }}
                    aria-hidden="true"
                  />
                </button>
              </Block>
            ))}
          </div>
        </section>

        {/* Rechterkolom */}
        <section className="space-y-4">
          <SectionHead
            title="Vertrouwen"
            sub="Certificaat-dekking"
            Icon={ShieldCheck}
            tint={C.blueSoft}
          />
          <Block className="p-5" shadow={3}>
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[6px]"
                style={{ background: C.ink, border: BORDER }}
                aria-hidden="true"
              >
                <span
                  className="text-[22px] font-extrabold tabular-nums leading-none"
                  style={{ ...displayF, color: C.mint }}
                >
                  {dek}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ ...bodyF, color: C.mint }}
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
          </Block>

          {/* Gemarkeerde actie */}
          <Block
            className="relative overflow-hidden p-5"
            shadow={4}
            style={{ background: C.yellow }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ ...bodyF, background: C.ink, color: C.yellow, border: BORDER }}
            >
              <TriangleAlert size={11} strokeWidth={2.8} aria-hidden="true" /> Urgent
            </span>
            <h3
              className="mt-2.5 text-[19px] font-extrabold leading-tight tracking-[-0.01em]"
              style={{ ...displayF, color: C.ink }}
            >
              {warn.titel}
            </h3>
            <p
              className="mt-1.5 text-[12.5px] leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              {warn.detail}
            </p>
            <div className="mt-4">
              <PressButton onClick={onActies} variant="ink">
                {warn.cta} <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </PressButton>
            </div>
          </Block>

          {/* Berichten-preview */}
          <Block className="overflow-hidden" shadow={3}>
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: BORDER, background: C.bgAlt }}
            >
              <span
                className="text-[13px] font-extrabold tracking-[-0.01em]"
                style={{ ...displayF, color: C.ink }}
              >
                Berichten
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  ...bodyF,
                  background: C.coral,
                  color: C.white,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                2 nieuw
              </span>
            </div>
            {BERICHTEN.slice(0, 2).map((b, i) => (
              <div
                key={b.van}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.bgAlt}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] text-[11px] font-extrabold"
                  style={{
                    ...displayF,
                    background: C.blueSoft,
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                  }}
                  aria-hidden="true"
                >
                  {b.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13px] font-bold"
                    style={{ ...bodyF, color: C.ink }}
                  >
                    {b.van}
                  </div>
                  <p className="truncate text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                    {b.preview}
                  </p>
                </div>
                {b.ongelezen && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: C.blue, border: `1.5px solid ${C.ink}` }}
                    aria-label="Ongelezen"
                  />
                )}
              </div>
            ))}
          </Block>
        </section>
      </div>
    </div>
  );
}

// ── Marktplaats — zoek, filter, skeleton, empty- én foutstate ─────────────
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
        <SectionHead
          title="Marktplaats"
          sub="Open opdrachten in de zorg"
          Icon={Search}
          tint={C.yellow}
        />
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[6px] px-3 py-2"
            style={{ background: C.white, border: BORDER, boxShadow: SH(2, 2) }}
          >
            <Search size={15} strokeWidth={2.4} style={{ color: C.blue }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek opdracht of plaats…"
              aria-label="Opdrachten zoeken"
              className="w-36 bg-transparent text-[12.5px] font-semibold outline-none placeholder:font-normal placeholder:opacity-50 sm:w-44"
              style={{ ...bodyF, color: C.ink }}
            />
          </div>
          <button
            aria-label="Filteren"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              background: C.white,
              border: BORDER,
              boxShadow: SH(2, 2),
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <Filter size={15} strokeWidth={2.4} style={{ color: C.ink }} aria-hidden="true" />
          </button>
          <button
            onClick={refresh}
            aria-label="Opnieuw laden"
            className="flex h-10 w-10 items-center justify-center rounded-[6px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              background: C.white,
              border: BORDER,
              boxShadow: SH(2, 2),
              ["--tw-ring-color" as string]: C.blue,
              ["--tw-ring-offset-color" as string]: C.bg,
            }}
          >
            <RefreshCw
              size={15}
              strokeWidth={2.4}
              className={loading ? "animate-spin" : ""}
              style={{ color: C.ink }}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Foutstrook */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-[6px] p-4"
          role="alert"
          style={{ background: C.coralSoft, border: BORDER, boxShadow: SH(3, 3) }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
            style={{ background: C.coral, border: `1.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <XCircle size={18} strokeWidth={2.6} style={{ color: C.white }} />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[14px] font-extrabold tracking-[-0.01em]"
              style={{ ...displayF, color: C.ink }}
            >
              Niet alles geladen
            </div>
            <p className="mt-0.5 text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              Een deel van de opdrachten ontbreekt. Probeer het opnieuw te laden.
            </p>
          </div>
          <button
            onClick={() => setError(false)}
            className="shrink-0 rounded-[5px] px-3 py-1.5 text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:translate-x-[2px] active:translate-y-[2px]"
            style={{
              ...bodyF,
              background: C.white,
              color: C.ink,
              border: `1.5px solid ${C.ink}`,
              ["--tw-ring-color" as string]: C.coral,
              ["--tw-ring-offset-color" as string]: C.coralSoft,
            }}
          >
            Sluiten
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Block key={i} className="p-4" shadow={3}>
              <div className="flex items-center gap-3">
                <span
                  className="h-14 w-14 shrink-0 animate-pulse rounded-[6px]"
                  style={{ background: C.bgAlt, border: `1.5px solid ${C.ink}22` }}
                />
                <div className="flex-1 space-y-2">
                  <span
                    className="block h-3.5 w-3/4 animate-pulse rounded"
                    style={{ background: C.bgAlt }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded"
                    style={{ background: C.bgAlt }}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <span
                  className="block h-3 w-full animate-pulse rounded"
                  style={{ background: C.bgAlt }}
                />
                <span
                  className="block h-3 w-5/6 animate-pulse rounded"
                  style={{ background: C.bgAlt }}
                />
              </div>
            </Block>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Block
          className="flex flex-col items-center justify-center gap-3 p-16 text-center"
          shadow={4}
        >
          <span
            className="flex h-16 w-16 items-center justify-center rounded-[8px]"
            style={{ background: C.yellow, border: BORDER, boxShadow: SH(3, 3) }}
            aria-hidden="true"
          >
            <Search size={28} strokeWidth={2.2} style={{ color: C.ink }} />
          </span>
          <p
            className="text-[20px] font-extrabold tracking-[-0.01em]"
            style={{ ...displayF, color: C.ink }}
          >
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ ...bodyF, color: C.inkSoft }}>
            Geen opdracht voor &ldquo;{q}&rdquo;. Pas je zoekterm aan om meer resultaten te zien.
          </p>
          <div className="mt-1">
            <PressButton onClick={() => setQ("")} variant="ink">
              Zoekterm wissen
            </PressButton>
          </div>
        </Block>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o, idx) => (
            <Block key={o.id} className="flex flex-col overflow-hidden" shadow={3}>
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: BORDER, background: C.bgAlt }}
              >
                <span
                  className="text-[11px] font-extrabold tracking-[0.02em]"
                  style={{ ...bodyF, color: C.inkSoft }}
                >
                  {o.id}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[11px] font-extrabold tabular-nums"
                  style={{
                    ...bodyF,
                    background: idx === 0 ? C.mint : C.yellow,
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  {o.match} match
                </span>
              </div>
              <div className="p-4">
                <h3
                  className="text-[16px] font-extrabold leading-tight tracking-[-0.01em]"
                  style={{ ...displayF, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkSoft }}>
                  {o.opdrachtgever}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-y-2">
                  <Meta Icon={MapPin} value={o.plaats} />
                  <Meta Icon={Coins} value={o.tarief} />
                  <Meta Icon={Clock} value={o.uren} />
                  <Meta Icon={CalendarDays} value={o.start} />
                </dl>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-[4px] px-2 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        ...bodyF,
                        background: C.panelAlt,
                        color: C.inkSoft,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onOpen}
                className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-bold transition-colors hover:bg-[#faf8f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{
                  ...bodyF,
                  borderTop: BORDER,
                  color: C.blue,
                  ["--tw-ring-color" as string]: C.blue,
                }}
              >
                Bekijk opdracht <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Block>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ──────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [reageer, setReageer] = useState(false);
  const feiten: { l: string; v: string; Icon: LucideIcon; tint: string }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins, tint: C.mintSoft },
    { l: "Omvang", v: opdracht.uren, Icon: Clock, tint: C.blueSoft },
    { l: "Start", v: opdracht.start, Icon: CalendarDays, tint: C.yellowSoft },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin, tint: C.coralSoft },
  ];
  return (
    <div className="space-y-6">
      <PressButton onClick={onBack} variant="white">
        <ArrowLeft size={15} strokeWidth={2.6} aria-hidden="true" /> Terug naar marktplaats
      </PressButton>

      <Block className="relative overflow-hidden" shadow={5} style={{ background: C.ink }}>
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rotate-12 rounded-[12px]"
          style={{ background: C.blue, border: `2px solid ${C.white}22` }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-block rounded-[5px] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.02em]"
                style={{
                  ...bodyF,
                  background: C.yellow,
                  color: C.ink,
                  border: `1.5px solid ${C.white}`,
                }}
              >
                {opdracht.id}
              </span>
              <span className="text-[11.5px] font-bold" style={{ ...bodyF, color: "#a9a9a9" }}>
                Start {opdracht.start}
              </span>
            </div>
            <h1
              className="mt-3 max-w-2xl text-[27px] font-extrabold leading-[1.06] tracking-[-0.02em] sm:text-[34px]"
              style={{ ...displayF, color: C.white }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[13.5px] font-semibold" style={{ ...bodyF, color: "#c4c4c4" }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <MatchBadge value={opdracht.match} size={88} tint={C.mint} />
        </div>
      </Block>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Block key={f.l} className="p-4" shadow={3} style={{ background: f.tint }}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[6px]"
              style={{ background: C.white, border: BORDER }}
              aria-hidden="true"
            >
              <f.Icon size={16} strokeWidth={2.4} style={{ color: C.ink }} />
            </span>
            <div
              className="mt-3 text-[16px] font-extrabold tabular-nums leading-none tracking-[-0.01em]"
              style={{ ...displayF, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ ...bodyF, color: C.inkFaint }}
            >
              {f.l}
            </div>
          </Block>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className="space-y-3">
          <SectionHead title="Waarom dit past" Icon={Check} tint={C.mint} />
          <Block className="p-5" shadow={3}>
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
                    style={{ background: C.mint, border: `1.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.ink }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </section>
        <section className="space-y-3">
          <SectionHead title="Om te overwegen" Icon={TriangleAlert} tint={C.yellow} />
          <Block className="p-5" shadow={3}>
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ ...bodyF, color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px]"
                    style={{ background: C.yellow, border: `1.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={2.8} style={{ color: C.ink }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Block>
        </section>
      </div>

      {/* Reactie-bevestiging */}
      {reageer && (
        <Block
          className="flex items-center gap-3 p-4"
          shadow={3}
          style={{ background: C.mintSoft }}
          as="div"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px]"
            style={{ background: C.mint, border: `1.5px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Check size={18} strokeWidth={2.8} style={{ color: C.ink }} />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[14px] font-extrabold tracking-[-0.01em]"
              style={{ ...displayF, color: C.ink }}
            >
              Reactie verstuurd
            </div>
            <p className="text-[12.5px]" style={{ ...bodyF, color: C.inkSoft }}>
              {opdracht.opdrachtgever} ontvangt je profiel. Gemiddelde reactietijd: 6 uur.
            </p>
          </div>
        </Block>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <PressButton onClick={() => setReageer(true)} variant="blue" className="flex-1" full>
          {reageer ? "Reactie verstuurd" : "Reageer op deze opdracht"}{" "}
          <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
        </PressButton>
        <PressButton variant="white">
          <Bookmark size={15} strokeWidth={2.4} style={{ color: C.ink }} aria-hidden="true" />{" "}
          Bewaar
        </PressButton>
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
        <SectionHead
          title="Verificatie"
          sub="Certificaten & documenten"
          Icon={ShieldCheck}
          tint={C.mint}
        />
        <PressButton variant="ink">
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Toevoegen
        </PressButton>
      </div>

      <Block className="relative overflow-hidden" shadow={4} style={{ background: C.mint }}>
        <span
          className="pointer-events-none absolute -bottom-10 -right-8 h-28 w-28 rotate-12 rounded-[10px]"
          style={{ background: C.white, border: BORDER, opacity: 0.5 }}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center gap-6 p-6">
          <span
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[8px]"
            style={{ background: C.ink, border: BORDER }}
            aria-hidden="true"
          >
            <span
              className="text-[36px] font-extrabold tabular-nums leading-none"
              style={{ ...displayF, color: C.mint }}
            >
              {dek}
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.12em]"
              style={{ ...bodyF, color: C.mint }}
            >
              procent
            </span>
          </span>
          <div className="max-w-sm">
            <div
              className="text-[22px] font-extrabold tracking-[-0.01em]"
              style={{ ...displayF, color: C.ink }}
            >
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 text-[13px] font-medium leading-relaxed"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              Elk geverifieerd certificaat maakt je profiel betrouwbaar. Houd je dekking hoog en
              blijf onberispelijk zichtbaar voor opdrachtgevers.
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11.5px] font-bold"
              style={{ ...bodyF, background: C.white, color: C.ink, border: BORDER }}
            >
              <BadgeCheck size={13} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </div>
        </div>
      </Block>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const actionable = c.status !== "VERIFIED";
          return (
            <Block key={c.naam} className="flex items-center gap-3.5 p-4" shadow={3}>
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px]"
                style={{ background: m.bg, border: BORDER }}
                aria-hidden="true"
              >
                <m.Icon size={22} strokeWidth={2.4} style={{ color: m.fg }} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-[15px] font-extrabold tracking-[-0.01em]"
                  style={{ ...displayF, color: C.ink }}
                >
                  {c.naam}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ ...bodyF, color: C.inkFaint }}>
                  {c.detail}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusTag status={c.status} />
                  {actionable && (
                    <button
                      className="rounded-[5px] px-2.5 py-1 text-[11px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:translate-x-[2px] active:translate-y-[2px]"
                      style={{
                        ...bodyF,
                        background: C.white,
                        color: C.ink,
                        border: `1.5px solid ${C.ink}`,
                        boxShadow: SH(2, 2),
                        ["--tw-ring-color" as string]: C.blue,
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
            </Block>
          );
        })}
      </div>

      {/* Documenten-strook */}
      <section className="space-y-3">
        <SectionHead
          title="Documenten"
          sub="Veilig opgeslagen, standaard privé"
          Icon={FileText}
          tint={C.blueSoft}
        />
        <Block className="overflow-hidden" shadow={3}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr style={{ background: C.bgAlt, borderBottom: BORDER }}>
                  {["Document", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DOCUMENTEN.map((d, i) => (
                  <tr
                    key={d.naam}
                    style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.bgAlt}` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px]"
                          style={{ background: C.blueSoft, border: `1.5px solid ${C.ink}` }}
                          aria-hidden="true"
                        >
                          <FileText size={14} strokeWidth={2.4} style={{ color: C.ink }} />
                        </span>
                        <span className="text-[13px] font-bold" style={{ ...bodyF, color: C.ink }}>
                          {d.naam}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] font-semibold"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-4 py-3">
                      <StatusTag status={d.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      </section>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────
function Acties({ onNaar }: { onNaar: (s: ScreenKey) => void }) {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  const naar: Record<string, ScreenKey> = {
    "VOG vernieuwen": "verificatie",
    "Bekijk matches": "marktplaats",
    "Herinnering sturen": "facturen",
  };
  return (
    <div className="space-y-6">
      <SectionHead
        title="Acties"
        sub="Op urgentie gerangschikt — pak de bovenste eerst"
        Icon={Zap}
        tint={C.coralSoft}
      />

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <Block
              key={a.titel}
              as="li"
              className="flex items-stretch overflow-hidden"
              shadow={warn ? 4 : 3}
            >
              <span
                className="w-2 shrink-0"
                style={{ background: warn ? C.coral : C.blue, borderRight: BORDER }}
                aria-hidden="true"
              />
              <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] text-[17px] font-extrabold tabular-nums"
                  style={{
                    ...displayF,
                    background: warn ? C.coral : C.blueSoft,
                    color: warn ? C.white : C.ink,
                    border: BORDER,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={20} strokeWidth={2.6} /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em]"
                      style={{
                        ...bodyF,
                        background: warn ? C.coral : C.mint,
                        color: warn ? C.white : C.ink,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={10} strokeWidth={2.8} aria-hidden="true" />
                      ) : (
                        <Star size={10} strokeWidth={2.8} aria-hidden="true" />
                      )}
                      {warn ? "Urgent" : "Kans"}
                    </span>
                    <h3
                      className="text-[16px] font-extrabold tracking-[-0.01em]"
                      style={{ ...displayF, color: C.ink }}
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
                  <div className="mt-3">
                    <PressButton
                      onClick={() => onNaar(naar[a.cta] ?? "dashboard")}
                      variant={warn ? "coral" : "white"}
                    >
                      {a.cta} <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </PressButton>
                  </div>
                </div>
              </div>
            </Block>
          );
        })}
      </ol>

      {/* Berichten */}
      <section className="space-y-3">
        <SectionHead title="Berichten" sub="Recente gesprekken" Icon={Send} tint={C.blueSoft} />
        <Block className="overflow-hidden" shadow={3}>
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 p-4"
              style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.bgAlt}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] text-[12px] font-extrabold"
                style={{ ...displayF, background: C.yellow, color: C.ink, border: BORDER }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-[14px] font-extrabold tracking-[-0.01em]"
                    style={{ ...displayF, color: C.ink }}
                  >
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: C.blue, border: `1.5px solid ${C.ink}` }}
                      aria-label="Ongelezen"
                    />
                  )}
                </div>
                <p
                  className="mt-0.5 truncate text-[12.5px]"
                  style={{ ...bodyF, color: C.inkFaint }}
                >
                  {b.preview}
                </p>
              </div>
              <span
                className="shrink-0 text-[11px] font-semibold tabular-nums"
                style={{ ...bodyF, color: C.inkFaint }}
              >
                {b.tijd}
              </span>
            </div>
          ))}
        </Block>
      </section>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────
function Facturen() {
  const factMeta = (
    status: string,
  ): { label: string; Icon: LucideIcon; fg: string; bg: string } => {
    if (status === "Betaald") return { label: "Betaald", Icon: Check, fg: C.ink, bg: C.mint };
    if (status === "Openstaand")
      return { label: "Openstaand", Icon: Clock, fg: C.ink, bg: C.yellow };
    return { label: "Concept", Icon: FileText, fg: C.inkSoft, bg: C.bgAlt };
  };
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHead title="Facturen" sub="Omzet & openstaand" Icon={Coins} tint={C.yellow} />
        <PressButton variant="ink">
          <Plus size={15} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </PressButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, tint: C.mint },
          { l: "Openstaand", v: `${open}`, tint: C.yellow },
          { l: "Te factureren", v: "€ 1.350", tint: C.blueSoft },
        ].map((s) => (
          <Block key={s.l} className="p-4" shadow={3} style={{ background: s.tint }}>
            <div
              className="text-[10.5px] font-bold uppercase tracking-[0.04em]"
              style={{ ...bodyF, color: C.inkSoft }}
            >
              {s.l}
            </div>
            <div
              className="mt-3 text-[27px] font-extrabold tabular-nums leading-none tracking-[-0.02em]"
              style={{ ...displayF, color: C.ink }}
            >
              {s.v}
            </div>
          </Block>
        ))}
      </div>

      <Block className="overflow-hidden" shadow={3}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr style={{ background: C.bgAlt, borderBottom: BORDER }}>
                {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.06em] ${i === 4 ? "text-right" : ""}`}
                    style={{ ...bodyF, color: C.inkFaint }}
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
                    style={{ borderTop: i === 0 ? undefined : `1.5px solid ${C.bgAlt}` }}
                  >
                    <td
                      className="px-4 py-3 text-[13px] font-extrabold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
                    >
                      {f.nr}
                    </td>
                    <td
                      className="px-4 py-3 text-[13px] font-medium"
                      style={{ ...bodyF, color: C.inkSoft }}
                    >
                      {f.klant}
                    </td>
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ ...bodyF, color: C.inkFaint }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          ...bodyF,
                          background: m.bg,
                          color: m.fg,
                          border: `1.5px solid ${C.ink}`,
                        }}
                      >
                        <m.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {m.label}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[15px] font-extrabold tabular-nums"
                      style={{ ...displayF, color: C.ink }}
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
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em]"
                  style={{ ...bodyF, color: C.mint }}
                >
                  Totaal betaald
                </td>
                <td
                  className="px-4 py-3 text-right text-[17px] font-extrabold tabular-nums"
                  style={{ ...displayF, color: C.mint }}
                >
                  {betaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Block>
    </div>
  );
}
