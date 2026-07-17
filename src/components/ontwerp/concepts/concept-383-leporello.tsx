"use client";

// Concept 383 — "Leporello" · Redactioneel concertina/vouwblad.
// Software als een uitvouwbaar magazine: horizontale gevouwen panelen met zichtbare vouwlijnen
// (dunne verticale scheidingen met licht + schaduw), oversized redactionele serif-koppen, een
// kolomraster, warm papier, haarlijn-regels en één diep bordeaux-accent. Rustig, gezaghebbend, gedrukt.
// Palet: warm papier (#f6f1e7), inkt-zwart (#1a1714), diep bordeaux-accent (#7c2431).
// Fonts: Newsreader (display/serif) + Libre Franklin (body).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  BadgeCheck,
  MapPin,
  Wallet,
  CalendarClock,
  Gauge,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: inkt op warm papier met één diep bordeaux —
const C = {
  paper: "#f6f1e7",
  paperAlt: "#efe8da",
  panel: "#fbf8f1",
  ink: "#1a1714",
  inkSoft: "#3d382f",
  muted: "#6a6355",
  faint: "#948c7c",
  line: "rgba(26,23,20,0.20)",
  lineSoft: "rgba(26,23,20,0.11)",
  hair: "rgba(26,23,20,0.28)",
  wine: "#7c2431",
  wineSoft: "#a24a54",
};

const display = { fontFamily: "var(--font-lab-newsreader), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: BadgeCheck, alarm: false };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, alarm: true };
  }
}

// — Verticale vouwlijn: licht + schaduw, alsof papier gevouwen is —
const foldLine: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(26,23,20,0.22) 50%, rgba(255,255,255,0.4))",
};

function Fold({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none block w-px ${className}`}
      style={foldLine}
      aria-hidden="true"
    />
  );
}

// — Redactionele overline met streepje —
function Kicker({ children, tone = C.wine }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em]"
      style={{ color: tone, ...body }}
    >
      <span className="inline-block h-px w-6" style={{ background: tone }} aria-hidden="true" />
      {children}
    </p>
  );
}

// — Papieren paneel met haarlijn-rand en vouwlijn-hoek —
function Sheet({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}` }}
    >
      <span
        className="pointer-events-none absolute left-3 top-0 h-full"
        style={{ ...foldLine, width: 1, opacity: 0.35 }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}

function Tag({ children, alarm = false }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em]"
      style={{
        color: alarm ? C.paper : C.ink,
        background: alarm ? C.wine : "transparent",
        border: alarm ? "none" : `1px solid ${C.hair}`,
        ...body,
      }}
    >
      {children}
    </span>
  );
}

// — Haarlijn-staafjes sparkline, redactioneel —
function BarSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 30;
  const bw = w / data.length;
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {data.map((d, i) => {
        const bh = ((d - min) / span) * (h - 4) + 3;
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.28}
            y={h - bh}
            width={bw * 0.44}
            height={bh}
            fill={i === data.length - 1 ? tone : C.hair}
          />
        );
      })}
    </svg>
  );
}

// — Match als redactioneel cijfer met liniaal-balk —
function MatchRule({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex flex-col items-end gap-1" aria-hidden="true">
      <span
        className="text-[26px] font-medium tabular-nums leading-none"
        style={{ color: strong ? C.wine : C.ink, ...display }}
      >
        {value}
        <span className="text-[13px]" style={{ color: C.faint }}>
          %
        </span>
      </span>
      <span className="h-1 w-16 overflow-hidden" style={{ background: C.lineSoft }}>
        <span
          className="block h-full"
          style={{ width: `${value}%`, background: strong ? C.wine : C.ink }}
        />
      </span>
    </span>
  );
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c2431] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]";

