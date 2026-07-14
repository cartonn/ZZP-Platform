"use client";

// Concept 316 — "Rekenkamer" · Premium fintech-grootboek (Mercury/Ramp-niveau). Diepgroen +
// inkt-zwart, strakke financiële rijen, tabulaire cijfers overal, kwitantie-precisie en ingetogen
// luxe. Het geheel voelt betrouwbaar en exact rond tarieven, omzet en facturen: grootboek-lijnen,
// dunne hairlines, rechts-uitgelijnde bedragen, een subtiel diepgroen paneel als accent.
// Fonts: Inter (tekst/kop) + JetBrains Mono (cijfers). Licht thema met diepgroen accent.
// Onderscheidend van eerdere beurs/ledger-concepten door de ingetogen, bank-achtige rust en de
// kwitantie-typografie ( crisp hairlines, tabulaire kolommen, geen ruis).

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
  Landmark,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
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
  paper: "#f6f7f4", // warm papier-wit
  card: "#ffffff",
  ink: "#0d1512", // inkt-zwart met groene ondertoon
  sub: "#5a6b63",
  faint: "#93a29a",
  green: "#0f5c3f", // diepgroen (accent)
  greenSoft: "#e3efe8",
  greenLine: "rgba(15,92,63,0.16)",
  positive: "#137a4f",
  amber: "#a86a12", // ingetogen waarschuwing
  amberSoft: "#f6edda",
  rose: "#a83a3a",
  roseSoft: "#f6e2e0",
  hairline: "rgba(13,21,18,0.09)",
  hairSoft: "rgba(13,21,18,0.055)",
};

const ui = { fontFamily: "var(--font-lab-inter)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tone: C.green, soft: C.greenSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tone: C.sub, soft: "#eceeeb" };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        tone: C.amber,
        soft: C.amberSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, tone: C.rose, soft: C.roseSoft };
  }
}

