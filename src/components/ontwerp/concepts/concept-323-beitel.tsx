"use client";

// Concept 323 — "Beitel" · Neo-brutalist-refined editorial.
// Massieve 2px zwarte kaders, harde offset-schaduw zonder blur, mono-uppercase micro-labels en
// primaire kleurvlakken als codering. Ruw-maar-geordend: alles zit strak op een grid, met hoog
// contrast en dikke focus-ringen. Voor gevoelige documenten en verificatie geeft die harde,
// eerlijke structuur vertrouwen — niets verstopt zich achter zachte schaduwen; status is een blok.
// Fonts: --font-lab-space (koppen) + --font-lab-mono (labels/cijfers) + --font-lab-inter (tekst).

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Check,
  Plus,
  Zap,
  MapPin,
  ChevronRight,
  RefreshCw,
  CloudOff,
  Send,
  LayoutGrid,
  Compass,
  FileText,
  ListChecks,
  Receipt,
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

/* ---------- Palet & typografie ---------- */

const C = {
  canvas: "#f3efe4",
  paper: "#ffffff",
  ink: "#141310",
  sub: "#4c4a42",
  faint: "#7c7a70",
  accent: "#2b2bf0",
  accentText: "#ffffff",
  yellow: "#ffd21e",
  greenFg: "#0f7a44",
  greenBg: "#c9f0d6",
  amberFg: "#9a5b00",
  amberBg: "#ffe4b0",
  redFg: "#c1271f",
  redBg: "#ffd5d2",
  blueBg: "#d8dcff",
};

const head = { fontFamily: "var(--font-lab-space), sans-serif" };
const mono = { fontFamily: "var(--font-lab-mono), monospace" };
const body = { fontFamily: "var(--font-lab-inter), sans-serif" };

const SHADOW = "4px 4px 0 #141310";
const SHADOW_SM = "3px 3px 0 #141310";
const BORDER = "2px solid #141310";

const RING =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2b2bf0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe4]";

/* ---------- Status → codering (kleurvlak + label + icoon) ---------- */

type CredMeta = { label: string; fg: string; bg: string; Icon: typeof ShieldCheck };

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "GEVERIFIEERD", fg: C.greenFg, bg: C.greenBg, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "IN BEOORDELING", fg: C.accent, bg: C.blueBg, Icon: Clock };
    case "EXPIRING":
      return { label: "VERLOOPT", fg: C.amberFg, bg: C.amberBg, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "AFGEWEZEN", fg: C.redFg, bg: C.redBg, Icon: XCircle };
  }
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Bouwstenen ---------- */

function Label({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-[0.16em]"
      style={{ ...mono, color: color ?? C.faint }}
    >
      {children}
    </span>
  );
}

