"use client";

// Concept 37 — "Isometrie" · Isometrisch 3D / axonometrische diepte (LICHT).
// Speels maar strak: kaarten en KPI-tegels als gestapelde blokken met echte "dikte"
// (zichtbare zijkanten via harde, gekleurde offset-schaduw) en zachte slagschaduwen.
// Data als axonometrische iso-staafjes (SVG-kubussen met top/voor/zij-vlak). Eén hero-plateau
// gebruikt een echte CSS 3D-transform (rotateX/rotateZ + preserve-3d). Bij hover komt een blok
// naar voren (motion-safe). Volledig onderscheidend: geen ander concept gebruikt axonometrie.
// Palet: bg #eef0f7, fg #1c1e2b, accent indigo #6366f1, secundair amber #f59e0b + groen #22c55e.
// Fonts: --font-lab-space (display) + --font-lab-inter (body).

import { useState } from "react";
import {
  Boxes,
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
  ShieldCheck,
  Layers,
  Sparkles,
  TrendingUp,
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
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#eef0f7",
  bgDeep: "#e4e7f1",
  paper: "#ffffff",
  paperSoft: "#f7f8fc",
  ink: "#1c1e2b",
  inkSoft: "#3c3f52",
  muted: "#676b82",
  faint: "#9297ac",
  line: "#dadeec",
  lineSoft: "#e8ebf4",
  // Indigo (accent) + faces
  indigo: "#6366f1",
  indigoTop: "#818cf8",
  indigoSide: "#4f46e5",
  indigoDeep: "#4338ca",
  indigoSoft: "rgba(99,102,241,0.10)",
  // Amber (secundair)
  amber: "#f59e0b",
  amberTop: "#fbbf24",
  amberSide: "#d97706",
  amberSoft: "rgba(245,158,11,0.12)",
  // Groen
  green: "#22c55e",
  greenTop: "#4ade80",
  greenSide: "#16a34a",
  greenSoft: "rgba(34,197,94,0.12)",
  // Rood
  red: "#ef4444",
  redSoft: "rgba(239,68,68,0.12)",
  // Schaduw voor blok-zijkant (neutraal)
  slab: "#c9cee0",
  slabDeep: "#b9bfd6",
};

const display = { fontFamily: "var(--font-lab-space)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: Boxes,
  marktplaats: Layers,
  opdracht: FileText,
  verificatie: ShieldCheck,
  acties: Bell,
  facturen: Send,
  documenten: FileText,
  berichten: Bell,
};

type Tone = { label: string; fg: string; side: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: C.green,
        side: C.greenSide,
        bg: C.greenSoft,
        Icon: Check,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.indigo,
        side: C.indigoSide,
        bg: C.indigoSoft,
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        side: C.amberSide,
        bg: C.amberSoft,
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, side: "#b91c1c", bg: C.redSoft, Icon: AlertTriangle };
  }
}

/* ---------- Blok met zichtbare dikte (harde gekleurde offset = zijkant) ---------- */
function Slab({
  children,
  className = "",
  side = C.slab,
  depth = 6,
  hover = false,
  as = "div",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  side?: string;
  depth?: number;
  hover?: boolean;
  as?: "div" | "section";
  style?: React.CSSProperties;
}) {
  const Tag = as;
  return (
    <Tag
      className={`relative rounded-[14px] ${
        hover
          ? "transition-transform duration-200 ease-out motion-safe:hover:-translate-x-[3px] motion-safe:hover:-translate-y-[3px]"
          : ""
      } ${className}`}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        boxShadow: `${depth}px ${depth}px 0 0 ${side}, 0 ${depth + 10}px ${
          depth + 22
        }px -12px rgba(28,30,43,0.22)`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, color = C.indigo }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
      style={{ color, ...body }}
    >
      {children}
    </p>
  );
}

