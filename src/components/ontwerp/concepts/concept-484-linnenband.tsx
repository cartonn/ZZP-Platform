"use client";

// Concept 484 — "Linnenband" · Warm-menselijk boeklinnen. Geweven doek-textuur, warme leem- en
// zandtinten, kaarten als in linnen gebonden dossiers met fijne stiksel-randen, humanistische serif
// voor koppen. Zorg = mensenwerk; rustgevend rond gevoelige documenten, zonder dichtheid te verliezen.

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
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

// — Warm boeklinnen-palet: leem, zand, klei, salie —
const C = {
  paper: "#f4ede0",
  paperDeep: "#ece2d2",
  card: "#fbf7ef",
  cardEdge: "#e4d8c4",
  ink: "#3a3026",
  inkSoft: "#5c5040",
  inkMute: "#877a66",
  inkFaint: "#a89a84",
  line: "#e0d3bd",
  lineSoft: "#ede3d3",
  stitch: "#c9b79a",

  clay: "#a85d3e",
  clayDeep: "#8f4a2e",
  claySoft: "#f2e0d4",

  sage: "#6f7f57",
  sageDeep: "#586a42",
  sageSoft: "#e6ead9",

  amber: "#b5832f",
  amberDeep: "#976a1f",
  amberSoft: "#f3e6cd",

  slateBlue: "#4f6472",
  slateBlueSoft: "#dfe6ea",
};

const serif = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
};
const body = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
};
const num = {
  fontFamily: "'Iowan Old Style', Palatino, Georgia, serif",
  fontVariantNumeric: "tabular-nums" as const,
};

// Subtiele geweven doek-textuur via kruisende lijnen — komt terug op achtergrond en kaarten.
const weave = (opacity: number) =>
  [
    `repeating-linear-gradient(45deg, rgba(120,100,72,${opacity}) 0, rgba(120,100,72,${opacity}) 1px, transparent 1px, transparent 4px)`,
    `repeating-linear-gradient(-45deg, rgba(120,100,72,${opacity * 0.7}) 0, rgba(120,100,72,${opacity * 0.7}) 1px, transparent 1px, transparent 4px)`,
  ].join(",");

type Tone = { base: string; deep: string; soft: string };
const T = {
  clay: { base: C.clay, deep: C.clayDeep, soft: C.claySoft } as Tone,
  sage: { base: C.sage, deep: C.sageDeep, soft: C.sageSoft } as Tone,
  amber: { base: C.amber, deep: C.amberDeep, soft: C.amberSoft } as Tone,
};

