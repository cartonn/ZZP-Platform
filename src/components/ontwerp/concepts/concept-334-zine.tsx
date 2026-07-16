"use client";

// Concept 334 — "Zine" · handgemaakte knip-en-plak collage met fotokopie-textuur.
// De 2026 anti-slop, warm-ambachtelijke rebellie: warm papier, zwarte marker + één spot-kleur (vermiljoen),
// plakband-hoekjes, licht-scheve kaders, marker-onderstreping en halftone-korrel — maar strak leesbaar en
// functioneel. Alles is echte data uit mock.ts; niets is decoratie zonder betekenis. Verificatie voelt als
// een gestempeld bewijsstuk, matching als een met de hand aangevinkte checklist. Textuur puur via CSS.
// Fonts: --font-lab-architects (handgeschreven koppen) + --font-lab-special-elite (typemachine) + --font-lab-franklin (tekst).

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
  Scissors,
  Star,
  Sparkle,
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

/* ---------- Palet (warm papier, zwarte marker, vermiljoen spot) ---------- */

const C = {
  paper: "#efe7d6",
  paperAlt: "#e7dcc4",
  card: "#f7f1e3",
  cardWarm: "#fbf5e7",
  ink: "#1c1712",
  inkSoft: "#4a4238",
  sub: "#6b6151",
  faint: "#948873",
  line: "#cabfa3",
  spot: "#d8340f", // vermiljoen marker
  spotSoft: "#f6ddd0",
  spotDeep: "#a72408",
  ok: "#2f6b2a",
  okSoft: "#dfeacb",
  warn: "#9a5a06",
  warnSoft: "#f3e4c4",
  alert: "#b12712",
  alertSoft: "#f4d9cf",
  info: "#274b78",
  infoSoft: "#d9e2ec",
  tape: "rgba(216,175,90,0.42)",
};

const hand = { fontFamily: "var(--font-lab-architects), ui-sans-serif, system-ui" };
const type = { fontFamily: "var(--font-lab-special-elite), ui-monospace, monospace" };
const body = { fontFamily: "var(--font-lab-franklin), ui-sans-serif, system-ui" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8340f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe7d6]";

// Fotokopie-korrel als herbruikbare achtergrond (halftone-stippen + ruis via gradients).
const GRAIN =
  "radial-gradient(rgba(28,23,18,0.05) 1px, transparent 1.4px) 0 0 / 6px 6px, radial-gradient(rgba(28,23,18,0.04) 1px, transparent 1.4px) 3px 3px / 6px 6px";

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
  return { fg: C.faint, soft: C.paperAlt };
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

/* ---------- Bouwstenen ---------- */

// Een plakband-hoekje (schuin doorschijnend reepje).
function Tape({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 54,
    height: 20,
    background: C.tape,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
    mixBlendMode: "multiply",
  };
  const map: Record<string, React.CSSProperties> = {
    tl: { top: -8, left: 14, transform: "rotate(-24deg)" },
    tr: { top: -8, right: 14, transform: "rotate(22deg)" },
    bl: { bottom: -8, left: 16, transform: "rotate(18deg)" },
    br: { bottom: -8, right: 16, transform: "rotate(-20deg)" },
  };
  return <span aria-hidden="true" style={{ ...base, ...map[pos] }} />;
}

