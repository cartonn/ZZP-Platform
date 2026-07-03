"use client";

// Concept 38 — "Spectrum" · Duotone jaaroverzicht, bold type & verloop (DONKER / vivid).
// "Wrapped"-report-energie: enorme bold koppen, levendige duotone-verlopen (magenta→violet→cyaan),
// grote cijfers-als-held en kleurblok-secties die per scherm van tint wisselen. Bold, kleurrijk,
// gestructureerd — dopamine-design maar leesbaar. Onderscheidend van Puls (vlakke kleurblokken,
// geen verloop) en Aurora (zacht mesh, subtiel): dit is BOLD verzadigde duotone-verlopen met
// reuze-typografie die per scherm van kleur wisselt.
// Palet: bg #120a1f, fg #f6ecff, accent hot-pink #ff2d78, gradient violet #7c3aed + cyaan #22d3ee.
// Fonts: --font-lab-bricolage (huge display) + --font-lab-space (body/labels).

import { useState, useEffect } from "react";
import {
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
  Sparkles,
  TrendingUp,
  Zap,
  Flame,
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
  bg: "#120a1f",
  bgDeep: "#0c0616",
  surface: "#1c1030",
  surfaceHi: "#251640",
  surfaceLine: "rgba(255,255,255,0.09)",
  ink: "#f6ecff",
  inkSoft: "#d8c4ef",
  muted: "#a08cc0",
  faint: "#6f5c8f",
  pink: "#ff2d78",
  violet: "#7c3aed",
  violetLite: "#a78bfa",
  cyan: "#22d3ee",
  // status
  green: "#34e5b0",
  amber: "#fbbf24",
  red: "#ff5c8a",
};

const display = { fontFamily: "var(--font-lab-bricolage)" };
const label = { fontFamily: "var(--font-lab-space)" };

type Scheme = { grad: string; from: string; to: string; accent: string; soft: string };

const SCHEMES: Record<ScreenKey, Scheme> = {
  dashboard: {
    grad: "linear-gradient(120deg, #ff2d78 0%, #7c3aed 55%, #22d3ee 100%)",
    from: C.pink,
    to: C.cyan,
    accent: C.pink,
    soft: "rgba(255,45,120,0.14)",
  },
  marktplaats: {
    grad: "linear-gradient(120deg, #7c3aed 0%, #a78bfa 50%, #22d3ee 100%)",
    from: C.violet,
    to: C.cyan,
    accent: C.violetLite,
    soft: "rgba(124,58,237,0.16)",
  },
  opdracht: {
    grad: "linear-gradient(120deg, #ff2d78 0%, #a78bfa 100%)",
    from: C.pink,
    to: C.violetLite,
    accent: C.pink,
    soft: "rgba(255,45,120,0.14)",
  },
  verificatie: {
    grad: "linear-gradient(120deg, #22d3ee 0%, #7c3aed 100%)",
    from: C.cyan,
    to: C.violet,
    accent: C.cyan,
    soft: "rgba(34,211,238,0.14)",
  },
  acties: {
    grad: "linear-gradient(120deg, #fbbf24 0%, #ff2d78 100%)",
    from: C.amber,
    to: C.pink,
    accent: C.amber,
    soft: "rgba(251,191,36,0.14)",
  },
  facturen: {
    grad: "linear-gradient(120deg, #34e5b0 0%, #22d3ee 55%, #7c3aed 100%)",
    from: C.green,
    to: C.violet,
    accent: C.green,
    soft: "rgba(52,229,176,0.14)",
  },
  documenten: {
    grad: "linear-gradient(120deg, #7c3aed 0%, #22d3ee 100%)",
    from: C.violet,
    to: C.cyan,
    accent: C.violetLite,
    soft: "rgba(124,58,237,0.16)",
  },
  berichten: {
    grad: "linear-gradient(120deg, #ff2d78 0%, #22d3ee 100%)",
    from: C.pink,
    to: C.cyan,
    accent: C.pink,
    soft: "rgba(255,45,120,0.14)",
  },
};

type Tone = { label: string; fg: string; bg: string; Icon: LucideIcon };

function statusStyle(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.green, bg: "rgba(52,229,176,0.14)", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.cyan, bg: "rgba(34,211,238,0.14)", Icon: Clock };
    case "EXPIRING":
      return {
        label: "Verloopt bijna",
        fg: C.amber,
        bg: "rgba(251,191,36,0.14)",
        Icon: AlertTriangle,
      };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.red, bg: "rgba(255,92,138,0.14)", Icon: AlertTriangle };
  }
}

