"use client";

// Concept 48 — "Paspoort" · Identiteits- / reisdocument-beveiligingsesthetiek (LICHT).
// De verificatielaag — onze kerndifferentiator — gepresenteerd als een officieel ID-document:
// fijne guilloché-lijnpatronen, een MRZ-achtige machineleesbare strook in monospace, officiële
// stempelmotieven voor VERIFIED/EXPIRING/SUBMITTED, een holografisch zegel, security-microtekst.
// Het verificatiescherm is de held: gestempelde certificaatkaarten, guilloché-vlakken, MRZ-voet.
// Onderscheidend van elk letterpers-/lakzegel-concept: dit is paspoort/ID-graveerwerk,
// machineleesbaar en officieel.
// Palet: documentpapier #ece7d9, marineblauw-inkt #16233f, security-blauw #1e40af,
// stempelrood #b3261e, geverifieerd-groen #1f7a4d.
// Fonts: IBM Plex Mono (--font-lab-plex-mono) voor MRZ/data + Libre Franklin (--font-lab-franklin).

import { useState } from "react";
import {
  LayoutDashboard,
  Globe2,
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
  FileText,
  Send,
  Loader2,
  Stamp,
  Fingerprint,
  BadgeCheck,
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
  paper: "#ece7d9",
  paperHi: "#f4f0e6",
  paperLo: "#e3ddcc",
  card: "#f6f2e9",
  navy: "#16233f",
  navySoft: "#3a465f",
  muted: "#6d6a5c",
  faint: "#9a9585",
  line: "#cfc7b2",
  lineSoft: "#dcd5c3",
  blue: "#1e40af",
  blueSoft: "rgba(30,64,175,0.10)",
  red: "#b3261e",
  redSoft: "rgba(179,38,30,0.10)",
  green: "#1f7a4d",
  greenSoft: "rgba(31,122,77,0.12)",
  amber: "#a86a12",
  amberSoft: "rgba(168,106,18,0.12)",
  ink: "#16233f",
};

const body = { fontFamily: "var(--font-lab-franklin)" };
const machine = { fontFamily: "var(--font-lab-plex-mono)" };

// Guilloché: gelaagde herhalende lineaire + radiale verlopen die het fijne graveerpatroon
// van een bankbiljet/paspoort nabootsen. Subtiel genoeg om leesbaarheid te bewaren.
const GUILLOCHE = (hue: string) =>
  `repeating-radial-gradient(circle at 50% 50%, ${hue} 0px, ${hue} 0.6px, transparent 0.6px, transparent 6px), repeating-linear-gradient(45deg, ${hue} 0px, ${hue} 0.5px, transparent 0.5px, transparent 9px), repeating-linear-gradient(-45deg, ${hue} 0px, ${hue} 0.5px, transparent 0.5px, transparent 9px)`;

const GUILLOCHE_NAVY = GUILLOCHE("rgba(22,35,63,0.06)");

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Globe2,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  code: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", code: "VALID", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", code: "PENDING", fg: C.blue, bg: C.blueSoft, Icon: Clock };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        code: "EXPIRING",
        fg: C.amber,
        bg: C.amberSoft,
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return { label: "Afgewezen", code: "REVOKED", fg: C.red, bg: C.redSoft, Icon: AlertTriangle };
  }
}

/* ---------- Document-bouwstenen ---------- */

function Card({
  children,
  className = "",
  guilloche = false,
}: {
  children: React.ReactNode;
  className?: string;
  guilloche?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 10px 26px -24px rgba(22,35,63,0.5)",
      }}
    >
      {guilloche && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: GUILLOCHE_NAVY }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

