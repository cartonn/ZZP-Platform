"use client";

// Concept 514 — "Huiskamer" · Warm-menselijk, gastvrij, tactiel. Papier-/linnenkleuren (crème,
// terracotta, olijf, warm bruin), zachte ronde hoeken, een menselijke toon in microcopy. Vertrouwen
// via warmte en rust, niet via koele techniek — Kinfolk/Airbnb-warmte, maar strak en professioneel.
// Status altijd met label + icoon, nooit enkel kleur. Volledig responsive en toegankelijk.

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
  Coffee,
  Compass,
  FileText,
  Heart,
  Home,
  MapPin,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkle,
  Sun,
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

// ————————————————————————————— Palet — warm papier/linnen + terracotta —————————————————————————————
const C = {
  paper: "#f3ece1",
  linen: "#faf5ec",
  panel: "#fffdf8",
  sink: "#f7f0e4",
  line: "#e6dccb",
  lineSoft: "#efe7d8",
  lineStrong: "#d8cbb4",

  ink: "#33291d",
  inkSoft: "#5a4c3a",
  inkMute: "#8a795f",
  inkFaint: "#a99a80",

  terra: "#c0562f",
  terraDeep: "#a3421f",
  terraSoft: "rgba(192,86,47,0.12)",

  olive: "#6b7040",
  oliveSoft: "rgba(107,112,64,0.14)",
  honey: "#b57d15",
  honeySoft: "rgba(181,125,21,0.15)",
  clay: "#a5553c",
  claySoft: "rgba(165,85,60,0.13)",
  rose: "#b23b4e",
  roseSoft: "rgba(178,59,78,0.12)",
};

