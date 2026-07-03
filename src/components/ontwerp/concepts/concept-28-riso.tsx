"use client";

// Concept 28 — "Riso" · Risograph duotone print (grafisch, bold).
// Twee-inkts overdruk (kobaltblauw + fluor-roze) op ongebleekt papier, halftoon-punt-textuur,
// lichte misregister-randen (verschoven gekleurde kopie achter een element), korrel en print-craft.
// Bold vlakken, grote grafische koppen. Distinct van vlakke dopamine-blokken (07): hier draait
// het om textuur, duotone-overdruk en druktechniek.
// Palet: papier #f3efe3, ink #16161d, kobalt #2b39d6, fluor-roze #ff3d8b, overdruk-paars #8b2fae,
// muted #6c6a63. Roze = hoofdaccent. Fonts: Bricolage Grotesque (koppen) + Space Grotesk (UI).

import { useState } from "react";
import {
  LayoutGrid,
  Store,
  FileText,
  BadgeCheck,
  ListChecks,
  Receipt,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  ChevronRight,
  Mail,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  ink: "#16161d",
  inkSoft: "#3a3945",
  muted: "#6c6a63",
  faint: "#9a978c",
  paper: "#f3efe3",
  paperCard: "#faf7ee",
  line: "#ddd8c8",
  cobalt: "#2b39d6",
  pink: "#ff3d8b",
  purple: "#8b2fae",
  cobaltSoft: "rgba(43,57,214,0.12)",
  pinkSoft: "rgba(255,61,139,0.14)",
};

const head = { fontFamily: "var(--font-lab-bricolage)" };
const ui = { fontFamily: "var(--font-lab-space)" };

