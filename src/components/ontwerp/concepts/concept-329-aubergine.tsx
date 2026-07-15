"use client";

// Concept 329 — "Aubergine" · rijk pruim/aubergine premium palet, editoriaal en volwassen.
// Een durvend-maar-smaakvol kleurverhaal: diepe aubergine als basis, zacht blush/mauve als rust,
// warm abrikoos als één levendig accent. De verfijning zit in de kleur en de serif-display — niet in
// drukte. Voor gevoelige documenten telt vertrouwen: een kalme, premium omgeving straalt zorg uit,
// en de verklaarbare matching plus statuschips (label + icoon) blijven glashelder op de donkere basis.
// Fonts: --font-lab-fraunces (serif display/koppen) + --font-lab-inter (UI/tekst, tabular-nums cijfers).

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
  Command,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  BadgeCheck,
  MapPin,
  Sparkles,
  Send,
  Plus,
  RotateCcw,
  CircleAlert,
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

/* ---------- Palet (diepe aubergine, blush, abrikoos) ---------- */

const C = {
  base: "#1b1020",
  baseAlt: "#160d1b",
  panel: "#241531",
  panelAlt: "#2c1a3a",
  card: "#301d40",
  cardHi: "#3a2450",
  line: "#43305a",
  lineSoft: "#382546",
  ink: "#f6eef8",
  sub: "#cdb4dc",
  faint: "#9a7fae",
  accent: "#ffb27a", // warm abrikoos
  accentDeep: "#f7955a",
  accentSoft: "#3a2a2e",
  fuchsia: "#f66fce", // elektrische highlight, spaarzaam
  fuchsiaSoft: "#3a1f3c",
  ok: "#7ee0a8",
  okSoft: "#1f3a2f",
  warn: "#ffca7a",
  warnSoft: "#3a2f24",
  alert: "#ff9a9a",
  alertSoft: "#3a2129",
  info: "#c9a7ff",
  infoSoft: "#2c2246",
};

const display = { fontFamily: "var(--font-lab-fraunces), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-inter), system-ui, sans-serif" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb27a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b1020]";

/* ---------- Status → betekenis (label + icoon + kleur) ---------- */

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

/* ---------- Kleine bouwstenen ---------- */

function StatusPill({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...body, color: t.fg, background: t.soft, border: `1px solid ${t.fg}33` }}
    >
      <Icon size={12} strokeWidth={2.4} aria-hidden="true" />
      {t.label}
    </span>
  );
}

function Spark({ data, color = C.accent }: { data: number[]; color?: string }) {
  const w = 92;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const id = `au-${color.replace("#", "")}`;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />}
    </svg>
  );
}

