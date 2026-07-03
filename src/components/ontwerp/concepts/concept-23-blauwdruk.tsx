"use client";

// Concept 23 — "Blauwdruk" · Technische blauwdruk / drafting.
// Engineering-blueprint-esthetiek: diep navy canvas met een fijn millimeter-raster, cyaan lijnwerk,
// gestreepte constructielijnen, dimensie-annotaties (maatpijltjes met waarden), monospace labels en
// hoek-crop-marks. Systeemdenken zichtbaar: wireframe-logica als eindontwerp. Geen glow — drafting-precisie.
// Palet: blueprint navy #0d2137, raster-lijn rgba(120,180,230,0.12), ink #cfe3f2, cyaan #4db8ff,
// blauw-secundair #7fb3d5, geverifieerd #5fd0a0, waarschuwing #f2b24c. Dunne 1px randen, geen zware schaduwen.
// Fonts: Geist (koppen) + IBM Plex Mono (labels/annotaties/cijfers).

import { useState } from "react";
import {
  LayoutGrid,
  Compass,
  FileText,
  ShieldCheck,
  ListChecks,
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
  Ruler,
  Inbox,
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

const C = {
  navy: "#0d2137",
  navyDeep: "#0a1a2c",
  panel: "#0f2740",
  panelSoft: "#12304d",
  ink: "#cfe3f2",
  inkSoft: "#9db8ce",
  muted: "#6f90aa",
  faint: "#4f6f8a",
  line: "rgba(120,180,230,0.22)",
  lineSoft: "rgba(120,180,230,0.12)",
  cyan: "#4db8ff",
  cyanSoft: "rgba(77,184,255,0.14)",
  blue: "#7fb3d5",
  blueSoft: "rgba(127,179,213,0.14)",
  groen: "#5fd0a0",
  groenSoft: "rgba(95,208,160,0.16)",
  amber: "#f2b24c",
  amberSoft: "rgba(242,178,76,0.16)",
  rose: "#f2836c",
  roseSoft: "rgba(242,131,108,0.16)",
};

const head = { fontFamily: "var(--font-lab-geist)" };
const mono = { fontFamily: "var(--font-lab-plex-mono)" };

// Millimeter-raster via twee linear-gradients (fijn + grof).
const GRID =
  "linear-gradient(rgba(120,180,230,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,230,0.12) 1px, transparent 1px), linear-gradient(rgba(120,180,230,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,230,0.05) 1px, transparent 1px)";
const GRID_SIZE = "40px 40px, 40px 40px, 8px 8px, 8px 8px";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Compass,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Inbox,
};

function statusStyle(s: CredStatus): { label: string; fg: string; bg: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.groen, bg: C.groenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.cyan, bg: C.cyanSoft };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.amber, bg: C.amberSoft };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.rose, bg: C.roseSoft };
  }
}

// Technische hoek-crop-marks op panelen.
function CropCorners({ color = C.cyan }: { color?: string }) {
  const base = "absolute h-2.5 w-2.5";
  return (
    <div aria-hidden="true">
      <span className={`${base} left-1 top-1 border-l border-t`} style={{ borderColor: color }} />
      <span className={`${base} right-1 top-1 border-r border-t`} style={{ borderColor: color }} />
      <span
        className={`${base} bottom-1 left-1 border-b border-l`}
        style={{ borderColor: color }}
      />
      <span
        className={`${base} bottom-1 right-1 border-b border-r`}
        style={{ borderColor: color }}
      />
    </div>
  );
}

// Gedimensioneerde maatlijn met pijltjes en waarde.
function DimensionLine({ value, color = C.cyan }: { value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <svg width="46" height="10" viewBox="0 0 46 10" className="shrink-0">
        <line x1="1" y1="5" x2="45" y2="5" stroke={color} strokeWidth="0.8" opacity="0.7" />
        <path d="M1 5 L5 2.5 L5 7.5 Z" fill={color} />
        <path d="M45 5 L41 2.5 L41 7.5 Z" fill={color} />
        <line x1="1" y1="1" x2="1" y2="9" stroke={color} strokeWidth="0.8" />
        <line x1="45" y1="1" x2="45" y2="9" stroke={color} strokeWidth="0.8" />
      </svg>
      <span className="text-[9.5px] tabular-nums" style={{ ...mono, color }}>
        {value}
      </span>
    </div>
  );
}