/* ---------- Verloop-tekst (huge duotone koppen) ---------- */
function GradientText({
  children,
  grad,
  className = "",
  style,
}: {
  children: React.ReactNode;
  grad: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        backgroundImage: grad,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.surfaceLine}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Klabel({ children, color = C.pink }: { children: React.ReactNode; color?: string }) {
  return (
    <p
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
      style={{ color, ...label }}
    >
      {children}
    </p>
  );
}

/* ---------- Verloop-staafjes (bold, verzadigd) ---------- */
function GradBars({
  data,
  grad,
  w = 116,
  h = 34,
}: {
  data: number[];
  grad: string;
  w?: number;
  h?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const n = data.length;
  const gap = 3;
  const bw = (w - gap * (n - 1)) / n;
  const gid = `sg${grad.replace(/[^a-z0-9]/gi, "").slice(0, 10)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={C.pink} />
          <stop offset="50%" stopColor={C.violet} />
          <stop offset="100%" stopColor={C.cyan} />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = 4 + ((d - min) / span) * (h - 6);
        const x = i * (bw + gap);
        const y = h - bh;
        return <rect key={i} x={x} y={y} width={bw} height={bh} rx={2} fill={`url(#${gid})`} />;
      })}
    </svg>
  );
}

export function Concept38() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const scheme = SCHEMES[screen];

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{ ...label, background: C.bg, color: C.ink }}
    >
      {/* Achtergrond-gloed, per scherm van tint wisselend */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -left-[10%] -top-[18%] h-[52vh] w-[52vh] rounded-full opacity-40"
          style={{ background: scheme.from, filter: "blur(120px)" }}
        />
        <div
          className="absolute -right-[8%] top-[6%] h-[46vh] w-[46vh] rounded-full opacity-30"
          style={{ background: scheme.to, filter: "blur(130px)" }}
        />
      </div>

      <div className="relative p-3 sm:p-5 lg:p-7">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[16px] font-extrabold text-white"
              style={{ backgroundImage: SCHEMES.dashboard.grad, ...display }}
            >
              Z
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-extrabold tracking-tight" style={display}>
                Spectrum
              </div>
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{ color: C.muted }}
              >
                ZZP Platform · jaaroverzicht
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:ml-auto">
            <button
              className="hidden items-center gap-2.5 rounded-xl px-3.5 py-2 text-[12.5px] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78] sm:flex"
              style={{
                border: `1px solid ${C.surfaceLine}`,
                color: C.muted,
                background: C.surface,
              }}
              aria-label="Zoeken openen"
            >
              <Search size={14} aria-hidden="true" />
              <span>Zoek opdrachten…</span>
            </button>
            <button
              className="relative rounded-xl p-2.5 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78]"
              style={{
                border: `1px solid ${C.surfaceLine}`,
                color: C.inkSoft,
                background: C.surface,
              }}
              aria-label="Meldingen"
            >
              <Bell size={15} aria-hidden="true" />
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
                style={{ background: C.pink }}
                aria-hidden="true"
              />
            </button>
            <div
              className="hidden items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 sm:flex"
              style={{ border: `1px solid ${C.surfaceLine}`, background: C.surface }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                style={{ backgroundImage: SCHEMES.dashboard.grad, ...display }}
              >
                {PROFIEL.initialen}
              </div>
              <div className="leading-tight">
                <div className="text-[11.5px] font-bold">{PROFIEL.naam}</div>
                <div
                  className="flex items-center gap-1 text-[9.5px] font-semibold"
                  style={{ color: C.green }}
                >
                  <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Nav — pill-tabs met verloop op actief */}
        <nav className="mb-7 flex gap-2 overflow-x-auto pb-1" aria-label="Schermen">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78]"
                style={{
                  color: on ? "#0c0616" : C.inkSoft,
                  backgroundImage: on ? SCHEMES[s.key].grad : "none",
                  background: on ? undefined : C.surface,
                  border: `1px solid ${on ? "transparent" : C.surfaceLine}`,
                  boxShadow: on ? `0 10px 26px -10px ${SCHEMES[s.key].from}` : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div>
          {screen === "dashboard" && (
            <Dashboard scheme={scheme} onOpen={() => setScreen("opdracht")} />
          )}
          {screen === "marktplaats" && (
            <Marktplaats scheme={scheme} onOpen={() => setScreen("opdracht")} />
          )}
          {screen === "opdracht" && <OpdrachtDetail scheme={scheme} opdracht={active} />}
          {screen === "verificatie" && <Verificatie scheme={scheme} />}
          {screen === "acties" && <Acties scheme={scheme} />}
          {screen === "facturen" && <Facturen scheme={scheme} />}
        </div>
      </div>
    </div>
  );
}

