"use client";

// Concept 335 — "Aquarel" · zachte, bloedende waterverf-wassingen als geschilderde warmte.
// Kalm en menselijk, premium. Onregelmatige radiale wassingen (radial-gradients met zachte randen via
// border-radius + blur) liggen als geschilderde vlekken achter een licht papier-canvas. Statuskleuren
// voelen geschilderd, koppen zijn elegante serif. Geen decoratie zonder betekenis: verificatie en
// matching blijven helder en verklaarbaar, alleen de sfeer is warm en rustig. Alles uit mock.ts.
// Fonts: --font-lab-cormorant (serif-koppen) + --font-lab-newsreader (subkoppen/tekst) + --font-lab-jakarta (UI/labels).

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Store,
  Briefcase,
  ShieldCheck,
  ListTodo,
  Receipt,
  Search,
  Bell,
  ChevronRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Send,
  Plus,
  RotateCcw,
  Droplets,
  Sparkles,
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

/* ---------- Palet (geschilderde warmte, licht papier) ---------- */

const C = {
  paper: "#faf6f0",
  paperTint: "#f4ede3",
  surface: "#fffdf9",
  ink: "#2a2620",
  inkSoft: "#4d463c",
  sub: "#6e6559",
  faint: "#a49a8b",
  line: "#e8ddce",
  lineSoft: "#f0e8db",
  // geschilderde accenten
  wash: "#6a8caf", // hoofd-blauwaquarel (WCAG op licht)
  washInk: "#3d5f82",
  washSoft: "#e3ecf3",
  rose: "#b46b7a",
  roseSoft: "#f4e4e7",
  sage: "#5f8a5c",
  sageSoft: "#e2eddd",
  amber: "#a8792f",
  amberSoft: "#f4e9cf",
  ok: "#4f8452",
  okSoft: "#e2eddc",
  warn: "#a06a1e",
  warnSoft: "#f3e7cb",
  alert: "#a94a45",
  alertSoft: "#f2ddd9",
  info: "#4a6f96",
  infoSoft: "#e2ebf3",
};

const serif = { fontFamily: "var(--font-lab-cormorant), ui-serif, Georgia, serif" };
const read = { fontFamily: "var(--font-lab-newsreader), ui-serif, Georgia, serif" };
const ui = { fontFamily: "var(--font-lab-jakarta), ui-sans-serif, system-ui" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6a8caf] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf6f0]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): { fg: string; soft: string } {
  if (status === "Betaald") return { fg: C.ok, soft: C.okSoft };
  if (status === "Openstaand") return { fg: C.warn, soft: C.warnSoft };
  return { fg: C.faint, soft: C.lineSoft };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: Receipt,
  berichten: Bell,
};

/* ---------- Aquarel-wassing (achtergrond-vlek) ---------- */

function Wash({
  color,
  size,
  top,
  left,
  right,
  bottom,
  opacity = 0.5,
  shape = 0,
}: {
  color: string;
  size: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  opacity?: number;
  shape?: number;
}) {
  const shapes = [
    "42% 58% 63% 37% / 45% 40% 60% 55%",
    "63% 37% 55% 45% / 38% 62% 43% 57%",
    "50% 50% 40% 60% / 55% 45% 55% 45%",
  ];
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        opacity,
        background: `radial-gradient(closest-side, ${color}, ${color}88 45%, transparent 78%)`,
        borderRadius: shapes[shape % shapes.length],
        filter: "blur(14px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

/* ---------- Bouwstenen ---------- */

function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px rgba(42,38,32,0.04), 0 8px 24px -18px rgba(42,38,32,0.25)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...ui, color: t.fg, background: t.soft }}
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Zachte geschilderde voortgangsboog.
function WashRing({
  value,
  size = 76,
  color = C.wash,
  label,
}: {
  value: number;
  size?: number;
  color?: string;
  label?: string;
}) {
  const stroke = size >= 92 ? 9 : 7;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.lineSoft}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          opacity={0.85}
        />
      </svg>
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-medium"
          style={{ ...serif, color: C.ink, fontSize: size >= 92 ? 26 : 20 }}
        >
          {value}
        </span>
        {label && (
          <span
            className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide"
            style={{ ...ui, color: C.faint }}
          >
            {label}
          </span>
        )}
      </span>
    </span>
  );
}

