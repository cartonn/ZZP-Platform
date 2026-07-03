"use client";

// Concept 33 — "Zegel" · Letterpress & lakzegel — ambachtelijk vertrouwen.
// Katoenpapier met subtiele grain (CSS/inline-SVG), letterpress/deboss-typografie (ingedrukte
// koppen met dubbele tekstschaduw) en een lakzegel-motief (wax seal) als vertrouwens-/
// verificatie-icoon — de verificatielaag is de held. Warm, ambachtelijk, tastbaar-vertrouwd
// rond gevoelige documenten. Onderscheidend van Folio/Terra/Vitrine: druk-/zegelambacht + deboss.
// Palet: papier bg #f0e9dc, fg #241f1a, accent lakzegel-rood #8a3324, secundair inkt #33302a.
// Fonts: --font-lab-fraunces (display serif) + --font-lab-spline-mono (labels/cijfers).

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
  Stamp,
  BadgeCheck,
  Feather,
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
  paper: "#f0e9dc",
  paperDeep: "#e7dfcd",
  card: "#f6f1e6",
  cardHi: "#faf6ee",
  ink: "#241f1a",
  inkSoft: "#4c453b",
  muted: "#726957",
  faint: "#9c9484",
  wax: "#8a3324",
  waxDeep: "#6f281c",
  waxHi: "#a8493a",
  second: "#33302a",
  green: "#4a6b45",
  greenSoft: "rgba(74,107,69,0.12)",
  amber: "#9a6f2c",
  amberSoft: "rgba(154,111,44,0.14)",
  line: "rgba(36,31,26,0.14)",
  lineSoft: "rgba(36,31,26,0.08)",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const mono = { fontFamily: "var(--font-lab-spline-mono)" };

// Subtiele katoenpapier-grain via inline SVG (self-contained, geen externe fetch).
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")";

// Letterpress deboss — kop lijkt in het papier gedrukt.
const deboss: React.CSSProperties = {
  color: C.second,
  textShadow: "0 1px 0 rgba(255,253,247,0.85), 0 -1px 1px rgba(36,31,26,0.22)",
};
const debossWax: React.CSSProperties = {
  color: C.wax,
  textShadow: "0 1px 0 rgba(255,253,247,0.8), 0 -1px 1px rgba(111,40,28,0.3)",
};

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
        bg: C.greenSoft,
        ring: "rgba(74,107,69,0.32)",
        Icon: Check,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        fg: C.amber,
        bg: C.amberSoft,
        ring: "rgba(154,111,44,0.32)",
        Icon: Clock,
      };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        bg: C.amberSoft,
        ring: "rgba(154,111,44,0.32)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        fg: C.wax,
        bg: "rgba(138,51,36,0.12)",
        ring: "rgba(138,51,36,0.32)",
        Icon: AlertTriangle,
      };
  }
}

/* ---------- Lakzegel: wax seal met kartelrand en ingedrukt embleem ---------- */
function WaxSeal({
  size = 64,
  verified = true,
  color = C.wax,
}: {
  size?: number;
  verified?: boolean;
  color?: string;
}) {
  const cx = size / 2;
  const scallops = 22;
  const rOuter = size * 0.46;
  const rInner = size * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < scallops * 2; i++) {
    const ang = (Math.PI / scallops) * i;
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push(`${(cx + Math.cos(ang) * r).toFixed(2)},${(cx + Math.sin(ang) * r).toFixed(2)}`);
  }
  const dark = color === C.wax ? C.waxDeep : color;
  const hi = color === C.wax ? C.waxHi : color;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id={`wax${size}${verified ? "v" : "n"}`} cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor={hi} />
            <stop offset="58%" stopColor={color} />
            <stop offset="100%" stopColor={dark} />
          </radialGradient>
        </defs>
        <polygon
          points={pts.join(" ")}
          fill={`url(#wax${size}${verified ? "v" : "n"})`}
          stroke={dark}
          strokeWidth={0.6}
          style={{ filter: "drop-shadow(0 3px 4px rgba(60,20,12,0.35))" }}
        />
        <circle
          cx={cx}
          cy={cx}
          r={rInner * 0.78}
          fill="none"
          stroke={dark}
          strokeWidth={0.8}
          strokeDasharray="1.5 2"
          opacity={0.6}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{
          color: "rgba(255,240,232,0.92)",
          textShadow: `0 -1px 1px ${dark}, 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        {verified ? (
          <BadgeCheck size={size * 0.4} strokeWidth={2} />
        ) : (
          <Clock size={size * 0.38} strokeWidth={2} />
        )}
      </span>
    </span>
  );
}

/* ---------- Papierkaart met deboss-lijst en zachte drukschaduw ---------- */
function Card({
  children,
  className = "",
  raised = true,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  raised?: boolean;
  as?: "div" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-lg ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.cardHi}, ${C.card})`,
        border: `1px solid ${C.line}`,
        boxShadow: raised
          ? "0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 30px -24px rgba(60,45,30,0.55)"
          : "0 1px 0 rgba(255,255,255,0.6) inset",
      }}
    >
      {children}
    </Tag>
  );
}