export function Concept383() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pb-20 pt-8">
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
  return (
    <header className="pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <p className="text-[30px] font-medium leading-none tracking-[-0.01em]" style={display}>
            Leporello
          </p>
          <span
            className="hidden text-[10.5px] uppercase tracking-[0.3em] sm:inline"
            style={{ color: C.faint }}
          >
            Editie · {PROFIEL.plaats}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="hidden items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] sm:inline-flex"
            style={{ color: C.wine, border: `1px solid ${C.wine}`, ...body }}
          >
            <BadgeCheck size={12} aria-hidden="true" />
            {PROFIEL.trust}
          </span>
          <span className="hidden text-right sm:block">
            <span className="block text-[13px] font-semibold" style={{ color: C.inkSoft }}>
              {PROFIEL.naam}
            </span>
            <span className="block text-[10.5px]" style={{ color: C.faint }}>
              {PROFIEL.rol}
            </span>
          </span>
          <span
            className="flex h-11 w-11 items-center justify-center text-[13px] font-medium"
            style={{ background: C.ink, color: C.paper, ...display }}
            aria-hidden="true"
          >
            {PROFIEL.initialen}
          </span>
        </div>
      </div>
      <div className="mt-4" style={{ borderTop: `2px solid ${C.ink}` }} />
      <div className="mt-1" style={{ borderTop: `1px solid ${C.hair}` }} />
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav
      className="mt-5 flex items-stretch overflow-x-auto"
      aria-label="Hoofdnavigatie"
      style={{ borderBottom: `1px solid ${C.hair}` }}
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <div key={s.key} className="flex items-stretch">
            {i > 0 && <Fold className="my-2" />}
            <button
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`relative shrink-0 px-5 py-3 text-[12.5px] font-medium uppercase tracking-[0.12em] transition-colors ${focusRing}`}
              style={{ color: on ? C.ink : C.faint }}
            >
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-4 -bottom-px h-[3px]"
                  style={{ background: C.wine }}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Kicker>Vandaag · het blad</Kicker>
          <h1
            className="mt-4 text-[52px] font-medium leading-[0.96] tracking-[-0.02em] md:text-[68px]"
            style={display}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Sla het vouwblad open: je profiel is geverifieerd en drie opdrachten staan vandaag boven
            85%. Lees eerst wat aandacht vraagt, de rest volgt kolom voor kolom.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className={`group inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.ink, color: C.paper }}
            >
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px]"
              style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
            >
              <span className="h-2 w-2" style={{ background: C.wine }} aria-hidden="true" />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </div>

        <Sheet className="p-6">
          <Kicker>Hoofdartikel</Kicker>
          <h2 className="mt-3 text-[27px] font-medium leading-snug" style={display}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={onActies}
            className={`group mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={{ background: C.wine, color: C.paper }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        </Sheet>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between"
          style={{ borderBottom: `1px solid ${C.hair}` }}
        >
          <Kicker>Kerncijfers · deze maand</Kicker>
          <span className="pb-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
            Geverifieerd profiel
          </span>
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderTop: `1px solid ${C.lineSoft}`, borderLeft: `1px solid ${C.lineSoft}` }}
        >
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="p-5"
              style={{
                borderRight: `1px solid ${C.lineSoft}`,
                borderBottom: `1px solid ${C.lineSoft}`,
              }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                  {k.label}
                </p>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.ink : C.wine }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[34px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                style={display}
              >
                {k.value}
              </p>
              <div className="mt-4">
                <BarSpark data={k.spark} tone={k.up ? C.wine : C.ink} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between"
          style={{ borderBottom: `1px solid ${C.hair}` }}
        >
          <Kicker>Rubriek · open opdrachten</Kicker>
          <button
            onClick={onOpen}
            className={`pb-2 text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#7c2431] ${focusRing}`}
            style={{ color: C.wine }}
          >
            Volledige rubriek
          </button>
        </div>
        <ul style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 py-5 text-left transition-colors hover:bg-[#efe8da] ${focusRing}`}
              >
                <span
                  className="text-[13px] font-medium tabular-nums"
                  style={{ color: C.wine, ...display }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[20px] font-medium leading-snug"
                    style={display}
                  >
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-4">
                  <MatchRule value={o.match} />
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    style={{ color: C.faint }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
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
    <div className="space-y-7">
      <div
        className="flex flex-wrap items-end justify-between gap-4"
        style={{ borderBottom: `2px solid ${C.ink}` }}
      >
        <div className="pb-4">
          <Kicker>De marktplaats</Kicker>
          <h1
            className="mt-3 text-[44px] font-medium leading-none tracking-[-0.02em]"
            style={display}
          >
            Open opdrachten
          </h1>
        </div>
        <span className="pb-4 text-[11px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          in editie
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-2.5"
          style={{ background: C.panel, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#948c7c]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div
          className="flex items-center"
          role="group"
          aria-label="Sorteren"
          style={{ border: `1px solid ${C.line}` }}
        >
          {(["match", "tarief"] as const).map((s, i) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`px-4 py-2 text-[12px] font-medium uppercase tracking-[0.08em] transition-all ${focusRing}`}
                style={{
                  color: on ? C.paper : C.muted,
                  background: on ? C.ink : "transparent",
                  borderLeft: i === 1 ? `1px solid ${C.line}` : "none",
                }}
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Sheet className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Search size={40} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-5 text-[28px] font-medium" style={display}>
              Geen artikel gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Niets past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om de editie
              opnieuw te vullen.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.ink, color: C.paper }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Sheet>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({
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
    <Sheet className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-5">
        <span
          className="text-[15px] font-medium tabular-nums"
          style={{ color: C.wine, ...display }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h3 className="text-[22px] font-medium leading-snug" style={display}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
        <MatchRule value={opdracht.match} />
      </div>
      <div
        className="mt-4 flex items-center gap-4 pt-3"
        style={{ borderTop: `1px solid ${C.lineSoft}` }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.06em] transition-colors ${focusRing}`}
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors hover:text-[#7c2431] ${focusRing}`}
          style={{ color: C.wine }}
        >
          Lees opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-4 grid grid-cols-1 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.lineSoft}` }}
          >
            <div className="py-4 sm:pr-6" style={{ borderRight: `1px solid ${C.lineSoft}` }}>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.ink }}>
                Pleit vóór
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <Check
                      size={13}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ink }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-4 sm:pl-6">
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: C.wine }}>
                Aandachtspunten
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.wine }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const meta = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Gauge },
    { l: "Start", v: opdracht.start, Icon: CalendarClock },
    { l: "Match", v: `${opdracht.match}%`, Icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors hover:text-[#7c2431] ${focusRing}`}
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar de rubriek
      </button>

      <div className="pb-8" style={{ borderBottom: `2px solid ${C.ink}` }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.faint }}>
            {opdracht.id}
          </span>
          <Tag alarm>{opdracht.match}% match</Tag>
        </div>
        <h1
          className="mt-4 max-w-3xl text-[46px] font-medium leading-[1.02] tracking-[-0.02em] md:text-[62px]"
          style={display}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opdracht.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className={`inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={{ background: C.wine, color: C.paper }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className={`inline-flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
            style={{ color: C.ink, border: `1px solid ${C.ink}` }}
          >
            Bewaar
          </button>
        </div>
      </div>

      <section
        className="grid grid-cols-2 md:grid-cols-4"
        style={{ borderTop: `1px solid ${C.lineSoft}`, borderLeft: `1px solid ${C.lineSoft}` }}
      >
        {meta.map((m) => (
          <div
            key={m.l}
            className="p-5"
            style={{
              borderRight: `1px solid ${C.lineSoft}`,
              borderBottom: `1px solid ${C.lineSoft}`,
            }}
          >
            <m.Icon size={16} aria-hidden="true" style={{ color: C.wine }} />
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              {m.l}
            </p>
            <p
              className="mt-1 text-[24px] font-medium tabular-nums tracking-[-0.01em]"
              style={display}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="pb-3" style={{ borderBottom: `1px solid ${C.hair}` }}>
          <Kicker>De onderbouwing · waarom deze match</Kicker>
        </div>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div
          className="mt-6 grid grid-cols-1 md:grid-cols-2"
          style={{ borderTop: `1px solid ${C.lineSoft}` }}
        >
          <div className="py-6 md:pr-8" style={{ borderRight: `1px solid ${C.lineSoft}` }}>
            <Kicker tone={C.ink}>Pleit vóór</Kicker>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 pt-3 text-[14px] first:pt-0"
                  style={{ color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="py-6 md:pl-8">
            <Kicker>Aandachtspunten</Kicker>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 pt-3 text-[14px] first:pt-0"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.wine }}
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-6 pb-8"
        style={{ borderBottom: `2px solid ${C.ink}` }}
      >
        <div className="max-w-md">
          <Kicker>Verificatie · vertrouwensniveau</Kicker>
          <h1
            className="mt-3 text-[44px] font-medium leading-none tracking-[-0.02em]"
            style={display}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-semibold" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
            binnenkort en vraagt om vernieuwing.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <p
            className="text-[64px] font-medium tabular-nums leading-none tracking-[-0.02em]"
            style={display}
          >
            {ratio}
            <span className="text-[24px]" style={{ color: C.muted }}>
              %
            </span>
          </p>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.16em]" style={{ color: C.faint }}>
              Geverifieerd
            </p>
            <p className="text-[13px]" style={{ color: C.muted }}>
              {verified}/{CREDENTIALS.length} documenten
            </p>
          </div>
        </div>
      </div>

      <ul style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <button
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-5 text-left ${focusRing}`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center"
                  style={{ border: `1px solid ${st.alarm ? C.wine : C.ink}` }}
                  aria-hidden="true"
                >
                  <st.Icon size={16} style={{ color: st.alarm ? C.wine : C.ink }} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[19px] font-medium" style={display}>
                    {c.naam}
                  </span>
                  <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Tag alarm={st.alarm}>
                    <st.Icon size={11} aria-hidden="true" />
                    {st.label}
                  </Tag>
                  <span
                    className="transition-transform motion-reduce:transition-none"
                    style={{ color: C.muted, transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
                    aria-hidden="true"
                  >
                    <Plus size={15} />
                  </span>
                </span>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-5 pl-14" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                    <p
                      className="mt-4 max-w-xl text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {c.detail}. Documenten worden versleuteld bewaard en pas na je expliciete
                      toestemming gedeeld met een opdrachtgever.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={`px-4 py-2 text-[12.5px] font-semibold transition-all ${focusRing}`}
                        style={{ background: st.alarm ? C.wine : C.ink, color: C.paper }}
                      >
                        {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                      </button>
                      <button
                        className={`px-4 py-2 text-[12.5px] font-medium transition-all ${focusRing}`}
                        style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
                      >
                        Historie
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-8">
      <div className="pb-6" style={{ borderBottom: `2px solid ${C.ink}` }}>
        <Kicker>Volgende acties</Kicker>
        <h1
          className="mt-3 text-[44px] font-medium leading-none tracking-[-0.02em]"
          style={display}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie. Lees de eerste kolom als eerste af.
        </p>
      </div>

      <ol style={{ borderTop: `1px solid ${C.lineSoft}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
              <div
                className="grid grid-cols-1 items-center gap-5 py-6 sm:grid-cols-[auto_1fr_auto]"
                style={{ borderLeft: `3px solid ${warn ? C.wine : C.ink}`, paddingLeft: 20 }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center text-[18px] font-medium tabular-nums"
                  style={
                    warn
                      ? { background: C.wine, color: C.paper, ...display }
                      : { border: `1px solid ${C.ink}`, color: C.ink, ...display }
                  }
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {warn && (
                      <AlertTriangle size={15} aria-hidden="true" style={{ color: C.wine }} />
                    )}
                    <h2 className="text-[20px] font-medium leading-snug" style={display}>
                      {a.titel}
                    </h2>
                  </div>
                  <p
                    className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {a.detail}
                  </p>
                </div>
                <button
                  className={`justify-self-start px-5 py-2.5 text-[13px] font-semibold transition-all motion-reduce:transition-none sm:justify-self-end ${focusRing}`}
                  style={
                    warn
                      ? { background: C.wine, color: C.paper }
                      : { border: `1px solid ${C.ink}`, color: C.ink }
                  }
                >
                  {a.cta}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurAlarm(status: string): boolean {
  return status === "Openstaand";
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  const sums = [
    { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
    { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
    { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
  ];
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 pb-6"
        style={{ borderBottom: `2px solid ${C.ink}` }}
      >
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-3 text-[44px] font-medium leading-none tracking-[-0.02em]"
            style={display}
          >
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 px-5 py-3 text-[13.5px] font-semibold transition-all motion-reduce:transition-none ${focusRing}`}
          style={{ background: C.ink, color: C.paper }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ borderTop: `1px solid ${C.lineSoft}`, borderLeft: `1px solid ${C.lineSoft}` }}
      >
        {sums.map((s) => (
          <div
            key={s.l}
            className="p-5"
            style={{
              borderRight: `1px solid ${C.lineSoft}`,
              borderBottom: `1px solid ${C.lineSoft}`,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
              {s.l}
            </p>
            <p
              className="mt-2 text-[32px] font-medium tabular-nums tracking-[-0.02em]"
              style={{ color: s.alarm ? C.wine : C.ink, ...display }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 pb-2 sm:grid"
          style={{ borderBottom: `2px solid ${C.ink}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 transition-colors hover:bg-[#efe8da] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-medium sm:order-2"
                  style={display}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag alarm={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[16px] font-medium tabular-nums sm:order-5"
                  style={{ color: acc ? C.wine : C.ink, ...display }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between pt-5"
          style={{ borderTop: `2px solid ${C.ink}` }}
        >
          <span className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: C.faint }}>
            Totaal betaald
          </span>
          <span className="text-[28px] font-medium tabular-nums" style={display}>
            {totaalBetaald}
          </span>
        </div>
      </div>
    </div>
  );
}
