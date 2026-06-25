"use client";

// Concept 10 — "Onyx" · Quiet luxury, verfijnd donker, jewelry-grade restraint.
// Stilte als luxe: matte near-black oppervlakken, hairline low-chroma randen, ÉÉN warme
// champagne/gold-accent per scherm, royale witruimte, één ingehouden serif-displaymoment,
// tabulaire cijfers als juweel. Vlak, mat, minimaal, duur — geen glas, geen glow.
// Palet: canvas #0a0a0a, surface #111111, line #1e1e1e, muted #8a8a86, ink #ece9e3,
// accent champagne #c8a96a, accentSoft rgba(200,169,106,.12).
// Fonts: Instrument Serif (display) + Geist (UI) + Geist Mono (cijfers).

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
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  Command,
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
  canvas: "#0a0a0a",
  surface: "#111111",
  surfaceHi: "#161616",
  line: "#1e1e1e",
  lineSoft: "#171717",
  muted: "#8a8a86",
  faint: "#5c5c58",
  ink: "#ece9e3",
  inkSoft: "#bdbab4",
  accent: "#c8a96a",
  accentSoft: "rgba(200,169,106,0.12)",
  accentLine: "rgba(200,169,106,0.28)",
};

const ui = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };
const serif = { fontFamily: "var(--font-lab-instrument-serif)" };

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

function statusStyle(s: CredStatus): { label: string; fg: string; dot: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: "#86c79b", dot: "#5fae77" };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.accent, dot: C.accent };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: "#d9b277", dot: "#d9b277" };
    case "REJECTED":
      return { label: "Afgewezen", fg: "#cf8a82", dot: "#cf8a82" };
  }
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={C.accent}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}