/* ============================ Dashboard ============================ */
function Dashboard({ scheme, onOpen }: { scheme: Scheme; onOpen: () => void }) {
  const hero = KPIS[2]!; // Omzet (mnd) als held-cijfer
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero-kleurblok met reuze-cijfer */}
      <div
        className="relative overflow-hidden rounded-3xl p-7 sm:p-9"
        style={{ backgroundImage: scheme.grad }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6), transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <p
            className="text-[12px] font-bold uppercase tracking-[0.3em]"
            style={{ color: "rgba(12,6,22,0.7)", ...label }}
          >
            Jouw maand · {PROFIEL.plaats}
          </p>
          <h1
            className="mt-3 text-[34px] font-extrabold leading-[0.98] tracking-tight sm:text-[46px]"
            style={{ color: "#0c0616", ...display }}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "rgba(12,6,22,0.65)" }}
              >
                {hero.label}
              </p>
              <p
                className="text-[52px] font-extrabold tabular-nums leading-none tracking-tight sm:text-[64px]"
                style={{ color: "#0c0616", ...display }}
              >
                {hero.value}
              </p>
            </div>
            <span
              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
              style={{ background: "rgba(12,6,22,0.16)", color: "#0c0616" }}
            >
              <TrendingUp size={13} aria-hidden="true" /> {hero.trend} deze maand
            </span>
          </div>
        </div>
      </div>

      {/* KPI-rij */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums"
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
              className="mt-2 text-[28px] font-extrabold tabular-nums leading-none tracking-tight"
              style={display}
            >
              {k.value}
            </p>
            <div className="mt-3">
              <GradBars data={k.spark} grad={scheme.grad} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px] font-extrabold tracking-tight" style={display}>
              <GradientText grad={scheme.grad}>Beste matches</GradientText>
            </h2>
            <span className="text-[11.5px] font-semibold" style={{ color: C.faint }}>
              Verklaarbaar gesorteerd
            </span>
          </div>
          <Panel className="overflow-hidden">
            <div className="divide-y" style={{ borderColor: C.surfaceLine }}>
              {OPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff2d78]"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[16px] font-extrabold tabular-nums text-white"
                    style={{ backgroundImage: scheme.grad, ...display }}
                  >
                    {o.match}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{o.titel}</p>
                    <p
                      className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
                      style={{ color: C.muted }}
                    >
                      <MapPin size={11} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </p>
                  </div>
                  <span
                    className="hidden text-[12.5px] font-bold tabular-nums sm:inline"
                    style={{ color: C.inkSoft }}
                  >
                    {o.tarief.replace(" / uur", "")}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Credentials */}
        <div>
          <h2 className="mb-3 text-[20px] font-extrabold tracking-tight" style={display}>
            <GradientText grad={scheme.grad}>Credentials</GradientText>
          </h2>
          <Panel className="p-4">
            <div className="space-y-3.5">
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: st.bg }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} style={{ color: st.fg }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold">{c.naam}</p>
                      <p className="truncate text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold"
                      style={{ color: st.fg }}
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
    </div>
  );
}

