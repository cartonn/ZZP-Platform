"use client";

// Concept 517 — "Condens" · Frosted-glass translucency 2.0 (glassmorphism, chirurgisch ingezet).
// Koele, heldere glaspanelen met backdrop-blur — alleen op focus-elementen (de actieve kaart,
// het detailpaneel, de topbar). Subtiele condens-/damp-gradiënten, dunne lichtranden, een koele
// blauw-groene tint. Diepte zonder rommel over een zachte gradient-achtergrond. Licht-koel thema.
// Status altijd met label + icoon, nooit enkel kleur.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  FileText,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
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

// ————————————————————————————— Palet — koel glas op zachte gradient —————————————————————————————
const C = {
  ink: "#0f2b33",
  inkSoft: "#345159",
  inkMute: "#5f7a82",
  inkFaint: "#8ba4ab",

  glass: "rgba(255,255,255,0.62)",
  glassStrong: "rgba(255,255,255,0.8)",
  glassSoft: "rgba(255,255,255,0.42)",
  glassBorder: "rgba(255,255,255,0.7)",
  edge: "rgba(15,43,51,0.1)",
  edgeSoft: "rgba(15,43,51,0.06)",

  accent: "#0d9db5",
  accentDeep: "#0a7f93",
  accentSoft: "rgba(13,157,181,0.14)",

  pos: "#0f9d70",
  posSoft: "rgba(15,157,112,0.15)",
  info: "#2b8fe0",
  infoSoft: "rgba(43,143,224,0.15)",
  warn: "#c98410",
  warnSoft: "rgba(201,132,16,0.16)",
  neg: "#dc4a55",
  negSoft: "rgba(220,74,85,0.15)",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9db5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dff2f4]";

const GLASS = (strong = false): CSSProperties => ({
  background: strong ? C.glassStrong : C.glass,
  border: `1px solid ${C.glassBorder}`,
  backdropFilter: "blur(16px) saturate(1.4)",
  WebkitBackdropFilter: "blur(16px) saturate(1.4)",
  boxShadow: "0 8px 30px rgba(15,43,51,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
});

// ————————————————————————————— Status-taal —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.pos,
        soft: C.posSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return { base: C.info, soft: C.infoSoft, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return {
        base: C.warn,
        soft: C.warnSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.neg, soft: C.negSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald") return { base: C.pos, soft: C.posSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.warn, soft: C.warnSoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.info, soft: C.infoSoft, label: "Concept", Icon: FileText };
  return { base: C.neg, soft: C.negSoft, label: status, Icon: AlertTriangle };
}

function parseEUR(s: string): number {
  const d = s.replace(/[^\d]/g, "");
  return d ? parseInt(d, 10) : 0;
}
const eur0 = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

// ————————————————————————————— Primitives —————————————————————————————
function Glass({
  children,
  className = "",
  as: Tag = "div",
  strong = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  strong?: boolean;
  style?: CSSProperties;
}) {
  return (
    <Tag className={`rounded-[18px] ${className}`} style={{ ...GLASS(strong), ...style }}>
      {children}
    </Tag>
  );
}

function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-4.5 py-2.5 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-[11px] font-semibold tracking-[-0.01em] transition-all duration-200 ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? {
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
          color: "#fff",
          border: `1px solid ${C.accentDeep}`,
          boxShadow: "0 4px 14px rgba(13,157,181,0.28)",
          ...sans,
        }
      : variant === "outline"
        ? {
            background: C.glassSoft,
            color: C.ink,
            border: `1px solid ${C.glassBorder}`,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            ...sans,
          }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-105 hover:-translate-y-px"
      : variant === "outline"
        ? "hover:bg-[rgba(255,255,255,0.7)]"
        : "hover:bg-[rgba(255,255,255,0.4)]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${hover} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

function StatusTag({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}33`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

// Match als condens-ring
function MatchRing({ value }: { value: number }) {
  const tone = value >= 90 ? C.pos : value >= 85 ? C.accent : C.warn;
  const deg = value * 3.6;
  return (
    <span
      className="h-13 w-13 relative inline-flex items-center justify-center"
      style={{ height: 52, width: 52 }}
      aria-label={`Match ${value} procent`}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${tone} ${deg}deg, ${C.edgeSoft} ${deg}deg)` }}
        aria-hidden="true"
      />
      <span
        className="absolute inset-[3px] rounded-full"
        style={{
          background: C.glassStrong,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        aria-hidden="true"
      />
      <span className="relative text-[13px] font-bold leading-none" style={{ color: tone }}>
        {value}
      </span>
    </span>
  );
}

