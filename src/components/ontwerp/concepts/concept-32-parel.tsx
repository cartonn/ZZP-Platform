"use client";

// Concept 32 — "Parel" · Iriserend holografisch — parelmoer & chroom (LICHT).
// Een zacht licht canvas met parelmoer-sheen: subtiele iriserende regenboogranden op kaarten
// (conic/linear-gradient), chroom-metallic accenten en glanzende pill-knoppen met holografische
// rand. Rustige, leesbare inhoud op een glanzend oppervlak — legibiliteit vóór effect.
// Onderscheidend van Glas (frosted) en Aurora (donker mesh): dit is LICHT + metallic/iriserend chroom.
// Palet: bg #f4f2fb, fg #1b1a2e, accent violet #a78bfa met iriserende gradient (violet→cyaan→roze).
// Fonts: --font-lab-bricolage (display) + --font-lab-inter (body).

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
  Loader2,
  Send,
  Sparkles,
  Gem,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  bg: "#f4f2fb",
  bgDeep: "#eceaf6",
  surface: "#ffffff",
  surfaceSoft: "#faf9ff",
  ink: "#1b1a2e",
  inkSoft: "#4a4763",
  muted: "#6f6c88",
  faint: "#9995b3",
  violet: "#a78bfa",
  violetDeep: "#7c5cf0",
  cyan: "#22c3d6",
  pink: "#ec8fd8",
  green: "#2fae7a",
  amber: "#c98a1a",
  red: "#e2607a",
  border: "rgba(124,92,240,0.16)",
  borderSoft: "rgba(124,92,240,0.1)",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const body = { fontFamily: "var(--font-lab-inter)" };

// Iriserende regenboog — de holografische signatuur.
const IRID = `linear-gradient(115deg, ${C.violet} 0%, ${C.cyan} 32%, ${C.pink} 64%, ${C.violet} 100%)`;
const IRID_SOFT =
  "linear-gradient(120deg, rgba(167,139,250,0.5), rgba(34,195,214,0.4), rgba(236,143,216,0.5))";
const CHROME =
  "linear-gradient(180deg, #ffffff 0%, #eef0f6 42%, #d9dbe6 52%, #f4f5fa 70%, #ffffff 100%)";

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

type Tone = { label: string; fg: string; bg: string; ring: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        fg: C.green,
        bg: "rgba(47,174,122,0.12)",
        ring: "rgba(47,174,122,0.3)",
        Icon: Check,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.violetDeep,
        bg: "rgba(124,92,240,0.1)",
        ring: "rgba(124,92,240,0.28)",
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        bg: "rgba(201,138,26,0.12)",
        ring: "rgba(201,138,26,0.3)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.red,
        bg: "rgba(226,96,122,0.12)",
        ring: "rgba(226,96,122,0.3)",
        Icon: AlertTriangle,
      };
  }
}

