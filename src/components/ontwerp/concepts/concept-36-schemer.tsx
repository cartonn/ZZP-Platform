"use client";

// Concept 36 — "Schemer" · Gouden uur — warm verloop, optimistisch (LICHT).
// Zonsondergang/gouden-uur-sfeer: warme perzik/amber/roze verlopen (Stripe/Vercel-niveau
// gradient-craft, maar zacht en licht), optimistisch en menselijk, veel lucht. Zachte glow achter
// primaire acties, warme kaarten. Onderscheidend van Tij (koel pastel) en Aurora (donker mesh):
// dit is LICHT + warm gouden-uur-verloop.
// Palet: bg #fdf3ec, fg #2a1f22, accent koraal-zonsondergang #f97362, secundair amber #f4a259.
// Fonts: --font-lab-sora (display) + --font-lab-inter (body).

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
  Sun,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  Plus,
  FileText,
  Send,
  Loader2,
  Sparkles,
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
  bg: "#fdf3ec",
  bgWarm: "#fbe9dd",
  card: "#fffaf6",
  cardHi: "#fff4ec",
  ink: "#2a1f22",
  inkSoft: "#5b4a4c",
  muted: "#8a767a",
  faint: "#b3a0a2",
  line: "#f2ddd0",
  lineSoft: "#f7e8de",
  coral: "#f97362",
  coralDeep: "#e2513f",
  coralSoft: "rgba(249,115,98,0.12)",
  amber: "#f4a259",
  amberDeep: "#c97e2f",
  amberSoft: "rgba(244,162,89,0.16)",
  rose: "#f2a0a8",
  green: "#3f9d78",
  greenSoft: "rgba(63,157,120,0.14)",
};

const display = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-inter)" };

const SUNSET = `linear-gradient(135deg, ${C.coral} 0%, ${C.amber} 100%)`;
const SUNSET_SOFT = `linear-gradient(135deg, rgba(249,115,98,0.14), rgba(244,162,89,0.14))`;
const GLOW =
  "radial-gradient(600px 240px at 20% -10%, rgba(249,115,98,0.16), transparent 60%), radial-gradient(520px 220px at 100% 0%, rgba(244,162,89,0.16), transparent 62%)";

const NAV_ICONS: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  marktplaats: Store,
  opdracht: Briefcase,
  verificatie: ShieldCheck,
  acties: ListTodo,
  facturen: Receipt,
  documenten: FileText,
  berichten: Bell,
};

function statusStyle(s: CredStatus): {
  label: string;
  fg: string;
  bg: string;
  Icon: LucideIcon;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: C.greenSoft, Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.amberDeep, bg: C.amberSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", fg: C.coralDeep, bg: C.coralSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.coralDeep, bg: C.coralSoft, Icon: AlertTriangle };
  }
}

/* ---------- Warme bouwstenen ---------- */

function Card({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        boxShadow: glow
          ? "0 24px 60px -30px rgba(226,81,63,0.28)"
          : "0 12px 34px -28px rgba(120,70,50,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children, color = C.coralDeep }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color, ...body }}>
      {children}
    </p>
  );
}

