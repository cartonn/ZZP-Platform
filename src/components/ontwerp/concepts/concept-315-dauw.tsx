"use client";

// Concept 315 — "Dauw" · Ultra-kalme ochtenddauw-interface. Koel-fris mint/aqua glas met
// condens-achtige frosted kaarten, een fijne highlight-rand (druppel-glans), heel veel lucht en
// lage prikkeling — maar fris i.p.v. lavendel-zacht. Motief: dauwdruppels & condens op glas,
// zacht koel verloop. Fonts: Sora (kop) + Plus Jakarta Sans (tekst) + JetBrains Mono (cijfers).
// Micro-interactie: kaarten lichten bij hover op met een subtiele druppel-glans; tabs glijden zacht.
// Licht thema — onderscheidend van bestaande kalme concepten door het koel-frisse aqua/mint-palet
// en het condens/druppel-idioom (frosted highlight-randen, waterdruppel-badges).

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  Droplets,
  MapPin,
  Sparkles,
  FileText,
  Sunrise,
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
  BERICHTEN,
  NAV,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  // Koel-fris ochtenddauw-palet
  ink: "#0f2f2c", // diep teal-inkt (tekst)
  sub: "#4a706b", // gedempt teal
  faint: "#8aa8a3",
  mint: "#1fb89a", // fris mint-emerald (accent)
  aqua: "#2bb3c9", // koel aqua
  deep: "#0e8f86", // dieper teal-accent
  amber: "#c98a2b", // warme waarschuwing (ingetogen)
  rose: "#c05a5a", // afwijzing
  glassBorder: "rgba(255,255,255,0.7)",
  hairline: "rgba(31,184,154,0.18)",
  hairSoft: "rgba(15,47,44,0.08)",
};

const head = { fontFamily: "var(--font-lab-sora)" };
const body = { fontFamily: "var(--font-lab-jakarta)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Koel dauw-verloop met zachte "condens"-vlekken.
const dewBg =
  "radial-gradient(120% 90% at 0% 0%, rgba(43,179,201,0.16), transparent 45%)," +
  "radial-gradient(110% 80% at 100% 0%, rgba(31,184,154,0.14), transparent 42%)," +
  "radial-gradient(130% 100% at 50% 120%, rgba(43,179,201,0.10), transparent 55%)," +
  "linear-gradient(180deg, #eef8f6, #e6f4f3 55%, #eaf7f6)";

// Frosted glas-kaart met condens-highlight en fijne rand.
function Glass({
  children,
  className = "",
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58))",
        border: `1px solid ${tone ? `${tone}40` : C.glassBorder}`,
        boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 10px 30px -18px rgba(15,47,44,0.35)${tone ? `, 0 0 0 1px ${tone}14` : ""}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* condens-highlight bovenrand */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.mint, soft: "rgba(31,184,154,0.12)" };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.aqua, soft: "rgba(43,179,201,0.12)" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.amber,
        soft: "rgba(201,138,43,0.13)",
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, soft: "rgba(192,90,90,0.12)" };
  }
}

// Zachte sparkline met koel verloop + druppel-eindpunt.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / span) * 100;
    return { x, y };
  });
  const pts = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1] as { x: number; y: number };
  const id = `dew-${tone.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-9 w-full" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={tone} stopOpacity="0" />
          <stop offset="100%" stopColor={tone} stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts} 100,100`} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last.x} cy={last.y} r={2.6} fill={tone} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Match-meter als koele druppel-ring.
function DewRing({
  value,
  tone = C.mint,
  size = 60,
}: {
  value: number;
  tone?: string;
  size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (value / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,47,44,0.08)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular-nums leading-none"
          style={{ ...mono, fontSize: size * 0.28, color: C.ink }}
        >
          {value}
        </span>
        <span
          className="text-[8px] uppercase tracking-[0.18em]"
          style={{ ...body, color: C.faint }}
        >
          match
        </span>
      </div>
    </div>
  );
}

