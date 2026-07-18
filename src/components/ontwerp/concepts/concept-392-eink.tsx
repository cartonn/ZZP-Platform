"use client";

// Concept 392 — "E-ink" · E-paper leesrust, geditherd monochroom.
// Volledig grijswaarden (papier #eceae4 → inkt #1b1b1a), geen kleur behalve één zeer donkere
// inkt-accent. Dithering/halftone-textuur voor "vlakken", scherpe hairlines, kalme lage-prikkel
// leesinterface, tabulaire cijfers. Voelt als een Kindle/reMarkable. Fonts: serif voor koppen
// (Georgia/serif-stack) + systeem-sans body.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Bell,
  Circle,
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

// — Palet: e-paper grijswaarden, van papier tot inkt; één donkere inkt-accent —
const C = {
  paper: "#eceae4",
  paperAlt: "#e2e0d8",
  card: "#f3f1ea",
  cardAlt: "#e8e6de",
  ink: "#1b1b1a",
  inkSoft: "#3a3a38",
  muted: "#5f5f5b",
  faint: "#8a8a84",
  fainter: "#a9a9a2",
  line: "#c7c5bc",
  lineSoft: "#d5d3ca",
  accent: "#111110", // diepste inkt-accent
};

const head = { fontFamily: 'Georgia, "Times New Roman", "Iowan Old Style", serif' };
const body = { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' };
const numeric = { fontVariantNumeric: "tabular-nums" as const };

// — Dither/halftone-vlak als data-URI: ordered dot-patroon voor "grijs" zonder echte grijstint —
function ditherUri(level: 1 | 2 | 3): string {
  // level bepaalt puntdichtheid; alles in inkt-zwart met verschillende opdekking
  const dots: Record<number, string> = {
    1: '<circle cx="1" cy="1" r="0.6"/>',
    2: '<circle cx="1" cy="1" r="0.6"/><circle cx="3" cy="3" r="0.6"/>',
    3: '<circle cx="1" cy="1" r="0.7"/><circle cx="3" cy="1" r="0.7"/><circle cx="1" cy="3" r="0.7"/><circle cx="3" cy="3" r="0.7"/>',
  };
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><g fill="#1b1b1a">${dots[level]}</g></svg>`,
    )
  );
}

function ditherStyle(level: 1 | 2 | 3, opacity = 0.5): React.CSSProperties {
  return {
    backgroundImage: `url("${ditherUri(level)}")`,
    backgroundSize: "4px 4px",
    opacity,
  };
}

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  dither: 1 | 2 | 3;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, dither: 3 };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, dither: 2 };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, alarm: true, dither: 2 };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, alarm: true, dither: 1 };
  }
}

// — Kaart: scherpe hairline-rand, e-paper vlak —
function Card({
  children,
  className = "",
  tint = "card",
}: {
  children: React.ReactNode;
  className?: string;
  tint?: "card" | "cardAlt" | "paper";
}) {
  const bg = tint === "cardAlt" ? C.cardAlt : tint === "paper" ? C.paper : C.card;
  return (
    <div
      className={`rounded-none ${className}`}
      style={{ background: bg, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10.5px] font-semibold uppercase tracking-[0.3em]"
      style={{ color: C.faint, ...body }}
    >
      {children}
    </p>
  );
}

// — Inkt-badge: label + optioneel geditherd vlak, nooit alleen kleur —
function Badge({
  children,
  filled = false,
  alarm = false,
}: {
  children: React.ReactNode;
  filled?: boolean;
  alarm?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        color: filled ? C.paper : C.ink,
        background: filled ? C.ink : "transparent",
        border: `1px solid ${alarm ? C.ink : filled ? C.ink : C.line}`,
        borderStyle: alarm && !filled ? "dashed" : "solid",
        ...body,
      }}
    >
      {children}
    </span>
  );
}

// — Geditherde schijf met icoon: "toon" via puntdichtheid i.p.v. kleur —
function Disc({
  children,
  size = 44,
  dither = 3,
  solid = false,
}: {
  children: React.ReactNode;
  size?: number;
  dither?: 1 | 2 | 3;
  solid?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: solid ? C.ink : C.card,
        border: `1px solid ${C.ink}`,
      }}
      aria-hidden="true"
    >
      {!solid && (
        <span className="pointer-events-none absolute inset-0" style={ditherStyle(dither, 0.4)} />
      )}
      <span className="relative" style={{ color: solid ? C.paper : C.ink }}>
        {children}
      </span>
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1b1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eceae4] motion-reduce:transition-none ${className}`}
      style={{ color: C.paper, background: C.ink, border: `1px solid ${C.ink}`, ...body }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  active = false,
  className = "",
  ariaPressed,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  ariaPressed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12.5px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1b1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eceae4] ${className}`}
      style={{
        color: active ? C.paper : C.ink,
        background: active ? C.ink : "transparent",
        border: `1px solid ${C.ink}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

// — Sparkline: dunne inkt-lijn, geen vulling, e-paper hairline —
function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 112;
  const h = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={line}
        fill="none"
        stroke={C.ink}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={C.ink} />}
    </svg>
  );
}

