"use client";

// Concept 510 — "Waarmerk" · Trust-first, verificatie-forward. Vertrouwen is het hoofdthema:
// een waarmerk-/zegelmotief (guilloché-ringen, ticks), het vertrouwensniveau centraal, en een
// provenance-tijdlijn die elke verificatiebeslissing navolgbaar maakt: Ingediend → In beoordeling →
// Geverifieerd / Afgewezen, met een expliciete waarschuwing wanneer een waarmerk bijna verloopt.
// Editoriale serif-koppen op perkament, één zegelgroen + een bronzen foil-accent. Elke status
// draagt altijd een label én een icoon — nooit enkel kleur.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Fingerprint,
  History,
  Lock,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Stamp,
  UploadCloud,
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

// ————————————————————————————— Palet — perkament, zegelgroen, bronzen foil —————————————————————————————
const C = {
  parch: "#f1ede2",
  panel: "#faf7ee",
  panelHi: "#fffdf6",
  sink: "#f4efe2",
  line: "#e2dbc8",
  lineSoft: "#ebe4d3",
  lineStrong: "#d4cbb2",

  ink: "#211d15",
  inkSoft: "#4e4736",
  inkMute: "#7a715a",
  inkFaint: "#a99e83",

  seal: "#15795a",
  sealDeep: "#0e5a43",
  sealSoft: "rgba(21,121,90,0.12)",
  gold: "#9a7729",
  goldDeep: "#7c5f1f",
  goldSoft: "rgba(154,119,41,0.14)",

  verified: "#15795a",
  verifiedSoft: "rgba(21,121,90,0.12)",
  submitted: "#3a5a9c",
  submittedSoft: "rgba(58,90,156,0.13)",
  expiring: "#a9791d",
  expiringSoft: "rgba(169,121,29,0.15)",
  rejected: "#a83a2c",
  rejectedSoft: "rgba(168,58,44,0.12)",
};

const serif: CSSProperties = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'Times New Roman', serif",
};
const sans: CSSProperties = {
  fontFamily:
    "'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const snum: CSSProperties = { ...sans, fontVariantNumeric: "tabular-nums" };
const sernum: CSSProperties = { ...serif, fontVariantNumeric: "tabular-nums" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15795a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1ede2]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.verified,
        soft: C.verifiedSoft,
        label: "Gewaarmerkt",
        Icon: BadgeCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.submitted,
        soft: C.submittedSoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.expiring,
        soft: C.expiringSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rejected, soft: C.rejectedSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald")
    return { base: C.verified, soft: C.verifiedSoft, label: "Voldaan", Icon: Check, alarm: false };
  if (status === "Openstaand")
    return {
      base: C.expiring,
      soft: C.expiringSoft,
      label: "Openstaand",
      Icon: Clock,
      alarm: false,
    };
  if (status === "Concept")
    return {
      base: C.submitted,
      soft: C.submittedSoft,
      label: "Concept",
      Icon: FileText,
      alarm: false,
    };
  return {
    base: C.rejected,
    soft: C.rejectedSoft,
    label: status,
    Icon: AlertTriangle,
    alarm: true,
  };
}

// ————————————————————————————— Zegel / waarmerk (guilloché) —————————————————————————————
function Seal({
  size = 64,
  tone = C.seal,
  Icon = BadgeCheck,
  spin = false,
  ariaLabel,
}: {
  size?: number;
  tone?: string;
  Icon?: LucideIcon;
  spin?: boolean;
  ariaLabel?: string;
}) {
  const cx = size / 2;
  const rOuter = size / 2 - 1.5;
  const rTick = rOuter - 4;
  const rInner = rTick - 5;
  const ticks = 32;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cx}
          r={rOuter}
          fill="none"
          stroke={tone}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cx}
          r={rInner + 3}
          fill="none"
          stroke={tone}
          strokeOpacity="0.25"
          strokeWidth="0.75"
          strokeDasharray="1.5 2.5"
        />
        <g className={spin ? "wm-spin" : undefined} style={{ transformOrigin: "center" }}>
          {Array.from({ length: ticks }).map((_, i) => {
            const a = (i / ticks) * Math.PI * 2;
            const long = i % 4 === 0;
            const r1 = rTick;
            const r2 = rTick - (long ? 4 : 2);
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r1}
                y1={cx + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * r2}
                y2={cx + Math.sin(a) * r2}
                stroke={tone}
                strokeOpacity={long ? 0.55 : 0.3}
                strokeWidth={long ? 1.1 : 0.7}
              />
            );
          })}
        </g>
        <circle
          cx={cx}
          cy={cx}
          r={rInner}
          fill={tone}
          fillOpacity="0.1"
          stroke={tone}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: tone }}>
        <Icon size={Math.round(size * 0.34)} aria-hidden="true" strokeWidth={1.75} />
      </span>
    </span>
  );
}