const serif: CSSProperties = {
  fontFamily: "'Georgia', 'Iowan Old Style', 'Palatino', 'Times New Roman', serif",
};
const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c0562f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ece1]";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.olive,
        soft: C.oliveSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.honey,
        soft: C.honeySoft,
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.terra,
        soft: C.terraSoft,
        label: "Verloopt bijna",
        Icon: AlertTriangle,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.rose, soft: C.roseSoft, label: "Afgewezen", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.olive, soft: C.oliveSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.honey, soft: C.honeySoft, label: "Openstaand", Icon: Clock };
  if (status === "Concept")
    return { base: C.clay, soft: C.claySoft, label: "Concept", Icon: FileText };
  return { base: C.rose, soft: C.roseSoft, label: status, Icon: AlertTriangle };
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
function Card({
  children,
  className = "",
  as: Tag = "div",
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside" | "li";
  soft?: boolean;
}) {
  return (
    <Tag
      className={`rounded-[18px] ${className}`}
      style={{
        background: soft ? C.sink : C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(51,41,29,0.04)",
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
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad = size === "sm" ? "px-3.5 py-2 text-[12.5px]" : "px-5 py-2.5 text-[13.5px]";
  const base = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 ${RING} ${
    full ? "w-full" : ""
  }`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: C.terra, color: "#fff8ef", border: `1px solid ${C.terraDeep}`, ...sans }
      : variant === "outline"
        ? { background: C.panel, color: C.ink, border: `1px solid ${C.lineStrong}`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover =
    variant === "solid"
      ? "hover:brightness-105 hover:-translate-y-px"
      : variant === "outline"
        ? "hover:bg-[#f7f0e4]"
        : "hover:bg-[#f3ece1]";
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
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ color: base, background: soft, border: `1px solid ${base}30`, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (let op)</span>}
    </span>
  );
}

function Kicker({ children, tone = C.terra }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: tone, ...sans }}
    >
      {children}
    </span>
  );
}

// Warme match-meter als zacht boogje
function MatchDot({ value }: { value: number }) {
  const tone = value >= 90 ? C.olive : value >= 85 ? C.terra : C.honey;
  return (
    <span
      className="inline-flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full"
      style={{ background: `${tone}18`, border: `1.5px solid ${tone}45` }}
      aria-label={`Match ${value} procent`}
    >
      <span className="text-[15px] font-bold leading-none" style={{ color: tone, ...serif }}>
        {value}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-[0.1em]" style={{ color: tone }}>
        match
      </span>
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
        <Kicker tone={C.terra}>
          <Sun size={13} aria-hidden="true" />
          {kicker}
        </Kicker>
        <h1
          className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.01em] md:text-[30px]"
          style={{ color: C.ink, ...serif }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkMute }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: Home,
  marktplaats: Compass,
  opdracht: Briefcase,
  verificatie: Award,
  acties: Heart,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept514() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [selId, setSelId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === selId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id: string) => {
    setSelId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto flex max-w-6xl">
        <Sidebar screen={screen} setScreen={setScreen} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <MobileNav screen={screen} setScreen={setScreen} />
          <main key={screen} className="hk-fade px-4 pb-24 pt-6 sm:px-6 md:px-8">
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
        @keyframes hkFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .hk-fade { animation: hkFade 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .hk-row { transition: background 0.2s ease, transform 0.2s ease; }
        .hk-row:hover { background: ${C.sink}; }
        @media (prefers-reduced-motion: reduce) {
          .hk-fade { animation: none !important; }
          .hk-row { transition: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Sidebar ——————————————————————————————————————
function Sidebar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col md:flex"
      style={{ background: C.linen, borderRight: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3 px-6 py-6">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[13px]"
          style={{ background: C.terra, color: "#fff8ef" }}
          aria-hidden="true"
        >
          <Coffee size={20} />
        </span>
        <span>
          <span
            className="block text-[16px] font-bold leading-none"
            style={{ color: C.ink, ...serif }}
          >
            Huiskamer
          </span>
          <span className="mt-1 block text-[11px]" style={{ color: C.inkMute }}>
            jouw werkplek
          </span>
        </span>
      </div>

      <nav aria-label="Hoofdnavigatie" className="flex-1 overflow-y-auto px-3.5 py-2">
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
                  className={`flex w-full items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-left text-[14px] font-semibold transition-colors ${RING}`}
                  style={on ? { background: C.terra, color: "#fff8ef" } : { color: C.inkSoft }}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    style={{ color: on ? "#fff8ef" : C.inkMute }}
                  />
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 py-5">
        <Card soft className="flex items-center gap-3 p-3.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: C.olive, color: "#fff8ef", ...serif }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: C.olive }}>
              <ShieldCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
            </span>
          </span>
        </Card>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 sm:px-6 md:px-8"
      style={{
        background: `${C.paper}f0`,
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.inkMute }} />
        <span className="text-[13px]" style={{ color: C.inkMute }}>
          Zoek een opdracht, document of bericht…
        </span>
      </div>
      <span
        className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold sm:inline-flex"
        style={{
          background: C.oliveSoft,
          color: C.olive,
          border: `1px solid ${C.olive}28`,
          ...sans,
        }}
      >
        <Sparkle size={13} aria-hidden="true" /> Fijn dat je er bent
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
      style={{ borderBottom: `1px solid ${C.line}`, background: C.linen }}
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
                ? { background: C.terra, color: "#fff8ef" }
                : { color: C.inkSoft, background: C.sink }
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
        kicker="Goedemorgen"
        title={`Welkom terug, ${PROFIEL.naam.split(" ")[0]}.`}
        sub="Zet je koffie klaar — dit is wat er vandaag rustig op je wacht."
        right={
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={onFacturen}>
              <Receipt size={14} aria-hidden="true" /> Facturen
            </Btn>
            <Btn variant="solid" size="sm" onClick={onActies}>
              Vandaag <ArrowRight size={14} aria-hidden="true" />
            </Btn>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-5">
            <p className="text-[12px] font-semibold" style={{ color: C.inkMute }}>
              {k.label}
            </p>
            <p
              className="mt-2 text-[28px] font-bold leading-none tracking-[-0.01em]"
              style={{ color: C.ink, ...serif }}
            >
              {k.value}
            </p>
            <span
              className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
              style={{
                color: k.up ? C.olive : C.honey,
                background: k.up ? C.oliveSoft : C.honeySoft,
              }}
            >
              {k.up ? (
                <ArrowRight size={12} className="-rotate-45" aria-hidden="true" />
              ) : (
                <ArrowRight size={12} className="rotate-45" aria-hidden="true" />
              )}
              {k.trend}
            </span>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <Kicker tone={C.terra}>
              <Briefcase size={13} aria-hidden="true" /> Opdrachten voor jou
            </Kicker>
            <button
              type="button"
              onClick={onMarkt}
              className={`rounded-full text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.terra }}
            >
              Alles bekijken →
            </button>
          </div>
          <ul>
            {OPDRACHTEN.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={`hk-row flex w-full items-center gap-4 px-5 py-4 text-left ${RING}`}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <MatchDot value={o.match} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold" style={{ color: C.ink }}>
                      {o.titel}
                    </span>
                    <span
                      className="mt-0.5 flex items-center gap-1 truncate text-[12.5px]"
                      style={{ color: C.inkMute }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right sm:block">
                    <span
                      className="block text-[14px] font-bold"
                      style={{ color: C.ink, ...serif }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <span className="text-[10.5px]" style={{ color: C.inkFaint }}>
                      per uur
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-6" soft>
            <Kicker tone={C.olive}>
              <ShieldCheck size={13} aria-hidden="true" /> Jouw dossier
            </Kicker>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-[38px] font-bold leading-none"
                style={{ color: C.ink, ...serif }}
              >
                {ratio}%
              </span>
              <span className="text-[13px]" style={{ color: C.inkMute }}>
                op orde
              </span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van je {CREDENTIALS.length} certificaten zijn geverifieerd. Je straalt{" "}
              {PROFIEL.trust.toLowerCase()} uit.
            </p>
          </Card>

          <Card className="p-6" as="article">
            <Kicker tone={C.terra}>
              <AlertTriangle size={13} aria-hidden="true" /> Even aandacht
            </Kicker>
            <h3
              className="mt-2 text-[16px] font-bold leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <Btn variant="solid" size="sm" full className="mt-4" onClick={onActies}>
              {primair.cta} <ArrowRight size={13} aria-hidden="true" />
            </Btn>
          </Card>
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
        sub={`We vonden ${rows.length} plek${rows.length === 1 ? "" : "ken"} die aansluiten op je geverifieerde profiel.`}
      />

      <Card soft className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a99a80]"
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
      </Card>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Card className="space-y-3 p-6">
                <div
                  className="h-5 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
                <div
                  className="h-3.5 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.lineSoft }}
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : empty ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ color: C.terra, background: C.terraSoft, border: `1px solid ${C.terra}30` }}
            aria-hidden="true"
          >
            <Compass size={28} />
          </span>
          <p className="mt-4 text-[19px] font-bold" style={{ color: C.ink, ...serif }}>
            Nog even niets gevonden
          </p>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Er staat op dit moment geen opdracht voor {q ? `“${q}”` : "je zoekterm"}. Verruim je
            zoekopdracht — er komt vast iets moois voorbij.
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
        </Card>
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
    <Card as="article" className="overflow-hidden">
      <div
        className="flex items-start gap-4 p-5"
        style={selected ? { boxShadow: `inset 3px 0 0 ${C.terra}` } : undefined}
      >
        <MatchDot value={opdracht.match} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-bold leading-snug" style={{ color: C.ink, ...serif }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.start}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
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
          <span className="block text-[17px] font-bold" style={{ color: C.ink, ...serif }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[10.5px]" style={{ color: C.inkFaint }}>
            per uur
          </span>
        </span>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 px-5 py-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, background: C.sink }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold ${RING}`}
          style={{ color: C.terra }}
        >
          {open ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          Waarom deze past
        </button>
        <div className="ml-auto">
          <Btn variant="solid" size="sm" onClick={() => onOpen(opdracht.id)}>
            Bekijken <ArrowRight size={13} aria-hidden="true" />
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
              tone={C.olive}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.honey}
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
        className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13.5px] leading-snug"
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
    { l: "Aanvang", v: opdracht.start, s: "startdatum" },
    { l: "Match", v: `${opdracht.match}%`, s: "op profiel" },
  ];
  return (
    <div className="space-y-5">
      <Btn variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar de marktplaats
      </Btn>

      <Card className="overflow-hidden">
        <div
          className="p-6 md:p-8"
          style={{ background: `linear-gradient(135deg, ${C.terraSoft}, transparent 60%)` }}
        >
          <div className="flex items-center gap-2">
            <MatchDot value={opdracht.match} />
            <span
              className="text-[12.5px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.terra }}
            >
              {opdracht.match >= 90 ? "Sterke match" : "Goede match"}
            </span>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[27px] font-bold leading-[1.15] md:text-[32px]"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[14px]" style={{ color: C.inkMute }}>
            <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                style={{ background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Btn variant="solid">
              Ik heb interesse <ArrowRight size={14} aria-hidden="true" />
            </Btn>
            <Btn variant="outline">Later bewaren</Btn>
          </div>
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-4"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          {feiten.map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderRight: i < 3 ? `1px solid ${C.lineSoft}` : "none",
                borderTop: i >= 2 ? `1px solid ${C.lineSoft}` : "none",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: C.inkMute }}
              >
                {m.l}
              </p>
              <p
                className="mt-1.5 text-[19px] font-bold leading-none"
                style={{ color: C.ink, ...serif }}
              >
                {m.v}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: C.inkFaint }}>
                {m.s}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <Kicker tone={C.terra}>
          <Heart size={13} aria-hidden="true" /> Waarom we deze bij je brachten
        </Kicker>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — navolgbaar, zonder verborgen score. Wat in je
          voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.olive }}
            >
              <Check size={14} aria-hidden="true" /> In je voordeel
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.olive }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.honey }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[14px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.honey }}
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

// —————————————————————————————————————— Verificatie ——————————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vertrouwen"
        title="Jouw certificaten"
        sub={`${verified} van de ${CREDENTIALS.length} zijn geverifieerd. Alles wordt versleuteld bewaard.`}
        right={
          <Card soft className="px-5 py-3 text-center">
            <p className="text-[30px] font-bold leading-none" style={{ color: C.olive, ...serif }}>
              {ratio}%
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.inkMute }}
            >
              op orde
            </p>
          </Card>
        }
      />

      <Card className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3.5 px-5 py-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[14.5px] font-bold"
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
                      className="px-5 pb-5 sm:pl-[74px]"
                      style={{ borderTop: `1px solid ${C.lineSoft}`, paddingTop: 14 }}
                    >
                      <span className="mb-2 inline-flex sm:hidden">
                        <StatusTag {...t} />
                      </span>
                      <p
                        className="max-w-xl text-[13px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Dit document wordt veilig en versleuteld bewaard, en alleen na
                        jouw eigen toestemming gedeeld met een opdrachtgever.
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
                          Geschiedenis
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onMarkt, onFacturen }: { onMarkt: () => void; onFacturen: () => void }) {
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Vandaag"
        title="Wat rustig op je wacht"
        sub="Van boven naar beneden — neem het in je eigen tempo."
      />
      <ol className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.terra : C.honey;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          return (
            <li key={a.titel}>
              <Card className="flex items-start gap-4 p-5 md:p-6">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold"
                  style={{
                    background: `${tone}18`,
                    color: tone,
                    border: `1px solid ${tone}33`,
                    ...serif,
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
                    {warn ? "Vraagt aandacht" : "Aanrader"}
                  </Kicker>
                  <h2
                    className="mt-1.5 text-[16.5px] font-bold leading-snug"
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
                  <div className="mt-3.5">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : goFacturen ? onFacturen : undefined}
                    >
                      {a.cta} <ArrowRight size={13} aria-hidden="true" />
                    </Btn>
                  </div>
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
  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);
  return (
    <div className="space-y-5">
      <ScreenHead
        kicker="Facturen"
        title="Je huishoudboekje"
        sub="Een rustig overzicht van wat binnenkwam en wat nog onderweg is."
        right={
          <Btn variant="solid" size="sm">
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </Btn>
        }
      />

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {[
          {
            l: "Ontvangen",
            v: totals.betaald,
            sub: "2 facturen betaald",
            tone: C.olive,
            Icon: Check,
          },
          {
            l: "Onderweg",
            v: totals.open,
            sub: "1 factuur openstaand",
            tone: C.honey,
            Icon: Clock,
          },
          {
            l: "Concept",
            v: totals.concept,
            sub: "klaar om te versturen",
            tone: C.clay,
            Icon: FileText,
          },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: C.inkMute }}>
                {s.l}
              </p>
              <s.Icon size={15} aria-hidden="true" style={{ color: s.tone }} />
            </div>
            <p
              className="mt-1.5 text-[24px] font-bold leading-none"
              style={{ color: s.tone, ...serif }}
            >
              {eur0.format(s.v)}
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 520 }}>
            <caption className="sr-only">Overzicht van facturen</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] ${i === 3 ? "text-right" : ""}`}
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
                    className="hk-row"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[13px] font-semibold"
                      style={{ color: C.inkSoft, ...serif }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[14px] font-bold" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="px-5 py-4 text-[13px]" style={{ color: C.inkMute }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[14px] font-bold"
                      style={{ color: C.ink, ...serif }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4">
                      <StatusTag {...t} alarm={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