/* ---------- Iriserende rand-kaart: dunne holografische border rond glanzend wit ---------- */
function IridCard({
  children,
  className = "",
  glossy = false,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  glossy?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-px ${hover ? "transition-transform hover:-translate-y-0.5" : ""}`}
      style={{ background: IRID_SOFT }}
    >
      <div
        className={`relative h-full overflow-hidden rounded-[15px] ${className}`}
        style={{
          background: glossy ? "linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)" : C.surface,
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 44px -34px rgba(60,40,120,0.42)",
        }}
      >
        {glossy && (
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-70"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0))",
            }}
            aria-hidden="true"
          />
        )}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

// Plain-white subkaart (voor rustige binnen-secties zonder iris-rand).
function Plain({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -34px rgba(60,40,120,0.35)",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="inline-block bg-clip-text text-[11px] font-bold uppercase tracking-[0.22em] text-transparent"
      style={{ backgroundImage: IRID, ...body }}
    >
      {children}
    </p>
  );
}

// Glanzende iriserende pill-knop.
function IridButton({
  children,
  onClick,
  disabled = false,
  tone = "irid",
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "irid" | "green";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const bg = tone === "green" ? `linear-gradient(180deg, #3fca8f, ${C.green})` : IRID;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/60 disabled:opacity-90 ${className}`}
      style={{
        background: bg,
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 28px -12px rgba(124,92,240,0.7)",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 96;
  const h = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 5) - 2.5;
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `pl${color.replace("#", "")}`;
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
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatchPearl({ value }: { value: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  const gid = `pearl${value}`;
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center" aria-hidden="true">
      <svg width={36} height={36} viewBox="0 0 36 36" className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.violet} />
            <stop offset="50%" stopColor={C.cyan} />
            <stop offset="100%" stopColor={C.pink} />
          </linearGradient>
        </defs>
        <circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          stroke="rgba(124,92,240,0.14)"
          strokeWidth={3.5}
        />
        <circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold tabular-nums"
        style={{ color: C.violetDeep, ...body }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept32() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...body, background: C.bg, color: C.ink }}
    >
      {/* Parelmoer-sheen achtergrond */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(900px 460px at 8% -6%, rgba(167,139,250,0.16), transparent 60%), radial-gradient(820px 480px at 96% 4%, rgba(34,195,214,0.13), transparent 62%), radial-gradient(760px 520px at 72% 108%, rgba(236,143,216,0.14), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Rail */}
        <aside className="hidden w-[232px] shrink-0 flex-col p-4 md:flex">
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-[16px] font-bold text-white"
              style={{
                background: IRID,
                boxShadow: "0 8px 22px -8px rgba(124,92,240,0.7)",
                ...display,
              }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight" style={display}>
                Parel
              </div>
              <div className="text-[10.5px]" style={{ color: C.faint }}>
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
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/50"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? "rgba(124,92,240,0.09)" : "transparent",
                    border: `1px solid ${on ? C.border : "transparent"}`,
                  }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-full"
                      style={{ background: IRID }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    size={16}
                    aria-hidden="true"
                    style={{ color: on ? C.violetDeep : C.faint }}
                  />
                  <span className="flex-1 font-medium">{s.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <IridCard className="p-3.5" glossy>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: IRID, ...display }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold">{PROFIEL.naam}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: C.green }}>
                    <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </IridCard>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold tracking-tight" style={display}>
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-[12.5px] transition-all hover:border-[rgba(124,92,240,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/50 sm:flex"
                style={{ border: `1px solid ${C.border}`, color: C.muted, background: CHROME }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-full p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/50"
                style={{ border: `1px solid ${C.border}`, color: C.inkSoft, background: CHROME }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full"
                  style={{ background: IRID }}
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
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/50"
                  style={{
                    color: on ? "#fff" : C.muted,
                    background: on ? IRID : "transparent",
                    border: `1px solid ${on ? "transparent" : C.border}`,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

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

/* ============================ Dashboard ============================ */
function Dashboard({ onOpen }: { onOpen: () => void }) {
  const kpiColors = [C.violetDeep, C.cyan, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Hero */}
      <IridCard className="p-7" glossy>
        <span
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40"
          style={{ background: IRID, filter: "blur(64px)" }}
          aria-hidden="true"
        />
        <div className="relative">
          <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
          <h1 className="mt-3 text-[32px] font-bold leading-[1.05] tracking-tight" style={display}>
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-2.5 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Drie matches boven 80%, je vertrouwensniveau is hoog. Eén credential vraagt binnenkort
            aandacht — verder loopt alles op rolletjes.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.green,
                background: "rgba(47,174,122,0.1)",
                border: "1px solid rgba(47,174,122,0.28)",
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" /> 2 credentials geverifieerd
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium"
              style={{
                color: C.amber,
                background: "rgba(201,138,26,0.1)",
                border: "1px solid rgba(201,138,26,0.28)",
              }}
            >
              <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
            </span>
          </div>
        </div>
      </IridCard>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.violetDeep;
          return (
            <IridCard key={k.label} className="p-4" hover>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber }}
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
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Sparkline data={k.spark} color={col} />
              </div>
            </IridCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[14px] font-bold tracking-tight"
              style={display}
            >
              <Sparkles size={15} aria-hidden="true" style={{ color: C.violetDeep }} /> Beste
              matches
            </h2>
            <span className="text-[11.5px]" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <IridCard className="overflow-hidden">
            <div className="divide-y" style={{ borderColor: C.borderSoft }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(124,92,240,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7c5cf0]/50"
                >
                  <MatchPearl value={o.match} />
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
                    className="hidden text-[12.5px] font-semibold tabular-nums sm:inline"
                    style={{ color: C.inkSoft }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </IridCard>
        </div>

        {/* Credentials */}
        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-[14px] font-bold tracking-tight"
            style={display}
          >
            <Gem size={15} aria-hidden="true" style={{ color: C.cyan }} /> Credentials
          </h2>
          <Plain className="p-4">
            <div className="space-y-3">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: st.bg, border: `1px solid ${st.ring}` }}
                      aria-hidden="true"
                    >
                      <st.Icon size={12} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: st.fg }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Plain>
        </div>
      </div>
    </div>
  );
}

/* ============================ Marktplaats ============================ */
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
      <div>
        <Kicker>Marktplaats</Kicker>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={display}>
          Open opdrachten
        </h1>
      </div>

      <div className="rounded-full p-px" style={{ background: IRID_SOFT }}>
        <div
          className="flex items-center gap-3 rounded-full px-4 py-2.5"
          style={{ background: C.surface }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.violetDeep }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9995b3]"
            style={{ color: C.ink }}
          />
          <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
            {filtered.length}/{OPDRACHTEN.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <IridCard className="px-6 py-16 text-center" glossy>
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(124,92,240,0.08)", border: `1px solid ${C.border}` }}
            aria-hidden="true"
          >
            <Search size={22} style={{ color: C.violetDeep }} />
          </div>
          <p className="mt-4 text-[15px] font-bold" style={display}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <IridButton onClick={() => setQ("")} className="mt-5">
            Zoekopdracht wissen
          </IridButton>
        </IridCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group text-left focus-visible:outline-none"
            >
              <IridCard className="h-full p-5" glossy hover>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10.5px] tracking-wide" style={{ color: C.faint }}>
                    {o.id}
                  </span>
                  <MatchPearl value={o.match} />
                </div>
                <p className="mt-2 text-[15.5px] font-bold leading-snug" style={display}>
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
                      className="rounded-full px-2.5 py-0.5 text-[10.5px]"
                      style={{
                        color: C.inkSoft,
                        background: "rgba(124,92,240,0.06)",
                        border: `1px solid ${C.borderSoft}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                  style={{ borderColor: C.borderSoft }}
                >
                  <span className="font-bold tabular-nums" style={{ color: C.ink }}>
                    {o.tarief}
                  </span>
                  <span className="tabular-nums" style={{ color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </IridCard>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ Opdracht detail ============================ */
function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <IridCard className="p-7" glossy>
        <span
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-40"
          style={{ background: IRID, filter: "blur(60px)" }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={display}>
              {opdracht.titel}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: C.inkSoft }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <IridButton
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            tone={state === "sent" ? "green" : "irid"}
            className="shrink-0"
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
          </IridButton>
        </div>
      </IridCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.violetDeep },
          { l: "Omvang", v: opdracht.uren, c: C.cyan },
          { l: "Start", v: opdracht.start, c: C.ink },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Plain key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[16px] font-bold tabular-nums tracking-tight"
              style={{ color: m.c, ...display }}
            >
              {m.v}
            </p>
          </Plain>
        ))}
      </div>

      <IridCard className="p-6">
        <h3 className="flex items-center gap-2 text-[14.5px] font-bold" style={display}>
          <Sparkles size={15} aria-hidden="true" style={{ color: C.violetDeep }} /> Waarom deze
          match
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.green }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(47,174,122,0.12)" }}
                  >
                    <Check size={12} aria-hidden="true" style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
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
                    style={{ background: "rgba(201,138,26,0.12)" }}
                  >
                    <Minus size={12} aria-hidden="true" style={{ color: C.amber }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </IridCard>
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
        <Kicker>Vertrouwen</Kicker>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={display}>
          Verificatie
        </h1>
      </div>

      <IridCard className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center" glossy>
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "rgba(47,174,122,0.1)", border: "1px solid rgba(47,174,122,0.3)" }}
        >
          <ShieldCheck size={30} aria-hidden="true" style={{ color: C.green }} />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-bold" style={display}>
            {PROFIEL.trust}
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkSoft }}>
            <span className="font-semibold tabular-nums">{verified}</span> van{" "}
            <span className="font-semibold tabular-nums">{CREDENTIALS.length}</span> credentials
            geverifieerd · <span style={{ color: C.amber }}>{attention} vraagt actie</span>
          </p>
        </div>
        <div className="flex items-end gap-1.5" aria-hidden="true">
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <span
                key={c.naam}
                className="w-2.5 rounded-full"
                style={{ height: c.status === "VERIFIED" ? 40 : 22, background: st.fg }}
              />
            );
          })}
        </div>
      </IridCard>

      <IridCard className="overflow-hidden">
        <div className="divide-y" style={{ borderColor: C.borderSoft }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[rgba(124,92,240,0.04)]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: st.bg, border: `1px solid ${st.ring}` }}
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
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.fg, background: st.bg, border: `1px solid ${st.ring}` }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </IridCard>
    </div>
  );
}

/* ============================ Acties ============================ */
function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; ring: string; Icon: LucideIcon }
  > = {
    warning: {
      fg: C.amber,
      bg: "rgba(201,138,26,0.1)",
      ring: "rgba(201,138,26,0.28)",
      Icon: AlertTriangle,
    },
    info: {
      fg: C.violetDeep,
      bg: "rgba(124,92,240,0.09)",
      ring: "rgba(124,92,240,0.26)",
      Icon: TrendingUp,
    },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={display}>
          Volgende acties
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
          Wat nu telt — op volgorde van urgentie.
        </p>
      </div>
      <div className="space-y-3">
        {ACTIES.map((a) => {
          const t = tone[a.urgentie];
          return (
            <IridCard key={a.titel} className="flex items-start gap-4 p-5" hover>
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: t.bg, border: `1px solid ${t.ring}` }}
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
                className="shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cf0]/50"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.ring}` }}
              >
                {a.cta}
              </button>
            </IridCard>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ Facturen ============================ */
function Facturen() {
  const statusTone: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.muted,
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Kicker>Omzet</Kicker>
          <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight" style={display}>
            Facturen
          </h1>
        </div>
        <IridButton className="!py-2">
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </IridButton>
      </div>

      <IridCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.borderSoft}` }}
              >
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Klant</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-semibold">Bedrag</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[rgba(124,92,240,0.04)]"
                  style={{ borderBottom: `1px solid ${C.borderSoft}` }}
                >
                  <td
                    className="px-5 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">{f.klant}</td>
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
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        color: statusTone[f.status] ?? C.muted,
                        background: `${statusTone[f.status] ?? C.muted}1f`,
                        border: `1px solid ${statusTone[f.status] ?? C.muted}33`,
                      }}
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
        </div>
      </IridCard>
    </div>
  );
}