function Sparkline({ data, color = C.cyan }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {pts.map((p, i) => (
        <line
          key={i}
          x1={p[0]}
          y1={0}
          x2={p[0]}
          y2={h}
          stroke={color}
          strokeWidth={0.4}
          opacity={0.12}
        />
      ))}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={`d${i}`} cx={p[0]} cy={p[1]} r={1} fill={color} />
      ))}
    </svg>
  );
}

function Kicker({ children, color = C.cyan }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={{ ...mono, color }}
    >
      <span
        className="inline-block h-2 w-2 border"
        style={{ borderColor: color }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
  rev,
  crop = true,
}: {
  children: React.ReactNode;
  className?: string;
  rev?: string;
  crop?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[3px] ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      {crop && <CropCorners />}
      {rev && (
        <span
          className="absolute right-2 top-2 rounded-[2px] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...mono, color: C.faint, border: `1px solid ${C.lineSoft}` }}
          aria-hidden="true"
        >
          REV. {rev}
        </span>
      )}
      {children}
    </div>
  );
}

export function Concept23() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...head,
        color: C.ink,
        background: C.navy,
        backgroundImage: GRID,
        backgroundSize: GRID_SIZE,
      }}
    >
      {/* vignet-rand */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 160px 20px rgba(6,16,28,0.55)" }}
        aria-hidden="true"
      />
      <div className="relative flex min-h-[680px]">
        {/* Sidebar — technische legenda-rail */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col px-4 py-6 lg:flex"
          style={{ borderRight: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-3 px-1 pb-7">
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-[3px]"
              style={{ background: C.cyanSoft, border: `1px solid ${C.cyan}` }}
            >
              <Ruler size={19} aria-hidden="true" style={{ color: C.cyan }} />
            </div>
            <div>
              <div className="text-[15px] font-semibold leading-tight" style={head}>
                ZZP Blauwdruk
              </div>
              <div
                className="text-[9.5px] uppercase tracking-[0.14em]"
                style={{ ...mono, color: C.muted }}
              >
                schaal 1:1 · SI
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s, i) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    color: on ? C.ink : C.inkSoft,
                    background: on ? C.panelSoft : "transparent",
                    border: `1px solid ${on ? C.cyan : "transparent"}`,
                  }}
                >
                  <span
                    className="text-[9px] tabular-nums"
                    style={{ ...mono, color: on ? C.cyan : C.faint }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon size={15} aria-hidden="true" style={{ color: on ? C.cyan : C.muted }} />
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Title block */}
          <div className="mt-auto">
            <div className="rounded-[3px] p-0" style={{ border: `1px solid ${C.line}` }}>
              <div className="grid grid-cols-2 text-[9px]" style={mono}>
                <div
                  className="border-b border-r px-2.5 py-1.5"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  GET.
                </div>
                <div
                  className="border-b px-2.5 py-1.5"
                  style={{ borderColor: C.lineSoft, color: C.ink }}
                >
                  {PROFIEL.initialen}
                </div>
                <div
                  className="border-r px-2.5 py-1.5"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  BLAD
                </div>
                <div className="px-2.5 py-1.5" style={{ color: C.ink }}>
                  01 / 06
                </div>
              </div>
              <div
                className="flex items-center gap-2.5 border-t px-2.5 py-2.5"
                style={{ borderColor: C.line }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[3px] text-[11px] font-semibold"
                  style={{ background: C.cyanSoft, color: C.cyan, ...mono }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[11.5px] font-semibold" style={{ color: C.ink }}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="truncate text-[9px] uppercase tracking-[0.1em]"
                    style={{ ...mono, color: C.muted }}
                  >
                    {PROFIEL.plaats}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-[70px] shrink-0 items-center gap-3 px-6 lg:px-9"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <div
              className="flex items-center gap-2 text-[11px]"
              style={{ ...mono, color: C.muted }}
            >
              <span className="uppercase tracking-[0.14em]">{PROFIEL.plaats}</span>
              <ChevronRight size={12} aria-hidden="true" style={{ color: C.faint }} />
              <span className="font-semibold uppercase tracking-[0.14em]" style={{ color: C.cyan }}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2.5 rounded-[3px] px-4 py-2.5 text-[12px] transition-colors hover:bg-[#12304d] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.muted, border: `1px solid ${C.line}` }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline" style={mono}>
                  zoek in tekening…
                </span>
              </button>
              <button
                className="relative rounded-[3px] p-2.5 transition-colors hover:bg-[#12304d] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.muted, border: `1px solid ${C.line}` }}
                aria-label="Meldingen"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
                  style={{ background: C.cyan }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto px-4 py-2 lg:hidden"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 rounded-[3px] px-3.5 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    color: on ? C.cyan : C.muted,
                    background: on ? C.panelSoft : "transparent",
                    border: `1px solid ${on ? C.cyan : "transparent"}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-7 lg:px-9 lg:py-8">
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

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <Kicker>Overzichtstekening · vandaag</Kicker>
        <h1 className="mt-3 text-[31px] font-semibold leading-[1.06] tracking-tight" style={head}>
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je profiel is opgemeten en gedimensioneerd. Drie opdrachten passen binnen de toleranties;
          één certificaat valt buiten de norm.
        </p>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => (
          <Panel key={k.label} rev={String.fromCharCode(65 + i)} className="p-4 pt-6">
            <p
              className="text-[11px] uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.muted }}
            >
              {k.label}
            </p>
            <p
              className="mt-2 text-[25px] font-semibold tabular-nums leading-none tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-3.5 flex items-center justify-between">
              <span
                className="inline-flex items-center gap-0.5 rounded-[2px] px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
                style={{
                  color: k.up ? C.groen : C.amber,
                  background: k.up ? C.groenSoft : C.amberSoft,
                  ...mono,
                }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
              <Sparkline data={k.spark} color={k.up ? C.cyan : C.amber} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between px-0.5">
              <h2 className="text-[15px] font-semibold" style={head}>
                Beste matches
              </h2>
              <span
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                gesorteerd op tolerantie
              </span>
            </div>
            <Panel className="p-2" crop={false}>
              <div className="flex flex-col gap-0.5">
                {OPDRACHTEN.map((o) => (
                  <button
                    key={o.id}
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-[3px] px-3.5 py-3 text-left transition-colors hover:bg-[#12304d] focus-visible:outline-none focus-visible:ring-2"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] text-[12px] font-semibold tabular-nums"
                      style={{
                        background: C.cyanSoft,
                        color: C.cyan,
                        border: `1px solid ${C.line}`,
                        ...mono,
                      }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[11.5px] tabular-nums sm:block"
                      style={{ ...mono, color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between px-0.5">
              <h2 className="text-[15px] font-semibold" style={head}>
                Correspondentie
              </h2>
              <span
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.cyan }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} ongelezen
              </span>
            </div>
            <Panel className="p-2" crop={false}>
              <div className="flex flex-col gap-0.5">
                {BERICHTEN.map((b) => (
                  <div
                    key={b.van}
                    className="flex items-center gap-3.5 rounded-[3px] px-3.5 py-2.5 transition-colors hover:bg-[#12304d]"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] text-[10.5px] font-semibold"
                      style={{
                        background: b.ongelezen ? C.cyanSoft : C.panelSoft,
                        color: b.ongelezen ? C.cyan : C.muted,
                        border: `1px solid ${C.line}`,
                        ...mono,
                      }}
                    >
                      {b.initialen}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12.5px] font-semibold">{b.van}</p>
                        {b.ongelezen && (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: C.cyan }}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                        {b.preview}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[10.5px] tabular-nums"
                      style={{ ...mono, color: C.faint }}
                    >
                      {b.tijd}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Rechterkolom */}
        <div className="space-y-5">
          <div>
            <h2 className="mb-3 px-0.5 text-[15px] font-semibold" style={head}>
              Certificaten
            </h2>
            <Panel className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px]"
                        style={{ background: st.bg, border: `1px solid ${st.fg}` }}
                        aria-hidden="true"
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Volgende beste stap */}
          <Panel rev="A" className="overflow-hidden p-0">
            <div
              className="px-4 py-3.5"
              style={{ background: C.cyanSoft, borderBottom: `1px solid ${C.line}` }}
            >
              <p
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ ...mono, color: C.cyan }}
              >
                Volgende beste stap
              </p>
              <p
                className="mt-1.5 text-[15px] font-semibold leading-snug"
                style={{ ...head, color: C.ink }}
              >
                {primair.titel}
              </p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                {primair.detail}
              </p>
              <button
                className="mt-3 w-full rounded-[3px] px-4 py-2.5 text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.cyan, color: C.navyDeep }}
              >
                {primair.cta}
              </button>
            </div>
          </Panel>
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
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker color={C.blue}>Marktplaats · onderdelenlijst</Kicker>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
          Open opdrachten
        </h1>
      </div>

      <div
        className="flex items-center gap-3 rounded-[3px] px-4 py-3"
        style={{ border: `1px solid ${C.line}`, background: C.panel }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#4f6f8a]"
          style={{ ...mono, color: C.ink }}
        />
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex flex-col items-center px-6 py-16 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[3px]"
            style={{ background: C.blueSoft, border: `1px solid ${C.blue}` }}
          >
            <Compass size={24} aria-hidden="true" style={{ color: C.blue }} />
          </div>
          <p className="mt-4 text-[16px] font-semibold" style={head}>
            Geen onderdelen gevonden
          </p>
          <p className="mt-1.5 max-w-sm text-[12px]" style={{ color: C.muted }}>
            Verruim je zoekwoorden. Nieuwe opdrachten worden automatisch aan de onderdelenlijst
            toegevoegd zodra ze binnenkomen.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group relative rounded-[3px] p-5 pt-6 text-left transition-colors hover:bg-[#12304d] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: C.panel, border: `1px solid ${C.line}` }}
            >
              <CropCorners />
              <span
                className="absolute right-2 top-2 rounded-[2px] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.faint, border: `1px solid ${C.lineSoft}` }}
                aria-hidden="true"
              >
                REV. {String.fromCharCode(65 + i)}
              </span>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] tracking-wide" style={{ ...mono, color: C.faint }}>
                  {o.id}
                </span>
                <span
                  className="rounded-[2px] px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ background: C.cyanSoft, color: C.cyan, ...mono }}
                >
                  {o.match}% MATCH
                </span>
              </div>
              <p className="mt-3 text-[16px] font-semibold leading-snug" style={head}>
                {o.titel}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-[2px] px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: C.panelSoft,
                      color: C.inkSoft,
                      border: `1px solid ${C.lineSoft}`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3.5"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="text-[12px] font-semibold tabular-nums"
                  style={{ ...mono, color: C.cyan }}
                >
                  {o.tarief}
                </span>
                <DimensionLine value={o.uren.replace(" u/week", "u")} color={C.blue} />
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{opdracht.id}</Kicker>
          <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
            {opdracht.titel}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 rounded-[3px] px-6 py-3 text-[13px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.cyan, color: C.navyDeep }}
        >
          Reageer op opdracht
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4 pt-5">
            <p
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ ...mono, color: C.ink }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel rev="A" className="p-6">
        <h3 className="text-[16px] font-semibold" style={head}>
          Waarom deze match
        </h3>
        <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
          Transparant gedimensioneerd op basis van je profiel — elke tolerantie zichtbaar.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            className="rounded-[3px] p-4"
            style={{ background: C.groenSoft, border: `1px solid ${C.groen}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.groen }}
            >
              Binnen tolerantie
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[12.5px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: C.groen }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.navyDeep }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-[3px] p-4"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}` }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ ...mono, color: C.amber }}
            >
              Buiten tolerantie
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[12.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: "rgba(242,178,76,0.24)" }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Keuring · vertrouwen</Kicker>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
          Verificatie
        </h1>
      </div>

      <Panel rev="A" className="flex items-center gap-5 p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px]"
          style={{ background: C.groenSoft, border: `1px solid ${C.groen}` }}
        >
          <ShieldCheck size={26} aria-hidden="true" style={{ color: C.groen }} />
        </div>
        <div>
          <p className="text-[19px] font-semibold" style={head}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: C.inkSoft }}>
            <span style={mono}>{verified}</span> van <span style={mono}>{CREDENTIALS.length}</span>{" "}
            certificaten gekeurd · <span style={mono}>1</span> buiten norm. Alles versleuteld
            opgeslagen.
          </p>
        </div>
      </Panel>

      <Panel className="p-2" crop={false}>
        <div className="flex flex-col gap-0.5">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 rounded-[3px] px-3.5 py-3.5 transition-colors hover:bg-[#12304d]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px]"
                  style={{ background: st.bg, border: `1px solid ${st.fg}` }}
                >
                  {c.status === "VERIFIED" ? (
                    <Check size={17} aria-hidden="true" style={{ color: st.fg }} />
                  ) : c.status === "SUBMITTED" ? (
                    <Clock size={17} aria-hidden="true" style={{ color: st.fg }} />
                  ) : (
                    <AlertTriangle size={17} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-[2px] px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.fg, background: st.bg, border: `1px solid ${st.fg}` }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div>
        <h2 className="mb-3 px-0.5 text-[15px] font-semibold" style={head}>
          Opgeslagen documenten
        </h2>
        <Panel className="p-2" crop={false}>
          <div className="flex flex-col gap-0.5">
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div
                  key={d.naam}
                  className="flex items-center gap-3.5 rounded-[3px] px-3.5 py-3 transition-colors hover:bg-[#12304d]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px]"
                    style={{ background: C.panelSoft, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={16} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[10.5px]" style={{ ...mono, color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-[2px] px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Acties() {
  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.cyan, bg: C.cyanSoft, Icon: Bell },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Werklijst · aandacht</Kicker>
        <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
          Volgende acties
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkSoft }}>
          Eén bewerking tegelijk. Wij bewaken de rest van de werklijst.
        </p>
      </div>
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Panel key={a.titel} className="flex items-start gap-4 p-4" crop={false}>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px]"
                style={{ background: t.bg, border: `1px solid ${t.fg}` }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] tabular-nums" style={{ ...mono, color: C.faint }}>
                    OP-{String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[14px] font-semibold" style={head}>
                    {a.titel}
                  </p>
                </div>
                <p className="mt-0.5 text-[12px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-[3px] px-4 py-2 text-[12px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: C.cyanSoft, color: C.cyan, border: `1px solid ${C.cyan}` }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.groen, bg: C.groenSoft },
    Openstaand: { fg: C.amber, bg: C.amberSoft },
    Concept: { fg: C.muted, bg: C.panelSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Staat · omzet</Kicker>
          <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight" style={head}>
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[3px] px-5 py-2.5 text-[12.5px] font-semibold transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: C.cyan, color: C.navyDeep }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden" crop={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.12em]"
                style={{ ...mono, color: C.muted }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="px-5 py-3 font-semibold">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: C.panelSoft };
                return (
                  <tr
                    key={f.nr}
                    className="border-t transition-colors hover:bg-[#12304d]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.inkSoft }}>
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ ...mono, color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                      style={{ ...mono, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[2px] px-3 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg }}
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
      </Panel>
    </div>
  );
}
