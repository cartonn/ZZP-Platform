"use client";

// Concept 465 — "Fluistering" · Ultra-quiet minimalism. Bijna onzichtbare chrome: geen kaders,
// alleen hairlines en ruimte; type-geleid met grote, rustige koppen en enorme whitespace. Eén
// ingetogen accent (gedempt indigo) op inkt-zwart. Vertrouwen via extreme rust en typografie.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Minus,
  Plus,
  Search,
  ShieldCheck,
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

// — Palet: inkt-zwart op warm wit, één gedempt indigo-accent —
const C = {
  bg: "#fbfbfa", // warm wit
  ink: "#171717", // inkt-zwart
  inkSoft: "#3c3c3b",
  inkMute: "#767674",
  inkFaint: "#a6a6a3",
  line: "#e7e6e3", // haast-onzichtbare hairline
  lineSoft: "#f0efec",
  accent: "#4b4f8f", // gedempt indigo
  accentSoft: "#ececf4",
  green: "#3f6b4f",
  amber: "#8a6a2c",
};

const bodyFont = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums" as const,
};
const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.green };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.accent };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, ink: C.amber };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, ink: "#8a3b3b" };
  }
}

// — Tekst-link met onderstreep-accent —
function TextLink({
  children,
  onClick,
  tone = C.ink,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] motion-reduce:transition-none ${className}`}
      style={{ color: tone, ...bodyFont }}
    >
      {children}
    </button>
  );
}

function QuietButton({
  children,
  onClick,
  primary = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] active:translate-y-px motion-reduce:transition-none ${className}`}
      style={
        primary
          ? { color: C.bg, background: C.ink, ...bodyFont }
          : { color: C.ink, background: "transparent", border: `1px solid ${C.line}`, ...bodyFont }
      }
    >
      {children}
    </button>
  );
}

// — Fijne spark-lijn, zeer subtiel —
function HairSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 28;
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d - min) / span) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={tone}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  );
}