function Kicker({ children, color = C.wax }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color, ...mono }}
    >
      {children}
    </p>
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
        opacity={0.85}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 2.2 : 1.2} fill={color} />
      ))}
    </svg>
  );
}

function MatchStamp({ value, color = C.wax }: { value: number; color?: string }) {
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
        style={{
          color,
          background: `${color}12`,
          border: `1.5px solid ${color}`,
          ...mono,
        }}
      >
        {value}
      </span>
    </span>
  );
}

export function Concept33() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...display, background: C.paper, color: C.ink }}
    >
      {/* Katoenpapier-grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden="true"
        style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px", mixBlendMode: "multiply" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1000px 460px at 50% -12%, rgba(255,251,243,0.7), transparent 60%), radial-gradient(120% 100% at 50% 120%, rgba(80,60,40,0.06), transparent 55%)",
        }}
      />

      <div className="relative flex min-h-[680px]">
        {/* Rail */}
        <aside
          className="hidden w-[236px] shrink-0 flex-col border-r p-4 md:flex"
          style={{ borderColor: C.line }}
        >
          <div className="flex items-center gap-3 px-2 pb-7 pt-2">
            <WaxSeal size={40} verified />
            <div className="leading-tight">
              <div
                className="text-[18px] font-semibold tracking-tight"
                style={{ ...display, ...deboss }}
              >
                Zegel
              </div>
              <div className="text-[10px] tracking-[0.16em]" style={{ color: C.faint, ...mono }}>
                ZZP PLATFORM
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
                  className="group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
                  style={{
                    color: on ? C.ink : C.muted,
                    background: on ? "rgba(138,51,36,0.07)" : "transparent",
                    border: `1px solid ${on ? "rgba(138,51,36,0.2)" : "transparent"}`,
                    boxShadow: on ? "0 1px 0 rgba(255,255,255,0.6) inset" : "none",
                  }}
                >
                  {on && (
                    <span
                      className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                      style={{ background: C.wax }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={16} aria-hidden="true" style={{ color: on ? C.wax : C.faint }} />
                  <span className="flex-1 font-medium" style={display}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Card className="p-3.5" raised={false}>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{
                    color: "#f6efe6",
                    background: `linear-gradient(180deg, ${C.waxHi}, ${C.waxDeep})`,
                    ...mono,
                  }}
                >
                  {PROFIEL.initialen}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12.5px] font-semibold" style={display}>
                    {PROFIEL.naam}
                  </div>
                  <div
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: C.green, ...mono }}
                  >
                    <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex h-16 shrink-0 items-center gap-3 border-b px-5 sm:px-7"
            style={{ borderColor: C.line }}
          >
            <div className="min-w-0">
              <h2
                className="truncate text-[17px] font-semibold tracking-tight"
                style={{ ...display, ...deboss }}
              >
                {SCREENS.find((s) => s.key === screen)?.label}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                className="hidden items-center gap-2.5 rounded-md px-3.5 py-2 text-[12.5px] transition-all hover:border-[rgba(138,51,36,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50 sm:flex"
                style={{
                  border: `1px solid ${C.line}`,
                  color: C.muted,
                  background: C.cardHi,
                  ...mono,
                }}
                aria-label="Zoeken openen"
              >
                <Search size={14} aria-hidden="true" />
                <span>Zoek opdrachten…</span>
              </button>
              <button
                className="relative rounded-md p-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
                style={{ border: `1px solid ${C.line}`, color: C.inkSoft, background: C.cardHi }}
                aria-label="Meldingen"
              >
                <Bell size={15} aria-hidden="true" />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                  style={{ background: C.wax }}
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
                  className="shrink-0 rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
                  style={{
                    color: on ? "#f6efe6" : C.muted,
                    background: on ? C.wax : "transparent",
                    border: `1px solid ${on ? C.wax : C.line}`,
                    ...display,
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
  const kpiColors = [C.wax, C.second, C.green, C.amber];
  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Hero — briefkaart met zegel */}
      <Card className="relative overflow-hidden p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
            <h1
              className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-tight"
              style={{ ...display, ...deboss }}
            >
              Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              Drie matches boven 80%, je vertrouwensniveau is hoog. Eén certificaat vraagt
              binnenkort aandacht — verder is alles bezegeld en in orde.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[12px]">
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium"
                style={{
                  color: C.green,
                  background: C.greenSoft,
                  border: "1px solid rgba(74,107,69,0.28)",
                }}
              >
                <ShieldCheck size={13} aria-hidden="true" /> 2 credentials bezegeld
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium"
                style={{
                  color: C.amber,
                  background: C.amberSoft,
                  border: "1px solid rgba(154,111,44,0.28)",
                }}
              >
                <Clock size={13} aria-hidden="true" /> VOG verloopt over 23 dagen
              </span>
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <WaxSeal size={88} verified />
          </div>
        </div>
      </Card>

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const col = kpiColors[i % kpiColors.length] ?? C.wax;
          return (
            <Card key={k.label} className="p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: C.muted, ...mono }}
                >
                  {k.label}
                </p>
                <span
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.amber, ...mono }}
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
                style={{ ...display, color: C.second }}
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
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
              style={{ ...display, ...deboss }}
            >
              <Stamp size={16} aria-hidden="true" style={{ color: C.wax }} /> Beste matches
            </h2>
            <span className="text-[11px]" style={{ color: C.faint, ...mono }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y" style={{ borderColor: C.lineSoft }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[rgba(138,51,36,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8a3324]/50"
                >
                  <MatchStamp value={o.match} color={C.wax} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium" style={display}>
                      {o.titel}
                    </p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12.5px] font-semibold tabular-nums sm:inline"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Credentials */}
        <div>
          <h2
            className="mb-3 flex items-center gap-2 text-[15px] font-semibold tracking-tight"
            style={{ ...display, ...deboss }}
          >
            <ShieldCheck size={16} aria-hidden="true" style={{ color: C.green }} /> Credentials
          </h2>
          <Card className="p-4">
            <div className="space-y-3.5">
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
                      <p className="truncate text-[12.5px] font-medium" style={display}>
                        {c.naam}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: st.fg, ...mono }}
                    >
                      {st.label}
                    </span>
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
        <h1
          className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...display, ...deboss }}
        >
          Open opdrachten
        </h1>
      </div>

      <Card
        className="flex items-center gap-3 px-4 py-2.5 focus-within:border-[rgba(138,51,36,0.4)]"
        raised={false}
      >
        <Search size={16} aria-hidden="true" style={{ color: C.wax }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9c9484]"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Card>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto flex items-center justify-center" aria-hidden="true">
            <WaxSeal size={60} verified={false} color={C.muted} />
          </div>
          <p className="mt-4 text-[16px] font-semibold" style={{ ...display, ...deboss }}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-semibold text-[#f6efe6] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
            style={{ background: `linear-gradient(180deg, ${C.waxHi}, ${C.waxDeep})`, ...display }}
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
              className="group text-left focus-visible:outline-none"
            >
              <Card className="h-full p-5 transition-transform group-hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-[#8a3324]/50">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10.5px] tracking-wide" style={{ color: C.faint, ...mono }}>
                    {o.id}
                  </span>
                  <MatchStamp value={o.match} color={C.wax} />
                </div>
                <p
                  className="mt-2 text-[17px] font-semibold leading-snug"
                  style={{ ...display, ...deboss }}
                >
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
                      className="rounded px-2.5 py-0.5 text-[10.5px]"
                      style={{
                        color: C.inkSoft,
                        background: "rgba(36,31,26,0.05)",
                        border: `1px solid ${C.lineSoft}`,
                        ...mono,
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
                  <span className="font-semibold tabular-nums" style={{ color: C.ink, ...mono }}>
                    {o.tarief}
                  </span>
                  <span className="tabular-nums" style={{ color: C.muted, ...mono }}>
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
      <Card className="relative overflow-hidden p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Kicker>{opdracht.id}</Kicker>
            <h1
              className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
              style={{ ...display, ...deboss }}
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-[13px] font-semibold text-[#f6efe6] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50 disabled:opacity-90"
            style={{
              background:
                state === "sent"
                  ? `linear-gradient(180deg, #5c8155, ${C.green})`
                  : `linear-gradient(180deg, ${C.waxHi}, ${C.waxDeep})`,
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.25) inset, 0 12px 26px -14px rgba(111,40,28,0.7)",
              ...display,
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
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, c: C.wax },
          { l: "Omvang", v: opdracht.uren, c: C.second },
          { l: "Start", v: opdracht.start, c: C.second },
          { l: "Match", v: `${opdracht.match}%`, c: C.green },
        ].map((m) => (
          <Card key={m.l} className="p-4" raised={false}>
            <p
              className="text-[9.5px] font-medium uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[17px] font-semibold tabular-nums tracking-tight"
              style={{ color: m.c, ...display }}
            >
              {m.v}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3
          className="flex items-center gap-2 text-[16px] font-semibold"
          style={{ ...display, ...deboss }}
        >
          <Feather size={16} aria-hidden="true" style={{ color: C.wax }} /> Waarom deze match
        </h3>
        <p className="mt-1.5 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.green, ...mono }}
            >
              Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px]">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: C.greenSoft }}
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
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: C.amber, ...mono }}
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
                  >
                    <Minus size={12} aria-hidden="true" style={{ color: C.amber }} />
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

/* ============================ Verificatie (de held) ============================ */
function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker color={C.green}>Vertrouwen</Kicker>
        <h1
          className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...display, ...deboss }}
        >
          Verificatie
        </h1>
      </div>

      {/* Held-zegel-paneel */}
      <Card className="relative overflow-hidden p-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <WaxSeal size={96} verified />
          <div className="flex-1">
            <p className="text-[22px] font-semibold" style={{ ...display, ...debossWax }}>
              {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: C.inkSoft }}>
              <span className="font-semibold tabular-nums">{verified}</span> van{" "}
              <span className="font-semibold tabular-nums">{CREDENTIALS.length}</span> credentials
              bezegeld · <span style={{ color: C.amber }}>{attention} vraagt actie</span>
            </p>
            <div
              className="mt-3 flex items-center justify-center gap-1.5 sm:justify-start"
              aria-hidden="true"
            >
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <span
                    key={c.naam}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: st.fg, border: `1px solid ${st.ring}` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="divide-y" style={{ borderColor: C.lineSoft }}>
          {CREDENTIALS.map((c) => {
            const st = statusStyle(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[rgba(138,51,36,0.03)]"
              >
                <WaxSeal
                  size={42}
                  verified={c.status === "VERIFIED"}
                  color={
                    c.status === "REJECTED" ? C.wax : c.status === "VERIFIED" ? C.green : C.amber
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium" style={display}>
                    {c.naam}
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    color: st.fg,
                    background: st.bg,
                    border: `1px solid ${st.ring}`,
                    ...mono,
                  }}
                >
                  {c.status === "SUBMITTED" ? (
                    <Loader2 size={12} aria-hidden="true" className="motion-safe:animate-spin" />
                  ) : (
                    <st.Icon size={12} aria-hidden="true" />
                  )}
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

/* ============================ Acties ============================ */
function Acties() {
  const tone: Record<
    "warning" | "info",
    { fg: string; bg: string; ring: string; Icon: LucideIcon }
  > = {
    warning: { fg: C.amber, bg: C.amberSoft, ring: "rgba(154,111,44,0.3)", Icon: AlertTriangle },
    info: { fg: C.wax, bg: "rgba(138,51,36,0.1)", ring: "rgba(138,51,36,0.28)", Icon: Stamp },
  };
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Aandacht</Kicker>
        <h1
          className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
          style={{ ...display, ...deboss }}
        >
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
            <Card
              key={a.titel}
              className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: t.bg, border: `1px solid ${t.ring}` }}
              >
                <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={display}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 rounded-md px-4 py-1.5 text-[12.5px] font-semibold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
                style={{ color: t.fg, background: t.bg, border: `1px solid ${t.ring}`, ...display }}
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
          <h1
            className="mt-2 text-[28px] font-semibold leading-tight tracking-tight"
            style={{ ...display, ...deboss }}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-[12.5px] font-semibold text-[#f6efe6] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a3324]/50"
          style={{
            background: `linear-gradient(180deg, ${C.waxHi}, ${C.waxDeep})`,
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.25) inset, 0 10px 24px -14px rgba(111,40,28,0.7)",
            ...display,
          }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.line}`, ...mono }}
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
                  className="transition-colors hover:bg-[rgba(138,51,36,0.03)]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td
                    className="px-5 py-3.5 text-[12.5px] tabular-nums"
                    style={{ color: C.inkSoft, ...mono }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]" style={display}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                    style={{ color: C.muted, ...mono }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                    style={mono}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        color: statusTone[f.status] ?? C.muted,
                        background: `${statusTone[f.status] ?? C.muted}1f`,
                        border: `1px solid ${statusTone[f.status] ?? C.muted}33`,
                        ...mono,
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
      </Card>
    </div>
  );
}
