"use client";

// Concept 08 — "Onthaal": warm-human, trust-first.
// Warm light canvas, emerald accent, humanist type, soft radii and gentle shadows.
// Signature: a friendly VERTROUWENSNIVEAU (trust meter) on dashboard & verificatie.
// Self-contained mini-app: sidebar shell + internal screen tabs over the core screens.

import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  ShieldCheck,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Bookmark,
  ArrowRight,
  Sparkle,
  Heart,
  Home,
  Store,
  ScrollText,
  ListChecks,
  Receipt,
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

const head = { fontFamily: "var(--font-lab-sora)" } as const;
const body = { fontFamily: "var(--font-lab-inter)" } as const;

// Warm palette
const CANVAS = "#fbf7f1";
const CARD = "#ffffff";
const INK = "#3f3a34";
const SOFT = "#8c8478";
const LINE = "#ece4d8";
const EMERALD = "#059669";
const EMERALD_SOFT = "#ecfdf5";
const AMBER = "#b45309";
const RED = "#b91c1c";

const NAV_ICON: Record<ScreenKey, typeof Home> = {
  dashboard: Home,
  marktplaats: Store,
  opdracht: ScrollText,
  verificatie: ShieldCheck,
  acties: ListChecks,
  facturen: Receipt,
  documenten: ScrollText,
  berichten: Bell,
};

/* ------------------------------------------------------------------ sparkline */

