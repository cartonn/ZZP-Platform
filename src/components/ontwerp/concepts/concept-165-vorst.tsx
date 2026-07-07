"use client";

// Concept 165 — "Vorst" · ijskristal & rijp (koel crystalline). Een KOUDE, heldere winter-esthetiek:
// mat-berijpt glas met ijskristal-fractals (inline SVG dendrieten + fijne kristallijne lijnen),
// gefacetteerde randen (clip-path polygonen), ijsblauw/wit/zilver palet en winterlicht. Bewust
// ANDERS dan warm glasmorfisme/liquid-glass — hier geen refractieve gloed maar bevroren rijp,
// scherpe facetten en koel contrast. 2026-trends: frosted crystalline surfaces, faceted geometry,
// data-mono microtypografie en rustige high-density SaaS. Deterministisch — geen random/Date.
// UI-taal Nederlands, code Engels. Fonts: Sora (display) + JetBrains Mono (data/labels).

import { useState } from "react";
import {
  Snowflake,
  ShieldCheck,
  BadgeCheck,
  Check,
  Clock,
  XCircle,
  TriangleAlert,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  MapPin,
  Coins,
  CalendarDays,
  Star,
  FileText,
  Sparkles,
  Gem,
  Mail,
  RotateCcw,
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

// ── Palet — koel crystalline: ijsblauw, rijp-wit, zilver. Diep frost-navy voor leesbare tekst. ──
const C = {
  glow: "#f5fafe", // winterlicht (bijna wit)
  ice: "#eaf3fb", // bleek ijs
  frost: "#dbe9f5", // rijp
  glacier: "#c6dcef", // gletsjerblauw
  crystal: "#9cc6e6", // kristalrand
  crystalDeep: "#5aa0d4",
  azure: "#2f83c4", // accent ijsblauw
  azureDeep: "#1c67a6",
  ink: "#112b40", // diep frost-navy (tekst)
  inkSoft: "#33526c",
  steel: "#5d7489", // gedempt staalblauw
  steelSoft: "#8299ac",
  silver: "#bccadb",
  white: "#ffffff",
  ok: "#0e8f74", // koel dennengroen
  okSoft: "#dbf1ec",
  warn: "#a9670f", // koude amber
  warnSoft: "#f6e9d5",
  danger: "#ce3b4b",
  dangerSoft: "#fbe0e3",
  info: "#3a6f97",
  infoSoft: "#e2edf7",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Gefacetteerde hoeken (clip-path) — het crystalline kern-motief. Snijdt twee hoeken tot facetten.
const facet = (r = 16): React.CSSProperties => ({
  clipPath: `polygon(0 ${r}px, ${r}px 0, 100% 0, 100% calc(100% - ${r}px), calc(100% - ${r}px) 100%, 0 100%)`,
});

// Berijpt glas-oppervlak: matte witte laag + rijp-rand + koele slagschaduw + top-highlight.
function frostSurface(alpha = 0.72): React.CSSProperties {
  return {
    background: `linear-gradient(160deg, rgba(255,255,255,${alpha}) 0%, rgba(233,243,251,${Math.min(alpha + 0.1, 0.95)}) 100%)`,
    border: `1px solid rgba(156,198,230,0.6)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 34px -18px rgba(28,103,166,0.45)`,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };
}

// Fijne kristallijne lijn-textuur (rijp op glas) — subtiele overlay.
const rimeTexture =
  "repeating-linear-gradient(60deg, rgba(90,160,212,0.05) 0 1px, transparent 1px 9px), repeating-linear-gradient(-60deg, rgba(90,160,212,0.05) 0 1px, transparent 1px 9px)";

// Volledige pagina-achtergrond: winterlicht met gletsjer-halo's.
const pageBg = `radial-gradient(1200px 620px at 12% -12%, #ffffff 0%, rgba(255,255,255,0) 58%), radial-gradient(1000px 560px at 104% -6%, ${C.glacier} 0%, rgba(198,220,239,0) 55%), radial-gradient(900px 700px at 50% 118%, ${C.frost} 0%, rgba(219,233,245,0) 60%), linear-gradient(180deg, ${C.ice} 0%, ${C.frost} 100%)`;

// ── IJskristal (6-voudige dendriet) — herbruikbaar decoratie-motief ──────────────────────────
function Crystal({
  size = 120,
  color = C.crystal,
  opacity = 0.5,
  className = "",
  style,
}: {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const arms = [0, 60, 120, 180, 240, 300];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={opacity}>
        {arms.map((a) => (
          <g key={a} transform={`rotate(${a} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="7" />
            <line x1="50" y1="17" x2="41" y2="10" />
            <line x1="50" y1="17" x2="59" y2="10" />
            <line x1="50" y1="29" x2="43" y2="23" />
            <line x1="50" y1="29" x2="57" y2="23" />
            <line x1="50" y1="40" x2="45" y2="35" />
            <line x1="50" y1="40" x2="55" y2="35" />
          </g>
        ))}
        <circle cx="50" cy="50" r="2.4" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

// ── Status-model — nooit kleur-alleen (icoon + label + tint) ─────────────────────────────────
type StatusStyle = { label: string; Icon: LucideIcon; fg: string; bg: string; ring: string };
function credMeta(s: CredStatus): StatusStyle {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: BadgeCheck,
        fg: C.ok,
        bg: C.okSoft,
        ring: "rgba(14,143,116,0.4)",
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        fg: C.info,
        bg: C.infoSoft,
        ring: "rgba(58,111,151,0.4)",
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: TriangleAlert,
        fg: C.warn,
        bg: C.warnSoft,
        ring: "rgba(169,103,15,0.4)",
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: XCircle,
        fg: C.danger,
        bg: C.dangerSoft,
        ring: "rgba(206,59,75,0.4)",
      };
  }
}

function StatusTag({ status, size = "md" }: { status: CredStatus; size?: "sm" | "md" }) {
  const m = credMeta(status);
  const pad = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.05em] ${pad}`}
      style={{ ...mono, background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
    >
      <m.Icon size={size === "sm" ? 11 : 12} strokeWidth={2.6} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// ── Berijpte kaart-primitive ─────────────────────────────────────────────────────────────────
function Frost({
  children,
  className = "",
  interactive = false,
  faceted = false,
  radius = 16,
  alpha = 0.72,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  faceted?: boolean;
  radius?: number;
  alpha?: number;
  as?: "div" | "li";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative overflow-hidden ${faceted ? "" : "rounded-2xl"} ${interactive ? "transition-all duration-200 hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        ...frostSurface(alpha),
        ...(faceted ? facet(radius) : null),
        ...style,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: rimeTexture }}
        aria-hidden="true"
      />
      <span className="relative block">{children}</span>
    </Tag>
  );
}

// Sectie-kop met kristal-chip.
function Section({ eyebrow, title, Icon }: { eyebrow: string; title: string; Icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: C.white,
          boxShadow: `inset 0 0 0 1px ${C.crystal}, 0 6px 14px -8px ${C.crystalDeep}`,
        }}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2.2} style={{ color: C.azure }} />
      </span>
      <div className="leading-tight">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ ...mono, color: C.steel }}
        >
          {eyebrow}
        </div>
        <h2
          className="text-[16px] font-bold tracking-[-0.01em]"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}

function Meta({ Icon, value }: { Icon: LucideIcon; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 text-[12.5px] font-medium"
      style={{ color: C.inkSoft }}
    >
      <Icon size={13} strokeWidth={2.2} style={{ color: C.crystalDeep }} aria-hidden="true" />
      <span className="truncate">{value}</span>
    </div>
  );
}

// Match-tint — cijfer draagt betekenis, tint is enkel accent (nooit kleur-alleen).
function matchTint(m: number): { bg: string; fg: string } {
  if (m >= 90) return { bg: C.azure, fg: C.white };
  if (m >= 84) return { bg: C.glacier, fg: C.azureDeep };
  return { bg: C.frost, fg: C.inkSoft };
}

// Kristal-sparkline (staafjes als ijspegels).
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((v, i) => {
        const last = i === data.length - 1;
        return (
          <span
            key={i}
            className="flex-1 rounded-t-[2px]"
            style={{
              height: `${Math.max(14, (v / max) * 100)}%`,
              background: last
                ? `linear-gradient(180deg, ${C.azure}, ${C.crystalDeep})`
                : `linear-gradient(180deg, ${C.glacier}, ${C.frost})`,
              boxShadow: last ? `0 0 0 1px ${C.azure}` : `inset 0 0 0 1px rgba(156,198,230,0.6)`,
            }}
          />
        );
      })}
    </div>
  );
}

// Focus-ring helper (ijsblauw, offset op winterlicht).
const ring = {
  ["--tw-ring-color" as string]: C.azure,
  ["--tw-ring-offset-color" as string]: C.ice,
};

// ── Root ───────────────────────────────────────────────────────────────────────────────────────
export function Concept165() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden antialiased"
      style={{ ...display, background: pageBg, color: C.ink }}
    >
      {/* Decoratieve ijskristallen — winterlicht in de hoeken */}
      <Crystal
        size={340}
        color={C.crystal}
        opacity={0.22}
        className="pointer-events-none absolute -right-24 -top-24 hidden lg:block"
      />
      <Crystal
        size={220}
        color={C.crystal}
        opacity={0.16}
        className="pointer-events-none absolute -left-16 top-[40%] hidden xl:block"
      />

      {/* Kop */}
      <header className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-5 md:px-8">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(155deg, ${C.white}, ${C.glacier})`,
              boxShadow: `inset 0 0 0 1px ${C.crystal}, 0 8px 18px -8px ${C.crystalDeep}`,
            }}
            aria-hidden="true"
          >
            <Snowflake size={22} strokeWidth={2} style={{ color: C.azure }} />
          </span>
          <div className="leading-tight">
            <div
              className="text-[19px] font-bold tracking-[-0.01em]"
              style={{ ...display, color: C.ink }}
            >
              Vorst
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ ...mono, color: C.steel }}
            >
              Werk · Verificatie · Omzet
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] sm:inline-flex"
            style={{
              ...mono,
              background: C.white,
              color: C.azureDeep,
              boxShadow: `inset 0 0 0 1px ${C.crystal}`,
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-[12px] font-bold"
            style={{
              ...mono,
              background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
              color: C.white,
              boxShadow: `0 8px 18px -8px ${C.azureDeep}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Scherm-switcher */}
      <nav className="relative z-10 mx-auto max-w-6xl px-4 py-3 md:px-8" aria-label="Schermen">
        <div
          className="flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5"
          style={frostSurface(0.6)}
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold tracking-[-0.01em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? {
                        color: C.white,
                        background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
                        boxShadow: `0 8px 18px -10px ${C.azureDeep}`,
                        ...ring,
                      }
                    : { color: C.inkSoft, background: "transparent", ...ring }
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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

      <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-2 md:px-8">
        <div
          className="flex items-center justify-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.steelSoft }}
        >
          <Snowflake size={12} aria-hidden="true" /> Vorst · ontwerp-lab · koel crystalline
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────────────────────
function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const warn = (ACTIES.find((a) => a.urgentie === "warning") ??
    ACTIES[0]) as (typeof ACTIES)[number];

  return (
    <div className="space-y-6">
      {/* Hero — gefacetteerd frost-paneel */}
      <Frost faceted radius={22} alpha={0.78} className="p-6 sm:p-9">
        <Crystal
          size={260}
          color={C.crystal}
          opacity={0.28}
          className="pointer-events-none absolute -right-10 -top-14"
        />
        <div className="relative max-w-2xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{
              ...mono,
              background: C.white,
              color: C.azureDeep,
              boxShadow: `inset 0 0 0 1px ${C.crystal}`,
            }}
          >
            <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.rol}
          </span>
          <h1
            className="mt-4 text-[27px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[36px]"
            style={{ ...display, color: C.ink }}
          >
            Drie matches boven 85%. Je omzet stijgt gestaag.
          </h1>
          <p
            className="mt-3 max-w-lg text-[14px] font-medium leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Eén taak vraagt actie: je VOG verloopt binnenkort. Handel het af en blijf helder
            verifieerbaar op de werkvloer.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
                color: C.white,
                boxShadow: `0 10px 22px -10px ${C.azureDeep}`,
                ...ring,
              }}
            >
              Bekijk matches <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              onClick={onActies}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold tracking-[-0.01em] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: C.white,
                color: C.ink,
                boxShadow: `inset 0 0 0 1px ${C.crystal}`,
                ...ring,
              }}
            >
              <TriangleAlert
                size={15}
                strokeWidth={2.4}
                style={{ color: C.warn }}
                aria-hidden="true"
              />{" "}
              Los actie op
            </button>
          </div>
        </div>
      </Frost>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Frost key={k.label} interactive className="p-4">
            <div className="flex items-start justify-between">
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.steel }}
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
              className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
              style={{ ...display, color: C.ink }}
            >
              {k.value}
            </div>
            <div className="mt-3">
              <Spark data={k.spark} />
            </div>
          </Frost>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-4 lg:col-span-2">
          <Section eyebrow="A · aanbevolen" title="Matches voor jou" Icon={Star} />
          <div className="space-y-3.5">
            {OPDRACHTEN.map((o) => {
              const t = matchTint(o.match);
              return (
                <Frost key={o.id} interactive className="overflow-hidden">
                  <button
                    onClick={onOpen}
                    className="flex w-full items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={ring}
                  >
                    <span
                      className="flex w-[68px] shrink-0 flex-col items-center justify-center"
                      style={{ background: t.bg }}
                      aria-hidden="true"
                    >
                      <span
                        className="text-[21px] font-bold leading-none"
                        style={{ ...display, color: t.fg }}
                      >
                        {o.match}
                      </span>
                      <span
                        className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                        style={{ ...mono, color: t.fg }}
                      >
                        match
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className="truncate text-[15px] font-bold tracking-[-0.01em]"
                            style={{ ...display, color: C.ink }}
                          >
                            {o.titel}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[12.5px] font-medium"
                            style={{ color: C.steel }}
                          >
                            {o.opdrachtgever} · {o.plaats} · {o.tarief}
                          </div>
                        </div>
                        <ArrowRight
                          size={18}
                          className="mt-1 shrink-0"
                          style={{ color: C.crystalDeep }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.redenen.plus.slice(0, 2).map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: C.ice,
                              color: C.inkSoft,
                              boxShadow: `inset 0 0 0 1px ${C.glacier}`,
                            }}
                          >
                            <Check
                              size={11}
                              strokeWidth={3}
                              style={{ color: C.ok }}
                              aria-hidden="true"
                            />{" "}
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                </Frost>
              );
            })}
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-4">
          <Section eyebrow="B · status" title="Vertrouwen" Icon={ShieldCheck} />

          {/* Dekking-gauge */}
          <Frost className="p-5">
            <div className="flex items-center gap-4">
              <Gauge value={dek} />
              <div>
                <div className="text-[13px] font-bold" style={{ ...display, color: C.ink }}>
                  {verified}/{CREDENTIALS.length} geverifieerd
                </div>
                <p className="mt-1 text-[12px] font-medium leading-snug" style={{ color: C.steel }}>
                  Opdrachtgevers zien enkel geverifieerde certificaten. Hogere dekking = meer
                  vertrouwen.
                </p>
              </div>
            </div>
          </Frost>

          {/* Prioriteit */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: `linear-gradient(160deg, ${C.azureDeep}, ${C.ink})` }}
          >
            <Crystal
              size={140}
              color={C.crystal}
              opacity={0.24}
              className="pointer-events-none absolute -right-6 -top-8"
            />
            <div className="relative">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, background: "rgba(255,255,255,0.16)", color: C.white }}
              >
                <TriangleAlert size={12} strokeWidth={2.6} aria-hidden="true" /> Prioriteit
              </span>
              <h3
                className="mt-2.5 text-[16px] font-bold leading-tight"
                style={{ ...display, color: C.white }}
              >
                {warn.titel}
              </h3>
              <p
                className="mt-1.5 text-[12.5px] font-medium leading-relaxed"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                {warn.detail}
              </p>
              <button
                onClick={onActies}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: C.white,
                  color: C.azureDeep,
                  ["--tw-ring-color" as string]: C.white,
                  ["--tw-ring-offset-color" as string]: C.ink,
                }}
              >
                {warn.cta} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Berichten — met inline foutmelding (error-state) */}
          <BerichtenPreview />

          {/* Documenten synchroniseren — skeleton (loading-state) */}
          <DocSyncSkeleton />
        </div>
      </div>
    </div>
  );
}

// Circulaire dekking-gauge (frost-ring).
function Gauge({ value }: { value: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: 68, height: 68 }}>
      <svg viewBox="0 0 68 68" width={68} height={68} aria-hidden="true">
        <circle cx="34" cy="34" r={r} fill="none" stroke={C.frost} strokeWidth="7" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke={C.azure}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform="rotate(-90 34 34)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[16px] font-bold" style={{ ...display, color: C.ink }}>
          {value}
          <span className="text-[10px]">%</span>
        </span>
      </div>
    </div>
  );
}

// Berichten-preview met een expliciete inline error-state.
function BerichtenPreview() {
  return (
    <Frost className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={15} strokeWidth={2.2} style={{ color: C.azure }} aria-hidden="true" />
          <span className="text-[13px] font-bold" style={{ ...display, color: C.ink }}>
            Berichten
          </span>
        </div>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ ...mono, background: C.azure, color: C.white }}
        >
          2 nieuw
        </span>
      </div>

      {/* Inline foutmelding — kon niet verversen, wel gecachte berichten */}
      <div
        role="alert"
        className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2"
        style={{
          background: C.dangerSoft,
          boxShadow: `inset 0 0 0 1px ${credMeta("REJECTED").ring}`,
        }}
      >
        <XCircle
          size={14}
          strokeWidth={2.4}
          style={{ color: C.danger }}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="text-[12px] font-semibold" style={{ color: C.danger }}>
            Verversen mislukt
          </p>
          <p className="text-[11.5px] font-medium leading-snug" style={{ color: C.inkSoft }}>
            Laatste update kon niet worden opgehaald. Onderstaande berichten zijn mogelijk
            verouderd.
          </p>
        </div>
        <button
          className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.white,
            color: C.danger,
            boxShadow: `inset 0 0 0 1px ${credMeta("REJECTED").ring}`,
            ...ring,
          }}
        >
          <RotateCcw size={12} aria-hidden="true" /> Opnieuw
        </button>
      </div>

      <ul className="mt-3 space-y-2.5">
        {BERICHTEN.slice(0, 2).map((b) => (
          <li key={b.van} className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
              style={{
                ...mono,
                background: C.ice,
                color: C.azureDeep,
                boxShadow: `inset 0 0 0 1px ${C.glacier}`,
              }}
              aria-hidden="true"
            >
              {b.initialen}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {b.ongelezen && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: C.azure }}
                    aria-hidden="true"
                  />
                )}
                <span className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {b.van}
                </span>
              </div>
              <p className="truncate text-[11.5px] font-medium" style={{ color: C.steel }}>
                {b.preview}
              </p>
            </div>
            <span
              className="shrink-0 text-[10px] font-medium"
              style={{ ...mono, color: C.steelSoft }}
            >
              {b.tijd}
            </span>
          </li>
        ))}
      </ul>
    </Frost>
  );
}

// Documenten-sync skeleton — loading-state in de designtaal.
function DocSyncSkeleton() {
  return (
    <Frost className="p-4">
      <div className="flex items-center gap-2">
        <FileText size={15} strokeWidth={2.2} style={{ color: C.azure }} aria-hidden="true" />
        <span className="text-[13px] font-bold" style={{ ...display, color: C.ink }}>
          Documenten synchroniseren
        </span>
      </div>
      <p
        className="mt-1 text-[11.5px] font-medium"
        style={{ ...mono, color: C.steel }}
        aria-live="polite"
      >
        Even geduld…
      </p>
      <div className="mt-3 space-y-2.5" aria-hidden="true">
        {[68, 84, 52].map((w, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className="h-8 w-8 shrink-0 animate-pulse rounded-lg"
              style={{ background: C.frost }}
            />
            <div className="flex-1 space-y-1.5">
              <span
                className="block h-2.5 animate-pulse rounded-full"
                style={{ width: `${w}%`, background: C.frost }}
              />
              <span
                className="block h-2 animate-pulse rounded-full"
                style={{ width: `${w - 22}%`, background: C.glacier, opacity: 0.6 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Frost>
  );
}

// ── Marktplaats ────────────────────────────────────────────────────────────────────────────────
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
        <Section eyebrow="Marktplaats" title="Open opdrachten" Icon={Gem} />
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={frostSurface(0.66)}>
          <Search size={16} style={{ color: C.crystalDeep }} aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats…"
            aria-label="Opdrachten zoeken"
            className="w-44 bg-transparent text-[12.5px] font-medium outline-none placeholder:text-[color:#8299ac] sm:w-56"
            style={{ color: C.ink }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Frost faceted className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <Crystal size={72} color={C.crystal} opacity={0.7} />
          <p className="text-[17px] font-bold" style={{ ...display, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="max-w-xs text-[13px] font-medium" style={{ color: C.steel }}>
            Geen opdracht voor “{q}”. Pas je zoekterm aan of wis het filter.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-1 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
              color: C.white,
              ...ring,
            }}
          >
            Zoekterm wissen
          </button>
        </Frost>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const t = matchTint(o.match);
            return (
              <Frost key={o.id} interactive className="flex flex-col">
                <div className="flex items-start justify-between p-4 pb-3">
                  <div className="min-w-0 pr-3">
                    <h3
                      className="text-[15px] font-bold leading-tight tracking-[-0.01em]"
                      style={{ ...display, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <p className="mt-1 text-[12px] font-medium" style={{ color: C.steel }}>
                      {o.opdrachtgever}
                    </p>
                  </div>
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                    style={{ background: t.bg }}
                    aria-hidden="true"
                  >
                    <span
                      className="text-[16px] font-bold leading-none"
                      style={{ ...display, color: t.fg }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="text-[8px] font-semibold uppercase"
                      style={{ ...mono, color: t.fg }}
                    >
                      match
                    </span>
                  </span>
                </div>
                <div className="mx-4 h-px" style={{ background: C.glacier }} aria-hidden="true" />
                <div className="p-4">
                  <dl className="grid grid-cols-2 gap-y-2">
                    <Meta Icon={MapPin} value={o.plaats} />
                    <Meta Icon={Coins} value={o.tarief} />
                    <Meta Icon={Clock} value={o.uren} />
                    <Meta Icon={CalendarDays} value={o.start} />
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                        style={{
                          ...mono,
                          background: C.ice,
                          color: C.inkSoft,
                          boxShadow: `inset 0 0 0 1px ${C.glacier}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onOpen}
                  className="mt-auto flex items-center justify-center gap-2 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{
                    background: C.ice,
                    color: C.azureDeep,
                    boxShadow: `inset 0 1px 0 ${C.glacier}`,
                    ...ring,
                  }}
                >
                  Bekijk opdracht <ArrowRight size={15} aria-hidden="true" />
                </button>
              </Frost>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Opdracht-detail ────────────────────────────────────────────────────────────────────────────
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Coins },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Start", v: opdracht.start, Icon: CalendarDays },
    { l: "Plaats", v: opdracht.plaats, Icon: MapPin },
  ];
  const t = matchTint(opdracht.match);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: C.white,
          color: C.inkSoft,
          boxShadow: `inset 0 0 0 1px ${C.crystal}`,
          ...ring,
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug
      </button>

      <Frost faceted radius={22} alpha={0.8} className="p-6 sm:p-8">
        <Crystal
          size={220}
          color={C.crystal}
          opacity={0.26}
          className="pointer-events-none absolute -right-8 -top-12"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{
                ...mono,
                background: C.ice,
                color: C.azureDeep,
                boxShadow: `inset 0 0 0 1px ${C.glacier}`,
              }}
            >
              {opdracht.id}
            </span>
            <h1
              className="mt-3 max-w-2xl text-[25px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[33px]"
              style={{ ...display, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 text-[14px] font-medium" style={{ color: C.steel }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-5 py-3"
            style={{ background: t.bg }}
          >
            <span
              className="text-[42px] font-bold leading-none"
              style={{ ...display, color: t.fg }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: t.fg }}
            >
              % match
            </span>
          </div>
        </div>
      </Frost>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {feiten.map((f) => (
          <Frost key={f.l} interactive className="p-4">
            <f.Icon
              size={16}
              strokeWidth={2.2}
              style={{ color: C.crystalDeep }}
              aria-hidden="true"
            />
            <div
              className="mt-2.5 text-[16px] font-bold leading-none"
              style={{ ...display, color: C.ink }}
            >
              {f.v}
            </div>
            <div
              className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.steel }}
            >
              {f.l}
            </div>
          </Frost>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-3.5">
          <Section eyebrow="Waarom dit past" title="Sterke punten" Icon={Check} />
          <Frost className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.okSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} style={{ color: C.ok }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Frost>
        </div>
        <div className="space-y-3.5">
          <Section eyebrow="Om te wegen" title="Aandachtspunten" Icon={TriangleAlert} />
          <Frost className="p-5">
            <ul className="space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13.5px] font-medium leading-snug"
                  style={{ color: C.ink }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.warnSoft }}
                    aria-hidden="true"
                  >
                    <TriangleAlert size={11} strokeWidth={3} style={{ color: C.warn }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </Frost>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
            color: C.white,
            boxShadow: `0 12px 26px -12px ${C.azureDeep}`,
            ...ring,
          }}
        >
          Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: C.white,
            color: C.ink,
            boxShadow: `inset 0 0 0 1px ${C.crystal}`,
            ...ring,
          }}
        >
          <Star size={15} strokeWidth={2.2} aria-hidden="true" /> Bewaar
        </button>
      </div>
    </div>
  );
}