// Hard-omkaderde box met offset-schaduw.
function Box({
  children,
  className,
  bg,
  shadow = SHADOW,
  style,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  shadow?: string;
  style?: React.CSSProperties;
  role?: string;
}) {
  return (
    <div
      role={role}
      className={className}
      style={{ background: bg ?? C.paper, border: BORDER, boxShadow: shadow, ...style }}
    >
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ ...mono, color: C.ink, background: m.bg, border: BORDER }}
    >
      <Icon size={12} strokeWidth={2.6} color={m.fg} aria-hidden="true" />
      {m.label}
    </span>
  );
}

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Blokkige knop met harde schaduw en "indruk"-interactie.
function BrutalButton({
  children,
  onClick,
  disabled,
  filled,
  className,
  ariaLive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  filled?: boolean;
  className?: string;
  ariaLive?: "polite";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-live={ariaLive}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-90 ${RING} ${className ?? ""}`}
      style={{
        ...head,
        border: BORDER,
        background: filled ? C.accent : C.paper,
        color: filled ? C.accentText : C.ink,
        boxShadow: SHADOW_SM,
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Navigatie ---------- */

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

/* ---------- Hoofdcomponent ---------- */

export function Concept323() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openDetail = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`
        @keyframes bt-in { from { opacity: 0; transform: translate(4px,4px); } to { opacity: 1; transform: translate(0,0); } }
        @keyframes bt-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
      `}</style>

      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6">
        {/* Kop */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center text-[16px] font-bold"
              style={{ ...head, background: C.yellow, border: BORDER, boxShadow: SHADOW_SM }}
              aria-hidden="true"
            >
              Z
            </span>
            <div>
              <p className="text-[18px] font-bold leading-none" style={head}>
                BEITEL
              </p>
              <Label>ZZP · ontwerp-lab</Label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-bold leading-none" style={head}>
                {PROFIEL.naam}
              </p>
              <span
                className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em]"
                style={{ ...mono, background: C.greenBg, border: BORDER }}
              >
                <ShieldCheck size={10} strokeWidth={2.6} color={C.greenFg} aria-hidden="true" />{" "}
                {PROFIEL.trust}
              </span>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center text-[13px] font-bold"
              style={{
                ...mono,
                background: C.accent,
                color: C.accentText,
                border: BORDER,
                boxShadow: SHADOW_SM,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </header>

        {/* Nav — blokkige tabs */}
        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Schermen">
          {SCREENS.map((s) => {
            const Icon = NAV_ICONS[s.key];
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[12.5px] font-bold uppercase tracking-[0.04em] transition-all duration-100 ${RING}`}
                style={{
                  ...head,
                  border: BORDER,
                  background: on ? C.ink : C.paper,
                  color: on ? "#fff" : C.ink,
                  boxShadow: on ? "none" : SHADOW_SM,
                  transform: on ? "translate(2px,2px)" : undefined,
                }}
              >
                <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div key={screen} className="mt-5" style={{ animation: "bt-in 0.28s ease" }}>
          {screen === "dashboard" && <Dashboard onOpen={openDetail} onGo={setScreen} />}
          {screen === "marktplaats" && <Marktplaats onOpen={openDetail} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie onGo={setScreen} />}
          {screen === "acties" && <Acties onGo={setScreen} />}
          {screen === "facturen" && <Facturen />}
        </div>
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

  return (
    <div className="space-y-4">
      {/* KPI-strook */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Box key={k.label} className="p-4" bg={i === 0 ? C.yellow : C.paper}>
            <div className="flex items-center justify-between">
              <Label color={C.ink}>{k.label}</Label>
              <span
                className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-bold tabular-nums"
                style={{
                  ...mono,
                  color: C.ink,
                  background: k.up ? C.greenBg : C.amberBg,
                  border: BORDER,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} strokeWidth={3} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={3} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p className="mt-2 text-[30px] font-bold tabular-nums leading-none" style={head}>
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={C.ink} />
            </div>
          </Box>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Next action */}
        {warn && (
          <Box className="flex flex-col p-5" bg={C.accent} style={{ color: "#fff" }}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5"
                style={{ background: C.yellow, animation: "bt-blink 1.4s steps(1) infinite" }}
                aria-hidden="true"
              />
              <Label color="#c9cbff">Volgende beste actie</Label>
            </div>
            <p className="mt-3 text-[24px] font-bold leading-tight" style={head}>
              {warn.titel}
            </p>
            <p className="mt-1.5 max-w-md text-[13.5px] leading-snug" style={{ color: "#dcdcff" }}>
              {warn.detail}
            </p>
            <div className="mt-auto pt-4">
              <button
                onClick={() => onGo("verificatie")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] ${RING}`}
                style={{
                  ...head,
                  background: C.yellow,
                  color: C.ink,
                  border: BORDER,
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.35)",
                }}
              >
                {warn.cta} <ArrowRight size={15} strokeWidth={2.8} aria-hidden="true" />
              </button>
            </div>
          </Box>
        )}

        {/* Vertrouwensblok */}
        <Box className="p-5">
          <Label>Vertrouwensniveau</Label>
          <p
            className="mt-2 flex items-center gap-2 text-[20px] font-bold leading-tight"
            style={head}
          >
            <span
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: C.greenBg, border: BORDER }}
            >
              <ShieldCheck size={18} strokeWidth={2.4} color={C.greenFg} aria-hidden="true" />
            </span>
            {PROFIEL.trust}
          </p>
          <ul className="mt-3 divide-y" style={{ borderColor: C.ink }}>
            {CREDENTIALS.slice(0, 3).map((c) => {
              const m = credMeta(c.status);
              const Icon = m.Icon;
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-2 py-2 text-[12.5px]"
                  style={{ borderTop: "1px solid #dedbd0" }}
                >
                  <Icon size={14} strokeWidth={2.4} color={m.fg} aria-hidden="true" />
                  <span className="truncate">{c.naam}</span>
                </li>
              );
            })}
          </ul>
          <BrutalButton className="mt-3 w-full" onClick={() => onGo("verificatie")}>
            Alle bewijsstukken <ChevronRight size={14} strokeWidth={2.8} aria-hidden="true" />
          </BrutalButton>
        </Box>
      </div>

      {/* Matches */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold uppercase tracking-[0.04em]" style={head}>
            Beste matches
          </h2>
          <button
            onClick={() => onGo("marktplaats")}
            className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[12px] font-bold uppercase ${RING}`}
            style={{ ...mono, color: C.accent }}
          >
            Alles <ChevronRight size={13} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {OPDRACHTEN.map((o) => (
            <button key={o.id} onClick={() => onOpen(o.id)} className={`text-left ${RING}`}>
              <Box className="h-full p-4 transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px]">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-1 text-[16px] font-bold tabular-nums leading-none"
                    style={{
                      ...head,
                      background: o.match >= 90 ? C.yellow : C.paper,
                      border: BORDER,
                    }}
                  >
                    {o.match}%
                  </span>
                  <Label>{o.id}</Label>
                </div>
                <p className="mt-3 text-[14.5px] font-bold leading-tight" style={head}>
                  {o.titel}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11.5px]" style={{ color: C.sub }}>
                  <MapPin size={11} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} · {o.tarief}
                </p>
              </Box>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

type SortKey = "match" | "tarief";

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("match");
  const [open, setOpen] = useState<string>(OPDRACHTEN[0]?.id ?? "");

  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sorted = [...filtered].sort((a, b) =>
    sort === "match" ? b.match - a.match : euros(b.tarief) - euros(a.tarief),
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[24px] font-bold leading-none" style={head}>
          MARKTPLAATS
        </h2>
        <div className="flex items-center gap-2">
          <Label>Sorteer</Label>
          {(["match", "tarief"] as SortKey[]).map((s) => {
            const on = s === sort;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-100 ${RING}`}
                style={{
                  ...mono,
                  border: BORDER,
                  background: on ? C.ink : C.paper,
                  color: on ? "#fff" : C.ink,
                  boxShadow: on ? "none" : SHADOW_SM,
                  transform: on ? "translate(2px,2px)" : undefined,
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <Box className="mb-4 flex items-center gap-2.5 px-4 py-3" shadow={SHADOW_SM}>
        <Search size={17} strokeWidth={2.4} color={C.ink} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ZOEK OP TITEL, PLAATS OF OPDRACHTGEVER…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[12.5px] uppercase tracking-[0.04em] outline-none placeholder:text-[#7c7a70]"
          style={{ ...mono, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
          {sorted.length}/{OPDRACHTEN.length}
        </span>
      </Box>

      {sorted.length === 0 ? (
        <Box className="flex flex-col items-center justify-center py-14 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center"
            style={{ background: C.yellow, border: BORDER }}
          >
            <Search size={24} strokeWidth={2.4} color={C.ink} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[18px] font-bold uppercase" style={head}>
            Niets gevonden
          </p>
          <p className="mt-1 max-w-[280px] text-[13px]" style={{ color: C.sub }}>
            Geen opdracht past bij &ldquo;{q}&rdquo;. Wis de zoekopdracht en probeer opnieuw.
          </p>
          <BrutalButton className="mt-4" filled onClick={() => setQ("")}>
            Zoekopdracht wissen
          </BrutalButton>
        </Box>
      ) : (
        <ul className="space-y-4">
          {sorted.map((o) => {
            const isOpen = o.id === open;
            return (
              <li key={o.id}>
                <Box>
                  <button
                    onClick={() => setOpen(isOpen ? "" : o.id)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center gap-4 p-4 text-left ${RING}`}
                  >
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center text-[18px] font-bold tabular-nums"
                      style={{
                        ...head,
                        background: o.match >= 90 ? C.yellow : C.blueBg,
                        border: BORDER,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Label>
                        {o.id} · {o.opdrachtgever}
                      </Label>
                      <p className="truncate text-[17px] font-bold leading-tight" style={head}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 text-[12.5px]"
                        style={{ color: C.sub }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.plaats} ·{" "}
                        {o.tarief} · {o.uren}
                      </p>
                    </div>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ border: BORDER, background: isOpen ? C.ink : C.paper }}
                    >
                      <ChevronRight
                        size={16}
                        strokeWidth={2.6}
                        color={isOpen ? "#fff" : C.ink}
                        aria-hidden="true"
                        style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t px-4 pb-4 pt-3" style={{ borderTop: BORDER }}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-3" style={{ background: C.greenBg, border: BORDER }}>
                          <Label color={C.greenFg}>Waarom een match</Label>
                          <ul className="mt-2 space-y-1.5">
                            {o.redenen.plus.map((r) => (
                              <li key={r} className="flex items-start gap-2 text-[13px]">
                                <Check
                                  size={15}
                                  strokeWidth={2.8}
                                  color={C.greenFg}
                                  className="mt-0.5 shrink-0"
                                  aria-hidden="true"
                                />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3" style={{ background: C.amberBg, border: BORDER }}>
                          <Label color={C.amberFg}>Aandachtspunten</Label>
                          <ul className="mt-2 space-y-1.5">
                            {o.redenen.min.map((r) => (
                              <li key={r} className="flex items-start gap-2 text-[13px]">
                                <AlertTriangle
                                  size={15}
                                  strokeWidth={2.6}
                                  color={C.amberFg}
                                  className="mt-0.5 shrink-0"
                                  aria-hidden="true"
                                />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                            style={{ ...mono, background: C.canvas, border: BORDER }}
                          >
                            {t}
                          </span>
                        ))}
                        <div className="ml-auto">
                          <BrutalButton filled onClick={() => onOpen(o.id)}>
                            Bekijk opdracht{" "}
                            <ArrowRight size={14} strokeWidth={2.8} aria-hidden="true" />
                          </BrutalButton>
                        </div>
                      </div>
                    </div>
                  )}
                </Box>
              </li>
            );
          })}
        </ul>
      )}
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
      <button
        onClick={onBack}
        className={`mb-3 inline-flex items-center gap-1 px-1 py-0.5 text-[12px] font-bold uppercase ${RING}`}
        style={{ ...mono, color: C.accent }}
      >
        <ChevronRight size={13} strokeWidth={2.8} className="rotate-180" aria-hidden="true" /> Terug
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Box className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Label color={C.accent}>
                  {opdracht.id} · {opdracht.opdrachtgever}
                </Label>
                <h1 className="mt-1 text-[26px] font-bold leading-tight" style={head}>
                  {opdracht.titel}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" /> {opdracht.plaats}
                </p>
              </div>
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center text-[22px] font-bold tabular-nums"
                style={{ ...head, background: C.yellow, border: BORDER }}
              >
                {opdracht.match}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4" style={{ border: BORDER }}>
              {[
                { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
                { l: "Omvang", v: opdracht.uren.replace(" u/week", " u/w") },
                { l: "Start", v: opdracht.start.replace("Per ", "") },
                { l: "Match", v: `${opdracht.match}%` },
              ].map((m, i) => (
                <div
                  key={m.l}
                  className="p-3"
                  style={{ borderLeft: i === 0 ? "none" : "2px solid #141310" }}
                >
                  <Label>{m.l}</Label>
                  <p className="mt-1 text-[16px] font-bold tabular-nums" style={head}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </Box>

          <Box className="p-5">
            <h2 className="text-[14px] font-bold uppercase tracking-[0.04em]" style={head}>
              Waarom deze match
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="p-3" style={{ background: C.greenBg, border: BORDER }}>
                <Label color={C.greenFg}>Pluspunten</Label>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.plus.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13px]">
                      <Check
                        size={15}
                        strokeWidth={2.8}
                        color={C.greenFg}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3" style={{ background: C.amberBg, border: BORDER }}>
                <Label color={C.amberFg}>Aandachtspunten</Label>
                <ul className="mt-2 space-y-2">
                  {opdracht.redenen.min.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13px]">
                      <AlertTriangle
                        size={15}
                        strokeWidth={2.6}
                        color={C.amberFg}
                        className="mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Box>
        </div>

        <aside className="space-y-4">
          <Box className="p-5" bg={C.blueBg}>
            <Label color={C.accent}>Compliance-eis</Label>
            <p className="mt-2 text-[15px] font-bold leading-snug" style={head}>
              BIG-registratie geverifieerd vereist
            </p>
            <div
              className="mt-3 flex items-center gap-2 p-3"
              style={{ background: C.greenBg, border: BORDER }}
            >
              <BadgeCheck size={18} strokeWidth={2.4} color={C.greenFg} aria-hidden="true" />
              <span className="text-[12.5px] font-bold">Jouw BIG-registratie is geverifieerd</span>
            </div>
          </Box>

          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className={`flex w-full items-center justify-center gap-2 py-3.5 text-[14px] font-bold uppercase tracking-[0.04em] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-90 ${RING}`}
            style={{
              ...head,
              border: BORDER,
              boxShadow: SHADOW,
              background: state === "sent" ? C.greenBg : C.accent,
              color: state === "sent" ? C.ink : "#fff",
            }}
          >
            {state === "idle" && (
              <>
                <Send size={16} strokeWidth={2.6} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Reactie versturen…"}
            {state === "sent" && (
              <>
                <Check size={16} strokeWidth={3} color={C.greenFg} aria-hidden="true" /> Reactie
                verstuurd
              </>
            )}
          </button>
          <p className="text-center text-[11px]" style={{ ...mono, color: C.faint }}>
            GEM. REACTIETIJD: 6 UUR
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Verificatie ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const pct = Math.round((verified / total) * 100);
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div>
      <h2 className="mb-4 text-[24px] font-bold leading-none" style={head}>
        VERIFICATIE
      </h2>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <Box className="p-5" bg={C.ink} style={{ color: "#fff" }}>
          <Label color="#a9a7ff">Verificatiegraad</Label>
          <p className="mt-2 text-[48px] font-bold tabular-nums leading-none" style={head}>
            {pct}%
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "#c8c6bd" }}>
            {verified} van {total} geverifieerd
          </p>
          <div
            className="mt-4 h-4 w-full"
            style={{ background: "#2a2823", border: "2px solid #fff" }}
          >
            <div className="h-full" style={{ width: `${pct}%`, background: C.yellow }} />
          </div>
        </Box>

        {expiring && (
          <Box className="flex flex-col justify-center p-5" bg={C.amberBg} role="alert">
            <Label color={C.amberFg}>Verloop-waarschuwing</Label>
            <p className="mt-2 text-[19px] font-bold leading-tight" style={head}>
              {expiring.naam} verloopt binnenkort
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.sub }}>
              {expiring.detail}. Vernieuw op tijd om verifieerbaar te blijven voor opdrachtgevers.
            </p>
            <div className="mt-3">
              <BrutalButton onClick={() => onGo("acties")}>
                <Zap size={14} strokeWidth={2.8} aria-hidden="true" /> Herstelactie starten
              </BrutalButton>
            </div>
          </Box>
        )}
      </div>

      <ul className="mt-4 space-y-3">
        {CREDENTIALS.map((c) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <li key={c.naam}>
              <Box className="flex items-center gap-4 p-4" shadow={SHADOW_SM}>
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ background: m.bg, border: BORDER }}
                >
                  <Icon size={20} strokeWidth={2.4} color={m.fg} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold" style={head}>
                    {c.naam}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: C.sub }}>
                    {c.detail}
                  </p>
                </div>
                <StatusChip status={c.status} />
              </Box>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  // Error-state met retry als eerste (deterministisch), daarna de lijst.
  const [failed, setFailed] = useState(true);

  return (
    <div>
      <h2 className="mb-1 text-[24px] font-bold leading-none" style={head}>
        ACTIES
      </h2>
      <p className="mb-4 text-[13px]" style={{ color: C.sub }}>
        De next-action-engine — op volgorde van urgentie.
      </p>

      {failed ? (
        <Box className="flex flex-col items-center justify-center py-12 text-center" bg={C.redBg}>
          <span
            className="flex h-12 w-12 items-center justify-center"
            style={{ background: C.paper, border: BORDER }}
          >
            <CloudOff size={22} strokeWidth={2.4} color={C.redFg} aria-hidden="true" />
          </span>
          <p className="mt-3 text-[17px] font-bold uppercase" style={head}>
            Acties konden niet laden
          </p>
          <p className="mt-1 max-w-[300px] text-[13px]" style={{ color: C.sub }}>
            Er ging iets mis bij het ophalen van je prioriteiten. Probeer het opnieuw.
          </p>
          <BrutalButton className="mt-4" filled onClick={() => setFailed(false)}>
            <RefreshCw size={14} strokeWidth={2.8} aria-hidden="true" /> Opnieuw proberen
          </BrutalButton>
        </Box>
      ) : (
        <ul className="space-y-3">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const bg = warn ? C.amberBg : C.blueBg;
            const fg = warn ? C.amberFg : C.accent;
            return (
              <li key={a.titel}>
                <Box className="flex items-start gap-4 p-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-[16px] font-bold tabular-nums"
                    style={{ ...head, background: bg, border: BORDER }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                      style={{ ...mono, background: bg, border: BORDER, color: C.ink }}
                    >
                      {warn ? (
                        <AlertTriangle size={10} strokeWidth={2.8} color={fg} aria-hidden="true" />
                      ) : (
                        <Zap size={10} strokeWidth={2.8} color={fg} aria-hidden="true" />
                      )}
                      {warn ? "Waarschuwing" : "Kans"}
                    </span>
                    <p className="mt-1 text-[15px] font-bold leading-tight" style={head}>
                      {a.titel}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug" style={{ color: C.sub }}>
                      {a.detail}
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <BrutalButton
                      filled={warn}
                      onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    >
                      {a.cta}
                    </BrutalButton>
                  </div>
                </Box>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const tone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.greenFg, bg: C.greenBg },
    Openstaand: { fg: C.amberFg, bg: C.amberBg },
    Concept: { fg: C.faint, bg: C.canvas },
  };
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
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-[24px] font-bold leading-none" style={head}>
          FACTUREN
        </h2>
        <BrutalButton filled>
          <Plus size={15} strokeWidth={2.8} aria-hidden="true" /> Nieuwe factuur
        </BrutalButton>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Box className="p-4" bg={C.greenBg}>
          <Label color={C.greenFg}>Ontvangen</Label>
          <p className="mt-1 text-[28px] font-bold tabular-nums leading-none" style={head}>
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Box>
        <Box className="p-4" bg={C.amberBg}>
          <Label color={C.amberFg}>Openstaand</Label>
          <p className="mt-1 text-[28px] font-bold tabular-nums leading-none" style={head}>
            € {open.toLocaleString("nl-NL")}
          </p>
        </Box>
      </div>

      <Box className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Facturen met status en bedrag</caption>
          <thead>
            <tr style={{ borderBottom: BORDER }}>
              <th scope="col" className="px-4 py-3">
                <Label>Nummer</Label>
              </th>
              <th scope="col" className="px-4 py-3">
                <Label>Klant</Label>
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                <Label>Datum</Label>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <Label>Bedrag</Label>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <Label>Status</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const t = tone[f.status] ?? { fg: C.faint, bg: C.canvas };
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#faf7ef]"
                  style={{ borderBottom: "1px solid #dedbd0" }}
                >
                  <td className="px-4 py-3 text-[12.5px] font-bold tabular-nums" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13.5px] font-bold" style={head}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden px-4 py-3 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.sub }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[14px] font-bold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]"
                      style={{ ...mono, color: C.ink, background: t.bg, border: BORDER }}
                    >
                      <span className="h-2 w-2" style={{ background: t.fg }} aria-hidden="true" />
                      {f.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </div>
  );
}