function credMeta(s: CredStatus): { tone: Tone; label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { tone: T.sage, label: "Geverifieerd", Icon: ShieldCheck, alarm: false };
    case "SUBMITTED":
      return { tone: T.amber, label: "In beoordeling", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { tone: T.amber, label: "Verloopt bijna", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { tone: T.clay, label: "Afgewezen", Icon: XCircle, alarm: true };
  }
}

// — Linnen gebonden kaart met fijne stiksel-rand —
function Dossier({
  children,
  className = "",
  as: Tag = "div",
  spine,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  spine?: string;
}) {
  return (
    <Tag
      className={`relative rounded-[10px] ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.cardEdge}`,
        boxShadow: "0 1px 0 #fff inset, 0 10px 26px -20px rgba(58,48,38,0.5)",
        backgroundImage: weave(0.03),
        color: C.ink,
      }}
    >
      {spine && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[5px] rounded-l-[10px]"
          style={{ background: spine }}
        />
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[5px] rounded-[6px]"
        style={{ border: `1px dashed ${C.stitch}`, opacity: 0.55 }}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}

function Chip({
  children,
  tone,
  Icon,
}: {
  children: React.ReactNode;
  tone: Tone;
  Icon?: LucideIcon;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: tone.deep,
        background: tone.soft,
        border: `1px solid ${tone.base}33`,
        ...body,
      }}
    >
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  tone = T.clay,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tone?: Tone;
  variant?: "solid" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  type?: "button" | "submit";
}) {
  const pad = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-4 py-2.5 text-[13px]";
  const styles: React.CSSProperties =
    variant === "solid"
      ? { background: tone.base, color: "#fdf9f1", boxShadow: `0 1px 0 ${tone.deep} inset` }
      : variant === "soft"
        ? { background: tone.soft, color: tone.deep, border: `1px solid ${tone.base}33` }
        : { background: "transparent", color: C.inkSoft, border: `1px solid ${C.line}` };
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a85d3e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4ede0] ${pad} ${className}`}
      style={{ ...styles, ...body }}
    >
      {children}
    </button>
  );
}

// — Rustige sparkline met inkt-lijn op zand —
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 92;
  const h = 26;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 3 - ((d - min) / span) * (h - 6)] as const);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const last = pts[pts.length - 1] ?? ([w, h] as const);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={C.card} stroke={tone} strokeWidth="1.6" />
    </svg>
  );
}

function SectionHead({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div className="mb-4">
      {kicker && (
        <p
          className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: C.inkFaint, ...body }}
        >
          {kicker}
        </p>
      )}
      <h2 className="text-[19px] font-semibold leading-tight" style={{ color: C.ink, ...serif }}>
        {children}
      </h2>
    </div>
  );
}

export function Concept484() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[760px] w-full antialiased"
      style={{ ...body, color: C.ink, background: C.paper, backgroundImage: weave(0.05) }}
    >
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:px-8">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="pt-6">
          {screen === "dashboard" && (
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onMarkt={() => setScreen("marktplaats")}
              onActies={() => setScreen("acties")}
              onVerif={() => setScreen("verificatie")}
            />
          )}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && (
            <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
          )}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && (
            <Acties
              onMarkt={() => setScreen("marktplaats")}
              onVerif={() => setScreen("verificatie")}
            />
          )}
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
      className="flex items-center justify-between gap-4 py-5"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-[9px]"
          style={{
            background: C.clay,
            color: "#fdf5ea",
            boxShadow: `0 1px 0 ${C.clayDeep} inset`,
            backgroundImage: weave(0.08),
          }}
          aria-hidden="true"
        >
          <BookOpen size={20} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[18px] font-semibold leading-none" style={{ color: C.ink, ...serif }}>
            Linnenband
          </p>
          <p className="mt-1.5 text-[11px] leading-none" style={{ color: C.inkMute }}>
            Dossier van {PROFIEL.naam}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex"
          style={{ color: C.sageDeep, background: C.sageSoft, border: `1px solid ${C.sage}33` }}
        >
          <ShieldCheck size={12} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: C.card, border: `1px solid ${C.cardEdge}`, color: C.inkMute }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <FileText size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.clay, color: "#fff", ...num }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold"
          style={{
            background: C.claySoft,
            color: C.clayDeep,
            border: `1px solid ${C.clay}33`,
            ...num,
          }}
          aria-hidden="true"
        >
          {PROFIEL.initialen}
        </span>
      </div>
    </header>
  );
}

function NavBar({ screen, setScreen }: { screen: ScreenKey; setScreen: (s: ScreenKey) => void }) {
  return (
    <nav aria-label="Hoofdnavigatie" className="mt-4">
      <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 rounded-t-[8px] px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a85d3e]"
              style={{
                color: on ? C.clayDeep : C.inkMute,
                background: on ? C.card : "transparent",
                border: on ? `1px solid ${C.cardEdge}` : "1px solid transparent",
                borderBottom: on ? `2px solid ${C.clay}` : `2px solid transparent`,
                ...body,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ height: 1, background: C.line }} aria-hidden="true" />
    </nav>
  );
}

// —————————————————————————————————— Dashboard ——————————————————————————————————
function Dashboard({
  onOpen,
  onMarkt,
  onActies,
  onVerif,
}: {
  onOpen: () => void;
  onMarkt: () => void;
  onActies: () => void;
  onVerif: () => void;
}) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Dossier className="overflow-hidden p-7" spine={C.clay}>
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: C.inkFaint }}
          >
            Goedemorgen · {PROFIEL.plaats}
          </p>
          <h1
            className="mt-3 text-[30px] font-semibold leading-[1.12] md:text-[36px]"
            style={{ color: C.ink, ...serif }}
          >
            Goed dat je er bent, {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
            Je certificaten zijn op orde, er liggen verse matches klaar en één dossierstuk vraagt om
            aandacht. Alles bewaard als in een goed gebonden band — veilig en overzichtelijk.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button tone={T.clay} onClick={onActies}>
              Volgende actie <ArrowRight size={14} aria-hidden="true" />
            </Button>
            <Button tone={T.clay} variant="soft" onClick={onMarkt}>
              Naar marktplaats
            </Button>
          </div>
        </Dossier>

        <Dossier className="flex flex-col p-6" spine={C.amber}>
          <div className="flex items-center justify-between">
            <Chip tone={T.amber} Icon={AlertTriangle}>
              Vraagt aandacht
            </Chip>
          </div>
          <h2
            className="mt-3 text-[18px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h2>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-4">
            <Button tone={T.amber} className="w-full" onClick={onVerif}>
              {primair.cta} <ArrowRight size={14} aria-hidden="true" />
            </Button>
          </div>
          <p
            className="mt-4 flex items-center gap-2 pt-3 text-[12px]"
            style={{ color: C.inkMute, borderTop: `1px solid ${C.line}` }}
          >
            <ShieldCheck size={13} aria-hidden="true" style={{ color: C.sageDeep }} />
            {verified}/{CREDENTIALS.length} certificaten geverifieerd · {ratio}% compleet
          </p>
        </Dossier>
      </section>

      <section>
        <SectionHead kicker="Deze maand">Jouw cijfers</SectionHead>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tone = [T.clay, T.sage, T.amber, T.clay][i % 4] as Tone;
            return (
              <Dossier key={k.label} className="p-5">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute }}
                >
                  {k.label}
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p
                    className="text-[26px] font-semibold leading-none"
                    style={{ color: C.ink, ...num }}
                  >
                    {k.value}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: k.up ? C.sageDeep : C.amberDeep, ...num }}
                  >
                    {k.up ? (
                      <TrendingUp size={12} aria-hidden="true" />
                    ) : (
                      <TrendingDown size={12} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^\+/, "")}
                  </span>
                </div>
                <div className="mt-3">
                  <Spark data={k.spark} tone={tone.base} />
                </div>
              </Dossier>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex items-end justify-between">
            <SectionHead kicker="Matching">Opdrachten voor jou</SectionHead>
            <button
              type="button"
              onClick={onMarkt}
              className="mb-4 rounded text-[12px] font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a85d3e]"
              style={{ color: C.clayDeep }}
            >
              Alles bekijken
            </button>
          </div>
          <ul className="space-y-3">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRow opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionHead kicker="Dossier">Certificaten</SectionHead>
          <Dossier className="p-2">
            <ul>
              {CREDENTIALS.map((c, i) => {
                const m = credMeta(c.status);
                return (
                  <li
                    key={c.naam}
                    className="flex items-center gap-3 px-3 py-3"
                    style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px]"
                      style={{ background: m.tone.soft, color: m.tone.deep }}
                      aria-hidden="true"
                    >
                      <m.Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[13px] font-semibold"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="block truncate text-[11px]"
                        style={{ color: m.alarm ? m.tone.deep : C.inkMute }}
                      >
                        {m.label}
                      </span>
                    </span>
                    {m.alarm && (
                      <AlertTriangle size={14} aria-hidden="true" style={{ color: m.tone.deep }} />
                    )}
                  </li>
                );
              })}
            </ul>
          </Dossier>
        </div>
      </section>
    </div>
  );
}

function OpdrachtRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <Dossier
      as="article"
      className="overflow-hidden"
      spine={opdracht.match >= 90 ? C.sage : C.amber}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 p-4 pl-5 text-left transition-colors hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a85d3e]"
      >
        <MatchSeal value={opdracht.match} />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[15px] font-semibold"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 truncate text-[12px]"
            style={{ color: C.inkMute }}
          >
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </span>
          <span
            className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold"
            style={{ color: C.sageDeep }}
          >
            <Check size={13} aria-hidden="true" /> {opdracht.redenen.plus[0]}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[13px] font-semibold" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <ChevronRight size={17} aria-hidden="true" style={{ color: C.inkFaint }} />
        </span>
      </button>
    </Dossier>
  );
}

// — Match als een gestempeld wassen zegel —
function MatchSeal({ value, size = 48 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? T.sage : T.amber;
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: tone.soft,
        border: `1.5px solid ${tone.base}`,
        boxShadow: `0 0 0 3px ${tone.soft}`,
      }}
      aria-hidden="true"
    >
      <span className="text-[13px] font-semibold leading-none" style={{ color: tone.deep, ...num }}>
        {value}
      </span>
    </span>
  );
}

// —————————————————————————————————— Marktplaats ——————————————————————————————————
type Mode = "ok" | "loading" | "error";

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "tarief">("match");
  const [mode, setMode] = useState<Mode>("ok");

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim();
    const list = OPDRACHTEN.filter(
      (o) =>
        o.titel.toLowerCase().includes(n) ||
        o.plaats.toLowerCase().includes(n) ||
        o.opdrachtgever.toLowerCase().includes(n),
    );
    return [...list].sort((a, b) =>
      sort === "match"
        ? b.match - a.match
        : parseInt(b.tarief.replace(/\D/g, ""), 10) - parseInt(a.tarief.replace(/\D/g, ""), 10),
    );
  }, [q, sort]);

  return (
    <div className="space-y-5">
      <div>
        <SectionHead kicker="Marktplaats">Opdrachten die bij je passen</SectionHead>
        <p className="-mt-2 text-[13px]" style={{ color: C.inkMute }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde
          profiel.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.cardEdge}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#a89a84]"
            style={{ color: C.ink, ...body }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#ede3d3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a85d3e]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              tone={T.clay}
              variant={sort === s ? "solid" : "ghost"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Button>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Dossier className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 shrink-0 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: C.lineSoft }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <div
                      className="h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                    <div
                      className="h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none"
                      style={{ background: C.lineSoft }}
                    />
                  </div>
                </div>
              </Dossier>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={AlertTriangle}
          titel="Even geen verbinding met het archief"
          tekst="We konden de opdrachten niet ophalen. Probeer het rustig opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          titel="Niets gevonden in de band"
          tekst={`Geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Probeer een ander woord.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-4 pt-1">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded text-[11px] font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a85d3e]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "Laadstaat tonen" : "Foutstaat tonen"}
          </button>
        ))}
      </div>
    </div>
  );
}

