"use client";

// Concept 540 — "Duimzone" · Mobiel-first / thumb-zone. Het hele platform als één-hand-app:
// een smalle, gecentreerde mobiele kolom (op desktop in een device-frame), met alle primaire
// navigatie in een onder-balk binnen duimbereik, een swipebare kaartstapel voor de marktplaats,
// grote raakvlakken en een bottom-sheet voor detail. Volledig responsive — mobiel is de hoofdvorm.

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  Banknote,
  Bell,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Hourglass,
  LayoutGrid,
  ListChecks,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
  Sparkles,
  Store,
  ThumbsUp,
  TriangleAlert,
  Undo2,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";
import {
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

// ————————————————————————————— Palet — helder mobiel ——————————————————————————————
const C = {
  stage: "#0d1117", // achtergrond achter het toestel
  frame: "#1c2230", // toestel-frame
  screen: "#ffffff", // scherm
  surface: "#f5f6fa", // zacht vlak
  surfaceAlt: "#eef0f6",
  line: "#e4e7ef",
  lineSoft: "#eef0f6",
  ink: "#131722",
  inkSoft: "#3a4152",
  inkMute: "#727a8c",
  inkFaint: "#a2a9b8",
  accent: "#5b5bf6", // levendig indigo/violet
  accentDeep: "#4141d6",
  accentSoft: "#ecebfe",
  green: "#12a56a",
  greenSoft: "#dff4ea",
  amber: "#c47b0a",
  amberSoft: "#fbeed2",
  red: "#d64545",
  redSoft: "#fbe3e3",
  blue: "#2b7fd4",
  blueSoft: "#e0eefb",
};

const sans: CSSProperties = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const mono: CSSProperties = {
  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', 'Consolas', monospace",
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: "'tnum' 1",
};
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b5bf6] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

// ————————————————————————————— Status-taal (label + icoon) —————————————————————————————
type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.green,
        soft: C.greenSoft,
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.blue,
        soft: C.blueSoft,
        label: "In beoordeling",
        Icon: Hourglass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.amber,
        soft: C.amberSoft,
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return { base: C.red, soft: C.redSoft, label: "Afgekeurd", Icon: X, alarm: true };
  }
}

function factuurTone(status: string): {
  base: string;
  soft: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "Betaald")
    return { base: C.green, soft: C.greenSoft, label: "Betaald", Icon: Check };
  if (status === "Openstaand")
    return { base: C.amber, soft: C.amberSoft, label: "Openstaand", Icon: Clock };
  return { base: C.blue, soft: C.blueSoft, label: "Concept", Icon: FileText };
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

// ————————————————————————————— Onder-navigatie (thumb-zone) —————————————————————————————
type TabKey = Exclude<ScreenKey, "opdracht" | "documenten" | "berichten">;
const TABS: { key: TabKey; label: string; Icon: LucideIcon }[] = [
  { key: "dashboard", label: "Start", Icon: LayoutGrid },
  { key: "marktplaats", label: "Markt", Icon: Store },
  { key: "verificatie", label: "Dossier", Icon: ShieldCheck },
  { key: "acties", label: "Acties", Icon: ListChecks },
  { key: "facturen", label: "Facturen", Icon: Receipt },
];