// Halftoon-punt-textuur — lage opacity dot-grid, het handelsmerk van riso-druk.
function halftone(color: string, size = 6, opacity = 0.5): React.CSSProperties {
  return {
    backgroundImage: `radial-gradient(${color} 1px, transparent 1.4px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };
}

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutGrid,
  marktplaats: Store,
  opdracht: FileText,
  verificatie: BadgeCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: FileText,
  berichten: Mail,
};

function statusStyle(s: CredStatus): { label: string; Icon: LucideIcon; color: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, color: C.cobalt };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, color: C.purple };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, color: C.pink };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, color: C.pink };
  }
}

// Registratiekruisje — subtiel drukkersmerk in de hoeken.
function RegMark({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 14 14"
      aria-hidden="true"
      style={{ position: "absolute", opacity: 0.5, ...style }}
    >
      <line x1="7" y1="0" x2="7" y2="14" stroke={C.cobalt} strokeWidth="0.8" />
      <line x1="0" y1="7" x2="14" y2="7" stroke={C.pink} strokeWidth="0.8" />
      <circle cx="7" cy="7" r="3.2" fill="none" stroke={C.ink} strokeWidth="0.6" />
    </svg>
  );
}

// Misregister-kop: dezelfde tekst in kobalt, 3px verschoven achter de roze/inkt-versie.
function MisText({
  children,
  className = "",
  front = C.ink,
  size,
}: {
  children: React.ReactNode;
  className?: string;
  front?: string;
  size?: string;
}) {
  return (
    <span className={`relative inline-block ${className}`} style={{ ...head, fontSize: size }}>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 select-none"
        style={{ color: C.cobalt, transform: "translate(3px, 3px)", opacity: 0.85 }}
      >
        {children}
      </span>
      <span className="relative" style={{ color: front }}>
        {children}
      </span>
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 90;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={line}
        fill="none"
        stroke={C.cobalt}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        transform="translate(2,2)"
        opacity={0.55}
      />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Kaart met misregister-schaduw (kobalt-vorm verschoven onder de kaart).
function RisoCard({
  children,
  className = "",
  shadow = C.cobalt,
  bg = C.paperCard,
}: {
  children: React.ReactNode;
  className?: string;
  shadow?: string;
  bg?: string;
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: shadow, transform: "translate(4px, 4px)", opacity: 0.9 }}
      />
      <div
        className={`relative ${className}`}
        style={{ background: bg, border: `2px solid ${C.ink}` }}
      >
        {children}
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = "pink",
}: {
  children: React.ReactNode;
  tone?: "pink" | "cobalt";
}) {
  const color = tone === "pink" ? C.pink : C.cobalt;
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.06em]"
      style={{ ...ui, color, border: `1.5px solid ${color}`, padding: "2px 7px" }}
    >
      {children}
    </span>
  );
}

export function Concept28() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...ui, color: C.ink, background: C.paper }}
    >
      {/* Globale korrel/halftoon-overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={halftone(C.ink, 5, 0.05)}
      />
      {/* Registratiekruisjes in de hoeken */}
      <RegMark style={{ top: 8, left: 8 }} />
      <RegMark style={{ top: 8, right: 8 }} />
      <RegMark style={{ bottom: 8, left: 8 }} />
      <RegMark style={{ bottom: 8, right: 8 }} />

      <div className="relative flex min-h-[680px]">
        {/* Sidebar */}
        <aside
          className="hidden w-[240px] shrink-0 flex-col px-4 py-6 lg:flex"
          style={{ borderRight: `2px solid ${C.ink}` }}
        >
          <div className="flex items-center gap-3 px-2 pb-8">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: C.cobalt, transform: "translate(3px,3px)" }}
              />
              <div
                className="relative flex h-11 w-11 items-center justify-center text-[20px] font-black text-white"
                style={{ ...head, background: C.pink, border: `2px solid ${C.ink}` }}
              >
                Z
              </div>
            </div>
            <div>
              <div className="text-[15px] font-black leading-tight" style={head}>
                ZZP Platform
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                Riso-editie
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...ui, color: on ? "#fff" : C.inkSoft }}
                >
                  {on && (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ background: C.cobalt, transform: "translate(3px,3px)" }}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ background: C.pink, border: `2px solid ${C.ink}` }}
                      />
                    </>
                  )}
                  <Icon
                    size={16}
                    aria-hidden="true"
                    className="relative shrink-0"
                    style={{ color: on ? "#fff" : C.cobalt }}
                  />
                  <span className="relative">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 px-2">
            <p
              className="pb-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              Meer katernen
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NAV.slice(2).map((n) => (
                <span
                  key={n}
                  className="text-[10px] font-bold"
                  style={{
                    ...ui,
                    color: C.muted,
                    border: `1.5px solid ${C.line}`,
                    padding: "2px 6px",
                  }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <RisoCard className="flex items-center gap-3 p-3" shadow={C.pink}>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center text-[12px] font-black text-white"
                style={{ ...head, background: C.cobalt }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-black" style={head}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="truncate text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: C.pink }}
                >
                  {PROFIEL.trust}
                </div>
              </div>
            </RisoCard>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-[70px] shrink-0 items-center gap-3 px-6 lg:px-9"
            style={{ borderBottom: `2px solid ${C.ink}` }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {PROFIEL.rol}
            </span>
            <ChevronRight size={13} aria-hidden="true" style={{ color: C.faint }} />
            <span className="text-[13px] font-black" style={{ ...head, color: C.ink }}>
              {SCREENS.find((s) => s.key === screen)?.label}
            </span>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...ui,
                  color: C.inkSoft,
                  border: `2px solid ${C.ink}`,
                  background: C.paperCard,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Zoek</span>
              </button>
              <button
                className="relative px-3 py-2 transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2"
                style={{ color: C.ink, border: `2px solid ${C.ink}`, background: C.pink }}
                aria-label="Meldingen"
              >
                <Mail size={15} aria-hidden="true" style={{ color: "#fff" }} />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div
            className="flex gap-2 overflow-x-auto px-4 py-2 lg:hidden"
            style={{ borderBottom: `2px solid ${C.ink}` }}
          >
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  className="shrink-0 px-3 py-1.5 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    ...ui,
                    color: on ? "#fff" : C.inkSoft,
                    background: on ? C.pink : "transparent",
                    border: `2px solid ${on ? C.ink : C.line}`,
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

/* ---------------------------------- Dashboard ---------------------------------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const onread = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Duotone-koptekst met misregister */}
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.pink }}>
          Overzicht · vandaag
        </p>
        <h1 className="mt-2 leading-[0.92] tracking-[-0.02em]">
          <MisText size="clamp(38px, 6vw, 56px)" className="font-black">
            Hoi, {PROFIEL.naam.split(" ")[0]}.
          </MisText>
        </h1>
        <p className="mt-4 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
          Drie sterke matches staan klaar en één certificaat vraagt om aandacht. Alles in twee
          inkten, niets verborgen.
        </p>
      </div>

      {/* KPI-tegels */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k) => (
          <RisoCard key={k.label} className="overflow-hidden p-4" shadow={k.up ? C.cobalt : C.pink}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={halftone(k.up ? C.cobalt : C.pink, 6, 0.1)}
            />
            <div className="relative">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </p>
              <p
                className="mt-1.5 text-[28px] font-black tabular-nums leading-none"
                style={{ ...head, color: C.ink }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
                  style={{ color: k.up ? C.cobalt : C.pink }}
                >
                  {k.up ? (
                    <ArrowUpRight size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={12} aria-hidden="true" />
                  )}
                  {k.trend}
                </span>
                <Sparkline data={k.spark} color={k.up ? C.pink : C.cobalt} />
              </div>
            </div>
          </RisoCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Beste matches */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2
                className="text-[20px] font-black tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                Beste matches
              </h2>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.pink }}
              >
                Verklaarbaar
              </span>
            </div>
            <div className="space-y-3">
              {OPDRACHTEN.map((o, i) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <RisoCard
                    className="flex items-center gap-4 p-4 transition-transform group-hover:-translate-y-[2px]"
                    shadow={i === 0 ? C.pink : C.cobalt}
                  >
                    <div
                      className="relative flex h-12 w-12 shrink-0 items-center justify-center text-[15px] font-black text-white"
                      style={{ ...head, background: i === 0 ? C.pink : C.cobalt }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={halftone("#ffffff", 5, 0.18)}
                      />
                      <span className="relative tabular-nums">{o.match}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-black" style={{ ...head }}>
                        {o.titel}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[13px] font-black tabular-nums sm:block"
                      style={{ ...head, color: C.cobalt }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={17} aria-hidden="true" style={{ color: C.faint }} />
                  </RisoCard>
                </button>
              ))}
            </div>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2
                className="text-[20px] font-black tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                Berichten
              </h2>
              <span
                className="text-[11px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.pink }}
              >
                {onread} ongelezen
              </span>
            </div>
            <RisoCard className="divide-y p-1" shadow={C.cobalt}>
              {BERICHTEN.map((b) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3 px-3 py-3"
                  style={{ borderColor: C.line }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[11px] font-black text-white"
                    style={{ ...head, background: b.ongelezen ? C.pink : C.faint }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-black" style={head}>
                        {b.van}
                      </p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.pink }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] tabular-nums" style={{ color: C.faint }}>
                    {b.tijd}
                  </span>
                </div>
              ))}
            </RisoCard>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          {/* Volgende beste stap — duotone-vlak */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: C.cobalt, transform: "translate(5px,5px)" }}
            />
            <div
              className="relative overflow-hidden p-5"
              style={{ background: C.pink, border: `2px solid ${C.ink}` }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={halftone("#ffffff", 7, 0.16)}
              />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/85">
                  Volgende beste stap
                </p>
                <h3 className="mt-2 text-[19px] font-black leading-tight text-white" style={head}>
                  {primair.titel}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/90">{primair.detail}</p>
                <button
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ ...ui, color: C.ink, background: "#fff", border: `2px solid ${C.ink}` }}
                >
                  {primair.cta}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Certificaten */}
          <div>
            <h2
              className="mb-3 text-[20px] font-black tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              Certificaten
            </h2>
            <RisoCard className="space-y-3 p-4" shadow={C.pink}>
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center"
                      style={{ background: st.color, border: `2px solid ${C.ink}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} style={{ color: "#fff" }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-black" style={head}>
                        {c.naam}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RisoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Marktplaats --------------------------------- */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.pink }}>
          Marktplaats
        </p>
        <h1 className="mt-2">
          <MisText size="clamp(30px, 4.5vw, 42px)" className="font-black">
            Open opdrachten
          </MisText>
        </h1>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: C.paperCard, border: `2px solid ${C.ink}` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.cobalt }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] font-medium outline-none"
          style={{ ...ui, color: C.ink }}
        />
        <span className="shrink-0 text-[11px] font-bold tabular-nums" style={{ color: C.muted }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <RisoCard className="px-6 py-16 text-center" shadow={C.pink}>
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center"
            style={{ background: C.pink, border: `2px solid ${C.ink}` }}
            aria-hidden="true"
          >
            <Store size={26} style={{ color: "#fff" }} />
          </div>
          <p className="mt-4 text-[22px] font-black" style={{ ...head, color: C.ink }}>
            Niets gevonden voor “{q}”
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13px]" style={{ color: C.muted }}>
            Pas je zoekterm aan of verbreed je beschikbaarheid. We drukken een nieuwe editie zodra
            er iets passends binnenkomt.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 inline-flex px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ...ui, color: "#fff", background: C.cobalt, border: `2px solid ${C.ink}` }}
          >
            Toon alles
          </button>
        </RisoCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <RisoCard
                className="flex h-full flex-col p-5 transition-transform group-hover:-translate-y-[2px]"
                shadow={i % 2 === 0 ? C.pink : C.cobalt}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: C.faint }}
                  >
                    {o.id}
                  </span>
                  <span
                    className="text-[13px] font-black tabular-nums text-white"
                    style={{
                      ...head,
                      background: C.pink,
                      border: `2px solid ${C.ink}`,
                      padding: "1px 8px",
                    }}
                  >
                    {o.match}%
                  </span>
                </div>
                <h3
                  className="mt-3 text-[20px] font-black leading-[1.05]"
                  style={{ ...head, color: C.ink }}
                >
                  {o.titel}
                </h3>
                <p
                  className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <Chip key={t} tone={i % 2 === 0 ? "cobalt" : "pink"}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <div
                  className="mt-auto flex items-center justify-between border-t-2 pt-3 text-[12.5px]"
                  style={{ borderColor: C.ink, marginTop: "1rem" }}
                >
                  <span className="font-black tabular-nums" style={{ ...head, color: C.cobalt }}>
                    {o.tarief}
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </RisoCard>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Opdrachtdetail ------------------------------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.pink }}
          >
            {opdracht.id}
          </p>
          <h1 className="mt-2">
            <MisText size="clamp(28px, 4vw, 40px)" className="font-black">
              {opdracht.titel}
            </MisText>
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-[13px]" style={{ color: C.muted }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <button
          className="shrink-0 self-start px-5 py-3 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...ui, background: C.pink, border: `2px solid ${C.ink}` }}
        >
          Reageer op opdracht
        </button>
      </div>

      {/* Duotone-foto-blok (placeholder) + metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <RisoCard
            key={m.l}
            className="overflow-hidden p-4"
            shadow={i % 2 === 0 ? C.cobalt : C.pink}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={halftone(i % 2 === 0 ? C.cobalt : C.pink, 6, 0.09)}
            />
            <div className="relative">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {m.l}
              </p>
              <p
                className="mt-1 text-[19px] font-black tabular-nums leading-none"
                style={{ ...head, color: C.ink }}
              >
                {m.v}
              </p>
            </div>
          </RisoCard>
        ))}
      </div>

      {/* Waarom deze match */}
      <div>
        <h2 className="text-[22px] font-black tracking-tight" style={{ ...head, color: C.ink }}>
          Waarom deze match
        </h2>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je profiel — twee inkten, niets verstopt.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RisoCard className="p-5" shadow={C.cobalt}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.cobalt }}
            >
              Pleit vóór
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.cobalt, border: `1.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </RisoCard>
          <RisoCard className="p-5" shadow={C.pink}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.pink }}
            >
              Kanttekeningen
            </p>
            <ul className="mt-3 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    style={{ background: C.pink, border: `1.5px solid ${C.ink}` }}
                    aria-hidden="true"
                  >
                    <Minus size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </RisoCard>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Verificatie --------------------------------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.pink }}>
          Vertrouwen
        </p>
        <h1 className="mt-2">
          <MisText size="clamp(30px, 4.5vw, 42px)" className="font-black">
            Verificatie
          </MisText>
        </h1>
      </div>

      {/* Trust-banner in kobalt met halftoon */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: C.pink, transform: "translate(5px,5px)" }}
        />
        <div
          className="relative flex flex-wrap items-center gap-x-6 gap-y-3 overflow-hidden p-5"
          style={{ background: C.cobalt, border: `2px solid ${C.ink}` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={halftone("#ffffff", 7, 0.14)}
          />
          <div className="relative flex items-center gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ background: "#fff", border: `2px solid ${C.ink}` }}
            >
              <BadgeCheck size={26} aria-hidden="true" style={{ color: C.cobalt }} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                Vertrouwensniveau
              </p>
              <p className="text-[22px] font-black leading-none text-white" style={head}>
                {PROFIEL.trust}
              </p>
            </div>
          </div>
          <p className="relative text-[12.5px] leading-snug text-white/90">
            <span className="font-black tabular-nums text-white">{verified}</span> van{" "}
            <span className="font-black tabular-nums text-white">{CREDENTIALS.length}</span>{" "}
            certificaten geverifieerd · één vraagt om verlenging. Alles veilig en privé bewaard.
          </p>
        </div>
      </div>

      {/* Certificaten */}
      <RisoCard className="divide-y p-1.5" shadow={C.pink}>
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-3 py-3.5"
              style={{ borderColor: C.line }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center"
                style={{ background: st.color, border: `2px solid ${C.ink}` }}
                aria-hidden="true"
              >
                <st.Icon size={18} style={{ color: "#fff" }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-black" style={head}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.06em] text-white"
                style={{ background: st.color, border: `2px solid ${C.ink}`, padding: "3px 8px" }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </RisoCard>

      {/* Documenten */}
      <div>
        <h2
          className="mb-3 text-[20px] font-black tracking-tight"
          style={{ ...head, color: C.ink }}
        >
          Veilig bewaarde documenten
        </h2>
        <RisoCard className="divide-y p-1.5" shadow={C.cobalt}>
          {DOCUMENTEN.map((d) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3 px-3 py-3"
                style={{ borderColor: C.line }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{ background: C.paperCard, border: `2px solid ${C.ink}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.cobalt }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-black" style={head}>
                    {d.naam}
                  </p>
                  <p className="truncate text-[11px] tabular-nums" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[10px] font-bold uppercase tracking-[0.06em]"
                  style={{ color: st.color, border: `1.5px solid ${st.color}`, padding: "2px 7px" }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </RisoCard>
      </div>
    </div>
  );
}

