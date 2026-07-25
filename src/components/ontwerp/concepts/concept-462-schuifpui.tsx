"use client";

// Concept 462 — "Schuifpui" · Liquid Glass / spatial depth (visionOS-2026). Gestapelde translucente
// glaspanelen met backdrop-blur, specular-highlight-randen (lichte top-rand + zachte binnenschaduw)
// en diepte via laag-op-laag met verschuivende offsets. Koele getinte glas-tint over een zacht
// kleurverloop; glossy en verfijnd, nooit druk.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
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

// — Palet: koel getint glas over een zacht verloop; heldere accenten schemeren door het glas —
const C = {
  ink: "#101726",
  inkSoft: "#334155",
  inkMute: "#5a6b85",
  inkFaint: "#8b98ad",
  glassEdge: "rgba(255,255,255,0.6)",
  glassLine: "rgba(120,140,180,0.22)",
  sky: "#2563eb",
  skyDeep: "#1d4ed8",
  skyGlow: "rgba(37,99,235,0.16)",
  teal: "#0891b2",
  emerald: "#0f9d78",
  amber: "#b45309",
  rose: "#be123c",
};

const bodyFont = {
  fontFamily:
    "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = {
  fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// Glas-oppervlak met specular-rand: lichte binnen-highlight bovenaan + zachte diepteschaduw.
function glassStyle(tint = "rgba(255,255,255,0.55)"): React.CSSProperties {
  return {
    background: tint,
    backdropFilter: "blur(20px) saturate(1.5)",
    WebkitBackdropFilter: "blur(20px) saturate(1.5)",
    border: `1px solid ${C.glassLine}`,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 2px rgba(120,140,180,0.12), 0 12px 32px -12px rgba(30,50,90,0.28)",
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  alarm: boolean;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, tone: C.emerald, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.teal, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: ShieldAlert, tone: C.amber, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, alarm: true };
  }
}

// — Glaspaneel: de bouwsteen van de schuifpui —
function Glass({
  children,
  className = "",
  as: Tag = "div",
  tint,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
  tint?: string;
}) {
  return (
    <Tag className={`relative overflow-hidden rounded-3xl ${className}`} style={glassStyle(tint)}>
      {/* specular sheen langs de bovenrand */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
        }}
        aria-hidden="true"
      />
      {children}
    </Tag>
  );
}

function Eyebrow({ children, tone = C.sky }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: tone, ...bodyFont }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: tone }}
        aria-hidden="true"
      />
      {children}
    </p>
  );
}