function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <span
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth="3.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={C.accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
        />
      </svg>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...body, color: C.accent }}>
        {value}
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
    <div
      className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-6"
      style={{ borderColor: C.line }}
    >
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.24em]"
          style={{ ...body, color: C.accent }}
        >
          {kicker}
        </p>
        <h1
          className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight"
          style={{ ...display, color: C.ink }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept329() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const [palette, setPalette] = useState(false);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  // Skeleton bij scherm-wissel — kort, premium.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 360);
    return () => window.clearTimeout(t);
  }, [screen]);

  // ⌘K / Ctrl+K command-menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(130% 100% at 8% -10%, ${C.panelAlt}, ${C.base} 55%, ${C.baseAlt})`,
      }}
    >
      <style>{`@keyframes au-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes au-pulse{0%,100%{opacity:.55}50%{opacity:.9}}`}</style>

      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[248px] shrink-0 flex-col px-3.5 py-5 md:flex"
          style={{ borderRight: `1px solid ${C.line}`, background: C.baseAlt }}
        >
          <div className="flex items-center gap-3 px-2 pb-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold"
              style={{
                ...display,
                color: C.base,
                background: `linear-gradient(140deg, ${C.accent}, ${C.fuchsia})`,
              }}
              aria-hidden="true"
            >
              Z
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold" style={display}>
                Aubergine
              </div>
              <div className="truncate text-[11px]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <button
            onClick={() => setPalette(true)}
            className={`mb-5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] transition-colors hover:bg-[#301d40] ${RING}`}
            style={{ border: `1px solid ${C.line}`, background: C.panel, color: C.sub }}
          >
            <Search size={14} aria-hidden="true" />
            <span>Zoek of spring…</span>
            <kbd
              className="ml-auto flex items-center gap-0.5 rounded px-1 text-[10px]"
              style={{ border: `1px solid ${C.line}`, color: C.faint }}
            >
              <Command size={9} aria-hidden="true" />K
            </kbd>
          </button>

          <p
            className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: C.faint }}
          >
            Werkruimte
          </p>
          <nav className="flex flex-col gap-1" aria-label="Hoofdnavigatie">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.ink : C.sub,
                    background: on ? C.card : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <div
              className="rounded-2xl p-3.5"
              style={{ border: `1px solid ${C.line}`, background: C.panel }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ color: C.base, background: C.accent }}
                  aria-hidden="true"
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="truncate text-[11px]" style={{ color: C.faint }}>
                    {PROFIEL.plaats}
                  </div>
                </div>
              </div>
              <div
                className="mt-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ background: C.okSoft, color: C.ok }}
              >
                <ShieldCheck size={13} strokeWidth={2.4} aria-hidden="true" />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-14 shrink-0 items-center gap-3 border-b px-5"
            style={{ borderColor: C.line }}
          >
            <span className="hidden text-[12px] sm:inline" style={{ color: C.faint }}>
              Werkruimte
            </span>
            <ChevronRight
              size={13}
              aria-hidden="true"
              className="hidden sm:inline"
              style={{ color: C.faint }}
            />
            <span className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
              {SCREENS.find((s) => s.key === screen)?.label ?? "Opdracht"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setPalette(true)}
                aria-label="Snel zoeken"
                className={`rounded-lg p-2 transition-colors hover:bg-[#301d40] ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Search size={15} aria-hidden="true" />
              </button>
              <button
                aria-label="Meldingen"
                className={`relative rounded-lg p-2 transition-colors hover:bg-[#301d40] ${RING}`}
                style={{ border: `1px solid ${C.line}`, color: C.sub }}
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                  style={{ background: C.fuchsia }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto border-b px-3 py-2.5 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors ${RING}`}
                  style={{
                    color: on ? C.accent : C.sub,
                    background: on ? C.accentSoft : "transparent",
                    border: `1px solid ${on ? `${C.accent}55` : "transparent"}`,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div
            key={screen}
            className="flex-1 overflow-y-auto"
            style={{ animation: "au-fade 0.34s ease" }}
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
        </main>
      </div>

      {/* Command-menu */}
      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onPick={(k) => {
            setScreen(k);
            setPalette(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------- Skeleton (loading) ---------- */

function ScreenSkeleton() {
  return (
    <div className="px-6 py-6" role="status" aria-live="polite">
      <span className="sr-only">Scherm wordt geladen…</span>
      <div
        className="h-6 w-48 rounded-lg"
        style={{ background: C.card, animation: "au-pulse 1.3s ease-in-out infinite" }}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl"
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              animation: "au-pulse 1.3s ease-in-out infinite",
            }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl"
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              animation: "au-pulse 1.3s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Command-menu ---------- */

function CommandPalette({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (k: ScreenKey) => void;
}) {
  const [q, setQ] = useState("");
  const results = SCREENS.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div
      className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-24"
      style={{ background: "rgba(15,8,20,0.6)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Snel navigeren"
      >
        <div
          className="flex items-center gap-2.5 border-b px-4 py-3"
          style={{ borderColor: C.line }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.accent }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spring naar een scherm…"
            aria-label="Zoek scherm"
            className="w-full bg-transparent text-[14px] outline-none"
            style={{ color: C.ink }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{ border: `1px solid ${C.line}`, color: C.faint }}
          >
            esc
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px]" style={{ color: C.faint }}>
              Geen scherm gevonden voor “{q}”.
            </li>
          ) : (
            results.map((s) => {
              const Icon = NAV_ICONS[s.key];
              return (
                <li key={s.key}>
                  <button
                    onClick={() => onPick(s.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors hover:bg-[#301d40] ${RING}`}
                    style={{ color: C.ink }}
                  >
                    <Icon size={16} aria-hidden="true" style={{ color: C.accent }} />
                    {s.label}
                    <ChevronRight
                      size={14}
                      aria-hidden="true"
                      className="ml-auto"
                      style={{ color: C.faint }}
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>
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
  const warn = ACTIES[0];
  // Activiteit-paneel demonstreert error → laden → geladen (retry werkt).
  const [feed, setFeed] = useState<"error" | "loading" | "ok">("error");
  const retry = () => {
    setFeed("loading");
    window.setTimeout(() => setFeed("ok"), 700);
  };

  return (
    <div>
      <PageHead
        kicker="Overzicht"
        title={`Goedendag, ${PROFIEL.naam.split(" ")[0]}`}
        sub={`${PROFIEL.rol} · ${PROFIEL.plaats}`}
        right={
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ color: C.ok, background: C.okSoft, border: `1px solid ${C.ok}33` }}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
        }
      />

      <div className="space-y-6 px-6 py-6">
        {/* KPI's */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11.5px]" style={{ color: C.sub }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p
                className="mt-2 text-[26px] font-semibold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} color={k.up ? C.accent : C.warn} />
              </div>
            </div>
          ))}
        </div>

        {/* Volgende actie + activiteit */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {warn && (
            <div
              className="rounded-2xl p-5 lg:col-span-2"
              style={{
                background: `linear-gradient(135deg, ${C.panelAlt}, ${C.card})`,
                border: `1px solid ${C.warn}44`,
              }}
              role="alert"
            >
              <p
                className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.warn }}
              >
                <Sparkles size={13} aria-hidden="true" /> Volgende beste actie
              </p>
              <h2
                className="mt-2 text-[19px] font-semibold leading-snug"
                style={{ ...display, color: C.ink }}
              >
                {warn.titel}
              </h2>
              <p className="mt-1.5 max-w-md text-[13px]" style={{ color: C.sub }}>
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{ background: C.accent, color: C.base }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Activiteit — error/loading/ok */}
          <div
            className="rounded-2xl p-4"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <h3 className="mb-3 text-[13px] font-semibold" style={{ color: C.ink }}>
              Recente berichten
            </h3>
            {feed === "error" && (
              <div className="py-3 text-center" role="alert">
                <CircleAlert
                  size={22}
                  className="mx-auto"
                  style={{ color: C.alert }}
                  aria-hidden="true"
                />
                <p className="mt-2 text-[12.5px]" style={{ color: C.sub }}>
                  Berichten konden niet worden geladen.
                </p>
                <button
                  onClick={retry}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#3a2450] ${RING}`}
                  style={{ border: `1px solid ${C.line}`, color: C.ink }}
                >
                  <RotateCcw size={13} aria-hidden="true" /> Opnieuw proberen
                </button>
              </div>
            )}
            {feed === "loading" && (
              <div className="space-y-3 py-1" role="status" aria-live="polite">
                <span className="sr-only">Laden…</span>
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className="h-8 w-8 shrink-0 rounded-full"
                      style={{ background: C.cardHi, animation: "au-pulse 1.3s infinite" }}
                    />
                    <div className="flex-1 space-y-1.5">
                      <span
                        className="block h-3 rounded-full"
                        style={{
                          background: C.cardHi,
                          width: "70%",
                          animation: "au-pulse 1.3s infinite",
                        }}
                      />
                      <span
                        className="block h-2.5 rounded-full"
                        style={{
                          background: C.cardHi,
                          width: "90%",
                          animation: "au-pulse 1.3s infinite",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {feed === "ok" && (
              <ul className="space-y-2.5">
                {BERICHTEN.slice(0, 3).map((b) => (
                  <li key={b.van} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: C.fuchsiaSoft, color: C.fuchsia }}
                      aria-hidden="true"
                    >
                      {b.initialen}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.accent }}
                            aria-label="ongelezen"
                          />
                        )}
                      </div>
                      <p className="truncate text-[11.5px]" style={{ color: C.faint }}>
                        {b.preview}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums" style={{ color: C.faint }}>
                      {b.tijd}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Beste matches */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Beste matches
            </h2>
            <button
              onClick={() => onGo("marktplaats")}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold ${RING}`}
              style={{ color: C.accent }}
            >
              Alles <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OPDRACHTEN.map((o) => (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className={`rounded-2xl p-4 text-left transition-colors hover:bg-[#3a2450] ${RING}`}
                style={{ background: C.card, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <MatchRing value={o.match} />
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: C.faint }}
                  >
                    {o.id}
                  </span>
                </div>
                <p
                  className="mt-3 text-[14.5px] font-semibold leading-snug"
                  style={{ color: C.ink }}
                >
                  {o.titel}
                </p>
                <p
                  className="mt-1 flex items-center gap-1 truncate text-[12px]"
                  style={{ color: C.sub }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: C.accent }}>
                    {o.tarief}
                  </span>
                  <span className="text-[11.5px]" style={{ color: C.faint }}>
                    {o.uren}
                  </span>
                </div>
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
  const [chip, setChip] = useState("Alle");
  const [expanded, setExpanded] = useState<string | null>(OPDRACHTEN[0]?.id ?? null);
  const chips = ["Alle", "BIG", "Avond", "GGZ", "Dagdienst"];
  const filtered = OPDRACHTEN.filter((o) => {
    const mQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const mC = chip === "Alle" || o.tags.some((t) => t.toLowerCase().includes(chip.toLowerCase()));
    return mQ && mC;
  });

  return (
    <div>
      <PageHead
        kicker="De markt"
        title="Opdrachten"
        sub="Verklaarbaar gesorteerd op basis van je geverifieerde profiel."
      />
      <div className="px-6 py-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3">
          <div
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten zoeken"
              className="w-full bg-transparent text-[13.5px] outline-none"
              style={{ color: C.ink }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const on = c === chip;
              return (
                <button
                  key={c}
                  onClick={() => setChip(c)}
                  aria-pressed={on}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${RING}`}
                  style={{
                    color: on ? C.base : C.sub,
                    background: on ? C.accent : C.card,
                    border: `1px solid ${on ? C.accent : C.line}`,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.panel }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: C.card, border: `1px solid ${C.line}` }}
              aria-hidden="true"
            >
              <Search size={20} style={{ color: C.faint }} />
            </span>
            <p className="mt-4 text-[15px] font-semibold" style={{ ...display, color: C.ink }}>
              Geen opdrachten gevonden
            </p>
            <p className="mt-1 max-w-xs text-[12.5px]" style={{ color: C.sub }}>
              Niets komt overeen met je zoekopdracht. Wis het filter en probeer opnieuw.
            </p>
            <button
              onClick={() => {
                setQ("");
                setChip("Alle");
              }}
              className={`mt-4 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#3a2450] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Filters wissen
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => {
              const open = expanded === o.id;
              return (
                <li
                  key={o.id}
                  className="overflow-hidden rounded-2xl"
                  style={{
                    background: C.card,
                    border: `1px solid ${open ? `${C.accent}55` : C.line}`,
                  }}
                >
                  <div className="flex items-start gap-4 p-4">
                    <MatchRing value={o.match} size={58} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10px] font-semibold tabular-nums"
                          style={{ color: C.faint }}
                        >
                          {o.id}
                        </span>
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: C.infoSoft, color: C.info }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-[15px] font-semibold" style={{ color: C.ink }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                        <span className="font-bold tabular-nums" style={{ color: C.accent }}>
                          {o.tarief}
                        </span>
                        <span style={{ color: C.sub }}>{o.uren}</span>
                        <span style={{ color: C.sub }}>{o.start}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <button
                      onClick={() => setExpanded(open ? null : o.id)}
                      aria-expanded={open}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors hover:bg-[#3a2450] ${RING}`}
                      style={{ color: C.sub }}
                    >
                      Waarom deze match
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className="transition-transform"
                        style={{ transform: open ? "rotate(180deg)" : "none" }}
                      />
                    </button>
                    <button
                      onClick={() => onOpen(o.id)}
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                      style={{ background: C.accent, color: C.base }}
                    >
                      Bekijk opdracht <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </div>
                  {open && (
                    <div
                      className="grid grid-cols-1 gap-4 border-t px-4 py-4 sm:grid-cols-2"
                      style={{ borderColor: C.line, animation: "au-fade 0.28s ease" }}
                    >
                      <div>
                        <p
                          className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                          style={{ color: C.ok }}
                        >
                          <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {o.redenen.plus.map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-2 text-[12.5px]"
                              style={{ color: C.ink }}
                            >
                              <Check
                                size={14}
                                strokeWidth={2.6}
                                style={{ color: C.ok }}
                                className="mt-0.5 shrink-0"
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
                          style={{ color: C.warn }}
                        >
                          <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" />{" "}
                          Aandachtspunten
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {o.redenen.min.map((r) => (
                            <li
                              key={r}
                              className="flex items-start gap-2 text-[12.5px]"
                              style={{ color: C.sub }}
                            >
                              <AlertTriangle
                                size={14}
                                strokeWidth={2.4}
                                style={{ color: C.warn }}
                                className="mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
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
              className={`rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-colors hover:bg-[#3a2450] ${RING}`}
              style={{ border: `1px solid ${C.line}`, color: C.sub }}
            >
              Terug
            </button>
            <button
              onClick={react}
              disabled={state !== "idle"}
              aria-live="polite"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-transform active:scale-[0.98] disabled:opacity-90 ${RING}`}
              style={{ background: state === "sent" ? C.ok : C.accent, color: C.base }}
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

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Kerncijfers */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Tarief", v: opdracht.tarief },
              { l: "Omvang", v: opdracht.uren },
              { l: "Start", v: opdracht.start },
              { l: "Match", v: `${opdracht.match}%` },
            ].map((m) => (
              <div
                key={m.l}
                className="rounded-2xl p-4"
                style={{ background: C.card, border: `1px solid ${C.line}` }}
              >
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.faint }}
                >
                  {m.l}
                </p>
                <p
                  className="mt-1.5 text-[16px] font-semibold tabular-nums"
                  style={{ ...display, color: C.ink }}
                >
                  {m.v}
                </p>
              </div>
            ))}
          </div>

          {/* Verklaarbare match */}
          <div
            className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <h3 className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              Waarom deze match
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              Transparant onderbouwd op basis van je geverifieerde profiel.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.ok }}
                >
                  <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.okSoft }}
                      >
                        <Check
                          size={11}
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
                  className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.warn }}
                >
                  <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
                </p>
                <ul className="mt-2.5 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <span
                        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                        style={{ background: C.warnSoft }}
                      >
                        <AlertTriangle
                          size={10}
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
          </div>
        </div>

        {/* Compliance-eis */}
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
          >
            <p
              className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.accent }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> Compliance-eis
            </p>
            <p className="mt-2 text-[13px]" style={{ color: C.sub }}>
              Deze opdracht vereist onderstaande credentials. Je voldoet aan de kern-eisen.
            </p>
            <ul className="mt-3 space-y-2.5">
              {CREDENTIALS.slice(0, 3).map((c) => {
                const t = credTone(c.status);
                const Icon = t.Icon;
                return (
                  <li key={c.naam} className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: t.soft }}
                    >
                      <Icon size={15} style={{ color: t.fg }} aria-hidden="true" />
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px]"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <StatusPill status={c.status} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.line}` }}
          >
            <div className="flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: C.infoSoft, color: C.info }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
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
        sub="Je vertrouwenslaag — geverifieerde bewijsstukken maken je zichtbaar en betrouwbaar."
      />
      <div className="space-y-6 px-6 py-6">
        {/* Vertrouwens-meter */}
        <div
          className="flex flex-wrap items-center gap-5 rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${C.panelAlt}, ${C.card})`,
            border: `1px solid ${C.line}`,
          }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: C.okSoft, border: `1px solid ${C.ok}44` }}
          >
            <ShieldCheck size={26} style={{ color: C.ok }} aria-hidden="true" />
          </div>
          <div className="min-w-[180px] flex-1">
            <p className="text-[16px] font-semibold" style={{ ...display, color: C.ink }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
              <span className="font-semibold tabular-nums" style={{ color: C.ink }}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="font-semibold tabular-nums" style={{ color: C.ink }}>
                {total}
              </span>{" "}
              bewijsstukken geverifieerd
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: C.line }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.ok }} />
            </div>
          </div>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-[15px] font-bold tabular-nums"
            style={{ ...display, background: C.okSoft, color: C.ok }}
          >
            {pct}%
          </span>
        </div>

        {/* Verloop-waarschuwing + herstelactie */}
        {expiring && (
          <div
            className="flex flex-wrap items-center gap-4 rounded-2xl p-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}44` }}
            role="alert"
          >
            <AlertTriangle
              size={20}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[180px] flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
              style={{ background: C.warn, color: C.base }}
            >
              Vernieuwen <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Credential-lijst */}
        <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 px-4 py-4"
                style={{
                  background: C.card,
                  borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.soft }}
                >
                  <Icon size={18} style={{ color: t.fg }} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {c.naam}
                  </p>
                  <p className="text-[11.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusPill status={c.status} />
              </div>
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
        kicker="Prioriteiten"
        title="Volgende acties"
        sub="Wat nu aandacht vraagt — op volgorde van urgentie."
      />
      <div className="space-y-3 px-6 py-6">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const fg = warn ? C.warn : C.info;
          const soft = warn ? C.warnSoft : C.infoSoft;
          return (
            <div
              key={a.titel}
              className="flex flex-wrap items-start gap-4 rounded-2xl p-4"
              style={{ background: C.card, border: `1px solid ${warn ? `${C.warn}44` : C.line}` }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold tabular-nums"
                style={{ background: soft, color: fg }}
              >
                {i + 1}
              </span>
              <div className="min-w-[180px] flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: fg }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </p>
                <p className="mt-0.5 text-[14px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
                style={{
                  background: warn ? C.warn : C.accent,
                  color: C.base,
                }}
              >
                {a.cta} <ChevronRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ background: C.okSoft, border: `1px solid ${C.ok}33` }}
        >
          <Check size={16} strokeWidth={2.6} style={{ color: C.ok }} aria-hidden="true" />
          <p className="text-[12.5px]" style={{ color: C.sub }}>
            Verder is alles bijgewerkt. Nieuwe kansen verschijnen hier vanzelf.
          </p>
        </div>
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
        kicker="Kassa"
        title="Facturen"
        sub="Je omzet-overzicht — status, klant en bedrag in één blik."
        right={
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-transform active:scale-[0.98] ${RING}`}
            style={{ background: C.accent, color: C.base }}
          >
            <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="space-y-5 px-6 py-6">
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div
            className="rounded-2xl p-4"
            style={{ background: C.okSoft, border: `1px solid ${C.ok}33` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ok }}
            >
              Ontvangen
            </p>
            <p
              className="mt-1 text-[20px] font-semibold tabular-nums"
              style={{ ...display, color: C.ok }}
            >
              € {betaald.toLocaleString("nl-NL")}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}33` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.warn }}
            >
              Openstaand
            </p>
            <p
              className="mt-1 text-[20px] font-semibold tabular-nums"
              style={{ ...display, color: C.warn }}
            >
              € {open.toLocaleString("nl-NL")}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${C.line}` }}>
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ background: C.panel, color: C.faint }}
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
                  <tr
                    key={f.nr}
                    style={{
                      background: C.card,
                      borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}`,
                    }}
                  >
                    <td
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                      style={{ color: C.sub }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td
                      className="hidden px-4 py-3.5 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.faint }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.soft, border: `1px solid ${t.fg}33` }}
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
        </div>
      </div>
    </div>
  );
}