function Spark({ data }: { data: number[] }) {
  const w = 100;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const coords = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
      className="overflow-visible"
    >
      <polygon points={area} fill={EMERALD} opacity={0.08} />
      <polyline
        points={line}
        fill="none"
        stroke={EMERALD}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ trust meter */

// Friendly segmented trust gauge. Verified credentials drive the fill.
function TrustMeter({ size = "lg" }: { size?: "lg" | "sm" }) {
  const segments = 5;
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  // Map to a warm, reassuring 4/5 ("Hoog vertrouwen").
  const filled = Math.min(segments, Math.max(1, verified + 2));
  const pct = Math.round((filled / segments) * 100);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: EMERALD_SOFT }}
        >
          <ShieldCheck className="h-4 w-4" style={{ color: EMERALD }} aria-hidden />
        </span>
        <div>
          <div style={head} className="text-[13px] font-semibold leading-tight">
            Vertrouwensniveau · Hoog
          </div>
          <div style={body} className="text-[11px]">
            <span style={{ color: SOFT }}>Opdrachtgevers zien je als betrouwbaar.</span>
          </div>
        </div>
        <span
          style={{ ...head, color: EMERALD }}
          className={[
            "ml-auto font-semibold tabular-nums",
            size === "lg" ? "text-[20px]" : "text-[16px]",
          ].join(" ")}
        >
          {pct}%
        </span>
      </div>
      <div
        className="flex gap-1.5"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Vertrouwensniveau"
      >
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className="h-2 flex-1 rounded-full transition-colors motion-reduce:transition-none"
            style={{ backgroundColor: i < filled ? EMERALD : LINE }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ cred seal */

const SEAL: Record<
  CredStatus,
  { color: string; bg: string; label: string; icon: typeof BadgeCheck }
> = {
  VERIFIED: { color: EMERALD, bg: EMERALD_SOFT, label: "Geverifieerd", icon: BadgeCheck },
  EXPIRING: { color: AMBER, bg: "#fef3e7", label: "Verloopt binnenkort", icon: AlertTriangle },
  SUBMITTED: { color: "#6b7280", bg: "#f3f4f6", label: "In beoordeling", icon: Clock },
  REJECTED: { color: RED, bg: "#fdecec", label: "Afgewezen", icon: XCircle },
};

/* ------------------------------------------------------------------ shell */

export function Concept08() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");

  return (
    <div
      style={{ ...body, backgroundColor: CANVAS, color: INK }}
      className="flex min-h-[640px] w-full antialiased [color-scheme:light]"
    >
      {/* Sidebar */}
      <aside
        className="hidden w-[224px] shrink-0 flex-col border-r p-3 md:flex"
        style={{ borderColor: LINE }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-[15px] font-bold text-white"
            style={{ ...head, backgroundColor: EMERALD }}
            aria-hidden
          >
            z
          </span>
          <div className="leading-tight">
            <div style={head} className="text-[13px] font-semibold">
              Onthaal
            </div>
            <div style={body} className="text-[11px]">
              <span style={{ color: SOFT }}>zorg & zelfstandig</span>
            </div>
          </div>
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-1" aria-label="Hoofdnavigatie">
          {SCREENS.map((s) => {
            const Icon = NAV_ICON[s.key];
            const active = s.key === screen;
            return (
              <button
                key={s.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => setScreen(s.key)}
                style={active ? { backgroundColor: CARD } : undefined}
                className={[
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left text-[13px] transition-colors duration-150 motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  active
                    ? "font-semibold shadow-[0_1px_2px_rgba(63,58,52,0.06)]"
                    : "hover:bg-white/60",
                ].join(" ")}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: active ? EMERALD : SOFT }}
                  aria-hidden
                />
                <span style={{ color: active ? INK : SOFT }}>{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rounded-2xl p-3.5" style={{ backgroundColor: EMERALD_SOFT }}>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" style={{ color: EMERALD }} aria-hidden />
            <span style={head} className="text-[11px] font-semibold">
              Je staat er goed voor
            </span>
          </div>
          <p style={body} className="mt-1.5 text-[11px] leading-relaxed">
            <span style={{ color: "#3f6b54" }}>
              Eén document verloopt binnenkort. We helpen je het op tijd te vernieuwen.
            </span>
          </p>
        </div>
      </aside>

      {/* Right column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3 border-b px-4 py-3 sm:px-6"
          style={{ borderColor: LINE }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-left text-[13px] transition-colors hover:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:max-w-sm"
            style={{ borderColor: LINE }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: SOFT }} aria-hidden />
            <span className="truncate" style={{ color: SOFT }}>
              Zoek een opdracht of document…
            </span>
          </button>

          <button
            type="button"
            aria-label="Meldingen"
            className="relative rounded-full p-2.5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            style={{ color: SOFT }}
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: EMERALD }}
              aria-hidden
            />
          </button>

          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{ ...head, backgroundColor: "#0f766e" }}
              aria-hidden
            >
              {PROFIEL.initialen}
            </span>
            <div className="hidden leading-tight sm:block">
              <div style={head} className="text-[12px] font-semibold">
                {PROFIEL.naam}
              </div>
              <div style={body} className="text-[11px]">
                <span style={{ color: SOFT }}>{PROFIEL.rol}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <Opdracht />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ shared bits */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-3xl border bg-white p-5 shadow-[0_1px_3px_rgba(63,58,52,0.05)]",
        className,
      ].join(" ")}
      style={{ borderColor: LINE }}
    >
      {children}
    </div>
  );
}

function MatchRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LINE} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={EMERALD}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span
        style={{ ...head, color: EMERALD }}
        className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums"
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 style={head} className="text-[22px] font-semibold tracking-tight">
            Goedemorgen, Sanne
          </h1>
          <p style={body} className="mt-0.5 text-[13px]">
            <span style={{ color: SOFT }}>Drie opdrachten passen vandaag goed bij je.</span>
          </p>
        </div>
      </div>

      {/* Trust meter — signature */}
      <Card className="!p-5">
        <TrustMeter />
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label} className="!p-4">
            <div style={body} className="text-[11px] font-medium">
              <span style={{ color: SOFT }}>{kpi.label}</span>
            </div>
            <div
              style={head}
              className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-tight"
            >
              {kpi.value}
            </div>
            <div className="mt-2">
              <Spark data={kpi.spark} />
            </div>
            <div
              style={{ ...body, color: kpi.up ? EMERALD : AMBER }}
              className="mt-1.5 text-[11px] font-medium tabular-nums"
            >
              {kpi.up ? "↑" : "•"} {kpi.trend}
            </div>
          </Card>
        ))}
      </div>

      {/* Top matches */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 style={head} className="text-[14px] font-semibold">
            Opdrachten die bij je passen
          </h2>
          <Sparkle className="h-4 w-4" style={{ color: EMERALD }} aria-hidden />
        </div>
        <div className="space-y-3">
          {OPDRACHTEN.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-4 rounded-3xl border bg-white p-4 text-left shadow-[0_1px_3px_rgba(63,58,52,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(63,58,52,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{ borderColor: LINE }}
            >
              <MatchRing value={o.match} />
              <div className="min-w-0 flex-1">
                <div style={head} className="truncate text-[14px] font-semibold">
                  {o.titel}
                </div>
                <div style={body} className="mt-0.5 truncate text-[12px]">
                  <span style={{ color: SOFT }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: SOFT }} aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Marktplaats */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const filters = ["Alle", "Beste match", "Utrecht", "Avond"];
  const [active, setActive] = useState(0);
  const rows = useMemo(() => {
    if (active === 1) return [...OPDRACHTEN].sort((a, b) => b.match - a.match);
    return OPDRACHTEN;
  }, [active]);

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
              style={
                on ? { backgroundColor: EMERALD, borderColor: EMERALD } : { borderColor: LINE }
              }
              className={[
                "rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                on ? "text-white" : "bg-white hover:border-emerald-200",
              ].join(" ")}
            >
              <span style={on ? undefined : { color: SOFT }}>{f}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {rows.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={onOpen}
            className="flex w-full flex-col gap-3 rounded-3xl border bg-white p-4 text-left shadow-[0_1px_3px_rgba(63,58,52,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(63,58,52,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:gap-4"
            style={{ borderColor: LINE }}
          >
            <MatchRing value={o.match} size={48} />
            <div className="min-w-0 flex-1">
              <div style={head} className="truncate text-[14px] font-semibold">
                {o.titel}
              </div>
              <div style={body} className="mt-0.5 truncate text-[12px]">
                <span style={{ color: SOFT }}>
                  {o.opdrachtgever} · {o.plaats} · {o.uren} · {o.tarief}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    style={{ backgroundColor: EMERALD_SOFT, color: "#3f6b54" }}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              className="hidden h-4 w-4 shrink-0 self-center sm:block"
              style={{ color: SOFT }}
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Opdracht */

function Opdracht() {
  const o = OPDRACHTEN[0];
  const [saved, setSaved] = useState(false);
  const [reacted, setReacted] = useState(false);
  if (!o) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <div className="flex items-start gap-4">
          <MatchRing value={o.match} size={56} />
          <div className="min-w-0 flex-1">
            <div style={body} className="text-[11px] font-medium tabular-nums">
              <span style={{ color: SOFT }}>{o.id}</span>
            </div>
            <h2 style={head} className="mt-0.5 text-[18px] font-semibold tracking-tight">
              {o.titel}
            </h2>
            <div style={body} className="mt-1 text-[12px]">
              <span style={{ color: SOFT }}>
                {o.opdrachtgever} · {o.plaats} · {o.tarief} · {o.uren} · {o.start}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* explainable matching */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="!p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: EMERALD_SOFT }}
            >
              <BadgeCheck className="h-3.5 w-3.5" style={{ color: EMERALD }} aria-hidden />
            </span>
            <span style={head} className="text-[12px] font-semibold">
              Waarom dit past
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]">
                <BadgeCheck
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: EMERALD }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="!p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: "#fef3e7" }}
            >
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: AMBER }} aria-hidden />
            </span>
            <span style={head} className="text-[12px] font-semibold">
              Goed om te weten
            </span>
          </div>
          <ul className="space-y-2.5">
            {o.redenen.min.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[12px]">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: AMBER }}
                  aria-hidden
                />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setReacted(true)}
          disabled={reacted}
          style={{ backgroundColor: EMERALD }}
          className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:opacity-90 motion-reduce:transition-none"
        >
          {reacted ? "Reactie verstuurd ✓" : "Reageer op opdracht"}
        </button>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          style={{ borderColor: LINE }}
          className="flex items-center gap-1.5 rounded-full border bg-white px-5 py-2.5 text-[13px] font-medium transition-colors duration-150 hover:border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 motion-reduce:transition-none"
        >
          <Bookmark
            className="h-3.5 w-3.5"
            style={{ color: saved ? EMERALD : SOFT }}
            fill={saved ? EMERALD : "none"}
            aria-hidden
          />
          <span style={{ color: saved ? EMERALD : INK }}>{saved ? "Bewaard" : "Bewaar"}</span>
        </button>
        {reacted && (
          <span style={body} className="text-[12px]">
            <span style={{ color: EMERALD }}>Mooi! Je hoort meestal binnen 6 uur.</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Verificatie */

function Verificatie() {
  return (
    <div className="space-y-5">
      <Card>
        <TrustMeter />
        <p style={body} className="mt-4 text-[12px] leading-relaxed">
          <span style={{ color: SOFT }}>
            Je documenten worden veilig en privé bewaard. Alleen jij en geverifieerde opdrachtgevers
            zien je certificaten.
          </span>
        </p>
      </Card>

      <div>
        <h2 style={head} className="mb-2.5 text-[14px] font-semibold">
          Je certificaten
        </h2>
        <div className="space-y-3">
          {CREDENTIALS.map((c) => {
            const s = SEAL[c.status];
            const Icon = s.icon;
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3.5 rounded-3xl border bg-white p-4 shadow-[0_1px_3px_rgba(63,58,52,0.05)]"
                style={{ borderColor: LINE }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: s.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: s.color }} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div style={head} className="truncate text-[13px] font-semibold">
                    {c.naam}
                  </div>
                  <div style={body} className="truncate text-[11px]">
                    <span style={{ color: SOFT }}>{c.detail}</span>
                  </div>
                </div>
                <span
                  style={{ backgroundColor: s.bg, color: s.color }}
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Acties */

function Acties() {
  const ordered = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-4">
      <div>
        <h1 style={head} className="text-[18px] font-semibold tracking-tight">
          Wat je nu kunt doen
        </h1>
        <p style={body} className="mt-0.5 text-[13px]">
          <span style={{ color: SOFT }}>Kleine stappen die je profiel sterker maken.</span>
        </p>
      </div>
      <div className="space-y-3">
        {ordered.map((a) => {
          const warn = a.urgentie === "warning";
          const color = warn ? AMBER : EMERALD;
          const bg = warn ? "#fef3e7" : EMERALD_SOFT;
          return (
            <div
              key={a.titel}
              className="flex items-start gap-3.5 rounded-3xl border bg-white p-4 shadow-[0_1px_3px_rgba(63,58,52,0.05)]"
              style={{ borderColor: LINE }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: bg }}
              >
                {warn ? (
                  <AlertTriangle className="h-5 w-5" style={{ color }} aria-hidden />
                ) : (
                  <Sparkle className="h-5 w-5" style={{ color }} aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div style={head} className="text-[13px] font-semibold">
                  {a.titel}
                </div>
                <p style={body} className="mt-0.5 text-[12px] leading-snug">
                  <span style={{ color: SOFT }}>{a.detail}</span>
                </p>
              </div>
              <button
                type="button"
                style={{ backgroundColor: bg, color }}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 motion-reduce:transition-none"
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Facturen */

const INVOICE: Record<string, { color: string; bg: string }> = {
  Betaald: { color: EMERALD, bg: EMERALD_SOFT },
  Openstaand: { color: AMBER, bg: "#fef3e7" },
  Concept: { color: "#6b7280", bg: "#f3f4f6" },
};

function Facturen() {
  const empty = FACTUREN.length === 0;
  return (
    <div className="space-y-4">
      <h1 style={head} className="text-[18px] font-semibold tracking-tight">
        Facturen
      </h1>

      {empty ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: EMERALD_SOFT }}
          >
            <Receipt className="h-6 w-6" style={{ color: EMERALD }} aria-hidden />
          </span>
          <p style={head} className="text-[14px] font-semibold">
            Nog geen facturen — je eerste opdracht staat klaar
          </p>
          <p style={body} className="max-w-xs text-[12px]">
            <span style={{ color: SOFT }}>
              Zodra je een opdracht afrondt, maken we hier samen je eerste factuur.
            </span>
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr style={{ borderColor: LINE }} className="border-b">
                {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h, i) => (
                  <th
                    key={h}
                    style={{ ...body, color: SOFT }}
                    className={[
                      "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide",
                      i === 3 ? "text-right" : "",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f, i) => {
                const inv = INVOICE[f.status] ?? INVOICE.Concept;
                return (
                  <tr key={f.nr} className={i > 0 ? "border-t" : ""} style={{ borderColor: LINE }}>
                    <td
                      style={{ ...head }}
                      className="px-4 py-3.5 text-[12px] font-semibold tabular-nums"
                    >
                      {f.nr}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">{f.klant}</td>
                    <td className="px-4 py-3.5 text-[12px] tabular-nums">
                      <span style={{ color: SOFT }}>{f.datum}</span>
                    </td>
                    <td
                      style={head}
                      className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums"
                    >
                      {f.bedrag}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        style={{ backgroundColor: inv?.bg, color: inv?.color }}
                        className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      >
                        {f.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
