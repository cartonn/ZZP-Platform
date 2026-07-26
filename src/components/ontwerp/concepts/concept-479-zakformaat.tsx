"use client";

// Concept 479 — "Zakformaat" · Mobiel-first, native-app gevoel. Het hele platform leeft binnen
// een gecentreerd telefoon-frame met een bottom-tab-bar als hoofdnav; detailschermen schuiven als
// bottom-sheets omhoog. Grote tap-targets, duim-vriendelijk, één levendig accent, systeem-neutraal.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Home,
  Inbox,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Wifi,
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
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: licht, systeem-neutraal, één levendig indigo-accent —
const C = {
  room: "#e9eaf0", // rustige achtergrond rondom het toestel
  roomDeep: "#d9dae4",
  bezel: "#0b0b12", // toestelrand
  app: "#ffffff", // app-oppervlak
  surface: "#ffffff",
  surfaceAlt: "#f4f4f7", // systeem-grijs paneel
  surfaceSunk: "#eeeef3",
  ink: "#17171f",
  inkSoft: "#4b4b57",
  inkMute: "#83838f",
  inkFaint: "#aeaeb8",
  line: "#ececf1",
  lineSoft: "#f3f3f7",
  accent: "#6366f1", // levendig indigo
  accentDeep: "#4f46e5",
  accentSoft: "#eef0ff",
  green: "#16a34a",
  greenSoft: "#e6f6ec",
  amber: "#d97706",
  amberSoft: "#fdf0dd",
  blue: "#2563eb",
  blueSoft: "#e6effe",
  red: "#dc2626",
  redSoft: "#fdeaea",
};

const bodyFont = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, system-ui, sans-serif",
};
const num = {
  fontFamily: "'SF Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  wash: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        ink: C.green,
        wash: C.greenSoft,
      };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.blue, wash: C.blueSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.amber,
        wash: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: X, alarm: true, ink: C.red, wash: C.redSoft };
  }
}

// — Icoon per hoofdscherm voor de tab-bar —
const SCREEN_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Home,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Inbox,
  facturen: Receipt,
  documenten: FileText,
  berichten: MessageCircle,
};

// — Compacte mini-sparkline —
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 22;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={tone} />
    </svg>
  );
}

// — Pill-badge —
function Pill({
  children,
  ink,
  wash,
  Icon,
}: {
  children: React.ReactNode;
  ink: string;
  wash: string;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ color: ink, background: wash, ...bodyFont }}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}