// Trust-meter: halve boog met percentage — het vertrouwensniveau centraal
function TrustArc({ ratio, size = 168 }: { ratio: number; size?: number }) {
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 6;
  const r = w / 2 - 12;
  const start = Math.PI;
  const end = 0;
  const angle = start + (end - start) * (ratio / 100);
  const px = cx + Math.cos(angle) * r;
  const py = cy + Math.sin(angle) * r;
  const largeArc = 0;
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fillPath = `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`;
  return (
    <span
      className="relative inline-flex flex-col items-center"
      style={{ width: w }}
      aria-label={`Vertrouwensniveau ${ratio} procent`}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <path
          d={trackPath}
          fill="none"
          stroke={C.lineStrong}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={fillPath}
          fill="none"
          stroke={C.seal}
          strokeWidth="9"
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s ease" }}
        />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = start + (end - start) * (i / 10);
          const r1 = r + 8;
          const r2 = r + 12;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r1}
              y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2}
              y2={cy + Math.sin(a) * r2}
              stroke={C.inkFaint}
              strokeOpacity="0.5"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <span className="absolute" style={{ top: h * 0.34 }}>
        <span className="flex flex-col items-center">
          <span
            className="text-[36px] font-semibold leading-none"
            style={{ color: C.ink, ...sernum }}
          >
            {ratio}%
          </span>
          <span
            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.seal }}
          >
            gewaarmerkt
          </span>
        </span>
      </span>
    </span>
  );
}

