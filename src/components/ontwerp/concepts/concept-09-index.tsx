"use client";

// Concept 09 — "Index" · Database-werkblad (LIGHT, Notion/Superlist-grade).
// Een verfijnd document-database-werkblad: rustige licht-grijswaarden, één kalme blauwe accent.
// Database-VIEWS met property-chips, een view-switcher (Tabel / Bord / Lijst), breadcrumb-header,
// subtiele row-hover, inline toggles, keyboard-first ⌘K. Typografie-als-UI, strategisch minimalisme —
// stil, georganiseerd, snel.
// Palet: canvas #fbfbfa, surface #ffffff, line #ececec, ink #1c1d1f, muted #6b6f76, accent #2563eb.
// Fonts: Inter (UI) + JetBrains Mono (keys/codes).

import { useState } from "react";
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
  Command,
  Table2,
  Columns3,
  List as ListIcon,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  Plus,
  MapPin,
  CircleDot,
  Filter,
  ArrowUpDown,
  CalendarDays,
  Hash,
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

const C = {
  canvas: "#fbfbfa",
  surface: "#ffffff",
  surfaceAlt: "#f7f7f6",
  line: "#ececec",
  lineSoft: "#f1f1f0",
  ink: "#1c1d1f",
  inkSoft: "#3b3d40",
  muted: "#6b6f76",
  faint: "#9aa0a6",
  accent: "#2563eb",
  accentSoft: "#eef3ff",
  accentLine: "#d6e1fe",
  ok: "#15803d",
  okSoft: "#eaf6ee",
  warn: "#b45309",
  warnSoft: "#fcf3e6",
  bad: "#b91c1c",
  badSoft: "#fceceb",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

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

type StatusTone = { label: string; fg: string; bg: string; line: string };

function statusStyle(s: CredStatus): StatusTone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, bg: C.okSoft, line: "#cde8d5" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, bg: C.accentSoft, line: C.accentLine };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.warn, bg: C.warnSoft, line: "#f3e2c4" };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.bad, bg: C.badSoft, line: "#f4d2d0" };
  }
}