function Kicker({ children, color = C.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.32em]"
      style={{ color, ...machine }}
    >
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2.5 text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]"
        style={{ ...body, color: C.navy }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-2 max-w-2xl text-[13.5px] leading-relaxed"
          style={{ color: C.navySoft, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// MRZ-strook: machineleesbare zone in monospace, zoals onderaan een paspoort.
function MrzStrip({ lines }: { lines: string[] }) {
  return (
    <div
      className="overflow-hidden rounded-md"
      style={{
        background: C.navy,
        border: `1px solid ${C.navy}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <div className="overflow-x-auto px-3.5 py-2.5">
        {lines.map((l, i) => (
          <div
            key={i}
            className="whitespace-nowrap text-[11.5px] leading-[1.55] tracking-[0.14em]"
            style={{ color: "#e9e4d6", ...machine }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// Officieel stempelmotief — geroteerd, met dubbele rand en datum.
function OfficialStamp({
  label,
  date,
  color,
  rotate = -8,
}: {
  label: string;
  date: string;
  color: string;
  rotate?: number;
}) {
  return (
    <span
      className="inline-flex select-none flex-col items-center justify-center rounded-md px-3 py-1.5"
      style={{
        color,
        border: `2px solid ${color}`,
        outline: `1px solid ${color}`,
        outlineOffset: "2px",
        transform: `rotate(${rotate}deg)`,
        background: "transparent",
        opacity: 0.9,
      }}
      aria-hidden="true"
    >
      <span
        className="text-[11px] font-bold uppercase leading-none tracking-[0.14em]"
        style={machine}
      >
        {label}
      </span>
      <span className="mt-1 text-[8.5px] uppercase leading-none tracking-[0.18em]" style={machine}>
        {date}
      </span>
    </span>
  );
}

// Holografisch zegel — verschuivend regenboogverloop binnen een gegraveerde ring.
function HoloSeal({ size = 56 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 45deg, #d6c98f, #9fd6c0, #b7c0e6, #e0b7c8, #d6c98f)",
        border: `1px solid ${C.line}`,
        boxShadow: "inset 0 0 0 3px rgba(246,242,233,0.7), 0 2px 6px -3px rgba(22,35,63,0.5)",
      }}
      aria-hidden="true"
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{
          width: size - 16,
          height: size - 16,
          background: "rgba(246,242,233,0.82)",
          border: `1px dashed ${C.blue}55`,
        }}
      >
        <BadgeCheck size={size * 0.34} style={{ color: C.blue }} />
      </span>
    </span>
  );
}

// Sparkline in graveerstijl.
function Sparkline({ data, color = C.blue }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 32;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1] as readonly [number, number];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} />
    </svg>
  );
}

// Match-waarde als gegraveerde meterbalk.
function MatchMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full"
        style={{ background: C.lineSoft }}
        aria-hidden="true"
      >
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: C.blue }} />
      </div>
      <span
        className="text-[11.5px] font-semibold tabular-nums"
        style={{ color: C.navy, ...machine }}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept48() {
  const [screen, setScreen] = useState<ScreenKey>("verificatie");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]!.id);
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id: string) => {
    setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.navy, background: C.paper }}
    >
      {/* Documentpapier-textuur + subtiel guilloché over het geheel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ backgroundImage: GUILLOCHE_NAVY }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, rgba(30,64,175,0.05), transparent 55%), radial-gradient(90% 70% at 0% 100%, rgba(179,38,30,0.04), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside className="hidden w-[238px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-6 pt-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{
                background: C.navy,
                color: C.paperHi,
                border: `1px solid ${C.navy}`,
                boxShadow: "0 2px 6px -3px rgba(22,35,63,0.6)",
              }}
            >
              <Fingerprint size={18} strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-bold tracking-tight" style={body}>
                Paspoort
              </div>
              <div
                className="text-[9.5px] uppercase tracking-[0.2em]"
                style={{ color: C.muted, ...machine }}
              >
                ZZP · Identiteit
              </div>
            </div>
          </div>

          {/* Officieel documenthoofd */}
          <div
            className="mb-4 rounded-md px-3 py-2"
            style={{ border: `1px solid ${C.line}`, background: C.paperHi }}
          >
            <div
              className="flex items-center justify-between text-[8.5px] uppercase tracking-[0.2em]"
              style={{ color: C.muted, ...machine }}
            >
              <span>Type P</span>
              <span>Code NLD</span>
            </div>
            <div
              className="mt-1 text-[11px] font-semibold tracking-[0.08em]"
              style={{ color: C.navy, ...machine }}
            >
              PLATFORM · REGISTER
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {SCREENS.map((s) => {
              const Icon = NAV_ICONS[s.key];
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
                  style={{
                    color: on ? C.navy : C.muted,
                    background: on ? C.paperHi : "transparent",
                    border: `1px solid ${on ? C.line : "transparent"}`,
                  }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                      style={{ background: C.red }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={17} aria-hidden="true" style={{ color: on ? C.blue : C.faint }} />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && <ChevronRight size={14} aria-hidden="true" style={{ color: C.faint }} />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Card className="p-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: C.navy, color: C.paperHi, ...machine }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <BadgeCheck size={11} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <div className="flex items-center gap-2">
              <Stamp size={15} aria-hidden="true" style={{ color: C.red }} />
              <h2 className="truncate text-[15px] font-bold tracking-tight" style={body}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-md px-3.5 py-2 text-[12.5px] transition-all hover:bg-[#f4f0e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.card }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek in register…</span>
              </button>
              <button
                className="relative rounded-md p-2.5 transition-all hover:bg-[#f4f0e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
                style={{ border: `1px solid ${C.line}`, color: C.navySoft, background: C.card }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.red }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
                  style={{
                    color: on ? C.navy : C.muted,
                    background: on ? C.paperHi : "transparent",
                    border: `1px solid ${on ? C.line : C.lineSoft}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {screen === "dashboard" && <Dashboard onOpen={open} />}
            {screen === "marktplaats" && <Marktplaats onOpen={open} activeId={activeId} />}
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

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const kpiColors = [C.blue, C.navy, C.green, C.amber];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* ID-kaart als hero */}
      <Card guilloche className="p-0">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-[auto_1fr]">
          <div
            className="flex flex-col items-center gap-3 p-6 sm:border-r"
            style={{ borderColor: C.line, background: C.paperHi }}
          >
            <div
              className="flex h-24 w-20 items-center justify-center rounded-md text-[26px] font-bold"
              style={{
                background: C.navy,
                color: C.paperHi,
                border: `1px solid ${C.navy}`,
                ...machine,
              }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </div>
            <HoloSeal />
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Kicker>Documenthouder · {PROFIEL.plaats}</Kicker>
                <h1
                  className="mt-2 text-[28px] font-bold leading-[1.05] tracking-tight"
                  style={body}
                >
                  {PROFIEL.naam}
                </h1>
                <p className="mt-1 text-[13px]" style={{ color: C.navySoft }}>
                  {PROFIEL.rol}
                </p>
              </div>
              <OfficialStamp label="Geverifieerd" date="14 MEI 2025" color={C.green} rotate={7} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {[
                { l: "Registratie", v: "BIG · 89201847" },
                { l: "Vertrouwen", v: PROFIEL.trust },
                { l: "Standplaats", v: PROFIEL.plaats },
                { l: "Geldig t/m", v: "05 · 2028" },
                { l: "Documenten", v: `${DOCUMENTEN.length} actief` },
                { l: "Status", v: "In omloop" },
              ].map((f) => (
                <div key={f.l}>
                  <p
                    className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: C.faint, ...machine }}
                  >
                    {f.l}
                  </p>
                  <p
                    className="mt-0.5 text-[12.5px] font-semibold"
                    style={{ color: C.navy, ...machine }}
                  >
                    {f.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <MrzStrip
            lines={[
              "P<NLDDE<VRIES<<SANNE<<<<<<<<<<<<<<<<<<<<<<<<<",
              "8920184<7NLD8804159F2805142ZZP<<<<<<<<<<<<06",
            ]}
          />
        </div>
      </Card>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.blue;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10.5px] uppercase tracking-[0.16em]"
                  style={{ color: C.muted, ...machine }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber, ...machine }}
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
                className="mt-2.5 text-[25px] font-bold tabular-nums leading-none tracking-tight"
                style={{ ...machine, color: C.navy }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={col} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="flex items-center gap-2 text-[14px] font-bold tracking-tight"
                style={body}
              >
                <Stamp size={15} aria-hidden="true" style={{ color: C.blue }} /> Beste matches
              </h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                Verklaarbaar gesorteerd
              </span>
            </div>
            <Card>
              <div>
                {OPDRACHTEN.map((o, i) => (
                  <button
                    key={o.id}
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#efeadd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1e40af]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                      style={{
                        background: C.paperHi,
                        border: `1px solid ${C.line}`,
                        color: C.blue,
                        ...machine,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-semibold tabular-nums sm:inline"
                      style={{ color: C.navy, ...machine }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Berichten */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[14px] font-bold tracking-tight" style={body}>
                Berichten
              </h2>
              <span className="text-[11.5px]" style={{ color: C.muted }}>
                {ongelezen} ongelezen
              </span>
            </div>
            <Card>
              {BERICHTEN.map((b, i) => (
                <div
                  key={b.van}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                      background: b.ongelezen ? C.navy : C.paperHi,
                      color: b.ongelezen ? C.paperHi : C.muted,
                      border: `1px solid ${b.ongelezen ? C.navy : C.line}`,
                      ...machine,
                    }}
                  >
                    {b.initialen}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold">{b.van}</p>
                      {b.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.red }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-[11px] tabular-nums"
                    style={{ color: C.faint, ...machine }}
                  >
                    {b.tijd}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6">
          <div>
            <h2
              className="mb-3 flex items-center gap-2 text-[14px] font-bold tracking-tight"
              style={body}
            >
              <ShieldCheck size={15} aria-hidden="true" style={{ color: C.green }} /> Certificaten
            </h2>
            <Card className="p-4">
              <div className="space-y-3.5">
                {CREDENTIALS.map((c) => {
                  const st = statusStyle(c.status);
                  return (
                    <div key={c.naam} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{ background: st.bg, border: `1px solid ${st.fg}44` }}
                        aria-hidden="true"
                      >
                        <st.Icon size={13} style={{ color: st.fg }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                        <p className="truncate text-[11.5px]" style={{ color: C.muted }}>
                          {c.detail}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[9px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: st.fg, ...machine }}
                      >
                        {st.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Aanbevolen actie */}
          <div
            className="relative overflow-hidden rounded-lg p-5"
            style={{ background: C.navy, border: `1px solid ${C.navy}` }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ backgroundImage: GUILLOCHE("rgba(255,255,255,0.06)") }}
              aria-hidden="true"
            />
            <div className="relative">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: "#c9d0e0", ...machine }}
              >
                Actie vereist
              </p>
              <p className="mt-2 text-[18px] font-bold leading-snug text-[#f6f2e9]" style={body}>
                {ACTIES[0]?.titel}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: "#c9d0e0" }}>
                {ACTIES[0]?.detail}
              </p>
              <button
                className="mt-4 w-full rounded-md py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em] transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#16233f]"
                style={{ background: C.paperHi, color: C.navy, ...machine }}
              >
                {ACTIES[0]?.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({ onOpen, activeId }: { onOpen: (id: string) => void; activeId: string }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHead
        kicker="Register · Marktplaats"
        title="Open opdrachten"
        note="Elke opdracht als een inschrijving in het register — gesorteerd op verwantschap."
      />

      <Card className="flex items-center gap-3 px-4 py-2.5">
        <Search size={16} aria-hidden="true" style={{ color: C.blue }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9a9585]"
          style={{ color: C.navy }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...machine }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card guilloche className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-md"
            style={{ background: C.blueSoft, border: `1px solid ${C.blue}33` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.blue }} />
          </div>
          <p className="mt-4 text-[15px] font-bold" style={body}>
            Geen inschrijving gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Niets voor &quot;{q}&quot; in het register. Verbreed je zoekopdracht of pas je
            beschikbaarheid aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-bold text-[#f6f2e9] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
            style={{ background: C.navy }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => {
            const isActive = o.id === activeId;
            return (
              <button
                key={o.id}
                onClick={() => onOpen(o.id)}
                className="group text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
                aria-label={`Open ${o.titel}`}
              >
                <Card guilloche className="h-full p-5">
                  <div className="pointer-events-none absolute right-3 top-3" aria-hidden="true">
                    {isActive && (
                      <OfficialStamp label="Geopend" date={o.id} color={C.red} rotate={-10} />
                    )}
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: C.faint, ...machine }}
                  >
                    {o.id}
                  </span>
                  <p className="mt-2 max-w-[80%] text-[15.5px] font-bold leading-snug" style={body}>
                    {o.titel}
                  </p>
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12px]"
                    style={{ color: C.muted }}
                  >
                    <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                  </p>
                  <div className="mt-4">
                    <MatchMeter value={o.match} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
                        style={{
                          color: C.navySoft,
                          background: C.paperHi,
                          border: `1px solid ${C.line}`,
                          ...machine,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <span className="font-bold tabular-nums" style={{ color: C.blue, ...machine }}>
                      {o.tarief}
                    </span>
                    <span className="tabular-nums" style={{ color: C.muted, ...machine }}>
                      {o.uren}
                    </span>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card guilloche className="p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>Inschrijving {opdracht.id}</Kicker>
            <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={body}>
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.navySoft }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-bold uppercase tracking-[0.04em] text-[#f6f2e9] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] disabled:opacity-90"
            style={{ background: state === "sent" ? C.green : C.navy, ...machine }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle" ? "Inschrijven" : state === "sending" ? "Versturen…" : "Ingeschreven"}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.blue },
          { l: "Omvang", v: opdracht.uren, c: C.navy },
          { l: "Start", v: opdracht.start, c: C.navy },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[9px] uppercase tracking-[0.18em]"
              style={{ color: C.muted, ...machine }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-bold tabular-nums tracking-tight"
              style={{ color: m.c, ...machine }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-bold" style={body}>
          <Stamp size={15} aria-hidden="true" style={{ color: C.blue }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green, ...machine }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                    style={{ background: C.greenSoft }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.amber, ...machine }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.navySoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                    style={{ background: C.amberSoft }}
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
      </Card>
    </div>
  );
}

/* ---------- Verificatie (de held) ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Officiële verificatie"
        title="Verificatie"
        note="Elk certificaat onafhankelijk gecontroleerd, gestempeld en machineleesbaar vastgelegd."
      />

      {/* Officieel vertrouwens-certificaat */}
      <Card guilloche className="p-0">
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{ borderBottom: `1px solid ${C.line}`, background: C.paperHi }}
        >
          <ShieldCheck size={16} style={{ color: C.green }} aria-hidden="true" />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.navy, ...machine }}
          >
            Certificaat van vertrouwen
          </span>
          <span
            className="ml-auto text-[10px] uppercase tracking-[0.18em]"
            style={{ color: C.muted, ...machine }}
          >
            No. TR-2025-0619
          </span>
        </div>
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <HoloSeal size={68} />
          <div className="flex-1">
            <p className="text-[19px] font-bold" style={body}>
              {PROFIEL.trust}
            </p>
            <p className="mt-0.5 text-[12.5px]" style={{ color: C.navySoft }}>
              <span className="font-bold tabular-nums" style={machine}>
                {verified}
              </span>{" "}
              van{" "}
              <span className="font-bold tabular-nums" style={machine}>
                {total}
              </span>{" "}
              certificaten geverifieerd ·{" "}
              <span style={{ color: C.amber }}>{attention} vraagt actie</span>
            </p>
            <div
              className="mt-3 flex h-2.5 overflow-hidden rounded-full"
              style={{ background: C.lineSoft }}
            >
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div
                    key={c.naam}
                    className="h-full"
                    style={{
                      width: `${100 / total}%`,
                      background: st.fg,
                      opacity: c.status === "VERIFIED" ? 1 : 0.55,
                    }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
          <OfficialStamp label="Origineel" date="GEWAARMERKT" color={C.blue} rotate={-6} />
        </div>
      </Card>

      {/* Gestempelde certificaatkaarten — het hart van het concept */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          const stampDate =
            c.status === "VERIFIED"
              ? "14 MEI 2025"
              : c.status === "EXPIRING"
                ? "VERLOOPT 26 JUL"
                : c.status === "SUBMITTED"
                  ? "21 JUN 2025"
                  : "AFGEWEZEN";
          return (
            <Card key={c.naam} guilloche className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: C.faint, ...machine }}
                  >
                    Document · Bewijsstuk
                  </p>
                  <p className="mt-1 text-[14.5px] font-bold leading-snug" style={body}>
                    {c.naam}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <div className="shrink-0 pt-1">
                  <OfficialStamp
                    label={st.code}
                    date={stampDate}
                    color={st.fg}
                    rotate={c.status === "VERIFIED" ? 6 : -7}
                  />
                </div>
              </div>
              <div
                className="mt-4 flex items-center justify-between border-t pt-3 text-[11px]"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="inline-flex items-center gap-1.5 font-semibold"
                  style={{ color: st.fg }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <st.Icon size={12} aria-hidden="true" />
                  )}
                  {st.label}
                </span>
                <span className="tabular-nums" style={{ color: C.faint, ...machine }}>
                  REF · {c.naam.slice(0, 3).toUpperCase()}-
                  {String(c.naam.length * 137).padStart(4, "0")}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Documenten-register */}
      <div>
        <h2 className="mb-3 text-[14px] font-bold tracking-tight" style={body}>
          Documentregister
        </h2>
        <Card>
          {DOCUMENTEN.map((d, i) => {
            const st = statusStyle(d.status);
            return (
              <div
                key={d.naam}
                className="flex items-center gap-3.5 px-4 py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{ background: C.paperHi, border: `1px solid ${C.line}` }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.navySoft }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted, ...machine }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: st.fg, background: st.bg, ...machine }}
                >
                  <st.Icon size={10} aria-hidden="true" /> {st.code}
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* MRZ-voet als afsluiting van het verificatiedocument */}
      <MrzStrip
        lines={[
          "IDNLD<VERIFICATIE<REGISTER<<<<<<<<<<<<<<<<<<0619",
          "89201847<8NLD<BIG<HBOV<VOG<BLS<VALID<PENDING<06",
        ]}
      />
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.red, bg: C.redSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.blue, bg: C.blueSoft, Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Register · Handelingen"
        title="Volgende acties"
        note="Wat nu telt — op volgorde van urgentie, met een officiële registratie per handeling."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Card key={a.titel} className="flex items-start gap-4 p-5">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: C.faint, ...machine }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
                  style={{ background: t.bg, border: `1px solid ${t.fg}33` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: t.fg, background: t.bg, ...machine }}
                >
                  <t.Icon size={9} aria-hidden="true" /> {t.label}
                </span>
                <p className="mt-1.5 text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-md px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}33`, ...machine }}
              >
                {a.cta}
              </button>
            </Card>
          );
        })}
      </div>
      <Card className="flex items-center gap-4 p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: C.greenSoft }}
        >
          <Check size={18} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.navySoft }}>
          Alle handelingen gecontroleerd. Nieuwe acties worden hier geregistreerd zodra ze relevant
          worden — je hoeft niets zelf te bewaken.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon; label: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft, Icon: Check, label: "Voldaan" },
    Openstaand: { fg: C.amber, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.lineSoft, Icon: FileText, label: "Concept" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Register · Kasstroom"
          title="Facturen"
          note="Een officieel grootboek van wat voldaan is en wat nog openstaat."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-bold uppercase tracking-[0.04em] text-[#f6f2e9] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af]"
          style={{ background: C.navy, ...machine }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[9.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}`, ...machine }}
              >
                <th className="px-5 py-3.5 font-bold">Nummer</th>
                <th className="px-5 py-3.5 font-bold">Klant</th>
                <th className="hidden px-5 py-3.5 font-bold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-bold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#efeadd]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.navySoft, ...machine }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted, ...machine }}
                    >
                      {f.datum}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-bold tabular-nums"
                      style={machine}
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{
                          color: t.fg,
                          background: t.bg,
                          border: `1px solid ${t.fg}2a`,
                          ...machine,
                        }}
                      >
                        <t.Icon size={11} aria-hidden="true" /> {t.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