function StateBlock({
  Icon,
  titel,
  tekst,
  cta,
  onCta,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <Dossier className="flex flex-col items-center px-6 py-14 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: C.claySoft, color: C.clayDeep, border: `1.5px solid ${C.clay}55` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-5 text-[19px] font-semibold" style={{ color: C.ink, ...serif }}>
        {titel}
      </p>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Button tone={T.clay} className="mt-6" onClick={onCta}>
        {cta} <ArrowRight size={14} aria-hidden="true" />
      </Button>
    </Dossier>
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
    <Dossier as="article" className="p-5" spine={strong ? C.sage : C.amber}>
      <div className="flex items-start gap-4">
        <MatchSeal value={opdracht.match} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={strong ? T.sage : T.amber} Icon={strong ? ShieldCheck : Check}>
              {strong ? "Sterke match" : "Goede match"}
            </Chip>
            <span className="text-[11px] font-medium" style={{ color: C.inkFaint, ...num }}>
              #{String(index + 1).padStart(2, "0")} · {opdracht.id}
            </span>
          </div>
          <h3
            className="mt-2 text-[17px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 text-[12.5px]" style={{ color: C.inkMute }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{ background: C.paperDeep, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[15px] font-semibold" style={{ color: C.ink, ...num }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a85d3e]"
          style={{ color: C.clayDeep, background: C.claySoft, border: `1px solid ${C.clay}22` }}
        >
          {open ? <X size={13} aria-hidden="true" /> : <BookOpen size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <div className="ml-auto">
          <Button tone={strong ? T.sage : T.clay} onClick={onOpen}>
            Reageren <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RedenBlok
              titel="In jouw voordeel"
              tone={T.sage}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenBlok
              titel="Goed om te weten"
              tone={T.amber}
              Icon={AlertTriangle}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </Dossier>
  );
}

function RedenBlok({
  titel,
  tone,
  Icon,
  items,
}: {
  titel: string;
  tone: Tone;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: tone.soft, border: `1px solid ${tone.base}22` }}
    >
      <p
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: tone.deep }}
      >
        <Icon size={13} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[13px]" style={{ color: C.inkSoft }}>
            <Icon
              size={13}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              style={{ color: tone.base }}
            />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

// —————————————————————————————————— Opdracht-detail ——————————————————————————————————
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const strong = opdracht.match >= 90;
  const tone = strong ? T.sage : T.amber;
  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft size={13} aria-hidden="true" /> Terug naar marktplaats
      </Button>

      <Dossier className="overflow-hidden p-7" spine={tone.base}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: C.paperDeep,
              color: C.inkSoft,
              border: `1px solid ${C.line}`,
              ...num,
            }}
          >
            {opdracht.id}
          </span>
          <Chip tone={tone} Icon={ShieldCheck}>
            {strong ? "Sterke match" : "Goede match"} · {opdracht.match}%
          </Chip>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[27px] font-semibold leading-[1.15] md:text-[33px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
          <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button tone={T.clay}>
            <Check size={15} aria-hidden="true" /> Reageer op opdracht
          </Button>
          <Button tone={T.clay} variant="soft">
            Bewaren in dossier
          </Button>
        </div>
      </Dossier>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
          { l: "Omvang", v: opdracht.uren, Icon: Clock },
          { l: "Start", v: opdracht.start, Icon: BookOpen },
          { l: "Match", v: `${opdracht.match}%`, Icon: ShieldCheck },
        ].map((m) => (
          <Dossier key={m.l} className="p-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[7px]"
              style={{ background: C.claySoft, color: C.clayDeep }}
              aria-hidden="true"
            >
              <m.Icon size={16} />
            </span>
            <p
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: C.inkMute }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[18px] font-semibold" style={{ color: C.ink, ...num }}>
              {m.v}
            </p>
          </Dossier>
        ))}
      </div>

      <section>
        <SectionHead kicker="Verklaarbare matching">Waarom deze match bij je past</SectionHead>
        <p
          className="-mt-2 mb-4 max-w-xl text-[13.5px] leading-relaxed"
          style={{ color: C.inkSoft }}
        >
          Afgezet tegen je geverifieerde profiel — open en eerlijk, zonder verborgen score.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Dossier className="p-6" spine={C.sage}>
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.sageDeep }}
            >
              <Check size={15} aria-hidden="true" /> In jouw voordeel
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
                    style={{ color: C.sage }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Dossier>
          <Dossier className="p-6" spine={C.amber}>
            <p
              className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: C.amberDeep }}
            >
              <AlertTriangle size={15} aria-hidden="true" /> Goed om te weten
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[13.5px]"
                  style={{ color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.amber }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Dossier>
        </div>
      </section>
    </div>
  );
}