// — Primaire, duim-vriendelijke knop (min. 44px hoog) —
function TapButton({
  children,
  onClick,
  tone = C.accent,
  variant = "solid",
  className = "",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  variant?: "solid" | "soft" | "ghost";
  className?: string;
  ariaLabel?: string;
}) {
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#fff", boxShadow: "0 6px 16px -8px rgba(79,70,229,0.7)" }
      : variant === "soft"
        ? { background: C.accentSoft, color: C.accentDeep }
        : { background: C.surface, color: C.ink, border: `1px solid ${C.line}` };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-semibold transition-all duration-150 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${className}`}
      style={{ ...styles, ...bodyFont }}
    >
      {children}
    </button>
  );
}

export function Concept479() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sheet, setSheet] = useState<null | Opdracht>(null);
  const [meer, setMeer] = useState(false);
  const active = OPDRACHTEN[0] as Opdracht;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bij schermwissel terug naar boven scrollen — als een echte app.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  const openOpdracht = (o: Opdracht) => setSheet(o);
  const goScreen = (s: ScreenKey) => {
    setScreen(s);
    setMeer(false);
    setSheet(null);
  };

  const now = "9:41";
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div
      className="relative flex min-h-[760px] w-full items-center justify-center py-6 antialiased sm:py-10"
      style={{
        ...bodyFont,
        color: C.ink,
        backgroundColor: C.room,
        backgroundImage: `radial-gradient(120% 90% at 50% -10%, ${C.roomDeep} 0%, ${C.room} 60%)`,
      }}
    >
      <style>{`
        @keyframes zfSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes zfFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zfScreenIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .zf-sheet { animation: zfSheetIn 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .zf-scrim { animation: zfFadeIn 0.24s ease both; }
        .zf-screen { animation: zfScreenIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        .zf-scroll::-webkit-scrollbar { width: 0; height: 0; }
        .zf-scroll { scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .zf-sheet, .zf-scrim, .zf-screen { animation: none !important; }
        }
      `}</style>

      {/* Toestel-frame: op mobiel vrijwel full-bleed, op desktop een net gecentreerd telefoon-frame */}
      <div
        className="relative flex w-full max-w-[420px] flex-col overflow-hidden rounded-[0px] sm:rounded-[46px] sm:p-[10px]"
        style={{
          background: C.bezel,
          boxShadow:
            "0 2px 4px rgba(11,11,18,0.2), 0 40px 80px -30px rgba(11,11,18,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="relative flex h-[720px] flex-col overflow-hidden rounded-[0px] sm:rounded-[38px]"
          style={{ background: C.app }}
        >
          {/* Statusbalk-chroom */}
          <div
            className="relative z-20 flex items-center justify-between px-6 pb-1 pt-3 text-[12.5px] font-semibold"
            style={{ color: C.ink, ...num }}
          >
            <span>{now}</span>
            <span
              className="pointer-events-none absolute left-1/2 top-2 hidden h-6 w-28 -translate-x-1/2 rounded-full sm:block"
              style={{ background: C.bezel }}
              aria-hidden="true"
            />
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <SignalBars />
              <Wifi size={14} />
              <BatteryGlyph />
            </span>
          </div>

          {/* App-header */}
          <AppHeader screen={screen} ongelezen={ongelezen} onBell={() => goScreen("acties")} />

          {/* Scrollbaar contentgebied */}
          <div
            ref={scrollRef}
            className="zf-scroll relative flex-1 overflow-y-auto overscroll-contain"
            style={{ background: C.app }}
          >
            <main key={screen} className="zf-screen px-4 pb-28 pt-2">
              {screen === "dashboard" && (
                <Dashboard
                  onOpen={openOpdracht}
                  onAll={() => goScreen("marktplaats")}
                  onActies={() => goScreen("acties")}
                />
              )}
              {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
              {screen === "opdracht" && <OpdrachtScreen opdracht={active} onOpen={openOpdracht} />}
              {screen === "verificatie" && <Verificatie />}
              {screen === "acties" && <Acties onMarkt={() => goScreen("marktplaats")} />}
              {screen === "facturen" && <Facturen />}
            </main>
          </div>

          {/* Bottom-tab-bar */}
          <TabBar screen={screen} onTab={goScreen} onMeer={() => setMeer(true)} meerActive={meer} />
        </div>
      </div>

      {/* Opdracht-detail als bottom-sheet */}
      {sheet && <OpdrachtSheet opdracht={sheet} onClose={() => setSheet(null)} />}

      {/* "Meer"-menu als bottom-sheet */}
      {meer && <MeerSheet current={screen} onPick={goScreen} onClose={() => setMeer(false)} />}
    </div>
  );
}

function SignalBars() {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[6, 9, 12, 15].map((h, i) => (
        <span
          key={h}
          className="w-[3px] rounded-[1px]"
          style={{ height: h, background: i === 3 ? C.inkFaint : C.ink }}
        />
      ))}
    </span>
  );
}

function BatteryGlyph() {
  return (
    <span className="relative inline-flex items-center" aria-hidden="true">
      <span
        className="flex h-[13px] w-[24px] items-center rounded-[4px] p-[2px]"
        style={{ border: `1px solid ${C.inkFaint}` }}
      >
        <span className="h-full w-[70%] rounded-[1.5px]" style={{ background: C.ink }} />
      </span>
      <span className="ml-[1px] h-[5px] w-[2px] rounded-r-sm" style={{ background: C.inkFaint }} />
    </span>
  );
}

function AppHeader({
  screen,
  ongelezen,
  onBell,
}: {
  screen: ScreenKey;
  ongelezen: number;
  onBell: () => void;
}) {
  const titel = SCREENS.find((s) => s.key === screen)?.label ?? "Zakformaat";
  return (
    <header
      className="relative z-10 flex items-center justify-between gap-3 px-5 pb-3 pt-1"
      style={{ background: C.app, borderBottom: `1px solid ${C.lineSoft}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[13px]"
          style={{
            background: C.accent,
            color: "#fff",
            boxShadow: "0 4px 12px -4px rgba(99,102,241,0.7)",
          }}
          aria-hidden="true"
        >
          <Wallet size={17} strokeWidth={2.2} />
        </span>
        <div className="leading-tight">
          <p className="text-[16px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
            {titel}
          </p>
          <p className="text-[10.5px]" style={{ color: C.inkMute }}>
            {PROFIEL.naam.split(" ")[0]} · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBell}
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
          style={{ color: C.inkSoft }}
          aria-label={`${ongelezen} meldingen, open acties`}
        >
          <Bell size={19} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.accent, color: "#fff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </button>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: C.accentSoft, color: C.accentDeep, ...num }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

// — Bottom-tab-bar: 4 hoofd-tabs + een "Meer"-tab —
function TabBar({
  screen,
  onTab,
  onMeer,
  meerActive,
}: {
  screen: ScreenKey;
  onTab: (s: ScreenKey) => void;
  onMeer: () => void;
  meerActive: boolean;
}) {
  const primary: ScreenKey[] = ["dashboard", "marktplaats", "acties", "verificatie"];
  const inMeer = !primary.includes(screen);
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="absolute inset-x-0 bottom-0 z-10 flex items-stretch justify-around px-2 pt-2"
      style={{
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: `1px solid ${C.line}`,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
      }}
    >
      {primary.map((key) => {
        const on = key === screen && !meerActive;
        const Icon = SCREEN_ICON[key];
        const label = SCREENS.find((s) => s.key === key)?.label ?? key;
        const badge = key === "acties" ? ACTIES.length : 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            aria-current={on ? "page" : undefined}
            className="relative flex min-w-[56px] flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
            style={{ color: on ? C.accentDeep : C.inkMute }}
          >
            <span className="relative">
              <Icon size={22} strokeWidth={on ? 2.4 : 2} aria-hidden="true" />
              {badge > 0 && (
                <span
                  className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold"
                  style={{ background: C.accent, color: "#fff", ...num }}
                  aria-hidden="true"
                >
                  {badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold tracking-tight">{label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onMeer}
        aria-haspopup="dialog"
        aria-expanded={meerActive}
        className="relative flex min-w-[56px] flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
        style={{ color: inMeer || meerActive ? C.accentDeep : C.inkMute }}
      >
        <LayoutGrid size={22} strokeWidth={inMeer || meerActive ? 2.4 : 2} aria-hidden="true" />
        <span className="text-[10px] font-semibold tracking-tight">Meer</span>
      </button>
    </nav>
  );
}

// ————————————————————————————————— Dashboard —————————————————————————————————
function Dashboard({
  onOpen,
  onAll,
  onActies,
}: {
  onOpen: (o: Opdracht) => void;
  onAll: () => void;
  onActies: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const top = OPDRACHTEN.slice(0, 2);
  return (
    <div className="space-y-4">
      {/* Groet + vertrouwen */}
      <section className="pt-1">
        <p className="text-[13px]" style={{ color: C.inkMute }}>
          Goedemorgen,
        </p>
        <h1
          className="text-[26px] font-bold leading-tight tracking-[-0.02em]"
          style={{ color: C.ink }}
        >
          {PROFIEL.naam.split(" ")[0]} 👋
        </h1>
        <div className="mt-2">
          <Pill ink={C.green} wash={C.greenSoft} Icon={ShieldCheck}>
            {PROFIEL.trust} · {verified}/{CREDENTIALS.length} certificaten in orde
          </Pill>
        </div>
      </section>

      {/* Prioriteitskaart — next action */}
      <button
        type="button"
        onClick={onActies}
        className="w-full overflow-hidden rounded-3xl p-5 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 active:scale-[0.99] motion-reduce:active:scale-100"
        style={{
          background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentDeep} 100%)`,
          color: "#fff",
          boxShadow: "0 16px 34px -18px rgba(79,70,229,0.9)",
        }}
      >
        <span
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          <Sparkles size={13} aria-hidden="true" /> Volgende beste actie
        </span>
        <span className="mt-2 block text-[18px] font-bold leading-snug">{primair.titel}</span>
        <span className="mt-1.5 block text-[13px]" style={{ color: "rgba(255,255,255,0.9)" }}>
          {primair.detail}
        </span>
        <span
          className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-2xl bg-white px-4 text-[13.5px] font-bold"
          style={{ color: C.accentDeep }}
        >
          {primair.cta} <ArrowRight size={15} aria-hidden="true" />
        </span>
      </button>

      {/* KPI-tegels 2x2 */}
      <section>
        <SectionTitle>Deze maand</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {KPIS.map((k) => {
            const tone = k.up ? C.green : C.amber;
            return (
              <div
                key={k.label}
                className="rounded-2xl p-3.5"
                style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
              >
                <p className="truncate text-[10.5px] font-semibold" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-1 text-[20px] font-bold tracking-[-0.01em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-bold"
                    style={{ color: tone, ...num }}
                  >
                    <ArrowUpRight
                      size={11}
                      aria-hidden="true"
                      style={{ transform: k.up ? "none" : "rotate(90deg)" }}
                    />
                    {k.trend.replace(/^\+/, "")}
                  </span>
                  <Spark data={k.spark} tone={tone} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Beste matches */}
      <section>
        <div className="flex items-center justify-between">
          <SectionTitle>Beste matches</SectionTitle>
          <button
            type="button"
            onClick={onAll}
            className="rounded text-[12px] font-semibold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
            style={{ color: C.accentDeep }}
          >
            Alles
          </button>
        </div>
        <ul className="space-y-2.5">
          {top.map((o) => (
            <li key={o.id}>
              <OpdrachtRow opdracht={o} onOpen={() => onOpen(o)} />
            </li>
          ))}
        </ul>
      </section>

      {/* Berichten-preview */}
      <section>
        <SectionTitle>Berichten</SectionTitle>
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          {BERICHTEN.map((b, i) => (
            <div
              key={b.van}
              className="flex items-center gap-3 px-3.5 py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: C.surfaceAlt, color: C.inkSoft, ...num }}
                aria-hidden="true"
              >
                {b.initialen}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                    {b.van}
                  </span>
                  {b.ongelezen && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: C.accent }}
                      aria-label="ongelezen"
                    />
                  )}
                </span>
                <span className="block truncate text-[11.5px]" style={{ color: C.inkMute }}>
                  {b.preview}
                </span>
              </span>
              <span className="shrink-0 text-[10.5px]" style={{ color: C.inkFaint, ...num }}>
                {b.tijd}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-2 mt-1 text-[12px] font-bold uppercase tracking-[0.1em]"
      style={{ color: C.inkMute }}
    >
      {children}
    </h2>
  );
}

// — Compacte opdracht-rij (herbruikt op dashboard & marktplaats) —
function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.accent;
  const wash = strong ? C.greenSoft : C.accentSoft;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 active:scale-[0.99] motion-reduce:active:scale-100"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl"
        style={{ background: wash, color: tone }}
        aria-hidden="true"
      >
        <span className="text-[15px] font-bold leading-none" style={{ ...num }}>
          {opdracht.match}
        </span>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.1em]">match</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold" style={{ color: C.ink }}>
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
          style={{ color: C.inkMute }}
        >
          <MapPin size={11} aria-hidden="true" /> {opdracht.plaats} · {opdracht.tarief}
        </span>
      </span>
      <ChevronRight
        size={18}
        aria-hidden="true"
        style={{ color: C.inkFaint }}
        className="shrink-0"
      />
    </button>
  );
}

// ———————————————————————————————— Marktplaats ————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Eerste keer: simuleer laden.
  useEffect(() => {
    timer.current = setTimeout(() => setMode("ok"), 850);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const refresh = () => {
    if (timer.current) clearTimeout(timer.current);
    setMode("loading");
    timer.current = setTimeout(() => setMode("ok"), 850);
  };

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
  }, [q]);

  return (
    <div className="space-y-3">
      {/* Zoekveld */}
      <div
        className="sticky top-0 z-10 -mx-4 flex items-center gap-2 px-4 pb-2 pt-1"
        style={{ background: C.app }}
      >
        <div
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-2xl px-3.5"
          style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek opdrachten…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#aeaeb8]"
            style={{ color: C.ink, ...bodyFont }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#e6e6ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          aria-label="Opnieuw laden"
          className="flex h-11 w-11 items-center justify-center rounded-2xl transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
          style={{ color: C.accentDeep, background: C.accentSoft }}
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={mode === "loading" ? "animate-spin motion-reduce:animate-none" : ""}
          />
        </button>
      </div>

      {mode === "ok" && (
        <p className="px-1 text-[12px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten passen bij je profiel
        </p>
      )}

      {/* States */}
      {mode === "loading" ? (
        <ul className="space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <div
                className="rounded-2xl p-4"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 shrink-0 animate-pulse rounded-2xl motion-reduce:animate-none"
                    style={{ background: C.surfaceSunk }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-3.5 w-3/4 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.surfaceSunk }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                      style={{ background: C.surfaceSunk }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          tone={C.red}
          wash={C.redSoft}
          Icon={AlertTriangle}
          titel="Kon opdrachten niet laden"
          tekst="Er ging iets mis met de verbinding. Controleer je internet en probeer het opnieuw."
          cta="Opnieuw proberen"
          onCta={refresh}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          tone={C.accentDeep}
          wash={C.accentSoft}
          Icon={Search}
          titel="Niets gevonden"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord — er komt vast iets langs.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((o) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} onOpen={() => onOpen(o)} />
            </li>
          ))}
        </ul>
      )}

      {/* Kleine demo-schakelaar voor de foutstaat (aantoonbaar aanwezig) */}
      {mode === "ok" && (
        <button
          type="button"
          onClick={() => setMode("error")}
          className="mx-auto mt-2 block rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
          style={{ color: C.inkFaint }}
        >
          Verbindingsfout simuleren
        </button>
      )}
    </div>
  );
}

function StateBlock({
  tone,
  wash,
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  tone: string;
  wash: string;
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-2xl px-6 py-12 text-center"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: wash, color: tone }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[17px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <TapButton onClick={onCta} className="mt-5">
        {cta}
      </TapButton>
    </div>
  );
}

function MarktKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.accent;
  const wash = strong ? C.greenSoft : C.accentSoft;
  return (
    <article
      className="overflow-hidden rounded-2xl"
      style={{ background: C.surface, border: `1px solid ${C.line}` }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="w-full p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6366f1] active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl"
            style={{ background: wash, color: tone }}
            aria-hidden="true"
          >
            <span className="text-[15px] font-bold leading-none" style={{ ...num }}>
              {opdracht.match}
            </span>
            <span className="text-[7.5px] font-bold uppercase tracking-[0.1em]">match</span>
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {opdracht.titel}
            </h3>
            <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <span className="shrink-0 text-[13px] font-bold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
              style={{ background: C.surfaceAlt, color: C.inkSoft }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold"
          style={{ color: C.green }}
        >
          <Check size={13} aria-hidden="true" />
          {opdracht.redenen.plus[0]}
        </div>
      </button>
    </article>
  );
}

// ————————————————————— Opdracht: als volledig scherm én als sheet —————————————————————
function OpdrachtScreen({
  opdracht,
  onOpen,
}: {
  opdracht: Opdracht;
  onOpen: (o: Opdracht) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[12.5px]" style={{ color: C.inkMute }}>
        Aanbevolen opdracht — tik voor de volledige details en verklaarbare match.
      </p>
      <OpdrachtBody opdracht={opdracht} />
      <SectionTitle>Meer opdrachten</SectionTitle>
      <ul className="space-y-2.5">
        {OPDRACHTEN.slice(1).map((o) => (
          <li key={o.id}>
            <OpdrachtRow opdracht={o} onOpen={() => onOpen(o)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtSheet({ opdracht, onClose }: { opdracht: Opdracht; onClose: () => void }) {
  // Sluiten met Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={opdracht.titel}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="zf-scrim absolute inset-0 cursor-default"
        style={{ background: "rgba(11,11,18,0.42)" }}
      />
      <div
        className="zf-sheet relative flex max-h-[86%] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px]"
        style={{ background: C.app, boxShadow: "0 -20px 50px -20px rgba(11,11,18,0.5)" }}
      >
        <div className="flex flex-col items-center pt-2.5" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full" style={{ background: C.line }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-2">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: C.inkMute }}
          >
            Opdrachtdetails
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
            style={{ color: C.inkSoft }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="zf-scroll flex-1 overflow-y-auto px-4 pb-4">
          <OpdrachtBody opdracht={opdracht} />
        </div>
        <div
          className="flex items-center gap-2.5 px-4 pb-5 pt-3"
          style={{ borderTop: `1px solid ${C.line}`, background: C.app }}
        >
          <TapButton variant="ghost" onClick={onClose} className="flex-1">
            Bewaren
          </TapButton>
          <TapButton className="flex-[1.4]">
            Reageer <ArrowRight size={15} aria-hidden="true" />
          </TapButton>
        </div>
      </div>
    </div>
  );
}

function OpdrachtBody({ opdracht }: { opdracht: Opdracht }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.accent;
  const wash = strong ? C.greenSoft : C.accentSoft;
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4"
        style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <Pill ink={tone} wash={wash} Icon={Sparkles}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Pill>
        </div>
        <h1
          className="mt-2 text-[20px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-1 flex items-center gap-1 text-[13px]" style={{ color: C.inkMute }}>
          <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
      </div>

      {/* Feiten-grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-2xl p-3.5"
            style={{ background: C.surface, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[16px] font-bold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-3 py-1 text-[11.5px] font-medium"
            style={{ background: C.surfaceAlt, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Verklaarbare match */}
      <div>
        <SectionTitle>Waarom deze match</SectionTitle>
        <div className="space-y-3">
          <RedenBlok
            titel="In jouw voordeel"
            tone={C.green}
            wash={C.greenSoft}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenBlok
            titel="Goed om te weten"
            tone={C.amber}
            wash={C.amberSoft}
            Icon={AlertTriangle}
            items={opdracht.redenen.min}
          />
        </div>
      </div>
    </div>
  );
}

function RedenBlok({
  titel,
  tone,
  wash,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  wash: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: wash }}
        >
          <Icon size={12} aria-hidden="true" />
        </span>
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <Icon
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ———————————————————————————————— Verificatie ————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-4">
      {/* Vertrouwens-samenvatting */}
      <div
        className="overflow-hidden rounded-3xl p-5"
        style={{
          background: `linear-gradient(135deg, ${C.green} 0%, #0f8a41 100%)`,
          color: "#fff",
          boxShadow: "0 16px 34px -18px rgba(22,163,74,0.8)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vertrouwensniveau
            </span>
            <p className="mt-1.5 text-[22px] font-bold">{PROFIEL.trust}</p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "rgba(255,255,255,0.9)" }}>
              {verified} van {CREDENTIALS.length} certificaten geverifieerd
            </p>
          </div>
          <span
            className="flex h-16 w-16 flex-col items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <span className="text-[20px] font-bold leading-none" style={{ ...num }}>
              {ratio}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-[0.1em]">% ok</span>
          </span>
        </div>
        <div
          className="mt-4 h-2 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.25)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: "#fff",
              transition: "width 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </div>

      {/* Certificaten */}
      <div>
        <SectionTitle>Certificaten</SectionTitle>
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          {CREDENTIALS.map((c, i) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <div key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-[#fafafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6366f1]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: st.wash, color: st.ink }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: st.alarm ? st.ink : C.inkMute }}
                    >
                      {st.label}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-3.5 pb-3.5">
                      <div className="rounded-2xl p-3.5" style={{ background: C.surfaceAlt }}>
                        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                          {c.detail}. Je document wordt versleuteld bewaard en alleen na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <TapButton
                            variant={c.status === "EXPIRING" ? "solid" : "soft"}
                            tone={c.status === "EXPIRING" ? C.amber : C.accent}
                            className="flex-1"
                          >
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </TapButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documentenkast */}
      <div>
        <SectionTitle>Documentenkast</SectionTitle>
        <div className="space-y-2.5">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: C.surfaceAlt, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Pill ink={st.ink} wash={st.wash} Icon={st.Icon}>
                  {st.label}
                </Pill>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-[22px] font-bold tracking-[-0.01em]" style={{ color: C.ink }}>
          Wat vraagt je aandacht
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
          Op volgorde van urgentie — één ding tegelijk.
        </p>
      </div>
      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.accent;
          const wash = warn ? C.amberSoft : C.accentSoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              <div
                className="rounded-2xl p-4"
                style={{
                  background: C.surface,
                  border: `1px solid ${C.line}`,
                  borderLeft: `3px solid ${tone}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: wash, color: tone, ...num }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5">
                      <Pill ink={tone} wash={wash} Icon={warn ? AlertTriangle : Sparkles}>
                        {warn ? "Urgent" : "Aanbevolen"}
                      </Pill>
                    </div>
                    <h2 className="text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
                      {a.titel}
                    </h2>
                    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                      {a.detail}
                    </p>
                    <div className="mt-3">
                      <TapButton
                        variant={warn ? "solid" : "soft"}
                        tone={warn ? C.amber : C.accent}
                        onClick={goMarkt ? onMarkt : undefined}
                        className="w-full"
                      >
                        {a.cta} <ArrowRight size={15} aria-hidden="true" />
                      </TapButton>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Afgeronde-samenvatting */}
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-[12.5px]"
        style={{ background: C.greenSoft, color: C.green }}
      >
        <Check size={15} aria-hidden="true" />
        Je bent bijna bij — nog {ACTIES.length} open, alles onder controle.
      </div>
    </div>
  );
}

// ————————————————————————————————— Facturen —————————————————————————————————
function factuurTone(status: string): { ink: string; wash: string } {
  if (status === "Betaald") return { ink: C.green, wash: C.greenSoft };
  if (status === "Openstaand") return { ink: C.amber, wash: C.amberSoft };
  return { ink: C.inkMute, wash: C.surfaceAlt };
}

function Facturen() {
  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { l: "Betaald", v: "€ 5.552", tone: C.green },
          { l: "Open", v: "€ 1.350", tone: C.amber },
          { l: "Concept", v: "€ 880", tone: C.inkMute },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl p-3.5"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.inkMute }}
            >
              {s.l}
            </p>
            <p
              className="mt-1 text-[15px] font-bold leading-tight"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SectionTitle>Recente facturen</SectionTitle>
        <TapButton variant="soft" className="min-h-[36px] px-3.5 py-1.5 text-[12.5px]">
          <Plus size={14} aria-hidden="true" /> Nieuw
        </TapButton>
      </div>

      <ul className="space-y-2.5">
        {FACTUREN.map((f) => {
          const ft = factuurTone(f.status);
          return (
            <li key={f.nr}>
              <div
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: C.surface, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: ft.wash, color: ft.ink }}
                  aria-hidden="true"
                >
                  <Receipt size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13.5px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {f.klant}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr} · {f.datum}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[14px] font-bold" style={{ color: C.ink, ...num }}>
                    {f.bedrag}
                  </span>
                  <Pill ink={ft.ink} wash={ft.wash}>
                    {f.status}
                  </Pill>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ————————————————————————————— "Meer"-menu (sheet) —————————————————————————————
function MeerSheet({
  current,
  onPick,
  onClose,
}: {
  current: ScreenKey;
  onPick: (s: ScreenKey) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const items: { key: ScreenKey; label: string; sub: string; Icon: LucideIcon }[] = [
    { key: "facturen", label: "Facturen", sub: "Betaald, open & concept", Icon: Receipt },
    { key: "opdracht", label: "Aanbevolen opdracht", sub: "Verklaarbare match", Icon: FileText },
    {
      key: "verificatie",
      label: "Verificatie",
      sub: "Certificaten & documenten",
      Icon: ShieldCheck,
    },
    { key: "dashboard", label: "Dashboard", sub: "Overzicht & berichten", Icon: Home },
  ];

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Meer"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="zf-scrim absolute inset-0 cursor-default"
        style={{ background: "rgba(11,11,18,0.42)" }}
      />
      <div
        className="zf-sheet relative w-full max-w-[420px] overflow-hidden rounded-t-[28px] pb-6"
        style={{ background: C.app, boxShadow: "0 -20px 50px -20px rgba(11,11,18,0.5)" }}
      >
        <div className="flex flex-col items-center pt-2.5" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full" style={{ background: C.line }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-1 pt-2">
          <span className="text-[16px] font-bold" style={{ color: C.ink }}>
            Meer
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
            style={{ color: C.inkSoft }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ul className="px-3 pt-1">
          {items.map((it) => {
            const on = it.key === current;
            return (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => onPick(it.key)}
                  aria-current={on ? "page" : undefined}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#f4f4f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: on ? C.accentSoft : C.surfaceAlt,
                      color: on ? C.accentDeep : C.inkSoft,
                    }}
                    aria-hidden="true"
                  >
                    <it.Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold" style={{ color: C.ink }}>
                      {it.label}
                    </span>
                    <span className="block text-[11.5px]" style={{ color: C.inkMute }}>
                      {it.sub}
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