// Papier-kaart met dubbele rand en fotokopie-korrel; optioneel licht scheef.
function Paper({
  children,
  tilt = 0,
  className = "",
  warm = false,
  style,
}: {
  children: React.ReactNode;
  tilt?: number;
  className?: string;
  warm?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        background: warm ? C.cardWarm : C.card,
        backgroundImage: GRAIN,
        border: `2px solid ${C.ink}`,
        boxShadow: `4px 4px 0 0 ${C.ink}`,
        transform: `rotate(${tilt}deg)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusStamp({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
      style={{
        ...type,
        color: t.fg,
        background: t.soft,
        border: `1.5px solid ${t.fg}`,
        transform: "rotate(-1.5deg)",
      }}
    >
      <Icon size={12} strokeWidth={2.6} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Marker-onderstreping onder een kop.
function Underline({ color = C.spot, w = "68%" }: { color?: string; w?: string }) {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 block"
      style={{
        height: 7,
        width: w,
        background: color,
        borderRadius: "40% 60% 55% 45%",
        transform: "rotate(-0.6deg)",
        opacity: 0.85,
      }}
    />
  );
}

// Met-de-hand-getekende voortgangsbalk (schetsmatig).
function HandBar({ value, color = C.spot }: { value: number; color?: string }) {
  return (
    <span
      className="relative block w-full overflow-hidden"
      style={{ height: 14, border: `2px solid ${C.ink}`, background: C.paperAlt }}
      aria-hidden="true"
    >
      <span
        className="block h-full"
        style={{
          width: `${Math.max(4, Math.min(100, value))}%`,
          background: `repeating-linear-gradient(-45deg, ${color} 0 6px, ${color}cc 6px 10px)`,
        }}
      />
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
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-3 pt-6 sm:px-7">
      <div className="min-w-0">
        <span
          className="inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{
            ...type,
            color: C.cardWarm,
            background: C.ink,
            transform: "rotate(-1.2deg)",
          }}
        >
          {kicker}
        </span>
        <h1
          className="mt-2 text-[34px] leading-[0.95]"
          style={{ ...hand, color: C.ink, letterSpacing: "-0.01em" }}
        >
          {title}
        </h1>
        <Underline />
        {sub && (
          <p className="mt-2 max-w-lg text-[13.5px]" style={{ ...body, color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept334() {
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
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.paper, backgroundImage: GRAIN, color: C.ink }}
    >
      <style>{`@keyframes zn-fade{from{opacity:0;transform:translateY(10px) rotate(-0.3deg)}to{opacity:1;transform:translateY(0) rotate(0)}}
      @keyframes zn-pulse{0%,100%{opacity:.45}50%{opacity:.8}}
      @keyframes zn-wob{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}`}</style>

      {/* Kop — knipsel-masthead */}
      <header
        className="border-b-2 px-5 sm:px-7"
        style={{ borderColor: C.ink, background: C.paperAlt, backgroundImage: GRAIN }}
      >
        <div className="flex h-16 items-center gap-3">
          <div
            className="relative flex h-10 w-10 items-center justify-center text-[18px] font-bold"
            style={{
              ...hand,
              color: C.cardWarm,
              background: C.spot,
              border: `2px solid ${C.ink}`,
              transform: "rotate(-4deg)",
            }}
            aria-hidden="true"
          >
            Z
            <Scissors
              size={13}
              className="absolute -right-2 -top-2"
              style={{ color: C.ink }}
              strokeWidth={2.4}
            />
          </div>
          <span className="text-[22px] leading-none" style={{ ...hand, color: C.ink }}>
            De Zelfstandige
          </span>
          <span
            className="ml-1 hidden px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest sm:inline"
            style={{ ...type, background: C.ink, color: C.cardWarm, transform: "rotate(1.5deg)" }}
          >
            editie ’26
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              aria-label="Zoeken"
              className={`p-2 transition-transform hover:-rotate-3 ${RING}`}
              style={{ border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
            >
              <Search size={16} aria-hidden="true" />
            </button>
            <button
              aria-label="Meldingen"
              className={`relative p-2 transition-transform hover:rotate-3 ${RING}`}
              style={{ border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="absolute -right-1.5 -top-1.5 h-3 w-3"
                style={{ background: C.spot, border: `1.5px solid ${C.ink}`, borderRadius: 99 }}
                aria-hidden="true"
              />
            </button>
            <div className="ml-1 flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center text-[12px] font-bold"
                style={{
                  ...type,
                  background: C.ink,
                  color: C.cardWarm,
                  transform: "rotate(-3deg)",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px] font-bold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="flex items-center gap-1 text-[11px] font-bold"
                  style={{ ...type, color: C.ok }}
                >
                  <ShieldCheck size={11} strokeWidth={2.6} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scherm-tabs — uitgeknipte reepjes */}
        <nav className="flex gap-2 overflow-x-auto pb-3 pt-1" aria-label="Hoofdnavigatie">
          {SCREENS.map((s, i) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            const tilt = (i % 2 === 0 ? -1 : 1) * 1.4;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 px-3 py-2 text-[12.5px] font-bold uppercase tracking-wide transition-transform hover:-translate-y-0.5 ${RING}`}
                style={{
                  ...type,
                  color: on ? C.cardWarm : C.ink,
                  background: on ? C.spot : C.card,
                  border: `2px solid ${C.ink}`,
                  boxShadow: on ? `3px 3px 0 0 ${C.ink}` : "none",
                  transform: `rotate(${on ? 0 : tilt}deg)`,
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <div key={screen} className="mx-auto max-w-6xl" style={{ animation: "zn-fade 0.34s ease" }}>
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
    <div className="px-5 py-6 sm:px-7" role="status" aria-live="polite">
      <span className="sr-only">Pagina wordt geknipt en geplakt…</span>
      <div
        className="h-9 w-56"
        style={{
          background: C.card,
          border: `2px solid ${C.ink}`,
          animation: "zn-pulse 1.3s infinite",
        }}
      />
      <div
        className="mt-5 h-40"
        style={{
          background: C.card,
          border: `2px solid ${C.ink}`,
          boxShadow: `4px 4px 0 0 ${C.ink}`,
          animation: "zn-pulse 1.3s infinite",
        }}
      />
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24"
            style={{
              background: C.card,
              border: `2px solid ${C.ink}`,
              animation: "zn-pulse 1.3s infinite",
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
        kicker="Voorpagina"
        title={`Hoi ${PROFIEL.naam.split(" ")[0]}, dit is jouw week`}
        sub="Alles wat telt op één geplakte pagina — je cijfers, je volgende zet en de beste kansen."
      />

      <div className="space-y-6 px-5 py-5 sm:px-7">
        {/* Hero-collage */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Paper tilt={-0.6} warm className="p-6 lg:col-span-2">
            <Tape pos="tl" />
            <Tape pos="br" />
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ ...type, color: C.spot }}
            >
              <Sparkle size={13} aria-hidden="true" /> Gemiddelde match
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-4">
              <p className="text-[64px] leading-[0.8]" style={{ ...hand, color: C.ink }}>
                {matchAvg}
                <span className="text-[28px]" style={{ color: C.spot }}>
                  %
                </span>
              </p>
              <div className="mb-1.5 flex-1">
                <HandBar value={matchAvg} />
                <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                  Sterke koers — je geverifieerde profiel doet z’n werk. Blijf reageren.
                </p>
              </div>
            </div>
          </Paper>

          {warn && (
            <Paper tilt={0.8} className="p-5" style={{ background: C.spotSoft }}>
              <Tape pos="tr" />
              <p
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ ...type, color: C.spotDeep }}
              >
                <Star size={13} aria-hidden="true" /> Doe dit nu
              </p>
              <h2 className="mt-2 text-[22px] leading-tight" style={{ ...hand, color: C.ink }}>
                {warn.titel}
              </h2>
              <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wide transition-transform active:translate-y-0.5 ${RING}`}
                style={{
                  ...type,
                  background: C.ink,
                  color: C.cardWarm,
                  boxShadow: `3px 3px 0 0 ${C.spot}`,
                }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Paper>
          )}
        </div>

        {/* KPI-knipsels */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <Paper key={k.label} tilt={(i % 2 === 0 ? -1 : 1) * 0.7} className="p-4">
              <p
                className="text-[10.5px] font-bold uppercase tracking-wide"
                style={{ ...type, color: C.sub }}
              >
                {k.label}
              </p>
              <p className="mt-1 text-[30px] leading-none" style={{ ...hand, color: C.ink }}>
                {k.value}
              </p>
              <p
                className="mt-1 inline-block px-1.5 py-0.5 text-[11px] font-bold"
                style={{
                  ...type,
                  color: k.up ? C.ok : C.warn,
                  background: k.up ? C.okSoft : C.warnSoft,
                  border: `1.5px solid ${k.up ? C.ok : C.warn}`,
                }}
              >
                {k.up ? "▲" : "▼"} {k.trend}
              </p>
            </Paper>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Berichten met error → loading → ok */}
          <Paper tilt={-0.5} className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px]" style={{ ...hand, color: C.ink }}>
                Postbus
              </h3>
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ ...type, background: C.spot, color: C.cardWarm }}
              >
                nieuw
              </span>
            </div>
            <div className="mt-3 border-t-2 border-dashed pt-3" style={{ borderColor: C.line }}>
              {feed === "error" && (
                <div className="text-center" role="alert">
                  <AlertTriangle
                    size={22}
                    className="mx-auto"
                    style={{ color: C.alert }}
                    aria-hidden="true"
                  />
                  <p className="mt-1.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                    De post kwam niet aan.
                  </p>
                  <button
                    onClick={retry}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-bold uppercase transition-transform hover:-rotate-2 ${RING}`}
                    style={{
                      ...type,
                      border: `2px solid ${C.ink}`,
                      background: C.card,
                      color: C.ink,
                    }}
                  >
                    <RotateCcw size={12} aria-hidden="true" /> Opnieuw
                  </button>
                </div>
              )}
              {feed === "loading" && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <span className="sr-only">Laden…</span>
                  {[70, 90, 55].map((w, i) => (
                    <span
                      key={i}
                      className="block h-3"
                      style={{
                        width: `${w}%`,
                        background: C.paperAlt,
                        animation: "zn-pulse 1.3s infinite",
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-[10px] font-bold"
                        style={{ ...type, background: C.ink, color: C.cardWarm }}
                      >
                        {b.initialen}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold" style={{ ...body, color: C.ink }}>
                          {b.van}
                        </p>
                        <p className="truncate text-[11.5px]" style={{ ...body, color: C.sub }}>
                          {b.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Paper>

          {/* Beste matches (2 kol) */}
          <Paper tilt={0.4} className="p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px]" style={{ ...hand, color: C.ink }}>
                Uitgeknipte kansen
              </h2>
              <button
                onClick={() => onGo("marktplaats")}
                className={`inline-flex items-center gap-1 text-[12px] font-bold uppercase ${RING}`}
                style={{ ...type, color: C.spot }}
              >
                Alles <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOpen(o.id)}
                  className={`flex w-full items-center gap-3 border-b-2 border-dashed pb-3 text-left transition-transform hover:translate-x-1 ${RING}`}
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center text-[15px] font-bold leading-none"
                    style={{
                      ...hand,
                      background: C.spotSoft,
                      color: C.spotDeep,
                      border: `2px solid ${C.ink}`,
                      transform: "rotate(-3deg)",
                    }}
                  >
                    {o.match}
                    <span className="text-[8px]" style={{ ...type }}>
                      match
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                      {o.titel}
                    </p>
                    <p
                      className="flex items-center gap-1 text-[12px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold" style={{ ...type, color: C.spot }}>
                    {o.tarief}
                  </span>
                </button>
              ))}
            </div>
          </Paper>
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
        kicker="Prikbord"
        title="Marktplaats"
        sub="Alle opdrachten opgeprikt en gerangschikt — de sterkste kansen bovenaan."
        right={
          <div
            className="inline-flex items-center gap-1 p-1"
            style={{ background: C.card, border: `2px solid ${C.ink}` }}
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
                  className={`px-3 py-1.5 text-[11.5px] font-bold uppercase ${RING}`}
                  style={{
                    ...type,
                    background: on ? C.ink : "transparent",
                    color: on ? C.cardWarm : C.sub,
                  }}
                >
                  {s === "match" ? "Match" : "Tarief"}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="px-5 py-5 sm:px-7">
        <div
          className="mb-5 flex items-center gap-2.5 px-3.5 py-3"
          style={{
            background: C.card,
            border: `2px solid ${C.ink}`,
            boxShadow: `3px 3px 0 0 ${C.ink}`,
          }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.ink }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none"
            style={{ ...body, color: C.ink }}
          />
        </div>

        {filtered.length === 0 ? (
          <Paper tilt={-0.5} className="flex flex-col items-center px-6 py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center"
              style={{
                background: C.spotSoft,
                border: `2px solid ${C.ink}`,
                transform: "rotate(-4deg)",
              }}
              aria-hidden="true"
            >
              <Search size={22} style={{ color: C.spotDeep }} />
            </span>
            <p className="mt-4 text-[22px]" style={{ ...hand, color: C.ink }}>
              Niets gevonden op het prikbord
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ ...body, color: C.sub }}>
              Niets komt overeen met “{q}”. Verbreed je zoekopdracht.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-4 px-4 py-2 text-[12px] font-bold uppercase transition-transform hover:-rotate-2 ${RING}`}
              style={{ ...type, border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
            >
              Wissen
            </button>
          </Paper>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filtered.map((o, i) => (
              <li key={o.id}>
                <Paper tilt={(i % 2 === 0 ? -1 : 1) * 0.7} className="h-full p-5">
                  {i === 0 && <Tape pos="tr" />}
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center text-[18px] font-bold leading-none"
                      style={{
                        ...hand,
                        background: i === 0 ? C.spot : C.spotSoft,
                        color: i === 0 ? C.cardWarm : C.spotDeep,
                        border: `2px solid ${C.ink}`,
                        transform: "rotate(-3deg)",
                      }}
                    >
                      {o.match}
                      <span className="text-[8px]" style={{ ...type }}>
                        %match
                      </span>
                    </span>
                    <span className="text-[11px] font-bold" style={{ ...type, color: C.faint }}>
                      {o.id}
                    </span>
                  </div>
                  <p className="mt-3 text-[19px] leading-tight" style={{ ...hand, color: C.ink }}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1 text-[12.5px]"
                    style={{ ...body, color: C.sub }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 text-[10.5px] font-bold uppercase"
                        style={{
                          ...type,
                          background: C.paperAlt,
                          color: C.inkSoft,
                          border: `1.5px solid ${C.line}`,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-4 flex items-center justify-between border-t-2 border-dashed pt-3"
                    style={{ borderColor: C.line }}
                  >
                    <div>
                      <span className="text-[15px] font-bold" style={{ ...type, color: C.spot }}>
                        {o.tarief}
                      </span>
                      <span className="ml-2 text-[11.5px]" style={{ ...body, color: C.sub }}>
                        {o.uren}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11.5px] font-bold uppercase transition-transform active:translate-y-0.5 ${RING}`}
                      style={{
                        ...type,
                        background: C.ink,
                        color: C.cardWarm,
                        boxShadow: `2px 2px 0 0 ${C.spot}`,
                      }}
                    >
                      Bekijk <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </div>
                </Paper>
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
              className={`px-3.5 py-2 text-[11.5px] font-bold uppercase transition-transform hover:-rotate-2 ${RING}`}
              style={{ ...type, border: `2px solid ${C.ink}`, background: C.card, color: C.ink }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase transition-transform active:translate-y-0.5 disabled:opacity-90 ${RING}`}
              style={{
                ...type,
                background: state === "sent" ? C.ok : C.spot,
                color: C.cardWarm,
                boxShadow: `3px 3px 0 0 ${C.ink}`,
              }}
            >
              {state === "idle" && (
                <>
                  <Send size={15} strokeWidth={2.4} aria-hidden="true" /> Reageer nu
                </>
              )}
              {state === "sending" && "Versturen…"}
              {state === "sent" && (
                <>
                  <Check size={15} strokeWidth={3} aria-hidden="true" /> Verstuurd
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 px-5 py-5 sm:px-7 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m, i) => (
              <Paper key={m.l} tilt={(i % 2 === 0 ? -1 : 1) * 0.8} className="p-3.5">
                <p
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ ...type, color: C.faint }}
                >
                  {m.l}
                </p>
                <p className="mt-1 text-[18px]" style={{ ...hand, color: C.ink }}>
                  {m.v}
                </p>
              </Paper>
            ))}
          </div>

          {/* Verklaarbare match — handgeschreven checklist */}
          <Paper tilt={-0.4} warm className="p-6">
            <Tape pos="tl" />
            <h3 className="text-[22px]" style={{ ...hand, color: C.ink }}>
              Waarom deze match?
            </h3>
            <Underline w="52%" />
            <p className="mt-2 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Met de hand nagelopen op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
                  style={{ ...type, color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                        style={{
                          border: `2px solid ${C.ok}`,
                          background: C.okSoft,
                          transform: "rotate(-4deg)",
                        }}
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          style={{ color: C.ok }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p
                  className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
                  style={{ ...type, color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Let op
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ ...body, color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                        style={{
                          border: `2px solid ${C.warn}`,
                          background: C.warnSoft,
                          transform: "rotate(3deg)",
                        }}
                      >
                        <AlertTriangle
                          size={11}
                          strokeWidth={2.6}
                          style={{ color: C.warn }}
                          aria-hidden="true"
                        />
                      </span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Paper>
        </div>

        <div className="space-y-5">
          <Paper tilt={0.8} className="p-5" style={{ background: C.spotSoft }}>
            <Tape pos="tr" />
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
              style={{ ...type, color: C.spotDeep }}
            >
              <Star size={13} aria-hidden="true" /> Match-score
            </p>
            <p className="mt-2 text-[58px] leading-none" style={{ ...hand, color: C.ink }}>
              {opdracht.match}
              <span className="text-[24px]" style={{ color: C.spot }}>
                %
              </span>
            </p>
            <div className="mt-2">
              <HandBar value={opdracht.match} />
            </div>
            <p className="mt-2 text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
              Sterke koppeling met je profiel — reageer nu voor het beste momentum.
            </p>
          </Paper>

          <Paper tilt={-0.6} className="p-5">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
              style={{ ...type, color: C.spot }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Vereiste bewijsstukken. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center"
                      style={{ background: t.soft, border: `2px solid ${t.fg}` }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ ...body, color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusStamp status={c.status} />
                  </li>
                );
              })}
            </ul>
          </Paper>
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
        kicker="Bewijsmap"
        title="Verificatie"
        sub="Elk gestempeld bewijsstuk maakt je zichtbaarder en betrouwbaarder."
      />
      <div className="space-y-5 px-5 py-5 sm:px-7">
        <Paper tilt={-0.5} warm className="flex flex-wrap items-center gap-6 p-6">
          <Tape pos="tl" />
          <Tape pos="br" />
          <div
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center leading-none"
            style={{
              background: C.spot,
              color: C.cardWarm,
              border: `2px solid ${C.ink}`,
              transform: "rotate(-4deg)",
            }}
            aria-hidden="true"
          >
            <span className="text-[34px] font-bold" style={{ ...hand }}>
              {pct}%
            </span>
            <span className="text-[9px] font-bold uppercase" style={{ ...type }}>
              gestempeld
            </span>
          </div>
          <div className="min-w-[180px] flex-1">
            <p
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase"
              style={{ ...type, color: C.spot }}
            >
              <BadgeCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[26px]" style={{ ...hand, color: C.ink }}>
              {verified} van {total} geverifieerd
            </p>
            <p className="mt-1 text-[12.5px]" style={{ ...body, color: C.sub }}>
              Nog {total - verified} bewijsstuk{total - verified === 1 ? "" : "ken"} te gaan voor
              een volledige map.
            </p>
          </div>
        </Paper>

        {expiring && (
          <Paper
            tilt={0.4}
            className="flex flex-wrap items-center gap-4 p-4"
            style={{ background: C.warnSoft }}
          >
            <span role="alert" className="contents">
              <AlertTriangle
                size={22}
                style={{ color: C.warn }}
                className="shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-[180px] flex-1">
                <p className="text-[15px]" style={{ ...hand, color: C.ink }}>
                  {expiring.naam} verloopt binnenkort
                </p>
                <p className="text-[12.5px]" style={{ ...body, color: C.sub }}>
                  {expiring.detail}. Vernieuw op tijd om je stempel te behouden.
                </p>
              </div>
              <button
                onClick={() => onGo("acties")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-bold uppercase transition-transform active:translate-y-0.5 ${RING}`}
                style={{
                  ...type,
                  background: C.warn,
                  color: C.cardWarm,
                  boxShadow: `2px 2px 0 0 ${C.ink}`,
                }}
              >
                Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </span>
          </Paper>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <Paper
                key={c.naam}
                tilt={(i % 2 === 0 ? -1 : 1) * 0.6}
                className="flex items-center gap-3.5 p-4"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center"
                  style={{
                    background: t.soft,
                    border: `2px solid ${t.fg}`,
                    transform: "rotate(-3deg)",
                  }}
                >
                  <Icon size={20} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold" style={{ ...body, color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ ...body, color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusStamp status={c.status} />
              </Paper>
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
        kicker="Takenlijst"
        title="Volgende acties"
        sub="Met de hand geordend op urgentie — streep af en blijf in beweging."
      />
      <div className="space-y-4 px-5 py-5 sm:px-7">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.spot : C.info;
          const soft = warn ? C.spotSoft : C.infoSoft;
          return (
            <Paper
              key={a.titel}
              tilt={i % 2 === 0 ? -0.6 : 0.6}
              className="flex flex-wrap items-start gap-4 p-4"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center text-[20px] font-bold"
                style={{
                  ...hand,
                  background: soft,
                  color: fg,
                  border: `2px solid ${C.ink}`,
                  transform: "rotate(-4deg)",
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ ...type, color: fg }}
                >
                  {warn ? "Waarschuwing" : "Kans"}
                </p>
                <p className="mt-0.5 text-[17px] leading-tight" style={{ ...hand, color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[11.5px] font-bold uppercase transition-transform active:translate-y-0.5 ${RING}`}
                style={{
                  ...type,
                  background: warn ? C.spot : C.ink,
                  color: C.cardWarm,
                  boxShadow: `2px 2px 0 0 ${C.ink}`,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </Paper>
          );
        })}

        <Paper tilt={-0.4} className="flex items-center gap-3 p-4" style={{ background: C.okSoft }}>
          <Check size={18} strokeWidth={2.8} style={{ color: C.ok }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ ...body, color: C.inkSoft }}>
            Verder is alles bijgewerkt. Nieuwe kansen komen hier vanzelf op het prikbord.
          </p>
        </Paper>
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

  return (
    <div>
      <PageHead
        kicker="Kasboek"
        title="Facturen"
        sub="Je omzet met de hand bijgehouden — binnen en onderweg."
        right={
          <button
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11.5px] font-bold uppercase transition-transform active:translate-y-0.5 ${RING}`}
            style={{
              ...type,
              background: C.spot,
              color: C.cardWarm,
              boxShadow: `3px 3px 0 0 ${C.ink}`,
            }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-5 py-5 sm:px-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Paper tilt={-0.6} warm className="p-5">
            <Tape pos="tl" />
            <p
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ ...type, color: C.ok }}
            >
              Ontvangen
            </p>
            <p className="mt-1 text-[40px] leading-none" style={{ ...hand, color: C.ink }}>
              € {betaald.toLocaleString("nl-NL")}
            </p>
          </Paper>
          <Paper tilt={0.6} warm className="p-5">
            <Tape pos="tr" />
            <p
              className="text-[11px] font-bold uppercase tracking-wide"
              style={{ ...type, color: C.warn }}
            >
              Openstaand
            </p>
            <p className="mt-1 text-[40px] leading-none" style={{ ...hand, color: C.ink }}>
              € {open.toLocaleString("nl-NL")}
            </p>
          </Paper>
        </div>

        <Paper tilt={-0.3} className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-wide"
                style={{
                  ...type,
                  background: C.paperAlt,
                  color: C.inkSoft,
                  borderBottom: `2px solid ${C.ink}`,
                }}
              >
                <th className="px-4 py-3">Nummer</th>
                <th className="px-4 py-3">Klant</th>
                <th className="hidden px-4 py-3 sm:table-cell">Datum</th>
                <th className="px-4 py-3 text-right">Bedrag</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const t = factuurTone(f.status);
                return (
                  <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1.5px dashed ${C.line}` }}>
                    <td
                      className="px-4 py-3.5 text-[12px] font-bold"
                      style={{ ...type, color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ ...body, color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] sm:table-cell"
                      style={{ ...type, color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[14px] font-bold"
                      style={{ ...hand, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-bold uppercase"
                        style={{
                          ...type,
                          color: t.fg,
                          background: t.soft,
                          border: `1.5px solid ${t.fg}`,
                        }}
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Paper>
      </div>
    </div>
  );
}