// —————————————————————————————————— Verificatie ——————————————————————————————————
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const ratio = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-5">
      <Dossier className="overflow-hidden p-7" spine={C.sage}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: C.inkFaint }}
            >
              Vertrouwensniveau
            </p>
            <h1
              className="mt-2 text-[26px] font-semibold leading-tight"
              style={{ color: C.ink, ...serif }}
            >
              {PROFIEL.trust}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
              {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              bijna — dat pakken we op tijd op. Je documenten blijven versleuteld en privé.
            </p>
          </div>
          <span
            className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
            style={{ background: C.sageSoft, border: `2px solid ${C.sage}`, color: C.sageDeep }}
            aria-hidden="true"
          >
            <span className="text-[30px] font-semibold leading-none" style={{ ...num }}>
              {ratio}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]">
              % in orde
            </span>
          </span>
        </div>
        <div
          className="mt-5 h-2 w-full overflow-hidden rounded-full"
          style={{ background: C.paperDeep }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${ratio}%`, background: C.sage }}
          />
        </div>
      </Dossier>

      <div>
        <SectionHead kicker="Dossier">Certificaten</SectionHead>
        <Dossier className="overflow-hidden p-2">
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = credMeta(c.status);
              const isOpen = open === c.naam;
              return (
                <li
                  key={c.naam}
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 rounded-md px-3 py-4 text-left transition-colors hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f7f57]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px]"
                      style={{ background: m.tone.soft, color: m.tone.deep }}
                      aria-hidden="true"
                    >
                      <m.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[14.5px] font-semibold"
                        style={{ color: C.ink, ...serif }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex">
                        <Chip tone={m.tone} Icon={m.Icon}>
                          {m.label}
                          {m.alarm && <span className="sr-only"> (let op)</span>}
                        </Chip>
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden="true"
                        className="transition-transform motion-reduce:transition-none"
                        style={{ color: C.inkFaint, transform: isOpen ? "rotate(90deg)" : "none" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pb-4 sm:pl-[68px]">
                        <div
                          className="rounded-lg p-4"
                          style={{ background: C.paperDeep, border: `1px solid ${C.line}` }}
                        >
                          <p
                            className="max-w-xl text-[13px] leading-relaxed"
                            style={{ color: C.inkSoft }}
                          >
                            {c.detail}. Het document wordt versleuteld bewaard en alleen na jouw
                            toestemming gedeeld met een opdrachtgever.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              tone={
                                c.status === "EXPIRING"
                                  ? T.amber
                                  : c.status === "REJECTED"
                                    ? T.clay
                                    : T.sage
                              }
                            >
                              {c.status === "EXPIRING"
                                ? "Vernieuwen"
                                : c.status === "REJECTED"
                                  ? "Opnieuw indienen"
                                  : "Bekijken"}
                            </Button>
                            <Button size="sm" variant="ghost">
                              Historie
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Dossier>
      </div>

      <div>
        <SectionHead kicker="Veilig bewaard">Documentenkast</SectionHead>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENTEN.map((d) => {
            const m = credMeta(d.status);
            return (
              <Dossier key={d.naam} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: C.paperDeep, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[13px] font-semibold"
                    style={{ color: C.ink }}
                  >
                    {d.naam}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · {d.bijgewerkt}
                  </span>
                </span>
                <Chip tone={m.tone} Icon={m.Icon}>
                  {m.label}
                </Chip>
              </Dossier>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt, onVerif }: { onMarkt: () => void; onVerif: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionHead kicker="Op volgorde van urgentie">Wat vandaag je aandacht vraagt</SectionHead>
        <p className="-mt-2 max-w-md text-[13.5px]" style={{ color: C.inkSoft }}>
          Van boven naar beneden afhandelen — één dossierstuk tegelijk.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? T.clay : T.amber;
          const goMarkt = a.cta.toLowerCase().includes("match");
          const goVerif = a.cta.toLowerCase().includes("vog");
          return (
            <li key={a.titel}>
              <Dossier className="p-5" spine={tone.base}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-semibold"
                    style={{
                      background: tone.soft,
                      color: tone.deep,
                      border: `1.5px solid ${tone.base}55`,
                      ...num,
                    }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <Chip tone={tone} Icon={warn ? AlertTriangle : BookOpen}>
                      {warn ? "Urgent" : "Aanbevolen"}
                    </Chip>
                    <h2
                      className="mt-2 text-[17px] font-semibold leading-snug"
                      style={{ color: C.ink, ...serif }}
                    >
                      {a.titel}
                    </h2>
                    <p
                      className="mt-1 max-w-lg text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 sm:col-span-1 sm:mt-0 sm:self-center">
                    <Button tone={tone} onClick={goMarkt ? onMarkt : goVerif ? onVerif : undefined}>
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Dossier>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { tone: Tone; Icon: LucideIcon } {
  if (status === "Betaald") return { tone: T.sage, Icon: Check };
  if (status === "Openstaand") return { tone: T.clay, Icon: Clock };
  return { tone: T.amber, Icon: FileText };
}

function Facturen() {
  const [sort, setSort] = useState<"datum" | "bedrag">("datum");
  const rows = useMemo(() => {
    if (sort === "datum") return FACTUREN;
    return [...FACTUREN].sort(
      (a, b) =>
        parseInt(b.bedrag.replace(/\D/g, ""), 10) - parseInt(a.bedrag.replace(/\D/g, ""), 10),
    );
  }, [sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead kicker="Administratie">Jouw facturen</SectionHead>
        <Button tone={T.clay}>
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: T.sage, Icon: Check },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: T.clay, Icon: Clock },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: T.amber, Icon: FileText },
        ].map((s) => (
          <Dossier key={s.l} className="p-5" spine={s.tone.base}>
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[7px]"
                style={{ background: s.tone.soft, color: s.tone.deep }}
                aria-hidden="true"
              >
                <s.Icon size={16} />
              </span>
              <Chip tone={s.tone}>{s.l}</Chip>
            </div>
            <p className="mt-3 text-[24px] font-semibold" style={{ color: C.ink, ...num }}>
              {s.v}
            </p>
            <p className="mt-0.5 text-[11.5px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </Dossier>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            tone={T.clay}
            variant={sort === s ? "solid" : "ghost"}
            onClick={() => setSort(s)}
          >
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Button>
        ))}
      </div>

      <Dossier className="overflow-hidden">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Klant", "Nummer", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: C.inkMute, textAlign: h === "Bedrag" ? "right" : "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const { tone, Icon } = factuurTone(f.status);
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.lineSoft}` }}>
                  <td className="px-4 py-3 text-[13.5px] font-semibold" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: C.inkMute, ...num }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[13.5px] font-semibold"
                    style={{ color: C.ink, ...num }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-4 py-3">
                    <Chip tone={tone} Icon={Icon}>
                      {f.status}
                    </Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Dossier>
    </div>
  );
}