/* ---------- Axonometrische iso-staafjes (echte 3D-kubussen in SVG) ---------- */
function IsoBars({
  data,
  base,
  top,
  side,
  w = 132,
  h = 66,
}: {
  data: number[];
  base: string;
  top: string;
  side: string;
  w?: number;
  h?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const n = data.length;
  const dpx = 5.5; // dieptevector x
  const dpy = -3.2; // dieptevector y (naar rechtsboven = axonometrisch)
  const pad = 7;
  const availW = w - pad * 2 - dpx;
  const slot = availW / n;
  const barW = slot * 0.6;
  const maxBarH = h - pad * 2 + dpy;
  const baseY = h - pad;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      {data.map((d, i) => {
        const bh = 9 + ((d - min) / span) * (maxBarH - 9);
        const x = pad + i * slot + (slot - barW) / 2;
        const y = baseY - bh;
        const front = `${x},${y} ${x + barW},${y} ${x + barW},${y + bh} ${x},${y + bh}`;
        const topFace = `${x},${y} ${x + barW},${y} ${x + barW + dpx},${y + dpy} ${x + dpx},${
          y + dpy
        }`;
        const sideFace = `${x + barW},${y} ${x + barW + dpx},${y + dpy} ${x + barW + dpx},${
          y + bh + dpy
        } ${x + barW},${y + bh}`;
        return (
          <g key={i}>
            <polygon points={front} fill={base} />
            <polygon points={topFace} fill={top} />
            <polygon points={sideFace} fill={side} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Iso-kubusje als merk-icoon (echte 3-vlakken kubus) ---------- */
function IsoCube({
  size = 34,
  top,
  left,
  right,
}: {
  size?: number;
  top: string;
  left: string;
  right: string;
}) {
  const s = size;
  const cx = s / 2;
  const hy = s * 0.26;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true">
      {/* top */}
      <polygon
        points={`${cx},${1} ${s - 2},${hy + 1} ${cx},${2 * hy + 1} ${2},${hy + 1}`}
        fill={top}
      />
      {/* left */}
      <polygon
        points={`${2},${hy + 1} ${cx},${2 * hy + 1} ${cx},${s - 1} ${2},${s - hy - 1}`}
        fill={left}
      />
      {/* right */}
      <polygon
        points={`${cx},${2 * hy + 1} ${s - 2},${hy + 1} ${s - 2},${s - hy - 1} ${cx},${s - 1}`}
        fill={right}
      />
    </svg>
  );
}

/* ---------- Hero-plateau met ECHTE CSS 3D-transform (rotateX/rotateZ) ---------- */
function IsoPlatform() {
  const layers = [
    { z: 0, color: C.indigo, w: 128, label: "Matches" },
    { z: 20, color: C.amber, w: 104, label: "Bewijs" },
    { z: 40, color: C.green, w: 80, label: "Omzet" },
  ];
  return (
    <div
      className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block"
      aria-hidden="true"
      style={{ perspective: "900px" }}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(56deg) rotateZ(45deg)",
        }}
      >
        {layers.map((l, i) => (
          <div
            key={i}
            className="absolute rounded-[10px]"
            style={{
              width: l.w,
              height: l.w,
              left: -l.w / 2,
              top: -l.w / 2,
              transform: `translateZ(${l.z}px)`,
              background: `linear-gradient(135deg, ${l.color}, ${l.color}cc)`,
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: `0 18px 40px -12px rgba(28,30,43,0.4)`,
              opacity: 0.92 - i * 0.06,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Concept37() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      <div className="p-3 sm:p-5 lg:p-7">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="shrink-0">
              <IsoCube size={38} top={C.indigoTop} left={C.indigo} right={C.indigoSide} />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-semibold tracking-tight" style={display}>
                Isometrie
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
                ZZP Platform · axonometrisch
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:ml-auto">
            <button
              className="hidden items-center gap-2.5 rounded-[12px] px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] sm:flex"
              style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.paperSoft }}
              aria-label="Zoeken openen"
            >
              <Search size={14} aria-hidden="true" />
              <span>Zoek opdrachten…</span>
            </button>
            <button
              className="relative rounded-[12px] p-2.5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]"
              style={{ border: `1px solid ${C.line}`, color: C.inkSoft, background: C.paperSoft }}
              aria-label="Meldingen"
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ background: C.amber }}
                aria-hidden="true"
              />
            </button>
            <div
              className="hidden items-center gap-2.5 rounded-[12px] py-1 pl-1 pr-3 sm:flex"
              style={{ border: `1px solid ${C.line}`, background: C.paperSoft }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[11px] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${C.indigoTop}, ${C.indigoSide})`,
                  ...display,
                }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="leading-tight">
                <div className="text-[11.5px] font-semibold">{PROFIEL.naam}</div>
                <div
                  className="flex items-center gap-1 text-[9.5px] font-medium"
                  style={{ color: C.green }}
                >
                  <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Iso-nav (blok-tabs) */}
        <nav className="mb-7 flex gap-2 overflow-x-auto pb-1" aria-label="Schermen">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            const Icon = NAV_ICONS[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="group flex shrink-0 items-center gap-2 rounded-[11px] px-3.5 py-2 text-[12.5px] font-medium transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] motion-safe:hover:-translate-y-[2px]"
                style={{
                  background: on ? C.ink : C.paper,
                  color: on ? "#fff" : C.inkSoft,
                  border: `1px solid ${on ? C.ink : C.line}`,
                  boxShadow: on
                    ? `4px 4px 0 0 ${C.indigo}, 0 12px 22px -12px rgba(28,30,43,0.4)`
                    : `3px 3px 0 0 ${C.slab}`,
                }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: on ? C.indigoTop : C.faint }} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div>
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>
    </div>
  );
}

/* ============================ Dashboard ============================ */
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const faces = [
    { base: C.indigo, top: C.indigoTop, side: C.indigoSide },
    { base: C.amber, top: C.amberTop, side: C.amberSide },
    { base: C.green, top: C.greenTop, side: C.greenSide },
    { base: C.indigo, top: C.indigoTop, side: C.indigoSide },
  ];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Hero-plateau */}
      <Slab
        className="relative overflow-hidden p-7"
        side={C.indigoSide}
        depth={7}
        style={{ background: `linear-gradient(180deg, #ffffff, ${C.paperSoft})` }}
      >
        <IsoPlatform />
        <div className="relative max-w-lg">
          <Kicker>
            <Boxes size={12} aria-hidden="true" /> Vandaag · {PROFIEL.plaats}
          </Kicker>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.06] tracking-tight sm:text-[34px]"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            Drie matches boven 80% staan gestapeld en klaar. Je vertrouwensniveau is hoog — één
            certificaat vraagt binnenkort aandacht.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 font-medium"
              style={{
                color: C.greenSide,
                background: C.greenSoft,
                border: `1px solid ${C.green}44`,
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 credentials geverifieerd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 font-medium"
              style={{
                color: C.amberSide,
                background: C.amberSoft,
                border: `1px solid ${C.amber}44`,
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
            </span>
          </div>
        </div>
      </Slab>

      {/* KPI-tegels als blokken met iso-staafjes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const f = faces[i % faces.length] ?? faces[0]!;
          return (
            <Slab key={k.label} className="p-4" side={f.side} depth={6} hover>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.greenSide : C.amberSide }}
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
                className="mt-2.5 text-[26px] font-semibold tabular-nums leading-none tracking-tight"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <IsoBars data={k.spark} base={f.base} top={f.top} side={f.side} />
              </div>
            </Slab>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
              style={display}
            >
              <Layers size={15} aria-hidden="true" style={{ color: C.indigo }} /> Beste matches
            </h2>
            <span className="text-[11.5px]" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <div className="space-y-3.5">
            {OPDRACHTEN.map((o, i) => {
              const f = faces[i % 3] ?? faces[0]!;
              return (
                <Slab key={o.id} side={f.side} depth={5} hover>
                  <button
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 rounded-[14px] px-4 py-3.5 text-left transition-colors hover:bg-[#fafbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6366f1]"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] text-[15px] font-bold tabular-nums text-white"
                      style={{
                        background: `linear-gradient(135deg, ${f.top}, ${f.side})`,
                        boxShadow: `3px 3px 0 0 ${f.side}`,
                        ...display,
                      }}
                    >
                      {o.match}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-semibold tabular-nums sm:inline"
                      style={{ color: C.inkSoft }}
                    >
                      {o.tarief.replace(" / uur", "")}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                  </button>
                </Slab>
              );
            })}
          </div>
        </div>

        {/* Credentials */}
        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight"
            style={display}
          >
            <ShieldCheck size={15} aria-hidden="true" style={{ color: C.green }} /> Credentials
          </h2>
          <Slab className="p-4" side={C.slab} depth={6}>
            <div className="space-y-3.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: st.bg, boxShadow: `2px 2px 0 0 ${st.side}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold" style={{ color: st.side }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Slab>
        </div>
      </div>
    </div>
  );
}

/* ============================ Marktplaats ============================ */
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const faces = [
    { base: C.indigo, top: C.indigoTop, side: C.indigoSide },
    { base: C.amber, top: C.amberTop, side: C.amberSide },
    { base: C.green, top: C.greenTop, side: C.greenSide },
  ];
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Kicker color={C.amberSide}>
          <Layers size={12} aria-hidden="true" /> Marktplaats
        </Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <Slab className="flex items-center gap-3 px-4 py-2.5" side={C.slab} depth={4}>
        <Search size={16} aria-hidden="true" style={{ color: C.indigo }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9297ac]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Slab>

      {filtered.length === 0 ? (
        <Slab className="px-6 py-16 text-center" side={C.slab} depth={6}>
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px]"
            style={{ background: C.indigoSoft, boxShadow: `3px 3px 0 0 ${C.indigoSide}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.indigo }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[12.5px] font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] motion-safe:hover:-translate-y-[2px]"
            style={{ background: C.indigo, boxShadow: `3px 3px 0 0 ${C.indigoSide}` }}
          >
            Zoekopdracht wissen
          </button>
        </Slab>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((o, i) => {
            const f = faces[i % 3] ?? faces[0]!;
            return (
              <Slab key={o.id} side={f.side} depth={6} hover>
                <button
                  onClick={onOpen}
                  className="w-full rounded-[14px] p-5 text-left transition-colors hover:bg-[#fafbfe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6366f1]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10.5px] tracking-wide" style={{ color: C.faint }}>
                      {o.id}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white"
                      style={{ background: f.base, boxShadow: `2px 2px 0 0 ${f.side}` }}
                    >
                      <Sparkles size={11} aria-hidden="true" /> {o.match}% match
                    </span>
                  </div>
                  <p className="mt-3 text-[16px] font-semibold leading-snug" style={display}>
                    {o.titel}
                  </p>
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
                        className="rounded-[7px] px-2.5 py-0.5 text-[10.5px]"
                        style={{
                          color: C.inkSoft,
                          background: C.paperSoft,
                          border: `1px solid ${C.line}`,
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
                    <span className="font-semibold tabular-nums">{o.tarief}</span>
                    <span className="tabular-nums" style={{ color: C.muted }}>
                      {o.uren}
                    </span>
                  </div>
                </button>
              </Slab>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ Opdracht-detail ============================ */
function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  const metrics = [
    {
      l: "Tarief",
      v: opdracht.tarief,
      f: { base: C.indigo, top: C.indigoTop, side: C.indigoSide },
    },
    { l: "Omvang", v: opdracht.uren, f: { base: C.amber, top: C.amberTop, side: C.amberSide } },
    { l: "Start", v: opdracht.start, f: { base: C.green, top: C.greenTop, side: C.greenSide } },
    {
      l: "Match",
      v: `${opdracht.match}%`,
      f: { base: C.indigo, top: C.indigoTop, side: C.indigoSide },
    },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Slab
        className="p-7"
        side={C.indigoSide}
        depth={7}
        style={{ background: `linear-gradient(180deg, #ffffff, ${C.paperSoft})` }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight tracking-tight"
              style={display}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.inkSoft }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] px-5 py-2.5 text-[13px] font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] disabled:opacity-90 motion-safe:hover:-translate-y-[2px]"
            style={{
              background: state === "sent" ? C.green : C.indigo,
              boxShadow: `4px 4px 0 0 ${state === "sent" ? C.greenSide : C.indigoSide}`,
            }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" />}
            {state === "idle" && <Send size={14} aria-hidden="true" />}
            {state === "idle"
              ? "Reageer op opdracht"
              : state === "sending"
                ? "Versturen…"
                : "Reactie verstuurd"}
          </button>
        </div>
      </Slab>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <Slab key={m.l} className="p-4" side={m.f.side} depth={5} hover>
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.f.side, ...display }}
            >
              {m.v}
            </p>
          </Slab>
        ))}
      </div>

      <Slab className="p-6" side={C.slab} depth={6}>
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold" style={display}>
          <Sparkles size={15} aria-hidden="true" style={{ color: C.indigo }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel — niets verborgen.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            className="rounded-[12px] p-5"
            style={{ background: C.greenSoft, border: `1px solid ${C.green}33` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.greenSide }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.green, boxShadow: `1.5px 1.5px 0 0 ${C.greenSide}` }}
                    aria-hidden="true"
                  >
                    <Check size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-[12px] p-5"
            style={{ background: C.amberSoft, border: `1px solid ${C.amber}33` }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amberSide }}
            >
              Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.inkSoft }}
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                    style={{ background: C.amber, boxShadow: `1.5px 1.5px 0 0 ${C.amberSide}` }}
                    aria-hidden="true"
                  >
                    <Minus size={12} className="text-white" />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Slab>
    </div>
  );
}

/* ============================ Verificatie ============================ */
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.green}>
          <ShieldCheck size={12} aria-hidden="true" /> Vertrouwen
        </Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <Slab
        className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center"
        side={C.greenSide}
        depth={7}
        style={{ background: `linear-gradient(180deg, #ffffff, ${C.paperSoft})` }}
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px]"
          style={{
            background: `linear-gradient(135deg, ${C.greenTop}, ${C.greenSide})`,
            boxShadow: `4px 4px 0 0 ${C.greenSide}`,
          }}
        >
          <ShieldCheck size={30} aria-hidden="true" className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-semibold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-semibold tabular-nums">{verified}</span> van{" "}
            <span className="font-semibold tabular-nums">{CREDENTIALS.length}</span> credentials
            geverifieerd · <span style={{ color: C.amberSide }}>{attention} vraagt actie</span>
          </p>
        </div>
        {/* iso-stapel als voortgang */}
        <div className="flex items-end gap-1.5" aria-hidden="true">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            const hgt = c.status === "VERIFIED" ? 44 : c.status === "SUBMITTED" ? 30 : 22;
            return (
              <span
                key={c.naam}
                className="w-3 rounded-[3px]"
                style={{ height: hgt, background: st.fg, boxShadow: `2px 2px 0 0 ${st.side}` }}
              />
            );
          })}
        </div>
      </Slab>

      <div className="space-y-3.5">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Slab key={c.naam} side={st.side} depth={5} hover>
              <div className="flex items-center gap-4 rounded-[14px] px-5 py-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: st.bg, boxShadow: `3px 3px 0 0 ${st.side}` }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2
                      size={17}
                      aria-hidden="true"
                      className="motion-safe:animate-spin"
                      style={{ color: st.fg }}
                    />
                  ) : (
                    <st.Icon size={17} aria-hidden="true" style={{ color: st.fg }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{c.naam}</p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.side, background: st.bg, border: `1px solid ${st.fg}44` }}
                >
                  <st.Icon size={12} aria-hidden="true" />
                  {st.label}
                </span>
              </div>
            </Slab>
          );
        })}
      </div>

      {/* Documenten-archief */}
      <div>
        <h2
          className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight"
          style={display}
        >
          <FileText size={15} aria-hidden="true" style={{ color: C.indigo }} /> Documenten
        </h2>
        <Slab className="overflow-hidden" side={C.slab} depth={6}>
          <div className="divide-y" style={{ borderColor: C.lineSoft }}>
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div key={d.naam} className="flex items-center gap-3.5 px-5 py-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: C.paperSoft, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-[7px] px-2.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ color: st.side, background: st.bg }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Slab>
      </div>
    </div>
  );
}

