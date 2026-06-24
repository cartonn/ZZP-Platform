"use client";

// Concept — "Kompas": keyboard-first command console (Raycast-school). Licht neutraal canvas,
// ink-tekst, teal accent. Signatuur: een prominente, OPEN ⌘K command-palette op het dashboard
// met gegroepeerde resultaten en kbd-shortcut-chips. Overal toetsenbord-hints. Snel, power-user.

import { useState } from "react";
import {
  Search,
  Command,
  CornerDownLeft,
  Bookmark,
  Check,
  Clock,
  AlertTriangle,
  X,
  ShieldCheck,
  LayoutDashboard,
  Store,
  BadgeCheck,
  Zap,
  Receipt,
  FileText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  KPIS,
  OPDRACHTEN,
  CREDENTIALS,
  ACTIES,
  FACTUREN,
  PROFIEL,
  SCREENS,
  type ScreenKey,
  type CredStatus,
} from "./mock";

const sans = { fontFamily: "var(--font-lab-inter)" } as const;
const mono = { fontFamily: "var(--font-lab-mono)" } as const;

const TEAL = "#0d9488";
const INK = "#171717";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={mono}
      className="inline-flex min-w-[1.4rem] items-center justify-center rounded-[5px] border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] tabular-nums leading-none text-neutral-500 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
    >
      {children}
    </kbd>
  );
}

function NavHint() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
      <Kbd>J</Kbd>
      <Kbd>K</Kbd>
      <span style={mono} className="tracking-tight">
        om te navigeren
      </span>
    </span>
  );
}

const NAV_ICON: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: BadgeCheck,
  acties: Zap,
  facturen: Receipt,
  documenten: FileText,
  berichten: FileText,
};

const NAV_SHORTCUT: Partial<Record<ScreenKey, string>> = {
  dashboard: "G D",
  marktplaats: "G M",
  verificatie: "G V",
  acties: "G A",
  facturen: "G F",
};