/* ============================ Marktplaats ============================ */
function Marktplaats({ scheme, onOpen }: { scheme: Scheme; onOpen: () => void }) {
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
        <Klabel color={scheme.accent}>
          <Sparkles size={12} aria-hidden="true" /> Marktplaats
        </Klabel>
        <h1
          className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          <GradientText grad={scheme.grad}>Open opdrachten</GradientText>
        </h1>
      </div>

      <Panel
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderColor: `${scheme.accent}55` }}
      >
        <Search size={16} aria-hidden="true" style={{ color: scheme.accent }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#6f5c8f]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[11px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </Panel>

      {filtered.length === 0 ? (
        <Panel className="px-6 py-16 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundImage: scheme.grad }}
            aria-hidden="true"
          >
            <Search size={24} className="text-white" />
          </div>
          <p className="mt-4 text-[20px] font-extrabold" style={display}>
            Geen opdrachten gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen resultaat voor &quot;{q}&quot;. Verbreed je zoekopdracht of pas je beschikbaarheid
            aan.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-[12.5px] font-bold text-[#0c0616] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78]"
            style={{ backgroundImage: scheme.grad }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group text-left transition-transform hover:-translate-y-1 focus-visible:outline-none"
            >
              <Panel className="relative h-full overflow-hidden p-5 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-[#ff2d78]">
                <div
                  className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-40 transition-opacity group-hover:opacity-70"
                  style={{ backgroundImage: scheme.grad, filter: "blur(38px)" }}
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <span
                    className="text-[10.5px] font-semibold tracking-wide"
                    style={{ color: C.faint }}
                  >
                    {o.id}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold tabular-nums text-[#0c0616]"
                    style={{ backgroundImage: scheme.grad }}
                  >
                    <Zap size={11} aria-hidden="true" /> {o.match}%
                  </span>
                </div>
                <p
                  className="relative mt-3 text-[18px] font-extrabold leading-snug"
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
                      className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        color: C.inkSoft,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${C.surfaceLine}`,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  className="relative mt-4 flex items-center justify-between border-t pt-3.5 text-[12.5px]"
                  style={{ borderColor: C.surfaceLine }}
                >
                  <span className="font-extrabold tabular-nums">{o.tarief}</span>
                  <span className="font-semibold tabular-nums" style={{ color: C.muted }}>
                    {o.uren}
                  </span>
                </div>
              </Panel>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ Opdracht-detail ============================ */
function OpdrachtDetail({ scheme, opdracht }: { scheme: Scheme; opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 900);
  };
  const metrics = [
    { l: "Tarief", v: opdracht.tarief },
    { l: "Omvang", v: opdracht.uren },
    { l: "Start", v: opdracht.start },
    { l: "Match", v: `${opdracht.match}%` },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="relative overflow-hidden rounded-3xl p-7 sm:p-8"
        style={{ backgroundImage: scheme.grad }}
      >
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: "rgba(12,6,22,0.7)" }}
            >
              {opdracht.id}
            </p>
            <h1
              className="mt-2 text-[28px] font-extrabold leading-[1.02] tracking-tight sm:text-[34px]"
              style={{ color: "#0c0616", ...display }}
            >
              {opdracht.titel}
            </h1>
            <p
              className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: "rgba(12,6,22,0.8)" }}
            >
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-extrabold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-90"
            style={{ background: "#0c0616" }}
          >
            {state === "sending" && (
              <Loader2 size={15} aria-hidden="true" className="animate-spin" />
            )}
            {state === "sent" && <Check size={15} aria-hidden="true" style={{ color: C.green }} />}
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
        {metrics.map((m) => (
          <Panel key={m.l} className="p-4">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] font-extrabold tabular-nums tracking-tight"
              style={display}
            >
              <GradientText grad={scheme.grad}>{m.v}</GradientText>
            </p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6">
        <h3 className="flex items-center gap-2 text-[20px] font-extrabold" style={display}>
          <Sparkles size={17} aria-hidden="true" style={{ color: scheme.accent }} />
          <GradientText grad={scheme.grad}>Waarom deze match</GradientText>
        </h3>
        <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
          Transparant onderbouwd op basis van je geverifieerde profiel — niets verborgen.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl p-5" style={{ background: "rgba(52,229,176,0.1)" }}>
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
                    style={{ background: "rgba(52,229,176,0.2)" }}
                    aria-hidden="true"
                  >
                    <Check size={12} style={{ color: C.green }} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(251,191,36,0.1)" }}>
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
                    style={{ background: "rgba(251,191,36,0.2)" }}
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

/* ============================ Verificatie ============================ */
function Verificatie({ scheme }: { scheme: Scheme }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const attention = CREDENTIALS.filter(
    (c) => c.status === "EXPIRING" || c.status === "REJECTED",
  ).length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Klabel color={scheme.accent}>
          <ShieldCheck size={12} aria-hidden="true" /> Vertrouwen
        </Klabel>
        <h1
          className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          <GradientText grad={scheme.grad}>Verificatie</GradientText>
        </h1>
      </div>

      {/* Hero-kleurblok met reuze-percentage */}
      <div
        className="relative overflow-hidden rounded-3xl p-7"
        style={{ backgroundImage: scheme.grad }}
      >
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.24em]"
              style={{ color: "rgba(12,6,22,0.7)" }}
            >
              Vertrouwensniveau
            </p>
            <p
              className="text-[26px] font-extrabold leading-tight"
              style={{ color: "#0c0616", ...display }}
            >
              {PROFIEL.trust}
            </p>
            <p className="mt-1 text-[12.5px] font-semibold" style={{ color: "rgba(12,6,22,0.8)" }}>
              {verified} van {CREDENTIALS.length} credentials geverifieerd · {attention} vraagt
              actie
            </p>
          </div>
          <p
            className="text-[64px] font-extrabold tabular-nums leading-none sm:text-[80px]"
            style={{ color: "#0c0616", ...display }}
          >
            {pct}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <Panel key={c.naam} className="flex items-center gap-4 px-5 py-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: st.bg }}
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
                <p className="text-[13.5px] font-bold">{c.naam}</p>
                <p className="text-[12px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ color: st.fg, background: st.bg }}
              >
                <st.Icon size={12} aria-hidden="true" />
                {st.label}
              </span>
            </Panel>
          );
        })}
      </div>

      {/* Documenten */}
      <div>
        <h2 className="mb-3 text-[20px] font-extrabold tracking-tight" style={display}>
          <GradientText grad={scheme.grad}>Documenten</GradientText>
        </h2>
        <Panel className="overflow-hidden">
          <div className="divide-y" style={{ borderColor: C.surfaceLine }}>
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <div key={d.naam} className="flex items-center gap-3.5 px-5 py-3.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                    aria-hidden="true"
                  >
                    <FileText size={15} style={{ color: C.muted }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{d.naam}</p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {d.type} · {d.grootte} · {d.bijgewerkt}
                    </p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                    style={{ color: st.fg, background: st.bg }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
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

/* ============================ Acties ============================ */
function Acties({ scheme }: { scheme: Scheme }) {
  // Korte laad-simulatie zodat de skeleton-staat betekenisvol zichtbaar is.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  const tone: Record<"warning" | "info", { fg: string; bg: string; Icon: LucideIcon }> = {
    warning: { fg: C.amber, bg: "rgba(251,191,36,0.14)", Icon: AlertTriangle },
    info: { fg: scheme.accent, bg: scheme.soft, Icon: TrendingUp },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Klabel color={scheme.accent}>
          <Flame size={12} aria-hidden="true" /> Aandacht
        </Klabel>
        <h1
          className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight"
          style={display}
        >
          <GradientText grad={scheme.grad}>Volgende acties</GradientText>
        </h1>
        <p className="mt-1.5 text-[13px]" style={{ color: C.muted }}>
          Wat nu telt — op volgorde van urgentie.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <Panel key={i} className="flex items-center gap-4 p-5">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/5 motion-safe:animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-white/5 motion-safe:animate-pulse" />
                <div className="h-2.5 w-full rounded bg-white/5 motion-safe:animate-pulse" />
              </div>
              <div className="h-8 w-24 rounded-full bg-white/5 motion-safe:animate-pulse" />
            </Panel>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ACTIES.map((a) => {
            const t = tone[a.urgentie];
            return (
              <Panel
                key={a.titel}
                className="flex items-start gap-4 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: t.bg }}
                >
                  <t.Icon size={19} aria-hidden="true" style={{ color: t.fg }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">{a.titel}</p>
                  <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-bold text-[#0c0616] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78]"
                  style={{ backgroundImage: scheme.grad }}
                >
                  {a.cta}
                </button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================ Facturen ============================ */
function Facturen({ scheme }: { scheme: Scheme }) {
  const statusTone: Record<string, { fg: string; bg: string }> = {
    Betaald: { fg: C.green, bg: "rgba(52,229,176,0.14)" },
    Openstaand: { fg: C.amber, bg: "rgba(251,191,36,0.14)" },
    Concept: { fg: C.muted, bg: "rgba(255,255,255,0.06)" },
  };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Klabel color={scheme.accent}>
            <Send size={12} aria-hidden="true" /> Omzet
          </Klabel>
          <h1
            className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight"
            style={display}
          >
            <GradientText grad={scheme.grad}>Facturen</GradientText>
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-bold text-[#0c0616] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2d78]"
          style={{ backgroundImage: scheme.grad }}
        >
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr
                className="text-[10.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: C.faint, borderBottom: `1px solid ${C.surfaceLine}` }}
              >
                <th className="px-5 py-3 font-bold">Nummer</th>
                <th className="px-5 py-3 font-bold">Klant</th>
                <th className="hidden px-5 py-3 font-bold sm:table-cell">Datum</th>
                <th className="px-5 py-3 text-right font-bold">Bedrag</th>
                <th className="px-5 py-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const t = statusTone[f.status] ?? { fg: C.muted, bg: "rgba(255,255,255,0.06)" };
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-white/[0.04]"
                    style={{ borderBottom: `1px solid ${C.surfaceLine}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[12.5px] tabular-nums"
                      style={{ color: C.inkSoft }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                    <td
                      className="hidden px-5 py-3.5 text-[12.5px] tabular-nums sm:table-cell"
                      style={{ color: C.muted }}
                    >
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[13px] font-extrabold tabular-nums">
                      {f.bedrag}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
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