function PageHead({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-3 pt-7 sm:px-8">
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...ui, color: C.washInk }}
        >
          {kicker}
        </p>
        <h1
          className="mt-1.5 text-[36px] leading-[1.02]"
          style={{ ...serif, color: C.ink, fontWeight: 500 }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-2 max-w-lg text-[14px] italic" style={{ ...read, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept335() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...ui, background: C.paper, color: C.ink }}
    >
      <style>{`@keyframes aq-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes aq-pulse{0%,100%{opacity:.5}50%{opacity:.8}}
      @keyframes aq-bloom{0%{transform:scale(0.96);opacity:.35}100%{transform:scale(1);opacity:.55}}`}</style>

      {/* Sfeer-wassingen op canvas */}
      <Wash color={C.wash} size={420} top={-120} right={-80} opacity={0.28} shape={0} />
      <Wash color={C.rose} size={320} bottom={-100} left={-60} opacity={0.22} shape={1} />
      <Wash color={C.amber} size={260} top={220} left="40%" opacity={0.14} shape={2} />

      {/* Kop */}
      <header
        className="relative border-b px-6 sm:px-8"
        style={{
          borderColor: C.line,
          background: "rgba(255,253,249,0.72)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="flex h-16 items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-[17px]"
            style={{
              ...serif,
              color: C.surface,
              background: `radial-gradient(circle at 30% 30%, ${C.rose}, ${C.wash})`,
            }}
            aria-hidden="true"
          >
            Z
          </div>
          <div className="leading-none">
            <span className="text-[20px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
              Aquarel
            </span>
            <span className="ml-2 text-[11px] italic" style={{ ...read, color: C.faint }}>
              rustig werken
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`rounded-full p-2.5 transition-colors hover:bg-[#f4ede3] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative rounded-full p-2.5 transition-colors hover:bg-[#f4ede3] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ background: C.rose }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
                style={{ ...ui, background: C.washSoft, color: C.washInk }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[10.5px] font-medium"
                  style={{ color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs */}
        <nav className="flex gap-1 overflow-x-auto pb-2.5" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${RING}`}
                style={{
                  color: on ? C.washInk : C.sub,
                  background: on ? C.washSoft : "transparent",
                  fontWeight: on ? 600 : 500,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.wash : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div
        key={screen}
        className="relative mx-auto max-w-6xl"
        style={{ animation: "aq-fade 0.34s ease" }}
      >
        {!ready ? (
          <ScreenSkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-7 sm:px-8" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-8 w-56 rounded-xl"
        style={{ background: C.surface, animation: "aq-pulse 1.4s infinite" }}
      />
      <div
        className="mt-6 h-44 rounded-[20px]"
        style={{
          background: C.surface,
          border: `1px solid ${C.line}`,
          animation: "aq-pulse 1.4s infinite",
        }}
      />
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl"
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              animation: "aq-pulse 1.4s infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const warn = ACTIES[0];
  const matchAvg = Math.round(OPDRACHTEN.reduce((s, o) => s + o.match, 0) / OPDRACHTEN.length);

  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Vandaag"
        title={`Een kalme dag, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Alles wat telt, zacht geordend — je cijfers, je volgende zet en de mooiste kansen."
      />

      <div className="space-y-6 px-6 py-5 sm:px-8">
        {/* Hero */}
        <Card className="p-0">
          <Wash color={C.wash} size={340} top={-120} right={-60} opacity={0.4} shape={0} />
          <Wash color={C.rose} size={220} bottom={-90} left={40} opacity={0.28} shape={1} />
          <div className="relative flex flex-wrap items-center gap-6 p-7">
            <WashRing value={matchAvg} size={104} color={C.wash} label="match" />
            <div className="min-w-[200px] flex-1">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...ui, color: C.washInk }}
              >
                <Sparkles size={13} aria-hidden="true" /> Gemiddelde match
              </p>
              <p
                className="mt-2 text-[42px] leading-none"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                Sterke koers
              </p>
              <p className="mt-2 max-w-md text-[14px] italic" style={{ ...read, color: C.sub }}>
                Je geverifieerde profiel doet z’n werk. Reageer op wat je aanspreekt en laat de rest
                rustig voorbijgaan.
              </p>
            </div>
          </div>
        </Card>

        {/* KPI-tegels */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Card key={k.label} className="p-5">
              <p className="text-[11.5px] font-medium" style={{ ...ui, color: C.sub }}>
                {k.label}
              </p>
              <p
                className="mt-1.5 text-[28px] leading-none"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {k.value}
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  ...ui,
                  color: k.up ? C.ok : C.warn,
                  background: k.up ? C.okSoft : C.warnSoft,
                }}
              >
                {k.up ? "↑" : "↓"} {k.trend}
              </span>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Volgende zet */}
          {warn && (
            <Card className="p-6 lg:col-span-2">
              <Wash color={C.amber} size={200} top={-70} right={-40} opacity={0.32} shape={2} />
              <p
                className="relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...ui, color: C.warn }}
              >
                <Droplets size={13} aria-hidden="true" /> Je volgende zet
              </p>
              <h2
                className="relative mt-2 text-[26px] leading-tight"
                style={{ ...serif, color: C.ink, fontWeight: 500 }}
              >
                {warn.titel}
              </h2>
              <p
                className="relative mt-1.5 max-w-md text-[13.5px]"
                style={{ ...read, color: C.sub }}
              >
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`relative mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{ ...ui, background: C.washInk }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </Card>
          )}

          {/* Postbus met error → loading → ok */}
          <Card className="p-6">
            <h3 className="text-[18px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
              Berichten
            </h3>
            <div className="mt-3 border-t pt-3" style={{ borderColor: C.lineSoft }}>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <AlertTriangle
                    size={20}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12.5px]" style={{ ...read, color: C.sub }}>
                    Kon berichten niet laden.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#f4ede3] ${RING}`}
                    style={{ ...ui, border: `1px solid ${C.line}`, color: C.ink }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2.5" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  {[65, 88, 50].map((w, i) => (
                    <span
                      key={i}
                      className="block h-3 rounded-full"
                      style={{
                        width: `${w}%`,
                        background: C.lineSoft,
                        animation: "aq-pulse 1.4s infinite",
                      }}
                    />
                  ))}
                </div>
              )}
              {feed === "ok" && (
                <ul className="space-y-3">
                  {BERICHTEN.slice(0, 2).map((b) => (
                    <li key={b.van} className="flex items-start gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{ ...ui, background: C.roseSoft, color: C.rose }}
                      >
                        {b.initialen}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
                          {b.van}
                        </p>
                        <p className="truncate text-[11.5px]" style={{ ...read, color: C.sub }}>
                          {b.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
              Kansen voor jou
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12.5px] font-semibold ${RING}`}
              style={{ ...ui, color: C.washInk }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`group text-left ${RING} rounded-[20px]`}
              >
                <Card className="h-full p-5 transition-transform group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between">
                    <WashRing value={o.match} size={60} label="match" />
                    <span className="text-[10px] font-medium" style={{ ...ui, color: C.faint }}>
                      {o.id}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-[17px] leading-snug"
                    style={{ ...serif, color: C.ink, fontWeight: 500 }}
                  >
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 truncate text-[12px]"
                    style={{ ...read, color: C.sub }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[14px] font-semibold" style={{ ...ui, color: C.washInk }}>
                      {o.tarief}
                    </span>
                    <span className="text-[11.5px]" style={{ ...read, color: C.faint }}>
                      {o.uren}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  ).sort((a, b) => (sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief)));

  return (
    <div>
      <PageHead
        kicker="Ontdek"
        title="Marktplaats"
        sub="Opdrachten zacht gerangschikt op je match — de warmste kansen bovenaan."
        right={
          <div
            className="inline-flex items-center gap-0.5 rounded-full p-0.5"
            style={{ background: C.paperTint, border: `1px solid ${C.line}` }}
            role="tablist"
            aria-label="Sorteren"
          >
            {(["match", "tarief"] as const).map((s) => {
              const on = s === sort;
              return (
                <button
                  key={s}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSort(s)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    ...ui,
                    background: on ? C.surface : "transparent",
                    color: on ? C.ink : C.sub,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-6 py-5 sm:px-8">
        <div
          className="mb-5 flex items-center gap-2.5 rounded-full px-4 py-3"
          style={{ background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ ...read, color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center px-6 py-16 text-center">
            <Wash color={C.wash} size={180} top={-40} left="50%" opacity={0.3} shape={0} />
            <span
              className="relative flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: C.washSoft }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.wash }} />
            </span>
            <p
              className="relative mt-4 text-[22px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              Niets gevonden
            </p>
            <p
              className="relative mt-1 max-w-xs text-[13px] italic"
              style={{ ...read, color: C.sub }}
            >
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht en kijk rustig verder.
            </p>
            <button
              onClick={() => setQ("")}
              className={`relative mt-4 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f4ede3] ${RING}`}
              style={{ ...ui, border: `1px solid ${C.line}`, color: C.ink }}
            >
              Zoekopdracht wissen
            </button>
          </Card>
        ) : (
          <ul className="space-y-4">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Card className="p-5">
                  {i === 0 && (
                    <Wash
                      color={C.sage}
                      size={200}
                      top={-80}
                      right={-50}
                      opacity={0.24}
                      shape={1}
                    />
                  )}
                  <div className="relative flex flex-wrap items-start gap-4">
                    <WashRing value={o.match} size={68} label="match" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium" style={{ ...ui, color: C.faint }}>
                          {o.id}
                        </span>
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ ...ui, background: C.paperTint, color: C.sub }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p
                        className="mt-1 text-[19px] leading-snug"
                        style={{ ...serif, color: C.ink, fontWeight: 500 }}
                      >
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ ...read, color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                        <span className="font-semibold" style={{ ...ui, color: C.washInk }}>
                          {o.tarief}
                        </span>
                        <span style={{ ...read, color: C.sub }}>{o.uren}</span>
                        <span style={{ ...read, color: C.sub }}>{o.start}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-1.5 self-center rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                      style={{ ...ui, background: C.washInk }}
                    >
                      Bekijk <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div>
      <PageHead
        kicker={opdracht.id}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#f4ede3] ${RING}`}
              style={{ ...ui, border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ ...ui, background: state === "sent" ? C.ok : C.washInk }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.2} aria-hidden="true" /> Reageer
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={2.8} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:px-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <Card key={m.l} className="p-4">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...ui, color: C.faint }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[18px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                  {m.v}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <Wash color={C.sage} size={220} bottom={-90} right={-50} opacity={0.2} shape={2} />
            <h3
              className="relative text-[22px]"
              style={{ ...serif, color: C.ink, fontWeight: 500 }}
            >
              Waarom deze match
            </h3>
            <p className="relative mt-0.5 text-[13px] italic" style={{ ...read, color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="relative mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...ui, color: C.ok }}
                >
                  <Check size={13} strokeWidth={2.6} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13.5px]"
                      style={{ ...read, color: C.ink }}
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.sage }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...ui, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13.5px]"
                      style={{ ...read, color: C.sub }}
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.amber }}
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            <Wash color={C.wash} size={200} top={-80} right={-40} opacity={0.35} shape={0} />
            <div className="relative flex items-center gap-4">
              <WashRing value={opdracht.match} size={80} color={C.wash} label="match" />
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...ui, color: C.washInk }}
                >
                  Match-score
                </p>
                <p className="mt-1 text-[13px]" style={{ ...read, color: C.sub }}>
                  Sterke koppeling met je profiel — reageer als het je aanspreekt.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ ...ui, color: C.washInk }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ ...read, color: C.sub }}>
              Vereiste credentials voor deze opdracht. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ ...read, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");
  const pct = Math.round((verified / total) * 100);

  return (
    <div>
      <PageHead
        kicker="Vertrouwen"
        title="Verificatie"
        sub="Elk geverifieerd bewijsstuk kleurt je profiel warmer en betrouwbaarder."
      />
      <div className="space-y-5 px-6 py-5 sm:px-8">
        <Card className="p-7">
          <Wash color={C.wash} size={300} top={-120} right={-70} opacity={0.36} shape={0} />
          <Wash color={C.rose} size={180} bottom={-70} left={30} opacity={0.26} shape={1} />
          <div className="relative flex flex-wrap items-center gap-6">
            <WashRing value={pct} size={104} color={C.wash} label="verified" />
            <div className="min-w-[180px] flex-1">
              <p
                className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...ui, color: C.washInk }}
              >
                <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
              </p>
              <p className="mt-2 text-[30px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                {verified} van {total} geverifieerd
              </p>
              <p className="mt-1 text-[13px] italic" style={{ ...read, color: C.sub }}>
                Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
                een volledige score.
              </p>
            </div>
          </div>
        </Card>

        {expiring && (
          <Card
            className="flex flex-wrap items-center gap-4 p-5"
            style={{ background: C.warnSoft, borderColor: `${C.warn}44` }}
          >
            <span role="alert" className="contents">
              <AlertTriangle
                size={22}
                style={{ color: C.warn }}
                className="shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-[180px] flex-1">
                <p className="text-[15px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                  {expiring.naam} verloopt binnenkort
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ ...read, color: C.inkSoft }}>
                  {expiring.detail}. Vernieuw op tijd om je score te behouden.
                </p>
              </div>
              <button
                onClick={() => onGo("acties")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
                style={{ ...ui, background: C.warn }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </span>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CREDENTIALS.map((c) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Card key={c.naam} className="flex items-center gap-3.5 p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ ...read, color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <PageHead
        kicker="Rustig af te ronden"
        title="Volgende acties"
        sub="Zacht geordend op urgentie — rond af in je eigen tempo."
      />
      <div className="space-y-4 px-6 py-5 sm:px-8">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.info;
          const soft = warn ? C.warnSoft : C.infoSoft;
          return (
            <Card key={a.titel} className="flex flex-wrap items-start gap-4 p-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[16px]"
                style={{ ...serif, background: soft, color: fg, fontWeight: 500 }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...ui, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p
                  className="mt-0.5 text-[16px]"
                  style={{ ...serif, color: C.ink, fontWeight: 500 }}
                >
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ ...read, color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  ...ui,
                  background: warn ? C.warn : C.washInk,
                  color: "#fff",
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </Card>
          );
        })}

        <Card
          className="flex items-center gap-3 p-5"
          style={{ background: C.sageSoft, borderColor: `${C.sage}44` }}
        >
          <Check size={18} strokeWidth={2.4} style={{ color: C.sage }} aria-hidden="true" />
          <p className="text-[13px]" style={{ ...read, color: C.inkSoft }}>
            Verder is alles rustig. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const totaal = betaald + open;
  const pct = totaal ? Math.round((betaald / totaal) * 100) : 0;

  return (
    <div>
      <PageHead
        kicker="Overzicht"
        title="Facturen"
        sub="Je omzet in rustige tinten — wat binnen is en wat nog onderweg is."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform active:scale-[0.98] ${RING}`}
            style={{ ...ui, background: C.washInk }}
          >
            <Plus size={14} strokeWidth={2.4} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-5 sm:px-8">
        <Card className="p-7">
          <Wash color={C.sage} size={260} top={-100} right={-60} opacity={0.28} shape={2} />
          <Wash color={C.amber} size={180} bottom={-70} left={20} opacity={0.22} shape={1} />
          <div className="relative flex flex-wrap items-center gap-8">
            <WashRing value={pct} size={92} color={C.sage} label="betaald" />
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...ui, color: C.ok }}
              >
                Ontvangen
              </p>
              <p className="mt-1 text-[30px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                € {betaald.toLocaleString("nl-NL")}
              </p>
            </div>
            <div>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...ui, color: C.warn }}
              >
                Openstaand
              </p>
              <p className="mt-1 text-[30px]" style={{ ...serif, color: C.ink, fontWeight: 500 }}>
                € {open.toLocaleString("nl-NL")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...ui, background: C.paperTint, color: C.faint }}
              >
                <th className="px-5 py-3.5">Nummer</th>
                <th className="px-5 py-3.5">Klant</th>
                <th className="hidden px-5 py-3.5 sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right">Bedrag</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr
                    key={f.nr}
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12px] font-medium"
                      style={{ ...ui, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13.5px]" style={{ ...read, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-5 py-4 text-[12px] sm:table-cell"
                      style={{ ...ui, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[14px]"
                      style={{ ...serif, color: C.ink, fontWeight: 500 }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ ...ui, color: t.fg, background: t.soft }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: t.fg }}
                          aria-hidden="true"
                        />
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