function Kicker({ children, tone = C.accentDeep }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Kicker>
          <Droplets size={13} aria-hidden="true" /> {kicker}
        </Kicker>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] md:text-[30px]"
          style={{ color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1 max-w-xl text-[13.5px]" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Search,
  opdracht: Briefcase,
  verificatie: Award,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept517() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);
  const open = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[760px] w-full overflow-hidden antialiased"
      style={{
        ...sans,
        color: C.ink,
        background:
          "radial-gradient(1200px 600px at 12% -10%, #c9ecf0 0%, transparent 55%), radial-gradient(1000px 700px at 100% 0%, #d5e9f7 0%, transparent 50%), radial-gradient(900px 800px at 60% 120%, #d3f0e4 0%, transparent 55%), linear-gradient(160deg, #e4f4f6, #dfeef7)",
      }}
    >
      {/* Zwevende damp-vlekken achter het glas */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(13,157,181,0.18), transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-80 w-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(15,157,112,0.14), transparent 70%)",
          filter: "blur(24px)",
        }}
      />

      <div className="relative mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="cd-fade px-4 pb-24 pt-6 sm:px-6 md:px-8">
            {screen === "dashboard" && (
              <Dashboard
                onOpen={open}
                onMarkt={() => setScreen("marktplaats")}
                onActies={() => setScreen("acties")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "marktplaats" && <Marktplaats selId={selId} onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && (
              <Acties
                onMarkt={() => setScreen("marktplaats")}
                onFacturen={() => setScreen("facturen")}
              />
            )}
            {screen === "facturen" && <Facturen />}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes cdFade { from { opacity: 0; transform: translateY(8px) scale(0.995); } to { opacity: 1; transform: none; } }
        .cd-fade { animation: cdFade 0.42s cubic-bezier(0.22,1,0.36,1) both; }
        .cd-row { transition: background 0.22s ease, box-shadow 0.22s ease; }
        .cd-row:hover { background: rgba(255,255,255,0.55); }
        @media (prefers-reduced-motion: reduce) { .cd-fade { animation: none !important; } .cd-row { transition: none !important; } }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col md:flex"
      style={{
        background: "rgba(255,255,255,0.34)",
        borderRight: `1px solid ${C.glassBorder}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[13px]"
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
            color: "#fff",
            boxShadow: "0 4px 14px rgba(13,157,181,0.3)",
          }}
          aria-hidden="true"
        >
          <Droplets size={19} />
        </span>
        <span>
          <span
            className="block text-[15px] font-bold leading-none tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            Condens
          </span>
          <span className="mt-1 block text-[10.5px]" style={{ color: C.inkMute }}>
            helder & rustig
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICON[s.key];
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13.5px] font-medium transition-all duration-200 ${RING}`}
                  style={
                    on
                      ? {
                          background: C.glassStrong,
                          color: C.accentDeep,
                          border: `1px solid ${C.glassBorder}`,
                          boxShadow: "0 2px 10px rgba(15,43,51,0.08)",
                        }
                      : { color: C.inkSoft, border: "1px solid transparent" }
                  }
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.inkMute }} />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-4">
        <Glass className="flex items-center gap-2.5 p-3" strong>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
              color: "#fff",
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[10.5px]" style={{ color: C.pos }}>
              <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </Glass>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: "rgba(255,255,255,0.4)",
        borderBottom: `1px solid ${C.glassBorder}`,
        backdropFilter: "blur(18px) saturate(1.4)",
        WebkitBackdropFilter: "blur(18px) saturate(1.4)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2.5 rounded-[12px] px-3.5 py-2.5"
        style={{ background: C.glassSoft, border: `1px solid ${C.glassBorder}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.inkFaint }} />
        <span className="text-[12.5px]" style={{ color: C.inkFaint }}>
          Zoek opdrachten, documenten, berichten…
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-[12px] px-3.5 py-2.5 text-[12px] font-semibold sm:inline-flex"
        style={{ background: C.accentSoft, color: C.accentDeep, border: `1px solid ${C.accent}33` }}
      >
        <Sparkles size={14} aria-hidden="true" /> Helder overzicht
      </span>
    </header>
  );
}

function MobileNav({
  screen,
  setScreen,
}: {
  screen: ScreenKey;
  setScreen: (s: ScreenKey) => void;
}) {
  return (
    <nav
      aria-label="Schermen"
      className="flex gap-1.5 overflow-x-auto px-4 py-2.5 md:hidden"
      style={{ borderBottom: `1px solid ${C.glassBorder}`, background: "rgba(255,255,255,0.34)" }}
    >
      {SCREENS.map((s) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${RING}`}
            style={
              on
                ? {
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`,
                    color: "#fff",
                  }
                : { color: C.inkSoft, background: C.glassSoft }
            }
          >
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onFacturen,
}: {
  onOpen: (id: string) => void;
  onMarkt: () => void;
  onActies: () => void;
  onFacturen: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <ScreenHead
        kicker="Helder overzicht"
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Alles wat telt, helder in beeld — de rest blijft op de achtergrond."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onFacturen}>
              <Receipt size={14} aria-hidden="true" /> Facturen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Volgende actie <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Glass key={k.label} className="p-5">
            <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[27px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {k.value}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ color: k.up ? C.pos : C.warn, background: k.up ? C.posSoft : C.warnSoft }}
            >
              {k.up ? (
                <ArrowRight size={12} className="-rotate-45" aria-hidden="true" />
              ) : (
                <ArrowRight size={12} className="rotate-45" aria-hidden="true" />
              )}
              {k.trend}
            </span>
          </Glass>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Glass className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.edgeSoft}` }}
          >
            <Kicker>
              <Briefcase size={13} aria-hidden="true" /> Aanbevolen opdrachten
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`text-[12px] font-semibold ${RING}`}
              style={{ color: C.accentDeep }}
            >
              Alles →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`cd-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                >
                  <MatchRing value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                      style={{ color: C.inkMute }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span className="block text-[14px] font-bold" style={{ color: C.ink }}>
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span className="text-[10px]" style={{ color: C.inkFaint }}>
                      per uur
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Glass>

        <div className="space-y-4">
          <Glass className="p-5" strong>
            <Kicker tone={C.pos}>
              <ShieldCheck size={13} aria-hidden="true" /> Dossier op orde
            </Kicker>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className="text-[36px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: C.ink }}
              >
                {ratio}%
              </span>
              <span className="text-[12.5px]" style={{ color: C.inkMute }}>
                geverifieerd
              </span>
            </div>
            <span
              className="mt-3 block h-2 w-full overflow-hidden rounded-full"
              style={{ background: C.edgeSoft }}
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${ratio}%`,
                  background: `linear-gradient(90deg, ${C.pos}, ${C.accent})`,
                  transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </span>
            <p className="mt-2.5 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} certificaten · {PROFIEL.trust}.
            </p>
          </Glass>

          <Glass className="relative overflow-hidden p-5" as="article" strong>
            <Kicker tone={C.warn}>
              <AlertTriangle size={13} aria-hidden="true" /> Termijn nadert
            </Kicker>
            <h3 className="mt-2 text-[15.5px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Glass>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "leeg";

function Marktplaats({ selId, onOpen }: { selId: string; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
  }, [q]);

  const empty = mode === "leeg" || rows.length === 0;

  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Marktplaats"
        title="Opdrachten die bij je passen"
        sub={`${rows.length} van ${OPDRACHTEN.length} sluiten aan op je geverifieerde profiel.`}
      />

      <Glass className="flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-[12px] px-3.5 py-2.5"
          style={{ background: C.glassSoft, border: `1px solid ${C.glassBorder}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8ba4ab]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`flex h-5 w-5 items-center justify-center rounded-full ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <Btn
          size="sm"
          variant={mode === "loading" ? "solid" : "outline"}
          onClick={() => setMode(mode === "loading" ? "ok" : "loading")}
        >
          <RotateCcw size={13} aria-hidden="true" /> {mode === "loading" ? "Klaar" : "Laadstaat"}
        </Btn>
      </Glass>

      {mode === "loading" ? (
        <ul className="space-y-3.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Glass className="flex items-center gap-4 p-5">
                <span
                  className="h-13 w-13 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ height: 52, width: 52, background: C.edgeSoft }}
                />
                <span className="flex-1 space-y-2.5">
                  <span
                    className="block h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.edgeSoft }}
                  />
                  <span
                    className="block h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.edgeSoft }}
                  />
                </span>
              </Glass>
            </li>
          ))}
        </ul>
      ) : empty ? (
        <Glass className="flex flex-col items-center px-6 py-16 text-center" strong>
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              color: C.accentDeep,
              background: C.accentSoft,
              border: `1px solid ${C.accent}33`,
            }}
            aria-hidden="true"
          >
            <Wind size={28} />
          </span>
          <p className="mt-4 text-[18px] font-semibold" style={{ color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Er staat op dit moment geen opdracht voor {q ? `“${q}”` : "je zoekterm"}. Verruim je
            zoekopdracht.
          </p>
          <Btn
            variant="outline"
            className="mt-5"
            onClick={() => {
              setQ("");
              setMode("ok");
            }}
          >
            <RotateCcw size={13} aria-hidden="true" /> Zoekterm wissen
          </Btn>
        </Glass>
      ) : (
        <ul className="space-y-3.5">
          {rows.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} selected={o.id === selId} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  selected,
  onOpen,
}: {
  opdracht: Opdracht;
  selected: boolean;
  onOpen: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Glass
      as="article"
      className="overflow-hidden"
      strong={selected}
      style={
        selected
          ? {
              boxShadow: `0 10px 34px rgba(13,157,181,0.2), inset 0 1px 0 rgba(255,255,255,0.7)`,
              borderColor: `${C.accent}55`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-4 p-5">
        <MatchRing value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <h3
            className="text-[16px] font-semibold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: C.glassSoft,
                  color: C.inkSoft,
                  border: `1px solid ${C.edgeSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[16px] font-bold" style={{ color: C.ink }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.edgeSoft}`, background: C.glassSoft }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${RING}`}
          style={{ color: C.accentDeep }}
        >
          {open ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={() => onOpen(opdracht.id)}>
            Reageren <ArrowRight size={12} aria-hidden="true" />
          </Btn>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.edgeSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.pos}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.warn}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function RedenKolom({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Opdracht-detail ——————————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const feiten = [
    { l: "Tarief", v: opdracht.tarief.replace(" / uur", ""), s: "per uur" },
    { l: "Omvang", v: opdracht.uren, s: "per week" },
    { l: "Aanvang", v: opdracht.start, s: "start" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Glass className="overflow-hidden" strong>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3">
            <MatchRing value={opdracht.match} />
            <span
              className="text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: opdracht.match >= 90 ? C.pos : C.accentDeep }}
            >
              {opdracht.match >= 90 ? "Sterke match" : "Goede match"} · {opdracht.match}%
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[27px] font-bold leading-[1.15] tracking-[-0.02em] md:text-[31px]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: C.glassSoft,
                  color: C.inkSoft,
                  border: `1px solid ${C.edgeSoft}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid">
              Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.edgeSoft}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.edgeSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.edgeSoft}` : "none",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p className="mt-1.5 text-[19px] font-bold leading-none" style={{ color: C.ink }}>
                {m.v}
              </p>
              <p className="mt-1 text-[10.5px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <Glass className="p-6 md:p-8">
        <Kicker>
          <ListChecks size={13} aria-hidden="true" /> Motivering — navolgbaar, zonder verborgen
          score
        </Kicker>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.pos}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={C.warn}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </Glass>
    </div>
  );
}

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vertrouwen"
        title="Certificatenregister"
        sub={`${verified} van ${CREDENTIALS.length} geverifieerd · ${PROFIEL.trust}.`}
        right={
          <Glass className="px-5 py-3 text-center" strong>
            <p
              className="text-[30px] font-bold leading-none tracking-[-0.02em]"
              style={{ color: C.ink }}
            >
              {ratio}%
            </p>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute }}
            >
              op orde
            </p>
          </Glass>
        }
      />

      <Glass className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span className="hidden sm:inline-flex">
                    <StatusTag {...t} />
                  </span>
                  <ChevronRight
                    size={17}
                    aria-hidden="true"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="px-5 pb-5 sm:pl-[70px]"
                      style={{ borderTop: `1px solid ${C.edgeSoft}`, paddingTop: 14 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[12.5px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <Btn size="sm" variant="solid">
                          {c.status === "EXPIRING"
                            ? "Vernieuwen"
                            : c.status === "REJECTED"
                              ? "Opnieuw indienen"
                              : "Bekijken"}
                        </Btn>
                        <Btn size="sm" variant="outline">
                          Historie
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Glass>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vandaag"
        title="Wat nu je aandacht vraagt"
        sub="Op volgorde van urgentie — werk van boven naar beneden."
      />
      <ol className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.warn : C.info;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Glass className="flex items-start gap-4 p-5" strong={warn}>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold"
                  style={{
                    background: `${tone}22`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                    ...sans,
                  }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Kicker tone={tone}>
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16px] font-semibold leading-snug"
                    style={{ color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-1 max-w-lg text-[13px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-3">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Facturen"
        title="Je geldstroom"
        sub="Wat binnenkwam, wat nog onderweg is."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          { l: "Betaald", v: totals.betaald, sub: "2 facturen", tone: C.pos, Icon: Check },
          {
            l: "Openstaand",
            v: totals.open,
            sub: "1 factuur · 9 dagen",
            tone: C.warn,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.info,
            Icon: FileText,
          },
        ].map((s) => (
          <Glass key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
                {s.l}
              </p>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p className="mt-1.5 text-[22px] font-bold leading-none" style={{ color: s.tone }}>
              {eur0.format(s.v)}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 540 }}>
            <caption className="sr-only">Facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.edgeSoft}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
                    style={{ color: C.inkMute }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="cd-row"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.edgeSoft}` }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13.5px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-bold"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusTag {...t} alarm={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  );
}