function MatchMeter({ value }: { value: number }) {
  return (
    <span className="hidden items-center gap-2 sm:flex" aria-hidden="true">
      <span
        className="h-2 w-16 overflow-hidden"
        style={{ background: C.paper, border: `1px solid ${C.line}` }}
      >
        <span className="relative block h-full" style={{ width: `${value}%`, background: C.ink }}>
          <span
            className="pointer-events-none absolute inset-0"
            style={ditherStyle(value >= 90 ? 3 : 2, 0.25)}
          />
        </span>
      </span>
      <span className="text-[13px] font-semibold" style={{ color: C.ink, ...numeric }}>
        {value}%
      </span>
    </span>
  );
}

export function Concept392() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main className="pt-8">
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
    <header
      className="flex items-center justify-between gap-4 py-6"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3.5">
        <Disc size={46} solid>
          <BookOpen size={20} aria-hidden="true" />
        </Disc>
        <div>
          <p className="text-[21px] font-bold leading-none tracking-[-0.01em]" style={head}>
            E-ink
          </p>
          <p
            className="mt-1.5 text-[10.5px] font-semibold uppercase leading-none tracking-[0.18em]"
            style={{ color: C.faint }}
          >
            Leesrust · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] sm:inline-flex"
          style={{ color: C.ink, border: `1px solid ${C.line}` }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold"
              style={{ background: C.ink, color: C.paper }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={head}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: C.faint }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden text-[13px] font-bold"
          style={{ background: C.card, color: C.ink, border: `1px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <span className="pointer-events-none absolute inset-0" style={ditherStyle(1, 0.3)} />
          <span className="relative" style={head}>
            {PROFIEL.initialen}
          </span>
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-5">
      <div
        className="flex items-center gap-0 overflow-x-auto"
        style={{ borderBottom: `1px solid ${C.line}` }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1b1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#eceae4] motion-reduce:transition-none"
              style={{ color: on ? C.ink : C.muted, ...body }}
            >
              {s.label}
              <span
                className="absolute bottom-[-1px] left-3 right-3 h-[2px]"
                style={{ background: on ? C.ink : "transparent" }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onActies }: { onOpen: () => void; onActies: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Overline>Vandaag · {PROFIEL.plaats}</Overline>
          <h1
            className="mt-4 text-[38px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[46px]"
            style={head}
          >
            Goedemorgen, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            Een rustige leesomgeving zonder prikkels. Alleen inkt op papier — wat telt staat scherp,
            de rest verdwijnt naar de marge.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton onClick={onActies}>
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </PrimaryButton>
            <GhostButton onClick={onOpen}>Marktplaats</GhostButton>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Overline>Belangrijkste nu</Overline>
            <Disc size={36} dither={1}>
              <AlertTriangle size={16} aria-hidden="true" />
            </Disc>
          </div>
          <h2 className="mt-4 text-[21px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={onActies} className="w-full">
              {primair.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </PrimaryButton>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Deze maand</Overline>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: C.faint }}
          >
            Geverifieerd profiel
          </span>
        </div>
        <div
          className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.line }}
        >
          {KPIS.map((k) => (
            <div key={k.label} className="p-5" style={{ background: C.card }}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: C.muted }}
                >
                  {k.label}
                </p>
                <span className="text-[11px] font-bold" style={{ color: C.ink, ...numeric }}>
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-3 text-[30px] font-bold leading-none tracking-[-0.01em]"
                style={{ ...head, ...numeric }}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] font-semibold uppercase tracking-[0.1em] underline-offset-4 transition-opacity hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink }}
          >
            Alles bekijken
          </button>
        </div>
        <ul style={{ borderTop: `1px solid ${C.line}` }}>
          {OPDRACHTEN.map((o) => (
            <li key={o.id} style={{ borderBottom: `1px solid ${C.line}` }}>
              <button
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-4 text-left transition-colors hover:bg-[#e8e6de] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1b1b1a] motion-reduce:transition-none"
              >
                <Disc size={44} dither={o.match >= 90 ? 3 : 2}>
                  <span className="text-[13px] font-bold" style={{ ...head, ...numeric }}>
                    {o.match}
                  </span>
                </Disc>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <MatchMeter value={o.match} />
                  <ChevronRight
                    size={18}
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

      <section>
        <Overline>Certificaten</Overline>
        <div className="mt-4 grid grid-cols-1 gap-px sm:grid-cols-2" style={{ background: C.line }}>
          {CREDENTIALS.map((c) => {
            const st = statusMeta(c.status);
            return (
              <div
                key={c.naam}
                className="flex items-center gap-3 p-4"
                style={{ background: C.card }}
              >
                <Disc size={40} dither={st.dither}>
                  <st.Icon size={17} aria-hidden="true" />
                </Disc>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold" style={head}>
                    {c.naam}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px]" style={{ color: C.muted }}>
                    {c.detail}
                  </p>
                </div>
                <Badge alarm={st.alarm}>
                  <st.Icon size={11} aria-hidden="true" />
                  {st.label}
                  {st.alarm && <span className="sr-only"> (let op)</span>}
                </Badge>
              </div>
            );
          })}
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
    <div className="space-y-7">
      <div>
        <Overline>De marktplaats</Overline>
        <h1 className="mt-3 text-[32px] font-bold leading-none tracking-[-0.01em]" style={head}>
          Open opdrachten
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten zichtbaar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-4 py-3"
          style={{ background: C.card, border: `1px solid ${C.ink}` }}
        >
          <Search size={17} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] font-medium outline-none placeholder:text-[#8a8a84]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <GhostButton
              key={s}
              onClick={() => setSort(s)}
              active={sort === s}
              ariaPressed={sort === s}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </GhostButton>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Disc size={64} dither={2}>
              <Search size={26} aria-hidden="true" />
            </Disc>
            <p className="mt-5 text-[22px] font-bold" style={head}>
              Niets gevonden
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.muted }}>
              Geen opdracht past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm om meer
              resultaten te zien.
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => setQ("")}>
                Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
              </PrimaryButton>
            </div>
          </div>
        </Card>
      ) : (
        <ul className="space-y-4">
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
  const strong = opdracht.match >= 90;
  return (
    <Card className="p-5">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge>#{String(index + 1).padStart(2, "0")}</Badge>
            <span
              className="truncate text-[11.5px] font-semibold"
              style={{ color: C.faint, ...numeric }}
            >
              {opdracht.id}
            </span>
          </div>
          <h3 className="mt-2 text-[19px] font-bold leading-snug tracking-[-0.01em]" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Disc size={54} dither={strong ? 3 : 2}>
            <span className="text-[16px] font-bold" style={{ ...head, ...numeric }}>
              {opdracht.match}
            </span>
          </Disc>
          <span className="text-[14px] font-bold" style={{ color: C.ink, ...numeric }}>
            {opdracht.tarief}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.ink, border: `1px solid ${C.line}`, ...body }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <PrimaryButton onClick={onOpen}>
            Reageer <ArrowRight size={14} aria-hidden="true" />
          </PrimaryButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok titel="Pluspunten" Icon={Check} items={opdracht.redenen.plus} />
            <RedenBlok
              titel="Aandachtspunten"
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
              dashed
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RedenBlok({
  titel,
  Icon,
  items,
  dashed = false,
}: {
  titel: string;
  Icon: LucideIcon;
  items: string[];
  dashed?: boolean;
}) {
  return (
    <div
      className="p-4"
      style={{ background: C.cardAlt, border: `1px ${dashed ? "dashed" : "solid"} ${C.line}` }}
    >
      <p
        className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: C.ink, ...body }}
      >
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12.5px]" style={{ color: C.inkSoft }}>
            <Icon
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: C.ink }}
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
    <div className="space-y-7">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.ink, border: `1px solid ${C.line}`, ...body }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="p-7 md:p-9">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge>{opdracht.id}</Badge>
          <Badge filled>
            <Circle size={11} aria-hidden="true" fill="currentColor" /> {opdracht.match}% match
          </Badge>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[32px] font-bold leading-[1.08] tracking-[-0.01em] md:text-[42px]"
          style={head}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 text-[14px] font-semibold" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton>
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </PrimaryButton>
          <GhostButton>Opdracht bewaren</GhostButton>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.line }}>
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Start", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-4" style={{ background: C.card }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p
              className="mt-1.5 text-[20px] font-bold tracking-[-0.01em]"
              style={{ ...head, ...numeric }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én de
          aandachtspunten, zonder verborgen score.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card tint="cardAlt" className="p-5">
            <div className="flex items-center gap-2">
              <Disc size={34} dither={3}>
                <Check size={16} aria-hidden="true" />
              </Disc>
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.ink, ...body }}
              >
                Pluspunten
              </p>
            </div>
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
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card tint="cardAlt" className="p-5">
            <div className="flex items-center gap-2">
              <Disc size={34} dither={1}>
                <AlertTriangle size={16} aria-hidden="true" />
              </Disc>
              <p
                className="text-[12px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.ink, ...body }}
              >
                Aandachtspunten
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ink }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  const R = 34;
  const circ = 2 * Math.PI * R;

  return (
    <div className="space-y-7">
      <Card className="p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Certificaten · authenticatie</Overline>
            <h1
              className="mt-3 text-[30px] font-bold leading-tight tracking-[-0.01em]"
              style={head}
            >
              Verificatie
            </h1>
            <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten geverifieerd. Eén verloopt binnenkort
              en vraagt om vernieuwing.
            </p>
          </div>
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r={R} fill="none" stroke={C.line} strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r={R}
                fill="none"
                stroke={C.ink}
                strokeWidth="8"
                strokeLinecap="butt"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - ratio / 100)}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold leading-none" style={{ ...head, ...numeric }}>
                {ratio}
              </span>
              <span
                className="text-[8.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.faint }}
              >
                geverifieerd
              </span>
            </div>
          </div>
        </div>
      </Card>

      <ul className="space-y-3">
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Card className="p-5">
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1b1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3f1ea]"
                >
                  <Disc size={44} dither={st.dither}>
                    <st.Icon size={19} aria-hidden="true" />
                  </Disc>
                  <span className="min-w-0">
                    <span className="block truncate text-[15.5px] font-bold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge alarm={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Badge>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{
                        color: C.faint,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      }}
                      aria-hidden="true"
                    >
                      <Plus size={16} />
                    </span>
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 pl-[60px]">
                      <div
                        className="p-4"
                        style={{ background: C.cardAlt, border: `1px solid ${C.line}` }}
                      >
                        <p
                          className="max-w-xl text-[13px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Documenten worden versleuteld bewaard en alleen na je
                          expliciete toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <PrimaryButton>
                            {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                          </PrimaryButton>
                          <GhostButton>Historie</GhostButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <Overline>Volgende acties</Overline>
        <h1 className="mt-3 text-[32px] font-bold leading-none tracking-[-0.01em]" style={head}>
          Acties
        </h1>
        <p className="mt-2 max-w-md text-[13.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie — werk van boven naar beneden om verifieerbaar en betaald te
          blijven.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <Disc size={48} dither={warn ? 1 : 3}>
                    <span className="text-[16px] font-bold" style={{ ...head, ...numeric }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Disc>
                  <div className="min-w-0">
                    <Badge alarm={warn}>
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Circle size={11} aria-hidden="true" fill="currentColor" />
                      )}
                      {warn ? "Belangrijk" : "Kans"}
                    </Badge>
                    <h2 className="mt-2 text-[17px] font-bold leading-snug" style={head}>
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ color: C.muted }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <PrimaryButton>
                      {a.cta}
                      <ArrowRight size={14} aria-hidden="true" />
                    </PrimaryButton>
                  </div>
                </div>
              </Card>
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
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1 className="mt-3 text-[32px] font-bold leading-none tracking-[-0.01em]" style={head}>
            Facturen
          </h1>
        </div>
        <PrimaryButton>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </PrimaryButton>
      </div>

      <section className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: C.line }}>
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 voldaan",
            alarm: false,
            dither: 3 as const,
          },
          {
            l: "Openstaand",
            v: "€ 1.350",
            sub: "1 factuur · 9 dagen",
            alarm: true,
            dither: 2 as const,
          },
          {
            l: "Concept",
            v: "€ 880",
            sub: "klaar om te versturen",
            alarm: false,
            dither: 1 as const,
          },
        ].map((s) => (
          <div key={s.l} className="p-5" style={{ background: C.card }}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {s.l}
              </p>
              {s.alarm && (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center"
                  style={{ color: C.ink, border: `1px dashed ${C.ink}` }}
                  aria-hidden="true"
                >
                  <AlertTriangle size={13} />
                </span>
              )}
            </div>
            <p
              className="mt-2 text-[28px] font-bold tracking-[-0.01em]"
              style={{ color: C.ink, ...head, ...numeric }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px] font-medium" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <Card className="overflow-hidden p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 px-1 pb-3 sm:grid"
          style={{ borderBottom: `1px solid ${C.ink}` }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...body }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-1 py-3.5 transition-colors hover:bg-[#e8e6de] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="order-1 text-[12px] font-semibold sm:order-none"
                  style={{ color: C.faint, ...numeric }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[14px] font-bold sm:order-2"
                  style={head}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12px] font-medium sm:order-3 sm:inline"
                  style={{ color: C.muted, ...numeric }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color: acc ? C.paper : C.ink,
                      background: acc ? C.ink : "transparent",
                      border: `1px ${acc ? "solid" : f.status === "Concept" ? "dashed" : "solid"} ${acc ? C.ink : C.line}`,
                      ...body,
                    }}
                  >
                    {acc && <AlertTriangle size={12} aria-hidden="true" />}
                    {f.status === "Betaald" && <Check size={12} aria-hidden="true" />}
                    {f.status}
                  </span>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-bold sm:order-5"
                  style={{ color: C.ink, ...numeric }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex items-baseline justify-between px-1 pt-3">
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...body }}
          >
            Totaal betaald
          </span>
          <span className="text-[24px] font-bold" style={{ ...head, ...numeric }}>
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