function Chip({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: tone.fg, background: tone.bg, border: `1px solid ${tone.line}` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone.fg }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

function PropChip({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px]"
      style={{ color: C.muted, background: C.surfaceAlt, border: `1px solid ${C.line}` }}
    >
      <Icon size={11} aria-hidden="true" style={{ color: C.faint }} />
      {children}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `g${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept09() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[244px] shrink-0 flex-col border-r px-3 py-4 md:flex"
          style={{ borderColor: C.line, background: C.surfaceAlt }}
        >
          <div className="flex items-center gap-2.5 px-2 pb-5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
              style={{ background: C.ink }}
            >
              Z
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold leading-tight">Werkblad</div>
              <div className="truncate text-[11px]" style={{ color: C.faint }}>
                ZZP Platform
              </div>
            </div>
          </div>

          <button
            className="mb-4 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}`, background: C.surface, color: C.muted }}
            aria-label="Snel zoeken openen"
          >
            <Search size={14} aria-hidden="true" />
            <span>Zoek of spring naar…</span>
            <kbd
              className="ml-auto flex items-center gap-0.5 rounded px-1 text-[10px]"
              style={{ border: `1px solid ${C.line}`, color: C.faint, ...mono }}
            >
              <Command size={9} aria-hidden="true" />K
            </kbd>
          </button>

          <p
            className="px-2.5 pb-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Databases
          </p>
          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? C.surface : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <div
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ background: C.accentSoft, color: C.accent, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.faint }}>
                  {PROFIEL.plaats}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col" style={{ background: C.surface }}>
          {/* Topbar */}
          <header
            className="flex h-14 shrink-0 items-center gap-3 border-b px-5"
            style={{ borderColor: C.line }}
          >
            <nav className="flex items-center gap-1.5 text-[12.5px]" aria-label="Kruimelpad">
              <span style={{ color: C.muted }}>Werkblad</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button
                className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2 sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek…</span>
                <kbd
                  className="flex items-center gap-0.5 rounded px-1 text-[10px]"
                  style={{ border: `1px solid ${C.line}`, color: C.faint, ...mono }}
                >
                  <Command size={9} aria-hidden="true" />K
                </kbd>
              </button>
              <button
                className="relative rounded-lg p-2 transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.muted }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.accent }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                    border: `1px solid ${on ? C.accentLine : "transparent"}`,
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
            {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

function PageHead({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-5"
      style={{ borderColor: C.line }}
    >
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

function ViewSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const views: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "tabel", label: "Tabel", icon: Table2 },
    { key: "bord", label: "Bord", icon: Columns3 },
    { key: "lijst", label: "Lijst", icon: ListIcon },
  ];
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg p-0.5"
      style={{ border: `1px solid ${C.line}`, background: C.surfaceAlt }}
      role="tablist"
      aria-label="Weergave kiezen"
    >
      {views.map((v) => {
        const on = v.key === value;
        return (
          <button
            key={v.key}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(v.key)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: on ? C.surface : "transparent",
              color: on ? C.ink : C.muted,
              border: `1px solid ${on ? C.line : "transparent"}`,
              fontWeight: on ? 500 : 400,
            }}
          >
            <v.icon size={13} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div>
      <PageHead
        title={`Goedemorgen, ${PROFIEL.naam.split(" ")[0]}`}
        subtitle="Een gecureerd overzicht van je werkblad — wat telt, in één blik."
        right={
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium"
            style={{ color: C.ok, background: C.okSoft, border: "1px solid #cde8d5" }}
          >
            <ShieldCheck size={13} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
        }
      />

      <div className="space-y-7 px-6 py-6">
        {/* KPI's als property-cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-4"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums"
                  style={{ color: k.up ? C.ok : C.muted, ...mono }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
              </div>
              <p className="mt-2.5 text-[26px] font-semibold tabular-nums leading-none tracking-tight">
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={C.accent} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Database-preview: beste matches als rijen */}
          <div className="lg:col-span-2">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={14} aria-hidden="true" style={{ color: C.accent }} />
                <h2 className="text-[13.5px] font-semibold">Beste matches</h2>
                <span
                  className="rounded-full px-1.5 text-[11px] tabular-nums"
                  style={{ background: C.surfaceAlt, color: C.muted, ...mono }}
                >
                  {OPDRACHTEN.length}
                </span>
              </div>
              <span className="text-[11.5px]" style={{ color: C.faint }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
              <div
                className="flex items-center gap-3 border-b px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ borderColor: C.line, background: C.surfaceAlt, color: C.faint }}
              >
                <span className="flex-1">Opdracht</span>
                <span className="hidden w-24 sm:block">Tarief</span>
                <span className="w-14 text-right">Match</span>
                <span className="w-4" aria-hidden="true" />
              </div>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: C.accent }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{o.titel}</p>
                    <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden w-24 text-[12px] tabular-nums sm:block"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span
                    className="w-14 text-right text-[12.5px] font-semibold tabular-nums"
                    style={{ color: C.accent, ...mono }}
                  >
                    {o.match}%
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </div>

          {/* Credentials-property */}
          <div>
            <div className="mb-2.5 flex items-center gap-2">
              <ShieldCheck size={14} aria-hidden="true" style={{ color: C.accent }} />
              <h2 className="text-[13.5px] font-semibold">Credentials</h2>
            </div>
            <div className="space-y-2.5 rounded-xl p-4" style={{ border: `1px solid ${C.line}` }}>
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="rounded-lg p-2.5"
                    style={{ background: C.surfaceAlt }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium leading-snug">{c.naam}</p>
                      <Chip tone={st}>{st.label}</Chip>
                    </div>
                    <p className="mt-1 text-[11.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [view, setView] = useState("tabel");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHead
        title="Marktplaats"
        subtitle="Open opdrachten als database — filter, sorteer en wissel van weergave."
        right={<ViewSwitcher value={view} onChange={setView} />}
      />

      <div className="px-6 py-5">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div
            className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ border: `1px solid ${C.line}`, background: C.surface }}
          >
            <Search size={14} aria-hidden="true" style={{ color: C.faint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter op titel, plaats of opdrachtgever…"
              aria-label="Opdrachten filteren"
              className="w-full bg-transparent text-[12.5px] outline-none"
              style={{ color: C.ink }}
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}`, color: C.muted }}
          >
            <Filter size={13} aria-hidden="true" /> Filter
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2"
            style={{ border: `1px solid ${C.line}`, color: C.muted }}
          >
            <ArrowUpDown size={13} aria-hidden="true" /> Match
          </button>
        </div>

        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center"
            style={{ border: `1px dashed ${C.line}`, background: C.surfaceAlt }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <Search size={18} aria-hidden="true" style={{ color: C.faint }} />
            </div>
            <p className="mt-4 text-[13.5px] font-semibold">Geen opdrachten gevonden</p>
            <p className="mt-1 max-w-xs text-[12px]" style={{ color: C.muted }}>
              Geen rij komt overeen met “{q}”. Pas je filter aan of verbreed je beschikbaarheid.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-4 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2"
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              Filter wissen
            </button>
          </div>
        ) : view === "tabel" ? (
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b text-[10.5px] font-medium uppercase tracking-[0.08em]"
                  style={{ borderColor: C.line, background: C.surfaceAlt, color: C.faint }}
                >
                  <th className="px-4 py-2.5">Opdracht</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Plaats</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">Tarief</th>
                  <th className="px-4 py-2.5 text-right">Match</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={onOpen}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onOpen();
                    }}
                    className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="text-[10px] tabular-nums"
                          style={{ color: C.faint, ...mono }}
                        >
                          {o.id}
                        </span>
                        <span className="text-[13px] font-medium">{o.titel}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <PropChip key={t} icon={CircleDot}>
                            {t}
                          </PropChip>
                        ))}
                      </div>
                    </td>
                    <td
                      className="hidden px-4 py-3 text-[12.5px] md:table-cell"
                      style={{ color: C.muted }}
                    >
                      {o.plaats}
                    </td>
                    <td
                      className="hidden px-4 py-3 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-semibold tabular-nums"
                        style={{ color: C.accent, background: C.accentSoft, ...mono }}
                      >
                        {o.match}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : view === "bord" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="rounded-xl p-4 text-left transition-colors hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, background: C.surface }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tabular-nums" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <span
                    className="rounded-md px-2 py-0.5 text-[11.5px] font-semibold tabular-nums"
                    style={{ color: C.accent, background: C.accentSoft, ...mono }}
                  >
                    {o.match}%
                  </span>
                </div>
                <p className="mt-2.5 text-[14px] font-medium leading-snug">{o.titel}</p>
                <p
                  className="mt-1 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <PropChip key={t} icon={CircleDot}>
                      {t}
                    </PropChip>
                  ))}
                </div>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-3 text-[12px] tabular-nums"
                  style={{ borderColor: C.lineSoft, ...mono }}
                >
                  <span style={{ color: C.inkSoft }}>{o.tarief}</span>
                  <span style={{ color: C.muted }}>{o.uren}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
            {filtered.map((o) => (
              <button
                key={o.id}
                onClick={onOpen}
                className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f7f7f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
                style={{ borderColor: C.lineSoft }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{o.titel}</p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.uren}
                  </p>
                </div>
                <span className="text-[12px] tabular-nums" style={{ color: C.inkSoft, ...mono }}>
                  {o.tarief.replace(" / uur", "")}
                </span>
                <span
                  className="text-[12.5px] font-semibold tabular-nums"
                  style={{ color: C.accent, ...mono }}
                >
                  {o.match}%
                </span>
                <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div>
      <PageHead
        title={opdracht.titel}
        subtitle={`${opdracht.opdrachtgever} · ${opdracht.plaats}`}
        right={
          <button
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.accent }}
          >
            Reageer op opdracht
          </button>
        }
      />
      <div className="space-y-6 px-6 py-6">
        {/* Properties */}
        <div
          className="grid grid-cols-2 overflow-hidden rounded-xl sm:grid-cols-4"
          style={{ border: `1px solid ${C.line}` }}
        >
          {[
            { l: "Tarief", v: opdracht.tarief, icon: Hash },
            { l: "Omvang", v: opdracht.uren, icon: Clock },
            { l: "Start", v: opdracht.start, icon: CalendarDays },
            { l: "Match", v: `${opdracht.match}%`, icon: CircleDot },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-4"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.lineSoft}`,
                background: C.surface,
              }}
            >
              <p className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
                <m.icon size={11} aria-hidden="true" style={{ color: C.faint }} /> {m.l}
              </p>
              <p
                className="mt-1.5 text-[15px] font-semibold tabular-nums tracking-tight"
                style={mono}
              >
                {m.v}
              </p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <PropChip key={t} icon={CircleDot}>
              {t}
            </PropChip>
          ))}
        </div>

        {/* Waarom deze match */}
        <div className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
          <h3 className="text-[14px] font-semibold">Waarom deze match</h3>
          <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
            Transparant onderbouwd op basis van je geverifieerde profiel.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p
                className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
                style={{ color: C.ok }}
              >
                Pluspunten
              </p>
              <ul className="mt-2.5 space-y-2">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[12.5px]">
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.okSoft }}
                    >
                      <Check size={11} aria-hidden="true" style={{ color: C.ok }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
                style={{ color: C.warn }}
              >
                Aandachtspunten
              </p>
              <ul className="mt-2.5 space-y-2">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[12.5px]"
                    style={{ color: C.inkSoft }}
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: C.warnSoft }}
                    >
                      <Minus size={11} aria-hidden="true" style={{ color: C.warn }} />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div>
      <PageHead
        title="Verificatie"
        subtitle="Je vertrouwenslaag — geverifieerde credentials maken je zichtbaar voor opdrachtgevers."
      />
      <div className="space-y-6 px-6 py-6">
        {/* Trust summary */}
        <div
          className="flex flex-wrap items-center gap-5 rounded-xl p-5"
          style={{ border: `1px solid ${C.accentLine}`, background: C.accentSoft }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: C.surface, border: `1px solid ${C.accentLine}` }}
          >
            <ShieldCheck size={24} aria-hidden="true" style={{ color: C.accent }} />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{PROFIEL.trust}</p>
            <p className="text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="tabular-nums" style={mono}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="tabular-nums" style={mono}>
                {CREDENTIALS.length}
              </span>{" "}
              credentials geverifieerd ·{" "}
              <span className="tabular-nums" style={mono}>
                {attention}
              </span>{" "}
              vraagt actie
            </p>
          </div>
          <div className="flex items-end gap-1" aria-hidden="true">
            {CREDENTIALS.map((c) => {
              const st = statusStyle(c.status);
              return (
                <span
                  key={c.naam}
                  className="w-2 rounded-full"
                  style={{
                    height: c.status === "VERIFIED" ? 28 : 16,
                    background: st.fg,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Credential list */}
        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          <div
            className="flex items-center gap-3 border-b px-4 py-2 text-[10.5px] font-medium uppercase tracking-[0.08em]"
            style={{ borderColor: C.line, background: C.surfaceAlt, color: C.faint }}
          >
            <span className="flex-1">Credential</span>
            <span>Status</span>
          </div>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const Icon =
              c.status === "VERIFIED" ? Check : c.status === "SUBMITTED" ? Clock : AlertTriangle;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 border-b px-4 py-3.5 transition-colors last:border-0 hover:bg-[#f7f7f6]"
                style={{ borderColor: C.lineSoft }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.bg, border: `1px solid ${st.line}` }}
                >
                  <Icon size={16} aria-hidden="true" style={{ color: st.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Chip tone={st}>{st.label}</Chip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", StatusTone & { Icon: LucideIcon }> = {
    warning: {
      label: "",
      fg: C.warn,
      bg: C.warnSoft,
      line: "#f3e2c4",
      Icon: AlertTriangle,
    },
    info: { label: "", fg: C.accent, bg: C.accentSoft, line: C.accentLine, Icon: Bell },
  };
  return (
    <div>
      <PageHead
        title="Volgende acties"
        subtitle="Wat nu aandacht vraagt — op volgorde van urgentie."
      />
      <div className="space-y-3 px-6 py-6">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3.5 rounded-xl p-4"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: t.bg, border: `1px solid ${t.line}` }}
              >
                <t.Icon size={16} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#f3f3f2] focus-visible:outline-none focus-visible:ring-2"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const fallbackTone: StatusTone = {
    label: "Concept",
    fg: C.muted,
    bg: C.surfaceAlt,
    line: C.line,
  };
  const statusTone: Record<string, StatusTone> = {
    Betaald: { label: "Betaald", fg: C.ok, bg: C.okSoft, line: "#cde8d5" },
    Openstaand: { label: "Openstaand", fg: C.warn, bg: C.warnSoft, line: "#f3e2c4" },
    Concept: fallbackTone,
  };
  return (
    <div>
      <PageHead
        title="Facturen"
        subtitle="Je omzet-database — status, klant en bedrag in één tabel."
        right={
          <button
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
            style={{ background: C.accent }}
          >
            <Plus size={14} aria-hidden="true" /> Nieuwe factuur
          </button>
        }
      />
      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }}>
          <table className="w-full text-left">
            <thead>
              <tr
                className="border-b text-[10.5px] font-medium uppercase tracking-[0.08em]"
                style={{ borderColor: C.line, background: C.surfaceAlt, color: C.faint }}
              >
                <th className="px-4 py-2.5">Nummer</th>
                <th className="px-4 py-2.5">Klant</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Datum</th>
                <th className="px-4 py-2.5 text-right">Bedrag</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const st = statusTone[f.status] ?? fallbackTone;
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors last:border-0 hover:bg-[#f7f7f6]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td
                      className="px-4 py-3 text-[12px] tabular-nums"
                      style={{ color: C.inkSoft, ...mono }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                    <td
                      className="hidden px-4 py-3 text-[12px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...mono }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
                      style={mono}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Chip tone={st}>{st.label}</Chip>
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
