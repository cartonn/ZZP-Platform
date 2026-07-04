"use client";

// Concept 69 — "Haard" · behaaglijk warm-donker (cozy dark).
// Een donkere modus die "warm en veilig" voelt rond gevoelige documenten: diep espresso/houtskool,
// kaars-amber gloed, warme messing/koper-hairlines en zachte diffuse schaduwen. Uitnodigend en
// rustgevend i.p.v. klinisch. Onderscheidend van OLED-expressief (fel high-contrast) en Nebula/neon:
// dit is expliciet cozy-warm-dark, laag-prikkelend, amber i.p.v. neon.
// Palet: bg #1c1512, panelen #241a16, ink #f3e4cf, muted #b9a189, accent #e8a44c, koper #c77b3e.
// Fonts: --font-lab-newsreader (kop, warme serif) + --font-lab-manrope (body).

import { useEffect, useState } from "react";
import {
  Flame,
  Search,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  Check,
  MapPin,
  Inbox,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#1c1512",
  panel: "#241a16",
  panelAlt: "#2c211b",
  ink: "#f3e4cf",
  muted: "#b9a189",
  faint: "#8a7561",
  amber: "#e8a44c",
  copper: "#c77b3e",
  ember: "#d76b4b",
  sage: "#9bb08a",
  line: "rgba(199, 123, 62, 0.24)",
  lineSoft: "rgba(199, 123, 62, 0.14)",
};

const serif = { fontFamily: "var(--font-lab-newsreader)" };
const body = { fontFamily: "var(--font-lab-manrope)" };

// Warme, diffuse schaduw — de "haard-gloed".
const GLOW = "0 1px 0 rgba(232,164,76,0.05), 0 14px 40px -22px rgba(0,0,0,0.75)";
const GLOW_SOFT = "0 10px 30px -20px rgba(0,0,0,0.7)";

/* ---------- Status → betekenis (label + icoon + kleur, nooit kleur-alleen) ---------- */

type CredMeta = {
  label: string;
  color: string;
  Icon: typeof ShieldCheck;
};

function credMeta(s: CredStatus): CredMeta {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", color: C.sage, Icon: ShieldCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", color: C.amber, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", color: C.ember, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", color: C.copper, Icon: XCircle };
  }
}

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function Ember({ size = 34 }: { size?: number }) {
  // Kaarsvlam-zegel met warme radiale gloed.
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 40%, rgba(232,164,76,0.35), rgba(28,21,18,0) 70%)",
        border: `1px solid ${C.line}`,
      }}
      aria-hidden="true"
    >
      <Flame size={size * 0.5} strokeWidth={2} color={C.amber} fill="rgba(215,107,75,0.35)" />
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-px w-6" style={{ background: C.copper }} aria-hidden="true" />
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.28em]"
        style={{ ...body, color: C.copper }}
      >
        {children}
      </span>
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-2 text-[26px] font-medium leading-[1.05] tracking-[-0.01em] sm:text-[34px]"
      style={{ ...serif, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function StatusBadge({ status }: { status: CredStatus }) {
  const m = credMeta(status);
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        ...body,
        color: m.color,
        background: "rgba(0,0,0,0.22)",
        border: `1px solid ${m.color}44`,
      }}
    >
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  );
}

// Amber-sparkline — zachte gloedlijn onder een gebiedsvulling.
function Spark({ data, color = C.amber }: { data: number[]; color?: string }) {
  const w = 96;
  const h = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={area} fill={`${color}22`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1]![0]} cy={pts[pts.length - 1]![1]} r={2.4} fill={color} />
    </svg>
  );
}