// Grootboek-kaart met dunne rand en scherpe hoeken (kwitantie-gevoel).
function Ledger({
  children,
  className = "",
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${accent ? C.greenLine : C.hairline}`,
        boxShadow: "0 1px 2px rgba(13,21,18,0.04)",
      }}
    >
      {children}
    </div>
  );
}

// Sparkline — strak, dun, financieel.
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / span) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Match als dunne meter-balk met tabulair percentage.
function MatchBar({ value, tone = C.green }: { value: number; tone?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 w-24 overflow-hidden rounded-full"
        style={{ background: C.hairSoft }}
        aria-hidden="true"
      >
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: tone }} />
      </div>
      <span
        className="tabular-nums"
        style={{ ...mono, fontSize: 13, fontWeight: 600, color: C.ink }}
      >
        {value}%
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]"
      style={{ ...ui, color: C.green }}
    >
      <span className="h-3 w-px" style={{ background: C.green }} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Concept316() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...ui, background: C.paper, color: C.ink }}
    >
      <style>{`
        @keyframes rk-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Header — bank-achtig, diepgroen paneel-accent */}
      <header className="border-b" style={{ borderColor: C.hairline, background: C.card }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: C.green, color: "#fff" }}
              aria-hidden="true"
            >
              <Landmark size={18} strokeWidth={2} />
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
                Rekenkamer
              </div>
              <div className="mt-1 text-[11px]" style={{ color: C.sub }}>
                ZZP · Grootboek
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
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[12px] font-semibold"
              style={{ background: C.greenSoft, color: C.green }}
              aria-hidden="true"
            >
              {PROFIEL.initialen}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs — onderstreepte grootboek-tabs */}
      <nav
        className="border-b"
        style={{ borderColor: C.hairline, background: C.card }}
        aria-label="Hoofdnavigatie"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-5 md:px-10">
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="relative shrink-0 px-3.5 py-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{ ...ui, color: on ? C.green : C.sub }}
              >
                {s.label}
                <span
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity"
                  style={{ background: C.green, opacity: on ? 1 : 0 }}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-5 py-8 md:px-10 md:py-10">
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
      <footer className="border-t" style={{ borderColor: C.hairline, background: C.card }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-5 md:px-10">
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
      className={`rounded ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(13,21,18,0.05) 25%, rgba(13,21,18,0.09) 37%, rgba(13,21,18,0.05) 63%)",
        backgroundSize: "400% 100%",
        animation: "rk-shimmer 1.5s ease infinite",
      }}
    />
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const top = OPDRACHTEN[0] as Opdracht;
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Boekjaar 2025 · {PROFIEL.plaats}</Eyebrow>
          <h1
            className="mt-2.5 text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]"
            style={{ color: C.ink }}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            Je grootboek is bijgewerkt. Eén post vraagt vandaag actie; de balans staat verder in
            orde.
          </p>
        </div>
      </section>

      {/* Balans-paneel — diepgroen accent */}
      <div
        className="grid grid-cols-1 gap-px overflow-hidden rounded-lg sm:grid-cols-3"
        style={{ background: C.hairline, border: `1px solid ${C.greenLine}` }}
      >
        {[
          { l: "Omzet deze maand", v: "€ 8.240", d: "+12% t.o.v. mei", up: true },
          { l: "Openstaand", v: "€ 1.350", d: "1 factuur · 9 dagen", up: false },
          { l: "Uurtarief (gem.)", v: "€ 58", d: "boven je ondergrens", up: true },
        ].map((m, i) => (
          <div key={m.l} className="p-5" style={{ background: i === 0 ? C.green : C.card }}>
            <div
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: i === 0 ? "rgba(255,255,255,0.75)" : C.sub }}
            >
              {m.l}
            </div>
            <div
              className="mt-2 tabular-nums"
              style={{ ...mono, fontSize: 26, fontWeight: 600, color: i === 0 ? "#fff" : C.ink }}
            >
              {m.v}
            </div>
            <div
              className="mt-1.5 inline-flex items-center gap-1 text-[12px]"
              style={{ color: i === 0 ? "rgba(255,255,255,0.85)" : m.up ? C.positive : C.amber }}
            >
              {m.up ? (
                <ArrowUpRight size={13} aria-hidden="true" />
              ) : (
                <ArrowDownRight size={13} aria-hidden="true" />
              )}
              {m.d}
            </div>
          </div>
        ))}
      </div>

      {/* Primaire actie */}
      <Ledger
        accent
        className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: C.amberSoft, color: C.amber }}
            aria-hidden="true"
          >
            <AlertTriangle size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold leading-snug" style={{ color: C.ink }}>
              {primair.titel}
            </h2>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: C.sub }}>
              {primair.detail}
            </p>
          </div>
        </div>
        <button
          onClick={onOpen}
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2 sm:self-center"
          style={{ background: C.green }}
        >
          {primair.cta}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </Ledger>

      {/* KPI's */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: C.ink }}>
            Kerncijfers
          </h2>
          <Eyebrow>Overzicht</Eyebrow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Ledger key={i} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </Ledger>
              ))
            : KPIS.map((k) => (
                <Ledger
                  key={k.label}
                  className="p-4 transition-shadow hover:shadow-[0_2px_10px_rgba(13,21,18,0.07)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-medium" style={{ color: C.sub }}>
                      {k.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                      style={{ ...mono, color: k.up ? C.positive : C.amber }}
                    >
                      {k.up ? (
                        <ArrowUpRight size={12} aria-hidden="true" />
                      ) : (
                        <ArrowDownRight size={12} aria-hidden="true" />
                      )}
                      {k.trend}
                    </span>
                  </div>
                  <div
                    className="mt-2.5 tabular-nums"
                    style={{ ...mono, fontSize: 24, fontWeight: 600, color: C.ink }}
                  >
                    {k.value}
                  </div>
                  <div className="mt-2">
                    <Spark data={k.spark} tone={k.up ? C.green : C.amber} />
                  </div>
                </Ledger>
              ))}
        </div>
      </section>

      {/* Top-match + berichten in twee kolommen */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: C.ink }}>
              Beste match
            </h2>
            <Eyebrow>Voor jou</Eyebrow>
          </div>
          <button
            onClick={onOpen}
            className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <Ledger
              accent
              className="p-5 transition-shadow group-hover:shadow-[0_2px_12px_rgba(13,21,18,0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] tabular-nums" style={{ ...mono, color: C.faint }}>
                  {top.id}
                </span>
                <MatchBar value={top.match} />
              </div>
              <h3
                className="mt-3 text-[17px] font-semibold leading-snug tracking-tight"
                style={{ color: C.ink }}
              >
                {top.titel}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: C.sub }}>
                <MapPin size={13} aria-hidden="true" /> {top.opdrachtgever} · {top.plaats}
              </div>
              <div
                className="mt-3 flex items-center justify-between border-t pt-3"
                style={{ borderColor: C.hairSoft }}
              >
                <span
                  className="tabular-nums"
                  style={{ ...mono, fontSize: 15, fontWeight: 600, color: C.green }}
                >
                  {top.tarief}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[13px] font-semibold"
                  style={{ color: C.green }}
                >
                  Bekijk opdracht{" "}
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Ledger>
          </button>
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: C.ink }}>
              Berichten
            </h2>
            <Eyebrow>Postvak</Eyebrow>
          </div>
          <Ledger>
            <ul>
              {BERICHTEN.map((m, i) => (
                <li
                  key={m.van}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
                    style={{ background: C.greenSoft, color: C.green }}
                    aria-hidden="true"
                  >
                    {m.initialen}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="truncate text-[12.5px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {m.van}
                      </span>
                      {m.ongelezen && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: C.green }}
                          aria-label="Ongelezen"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px]" style={{ color: C.sub }}>
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
          </Ledger>
        </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>
          Marktplaats
        </h2>
        <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.sub }}>
          {String(filtered.length).padStart(2, "0")} open
        </span>
      </div>

      <Ledger className="flex items-center gap-3 px-4">
        <Search size={17} style={{ color: C.faint }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent py-3 text-[14px] outline-none placeholder:opacity-50"
          style={{ ...ui, color: C.ink }}
        />
      </Ledger>

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
        <Ledger className="flex flex-col items-center justify-center gap-3 p-14 text-center">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{ background: C.greenSoft }}
          >
            <Search size={20} style={{ color: C.green }} aria-hidden="true" />
          </span>
          <p className="text-[16px] font-semibold" style={{ color: C.ink }}>
            Geen opdrachten gevonden
          </p>
          <p className="max-w-xs text-[13px]" style={{ color: C.sub }}>
            Niets past bij deze filters. Verruim je zoekopdracht of beschikbaarheid.
          </p>
          <button
            onClick={() => {
              setQ("");
              setTag(null);
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ background: C.green }}
          >
            Filters wissen
          </button>
        </Ledger>
      ) : (
        <Ledger className="overflow-hidden">
          <ul>
            {filtered.map((o, i) => (
              <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}>
                <button
                  onClick={onOpen}
                  className="group flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-[rgba(15,92,63,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-0 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                    </div>
                    <h3
                      className="mt-0.5 text-[15px] font-semibold leading-snug tracking-tight"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </h3>
                    <div
                      className="mt-0.5 flex items-center gap-1.5 text-[12.5px]"
                      style={{ color: C.sub }}
                    >
                      <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: "#eef1ee", color: C.sub }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
                    <span
                      className="tabular-nums"
                      style={{ ...mono, fontSize: 15, fontWeight: 600, color: C.green }}
                    >
                      {o.tarief}
                    </span>
                    <MatchBar value={o.match} tone={o.match >= 85 ? C.green : C.amber} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Ledger>
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
      className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        ...ui,
        color: active ? "#fff" : C.sub,
        background: active ? C.green : C.card,
        border: `1px solid ${active ? "transparent" : C.hairline}`,
      }}
    >
      {label}
    </button>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12.5px] font-semibold transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ color: C.sub }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <Ledger accent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <span className="text-[12px] tabular-nums" style={{ ...mono, color: C.faint }}>
              {opdracht.id}
            </span>
            <h1
              className="mt-1.5 max-w-xl text-[23px] font-semibold leading-snug tracking-tight sm:text-[26px]"
              style={{ color: C.ink }}
            >
              {opdracht.titel}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.sub }}>
              <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-[11px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.sub }}
            >
              Matchscore
            </div>
            <div
              className="mt-1 tabular-nums"
              style={{ ...mono, fontSize: 34, fontWeight: 600, color: C.green }}
            >
              {opdracht.match}%
            </div>
          </div>
        </div>
      </Ledger>

      {/* Kwitantie-regels: feiten */}
      <Ledger className="overflow-hidden">
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Startdatum", v: opdracht.start },
          { l: "Specialisaties", v: opdracht.tags.join(" · ") },
        ].map((row, i) => (
          <div
            key={row.l}
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
          >
            <span className="text-[13px] font-medium" style={{ color: C.sub }}>
              {row.l}
            </span>
            <span
              className="text-right text-[13.5px] font-semibold tabular-nums"
              style={{ ...mono, color: C.ink }}
            >
              {row.v}
            </span>
          </div>
        ))}
      </Ledger>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Ledger accent className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.green }}
          >
            <Check size={14} strokeWidth={2.4} aria-hidden="true" /> Wat past
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
                  style={{ background: C.greenSoft }}
                  aria-hidden="true"
                >
                  <Check size={11} strokeWidth={3} style={{ color: C.green }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Ledger>
        <Ledger className="p-5">
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.amber }}
          >
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" /> Aandacht
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
                  style={{ background: C.amberSoft }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={10} strokeWidth={3} style={{ color: C.amber }} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </Ledger>
      </div>

      <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row">
        <button
          className="group inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-7 py-3 text-[14px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{ background: C.green }}
        >
          Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold transition-colors hover:bg-[rgba(13,21,18,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ border: `1px solid ${C.hairline}`, color: C.ink }}
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>
          Verificatie
        </h2>
        <Eyebrow>Vertrouwen</Eyebrow>
      </div>

      <Ledger accent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <div
            className="tabular-nums"
            style={{ ...mono, fontSize: 40, fontWeight: 600, color: C.green }}
          >
            {pct}%
          </div>
          <div
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: C.sub }}
          >
            gedekt
          </div>
        </div>
        <div className="sm:border-l sm:pl-6" style={{ borderColor: C.hairline }}>
          <div
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.green }}
          >
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" /> {PROFIEL.trust}
          </div>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed" style={{ color: C.sub }}>
            {verified} van {CREDENTIALS.length} credentials zijn geverifieerd. Eén verloopt
            binnenkort — vernieuw op tijd om verifieerbaar te blijven.
          </p>
        </div>
      </Ledger>

      <Ledger className="overflow-hidden">
        <ul>
          {CREDENTIALS.map((c, i) => {
            const st = statusMeta(c.status);
            return (
              <li
                key={c.naam}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}`,
                  background: c.status === "EXPIRING" ? "rgba(168,106,18,0.04)" : "transparent",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: st.soft, color: st.tone }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold leading-tight" style={{ color: C.ink }}>
                    {c.naam}
                  </div>
                  <div className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{ color: st.tone, background: st.soft }}
                >
                  <st.Icon size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span className="hidden sm:inline">{st.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Ledger>

      {/* Documenten */}
      <div className="pt-1">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold tracking-tight" style={{ color: C.ink }}>
            Documenten
          </h3>
          <Eyebrow>Privé kluis</Eyebrow>
        </div>
        <Ledger className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.hairline}` }}>
                {["Bestand", "Type", "Grootte", "Status", "Bijgewerkt"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: C.sub }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENTEN.map((d) => {
                const st = statusMeta(d.status);
                return (
                  <tr
                    key={d.naam}
                    className="transition-colors hover:bg-[rgba(15,92,63,0.03)]"
                    style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-2 text-[13px] font-medium"
                        style={{ color: C.ink }}
                      >
                        <FileText size={14} style={{ color: C.faint }} aria-hidden="true" />{" "}
                        {d.naam}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {d.type}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {d.grootte}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ color: st.tone, background: st.soft }}
                      >
                        <st.Icon size={11} strokeWidth={2.4} aria-hidden="true" />
                        <span className="hidden sm:inline">{st.label}</span>
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] tabular-nums"
                      style={{ ...mono, color: C.sub }}
                    >
                      {d.bijgewerkt}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Ledger>
      </div>
    </div>
  );
}

function Acties() {
  const sorted = [...ACTIES].sort((a, b) =>
    a.urgentie === b.urgentie ? 0 : a.urgentie === "warning" ? -1 : 1,
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>
          Volgende acties
        </h2>
        <Eyebrow>Wat nu telt</Eyebrow>
      </div>

      {/* Error-toestand — presentatie-only */}
      <Ledger className="flex items-start gap-3 p-4">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: C.roseSoft, color: C.rose }}
          aria-hidden="true"
        >
          <XCircle size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
            Synchronisatie onderbroken
          </div>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.sub }}>
            De koppeling met je boekhouding liep vast. Eén post kon niet worden bijgewerkt.
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ color: C.rose, background: C.roseSoft }}
        >
          Opnieuw
        </button>
      </Ledger>

      <Ledger className="overflow-hidden">
        <ol>
          {sorted.map((a, i) => {
            const warn = a.urgentie === "warning";
            const tone = warn ? C.amber : C.green;
            const soft = warn ? C.amberSoft : C.greenSoft;
            return (
              <li
                key={a.titel}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold tabular-nums"
                  style={{ ...mono, background: soft, color: tone }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {warn ? (
                      <AlertTriangle
                        size={13}
                        strokeWidth={2.4}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Check
                        size={13}
                        strokeWidth={2.6}
                        style={{ color: tone }}
                        aria-hidden="true"
                      />
                    )}
                    <h3
                      className="text-[14.5px] font-semibold leading-tight"
                      style={{ color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <span className="sr-only">{warn ? "Urgent" : "Informatief"}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                    {a.detail}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:self-center"
                  style={{
                    color: warn ? "#fff" : C.green,
                    background: warn ? C.amber : C.greenSoft,
                  }}
                >
                  {a.cta}
                </button>
              </li>
            );
          })}
        </ol>
      </Ledger>
    </div>
  );
}

function Facturen() {
  const total = "€ 8.622";
  const openstaand = "€ 1.350";
  const badge = (status: string): { tone: string; soft: string } => {
    if (status === "Betaald") return { tone: C.green, soft: C.greenSoft };
    if (status === "Openstaand") return { tone: C.amber, soft: C.amberSoft };
    return { tone: C.sub, soft: "#eceeeb" };
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight" style={{ color: C.ink }}>
            Facturen
          </h2>
          <div className="mt-2">
            <Eyebrow>Grootboek · debiteuren</Eyebrow>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:hover:gap-2"
          style={{ background: C.green }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      {/* Samenvatting — kwitantie-totalen */}
      <div
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg sm:grid-cols-3"
        style={{ background: C.hairline, border: `1px solid ${C.hairline}` }}
      >
        {[
          { l: "Betaald (mnd)", v: total, tone: C.green },
          { l: "Openstaand", v: openstaand, tone: C.amber },
          { l: "Concept", v: "€ 880", tone: C.sub },
        ].map((s) => (
          <div key={s.l} className="p-4" style={{ background: C.card }}>
            <div
              className="text-[11px] font-medium uppercase tracking-[0.1em]"
              style={{ color: C.sub }}
            >
              {s.l}
            </div>
            <div
              className="mt-1.5 tabular-nums"
              style={{ ...mono, fontSize: 20, fontWeight: 600, color: s.tone }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <Ledger className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hairline}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag", ""].map((h, i) => (
                <th
                  key={h || "actie"}
                  className={`px-5 py-3 text-[11px] font-medium uppercase tracking-[0.1em] ${i === 4 ? "text-right" : ""}`}
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
                  className="group transition-colors hover:bg-[rgba(15,92,63,0.03)]"
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
                    className="px-5 py-4 text-right text-[14px] font-semibold tabular-nums"
                    style={{ ...mono, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover:opacity-100"
                      style={{ color: C.sub, border: `1px solid ${C.hairline}` }}
                      aria-label={`Factuur ${f.nr} downloaden`}
                    >
                      <Download size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${C.hairline}`, background: C.greenSoft }}>
              <td
                colSpan={4}
                className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.green }}
              >
                Totaal betaald
              </td>
              <td
                className="px-5 py-4 text-right text-[16px] font-semibold tabular-nums"
                style={{ ...mono, color: C.green }}
              >
                {total}
              </td>
              <td aria-hidden="true" />
            </tr>
          </tfoot>
        </table>
      </Ledger>
    </div>
  );
}