// ————————————————————————————— Primitives —————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  hi = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  hi?: boolean;
}) {
  return (
    <Tag
      className={`rounded-[14px] ${className}`}
      style={{
        background: hi ? C.panelHi : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset",
      }}
    >
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
  variant?: "solid" | "outline" | "ghost" | "gold";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-1.5 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 ${RING} ${
    full ? "w-full" : ""
  }`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.seal, color: "#fff", border: `1px solid ${C.sealDeep}`, ...sans }
      : variant === "gold"
        ? { background: C.gold, color: "#fff", border: `1px solid ${C.goldDeep}`, ...sans }
        : variant === "outline"
          ? { background: C.panelHi, color: C.ink, border: `1px solid ${C.lineStrong}`, ...sans }
          : {
              background: "transparent",
              color: C.inkSoft,
              border: "1px solid transparent",
              ...sans,
            };
  const hover =
    variant === "ghost" ? "hover:bg-[#ece5d6]" : "hover:brightness-[1.06] hover:-translate-y-[1px]";
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

// Waarmerk-badge: zegelring + label + icoon (nooit kleur-alleen)
function WaarmerkBadge({ tone }: { tone: Tone }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[11.5px] font-semibold"
      style={{
        color: tone.base,
        background: tone.soft,
        border: `1px solid ${tone.base}33`,
        ...sans,
      }}
    >
      <span
        className="h-4.5 w-4.5 flex items-center justify-center rounded-full"
        style={{ background: tone.base, color: "#fff", width: 18, height: 18 }}
        aria-hidden="true"
      >
        <tone.Icon size={11} />
      </span>
      {tone.label}
      {tone.alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Eyebrow({ children, tone = C.gold }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: tone }}
    >
      {children}
    </span>
  );
}

function ScreenHead({
  over,
  title,
  sub,
  right,
}: {
  over: ReactNode;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <Eyebrow>{over}</Eyebrow>
        <h1
          className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] md:text-[33px]"
          style={{ color: C.ink, ...serif }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept510() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.parch }}
    >
      <div className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="wm-fade pt-7">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onVerif={() => setScreen("verificatie")}
              onActies={() => setScreen("acties")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && (
            <Acties
              onMarkt={() => setScreen("marktplaats")}
              onVerif={() => setScreen("verificatie")}
            />
          )}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        @keyframes wmFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .wm-fade { animation: wmFade 0.36s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes wmSpin { to { transform: rotate(360deg); } }
        .wm-spin { animation: wmSpin 60s linear infinite; transform-origin: center; }
        @keyframes wmPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }
        .wm-pulse { animation: wmPulse 1.8s ease-in-out infinite; }
        .wm-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .wm-lift:hover { transform: translateY(-2px); box-shadow: 0 14px 34px -18px rgba(33,29,21,0.4); }
        @media (prefers-reduced-motion: reduce) {
          .wm-fade, .wm-spin, .wm-pulse, .wm-lift { animation: none !important; transition: none !important; }
          .wm-lift:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex flex-wrap items-center gap-4 pt-7">
      <div className="flex items-center gap-3">
        <Seal size={42} tone={C.seal} Icon={Stamp} />
        <div>
          <p
            className="text-[19px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Waarmerk
          </p>
          <p className="mt-1.5 text-[11.5px]" style={{ color: C.inkMute }}>
            {PROFIEL.naam} · {PROFIEL.rol}
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-[11.5px] font-semibold sm:inline-flex"
          style={{ color: C.seal, background: C.verifiedSoft, border: `1px solid ${C.seal}33` }}
        >
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: C.seal, color: "#fff" }}
            aria-hidden="true"
          >
            <ShieldCheck size={12} />
          </span>
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{
            background: C.panelHi,
            border: `1px solid ${C.lineStrong}`,
            color: C.ink,
            ...serif,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Shield,
  marktplaats: Search,
  opdracht: FileText,
  verificatie: BadgeCheck,
  acties: History,
  facturen: Scale,
  documenten: FileText,
  berichten: FileText,
};

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-6 border-b" style={{ borderColor: C.line }}>
      <div className="flex gap-1 overflow-x-auto">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          const Icon = NAV_ICON[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-[13.5px] font-semibold transition-colors ${RING}`}
              style={{ color: on ? C.ink : C.inkMute }}
            >
              <Icon size={15} aria-hidden="true" style={{ color: on ? C.seal : C.inkFaint }} />
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-t-full"
                  style={{ background: C.seal }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onVerif,
  onActies,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onVerif: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Eyebrow>
            <Stamp size={13} aria-hidden="true" /> Vertrouwensdossier
          </Eyebrow>
          <h1
            className="mt-2.5 text-[32px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[40px]"
            style={{ color: C.ink, ...serif }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je dossier is grotendeels gewaarmerkt en navolgbaar. Eén certificaat vraagt binnenkort
            om vernieuwing — regel het op tijd om verifieerbaar te blijven.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Btn variant="solid" onClick={onVerif}>
              <BadgeCheck size={15} aria-hidden="true" /> Naar mijn waarmerken
            </Btn>
            <Btn variant="outline" onClick={onMarkt}>
              Marktplaats
            </Btn>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPIS.map((k) => (
              <Card key={k.label} className="p-3.5">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <p
                  className="mt-1.5 text-[21px] font-semibold leading-none"
                  style={{ color: C.ink, ...sernum }}
                >
                  {k.value}
                </p>
                <p
                  className="mt-2 text-[11px] font-semibold"
                  style={{ color: k.up ? C.seal : C.expiring, ...snum }}
                >
                  {k.up ? "▲" : "▼"} {k.trend}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <Card hi className="flex flex-col items-center p-6 text-center">
          <Eyebrow tone={C.seal}>
            <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
          </Eyebrow>
          <div className="mt-4">
            <TrustArc ratio={ratio} />
          </div>
          <p className="mt-2 text-[18px] font-semibold" style={{ color: C.ink, ...serif }}>
            {PROFIEL.trust}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {verified} van {CREDENTIALS.length} certificaten voorzien van een waarmerk.
          </p>
          <button
            type="button"
            onClick={onVerif}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold ${RING}`}
            style={{ color: C.seal }}
          >
            Bekijk het register <ArrowRight size={13} aria-hidden="true" />
          </button>
        </Card>
      </section>

      {/* Urgente actie — provenance-hint */}
      <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{
            background: C.expiringSoft,
            color: C.expiring,
            border: `1px solid ${C.expiring}33`,
          }}
          aria-hidden="true"
        >
          <AlertTriangle size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <Eyebrow tone={C.expiring}>
            <Clock size={12} aria-hidden="true" /> Waarmerk verloopt
          </Eyebrow>
          <h3
            className="mt-1.5 text-[17px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
        </div>
        <Btn variant="gold" onClick={onActies} className="shrink-0">
          {primair.cta} <ArrowRight size={13} aria-hidden="true" />
        </Btn>
      </Card>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <Eyebrow>
            <Search size={13} aria-hidden="true" /> Aanbevolen opdrachten
          </Eyebrow>
          <button
            type="button"
            onClick={onMarkt}
            className={`rounded-full text-[12.5px] font-semibold ${RING}`}
            style={{ color: C.seal }}
          >
            Volledige lijst →
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.seal : C.gold;
  return (
    <Card as="article" className="wm-lift overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className={`group flex w-full items-center gap-4 p-4 text-left focus-visible:ring-inset ${RING}`}
      >
        <Seal
          size={52}
          tone={tone}
          Icon={strong ? BadgeCheck : Shield}
          ariaLabel={`Match ${opdracht.match} procent`}
        />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15.5px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[15px] font-semibold" style={{ color: C.ink, ...sernum }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur · {opdracht.match}% match
          </span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: C.inkFaint }}
        />
      </button>
    </Card>
  );
}

// —————————————————————————————————————— Marktplaats ——————————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <ScreenHead
        over={
          <>
            <Search size={13} aria-hidden="true" /> Marktplaats
          </>
        }
        title="Opdrachten bij geverifieerde opdrachtgevers"
        sub={`${rows.length} van ${OPDRACHTEN.length} opdrachten sluiten aan op je gewaarmerkte profiel.`}
      />

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.sink, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a99e83]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className={`flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#e2dbc8] ${RING}`}
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              <ArrowUpDown size={12} aria-hidden="true" />
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </Card>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-5">
                <div
                  className="h-4 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          tone={C.rejected}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.seal}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-5 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`rounded-full text-[11px] uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <Card hi className="flex flex-col items-center px-6 py-16 text-center">
      <Seal size={62} tone={tone} Icon={Icon} />
      <p className="mt-4 text-[20px] font-semibold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={13} aria-hidden="true" /> {cta}
      </Btn>
    </Card>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  const tone = strong ? C.seal : C.gold;
  return (
    <Card as="article" className="wm-lift overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <Seal
          size={60}
          tone={tone}
          Icon={strong ? BadgeCheck : Shield}
          ariaLabel={`Match ${opdracht.match} procent`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: tone }}
            >
              {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...snum }}>
              {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-1.5 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                style={{ background: C.sink, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[17px] font-semibold" style={{ color: C.ink, ...sernum }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold ${RING}`}
          style={{ color: C.seal }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={onOpen}>
            Reageren <ArrowRight size={13} aria-hidden="true" />
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
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.seal}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.expiring}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Card>
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
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2.5 text-[13.5px] leading-snug"
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
// Trust-forward: koppel de vereiste kwalificaties aan je eigen gewaarmerkte certificaten.
function matchCredential(tag: string): CredStatus | null {
  const t = tag.toLowerCase();
  if (t.includes("big")) return "VERIFIED";
  if (t.includes("vig")) return "VERIFIED";
  if (t.includes("skj")) return "VERIFIED";
  return null;
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.seal : C.gold;
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar marktplaats
      </Btn>

      <Card hi className="overflow-hidden p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Seal
            size={72}
            tone={tone}
            Icon={strong ? BadgeCheck : Shield}
            ariaLabel={`Match ${opdracht.match} procent`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11.5px]" style={{ color: C.inkMute, ...snum }}>
                {opdracht.id}
              </span>
              <span className="h-3 w-px" style={{ background: C.lineStrong }} aria-hidden="true" />
              <span
                className="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: tone }}
              >
                {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
              </span>
            </div>
            <h1
              className="mt-2.5 max-w-2xl text-[27px] font-semibold leading-[1.12] tracking-[-0.015em] md:text-[32px]"
              style={{ color: C.ink, ...serif }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={14} aria-hidden="true" />
          </Btn>
          <Btn variant="outline">Bewaren</Btn>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
            { l: "Omvang", v: opdracht.uren },
            { l: "Aanvang", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m) => (
            <div
              key={m.l}
              className="rounded-[11px] p-3.5"
              style={{ background: C.sink, border: `1px solid ${C.line}` }}
            >
              <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: C.inkMute }}>
                {m.l}
              </p>
              <p className="mt-1.5 text-[17px] font-semibold" style={{ color: C.ink, ...sernum }}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Vereiste kwalificaties — gekoppeld aan je waarmerken */}
      <Card className="p-6">
        <Eyebrow tone={C.seal}>
          <ShieldCheck size={13} aria-hidden="true" /> Vereiste kwalificaties
        </Eyebrow>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          De opdrachtgever vraagt onderstaande kwalificaties. Groen betekent dat je waarmerk al
          geldig in je dossier staat.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {opdracht.tags.map((tag) => {
            const st = matchCredential(tag);
            const dekt = st !== null;
            const t = dekt ? credTone("VERIFIED") : null;
            return (
              <li key={tag}>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                  style={
                    dekt && t
                      ? { color: t.base, background: t.soft, border: `1px solid ${t.base}33` }
                      : { color: C.inkMute, background: C.sink, border: `1px solid ${C.line}` }
                  }
                >
                  {dekt ? (
                    <BadgeCheck size={13} aria-hidden="true" />
                  ) : (
                    <Minus size={13} aria-hidden="true" />
                  )}
                  {tag}
                  {dekt && <span className="sr-only"> — gewaarmerkt</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-6">
        <Eyebrow>
          <Scale size={13} aria-hidden="true" /> Motivering — navolgbaar, zonder verborgen score
        </Eyebrow>
        <p className="mb-5 mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je gewaarmerkte profiel. Wat in je voordeel spreekt, en wat goed is om
          vooraf te weten.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.seal }}
            >
              <Check size={13} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.seal }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.expiring }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.expiring }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// —————————————————————————————————————— Verificatie (pronkstuk) ——————————————————————————————————————
type ProvKind = "done" | "current" | "future" | "warn" | "reject";
type ProvStep = { label: string; actor: string; datum: string; kind: ProvKind; Icon: LucideIcon };

function provenance(c: { naam: string; status: CredStatus; detail: string }): ProvStep[] {
  const ingediend: ProvStep = {
    label: "Ingediend",
    actor: "Door jou geüpload",
    datum: "Ingang dossier",
    kind: "done",
    Icon: UploadCloud,
  };
  const beoordeling: ProvStep = {
    label: "In beoordeling",
    actor: "Verificatieteam",
    datum: "Handmatige controle",
    kind: "done",
    Icon: Clock,
  };
  switch (c.status) {
    case "VERIFIED":
      return [
        ingediend,
        beoordeling,
        {
          label: "Gewaarmerkt",
          actor: "Waarmerk toegekend",
          datum: c.detail.replace("Geverifieerd · ", ""),
          kind: "current",
          Icon: BadgeCheck,
        },
      ];
    case "SUBMITTED":
      return [
        { ...ingediend, datum: c.detail.replace("In beoordeling · ingediend ", "") },
        { ...beoordeling, kind: "current" },
        {
          label: "Waarmerk",
          actor: "In afwachting van besluit",
          datum: "Verwacht binnen 5 werkdagen",
          kind: "future",
          Icon: BadgeCheck,
        },
      ];
    case "EXPIRING":
      return [
        ingediend,
        {
          label: "Gewaarmerkt",
          actor: "Waarmerk toegekend",
          datum: "Eerder dit jaar",
          kind: "done",
          Icon: BadgeCheck,
        },
        {
          label: "Verloopt bijna",
          actor: "Vernieuwing vereist",
          datum: c.detail.replace("Verloopt over ", "over "),
          kind: "warn",
          Icon: AlertTriangle,
        },
      ];
    case "REJECTED":
      return [
        ingediend,
        beoordeling,
        {
          label: "Afgewezen",
          actor: "Reden verplicht opgegeven",
          datum: "Herstelactie beschikbaar",
          kind: "reject",
          Icon: X,
        },
      ];
  }
}

function provTone(kind: ProvKind): string {
  switch (kind) {
    case "done":
      return C.seal;
    case "current":
      return C.seal;
    case "warn":
      return C.expiring;
    case "reject":
      return C.rejected;
    case "future":
      return C.inkFaint;
  }
}

const LIFECYCLE: { label: string; Icon: LucideIcon; tone: string }[] = [
  { label: "Ingediend", Icon: UploadCloud, tone: C.inkMute },
  { label: "In beoordeling", Icon: Clock, tone: C.submitted },
  { label: "Gewaarmerkt", Icon: BadgeCheck, tone: C.verified },
];

function Verificatie() {
  const [sel, setSel] = useState<string>(CREDENTIALS[2]?.naam ?? CREDENTIALS[0]?.naam ?? "");
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const selected = CREDENTIALS.find((c) => c.naam === sel) ?? CREDENTIALS[0];

  return (
    <div className="space-y-6">
      <ScreenHead
        over={
          <>
            <Stamp size={13} aria-hidden="true" /> Verificatieregister
          </>
        }
        title="Elk waarmerk, navolgbaar tot de bron"
        sub="Van indiening tot besluit — de volledige herkomst van elke verificatie, transparant vastgelegd."
      />

      {/* Vertrouwenssamenvatting + levenscyclus */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card hi className="flex flex-col items-center justify-center p-6 text-center">
          <TrustArc ratio={ratio} size={186} />
          <p className="mt-2 text-[17px] font-semibold" style={{ color: C.ink, ...serif }}>
            {PROFIEL.trust}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: C.inkMute }}>
            <Lock size={12} aria-hidden="true" /> Versleuteld bewaard · alleen met jouw toestemming
            gedeeld
          </div>
        </Card>

        <Card className="p-6">
          <Eyebrow tone={C.seal}>
            <History size={13} aria-hidden="true" /> Levenscyclus van een waarmerk
          </Eyebrow>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            Elk certificaat doorloopt dezelfde route. Een besluit is óf een waarmerk, óf een
            afwijzing met reden.
          </p>
          <div className="mt-5 flex items-center">
            {LIFECYCLE.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      background: `${step.tone}18`,
                      color: step.tone,
                      border: `1px solid ${step.tone}40`,
                    }}
                    aria-hidden="true"
                  >
                    <step.Icon size={19} />
                  </span>
                  <span
                    className="text-[11.5px] font-semibold leading-tight"
                    style={{ color: C.inkSoft }}
                  >
                    {step.label}
                  </span>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <span
                    className="mx-1 h-px flex-1"
                    style={{ background: C.lineStrong }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-[12px]"
            style={{ borderColor: C.lineSoft }}
          >
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: C.rejected }}
            >
              <X size={13} aria-hidden="true" /> Afgewezen — reden verplicht
            </span>
            <span
              className="inline-flex items-center gap-1.5 font-semibold"
              style={{ color: C.expiring }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Verloopt — tijdig vernieuwen
            </span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.15fr]">
        {/* Register-lijst */}
        <div>
          <Eyebrow>
            <BadgeCheck size={13} aria-hidden="true" /> Jouw certificaten
          </Eyebrow>
          <ul className="mt-3 space-y-2.5">
            {CREDENTIALS.map((c) => {
              const t = credTone(c.status);
              const on = c.naam === sel;
              return (
                <li key={c.naam}>
                  <button
                    type="button"
                    onClick={() => setSel(c.naam)}
                    aria-current={on ? "true" : undefined}
                    className={`flex w-full items-center gap-3 rounded-[13px] p-3.5 text-left transition-colors ${RING}`}
                    style={{
                      background: on ? C.panelHi : C.panel,
                      border: `1px solid ${on ? t.base + "55" : C.line}`,
                      boxShadow: on ? `0 0 0 1px ${t.base}22` : "none",
                    }}
                  >
                    <Seal size={40} tone={t.base} Icon={t.Icon} />
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span className="mt-1 inline-flex">
                        <WaarmerkBadge tone={t} />
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      style={{ color: on ? t.base : C.inkFaint }}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Provenance-tijdlijn van het geselecteerde certificaat */}
        {selected && <ProvenancePanel cred={selected} />}
      </section>
    </div>
  );
}

function ProvenancePanel({ cred }: { cred: { naam: string; status: CredStatus; detail: string } }) {
  const steps = provenance(cred);
  const t = credTone(cred.status);
  return (
    <Card hi as="article" className="overflow-hidden">
      <div
        className="flex items-center gap-3 p-5"
        style={{ borderBottom: `1px solid ${C.line}`, background: C.sink }}
      >
        <Seal size={46} tone={t.base} Icon={t.Icon} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold" style={{ color: C.ink, ...serif }}>
            {cred.naam}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.inkMute }}>
            <Fingerprint size={12} aria-hidden="true" /> Herkomst · {cred.detail}
          </div>
        </div>
        <WaarmerkBadge tone={t} />
      </div>

      <div className="p-5">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: C.gold }}
        >
          Provenance-tijdlijn
        </p>
        <ol className="relative space-y-0">
          {steps.map((s, i) => {
            const tone = provTone(s.kind);
            const last = i === steps.length - 1;
            const future = s.kind === "future";
            return (
              <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span
                    className="absolute bottom-0 left-[17px] top-9 w-px"
                    style={{
                      background: future ? "transparent" : C.lineStrong,
                      borderLeft: future ? `1px dashed ${C.lineStrong}` : "none",
                    }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 shrink-0">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      background: future ? C.panel : `${tone}15`,
                      color: tone,
                      border: future ? `1px dashed ${C.lineStrong}` : `1.5px solid ${tone}`,
                    }}
                    aria-hidden="true"
                  >
                    <s.Icon size={16} />
                  </span>
                  {s.kind === "current" && (
                    <span
                      className="wm-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                      style={{ background: tone }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: future ? C.inkMute : C.ink }}
                    >
                      {s.label}
                    </span>
                    {s.kind === "current" && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: tone, background: `${tone}18` }}
                      >
                        Huidige stap
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
                    {s.actor}
                  </p>
                  <p
                    className="mt-0.5 flex items-center gap-1.5 text-[11.5px]"
                    style={{ color: C.inkFaint }}
                  >
                    <Calendar size={11} aria-hidden="true" /> {s.datum}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className="mt-4 flex flex-wrap gap-2 border-t pt-4"
          style={{ borderColor: C.lineSoft }}
        >
          <Btn size="sm" variant={cred.status === "EXPIRING" ? "gold" : "solid"}>
            {cred.status === "EXPIRING"
              ? "Nu vernieuwen"
              : cred.status === "REJECTED"
                ? "Opnieuw indienen"
                : cred.status === "SUBMITTED"
                  ? "Status volgen"
                  : "Waarmerk tonen"}
            <ArrowRight size={13} aria-hidden="true" />
          </Btn>
          <Btn size="sm" variant="outline">
            <Download size={13} aria-hidden="true" /> Bewijs
          </Btn>
        </div>
      </div>
    </Card>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onVerif }: { onMarkt: () => void; onVerif: () => void }) {
  return (
    <div className="space-y-5">
      <ScreenHead
        over={
          <>
            <History size={13} aria-hidden="true" /> Actielijst
          </>
        }
        title="Wat je vertrouwen op peil houdt"
        sub="Op volgorde van urgentie — werk van boven naar beneden."
      />
      <ol className="relative space-y-0 pl-2">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.expiring : C.submitted;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goVerif =
            a.cta.toLowerCase().includes("vog") || a.cta.toLowerCase().includes("vernieuw");
          const last = i === ACTIES.length - 1;
          return (
            <li key={a.titel} className="relative flex gap-4 pb-4 last:pb-0">
              {!last && (
                <span
                  className="absolute bottom-0 left-[19px] top-11 w-px"
                  style={{ background: C.lineStrong }}
                  aria-hidden="true"
                />
              )}
              <span
                className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
                style={{
                  background: `${tone}18`,
                  color: tone,
                  border: `1.5px solid ${tone}`,
                  ...sernum,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <Card className="min-w-0 flex-1 p-5">
                <Eyebrow tone={tone}>
                  {warn ? (
                    <AlertTriangle size={12} aria-hidden="true" />
                  ) : (
                    <Clock size={12} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Aanbevolen"}
                </Eyebrow>
                <h2
                  className="mt-1.5 text-[17px] font-semibold leading-snug"
                  style={{ color: C.ink, ...serif }}
                >
                  {a.titel}
                </h2>
                <p
                  className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.inkSoft }}
                >
                  {a.detail}
                </p>
                <div className="mt-3">
                  <Btn
                    variant={warn ? "gold" : "outline"}
                    size="sm"
                    onClick={goMarkt ? onMarkt : goVerif ? onVerif : undefined}
                  >
                    {a.cta} <ArrowRight size={13} aria-hidden="true" />
                  </Btn>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce(
        (a, f) => a + parseInt(f.bedrag.replace(/\D/g, ""), 10),
        0,
      );
    const fmt = (n: number) => `€ ${n.toLocaleString("nl-NL")}`;
    return [
      { l: "Voldaan", v: fmt(sum("Betaald")), sub: "2 facturen", tone: C.verified, Icon: Check },
      {
        l: "Openstaand",
        v: fmt(sum("Openstaand")),
        sub: "1 factuur · 9 dagen",
        tone: C.expiring,
        Icon: Clock,
      },
      {
        l: "Concept",
        v: fmt(sum("Concept")),
        sub: "klaar om te versturen",
        tone: C.submitted,
        Icon: FileText,
      },
    ];
  }, []);

  return (
    <div className="space-y-5">
      <ScreenHead
        over={
          <>
            <Scale size={13} aria-hidden="true" /> Grootboek
          </>
        }
        title="Je facturen"
        right={
          <Btn variant="solid" size="sm">
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {totals.map((s) => (
          <Card key={s.l} className="p-4">
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute }}
              >
                {s.l}
              </p>
              <s.Icon size={14} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p className="mt-1 text-[23px] font-semibold" style={{ color: s.tone, ...sernum }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            onClick={() => setSort(s)}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 560 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
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
              {rows.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#f4efe2]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...snum }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-semibold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkMute, ...snum }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[14px] font-semibold"
                      style={{ color: C.ink, ...sernum }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                        style={{ color: t.base }}
                      >
                        <t.Icon size={12} aria-hidden="true" /> {t.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p
        className="flex items-center justify-center gap-1.5 text-center text-[11.5px]"
        style={{ color: C.inkFaint }}
      >
        <Send size={12} aria-hidden="true" /> Elke verzonden factuur wordt vastgelegd in je
        grootboek.
      </p>
    </div>
  );
}