function Panel({
  children,
  className = "",
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        boxShadow: glow ? GLOW : GLOW_SOFT,
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept69() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="relative min-h-[680px] w-full overflow-hidden antialiased"
      style={{
        ...body,
        color: C.ink,
        background: `radial-gradient(120% 90% at 18% 0%, rgba(232,164,76,0.08), rgba(28,21,18,0) 55%), ${C.bg}`,
      }}
    >
      <div className="relative flex min-h-[680px] flex-col md:flex-row">
        {/* Zijbalk */}
        <aside
          className="shrink-0 md:w-[240px]"
          style={{ borderRight: `1px solid ${C.line}`, background: "rgba(0,0,0,0.14)" }}
        >
          <div className="flex h-full flex-col">
            {/* Merk-blok */}
            <div
              className="flex items-center gap-3 p-5"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <Ember size={38} />
              <div className="leading-tight">
                <div
                  className="text-[17px] font-medium tracking-tight"
                  style={{ ...serif, color: C.ink }}
                >
                  Haard
                </div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: C.faint }}
                >
                  ZZP · zorg
                </div>
              </div>
            </div>

            {/* Navigatie */}
            <nav
              className="flex flex-row gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col"
              aria-label="Hoofdnavigatie"
            >
              {SCREENS.map((s) => {
                const on = s.key === screen;
                return (
                  <button
                    key={s.key}
                    onClick={() => setScreen(s.key)}
                    aria-current={on ? "page" : undefined}
                    className="group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c] md:w-full"
                    style={{
                      color: on ? C.ink : C.muted,
                      background: on ? C.panelAlt : "transparent",
                      border: `1px solid ${on ? C.line : "transparent"}`,
                    }}
                  >
                    <span
                      className="h-4 w-[3px] rounded-full transition-colors"
                      style={{ background: on ? C.amber : "transparent" }}
                      aria-hidden="true"
                    />
                    {s.label}
                  </button>
                );
              })}
            </nav>

            {/* Profiel */}
            <div
              className="hidden items-center gap-3 p-4 md:flex"
              style={{ borderTop: `1px solid ${C.lineSoft}`, background: "rgba(0,0,0,0.16)" }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{
                  color: C.bg,
                  background: `linear-gradient(150deg, ${C.amber}, ${C.copper})`,
                  boxShadow: "0 6px 16px -8px rgba(232,164,76,0.6)",
                }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold" style={{ color: C.ink }}>
                  {PROFIEL.naam}
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-semibold"
                  style={{ color: C.sage }}
                >
                  <ShieldCheck size={11} strokeWidth={2.4} aria-hidden="true" /> {PROFIEL.trust}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
            {screen === "marktplaats" && (
              <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
            )}
            {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
            {screen === "verificatie" && <Verificatie />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Bij de haard</Kicker>
          <Title>Goedenavond, {PROFIEL.naam.split(" ")[0]}</Title>
          <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
            {PROFIEL.rol} · {PROFIEL.plaats}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold"
          style={{ color: C.amber, background: "rgba(0,0,0,0.2)", border: `1px solid ${C.line}` }}
        >
          <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" /> Alles brandt rustig door
        </div>
      </header>

      {/* Waarschuwing */}
      {warn && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
          style={{
            border: `1px solid ${C.ember}55`,
            background: "linear-gradient(100deg, rgba(215,107,75,0.16), rgba(36,26,22,0.4))",
            boxShadow: GLOW_SOFT,
          }}
          role="alert"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-xl"
            style={{ background: "rgba(0,0,0,0.28)", border: `1px solid ${C.ember}55` }}
          >
            <AlertTriangle size={18} strokeWidth={2.2} color={C.ember} aria-hidden="true" />
          </span>
          <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
            <span className="font-semibold" style={serif}>
              {warn.titel}.
            </span>{" "}
            <span style={{ color: C.muted }}>{warn.detail}</span>
          </p>
          <button
            onClick={() => onGo("verificatie")}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
            style={{ color: C.bg, background: C.amber }}
          >
            {warn.cta} <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* KPI's */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label} className="flex flex-col justify-between p-4" glow={false}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold leading-tight" style={{ color: C.muted }}>
                {k.label}
              </p>
              <span
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                style={{ color: k.up ? C.sage : C.ember }}
              >
                {k.up ? (
                  <ArrowUpRight size={12} strokeWidth={2.6} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={12} strokeWidth={2.6} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <p
              className="mt-3 text-[26px] font-medium tabular-nums leading-none"
              style={{ ...serif, color: C.ink }}
            >
              {k.value}
            </p>
            <div className="mt-2">
              <Spark data={k.spark} color={k.up ? C.amber : C.ember} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches */}
        <Panel className="lg:col-span-2">
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${C.lineSoft}` }}
          >
            <h3
              className="flex items-center gap-2 text-[15px] font-medium"
              style={{ ...serif, color: C.ink }}
            >
              <Flame size={16} strokeWidth={2} color={C.amber} aria-hidden="true" /> Warmste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
              style={{ color: C.copper }}
            >
              Alles <ArrowRight size={12} strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-4" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: C.panelAlt }}
                >
                  <span
                    className="h-11 w-11 animate-pulse rounded-full"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse rounded"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse rounded"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="p-2">
              {OPDRACHTEN.map((o) => (
                <li key={o.id}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3.5 rounded-xl p-3 text-left transition-colors hover:bg-[#2c211b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e8a44c]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full text-[13px] font-semibold tabular-nums"
                      style={{
                        color: C.bg,
                        background:
                          o.match >= 90
                            ? `linear-gradient(150deg, ${C.amber}, ${C.copper})`
                            : "rgba(232,164,76,0.16)",
                        border: o.match >= 90 ? "none" : `1px solid ${C.line}`,
                        ...(o.match >= 90 ? {} : { color: C.amber }),
                      }}
                    >
                      {o.match}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {o.titel}
                      </span>
                      <span className="block truncate text-[11.5px]" style={{ color: C.muted }}>
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <ArrowUpRight size={16} strokeWidth={2.2} color={C.faint} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Certificaten + berichten */}
        <div className="space-y-5">
          <Panel>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <h3
                className="flex items-center gap-2 text-[15px] font-medium"
                style={{ ...serif, color: C.ink }}
              >
                <ShieldCheck size={16} strokeWidth={2} color={C.sage} aria-hidden="true" />{" "}
                Certificaten
              </h3>
            </div>
            <div className="p-2">
              {CREDENTIALS.map((c) => {
                const m = credMeta(c.status);
                const Icon = m.Icon;
                return (
                  <div key={c.naam} className="flex items-center gap-2.5 rounded-lg px-2 py-2.5">
                    <Icon size={15} strokeWidth={2.2} color={m.color} aria-hidden="true" />
                    <span
                      className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span className="text-[10.5px] font-semibold" style={{ color: m.color }}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <h3
                className="flex items-center gap-2 text-[15px] font-medium"
                style={{ ...serif, color: C.ink }}
              >
                <Inbox size={16} strokeWidth={2} color={C.copper} aria-hidden="true" /> Berichten
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={{ color: C.amber, background: "rgba(232,164,76,0.14)" }}
              >
                {BERICHTEN.filter((b) => b.ongelezen).length} nieuw
              </span>
            </div>
            <div className="p-2">
              {BERICHTEN.slice(0, 2).map((b) => (
                <div key={b.van} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ color: C.ink, background: C.panelAlt, border: `1px solid ${C.line}` }}
                    aria-hidden="true"
                  >
                    {b.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold" style={{ color: C.ink }}>
                      {b.van}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: C.muted }}>
                      {b.preview}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: GLOW_SOFT }}
      >
        <Search size={16} strokeWidth={2.2} color={C.copper} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#8a7561]"
          style={{ color: C.ink }}
        />
        <span
          className="shrink-0 text-[11.5px] font-semibold tabular-nums"
          style={{ color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="p-12 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: C.panelAlt, border: `1px solid ${C.line}` }}
            aria-hidden="true"
          >
            <Search size={24} strokeWidth={2} color={C.copper} />
          </span>
          <p className="mt-4 text-[18px] font-medium" style={{ ...serif, color: C.ink }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
            style={{ color: C.bg, background: C.amber }}
          >
            Zoekopdracht wissen
          </button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-3.5">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
                  style={{
                    background: on ? C.panelAlt : C.panel,
                    border: `1px solid ${on ? `${C.amber}55` : C.line}`,
                    boxShadow: on ? GLOW : GLOW_SOFT,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full text-[14px] font-semibold tabular-nums"
                      style={{
                        color: o.match >= 90 ? C.bg : C.amber,
                        background:
                          o.match >= 90
                            ? `linear-gradient(150deg, ${C.amber}, ${C.copper})`
                            : "rgba(232,164,76,0.14)",
                        border: o.match >= 90 ? "none" : `1px solid ${C.line}`,
                      }}
                    >
                      {o.match}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="flex items-center gap-2 text-[10.5px] font-semibold"
                        style={{ color: C.faint }}
                      >
                        <span className="uppercase tracking-[0.12em]">{o.id}</span>
                        {on && <span style={{ color: C.amber }}>· geselecteerd</span>}
                      </div>
                      <p className="truncate text-[15px] font-semibold" style={{ color: C.ink }}>
                        {o.titel}
                      </p>
                      <p
                        className="mt-0.5 flex items-center gap-1 truncate text-[11.5px]"
                        style={{ color: C.muted }}
                      >
                        <MapPin size={12} strokeWidth={2.2} aria-hidden="true" /> {o.opdrachtgever}{" "}
                        · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{
                              color: C.muted,
                              background: "rgba(0,0,0,0.22)",
                              border: `1px solid ${C.lineSoft}`,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside className="h-fit lg:sticky lg:top-4">
              <Panel>
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: C.copper }}
                  >
                    {sel.id}
                  </span>
                  <Flame size={15} strokeWidth={2} color={C.amber} aria-hidden="true" />
                </div>
                <div className="p-4">
                  <p
                    className="text-[16px] font-medium leading-snug"
                    style={{ ...serif, color: C.ink }}
                  >
                    {sel.titel}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: C.muted }}>
                    {sel.opdrachtgever} · {sel.plaats}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      { l: "Tarief", v: sel.tarief },
                      { l: "Omvang", v: sel.uren },
                      { l: "Start", v: sel.start },
                      { l: "Match", v: `${sel.match}%` },
                    ].map((m) => (
                      <div
                        key={m.l}
                        className="rounded-xl p-2.5"
                        style={{ background: C.panelAlt }}
                      >
                        <dt
                          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                          style={{ color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 font-semibold tabular-nums" style={{ color: C.ink }}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    onClick={() => onOpen(sel.id)}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
                    style={{ color: C.bg, background: C.amber }}
                  >
                    Open opdracht <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>
              </Panel>
            </aside>
          )}
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
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: C.muted,
                    background: "rgba(0,0,0,0.22)",
                    border: `1px solid ${C.lineSoft}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <span
            className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"
            style={{
              color: C.bg,
              background: `radial-gradient(circle at 50% 35%, ${C.amber}, ${C.copper})`,
              boxShadow: "0 10px 30px -12px rgba(232,164,76,0.6)",
            }}
          >
            <span className="text-[28px] font-medium tabular-nums leading-none" style={serif}>
              {opdracht.match}
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">match</span>
          </span>
        </div>
        <div className="p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            onClick={react}
            disabled={state !== "idle"}
            aria-live="polite"
            className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c] disabled:opacity-90"
            style={{
              color: C.bg,
              background: state === "sent" ? C.sage : C.amber,
            }}
          >
            {state === "idle" && (
              <>
                <Flame size={15} strokeWidth={2.2} aria-hidden="true" /> Reageer op opdracht
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={15} strokeWidth={3} aria-hidden="true" /> Reactie verstuurd
              </>
            )}
          </button>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Panel key={m.l} className="p-4" glow={false}>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[18px] font-medium tabular-nums"
              style={{ ...serif, color: C.ink }}
            >
              {m.v}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${C.lineSoft}` }}
        >
          <Sparkles size={16} strokeWidth={2} color={C.amber} aria-hidden="true" />
          <h3 className="text-[15px] font-medium" style={{ ...serif, color: C.ink }}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="p-5" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.sage }}
            >
              <Check size={13} strokeWidth={3} aria-hidden="true" /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.ink }}
                >
                  <Check
                    size={15}
                    strokeWidth={2.6}
                    color={C.sage}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            <p
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.ember }}
            >
              <AlertTriangle size={13} strokeWidth={2.6} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={15}
                    strokeWidth={2.4}
                    color={C.ember}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
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

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const stats = [
    { l: "Geverifieerd", v: `${verified}/${total}`, color: C.sage, Icon: ShieldCheck },
    { l: "Verloopt bijna", v: "1", color: C.ember, Icon: AlertTriangle },
    { l: "In beoordeling", v: "1", color: C.amber, Icon: Clock },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Je bewijsstukken worden veilig en privé bewaard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.Icon;
          return (
            <Panel key={s.l} className="flex items-center justify-between p-4" glow={false}>
              <div>
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.faint }}
                >
                  {s.l}
                </p>
                <p
                  className="mt-1.5 text-[26px] font-medium tabular-nums"
                  style={{ ...serif, color: C.ink }}
                >
                  {s.v}
                </p>
              </div>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}1c`, border: `1px solid ${s.color}44` }}
              >
                <Icon size={20} strokeWidth={2} color={s.color} aria-hidden="true" />
              </span>
            </Panel>
          );
        })}
      </div>

      <Panel>
        {CREDENTIALS.map((c, i) => {
          const m = credMeta(c.status);
          const Icon = m.Icon;
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${m.color}18`, border: `1px solid ${m.color}3a` }}
              >
                <Icon size={20} strokeWidth={2} color={m.color} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3.5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const color = warn ? C.ember : C.amber;
          return (
            <Panel key={a.titel} className="flex items-stretch overflow-hidden">
              <div
                className="flex w-14 shrink-0 flex-col items-center justify-center gap-2"
                style={{ background: `${color}16`, borderRight: `1px solid ${color}33` }}
              >
                <span className="text-[15px] font-medium tabular-nums" style={{ ...serif, color }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {warn ? (
                  <AlertTriangle size={15} strokeWidth={2.4} color={color} aria-hidden="true" />
                ) : (
                  <Sparkles size={15} strokeWidth={2.2} color={color} aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: C.ink }}>
                  {a.titel}
                </p>
                <p className="mt-0.5 text-[12.5px]" style={{ color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                className="m-3 shrink-0 self-center rounded-full px-4 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
                style={{
                  color: warn ? C.bg : C.ink,
                  background: warn ? C.amber : "rgba(0,0,0,0.24)",
                  border: warn ? "none" : `1px solid ${C.line}`,
                }}
              >
                {a.cta}
              </button>
            </Panel>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: "rgba(155,176,138,0.1)", border: `1px solid ${C.sage}33` }}
      >
        <Check size={18} strokeWidth={2.4} color={C.sage} aria-hidden="true" />
        <p className="text-[12.5px]" style={{ color: C.muted }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen hier vanzelf.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusColor: Record<string, string> = {
    Betaald: C.sage,
    Openstaand: C.ember,
    Concept: C.faint,
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a44c]"
          style={{ color: C.bg, background: C.amber }}
        >
          <Plus size={14} strokeWidth={2.6} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Panel className="p-5" glow={false}>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Ontvangen
          </p>
          <p
            className="mt-2 text-[24px] font-medium tabular-nums"
            style={{ ...serif, color: C.sage }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
        </Panel>
        <Panel className="p-5" glow={false}>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: C.faint }}
          >
            Openstaand
          </p>
          <p
            className="mt-2 text-[24px] font-medium tabular-nums"
            style={{ ...serif, color: C.ember }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.faint, borderBottom: `1px solid ${C.lineSoft}` }}
            >
              <th className="p-4">Nummer</th>
              <th className="p-4">Klant</th>
              <th className="hidden p-4 sm:table-cell">Datum</th>
              <th className="p-4 text-right">Bedrag</th>
              <th className="p-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const color = statusColor[f.status] ?? C.faint;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td
                    className="p-4 text-[12px] font-semibold tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {f.nr}
                  </td>
                  <td className="p-4 text-[13px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="hidden p-4 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="p-4 text-right text-[13px] font-semibold tabular-nums"
                    style={{ ...serif, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                        aria-hidden="true"
                      />
                      <span className="text-[11.5px] font-semibold" style={{ color }}>
                        {f.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