/* ----------------------------------- Acties ------------------------------------ */

function Acties() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.pink }}>
          Aandacht
        </p>
        <h1 className="mt-2">
          <MisText size="clamp(30px, 4.5vw, 42px)" className="font-black">
            Volgende acties
          </MisText>
        </h1>
        <p className="mt-3 text-[13px]" style={{ color: C.inkSoft }}>
          Eén ding tegelijk. Wij houden de rest voor je in de gaten.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.pink : C.cobalt;
          return (
            <RisoCard key={a.titel} className="flex items-start gap-4 p-5" shadow={accent}>
              <div
                className="relative flex h-12 w-12 shrink-0 items-center justify-center text-[18px] font-black text-white"
                style={{ ...head, background: accent }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={halftone("#ffffff", 5, 0.18)}
                />
                <span className="relative tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: accent }}
                  >
                    {warn ? (
                      <AlertTriangle size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Ter info"}
                  </span>
                </div>
                <h3
                  className="mt-1 text-[16px] font-black leading-tight"
                  style={{ ...head, color: C.ink }}
                >
                  {a.titel}
                </h3>
                <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ...ui, color: "#fff", background: accent, border: `2px solid ${C.ink}` }}
              >
                {a.cta}
              </button>
            </RisoCard>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- Facturen ----------------------------------- */

function Facturen() {
  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: C.pink }}
          >
            Omzet
          </p>
          <h1 className="mt-2">
            <MisText size="clamp(30px, 4.5vw, 42px)" className="font-black">
              Facturen
            </MisText>
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 self-start px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ ...ui, background: C.pink, border: `2px solid ${C.ink}` }}
        >
          Nieuwe factuur
        </button>
      </div>

      <RisoCard className="overflow-hidden" shadow={C.cobalt}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.08em] text-white"
                style={{ background: C.ink }}
              >
                <th className="px-4 py-3 font-bold">Nummer</th>
                <th className="px-4 py-3 font-bold">Klant</th>
                <th className="px-4 py-3 font-bold">Datum</th>
                <th className="px-4 py-3 text-right font-bold">Bedrag</th>
                <th className="px-4 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const open = f.status === "Openstaand";
                const concept = f.status === "Concept";
                const color = open ? C.pink : concept ? C.faint : C.cobalt;
                return (
                  <tr key={f.nr} style={{ borderTop: `1.5px solid ${C.line}` }}>
                    <td
                      className="px-4 py-3.5 text-[12px] font-bold tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-bold" style={{ ...head }}>
                      {f.klant}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: C.muted }}>
                      {f.datum}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right text-[14px] font-black tabular-nums"
                      style={{ ...head, color: C.ink }}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                        style={{ color }}
                      >
                        <span
                          className="h-2 w-2"
                          style={{ background: color, border: `1px solid ${C.ink}` }}
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
      </RisoCard>
    </div>
  );
}