export function Concept10() {
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
          className="hidden w-[232px] shrink-0 flex-col border-r px-4 py-6 md:flex"
          style={{ borderColor: C.line, background: C.canvas }}
        >
          <div className="flex items-center gap-3 px-2 pb-9">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium"
              style={{ border: `1px solid ${C.accentLine}`, color: C.accent }}
            >
              Z
            </div>
            <span
              className="text-[13px] font-medium tracking-[0.08em]"
              style={{ color: C.inkSoft }}
            >
              ZZP PLATFORM
            </span>
          </div>

          <nav className="flex flex-col gap-0.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-1"
                  style={{ color: on ? C.ink : C.muted }}
                >
                  {on && (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full"
                      style={{ background: C.accent }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.accent : C.faint }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div
              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5"
              style={{ border: `1px solid ${C.line}` }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-medium"
                style={{ border: `1px solid ${C.accentLine}`, color: C.accent, ...mono }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium">{PROFIEL.naam}</div>
                <div className="truncate text-[11px]" style={{ color: C.faint }}>
                  {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-7"
            style={{ borderColor: C.line }}
          >
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: C.muted }}>
              <span>{PROFIEL.rol.split(" · ")[0]}</span>
              <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-medium" style={{ color: C.ink }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] transition-colors hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-1"
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
                className="relative rounded-md p-2 transition-colors hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-1"
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
            className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden"
            style={{ borderColor: C.line }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-md px-3 py-1.5 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-1"
                  style={{
                    color: on ? C.accent : C.muted,
                    background: on ? C.accentSoft : "transparent",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-7 py-9">
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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-medium uppercase tracking-[0.22em]"
      style={{ color: C.accent, ...mono }}
    >
      {children}
    </p>
  );
}

function Card({
  children,
  className = "",
  hi = false,
}: {
  children: React.ReactNode;
  className?: string;
  hi?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ border: `1px solid ${C.line}`, background: hi ? C.surfaceHi : C.surface }}
    >
      {children}
    </div>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Display-moment (het enige serif-moment) */}
      <div>
        <Kicker>Vandaag</Kicker>
        <h1
          className="mt-2 text-[40px] leading-[1.05] tracking-tight"
          style={{ ...serif, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          Drie matches boven 80%, één credential vraagt aandacht. Rustig, alles onder controle.
        </p>
      </div>

      {/* KPI-rij — cijfers als juweel */}
      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl lg:grid-cols-4"
        style={{ background: C.line }}
      >
        {KPIS.map((k) => (
          <div key={k.label} className="p-5" style={{ background: C.surface }}>
            <p className="text-[11.5px]" style={{ color: C.muted }}>
              {k.label}
            </p>
            <p
              className="mt-3 text-[28px] font-light tabular-nums leading-none tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 text-[11px] tabular-nums"
                style={{ color: k.up ? "#86c79b" : C.muted, ...mono }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium tracking-tight">Beste matches</h2>
            <span className="text-[11.5px]" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Card>
            <div className="divide-y" style={{ borderColor: C.line }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                    <p className="mt-0.5 truncate text-[12px]" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <span
                    className="text-[12.5px] font-medium tabular-nums"
                    style={{ color: C.accent, ...mono }}
                  >
                    {o.match}%
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium tracking-tight">Credentials</h2>
          </div>
          <Card className="p-5">
            <div className="space-y-4">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: st.dot }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Kicker>Marktplaats</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={serif}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-lg px-4 py-2.5"
        style={{ border: `1px solid ${C.line}`, background: C.surface }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel of plaats…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#5c5c58]"
          style={{ color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-[14px] font-medium">Geen opdrachten gevonden</p>
          <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
            Pas je zoekopdracht aan of verbreed je beschikbaarheid.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group rounded-xl p-5 text-left transition-colors hover:bg-[#161616] focus-visible:outline-none focus-visible:ring-1"
              style={{ border: `1px solid ${C.line}`, background: C.surface }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-wide" style={{ color: C.faint, ...mono }}>
                  {o.id}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
                  style={{ background: C.accentSoft, color: C.accent, ...mono }}
                >
                  {o.match}%
                </span>
              </div>
              <p className="mt-3 text-[15px] font-medium leading-snug">{o.titel}</p>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2 py-0.5 text-[10.5px]"
                    style={{ border: `1px solid ${C.line}`, color: C.muted }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-4 text-[12.5px]"
                style={{ borderColor: C.line }}
              >
                <span className="tabular-nums" style={{ color: C.inkSoft, ...mono }}>
                  {o.tarief}
                </span>
                <span className="tabular-nums" style={{ color: C.muted, ...mono }}>
                  {o.uren}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-9">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={serif}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, color: "#1a1408" }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-4"
        style={{ background: C.line }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.surface }}>
            <p className="text-[11px]" style={{ color: C.muted }}>
              {m.l}
            </p>
            <p className="mt-1.5 text-[16px] font-light tabular-nums tracking-tight" style={mono}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-[14px] font-medium">Waarom deze match</h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "#86c79b" }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <Check size={15} aria-hidden="true" style={{ color: "#5fae77", marginTop: 1 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.18em]"
              style={{ color: "#d9b277" }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <Minus size={15} aria-hidden="true" style={{ color: "#d9b277", marginTop: 1 }} />
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

function Verificatie() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={serif}>
          Verificatie
        </h1>
      </div>

      <Card hi className="flex items-center gap-5 p-6">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.accentLine}`, background: C.accentSoft }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.accent }} />
        </div>
        <div>
          <p className="text-[17px] font-medium">{PROFIEL.trust}</p>
          <p className="text-[12.5px]" style={{ color: C.muted }}>
            <span style={mono}>2</span> van <span style={mono}>4</span> credentials volledig
            geverifieerd · <span style={mono}>1</span> vraagt actie
          </p>
        </div>
      </Card>

      <Card>
        <div className="divide-y" style={{ borderColor: C.line }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#161616]"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ border: `1px solid ${C.line}` }}
                >
                  {c.status === "VERIFIED" ? (
                    <Check size={16} aria-hidden="true" style={{ color: st.dot }} />
                  ) : c.status === "SUBMITTED" ? (
                    <Clock size={16} aria-hidden="true" style={{ color: st.dot }} />
                  ) : (
                    <AlertTriangle size={16} aria-hidden="true" style={{ color: st.dot }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span className="text-[11.5px] font-medium" style={{ color: st.fg }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; Icon: LucideIcon }> = {
    warning: { fg: "#d9b277", Icon: AlertTriangle },
    info: { fg: C.accent, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={serif}>
          Volgende acties
        </h1>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Card key={a.titel} className="flex items-start gap-4 p-5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ border: `1px solid ${C.line}` }}
              >
                <t.Icon size={17} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#1c1c1c] focus-visible:outline-none focus-visible:ring-1"
                style={{ border: `1px solid ${C.line}`, color: C.ink }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: "#86c79b",
    Openstaand: "#d9b277",
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2 text-[30px] leading-tight tracking-tight" style={serif}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.accent, color: "#1a1408" }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr
              className="border-b text-[10.5px] uppercase tracking-[0.12em]"
              style={{ borderColor: C.line, color: C.faint }}
            >
              <th className="px-5 py-3 font-medium">Nummer</th>
              <th className="px-5 py-3 font-medium">Klant</th>
              <th className="px-5 py-3 font-medium">Datum</th>
              <th className="px-5 py-3 text-right font-medium">Bedrag</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => (
              <tr
                key={f.nr}
                className="border-b transition-colors last:border-0 hover:bg-[#161616]"
                style={{ borderColor: C.lineSoft }}
              >
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.inkSoft, ...mono }}>
                  {f.nr}
                </td>
                <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
                <td className="px-5 py-3.5 text-[12.5px]" style={{ color: C.muted, ...mono }}>
                  {f.datum}
                </td>
                <td
                  className="px-5 py-3.5 text-right text-[13px] font-medium tabular-nums"
                  style={mono}
                >
                  {f.bedrag}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
                    style={{ color: statusTone[f.status] ?? C.muted }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusTone[f.status] ?? C.muted }}
                      aria-hidden="true"
                    />
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