function GlassButton({
  children,
  onClick,
  className = "",
  full = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 hover:-translate-y-px hover:shadow-[0_10px_28px_-8px_rgba(37,99,235,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e5edfb] active:translate-y-0 motion-reduce:transition-none ${full ? "w-full" : ""} ${className}`}
      style={{
        background: `linear-gradient(180deg, ${C.sky}, ${C.skyDeep})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px -8px rgba(37,99,235,0.6)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

function GhostGlass({
  children,
  onClick,
  active = false,
  ariaPressed,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e5edfb] motion-reduce:transition-none ${className}`}
      style={{
        color: active ? C.skyDeep : C.inkSoft,
        background: active ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.5)",
        border: `1px solid ${active ? "rgba(37,99,235,0.35)" : C.glassLine}`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        ...bodyFont,
      }}
    >
      {children}
    </button>
  );
}

// — Glas-sparkline met verlopende vulling —
function GlassSpark({ data, id, tone }: { data: number[]; id: string; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((d - min) / span) * (h - 6);
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} ${w},${h} 0,${h}`;
  const [lx, ly] = pts[pts.length - 1] ?? [w, h];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`gs-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.32" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#gs-${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r="2.6" fill="#fff" stroke={tone} strokeWidth="1.5" />
    </svg>
  );
}

function trendNumber(t: string) {
  return t.replace(/^[+-]/, "");
}

export function Concept462() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ color: C.ink, ...bodyFont }}
    >
      {/* Zacht kleurverloop-achtergrond waar het glas overheen ligt */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 12% -8%, #dbe7ff 0%, transparent 55%), radial-gradient(1000px 700px at 95% 0%, #e6dcff 0%, transparent 50%), radial-gradient(900px 700px at 60% 110%, #d4f2ee 0%, transparent 55%), linear-gradient(180deg, #eef3fc, #e7ecf7)",
        }}
        aria-hidden="true"
      />
      <style>{`
        @keyframes glideIn { from { opacity: 0; transform: translateY(14px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glide-in { animation: glideIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .glide-in { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="glide-in pt-6">
          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onActies={() => setScreen("acties")} />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <header className="py-5">
      <Glass className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white"
            style={{
              background: `linear-gradient(180deg, ${C.sky}, ${C.skyDeep})`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
            aria-hidden="true"
          >
            <Layers size={19} strokeWidth={2} />
          </span>
          <div>
            <p className="text-[16px] font-semibold leading-none tracking-[-0.01em]">Schuifpui</p>
            <p className="mt-1.5 text-[11.5px] leading-none" style={{ color: C.inkMute }}>
              {PROFIEL.plaats} · helder overzicht
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold sm:inline-flex"
            style={{
              color: C.emerald,
              background: "rgba(15,157,120,0.12)",
              border: "1px solid rgba(15,157,120,0.3)",
            }}
          >
            <ShieldCheck size={13} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3fc]"
            style={{
              background: "rgba(255,255,255,0.6)",
              border: `1px solid ${C.glassLine}`,
              color: C.inkMute,
            }}
            aria-label={`${ongelezen} ongelezen berichten`}
          >
            <Bell size={15} aria-hidden="true" />
            {ongelezen > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                style={{ background: C.rose, border: "2px solid #eef3fc" }}
                aria-hidden="true"
              />
            )}
          </button>
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-semibold leading-tight">{PROFIEL.naam}</span>
            <span className="block text-[11px]" style={{ color: C.inkMute }}>
              {PROFIEL.rol}
            </span>
          </span>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] font-semibold text-white"
            style={{ background: `linear-gradient(180deg, ${C.teal}, ${C.sky})`, ...num }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </Glass>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie">
      <Glass className="flex items-center gap-1 overflow-x-auto p-1.5" tint="rgba(255,255,255,0.4)">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-1 focus-visible:ring-offset-white motion-reduce:transition-none"
              style={
                on
                  ? {
                      color: "#fff",
                      background: `linear-gradient(180deg, ${C.sky}, ${C.skyDeep})`,
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px -4px rgba(37,99,235,0.6)",
                      ...bodyFont,
                    }
                  : { color: C.inkMute, background: "transparent", ...bodyFont }
              }
            >
              {s.label}
            </button>
          );
        })}
      </Glass>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-5 pt-1">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Voorste, helderste glaslaag */}
        <Glass className="p-7 md:p-9" tint="rgba(255,255,255,0.62)">
          <Eyebrow>Vandaag</Eyebrow>
          <h1 className="mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[40px]">
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je overzicht ligt in heldere lagen voor je klaar. Alles wat telt schemert door het glas
            — duik in de laag die nu je aandacht vraagt.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <GlassButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </GlassButton>
            <GhostGlass onClick={onOpen}>Marktplaats</GhostGlass>
          </div>
        </Glass>

        {/* Diepere, getinte laag met verschoven offset */}
        <Glass className="flex flex-col p-6" tint="rgba(219,231,255,0.55)">
          <div className="flex items-center justify-between">
            <Eyebrow tone={C.amber}>Vraagt aandacht</Eyebrow>
            <ShieldAlert size={17} aria-hidden="true" style={{ color: C.amber }} />
          </div>
          <h2 className="mt-3 text-[17px] font-semibold leading-snug">{primair.titel}</h2>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-auto pt-5">
            <GlassButton onClick={onActies} full>
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </GlassButton>
          </div>
          <p
            className="mt-4 flex items-center gap-2 pt-4 text-[12px]"
            style={{ color: C.inkMute, borderTop: `1px solid ${C.glassLine}` }}
          >
            <Check size={13} aria-hidden="true" style={{ color: C.emerald }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · 7 open reacties
          </p>
        </Glass>
      </section>

      <section>
        <div className="mb-3">
          <Eyebrow tone={C.teal}>Deze maand</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = k.up ? C.emerald : C.amber;
            const Trend = k.up ? TrendingUp : TrendingDown;
            return (
              <Glass key={k.label} className="p-5" tint="rgba(255,255,255,0.5)">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium" style={{ color: C.inkMute }}>
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold"
                    style={{ color: tone, ...num }}
                  >
                    <Trend size={11} aria-hidden="true" /> {trendNumber(k.trend)}
                  </span>
                </div>
                <p
                  className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.02em]"
                  style={num}
                >
                  {k.value}
                </p>
                <div className="mt-3">
                  <GlassSpark data={k.spark} id={`k462-${i}`} tone={tone} />
                </div>
              </Glass>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>Passende opdrachten</Eyebrow>
            <button
              type="button"
              onClick={onOpen}
              className="text-[11.5px] font-semibold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3fc]"
              style={{ color: C.sky }}
            >
              Alles →
            </button>
          </div>
          <Glass tint="rgba(255,255,255,0.5)">
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glassLine}` }}>
                  <button
                    type="button"
                    onClick={onOpen}
                    className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563eb] motion-reduce:transition-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{o.titel}</span>
                      <span
                        className="mt-0.5 block truncate text-[11.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <span
                      className="inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1"
                      style={{ background: "rgba(37,99,235,0.1)", color: C.skyDeep }}
                    >
                      <span className="text-[13px] font-semibold" style={num}>
                        {o.match}
                      </span>
                      <span className="text-[9px] font-semibold">%</span>
                    </span>
                    <ChevronRight
                      size={17}
                      aria-hidden="true"
                      className="shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      style={{ color: C.inkFaint }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Glass>
        </div>

        <div>
          <div className="mb-3">
            <Eyebrow tone={C.emerald}>Certificaten</Eyebrow>
          </div>
          <Glass className="p-4" tint="rgba(255,255,255,0.5)">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-1 py-2.5"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.glassLine}` }}
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: `${st.tone}1f`, color: st.tone }}
                      aria-hidden="true"
                    >
                      <st.Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold">{c.naam}</span>
                      <span className="block truncate text-[10.5px]" style={{ color: C.inkMute }}>
                        {st.label}
                      </span>
                    </span>
                    {st.alarm && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: st.tone }}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Glass>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(needle) ||
        o.plaats.toLowerCase().includes(needle) ||
        o.opdrachtgever.toLowerCase().includes(needle),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5 pt-1">
      <div>
        <Eyebrow>Marktplaats</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten in beeld
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Glass
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          tint="rgba(255,255,255,0.55)"
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8b98ad]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </Glass>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostGlass
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostGlass>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Glass className="p-6" tint="rgba(255,255,255,0.55)">
          <div className="flex flex-col items-center py-14 text-center">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(37,99,235,0.1)", color: C.sky }}
              aria-hidden="true"
            >
              <Search size={22} />
            </span>
            <p className="mt-5 text-[19px] font-semibold">Geen laag gevonden</p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft }}>
              Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm en probeer
              opnieuw.
            </p>
            <div className="mt-6">
              <GlassButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={14} aria-hidden="true" />
              </GlassButton>
            </div>
          </div>
        </Glass>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktKaart({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Glass tint="rgba(255,255,255,0.55)">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-5">
        <div className="min-w-0">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id} · laag {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug">{opdracht.titel}</h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-medium"
                style={{
                  color: C.inkSoft,
                  background: "rgba(255,255,255,0.6)",
                  border: `1px solid ${C.glassLine}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="inline-flex items-baseline gap-1 rounded-2xl px-3 py-2"
            style={{
              background: "linear-gradient(180deg, rgba(37,99,235,0.14), rgba(37,99,235,0.06))",
              border: "1px solid rgba(37,99,235,0.28)",
            }}
          >
            <span
              className="text-[18px] font-semibold leading-none"
              style={{ color: C.skyDeep, ...num }}
            >
              {opdracht.match}
            </span>
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: C.skyDeep }}
            >
              match
            </span>
          </span>
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 px-5 pb-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          style={{ color: C.inkSoft }}
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
          Waarom deze match
        </button>
        <div className="ml-auto">
          <GlassButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </GlassButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
            <RedenBlok
              titel="Voor jou"
              items={opdracht.redenen.plus}
              tone={C.emerald}
              Icon={Check}
            />
            <RedenBlok
              titel="Let op"
              items={opdracht.redenen.min}
              tone={C.amber}
              Icon={ShieldAlert}
            />
          </div>
        </div>
      </div>
    </Glass>
  );
}

function RedenBlok({
  titel,
  items,
  tone,
  Icon,
}: {
  titel: string;
  items: string[];
  tone: string;
  Icon: LucideIcon;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.5)",
        border: `1px solid ${C.glassLine}`,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-5 pt-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef3fc]"
        style={{
          color: C.inkSoft,
          background: "rgba(255,255,255,0.6)",
          border: `1px solid ${C.glassLine}`,
        }}
      >
        <ArrowRight size={13} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Glass className="p-7 md:p-9" tint="rgba(255,255,255,0.62)">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
            style={{ background: `linear-gradient(180deg, ${C.sky}, ${C.skyDeep})` }}
          >
            <Sparkles size={11} aria-hidden="true" /> {opdracht.match}% match
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[36px]">
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.inkSoft }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <GlassButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </GlassButton>
          <GhostGlass>Bewaren</GhostGlass>
        </div>
      </Glass>

      <Glass tint="rgba(255,255,255,0.5)">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { l: "Tarief", v: opdracht.tarief },
            { l: "Omvang", v: opdracht.uren },
            { l: "Start", v: opdracht.start },
            { l: "Match", v: `${opdracht.match}%` },
          ].map((m, i) => (
            <div
              key={m.l}
              className="p-5"
              style={{
                borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.glassLine}`,
                borderTop: i >= 2 ? `1px solid ${C.glassLine}` : "none",
              }}
            >
              <Eyebrow tone={C.inkMute}>{m.l}</Eyebrow>
              <p className="mt-2 text-[17px] font-semibold tracking-[-0.01em]" style={num}>
                {m.v}
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <section>
        <Eyebrow>Verklaarbare matching</Eyebrow>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgewogen tegen je geverifieerde profiel — wat je meebrengt én waar de aandacht ligt,
          transparant door het glas heen.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Glass className="p-6" tint="rgba(224,247,240,0.5)">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.emerald }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.emerald }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
          <Glass className="p-6" tint="rgba(255,244,224,0.5)">
            <p
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <ShieldAlert size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <ShieldAlert
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Glass>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);

  return (
    <div className="space-y-5 pt-1">
      <Glass className="p-7 md:p-9" tint="rgba(255,255,255,0.6)">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Eyebrow>Verificatie</Eyebrow>
            <h1 className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.02em]">
              Jouw certificaten
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              <span className="font-semibold" style={{ color: C.emerald }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort. Documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="inline-flex h-24 w-24 flex-col items-center justify-center rounded-full text-white"
            style={{
              background: `linear-gradient(180deg, ${C.emerald}, ${C.teal})`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <span className="text-[28px] font-semibold leading-none" style={num}>
              {ratio}
            </span>
            <span className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.16em]">
              % op orde
            </span>
          </span>
        </div>
      </Glass>

      <Glass tint="rgba(255,255,255,0.5)">
        <ul>
          {CREDENTIALS.map((c, idx) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li
                key={c.naam}
                style={{ borderTop: idx === 0 ? "none" : `1px solid ${C.glassLine}` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563eb] motion-reduce:transition-none sm:px-6"
                >
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `${st.tone}1f`, color: st.tone }}
                    aria-hidden="true"
                  >
                    <st.Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{c.naam}</span>
                    <span
                      className="mt-0.5 block truncate text-[11.5px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex"
                    style={{
                      color: st.tone,
                      background: `${st.tone}1a`,
                      border: `1px solid ${st.tone}40`,
                    }}
                  >
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{ color: C.inkFaint, transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:pl-[80px]">
                      <div
                        className="rounded-2xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: `1px solid ${C.glassLine}`,
                        }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na jouw
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <GlassButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </GlassButton>
                          <GhostGlass>Historie</GhostGlass>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Glass>

      <div>
        <div className="mb-3">
          <Eyebrow tone={C.teal}>Documentenkast</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Glass
                key={d.naam}
                className="flex items-center gap-3 p-4"
                tint="rgba(255,255,255,0.5)"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "rgba(37,99,235,0.1)", color: C.sky }}
                  aria-hidden="true"
                >
                  <FileText size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{d.naam}</span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                  style={{
                    color: st.tone,
                    background: `${st.tone}1a`,
                    border: `1px solid ${st.tone}40`,
                  }}
                >
                  <st.Icon size={10} aria-hidden="true" />
                  {st.label}
                </span>
              </Glass>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-5 pt-1">
      <div>
        <Eyebrow>Acties</Eyebrow>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
          Wat nu aandacht vraagt
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Gestapeld op urgentie — de voorste laag eerst. Werk ze rustig van boven naar beneden weg.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.sky;
          return (
            <li key={a.titel}>
              <Glass
                className="p-5"
                tint={warn ? "rgba(255,244,224,0.55)" : "rgba(255,255,255,0.5)"}
              >
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-[14px] font-semibold text-white"
                    style={{ background: `linear-gradient(180deg, ${tone}, ${tone}cc)`, ...num }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{
                        color: tone,
                        background: `${tone}1a`,
                        border: `1px solid ${tone}40`,
                      }}
                    >
                      {warn ? "Urgent" : "Aanbevolen"}
                    </span>
                    <h2 className="mt-2 text-[17px] font-semibold leading-snug">{a.titel}</h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <GlassButton>
                      {a.cta}
                      <ArrowRight size={13} aria-hidden="true" />
                    </GlassButton>
                  </div>
                </div>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurMeta(status: string): { Icon: LucideIcon; tone: string } {
  if (status === "Openstaand") return { Icon: Clock, tone: C.amber };
  if (status === "Betaald") return { Icon: Check, tone: C.emerald };
  return { Icon: FileText, tone: C.inkMute };
}

function Facturen() {
  return (
    <div className="space-y-5 pt-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Facturen</Eyebrow>
          <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.02em]">
            Overzicht
          </h1>
        </div>
        <GlassButton>Nieuwe factuur</GlassButton>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            l: "Voldaan",
            v: "€ 8.622",
            sub: "3 facturen",
            tone: C.emerald,
            tint: "rgba(224,247,240,0.55)",
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            tone: C.amber,
            tint: "rgba(255,244,224,0.6)",
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            tone: C.inkMute,
            tint: "rgba(255,255,255,0.5)",
          },
        ].map((s) => (
          <Glass key={s.l} className="p-5" tint={s.tint}>
            <Eyebrow tone={s.tone}>{s.l}</Eyebrow>
            <p
              className="mt-2 text-[24px] font-semibold tracking-[-0.02em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Glass>
        ))}
      </section>

      <Glass tint="rgba(255,255,255,0.5)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.glassLine}` }}>
                {[
                  { h: "Nummer", a: "left" },
                  { h: "Klant", a: "left" },
                  { h: "Datum", a: "left" },
                  { h: "Status", a: "left" },
                  { h: "Bedrag", a: "right" },
                ].map((c) => (
                  <th
                    key={c.h}
                    scope="col"
                    className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkFaint, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const fm = factuurMeta(f.status);
                return (
                  <tr
                    key={f.nr}
                    className="transition-colors hover:bg-white/40"
                    style={{ borderTop: `1px solid ${C.glassLine}` }}
                  >
                    <td
                      className="px-5 py-3.5 text-[11.5px] font-medium"
                      style={{ color: C.inkMute, ...num }}
                    >
                      {f.nr}
                    </td>
                    <td className="px-5 py-3.5 text-[13.5px] font-semibold">{f.klant}</td>
                    <td className="px-5 py-3.5 text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                        style={{
                          color: fm.tone,
                          background: `${fm.tone}1a`,
                          border: `1px solid ${fm.tone}40`,
                        }}
                      >
                        <fm.Icon size={11} aria-hidden="true" />
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13.5px] font-semibold"
                      style={{ color: fm.tone, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  );
}