// ── Verificatie (master-detail met statusovergangen) ─────────────────────────────────────────
const TRANSITIONS: { key: CredStatus | "DRAFT"; label: string }[] = [
  { key: "DRAFT", label: "Concept" },
  { key: "SUBMITTED", label: "Ingediend" },
  { key: "VERIFIED", label: "Geverifieerd" },
];

function Verificatie() {
  const [sel, setSel] = useState(0);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const dek = Math.round((verified / CREDENTIALS.length) * 100);
  const cred = CREDENTIALS[sel] ?? CREDENTIALS[0]!;
  const m = credMeta(cred.status);

  // Positie in de statusketen — bepaalt de voortgang van de tijdlijn.
  const stepIndex =
    cred.status === "VERIFIED"
      ? 2
      : cred.status === "SUBMITTED" || cred.status === "EXPIRING"
        ? 1
        : 0;

  const inlineTone =
    cred.status === "REJECTED"
      ? {
          bg: C.dangerSoft,
          fg: C.danger,
          Icon: XCircle,
          msg: "Afgewezen — dien opnieuw in met een geldig, leesbaar bewijsstuk.",
        }
      : cred.status === "EXPIRING"
        ? {
            bg: C.warnSoft,
            fg: C.warn,
            Icon: TriangleAlert,
            msg: "Verloopt binnenkort — vernieuw dit certificaat om verifieerbaar te blijven.",
          }
        : cred.status === "SUBMITTED"
          ? {
              bg: C.infoSoft,
              fg: C.info,
              Icon: Clock,
              msg: "In beoordeling — een medewerker controleert dit bewijsstuk.",
            }
          : {
              bg: C.okSoft,
              fg: C.ok,
              Icon: Check,
              msg: "Geverifieerd en zichtbaar voor opdrachtgevers.",
            };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Section eyebrow="Verificatie" title="Certificaten & bewijs" Icon={ShieldCheck} />
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
            color: C.white,
            ...ring,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Toevoegen
        </button>
      </div>

      <Frost faceted radius={20} alpha={0.78} className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <Gauge value={dek} />
          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-bold" style={{ ...display, color: C.ink }}>
              {verified}/{CREDENTIALS.length} geverifieerd
            </div>
            <p
              className="mt-1 max-w-md text-[12.5px] font-medium leading-snug"
              style={{ color: C.steel }}
            >
              Elke overgang (concept → ingediend → geverifieerd) wordt server-side vastgelegd.
              Alleen geverifieerde certificaten tellen mee voor je vertrouwensniveau.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em]"
            style={{
              ...mono,
              background: C.white,
              color: C.azureDeep,
              boxShadow: `inset 0 0 0 1px ${C.crystal}`,
            }}
          >
            <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
          </span>
        </div>
      </Frost>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Lijst */}
        <div className="space-y-2.5 lg:col-span-2">
          {CREDENTIALS.map((c, i) => {
            const cm = credMeta(c.status);
            const on = i === sel;
            return (
              <button
                key={c.naam}
                onClick={() => setSel(i)}
                aria-pressed={on}
                className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  ...frostSurface(on ? 0.9 : 0.6),
                  boxShadow: on
                    ? `inset 0 0 0 1.5px ${C.azure}, 0 12px 26px -14px ${C.azureDeep}`
                    : frostSurface().boxShadow,
                  ...ring,
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: cm.bg }}
                  aria-hidden="true"
                >
                  <cm.Icon size={18} strokeWidth={2.4} style={{ color: cm.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[13.5px] font-bold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="truncate text-[11.5px] font-medium" style={{ color: C.steel }}>
                    {c.detail}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0"
                  style={{ color: on ? C.azure : C.silver }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        {/* Detail van geselecteerd certificaat */}
        <Frost className="p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="text-[18px] font-bold tracking-[-0.01em]"
                style={{ ...display, color: C.ink }}
              >
                {cred.naam}
              </h3>
              <p className="mt-1 text-[12.5px] font-medium" style={{ color: C.steel }}>
                {cred.detail}
              </p>
            </div>
            <StatusTag status={cred.status} />
          </div>

          {/* Statusovergangen — tijdlijn */}
          <div className="mt-6">
            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...mono, color: C.steel }}
            >
              Statusovergang
            </div>
            <ol className="mt-3 flex items-center">
              {TRANSITIONS.map((step, i) => {
                const done = i <= stepIndex;
                const current = i === stepIndex;
                return (
                  <li key={step.key} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          ...mono,
                          background: done ? C.azure : C.frost,
                          color: done ? C.white : C.steel,
                          boxShadow: current ? `0 0 0 3px ${C.glacier}` : "none",
                        }}
                        aria-hidden="true"
                      >
                        {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                      </span>
                      <span
                        className="mt-1.5 text-[10.5px] font-semibold"
                        style={{ ...mono, color: current ? C.ink : C.steel }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < TRANSITIONS.length - 1 && (
                      <span
                        className="mx-1 mb-5 h-0.5 flex-1 rounded-full"
                        style={{ background: i < stepIndex ? C.azure : C.frost }}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Inline melding — info / warning / error, nooit kleur-alleen */}
          <div
            role={cred.status === "REJECTED" ? "alert" : "status"}
            className="mt-6 flex items-start gap-2.5 rounded-xl px-3.5 py-3"
            style={{ background: inlineTone.bg, boxShadow: `inset 0 0 0 1px ${m.ring}` }}
          >
            <inlineTone.Icon
              size={15}
              strokeWidth={2.4}
              style={{ color: inlineTone.fg }}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-[12.5px] font-medium leading-snug" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: inlineTone.fg }}>
                {m.label}.
              </span>{" "}
              {inlineTone.msg}
            </p>
          </div>

          {cred.status !== "VERIFIED" && (
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
                color: C.white,
                ...ring,
              }}
            >
              {cred.status === "EXPIRING"
                ? "Vernieuwen"
                : cred.status === "REJECTED"
                  ? "Opnieuw indienen"
                  : "Voortgang bekijken"}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </Frost>
      </div>
    </div>
  );
}

// ── Acties (next-action) ─────────────────────────────────────────────────────────────────────
function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Section eyebrow="Next best action" title="Volgende beste acties" Icon={Sparkles} />
        <p className="pl-12 text-[13px] font-medium" style={{ color: C.steel }}>
          Op volgorde van urgentie — pak de bovenste eerst.
        </p>
      </div>

      <ol className="space-y-4">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Frost interactive faceted radius={14} alpha={0.74} className="flex items-stretch">
                <span
                  className="flex w-16 shrink-0 items-center justify-center text-[26px] font-bold"
                  style={{
                    ...display,
                    background: warn
                      ? `linear-gradient(160deg, ${C.warn}, #7f4c0a)`
                      : `linear-gradient(160deg, ${C.glacier}, ${C.frost})`,
                    color: warn ? C.white : C.azureDeep,
                  }}
                  aria-hidden="true"
                >
                  {warn ? <TriangleAlert size={24} strokeWidth={2.4} /> : i}
                </span>
                <div className="min-w-0 flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        ...mono,
                        background: warn ? C.warnSoft : C.ice,
                        color: warn ? C.warn : C.azureDeep,
                        boxShadow: `inset 0 0 0 1px ${warn ? "rgba(169,103,15,0.4)" : C.glacier}`,
                      }}
                    >
                      {warn ? (
                        <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <Star size={11} strokeWidth={2.6} aria-hidden="true" />
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
                  <p
                    className="mt-1.5 text-[13px] font-medium leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <button
                    className="mt-3.5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      warn
                        ? {
                            background: `linear-gradient(155deg, ${C.warn}, #8a530c)`,
                            color: C.white,
                            ...ring,
                          }
                        : {
                            background: C.white,
                            color: C.azureDeep,
                            boxShadow: `inset 0 0 0 1px ${C.crystal}`,
                            ...ring,
                          }
                    }
                  >
                    {a.cta} <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </Frost>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Facturen ─────────────────────────────────────────────────────────────────────────────────
function factMeta(status: string): StatusStyle {
  if (status === "Betaald")
    return { label: "Betaald", Icon: Check, fg: C.ok, bg: C.okSoft, ring: "rgba(14,143,116,0.4)" };
  if (status === "Openstaand")
    return {
      label: "Openstaand",
      Icon: Clock,
      fg: C.warn,
      bg: C.warnSoft,
      ring: "rgba(169,103,15,0.4)",
    };
  return {
    label: "Concept",
    Icon: FileText,
    fg: C.steel,
    bg: C.frost,
    ring: "rgba(93,116,137,0.35)",
  };
}

function Facturen() {
  const betaald = "€ 8.622";
  const open = FACTUREN.filter((f) => f.status === "Openstaand").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Section eyebrow="Omzet" title="Facturen" Icon={FileText} />
        <button
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            background: `linear-gradient(155deg, ${C.azure}, ${C.crystalDeep})`,
            color: C.white,
            ...ring,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: betaald, dark: true },
          { l: "Openstaand", v: `${open}`, dark: false },
          { l: "Te factureren", v: "€ 1.350", dark: false },
        ].map((s) =>
          s.dark ? (
            <div
              key={s.l}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: `linear-gradient(160deg, ${C.azureDeep}, ${C.ink})` }}
            >
              <Crystal
                size={100}
                color={C.crystal}
                opacity={0.22}
                className="pointer-events-none absolute -right-4 -top-6"
              />
              <div className="relative">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: "rgba(255,255,255,0.66)" }}
                >
                  {s.l}
                </div>
                <div
                  className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
                  style={{ ...display, color: C.white }}
                >
                  {s.v}
                </div>
              </div>
            </div>
          ) : (
            <Frost key={s.l} interactive className="p-4">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...mono, color: C.steel }}
              >
                {s.l}
              </div>
              <div
                className="mt-2 text-[25px] font-bold leading-none tracking-[-0.02em]"
                style={{ ...display, color: C.ink }}
              >
                {s.v}
              </div>
            </Frost>
          ),
        )}
      </div>

      <Frost className="overflow-hidden">
        <ul>
          {FACTUREN.map((f, i) => {
            const fm = factMeta(f.status);
            return (
              <li
                key={f.nr}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-[color:rgba(234,243,251,0.7)]"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glacier}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: fm.bg, boxShadow: `inset 0 0 0 1px ${fm.ring}` }}
                  aria-hidden="true"
                >
                  <fm.Icon size={15} strokeWidth={2.4} style={{ color: fm.fg }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[13.5px] font-bold tracking-[-0.01em]"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.nr}
                  </div>
                  <div className="text-[12px] font-medium" style={{ color: C.steel }}>
                    {f.klant} · {f.datum}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]"
                  style={{
                    ...mono,
                    background: fm.bg,
                    color: fm.fg,
                    boxShadow: `inset 0 0 0 1px ${fm.ring}`,
                  }}
                >
                  <fm.Icon size={12} strokeWidth={2.6} aria-hidden="true" /> {fm.label}
                </span>
                <span
                  className="w-24 text-right text-[15px] font-bold tabular-nums"
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
          style={{ background: `linear-gradient(160deg, ${C.azureDeep}, ${C.ink})` }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.1em]"
            style={{ ...mono, color: "rgba(255,255,255,0.66)" }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ ...display, color: C.white }}
          >
            {betaald}
          </span>
        </div>
      </Frost>
    </div>
  );
}