/* ============================ Acties ============================ */
function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; side: string; bg: string; Icon: LucideIcon }
  > = {
    warning: { fg: C.amber, side: C.amberSide, bg: C.amberSoft, Icon: AlertTriangle },
    info: { fg: C.indigo, side: C.indigoSide, bg: C.indigoSoft, Icon: TrendingUp },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker color={C.indigo}>
          <Bell size={12} aria-hidden="true" /> Aandacht
        </Kicker>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight" style={display}>
          Volgende acties
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
          Wat nu telt — op volgorde van urgentie, netjes gestapeld.
        </p>
      </div>
      <div className="space-y-4">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <Slab key={a.titel} side={t.side} depth={6} hover>
              <div className="flex items-start gap-4 rounded-[14px] p-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ background: t.bg, boxShadow: `3px 3px 0 0 ${t.side}` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold">{a.titel}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-[9px] px-4 py-1.5 text-[12.5px] font-semibold transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] motion-safe:hover:-translate-y-[2px]"
                  style={{ color: "#fff", background: t.fg, boxShadow: `3px 3px 0 0 ${t.side}` }}
                >
                  {a.cta}
                </button>
              </div>
            </Slab>
          );
        })}
      </div>

      <Slab
        className="flex items-center gap-4 p-5"
        side={C.greenSide}
        depth={5}
        style={{ background: `linear-gradient(180deg, #ffffff, ${C.paperSoft})` }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: C.green, boxShadow: `3px 3px 0 0 ${C.greenSide}` }}
        >
          <Check size={18} aria-hidden="true" className="text-white" />
        </div>
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Mooi. Nieuwe blokken verschijnen hier zodra ze relevant worden — je hoeft
          niets zelf te bewaken.
        </p>
      </Slab>
    </div>
  );
}

/* ============================ Facturen ============================ */
function Facturen() {
  const statusTone: Record<string, { fg: string; side: string; bg: string }> = {
    Betaald: { fg: C.green, side: C.greenSide, bg: C.greenSoft },
    Openstaand: { fg: C.amber, side: C.amberSide, bg: C.amberSoft },
    Concept: { fg: C.muted, side: C.slabDeep, bg: C.paperSoft },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker color={C.green}>
            <Send size={12} aria-hidden="true" /> Omzet
          </Kicker>
          <h1
            className="mt-2 text-[26px] font-semibold leading-tight tracking-tight"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-[11px] px-4 py-2 text-[12.5px] font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] motion-safe:hover:-translate-y-[2px]"
          style={{ background: C.indigo, boxShadow: `4px 4px 0 0 ${C.indigoSide}` }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Slab className="overflow-hidden" side={C.slab} depth={6}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? {
                  fg: C.muted,
                  side: C.slabDeep,
                  bg: C.paperSoft,
                };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fafbfe]"
                    style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.side, background: t.bg, border: `1px solid ${t.fg}33` }}
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
      </Slab>
    </div>
  );
}