export function Concept03() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...sans, backgroundColor: "#fafafa", color: INK }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:light]"
    >
      {/* Sidebar */}
      <aside className="hidden w-[224px] shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-4">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: TEAL }}
            aria-hidden
          >
            Z
          </span>
          <span className="text-[13px] font-medium tracking-tight">ZorgBemiddeling</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICON[s.key];
            const active = s.key === screen;
            const shortcut = NAV_SHORTCUT[s.key];
            return (
              <button
                key={s.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(s.key)}
                className={[
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
                  active
                    ? "bg-[#0d9488]/[0.08] font-medium text-[#0f766e]"
                    : "text-neutral-600 hover:bg-neutral-100",
                ].join(" ")}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={active ? { color: TEAL } : undefined}
                  aria-hidden
                />
                <span className="flex-1">{s.label}</span>
                {shortcut && (
                  <span
                    style={mono}
                    className="hidden text-[10px] tabular-nums text-neutral-300 group-hover:text-neutral-400 sm:inline"
                  >
                    {shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <div className="flex items-center gap-2.5">
            <span
              style={mono}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-[11px] tabular-nums"
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[12px] font-medium">{PROFIEL.naam}</div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <ShieldCheck className="h-3 w-3" style={{ color: TEAL }} aria-hidden />
                {PROFIEL.trust}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-[13px] text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 sm:max-w-sm"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Commando of zoekterm…</span>
            <kbd
              style={mono}
              className="ml-auto hidden shrink-0 items-center gap-1 rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500 sm:inline-flex"
            >
              <Command className="h-3 w-3" aria-hidden />K
            </kbd>
          </button>
          <span className="hidden sm:block">
            <NavHint />
          </span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {screen === "dashboard" && (
            <DashboardScreen onOpen={() => setScreen("opdracht")} onGo={setScreen} />
          )}
          {screen === "marktplaats" && <MarktplaatsScreen onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtScreen onBack={() => setScreen("marktplaats")} />}
          {screen === "verificatie" && <VerificatieScreen />}
          {screen === "acties" && <ActiesScreen />}
          {screen === "facturen" && <FacturenScreen />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Command palette */

type PaletteItem = {
  label: string;
  hint?: string;
  icon: LucideIcon;
  shortcut: string;
  onSelect: () => void;
};

function CommandPalette({ onOpen, onGo }: { onOpen: () => void; onGo: (s: ScreenKey) => void }) {
  const [active, setActive] = useState(0);

  const groups: { title: string; items: PaletteItem[] }[] = [
    {
      title: "Acties",
      items: [
        {
          label: ACTIES[0]?.cta ?? "VOG vernieuwen",
          hint: "Verloopt over 23 dagen",
          icon: AlertTriangle,
          shortcut: "⌘ R",
          onSelect: () => onGo("acties"),
        },
        {
          label: "Reageer op beste match",
          hint: "94% — Wijkverpleegkundige",
          icon: ArrowRight,
          shortcut: "⌘ ↵",
          onSelect: onOpen,
        },
      ],
    },
    {
      title: "Navigatie",
      items: [
        {
          label: "Ga naar Marktplaats",
          icon: Store,
          shortcut: "G M",
          onSelect: () => onGo("marktplaats"),
        },
        {
          label: "Ga naar Verificatie",
          icon: BadgeCheck,
          shortcut: "G V",
          onSelect: () => onGo("verificatie"),
        },
        {
          label: "Ga naar Facturen",
          icon: Receipt,
          shortcut: "G F",
          onSelect: () => onGo("facturen"),
        },
      ],
    },
    {
      title: "Opdrachten",
      items: OPDRACHTEN.slice(0, 2).map((o) => ({
        label: o.titel,
        hint: `${o.plaats} · ${o.match}% match`,
        icon: FileText,
        shortcut: "↵",
        onSelect: onOpen,
      })),
    },
  ];

  const flat = groups.flatMap((g) => g.items);

  return (
    <section
      aria-label="Commandopalet"
      className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3">
        <Search className="h-4 w-4 text-neutral-400" aria-hidden />
        <span className="text-[14px] text-neutral-400">Typ een commando of zoek…</span>
        <kbd
          style={mono}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500"
        >
          esc
        </kbd>
      </div>

      <div className="max-h-[340px] overflow-y-auto py-1.5">
        {groups.map((g) => (
          <div key={g.title} className="px-1.5 pb-1.5">
            <div
              style={mono}
              className="px-2.5 pb-1 pt-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400"
            >
              {g.title}
            </div>
            {g.items.map((item) => {
              const idx = flat.indexOf(item);
              const isActive = idx === active;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onSelect}
                  onMouseEnter={() => setActive(idx)}
                  data-active={isActive}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
                    isActive ? "bg-[#0d9488]/[0.08]" : "hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      isActive ? "bg-white" : "bg-neutral-100",
                    ].join(" ")}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={isActive ? { color: TEAL } : { color: "#737373" }}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{item.label}</span>
                    {item.hint && (
                      <span className="block truncate text-[11px] text-neutral-400">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  <span style={mono} className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                    {item.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span style={mono}>selecteren</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span style={mono}>openen</span>
          <Kbd>
            <CornerDownLeft className="h-2.5 w-2.5" aria-hidden />
          </Kbd>
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function DashboardScreen({ onOpen, onGo }: { onOpen: () => void; onGo: (s: ScreenKey) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="order-2 space-y-6 lg:order-1">
        <section className="grid grid-cols-2 gap-3">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="text-[11px] text-neutral-500">{kpi.label}</div>
              <div
                style={mono}
                className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight"
              >
                {kpi.value}
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span
                  style={{ ...mono, color: kpi.up ? TEAL : "#737373" }}
                  className="text-[11px] tabular-nums"
                >
                  {kpi.up ? "▲" : "▾"} {kpi.trend}
                </span>
                <Sparkline data={kpi.spark} />
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white">
          <div className="flex items-center justify-between px-4 py-2.5">
            <h2 className="text-[13px] font-medium">Beste matches</h2>
            <NavHint />
          </div>
          <ul className="divide-y divide-neutral-100">
            {OPDRACHTEN.slice(0, 3).map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d9488]/40"
                >
                  <span
                    style={mono}
                    className="w-4 shrink-0 text-[11px] tabular-nums text-neutral-300"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{o.titel}</span>
                    <span
                      style={mono}
                      className="block truncate text-[11px] tabular-nums text-neutral-400"
                    >
                      {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <span
                    style={{ ...mono, color: TEAL }}
                    className="shrink-0 text-[13px] font-semibold tabular-nums"
                  >
                    {o.match}%
                  </span>
                  <span className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <Kbd>↵</Kbd>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* The signature: an open command palette */}
      <div className="order-1 lg:order-2">
        <CommandPalette onOpen={onOpen} onGo={onGo} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 64;
  const h = 20;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={TEAL}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------- Marktplaats */

function MarktplaatsScreen({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "≥ 85% match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f, i) => {
          const on = i === active;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(i)}
              className={[
                "rounded-md border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
                on
                  ? "border-[#0d9488]/40 bg-[#0d9488]/[0.08] text-[#0f766e]"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300",
              ].join(" ")}
            >
              {f}
            </button>
          );
        })}
        <span className="ml-auto">
          <NavHint />
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-100">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={onOpen}
                className="group flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0d9488]/40 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{o.titel}</div>
                  <div
                    style={mono}
                    className="mt-0.5 truncate text-[11px] tabular-nums text-neutral-400"
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
                  <span
                    style={{ ...mono, color: TEAL }}
                    className="text-[13px] font-semibold tabular-nums"
                  >
                    {o.match}%
                  </span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <Kbd>↵</Kbd>
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- Opdracht */

function OpdrachtScreen({ onBack }: { onBack: () => void }) {
  const o = OPDRACHTEN[0];
  if (!o) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 transition-colors hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40"
      >
        <Kbd>esc</Kbd>
        Terug naar marktplaats
      </button>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="min-w-0">
          <span style={mono} className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            {o.id}
          </span>
          <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{o.titel}</h2>
          <p style={mono} className="mt-1.5 text-[12px] tabular-nums text-neutral-500">
            {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span style={mono} className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            Match
          </span>
          <div
            style={{ ...mono, color: TEAL }}
            className="text-[32px] font-semibold tabular-nums leading-none"
          >
            {o.match}%
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" style={{ color: TEAL }} aria-hidden />
            <span style={mono} className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Waarom dit past
            </span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] leading-snug text-neutral-700"
              >
                <Check
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: TEAL }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
            <span style={mono} className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
              Aandachtspunten
            </span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {o.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-[13px] leading-snug text-neutral-700"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/50 focus-visible:ring-offset-2"
          style={{ backgroundColor: TEAL }}
        >
          Reageer op opdracht
          <Kbd>
            <CornerDownLeft className="h-2.5 w-2.5" aria-hidden />
          </Kbd>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-5 py-2.5 text-[13px] font-medium text-neutral-700 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40"
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden />
          Bewaar
          <Kbd>S</Kbd>
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Verificatie */

const STATUS_LABEL: Record<CredStatus, string> = {
  VERIFIED: "Geverifieerd",
  EXPIRING: "Verloopt binnenkort",
  SUBMITTED: "In beoordeling",
  REJECTED: "Afgewezen",
};

function StatusSeal({ status }: { status: CredStatus }) {
  const map: Record<CredStatus, { color: string; icon: React.ReactNode }> = {
    VERIFIED: { color: TEAL, icon: <Check className="h-4 w-4" aria-hidden /> },
    EXPIRING: { color: "#b45309", icon: <AlertTriangle className="h-4 w-4" aria-hidden /> },
    SUBMITTED: { color: "#737373", icon: <Clock className="h-4 w-4" aria-hidden /> },
    REJECTED: { color: "#b91c1c", icon: <X className="h-4 w-4" aria-hidden /> },
  };
  const c = map[status];
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
      style={{ color: c.color, borderColor: `${c.color}40`, backgroundColor: `${c.color}10` }}
    >
      {c.icon}
    </span>
  );
}

function VerificatieScreen() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
        <ShieldCheck className="h-6 w-6" style={{ color: TEAL }} aria-hidden />
        <div className="flex-1">
          <div className="text-[14px] font-medium">Vertrouwensniveau: Hoog</div>
          <div className="text-[12px] text-neutral-500">
            {verified} van {CREDENTIALS.length} bewijsstukken geverifieerd
          </div>
        </div>
        <span style={{ ...mono, color: TEAL }} className="text-[20px] font-semibold tabular-nums">
          {Math.round((verified / CREDENTIALS.length) * 100)}%
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-100">
          {CREDENTIALS.map((c) => (
            <li key={c.naam} className="flex items-center gap-3 px-4 py-3">
              <StatusSeal status={c.status} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{c.naam}</div>
                <div className="truncate text-[11px] text-neutral-500">{c.detail}</div>
              </div>
              <span
                style={mono}
                className="shrink-0 text-[10px] uppercase tabular-nums tracking-wide text-neutral-500"
              >
                {STATUS_LABEL[c.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- Acties */

function ActiesScreen() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-3">
      {ordered.map((a, i) => {
        const warning = a.urgentie === "warning";
        return (
          <div
            key={a.titel}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4"
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: warning ? "rgba(180,83,9,0.1)" : "rgba(13,148,136,0.1)" }}
            >
              {warning ? (
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden />
              ) : (
                <Zap className="h-4 w-4" style={{ color: TEAL }} aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium">{a.titel}</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{a.detail}</p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:border-[#0d9488]/40 hover:text-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40"
            >
              {a.cta}
              <Kbd>{i + 1}</Kbd>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------- Facturen */

function FacturenChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: "border-[#0d9488]/30 bg-[#0d9488]/[0.08] text-[#0f766e]",
    Openstaand: "border-amber-300 bg-amber-50 text-amber-700",
    Concept: "border-neutral-200 bg-neutral-50 text-neutral-500",
  };
  return (
    <span
      style={mono}
      className={[
        "inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tabular-nums tracking-wide",
        map[status] ?? "border-neutral-200 text-neutral-500",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function FacturenScreen() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Facturen</h2>
        <NavHint />
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                {["Nr", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    style={mono}
                    className={[
                      "px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500",
                      i === 3 ? "text-right" : "",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {FACTUREN.map((f) => (
                <tr key={f.nr} className="transition-colors hover:bg-neutral-50">
                  <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-neutral-600">
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{f.klant}</td>
                  <td style={mono} className="px-4 py-3 text-[12px] tabular-nums text-neutral-400">
                    {f.datum}
                  </td>
                  <td
                    style={mono}
                    className="px-4 py-3 text-right text-[13px] font-medium tabular-nums"
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <FacturenChip status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