function Eyebrow({ children, tone = C.deep }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{ ...body, color: tone }}
    >
      <Droplets size={12} strokeWidth={2.2} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Concept315() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: dewBg, color: C.ink }}
    >
      <style>{`
        @keyframes dw-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes dw-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      `}</style>

      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-9 md:px-10">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(160deg, rgba(31,184,154,0.9), rgba(43,179,201,0.9))",
              color: "#fff",
              boxShadow: "0 8px 20px -8px rgba(31,184,154,0.6)",
            }}
            aria-hidden="true"
          >
            <Sunrise size={19} strokeWidth={2} />
          </span>
          <div className="leading-none">
            <div
              className="text-[18px] font-semibold tracking-tight"
              style={{ ...head, color: C.ink }}
            >
              Dauw
            </div>
            <div className="mt-1 text-[11px]" style={{ color: C.sub }}>
              ZZP · Fris overzicht
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </div>
            <div className="text-[11px]" style={{ color: C.sub }}>
              {PROFIEL.plaats}
            </div>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.7)",
              color: C.deep,
              border: `1px solid ${C.glassBorder}`,
            }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </header>

      {/* Tabs — glazen pillen */}
      <nav
        className="mx-auto mt-7 flex max-w-5xl items-center gap-1.5 overflow-x-auto px-5 pb-5 md:px-10"
        aria-label="Hoofdnavigatie"
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                ...body,
                color: on ? "#fff" : C.sub,
                background: on
                  ? "linear-gradient(160deg, #1fb89a, #2bb3c9)"
                  : "rgba(255,255,255,0.55)",
                border: `1px solid ${on ? "transparent" : C.glassBorder}`,
                boxShadow: on ? "0 8px 18px -10px rgba(31,184,154,0.7)" : "none",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-11">
        {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
        {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
        {screen === "opdracht" && (
          <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
        )}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>

      {/* Footer — NAV */}
      <footer className="mx-auto max-w-5xl px-5 pb-10 md:px-10">
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5"
          style={{ borderColor: C.hairSoft }}
        >
          {NAV.map((n) => (
            <span key={n} className="text-[11px] font-medium" style={{ color: C.faint }}>
              {n}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(15,47,44,0.05) 25%, rgba(15,47,44,0.1) 37%, rgba(15,47,44,0.05) 63%)",
        backgroundSize: "400% 100%",
        animation: "dw-shimmer 1.5s ease infinite",
      }}
    />
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const tones = [C.mint, C.aqua, C.deep, C.aqua];
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-9">
      <section>
        <Eyebrow>Vandaag · {PROFIEL.plaats}</Eyebrow>
        <h1
          className="mt-3 text-[30px] font-semibold leading-tight tracking-tight sm:text-[38px]"
          style={{ ...head, color: C.ink }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed" style={{ color: C.sub }}>
          Een frisse start. Eén ding vraagt vandaag je aandacht — de rest ligt er kalm en op groen
          bij.
        </p>
      </section>

      {/* Primaire actie */}
      <Glass tone={C.amber} className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" /> Vraagt aandacht
            </div>
            <h2
              className="mt-2.5 text-[20px] font-semibold leading-snug tracking-tight sm:text-[22px]"
              style={{ ...head, color: C.ink }}
            >
              {primair.titel}
            </h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
              {primair.detail}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="group inline-flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold text-white transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
            style={{
              background: "linear-gradient(160deg, #c98a2b, #b57a24)",
              boxShadow: "0 10px 22px -12px rgba(201,138,43,0.8)",
            }}
          >
            {primair.cta}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Glass>

      {/* KPI's */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Vandaag in cijfers
          </h2>
          <Eyebrow tone={C.mint}>Overzicht</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Glass key={i} className="p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </Glass>
              ))
            : KPIS.map((k, i) => {
                const tone = tones[i % tones.length] as string;
                return (
                  <Glass
                    key={k.label}
                    className="group p-5 transition-all hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-medium" style={{ color: C.sub }}>
                        {k.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                        style={{
                          ...mono,
                          color: k.up ? C.deep : C.amber,
                          background: k.up ? "rgba(31,184,154,0.1)" : "rgba(201,138,43,0.12)",
                        }}
                      >
                        {k.up ? "↑" : "↓"} {k.trend}
                      </span>
                    </div>
                    <div
                      className="mt-3 tabular-nums"
                      style={{ ...mono, fontSize: 26, color: C.ink }}
                    >
                      {k.value}
                    </div>
                    <div className="mt-2">
                      <Spark data={k.spark} tone={tone} />
                    </div>
                  </Glass>
                );
              })}
        </div>
      </section>

      {/* Top-match */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Beste match voor jou
          </h2>
          <Eyebrow>Voor jou</Eyebrow>
        </div>
        <button
          onClick={onOpen}
          className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Glass
            tone={C.mint}
            className="flex flex-col gap-5 p-5 transition-all group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center"
          >
            <DewRing value={top.match} tone={C.mint} size={68} />
            <div className="min-w-0 flex-1">
              <h3
                className="text-[18px] font-semibold leading-snug tracking-tight"
                style={{ ...head, color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
                <MapPin size={13} aria-hidden="true" /> {top.opdrachtgever} · {top.plaats} ·{" "}
                {top.tarief}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ background: "rgba(31,184,154,0.1)", color: C.deep }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight
              size={20}
              className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 md:block"
              style={{ color: C.mint }}
              aria-hidden="true"
            />
          </Glass>
        </button>
      </section>

      {/* Berichten */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Recente berichten
          </h2>
          <Eyebrow tone={C.aqua}>Postvak</Eyebrow>
        </div>
        <Glass className="p-2">
          <ul>
            {BERICHTEN.map((m, i) => (
              <li
                key={m.van}
                className="flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-white/60"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ background: "rgba(43,179,201,0.12)", color: C.deep }}
                  aria-hidden="true"
                >
                  {m.initialen}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
                      {m.van}
                    </span>
                    {m.ongelezen && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: C.mint }}
                        aria-label="Ongelezen"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px]" style={{ color: C.sub }}>
                    {m.preview}
                  </p>
                </div>
                <span
                  className="shrink-0 text-[11px] tabular-nums"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.tijd}
                </span>
              </li>
            ))}
          </ul>
        </Glass>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const allTags = Array.from(new Set(OPDRACHTEN.flatMap((o) => o.tags)));
  const filtered = OPDRACHTEN.filter((o) => {
    const matchQ =
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase());
    const matchTag = !tag || o.tags.includes(tag);
    return matchQ && matchTag;
  });

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight" style={{ ...head, color: C.ink }}>
          Marktplaats
        </h2>
        <Eyebrow tone={C.mint}>{String(filtered.length).padStart(2, "0")} open</Eyebrow>
      </div>

      <Glass className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.faint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...body, color: C.ink }}
        />
      </Glass>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter op specialisatie">
        <FilterChip label="Alles" active={tag === null} onClick={() => setTag(null)} />
        {allTags.map((t) => (
          <FilterChip
            key={t}
            label={t}
            active={tag === t}
            onClick={() => setTag(tag === t ? null : t)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <Glass className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgba(43,179,201,0.12)" }}
          >
            <Search size={22} style={{ color: C.aqua }} aria-hidden="true" />
          </span>
          <p className="text-[17px] font-semibold" style={{ ...head, color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13.5px]" style={{ color: C.sub }}>
            Niets past bij deze filters. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => {
              setQ("");
              setTag(null);
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ background: "linear-gradient(160deg, #1fb89a, #2bb3c9)" }}
          >
            Filters wissen
          </button>
        </Glass>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <Glass className="flex flex-col gap-4 p-5 transition-all group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 sm:flex-row sm:items-center">
                  <DewRing value={o.match} tone={o.match >= 85 ? C.mint : C.aqua} size={58} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
                      {o.id}
                    </span>
                    <h3
                      className="mt-0.5 text-[17px] font-semibold leading-snug tracking-tight"
                      style={{ ...head, color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div
                      className="mt-0.5 flex items-center gap-1.5 text-[13px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats} ·{" "}
                      {o.tarief}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                          style={{ background: "rgba(31,184,154,0.1)", color: C.deep }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="hidden shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 sm:block"
                    style={{ color: C.mint }}
                    aria-hidden="true"
                  />
                </Glass>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        ...body,
        color: active ? "#fff" : C.sub,
        background: active ? "linear-gradient(160deg, #1fb89a, #2bb3c9)" : "rgba(255,255,255,0.6)",
        border: `1px solid ${active ? "transparent" : C.glassBorder}`,
      }}
    >
      {label}
    </button>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ color: C.sub }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Glass tone={C.mint} className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.faint }}>
              {opdracht.id}
            </span>
            <h1
              className="mt-1.5 max-w-xl text-[24px] font-semibold leading-snug tracking-tight sm:text-[28px]"
              style={{ ...head, color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.sub }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <DewRing value={opdracht.match} tone={C.mint} size={80} />
        </div>
      </Glass>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Glass key={m.l} className="p-4">
            <div className="text-[11px] font-medium" style={{ color: C.sub }}>
              {m.l}
            </div>
            <div className="mt-2 tabular-nums" style={{ ...mono, fontSize: 17, color: C.ink }}>
              {m.v}
            </div>
          </Glass>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Glass tone={C.mint} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.deep }}
          >
            <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" /> Wat past
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.plus.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(31,184,154,0.15)" }}
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3} style={{ color: C.mint }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Glass>
        <Glass tone={C.amber} className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" /> Aandacht
          </div>
          <ul className="mt-4 space-y-3">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 text-[13.5px] leading-snug"
                style={{ color: C.ink }}
              >
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(201,138,43,0.15)" }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={10} strokeWidth={3} style={{ color: C.amber }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2.5"
          style={{
            background: "linear-gradient(160deg, #1fb89a, #2bb3c9)",
            boxShadow: "0 12px 26px -14px rgba(31,184,154,0.8)",
          }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: `1px solid ${C.glassBorder}`,
            color: C.ink,
          }}
        >
          Bewaar voor later
        </button>
      </div>
    </div>
  );
}

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight" style={{ ...head, color: C.ink }}>
          Verificatie
        </h2>
        <Eyebrow tone={C.mint}>Vertrouwen</Eyebrow>
      </div>

      <Glass tone={C.mint} className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <DewRing value={pct} tone={C.mint} size={80} />
        <div className="sm:border-l sm:pl-6" style={{ borderColor: C.hairSoft }}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.deep }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            {verified} van {CREDENTIALS.length} credentials zijn geverifieerd. Eén verloopt
            binnenkort — vernieuw op tijd zodat je profiel fris en verifieerbaar blijft.
          </p>
        </div>
      </Glass>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          return (
            <li key={c.naam}>
              <Glass
                className="flex items-center gap-4 p-4"
                tone={c.status === "EXPIRING" ? C.amber : undefined}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: st.soft, color: st.tone }}
                  aria-hidden="true"
                >
                  <st.Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[14.5px] font-semibold leading-tight"
                    style={{ color: C.ink }}
                  >
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{ color: st.tone, background: st.soft }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </Glass>
            </li>
          );
        })}
      </ul>

      {/* Documenten */}
      <div className="pt-1">
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-[15px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Documenten
          </h3>
          <Eyebrow tone={C.aqua}>Privé kluis</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <Glass key={d.naam} className="flex items-center gap-3.5 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(43,179,201,0.1)", color: C.deep }}
                  aria-hidden="true"
                >
                  <FileText size={17} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {d.naam}
                  </div>
                  <div
                    className="mt-0.5 text-[11.5px] tabular-nums"
                    style={{ ...mono, color: C.faint }}
                  >
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                  style={{ color: st.tone, background: st.soft }}
                >
                  <st.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
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
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight" style={{ ...head, color: C.ink }}>
          Volgende acties
        </h2>
        <Eyebrow tone={C.amber}>Wat nu telt</Eyebrow>
      </div>

      {/* Error-toestand — presentatie-only */}
      <Glass tone={C.rose} className="flex items-start gap-3 p-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(192,90,90,0.12)" }}
          aria-hidden="true"
        >
          <XCircle size={17} style={{ color: C.rose }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
            Synchronisatie onderbroken
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
            De koppeling met je agenda liep vast. Eén actie kon niet worden bijgewerkt.
          </p>
        </div>
        <button
          className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ color: C.rose, background: "rgba(192,90,90,0.12)" }}
        >
          Opnieuw
        </button>
      </Glass>

      <ol className="space-y-3">
        {sorted.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.mint;
          const soft = warn ? "rgba(201,138,43,0.13)" : "rgba(31,184,154,0.12)";
          return (
            <li key={a.titel}>
              <Glass
                tone={warn ? C.amber : undefined}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums"
                  style={{ ...mono, background: soft, color: tone }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        strokeWidth={2.2}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[15.5px] font-semibold leading-tight tracking-tight"
                      style={{ ...head, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-full px-5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:self-center"
                  style={{
                    background: warn
                      ? "linear-gradient(160deg, #c98a2b, #b57a24)"
                      : "linear-gradient(160deg, #1fb89a, #2bb3c9)",
                  }}
                >
                  {a.cta}
                </button>
              </Glass>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const badge = (status: string): { tone: string; soft: string } => {
    if (status === "Betaald") return { tone: C.mint, soft: "rgba(31,184,154,0.12)" };
    if (status === "Openstaand") return { tone: C.amber, soft: "rgba(201,138,43,0.13)" };
    return { tone: C.faint, soft: "rgba(15,47,44,0.06)" };
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-[22px] font-semibold tracking-tight"
            style={{ ...head, color: C.ink }}
          >
            Facturen
          </h2>
          <div className="mt-2">
            <Eyebrow tone={C.mint}>Omzet</Eyebrow>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{
            background: "linear-gradient(160deg, #1fb89a, #2bb3c9)",
            boxShadow: "0 10px 22px -12px rgba(31,184,154,0.7)",
          }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <Glass className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hairline}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
                  style={{ color: C.sub }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const b = badge(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-white/50"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td
                    className="px-5 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.sub }}
                  >
                    {f.nr}
                  </td>
                  <td className="px-5 py-4 text-[14px] font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td
                    className="px-5 py-4 text-[12.5px] tabular-nums"
                    style={{ ...mono, color: C.sub }}
                  >
                    {f.datum}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ color: b.tone, background: b.soft }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: b.tone }}
                        aria-hidden="true"
                      />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="px-5 py-4 text-right text-[14px] tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.hairline}` }}>
              <td
                colSpan={4}
                className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.sub }}
              >
                Totaal betaald
              </td>
              <td
                className="px-5 py-4 text-right text-[16px] font-semibold tabular-nums"
                style={{ ...mono, color: C.deep }}
              >
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </Glass>
    </div>
  );
}