function SectionHead({ kicker, title, note }: { kicker: string; title: string; note?: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h1
        className="mt-2.5 text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {note && (
        <p
          className="mt-2.5 max-w-2xl text-[14px] leading-relaxed"
          style={{ color: C.inkSoft, ...body }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// Warme gloed-sparkline met verloop.
function Sparkline({ data, color = C.coral }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 108;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `sk${color.replace("#", "")}`;
  const last = pts[pts.length - 1] as readonly [number, number];
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={color} />
    </svg>
  );
}

// Match-ring met warm verloop.
function MatchRing({ value }: { value: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const gid = `mr${value}`;
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center" aria-hidden="true">
      <svg width={40} height={40} viewBox="0 0 40 40" className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.coral} />
            <stop offset="100%" stopColor={C.amber} />
          </linearGradient>
        </defs>
        <circle cx={20} cy={20} r={r} fill="none" stroke={C.lineSoft} strokeWidth={3} />
        <circle
          cx={20}
          cy={20}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[11px] font-semibold tabular-nums"
        style={{ color: C.ink, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept36() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.bg }}
    >
      {/* Gouden-uur achtergrondgloed */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: GLOW }}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[680px]">
        {/* Zijbalk */}
        <aside className="hidden w-[232px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-bold text-white"
              style={{
                background: SUNSET,
                boxShadow: "0 10px 24px -8px rgba(226,81,63,0.5)",
                ...display,
              }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold tracking-tight" style={display}>
                Schemer
              </div>
              <div className="text-[10.5px]" style={{ color: C.muted }}>
                ZZP Platform
              </div>
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
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? SUNSET_SOFT : "transparent",
                    border: `1px solid ${on ? "rgba(249,115,98,0.28)" : "transparent"}`,
                  }}
                >
                  <Icon
                    size={17}
                    aria-hidden="true"
                    style={{ color: on ? C.coralDeep : C.faint }}
                  />
                  <span className="flex-1 font-medium">{s.label}</span>
                  {on && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: C.coral }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Card className="p-3.5" glow>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                  style={{ background: SUNSET, ...display }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <Check size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7">
            <div className="flex items-center gap-2">
              <Sun size={16} aria-hidden="true" style={{ color: C.amber }} />
              <h2 className="truncate text-[15px] font-semibold tracking-tight" style={display}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-[12.5px] transition-all hover:bg-[#fff4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362] sm:flex"
                style={{ border: `1px solid ${C.line}`, color: C.muted, background: C.card }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-all hover:bg-[#fff4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
                style={{ border: `1px solid ${C.line}`, color: C.inkSoft, background: C.card }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.coral }}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {/* Mobiele tabs */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-1 md:hidden">
            {SCREENS.map((s) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? SUNSET_SOFT : "transparent",
                    border: `1px solid ${on ? "rgba(249,115,98,0.28)" : C.line}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
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

/* ---------- Dashboard ---------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.coral, C.amber, C.green, C.rose];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Hero met gouden-uur verloop */}
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{
          background: `linear-gradient(135deg, ${C.cardHi} 0%, ${C.bgWarm} 100%)`,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 60px -34px rgba(226,81,63,0.3)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-70"
          style={{
            background: `radial-gradient(circle, ${C.amber}, transparent 68%)`,
            filter: "blur(18px)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sun size={15} aria-hidden="true" style={{ color: C.amberDeep }} />
            <Kicker color={C.amberDeep}>Gouden uur · {PROFIEL.plaats}</Kicker>
          </div>
          <h1
            className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight"
            style={display}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Het licht staat gunstig: drie warme matches boven de 80 procent en een vertrouwensniveau
            om trots op te zijn. Eén certificaat vraagt binnenkort even aandacht.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.green,
                background: C.greenSoft,
                border: `1px solid rgba(63,157,120,0.28)`,
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 certificaten geverifieerd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.coralDeep,
                background: C.coralSoft,
                border: `1px solid rgba(249,115,98,0.28)`,
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
            </span>
          </div>
        </div>
      </div>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.coral;
          return (
            <Card key={k.label} className="p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.coralDeep }}
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
                className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
                style={display}
              >
                <Sparkles size={15} aria-hidden="true" style={{ color: C.coral }} /> Beste matches
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
                    onClick={onOpen}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#fff4ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f97362]"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <MatchRing value={o.match} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{o.titel}</p>
                      <p
                        className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                      </p>
                    </div>
                    <span
                      className="hidden text-[12.5px] font-medium tabular-nums sm:inline"
                      style={{ color: C.inkSoft }}
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
              <h2 className="text-[14px] font-semibold tracking-tight" style={display}>
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      background: b.ongelezen ? SUNSET : C.lineSoft,
                      color: b.ongelezen ? "#fff" : C.muted,
                      ...display,
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
                          style={{ background: C.coral }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[12px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
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
              className="mb-3 flex items-center gap-2 text-[14px] font-semibold tracking-tight"
              style={display}
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
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: st.bg }}
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
                        className="shrink-0 text-[10.5px] font-semibold"
                        style={{ color: st.fg }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Aanbevolen actie met gloed */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: SUNSET, boxShadow: "0 24px 50px -22px rgba(226,81,63,0.55)" }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-40"
              style={{ background: "#fff", filter: "blur(30px)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                Aanbevolen nu
              </p>
              <p className="mt-2 text-[19px] font-semibold leading-snug text-white" style={display}>
                {ACTIES[0]?.titel}
              </p>
              <p
                className="mt-1.5 text-[12.5px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                {ACTIES[0]?.detail}
              </p>
              <button
                className="mt-4 w-full rounded-full bg-white py-2.5 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#f97362]"
                style={{ color: C.coralDeep }}
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

function Marktplaats({ onOpen }: { onOpen: () => void }) {
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
        kicker="Marktplaats"
        title="Open opdrachten"
        note="Gesorteerd op relevantie, met een warme blik op wat het beste bij je past."
      />

      <Card className="flex items-center gap-3 px-4 py-2.5 transition-colors focus-within:border-[rgba(249,115,98,0.4)]">
        <Search size={16} aria-hidden="true" style={{ color: C.coral }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#b3a0a2]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: SUNSET_SOFT, border: `1px solid rgba(249,115,98,0.28)` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.coral }} />
          </div>
          <p className="mt-4 text-[15px] font-semibold" style={display}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Niets voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid aan — er
            komt vast weer iets moois voorbij.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
            style={{ background: SUNSET }}
          >
            Zoekopdracht wissen
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group text-left transition-transform hover:-translate-y-1 focus-visible:outline-none"
            >
              <Card className="relative h-full overflow-hidden p-5 transition-colors group-hover:border-[rgba(249,115,98,0.4)] group-focus-visible:ring-2 group-focus-visible:ring-[#f97362]">
                <div
                  className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle, ${C.amber}, transparent 68%)`,
                    filter: "blur(24px)",
                  }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <span className="text-[10.5px] tracking-wide" style={{ color: C.faint }}>
                    {o.id}
                  </span>
                  <MatchRing value={o.match} />
                </div>
                <p
                  className="relative mt-2 text-[15.5px] font-semibold leading-snug"
                  style={display}
                >
                  {o.titel}
                </p>
                <p
                  className="relative mt-1.5 flex items-center gap-1.5 text-[12px]"
                  style={{ color: C.muted }}
                >
                  <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                </p>
                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {o.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-0.5 text-[10.5px]"
                      style={{
                        color: C.inkSoft,
                        background: C.cardHi,
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="relative mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                  style={{ borderColor: C.lineSoft }}
                >
                  <span className="font-semibold tabular-nums" style={{ color: C.coralDeep }}>
                    {o.tarief}
                  </span>
                  <span className="tabular-nums" style={{ color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </Card>
            </button>
          ))}
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
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{
          background: `linear-gradient(135deg, ${C.cardHi} 0%, ${C.bgWarm} 100%)`,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 60px -34px rgba(226,81,63,0.3)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle, ${C.amber}, transparent 68%)`,
            filter: "blur(20px)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362] disabled:opacity-90"
            style={{
              background: state === "sent" ? C.green : SUNSET,
              boxShadow: "0 16px 34px -14px rgba(226,81,63,0.5)",
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
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.coralDeep },
          { l: "Omvang", v: opdracht.uren, c: C.amberDeep },
          { l: "Start", v: opdracht.start, c: C.ink },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Card key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c, ...display }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-semibold" style={display}>
          <Sparkles size={15} aria-hidden="true" style={{ color: C.coral }} /> Waarom deze match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
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
              className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amberDeep }}
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.amberSoft }}
                    aria-hidden="true"
                  >
                    <Minus size={12} style={{ color: C.amberDeep }} />
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

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHead
        kicker="Vertrouwen"
        title="Verificatie"
        note="Elk certificaat onafhankelijk gecontroleerd — dat is wat opdrachtgevers vertrouwen geeft."
      />

      <div
        className="relative flex flex-col gap-5 overflow-hidden rounded-3xl p-6 sm:flex-row sm:items-center"
        style={{
          background: `linear-gradient(135deg, ${C.cardHi} 0%, ${C.bgWarm} 100%)`,
          border: `1px solid ${C.line}`,
          boxShadow: "0 24px 60px -34px rgba(226,81,63,0.28)",
        }}
      >
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-40 w-40 rounded-full opacity-50"
          style={{
            background: `radial-gradient(circle, ${C.green}, transparent 70%)`,
            filter: "blur(24px)",
          }}
          aria-hidden="true"
        />
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: C.greenSoft, border: `1px solid rgba(63,157,120,0.3)` }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <div className="relative flex-1">
          <p className="text-[18px] font-semibold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-semibold tabular-nums">{verified}</span> van{" "}
            <span className="font-semibold tabular-nums">{total}</span> certificaten geverifieerd ·{" "}
            <span style={{ color: C.coralDeep }}>{attention} vraagt actie</span>
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
                    opacity: c.status === "VERIFIED" ? 1 : 0.6,
                  }}
                  aria-hidden="true"
                />
              );
            })}
          </div>
        </div>
      </div>

      <Card>
        {CREDENTIALS.map((c, i) => {
          const st = statusStyle(c.status);
          return (
            <div
              key={c.naam}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#fff4ec]"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: st.bg, border: `1px solid ${st.fg}33` }}
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
                <p className="text-[13.5px] font-medium">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ color: st.fg, background: st.bg, border: `1px solid ${st.fg}33` }}
              >
                <st.Icon size={11} aria-hidden="true" /> {st.label}
              </span>
            </div>
          );
        })}
      </Card>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[14px] font-semibold tracking-tight" style={display}>
          Documenten
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: C.cardHi }}
                  aria-hidden="true"
                >
                  <FileText size={15} style={{ color: C.amberDeep }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{d.naam}</p>
                  <p className="truncate text-[11px]" style={{ color: C.muted }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: st.fg, background: st.bg }}
                >
                  <st.Icon size={10} aria-hidden="true" /> {st.label}
                </span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; Icon: LucideIcon; label: string }
  > = {
    warning: { fg: C.coralDeep, bg: C.coralSoft, Icon: AlertTriangle, label: "Urgent" },
    info: { fg: C.amberDeep, bg: C.amberSoft, Icon: Bell, label: "Ter info" },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHead
        kicker="Aandacht"
        title="Volgende acties"
        note="Wat nu telt — op volgorde van urgentie, met een positieve blik vooruit."
      />
      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const t = tone[a.urgentie];
          return (
            <Card
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: C.faint }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.bg, border: `1px solid ${t.fg}33` }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: t.fg, background: t.bg }}
                >
                  <t.Icon size={9} aria-hidden="true" /> {t.label}
                </span>
                <p className="mt-1.5 text-[13.5px] font-semibold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-center rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}33` }}
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
        <p className="text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles bekeken? Fijn zo. Nieuwe acties verschijnen hier zodra ze relevant worden — je hoeft
          niets zelf te bewaken.
        </p>
      </Card>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusTone: Record<string, { fg: string; bg: string; Icon: LucideIcon; label: string }> = {
    Betaald: { fg: C.green, bg: C.greenSoft, Icon: Check, label: "Betaald" },
    Openstaand: { fg: C.amberDeep, bg: C.amberSoft, Icon: Clock, label: "Openstaand" },
    Concept: { fg: C.muted, bg: C.lineSoft, Icon: FileText, label: "Concept" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHead
          kicker="Omzet"
          title="Facturen"
          note="Een warm overzicht van wat binnen is en wat nog komt."
        />
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97362]"
          style={{ background: SUNSET, boxShadow: "0 14px 30px -14px rgba(226,81,63,0.5)" }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
              >
                <th className="px-5 py-3.5 font-semibold">Nummer</th>
                <th className="px-5 py-3.5 font-semibold">Klant</th>
                <th className="hidden px-5 py-3.5 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3.5 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3.5 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? statusTone.Concept!;
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-[#fff4ec]"
                    style={{ borderTop: `1px solid ${C.lineSoft}` }}
                  >
                    <td
                      className="px-5 py-4 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-4 text-[13px] font-medium">{f.klant}</td>
                    <td
                      className="hidden px-5 py-4 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-4 text-right text-[13px] font-semibold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: t.fg, background: t.bg, border: `1px solid ${t.fg}2a` }}
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