// ————————————————————————————— Primitives —————————————————————————————
function Card({
  children,
  className = "",
  as: Tag = "div",
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  onClick?: () => void;
  ariaLabel?: string;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`dz-press w-full rounded-3xl text-left ${RING} ${className}`}
        style={{
          background: C.screen,
          border: `1px solid ${C.line}`,
          boxShadow: "0 1px 2px rgba(19,23,34,0.04)",
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <Tag
      className={`rounded-3xl ${className}`}
      style={{
        background: C.screen,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(19,23,34,0.04)",
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
  tone = C.accent,
  ariaLabel,
  ariaExpanded,
  full = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  tone?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  full?: boolean;
}) {
  const pad =
    size === "sm"
      ? "px-3.5 py-2 text-[13px]"
      : size === "lg"
        ? "px-5 py-3.5 text-[15px]"
        : "px-4 py-3 text-[14px]";
  const base = `dz-press inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[-0.01em] transition-all ${RING} ${full ? "w-full" : ""}`;
  const style: CSSProperties =
    variant === "solid"
      ? { background: tone, color: "#ffffff", border: `1px solid ${tone}`, ...sans }
      : variant === "outline"
        ? { background: C.screen, color: tone, border: `1.5px solid ${tone}44`, ...sans }
        : { background: "transparent", color: C.inkSoft, border: "1px solid transparent", ...sans };
  const hover = variant === "solid" ? "hover:brightness-105" : "hover:bg-[#f5f6fa]";
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
      style={{ color: base, background: soft, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (aandacht vereist)</span>}
    </span>
  );
}

function MatchDonut({ value, tone, size = 44 }: { value: number; tone: string; size?: number }) {
  const stroke = size >= 60 ? 5 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const cx = size / 2;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Match ${value} procent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.surfaceAlt} strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{ color: tone, fontSize: size >= 60 ? 15 : 12, ...mono }}
      >
        {value}
      </span>
    </span>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 20 - ((d - min) / span) * 18;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width="60" height="22" viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2
        className="text-[13px] font-bold uppercase tracking-[0.08em]"
        style={{ color: C.inkMute }}
      >
        {title}
      </h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className={`inline-flex items-center gap-0.5 rounded-lg px-1 text-[12.5px] font-semibold ${RING}`}
          style={{ color: C.accent }}
        >
          {action} <ChevronRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// —————————————————————————————————————— Root ——————————————————————————————————————
export function Concept540() {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [sheet, setSheet] = useState<Opdracht | null>(null);

  const openOpdracht = (o: Opdracht) => setSheet(o);

  return (
    <div
      className="flex min-h-[760px] w-full items-center justify-center px-3 py-6 antialiased sm:px-6 sm:py-10"
      style={{
        ...sans,
        color: C.ink,
        background: `radial-gradient(120% 80% at 50% -10%, #1b2436 0%, ${C.stage} 55%)`,
      }}
    >
      <div className="flex w-full max-w-[430px] flex-col items-center">
        {/* Device-frame — op desktop een toestel, op mobiel schermvullend */}
        <div
          className="relative w-full overflow-hidden rounded-[42px] p-2 shadow-2xl sm:rounded-[46px]"
          style={{ background: C.frame }}
        >
          <div
            className="relative flex h-[720px] flex-col overflow-hidden rounded-[36px]"
            style={{ background: C.screen }}
          >
            {/* Status-/appbalk */}
            <PhoneStatusBar />
            <AppBar tab={tab} />

            {/* Schermgebied (scrollt) */}
            <main
              key={tab}
              className="dz-fade relative flex-1 overflow-y-auto px-4 pb-6 pt-3"
              style={{ background: C.surface }}
            >
              {tab === "dashboard" && <Dashboard onTab={setTab} onOpen={openOpdracht} />}
              {tab === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
              {tab === "verificatie" && <Verificatie />}
              {tab === "acties" && <Acties onTab={setTab} />}
              {tab === "facturen" && <Facturen />}
            </main>

            {/* Onder-navigatie binnen duimbereik */}
            <BottomNav tab={tab} setTab={setTab} />

            {/* Bottom-sheet voor detail */}
            {sheet && <OpdrachtSheet opdracht={sheet} onClose={() => setSheet(null)} />}
          </div>
        </div>

        <p
          className="mt-4 flex items-center gap-2 text-center text-[12px] font-medium"
          style={{ color: "#8b93a5" }}
        >
          <Smartphone size={13} aria-hidden="true" />
          Ontworpen voor één hand — schaalt mee van telefoon tot desktop.
        </p>
      </div>

      <style>{`
        @keyframes dzFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .dz-fade { animation: dzFade 0.3s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes dzSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .dz-sheet { animation: dzSheet 0.34s cubic-bezier(0.22,1,0.36,1) both; }
        .dz-press { transition: transform 0.12s ease, background 0.16s ease, filter 0.16s ease; }
        .dz-press:active { transform: scale(0.975); }
        @media (prefers-reduced-motion: reduce) {
          .dz-fade, .dz-sheet { animation: none !important; }
          .dz-press { transition: none !important; }
          .dz-press:active { transform: none !important; }
        }
      `}</style>
    </div>
  );
}

// —————————————————————————————————————— Chrome ——————————————————————————————————————
function PhoneStatusBar() {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-6 pb-1 pt-2.5 text-[11px] font-semibold"
      style={{ background: C.screen, color: C.ink, ...mono }}
      aria-hidden="true"
    >
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <Wifi size={13} />
        <span
          className="inline-flex h-3 w-6 items-center rounded-[3px] px-[2px]"
          style={{ border: `1px solid ${C.inkMute}` }}
        >
          <span className="h-[6px] w-full rounded-[1px]" style={{ background: C.green }} />
        </span>
      </span>
    </div>
  );
}

function AppBar({ tab }: { tab: TabKey }) {
  const titel = TABS.find((t) => t.key === tab)?.label ?? "Start";
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header
      className="flex shrink-0 items-center gap-3 px-4 py-3"
      style={{ background: C.screen, borderBottom: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-2xl text-[13px] font-bold"
        style={{ background: C.accentSoft, color: C.accentDeep, ...mono }}
        aria-hidden="true"
      >
        {PROFIEL.initialen}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold" style={{ color: C.inkMute }}>
          {tab === "dashboard" ? `Hoi, ${PROFIEL.naam.split(" ")[0]}` : "Duimzone"}
        </span>
        <span
          className="block truncate text-[16px] font-bold leading-tight tracking-[-0.01em]"
          style={{ color: C.ink }}
        >
          {titel}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Meldingen, ${ongelezen} ongelezen`}
        className={`relative flex h-10 w-10 items-center justify-center rounded-2xl ${RING}`}
        style={{ background: C.surface, color: C.inkSoft }}
      >
        <Bell size={18} aria-hidden="true" />
        {ongelezen > 0 && (
          <span
            className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ background: C.red, ...mono }}
          >
            {ongelezen}
          </span>
        )}
      </button>
    </header>
  );
}

function BottomNav({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  return (
    <nav
      aria-label="Hoofdnavigatie"
      className="shrink-0 px-2 pb-3 pt-2"
      style={{ background: C.screen, borderTop: `1px solid ${C.line}` }}
    >
      <ul className="flex items-stretch justify-between">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <li key={t.key} className="flex-1">
              <button
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={on ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 ${RING}`}
              >
                <span
                  className="flex h-9 w-full max-w-[60px] items-center justify-center rounded-full transition-colors"
                  style={{
                    background: on ? C.accentSoft : "transparent",
                    color: on ? C.accentDeep : C.inkMute,
                  }}
                >
                  <t.Icon size={20} aria-hidden="true" strokeWidth={on ? 2.4 : 2} />
                </span>
                <span
                  className="text-[10.5px] font-semibold leading-none"
                  style={{ color: on ? C.accentDeep : C.inkMute }}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div
        className="mx-auto mt-2 h-1 w-28 rounded-full"
        style={{ background: C.surfaceAlt }}
        aria-hidden="true"
      />
    </nav>
  );
}

// —————————————————————————————————————— Dashboard ——————————————————————————————————————
function Dashboard({
  onTab,
  onOpen,
}: {
  onTab: (t: TabKey) => void;
  onOpen: (o: Opdracht) => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const top = [...OPDRACHTEN].sort((a, b) => b.match - a.match).slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Actie-hero binnen duimbereik */}
      <Card as="article" className="overflow-hidden">
        <div className="flex items-start gap-3 p-4" style={{ background: C.amberSoft }}>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "#ffffff", color: C.amber }}
            aria-hidden="true"
          >
            <TriangleAlert size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <span
              className="text-[11px] font-bold uppercase tracking-[0.08em]"
              style={{ color: C.amber }}
            >
              Actie nodig
            </span>
            <h3 className="mt-0.5 text-[15px] font-bold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <Btn
            variant="solid"
            size="lg"
            tone={C.amber}
            full
            className="mt-3"
            onClick={() => onTab("acties")}
          >
            {primair.cta} <ArrowRight size={16} aria-hidden="true" />
          </Btn>
        </div>
      </Card>

      {/* KPI's — 2 kolommen, groot leesbaar */}
      <section>
        <SectionHead title="Deze maand" />
        <div className="grid grid-cols-2 gap-3">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-3.5">
              <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
                {k.label}
              </p>
              <div className="mt-1 flex items-end justify-between gap-1">
                <p
                  className="text-[22px] font-bold leading-none tracking-[-0.02em]"
                  style={{ color: C.ink, ...mono }}
                >
                  {k.value}
                </p>
                <Sparkline data={k.spark} tone={k.up ? C.accent : C.amber} />
              </div>
              <span
                className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                style={{
                  color: k.up ? C.green : C.amber,
                  background: k.up ? C.greenSoft : C.amberSoft,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* Vertrouwensniveau */}
      <Card
        as="article"
        className="p-4"
        onClick={() => onTab("verificatie")}
        ariaLabel="Open je dossier"
      >
        <div className="flex items-center gap-3">
          <MatchDonut value={ratio} tone={C.green} size={56} />
          <div className="min-w-0 flex-1">
            <span
              className="flex items-center gap-1.5 text-[13px] font-bold"
              style={{ color: C.ink }}
            >
              <ShieldCheck size={15} aria-hidden="true" style={{ color: C.green }} />{" "}
              {PROFIEL.trust}
            </span>
            <p className="mt-0.5 text-[12px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd
            </p>
          </div>
          <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
        </div>
      </Card>

      {/* Beste matches */}
      <section>
        <SectionHead title="Beste matches" action="Alles" onAction={() => onTab("marktplaats")} />
        <ul className="space-y-3">
          {top.map((o) => {
            const strong = o.match >= 90;
            const tone = strong ? C.green : C.accent;
            return (
              <li key={o.id}>
                <Card
                  as="article"
                  onClick={() => onOpen(o)}
                  ariaLabel={`Open ${o.titel}`}
                  className="p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <MatchDonut value={o.match} tone={tone} />
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-[14px] font-bold leading-snug"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </h3>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.plaats} ·{" "}
                        {o.tarief.replace(" / uur", "")}/u
                      </p>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" style={{ color: C.inkFaint }} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// —————————————————————————————————————— Marktplaats (swipe-stapel) ——————————————————————————————————————
type Mode = "ok" | "loading" | "empty";

function Marktplaats({ onOpen }: { onOpen: (o: Opdracht) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("ok");

  const rows = useMemo(() => {
    const n = q.toLowerCase().trim();
    return OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    ).sort((a, b) => b.match - a.match);
  }, [q]);

  const safeIdx = Math.min(idx, Math.max(0, rows.length - 1));
  const current = rows[safeIdx];

  const next = () => setIdx((i) => Math.min(i + 1, rows.length - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  return (
    <div className="space-y-4">
      {/* Zoek */}
      <div
        className="flex items-center gap-2 rounded-2xl px-3.5 py-3"
        style={{ background: C.screen, border: `1px solid ${C.line}` }}
      >
        <Search size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          placeholder="Zoek opdracht of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a2a9b8]"
          style={{ color: C.ink }}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Zoekopdracht wissen"
            className={`flex h-6 w-6 items-center justify-center rounded-lg ${RING}`}
            style={{ color: C.inkMute, background: C.surface }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {mode === "loading" ? (
        <div
          className="rounded-3xl p-5"
          style={{ background: C.screen, border: `1px solid ${C.line}` }}
          aria-hidden="true"
        >
          <div
            className="mx-auto h-14 w-14 animate-pulse rounded-full motion-reduce:animate-none"
            style={{ background: C.surfaceAlt }}
          />
          <div
            className="mx-auto mt-4 h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
            style={{ background: C.surfaceAlt }}
          />
          <div
            className="mx-auto mt-2 h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
            style={{ background: C.surfaceAlt }}
          />
        </div>
      ) : mode === "empty" || rows.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Geen opdracht gevonden"
          tekst={
            q
              ? `Niets voor “${q}”. Probeer een andere zoekterm.`
              : "Er zijn nu geen opdrachten die aansluiten op je profiel."
          }
          cta={q ? "Zoekopdracht wissen" : "Opnieuw laden"}
          onCta={() => {
            setQ("");
            setMode("ok");
          }}
        />
      ) : (
        current && (
          <>
            {/* Kaartstapel-gevoel */}
            <div className="relative">
              <div
                className="absolute -left-1.5 right-1.5 top-2 h-full rounded-3xl"
                style={{ background: C.surfaceAlt, opacity: 0.6 }}
                aria-hidden="true"
              />
              <div
                className="absolute -left-0.5 right-0.5 top-1 h-full rounded-3xl"
                style={{ background: C.lineSoft }}
                aria-hidden="true"
              />
              <SwipeKaart opdracht={current} onOpen={() => onOpen(current)} />
            </div>

            {/* Stapel-indicator + tellers */}
            <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
              {rows.map((o, i) => (
                <span
                  key={o.id}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === safeIdx ? 20 : 6,
                    background: i === safeIdx ? C.accent : C.surfaceAlt,
                  }}
                />
              ))}
            </div>
            <p className="text-center text-[12px] font-medium" style={{ color: C.inkMute }}>
              Kaart {safeIdx + 1} van {rows.length}
            </p>

            {/* Grote duim-knoppen */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
              <Btn
                variant="outline"
                size="lg"
                tone={C.inkMute}
                onClick={prev}
                full
                ariaLabel="Vorige kaart"
              >
                <Undo2 size={18} aria-hidden="true" /> Terug
              </Btn>
              <button
                type="button"
                onClick={() => onOpen(current)}
                aria-label="Bekijk opdracht"
                className={`dz-press flex h-14 w-14 items-center justify-center rounded-full text-white ${RING}`}
                style={{ background: C.accent, boxShadow: `0 8px 20px -6px ${C.accent}` }}
              >
                <ThumbsUp size={22} aria-hidden="true" />
              </button>
              <Btn
                variant="outline"
                size="lg"
                tone={C.accent}
                onClick={next}
                full
                ariaLabel="Volgende kaart"
              >
                Volgende <ArrowRight size={18} aria-hidden="true" />
              </Btn>
            </div>
          </>
        )
      )}

      {/* Statussen-demoschakelaar */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "empty"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className={`rounded text-[10px] font-bold uppercase tracking-[0.14em] underline-offset-2 hover:underline ${RING}`}
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "legestaat"}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwipeKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.accent;
  return (
    <article
      className="relative rounded-3xl p-5"
      style={{
        background: C.screen,
        border: `1px solid ${C.line}`,
        boxShadow: "0 12px 30px -18px rgba(19,23,34,0.3)",
      }}
    >
      <div className="flex items-start gap-3.5">
        <MatchDonut value={opdracht.match} tone={tone} size={62} />
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
            style={{ color: tone, background: strong ? C.greenSoft : C.accentSoft }}
          >
            <Sparkles size={11} aria-hidden="true" /> {strong ? "Topmatch" : "Sterke match"}
          </span>
          <h3
            className="mt-1.5 text-[17px] font-bold leading-snug tracking-[-0.01em]"
            style={{ color: C.ink }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[12.5px]" style={{ color: C.inkMute }}>
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Uren", v: opdracht.uren.replace(" u/week", " u") },
          { l: "Start", v: opdracht.start.replace("Per ", "") },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-2xl px-2.5 py-2 text-center"
            style={{ background: C.surface }}
          >
            <p
              className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.inkFaint }}
            >
              {m.l}
            </p>
            <p className="mt-0.5 text-[13px] font-bold" style={{ color: C.ink, ...mono }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
            style={{ background: C.surfaceAlt, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Waarom deze match — compacte redenen */}
      <div className="mt-4 space-y-2">
        {opdracht.redenen.plus.slice(0, 2).map((r) => (
          <p
            key={r}
            className="flex items-start gap-2 text-[12.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <Check
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: C.green }}
            />{" "}
            {r}
          </p>
        ))}
        {opdracht.redenen.min.slice(0, 1).map((r) => (
          <p
            key={r}
            className="flex items-start gap-2 text-[12.5px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            <TriangleAlert
              size={15}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: C.amber }}
            />{" "}
            {r}
          </p>
        ))}
      </div>

      <Btn variant="solid" size="lg" full className="mt-4" onClick={onOpen}>
        Bekijk & reageer <ArrowRight size={16} aria-hidden="true" />
      </Btn>
    </article>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-3xl px-6 py-12 text-center"
      style={{ background: C.screen, border: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{ background: C.surface, color: C.inkMute }}
        aria-hidden="true"
      >
        <Icon size={26} />
      </span>
      <p className="mt-4 text-[17px] font-bold" style={{ color: C.ink }}>
        {titel}
      </p>
      <p className="mt-1.5 max-w-[15rem] text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-5" onClick={onCta}>
        <RotateCcw size={15} aria-hidden="true" /> {cta}
      </Btn>
    </div>
  );
}

// —————————————————————————————————————— Bottom-sheet: opdracht ——————————————————————————————————————
function OpdrachtSheet({ opdracht, onClose }: { opdracht: Opdracht; onClose: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? C.green : C.accent;
  const vereist = CREDENTIALS.slice(0, 3);
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(19,23,34,0.42)" }}
      />
      <div
        className="dz-sheet relative flex max-h-[88%] flex-col overflow-hidden rounded-t-[32px]"
        style={{ background: C.screen, boxShadow: "0 -12px 40px -12px rgba(19,23,34,0.4)" }}
        role="dialog"
        aria-modal="true"
        aria-label={opdracht.titel}
      >
        {/* Greep + sluit */}
        <div className="shrink-0 pt-3">
          <div
            className="mx-auto h-1.5 w-12 rounded-full"
            style={{ background: C.surfaceAlt }}
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
            <div className="min-w-0">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.inkFaint, ...mono }}
              >
                {opdracht.id}
              </span>
              <h2
                className="mt-0.5 text-[19px] font-bold leading-tight tracking-[-0.01em]"
                style={{ color: C.ink }}
              >
                {opdracht.titel}
              </h2>
              <p
                className="mt-1 flex items-center gap-1 text-[12.5px]"
                style={{ color: C.inkMute }}
              >
                <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Sluiten"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${RING}`}
              style={{ background: C.surface, color: C.inkSoft }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" style={{ background: C.surface }}>
          {/* Match + feiten */}
          <div
            className="mt-4 flex items-center gap-3 rounded-3xl p-4"
            style={{ background: C.screen, border: `1px solid ${C.line}` }}
          >
            <MatchDonut value={opdracht.match} tone={tone} size={62} />
            <div className="grid flex-1 grid-cols-3 gap-2">
              {[
                { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
                { l: "Uren", v: opdracht.uren.replace(" u/week", " u") },
                { l: "Start", v: opdracht.start.replace("Per ", "") },
              ].map((m) => (
                <div key={m.l}>
                  <p
                    className="text-[9.5px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: C.inkFaint }}
                  >
                    {m.l}
                  </p>
                  <p className="mt-0.5 text-[13px] font-bold" style={{ color: C.ink, ...mono }}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Redenen */}
          <div
            className="mt-3 rounded-3xl p-4"
            style={{ background: C.screen, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em]"
              style={{ color: C.inkMute }}
            >
              <ListChecks size={13} aria-hidden="true" /> Waarom deze match
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />{" "}
                  {r}
                </li>
              ))}
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] leading-snug"
                  style={{ color: C.inkSoft }}
                >
                  <TriangleAlert
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />{" "}
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Vereiste certificaten */}
          <div
            className="mt-3 rounded-3xl p-4"
            style={{ background: C.screen, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.06em]"
              style={{ color: C.inkMute }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Vereiste certificaten
            </p>
            <ul className="mt-3 space-y-2">
              {vereist.map((c) => {
                const t = credTone(c.status);
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={15} />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[13px] font-semibold"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusTag {...t} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Vaste CTA-balk binnen duimbereik */}
        <div
          className="shrink-0 px-5 pb-5 pt-3"
          style={{ background: C.screen, borderTop: `1px solid ${C.line}` }}
        >
          <div className="flex gap-2.5">
            <Btn variant="outline" size="lg" ariaLabel="Bewaren">
              <Plus size={18} aria-hidden="true" />
            </Btn>
            <Btn variant="solid" size="lg" full onClick={onClose}>
              Reageer op deze opdracht <ArrowRight size={16} aria-hidden="true" />
            </Btn>
          </div>
        </div>
      </div>
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
      {/* Kop */}
      <Card as="article" className="p-4">
        <div className="flex items-center gap-3.5">
          <MatchDonut value={ratio} tone={C.green} size={60} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold" style={{ color: C.ink }}>
              Je vertrouwensdossier
            </h2>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
              {verified} van {CREDENTIALS.length} geverifieerd · {PROFIEL.trust}
            </p>
          </div>
        </div>
      </Card>

      {/* Certificaten — accordeon met grote raakvlakken */}
      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const t = credTone(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card as="article" className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center gap-3 p-4 text-left ${RING}`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: t.soft, color: t.base }}
                    aria-hidden="true"
                  >
                    <t.Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold" style={{ color: C.ink }}>
                      {c.naam}
                    </span>
                    <span
                      className="block truncate text-[12px]"
                      style={{ color: t.alarm ? t.base : C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
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
                      className="px-4 pb-4"
                      style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}
                    >
                      <div className="mb-3">
                        <StatusTag {...t} />
                      </div>
                      <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                        {c.detail}. Het bewijsstuk wordt versleuteld bewaard en uitsluitend na jouw
                        toestemming ingezien door een opdrachtgever.
                      </p>
                      <Btn
                        variant={t.alarm ? "solid" : "outline"}
                        size="md"
                        tone={t.base}
                        full
                        className="mt-3"
                      >
                        {c.status === "EXPIRING"
                          ? "Vernieuwen"
                          : c.status === "REJECTED"
                            ? "Opnieuw indienen"
                            : "Bekijken"}
                        <ArrowRight size={15} aria-hidden="true" />
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Btn variant="outline" size="lg" full>
        <ShieldQuestion size={17} aria-hidden="true" /> Nieuw bewijsstuk toevoegen
      </Btn>
    </div>
  );
}

// —————————————————————————————————————— Acties ——————————————————————————————————————
function Acties({ onTab }: { onTab: (t: TabKey) => void }) {
  return (
    <div className="space-y-3.5">
      <p className="px-1 text-[13px] leading-relaxed" style={{ color: C.inkMute }}>
        Op volgorde van urgentie. Werk het belangrijkste eerst weg.
      </p>
      <ul className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.accent;
          const soft = warn ? C.amberSoft : C.accentSoft;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goFacturen = a.cta.toLowerCase().includes("herinner");
          const goVerif = a.cta.toLowerCase().includes("vog");
          return (
            <li key={a.titel}>
              <Card as="article" className="overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: soft, color: tone }}
                    aria-hidden="true"
                  >
                    {warn ? <TriangleAlert size={19} /> : <Sparkles size={19} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: tone }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"} · #{i + 1}
                    </span>
                    <h3 className="text-[14.5px] font-bold leading-snug" style={{ color: C.ink }}>
                      {a.titel}
                    </h3>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
                    {a.detail}
                  </p>
                  <Btn
                    variant={warn ? "solid" : "outline"}
                    size="lg"
                    tone={tone}
                    full
                    className="mt-3"
                    onClick={
                      goVerif
                        ? () => onTab("verificatie")
                        : goMarkt
                          ? () => onTab("marktplaats")
                          : goFacturen
                            ? () => onTab("facturen")
                            : undefined
                    }
                  >
                    {a.cta} <ArrowRight size={16} aria-hidden="true" />
                  </Btn>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// —————————————————————————————————————— Facturen ——————————————————————————————————————
function Facturen() {
  const [sel, setSel] = useState<string | null>(null);

  const totals = useMemo(() => {
    const sum = (status: string) =>
      FACTUREN.filter((f) => f.status === status).reduce((a, f) => a + parseEUR(f.bedrag), 0);
    return { betaald: sum("Betaald"), open: sum("Openstaand"), concept: sum("Concept") };
  }, []);

  return (
    <div className="space-y-5">
      {/* Samenvatting */}
      <Card as="article" className="p-4">
        <p className="text-[11.5px] font-semibold" style={{ color: C.inkMute }}>
          Openstaand
        </p>
        <p
          className="mt-0.5 text-[30px] font-bold leading-none tracking-[-0.02em]"
          style={{ color: C.ink, ...mono }}
        >
          {eur0.format(totals.open)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl px-3 py-2.5" style={{ background: C.greenSoft }}>
            <p
              className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
              style={{ color: C.green }}
            >
              <Check size={12} aria-hidden="true" /> Betaald
            </p>
            <p className="mt-0.5 text-[15px] font-bold" style={{ color: C.ink, ...mono }}>
              {eur0.format(totals.betaald)}
            </p>
          </div>
          <div className="rounded-2xl px-3 py-2.5" style={{ background: C.blueSoft }}>
            <p
              className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
              style={{ color: C.blue }}
            >
              <FileText size={12} aria-hidden="true" /> Concept
            </p>
            <p className="mt-0.5 text-[15px] font-bold" style={{ color: C.ink, ...mono }}>
              {eur0.format(totals.concept)}
            </p>
          </div>
        </div>
      </Card>

      {/* Lijst */}
      <section>
        <SectionHead title="Alle facturen" />
        <ul className="space-y-3">
          {FACTUREN.map((f) => {
            const t = factuurTone(f.status);
            const isOpen = sel === f.nr;
            const total = parseEUR(f.bedrag);
            const subtotal = Math.round(total / 1.21);
            const btw = total - subtotal;
            return (
              <li key={f.nr}>
                <Card as="article" className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSel(isOpen ? null : f.nr)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center gap-3 p-4 text-left ${RING}`}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-bold"
                        style={{ color: C.ink }}
                      >
                        {f.klant}
                      </span>
                      <span
                        className="flex items-center gap-1.5 text-[11.5px]"
                        style={{ color: C.inkMute, ...mono }}
                      >
                        {f.nr} · {f.datum}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span
                        className="block text-[15px] font-bold"
                        style={{ color: C.ink, ...mono }}
                      >
                        {f.bedrag}
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: t.base }}>
                        {t.label}
                      </span>
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div
                        className="px-4 pb-4"
                        style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}
                      >
                        <dl className="space-y-2 text-[12.5px]">
                          <div className="flex items-baseline justify-between">
                            <dt style={{ color: C.inkMute }}>Subtotaal</dt>
                            <dd className="font-semibold" style={{ color: C.ink, ...mono }}>
                              {eur0.format(subtotal)}
                            </dd>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <dt style={{ color: C.inkMute }}>Btw 21%</dt>
                            <dd className="font-semibold" style={{ color: C.ink, ...mono }}>
                              {eur0.format(btw)}
                            </dd>
                          </div>
                          <div
                            className="flex items-baseline justify-between border-t pt-2"
                            style={{ borderColor: C.line }}
                          >
                            <dt
                              className="font-bold uppercase tracking-[0.06em]"
                              style={{ color: C.ink }}
                            >
                              Totaal
                            </dt>
                            <dd
                              className="text-[16px] font-bold"
                              style={{ color: t.base, ...mono }}
                            >
                              {f.bedrag}
                            </dd>
                          </div>
                        </dl>
                        <Btn
                          variant={f.status === "Openstaand" ? "solid" : "outline"}
                          size="md"
                          tone={t.base}
                          full
                          className="mt-3"
                        >
                          {f.status === "Concept"
                            ? "Versturen"
                            : f.status === "Openstaand"
                              ? "Herinnering sturen"
                              : "Download PDF"}
                          <ArrowRight size={15} aria-hidden="true" />
                        </Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Btn variant="solid" size="lg" full>
        <Banknote size={18} aria-hidden="true" /> Nieuwe factuur opstellen
      </Btn>
    </div>
  );
}