export function Concept465() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...bodyFont, color: C.ink, background: C.bg }}
    >
      <style>{`
        @keyframes fluisterFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fluister-fade { animation: fluisterFade 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .fluister-fade { animation: none !important; } }
      `}</style>

      <div className="relative mx-auto max-w-5xl px-5 pb-28 sm:px-8 md:px-10">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="fluister-fade pt-10 sm:pt-14">
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
    <header className="flex items-center justify-between gap-4 pt-8">
      <div className="flex items-baseline gap-3">
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>
          Fluistering
        </span>
        <span className="hidden text-[12px] sm:inline" style={{ color: C.inkFaint }}>
          {PROFIEL.plaats}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 text-[12px] font-medium sm:inline-flex"
          style={{ color: C.green }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="text-[12px]"
          style={{ color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          {ongelezen} bericht{ongelezen === 1 ? "" : "en"}
        </span>
        <span className="flex items-center gap-2">
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-medium leading-tight" style={{ color: C.ink }}>
              {PROFIEL.naam}
            </span>
          </span>
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{ background: C.accentSoft, color: C.accent, ...num }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-8 border-b" style={{ borderColor: C.line }}>
      <div className="flex items-stretch gap-6 overflow-x-auto sm:gap-8">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="shrink-0 pb-3 pt-1 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] motion-reduce:transition-none"
              style={{
                color: on ? C.ink : C.inkMute,
                borderBottom: on ? `1.5px solid ${C.ink}` : "1.5px solid transparent",
                marginBottom: -1,
                ...bodyFont,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div className="space-y-16 sm:space-y-20">
      <section>
        <p
          className="text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Vandaag
        </p>
        <h1
          className="mt-5 max-w-2xl text-[34px] font-normal leading-[1.12] tracking-[-0.02em] sm:text-[52px]"
          style={{ color: C.ink, ...serif }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
          Alles staat op orde. {verified} van {CREDENTIALS.length} certificaten geverifieerd, zeven
          open reacties, en één ding dat vandaag je aandacht vraagt.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <QuietButton primary onClick={onActies}>
            Volgende actie
            <ArrowUpRight size={15} aria-hidden="true" />
          </QuietButton>
          <TextLink onClick={onOpen} tone={C.inkMute}>
            Naar de marktplaats
            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </TextLink>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.green : C.amber;
            return (
              <div key={k.label}>
                <p className="text-[12px] font-medium" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[30px] font-normal leading-none tracking-[-0.02em]"
                  style={{ color: C.ink, ...num }}
                >
                  {k.value}
                </p>
                <p className="mt-1.5 text-[12px] font-medium" style={{ color: tone, ...num }}>
                  {k.up ? "↑" : "→"} {k.trend.replace(/^[+-]/, "")}
                </p>
                <div className="mt-3">
                  <HairSpark data={k.spark} tone={C.inkFaint} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div
            className="flex items-baseline justify-between border-b pb-3"
            style={{ borderColor: C.line }}
          >
            <h2
              className="text-[13px] font-medium uppercase tracking-[0.2em]"
              style={{ color: C.inkFaint }}
            >
              Beste matches
            </h2>
            <TextLink onClick={onOpen} tone={C.accent} className="text-[12px]">
              Alle opdrachten
            </TextLink>
          </div>
          <ul>
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={onOpen}
                  className="group flex w-full items-center gap-5 border-b py-5 text-left transition-colors hover:bg-[#f0efec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4b4f8f] motion-reduce:transition-none"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="w-12 shrink-0 text-[22px] font-normal leading-none tracking-[-0.02em]"
                    style={{ color: o.match >= 90 ? C.green : C.ink, ...num }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-medium"
                      style={{ color: C.ink }}
                    >
                      {o.titel}
                    </span>
                    <span className="block truncate text-[13px]" style={{ color: C.inkMute }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={17}
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.inkFaint }}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-10">
          <div>
            <h2
              className="border-b pb-3 text-[13px] font-medium uppercase tracking-[0.2em]"
              style={{ color: C.inkFaint, borderColor: C.line }}
            >
              Vraagt aandacht
            </h2>
            <h3
              className="mt-5 text-[19px] font-normal leading-snug"
              style={{ color: C.ink, ...serif }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <div className="mt-4">
              <TextLink onClick={onActies} tone={C.accent}>
                {primair.cta}
                <ArrowUpRight size={14} aria-hidden="true" />
              </TextLink>
            </div>
          </div>

          <div>
            <h2
              className="border-b pb-3 text-[13px] font-medium uppercase tracking-[0.2em]"
              style={{ color: C.inkFaint, borderColor: C.line }}
            >
              Certificaten
            </h2>
            <ul className="mt-1">
              {CREDENTIALS.map((c) => {
                const st = statusMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 border-b py-3"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <st.Icon
                      size={15}
                      aria-hidden="true"
                      className="shrink-0"
                      style={{ color: st.ink }}
                    />
                    <span
                      className="min-w-0 flex-1 truncate text-[13.5px] font-medium"
                      style={{ color: C.ink }}
                    >
                      {c.naam}
                    </span>
                    <span className="shrink-0 text-[12px]" style={{ color: st.ink }}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-12">
      <div>
        <p
          className="text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Marktplaats
        </p>
        <h1
          className="mt-4 text-[34px] font-normal leading-none tracking-[-0.02em] sm:text-[42px]"
          style={{ color: C.ink, ...serif }}
        >
          Open opdrachten
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: C.inkMute, ...num }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten
        </p>
      </div>

      <div
        className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center"
        style={{ borderColor: C.line }}
      >
        <div className="flex flex-1 items-center gap-2.5">
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoeken…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#a6a6a3]"
            style={{ color: C.ink, ...bodyFont }}
          />
        </div>
        <div className="flex items-center gap-5" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className="text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] motion-reduce:transition-none"
              style={{
                color: sort === s ? C.ink : C.inkMute,
                textDecoration: sort === s ? "underline" : "none",
                textUnderlineOffset: 4,
                ...bodyFont,
              }}
            >
              {s === "match" ? "Beste match" : "Tarief"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLoading((v) => !v)}
            aria-pressed={loading}
            className="text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] motion-reduce:transition-none"
            style={{ color: loading ? C.ink : C.inkMute, ...bodyFont }}
          >
            {loading ? "Stop" : "Verversen"}
          </button>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-8" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="animate-pulse space-y-3 motion-reduce:animate-none">
              <div className="h-4 w-24 rounded-full" style={{ background: C.lineSoft }} />
              <div className="h-6 w-2/3 rounded-full" style={{ background: C.lineSoft }} />
              <div className="h-4 w-1/2 rounded-full" style={{ background: C.lineSoft }} />
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Search size={28} aria-hidden="true" style={{ color: C.inkFaint }} />
          <p className="mt-6 text-[24px] font-normal" style={{ color: C.ink, ...serif }}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[14px]" style={{ color: C.inkMute }}>
            Geen opdracht bij {q ? `“${q}”` : "je zoekterm"}. Verruim je zoekterm.
          </p>
          <div className="mt-6">
            <TextLink onClick={() => setQ("")} tone={C.accent}>
              Zoekterm wissen
            </TextLink>
          </div>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: C.line }}>
          {filtered.map((o) => (
            <li key={o.id} style={{ borderColor: C.line }} className="border-t first:border-t-0">
              <MarktRij opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktRij({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <div className="py-7">
      <div className="flex items-start gap-6">
        <span className="w-14 shrink-0">
          <span
            className="block text-[28px] font-normal leading-none tracking-[-0.02em]"
            style={{ color: strong ? C.green : C.ink, ...num }}
          >
            {opdracht.match}
          </span>
          <span
            className="mt-1 block text-[11px] uppercase tracking-[0.14em]"
            style={{ color: C.inkFaint }}
          >
            match
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] font-normal leading-snug" style={{ color: C.ink, ...serif }}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[14px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren} · {opdracht.tarief}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {opdracht.tags.map((t) => (
              <span key={t} className="text-[12px]" style={{ color: C.inkFaint }}>
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b4f8f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfbfa] motion-reduce:transition-none"
              style={{ color: C.inkMute, ...bodyFont }}
            >
              {open ? (
                <Minus size={13} aria-hidden="true" />
              ) : (
                <Plus size={13} aria-hidden="true" />
              )}
              Waarom deze match
            </button>
            <TextLink onClick={onOpen} tone={C.ink}>
              Reageer
              <ArrowUpRight size={14} aria-hidden="true" />
            </TextLink>
          </div>
          <div
            className="grid transition-all duration-500 motion-reduce:transition-none"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <RedenLijst
                  titel="Voor jou"
                  tone={C.green}
                  Icon={Check}
                  items={opdracht.redenen.plus}
                />
                <RedenLijst
                  titel="Let op"
                  tone={C.amber}
                  Icon={AlertTriangle}
                  items={opdracht.redenen.min}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RedenLijst({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em]"
        style={{ color: tone }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-3 space-y-2.5">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.inkSoft }}>
            <Icon size={13} aria-hidden="true" className="mt-1 shrink-0" style={{ color: tone }} />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  return (
    <div className="space-y-14">
      <div>
        <TextLink onClick={onBack} tone={C.inkMute} className="text-[13px]">
          ← Terug naar marktplaats
        </TextLink>
        <div className="mt-8 flex flex-wrap items-baseline gap-4">
          <span className="text-[13px]" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
          <span
            className="text-[13px] font-medium"
            style={{ color: strong ? C.green : C.accent, ...num }}
          >
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-normal leading-[1.12] tracking-[-0.02em] sm:text-[46px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.inkMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <QuietButton primary>
            Reageer op opdracht
            <ArrowUpRight size={15} aria-hidden="true" />
          </QuietButton>
          <TextLink tone={C.inkMute}>Bewaren</TextLink>
        </div>
      </div>

      <div
        className="grid grid-cols-2 gap-x-8 gap-y-8 border-y py-8 sm:grid-cols-4"
        style={{ borderColor: C.line }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l}>
            <p
              className="text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint }}
            >
              {m.l}
            </p>
            <p
              className="mt-2 text-[20px] font-normal tracking-[-0.01em]"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <section>
        <p
          className="text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Waarom deze match
        </p>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgestemd op je geverifieerde profiel — helder wat je meebrengt en waar de aandacht ligt,
          zonder verborgen score.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.green }}
            >
              <Check size={13} aria-hidden="true" /> Voor jou
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px]"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-1 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.amber }}
            >
              <AlertTriangle size={13} aria-hidden="true" /> Let op
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[15px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-1 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
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
    <div className="space-y-14">
      <section>
        <p
          className="text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Verificatie
        </p>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-normal leading-[1.14] tracking-[-0.02em] sm:text-[44px]"
          style={{ color: C.ink, ...serif }}
        >
          Jouw certificaten, geverifieerd.
        </h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: C.inkSoft }}>
          <span style={{ color: C.green }}>{PROFIEL.trust}.</span> {verified} van{" "}
          {CREDENTIALS.length} certificaten zijn geverifieerd — dat is {ratio}%. Eén verloopt
          binnenkort. Documenten blijven versleuteld en privé.
        </p>
      </section>

      <section className="border-t" style={{ borderColor: C.line }}>
        <ul>
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam} className="border-b" style={{ borderColor: C.line }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:bg-[#f0efec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4b4f8f] motion-reduce:transition-none"
                >
                  <st.Icon
                    size={17}
                    aria-hidden="true"
                    className="shrink-0"
                    style={{ color: st.ink }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[16px] font-normal"
                      style={{ color: C.ink, ...serif }}
                    >
                      {c.naam}
                    </span>
                    <span
                      className="mt-0.5 block truncate text-[13px]"
                      style={{ color: C.inkMute }}
                    >
                      {c.detail}
                    </span>
                  </span>
                  <span
                    className="hidden shrink-0 text-[13px] font-medium sm:inline"
                    style={{ color: st.ink }}
                  >
                    {st.label}
                    {st.alarm && <span className="sr-only"> (let op)</span>}
                  </span>
                  <span
                    className="shrink-0 transition-transform motion-reduce:transition-none"
                    style={{
                      color: C.inkFaint,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    <Plus size={16} />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-500 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6 pl-9 pr-2">
                      <p
                        className="max-w-xl text-[14px] leading-relaxed"
                        style={{ color: C.inkSoft }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en alleen na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <TextLink tone={c.status === "EXPIRING" ? C.amber : C.accent}>
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </TextLink>
                        <TextLink tone={C.inkMute}>Historie</TextLink>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2
          className="border-b pb-3 text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint, borderColor: C.line }}
        >
          Documenten
        </h2>
        <ul>
          {DOCUMENTEN.map((d) => {
            const st = statusMeta(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-4 border-b py-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium"
                  style={{ color: st.ink }}
                >
                  <st.Icon size={13} aria-hidden="true" />
                  {st.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-12">
      <div>
        <p
          className="text-[13px] font-medium uppercase tracking-[0.2em]"
          style={{ color: C.inkFaint }}
        >
          Acties
        </p>
        <h1
          className="mt-4 max-w-xl text-[32px] font-normal leading-[1.14] tracking-[-0.02em] sm:text-[44px]"
          style={{ color: C.ink, ...serif }}
        >
          Wat nu je aandacht vraagt.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Rustig van boven naar beneden. Drie dingen, meer niet.
        </p>
      </div>

      <ol className="border-t" style={{ borderColor: C.line }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.amber : C.accent;
          return (
            <li key={a.titel} className="border-b" style={{ borderColor: C.line }}>
              <div className="flex items-start gap-6 py-8">
                <span
                  className="text-[15px] font-normal tabular-nums"
                  style={{ color: C.inkFaint, ...num }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: tone }}
                  >
                    {warn ? "Urgent" : "Aanbevolen"}
                  </p>
                  <h2
                    className="mt-2 text-[20px] font-normal leading-snug"
                    style={{ color: C.ink, ...serif }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-2 max-w-lg text-[15px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <TextLink tone={tone}>
                      {a.cta}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </TextLink>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurTone(status: string): string {
  if (status === "Openstaand") return C.amber;
  if (status === "Betaald") return C.green;
  return C.inkMute;
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[13px] font-medium uppercase tracking-[0.2em]"
            style={{ color: C.inkFaint }}
          >
            Facturen
          </p>
          <h1
            className="mt-4 text-[32px] font-normal leading-none tracking-[-0.02em] sm:text-[42px]"
            style={{ color: C.ink, ...serif }}
          >
            Overzicht
          </h1>
        </div>
        <QuietButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </QuietButton>
      </div>

      <section
        className="grid grid-cols-1 gap-8 border-y py-8 sm:grid-cols-3"
        style={{ borderColor: C.line }}
      >
        {[
          { l: "Voldaan", v: totaalBetaald, sub: "3 facturen", tone: C.green },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.amber },
          { l: "Concept", v: "€ 880", sub: "klaar om te sturen", tone: C.inkMute },
        ].map((s) => (
          <div key={s.l}>
            <p
              className="text-[12px] font-medium uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-normal tracking-[-0.02em]"
              style={{ color: s.tone, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">Facturen met status en bedrag</caption>
            <thead>
              <tr className="border-b" style={{ borderColor: C.line }}>
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
                    className={`py-3 pr-4 text-[11px] font-medium uppercase tracking-[0.14em] ${c.a === "right" ? "text-right" : ""}`}
                    style={{ color: C.inkFaint, ...bodyFont }}
                  >
                    {c.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FACTUREN.map((f) => {
                const tone = factuurTone(f.status);
                const openst = f.status === "Openstaand";
                return (
                  <tr
                    key={f.nr}
                    className="border-b transition-colors hover:bg-[#f0efec]"
                    style={{ borderColor: C.lineSoft }}
                  >
                    <td className="py-4 pr-4 text-[13px]" style={{ color: C.inkMute, ...num }}>
                      {f.nr}
                    </td>
                    <td className="py-4 pr-4 text-[14.5px] font-medium" style={{ color: C.ink }}>
                      {f.klant}
                    </td>
                    <td className="py-4 pr-4 text-[13px]" style={{ color: C.inkMute, ...num }}>
                      {f.datum}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-[13px] font-medium" style={{ color: tone }}>
                        {f.status}
                      </span>
                    </td>
                    <td
                      className="py-4 text-right text-[14.5px] font-medium"
                      style={{ color: openst ? C.amber : C.ink, ...num }}
                    >
                      {f.bedrag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t" style={{ borderColor: C.ink }}>
                <td
                  className="py-4 pr-4 text-[12px] font-medium uppercase tracking-[0.14em]"
                  colSpan={4}
                  style={{ color: C.inkMute, ...bodyFont }}
                >
                  Voldaan dit kwartaal
                </td>
                <td
                  className="py-4 text-right text-[16px] font-medium"
                  style={{ color: C.green, ...num }}
                >
                  {totaalBetaald}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
