"use client";

// Concept 507 — "Luwte" · Radicale clarity-minimalism. Redactioneel, kalm en ademend:
// warm papier, veel witruimte, grote rustige serif-koppen op ingetogen inkt. Eén-ding-tegelijk
// focusflow — elk scherm opent met precies één vraag ("wat moet ik nu doen?") en één antwoord.
// Secundaire meta blijft in de luwte tot je erbij bent (verschijnt bij hover/focus). Geen
// gradients, geen glas, geen drukte. Status altijd met label + icoon, nooit enkel kleur.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  Hourglass,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkle,
  TriangleAlert,
  Wallet,
  X,
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

// — Palet: warm papier, diepe inkt, één kalme mos-accent. Status ontzadigd voor rust. —
const C = {
  paper: "#f5f4ef",
  paperRaised: "#fbfaf6",
  paperSunk: "#eeece4",
  line: "#e2dfd5",
  lineSoft: "#ebe8df",

  ink: "#211f1a",
  inkSoft: "#4f4d45",
  inkMute: "#7c7a70",
  inkFaint: "#a6a498",

  accent: "#3f6b57",
  accentSoft: "#eaf0eb",

  verified: "#3f6b4f",
  submitted: "#456a86",
  expiring: "#9a6b24",
  rejected: "#9d4a3f",
};

const serif = {
  fontFamily:
    "'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'Times New Roman', ui-serif, serif",
};
const sans = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
};
const num = { ...sans, fontVariantNumeric: "tabular-nums" as const };

type Tone = { base: string; soft: string; label: string; Icon: LucideIcon; alarm: boolean };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return {
        base: C.verified,
        soft: "rgba(63,107,79,0.10)",
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
      };
    case "SUBMITTED":
      return {
        base: C.submitted,
        soft: "rgba(69,106,134,0.10)",
        label: "In beoordeling",
        Icon: Hourglass,
        alarm: false,
      };
    case "EXPIRING":
      return {
        base: C.expiring,
        soft: "rgba(154,107,36,0.12)",
        label: "Verloopt bijna",
        Icon: TriangleAlert,
        alarm: true,
      };
    case "REJECTED":
      return {
        base: C.rejected,
        soft: "rgba(157,74,63,0.10)",
        label: "Afgewezen",
        Icon: X,
        alarm: true,
      };
  }
}

// — Ingetogen tekstknop met kalme onderstreep-reveal; solid variant is rustig gevuld. —
function Btn({
  children,
  onClick,
  variant = "solid",
  size = "md",
  className = "",
  ariaLabel,
  ariaExpanded,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "quiet";
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const pad = size === "sm" ? "px-4 py-2 text-[13px]" : "px-6 py-3 text-[14px]";
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const ring = "focus-visible:ring-[#3f6b57] focus-visible:ring-offset-[#f5f4ef]";
  let style: React.CSSProperties;
  let extra = "";
  if (variant === "solid") {
    style = { background: C.ink, color: C.paperRaised };
    extra = "hover:-translate-y-px";
  } else if (variant === "outline") {
    style = { background: "transparent", color: C.ink, border: `1px solid ${C.line}` };
    extra = "hover:border-[#c9c6ba]";
  } else {
    style = { background: "transparent", color: C.inkSoft };
    extra = "hover:text-[#211f1a]";
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={`${base} ${pad} ${ring} ${extra} ${className}`}
      style={{ ...style, ...sans }}
    >
      {children}
    </button>
  );
}

function StatusChip({ base, soft, label, Icon, alarm }: Tone) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ color: base, background: soft, ...sans }}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
      {alarm && <span className="sr-only"> (vraagt aandacht)</span>}
    </span>
  );
}

// — Uiterst dunne, kalme sparkline; verschijnt alleen als ondersteunend detail. —
function Spark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 72;
  const h = 22;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 2 - ((d - min) / span) * (h - 4)] as const);
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
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      <circle cx={last[0]} cy={last[1]} r="1.8" fill={tone} />
    </svg>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] font-medium uppercase tracking-[0.24em]"
      style={{ color: C.inkFaint, ...sans }}
    >
      {children}
    </span>
  );
}

// — Grote, rustige match-uitdrukking: een serif-getal in plaats van een ring. —
function MatchMark({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const strong = value >= 90;
  const px = size === "lg" ? 46 : size === "md" ? 34 : 26;
  return (
    <span className="inline-flex items-baseline gap-1" aria-label={`Match ${value} procent`}>
      <span
        className="font-normal leading-none"
        style={{ color: strong ? C.accent : C.ink, fontSize: px, ...serif }}
      >
        {value}
      </span>
      <span className="text-[12px] font-normal" style={{ color: C.inkFaint, ...sans }}>
        %
      </span>
    </span>
  );
}

function Hairline({ className = "" }: { className?: string }) {
  return (
    <div className={`h-px w-full ${className}`} style={{ background: C.line }} aria-hidden="true" />
  );
}

// —————————————————————————————————— Root ——————————————————————————————————
export function Concept507() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="lw-root min-h-[760px] w-full antialiased"
      style={{ ...sans, color: C.ink, background: C.paper }}
    >
      <div className="mx-auto max-w-4xl px-5 sm:px-8 md:px-10">
        <TopBar />
        <NavBar screen={screen} setScreen={setScreen} />
        <main key={screen} className="lw-fade pb-24 pt-10 sm:pt-14">
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
          {screen === "acties" && <Acties onMarkt={() => setScreen("marktplaats")} />}
          {screen === "facturen" && <Facturen />}
        </main>
      </div>

      <style>{`
        @keyframes lwFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .lw-fade { animation: lwFade 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .lw-reveal { opacity: 0; transition: opacity 0.35s ease; }
        .lw-hoverable:hover .lw-reveal, .lw-hoverable:focus-within .lw-reveal { opacity: 1; }
        .lw-underline { background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px; background-repeat: no-repeat; background-position: 0 100%; transition: background-size 0.35s ease; }
        .lw-hoverable:hover .lw-underline, .lw-link:hover .lw-underline { background-size: 100% 1px; }
        @media (prefers-reduced-motion: reduce) {
          .lw-fade { animation: none; }
          .lw-reveal { opacity: 1; }
          .lw-underline { transition: none; }
        }
      `}</style>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between pt-8 sm:pt-10">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${C.line}`, color: C.accent }}
          aria-hidden="true"
        >
          <Sparkle size={16} />
        </span>
        <span
          className="text-[15px] font-normal tracking-[-0.01em]"
          style={{ ...serif, color: C.ink }}
        >
          Luwte
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 text-[12px] font-medium sm:inline-flex"
          style={{ color: C.accent }}
        >
          <ShieldCheck size={13} aria-hidden="true" /> {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-medium"
          style={{ background: C.paperSunk, color: C.inkSoft }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-7">
      <ul
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4"
        style={{ borderColor: C.line }}
      >
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="lw-link group inline-flex items-center gap-2 rounded-sm py-1 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ef]"
                style={{ color: on ? C.ink : C.inkMute, fontWeight: on ? 500 : 400, ...sans }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-all"
                  style={{ background: on ? C.accent : "transparent", opacity: on ? 1 : 0 }}
                  aria-hidden="true"
                />
                <span className="lw-underline">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
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
  const voornaam = PROFIEL.naam.split(" ")[0];

  return (
    <div className="space-y-16">
      {/* Focusflow: één vraag, één antwoord — de rest wacht in de luwte. */}
      <section>
        <Kicker>Vandaag · {PROFIEL.plaats}</Kicker>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-normal leading-[1.12] tracking-[-0.01em] sm:text-[46px]"
          style={{ ...serif, color: C.ink }}
        >
          Goedemorgen, {voornaam}.
        </h1>
        <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Je dossier is op orde en er staan verse opdrachten klaar. Er is vandaag precies één ding
          dat je aandacht vraagt.
        </p>
      </section>

      {/* Hét ene ding */}
      <section aria-labelledby="primaire-actie">
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{ background: C.paperRaised, border: `1px solid ${C.line}` }}
        >
          <div className="flex items-center gap-2" style={{ color: C.expiring }}>
            <TriangleAlert size={15} aria-hidden="true" />
            <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
              Vraagt aandacht
            </span>
          </div>
          <h2
            id="primaire-actie"
            className="mt-4 max-w-xl text-[24px] font-normal leading-snug sm:text-[28px]"
            style={{ ...serif, color: C.ink }}
          >
            {primair.titel}
          </h2>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Btn variant="solid" onClick={onActies}>
              {primair.cta} <ArrowRight size={15} aria-hidden="true" />
            </Btn>
            <Btn variant="quiet" onClick={onActies}>
              Alle taken bekijken
            </Btn>
          </div>
        </div>
      </section>

      {/* Rustige cijfers — spark verschijnt pas bij aandacht */}
      <section aria-labelledby="cijfers">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id="cijfers" className="text-[15px] font-medium" style={{ color: C.ink }}>
            Je maand in het kort
          </h2>
          <Kicker>Overzicht</Kicker>
        </div>
        <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {KPIS.map((k) => {
            const tone = k.up ? C.accent : C.expiring;
            return (
              <div key={k.label} className="lw-hoverable pr-4">
                <p className="text-[12px]" style={{ color: C.inkMute }}>
                  {k.label}
                </p>
                <p
                  className="mt-2 text-[30px] font-normal leading-none"
                  style={{ ...serif, color: C.ink }}
                >
                  {k.value}
                </p>
                <div className="mt-3 flex h-6 items-center gap-3">
                  <span className="text-[12px] font-medium" style={{ color: tone, ...num }}>
                    {k.up ? "↑" : "↓"} {k.trend}
                  </span>
                  <span className="lw-reveal">
                    <Spark data={k.spark} tone={tone} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Hairline />

      {/* Aanbevolen opdrachten — minimalistische regels */}
      <section aria-labelledby="matches">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id="matches" className="text-[15px] font-medium" style={{ color: C.ink }}>
            Opdrachten voor jou
          </h2>
          <button
            type="button"
            onClick={onMarkt}
            className="lw-link inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#211f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ef]"
            style={{ color: C.inkMute }}
          >
            <span className="lw-underline">Naar marktplaats</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
        <ul>
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              {i > 0 && <Hairline className="opacity-70" />}
              <QuietRow opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </section>

      {/* Dossier in de luwte */}
      <section aria-labelledby="dossier">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 id="dossier" className="text-[15px] font-medium" style={{ color: C.ink }}>
            Je dossier
          </h2>
          <button
            type="button"
            onClick={onVerif}
            className="lw-link inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#211f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ef]"
            style={{ color: C.inkMute }}
          >
            <span className="lw-underline">Naar verificatie</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-[40px] font-normal leading-none" style={{ ...serif, color: C.ink }}>
            {ratio}%
          </span>
          <span className="text-[13.5px]" style={{ color: C.inkMute }}>
            op orde · {verified} van {CREDENTIALS.length} certificaten geverifieerd
          </span>
        </div>
        <div
          className="mt-4 h-1 w-full overflow-hidden rounded-full"
          style={{ background: C.paperSunk }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: C.accent,
              transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </section>
    </div>
  );
}

function QuietRow({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="lw-hoverable group flex w-full items-center gap-5 rounded-lg py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5f4ef]"
    >
      <MatchMark value={opdracht.match} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium" style={{ color: C.ink }}>
          {opdracht.titel}
        </span>
        <span className="mt-1 block truncate text-[13px]" style={{ color: C.inkMute }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
          <span className="lw-reveal">
            {" "}
            · {opdracht.uren} · {opdracht.start}
          </span>
        </span>
      </span>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-[15px] font-normal" style={{ ...serif, color: C.ink }}>
          {opdracht.tarief.replace(" / uur", "")}
        </span>
        <span className="text-[11px]" style={{ color: C.inkFaint }}>
          per uur
        </span>
      </span>
      <ArrowRight
        size={17}
        aria-hidden="true"
        className="shrink-0 transition-transform group-hover:translate-x-1"
        style={{ color: C.inkFaint }}
      />
    </button>
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
    <div className="space-y-10">
      <header>
        <Kicker>Marktplaats</Kicker>
        <h1
          className="mt-4 text-[32px] font-normal leading-tight tracking-[-0.01em] sm:text-[40px]"
          style={{ ...serif, color: C.ink }}
        >
          Opdrachten die bij je passen
        </h1>
        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          {filtered.length} van {OPDRACHTEN.length} opdrachten sluiten aan op je geverifieerde
          profiel. Rustig gerangschikt, zonder ruis.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-1 items-center gap-3 rounded-full px-5 py-3"
          style={{ background: C.paperRaised, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a6a498]"
            style={{ color: C.ink }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Zoekterm wissen"
              className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[#eeece4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57]"
              style={{ color: C.inkMute }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <Btn
              key={s}
              size="sm"
              variant={sort === s ? "solid" : "outline"}
              onClick={() => setSort(s)}
            >
              {s === "match" ? "Beste match" : "Hoogste tarief"}
            </Btn>
          ))}
        </div>
      </div>

      {mode === "loading" ? (
        <ul className="space-y-6" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-2xl p-8" style={{ border: `1px solid ${C.lineSoft}` }}>
              <div className="space-y-4">
                <div
                  className="h-5 w-2/3 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.paperSunk }}
                />
                <div
                  className="h-3.5 w-1/2 animate-pulse rounded-full motion-reduce:animate-none"
                  style={{ background: C.paperSunk }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : mode === "error" ? (
        <StateBlock
          Icon={TriangleAlert}
          tone={C.rejected}
          titel="De lijst kon niet worden geladen"
          tekst="De opdrachten konden zojuist niet worden opgehaald. Neem even rust en probeer opnieuw."
          cta="Opnieuw proberen"
          onCta={() => setMode("ok")}
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          Icon={Search}
          tone={C.accent}
          titel="Niets gevonden"
          tekst={`Er is geen opdracht voor ${q ? `“${q}”` : "je zoekterm"}. Verruim je zoekopdracht.`}
          cta="Zoekterm wissen"
          onCta={() => setQ("")}
        />
      ) : (
        <ul className="space-y-6">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktKaart opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-6 pt-2">
        {(["loading", "error"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(mode === m ? "ok" : m)}
            className="rounded-sm text-[11px] uppercase tracking-[0.16em] underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57]"
            style={{ color: C.inkFaint }}
          >
            {m === "loading" ? "laadstaat" : "foutstaat"}
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
  tone,
}: {
  Icon: LucideIcon;
  titel: string;
  tekst: string;
  cta: string;
  onCta: () => void;
  tone: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ color: tone, border: `1px solid ${C.line}` }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <p className="mt-6 text-[22px] font-normal" style={{ ...serif, color: C.ink }}>
        {titel}
      </p>
      <p className="mt-3 max-w-sm text-[14px] leading-relaxed" style={{ color: C.inkSoft }}>
        {tekst}
      </p>
      <Btn variant="outline" className="mt-6" onClick={onCta}>
        {cta}
      </Btn>
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
    <article
      className="rounded-2xl p-7 transition-shadow duration-300 sm:p-9"
      style={{ background: C.paperRaised, border: `1px solid ${C.line}` }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: strong ? C.accent : C.inkMute }}
            >
              {strong ? "Sterke match" : "Goede match"}
            </span>
            <span className="text-[11px]" style={{ color: C.inkFaint, ...num }}>
              {opdracht.id} · #{String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h2
            className="mt-3 text-[22px] font-normal leading-snug sm:text-[25px]"
            style={{ ...serif, color: C.ink }}
          >
            {opdracht.titel}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-[13.5px]" style={{ color: C.inkMute }}>
            <MapPin size={13} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats} ·{" "}
            {opdracht.uren}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <MatchMark value={opdracht.match} size="lg" />
          <p className="mt-2 text-[14px] font-normal" style={{ ...serif, color: C.ink }}>
            {opdracht.tarief.replace(" / uur", "")}
            <span className="text-[11px]" style={{ color: C.inkFaint, ...sans }}>
              {" "}
              /uur
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {opdracht.tags.map((t) => (
          <span
            key={t}
            className="rounded-full px-3 py-1 text-[12px]"
            style={{ background: C.paperSunk, color: C.inkSoft }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="lw-link inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-[#211f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf6]"
          style={{ color: C.accent }}
        >
          <span className="lw-underline">Waarom deze match</span>
        </button>
        <Btn variant="solid" size="sm" onClick={onOpen}>
          Reageren <ArrowRight size={14} aria-hidden="true" />
        </Btn>
      </div>

      <div
        className="grid transition-all duration-500 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-6 grid grid-cols-1 gap-8 border-t pt-6 sm:grid-cols-2"
            style={{ borderColor: C.line }}
          >
            <RedenKolom
              titel="In je voordeel"
              tone={C.verified}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Goed om te weten"
              tone={C.expiring}
              Icon={TriangleAlert}
              items={opdracht.redenen.min}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function RedenKolom({
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
        className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]"
        style={{ color: tone }}
      >
        <Icon size={13} aria-hidden="true" /> {titel}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-3 text-[14px] leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full"
              style={{ background: tone }}
              aria-hidden="true"
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
  const meta: { l: string; v: string; Icon: LucideIcon }[] = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet },
    { l: "Omvang", v: opdracht.uren, Icon: Clock },
    { l: "Aanvang", v: opdracht.start, Icon: CalendarDays },
    { l: "Match", v: `${opdracht.match}%`, Icon: BadgeCheck },
  ];
  return (
    <div className="space-y-12">
      <button
        type="button"
        onClick={onBack}
        className="lw-link inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#211f1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f4ef]"
        style={{ color: C.inkMute }}
      >
        <ChevronLeft size={15} aria-hidden="true" />
        <span className="lw-underline">Terug naar marktplaats</span>
      </button>

      <header>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: strong ? C.accent : C.inkMute }}
          >
            {strong ? "Sterke match" : "Goede match"}
          </span>
          <span className="h-3 w-px" style={{ background: C.line }} aria-hidden="true" />
          <span className="text-[12px]" style={{ color: C.inkFaint, ...num }}>
            {opdracht.id}
          </span>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[34px] font-normal leading-[1.12] tracking-[-0.01em] sm:text-[44px]"
          style={{ ...serif, color: C.ink }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-4 flex items-center gap-1.5 text-[15px]" style={{ color: C.inkMute }}>
          <MapPin size={15} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Btn variant="solid">
            Reageren op opdracht <ArrowRight size={15} aria-hidden="true" />
          </Btn>
          <Btn variant="outline">Bewaren voor later</Btn>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {meta.map((m) => (
          <div key={m.l}>
            <p
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ color: C.inkFaint }}
            >
              <m.Icon size={13} aria-hidden="true" /> {m.l}
            </p>
            <p className="mt-2 text-[19px] font-normal" style={{ ...serif, color: C.ink }}>
              {m.v}
            </p>
          </div>
        ))}
      </section>

      <Hairline />

      <section>
        <Kicker>Motivering</Kicker>
        <h2
          className="mt-4 text-[24px] font-normal leading-snug sm:text-[28px]"
          style={{ ...serif, color: C.ink }}
        >
          Waarom deze match bij je past
        </h2>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Afgezet tegen je geverifieerde profiel — open en navolgbaar, zonder verborgen score. Wat
          in je voordeel spreekt, en wat goed is om vooraf te weten.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          <RedenKolom
            titel="In je voordeel"
            tone={C.verified}
            Icon={Check}
            items={opdracht.redenen.plus}
          />
          <RedenKolom
            titel="Goed om te weten"
            tone={C.expiring}
            Icon={TriangleAlert}
            items={opdracht.redenen.min}
          />
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
    <div className="space-y-12">
      <header>
        <Kicker>Vertrouwensregister</Kicker>
        <h1
          className="mt-4 text-[32px] font-normal leading-tight tracking-[-0.01em] sm:text-[42px]"
          style={{ ...serif, color: C.ink }}
        >
          {PROFIEL.trust}
        </h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          {verified} van de {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt bijna
          — tijdig vernieuwen houdt je dossier compleet. Alles wordt versleuteld bewaard en
          uitsluitend met jouw toestemming gedeeld.
        </p>
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-[40px] font-normal leading-none" style={{ ...serif, color: C.ink }}>
            {ratio}%
          </span>
          <span className="text-[13px]" style={{ color: C.inkMute }}>
            dossier op orde
          </span>
        </div>
        <div
          className="mt-4 h-1 w-full overflow-hidden rounded-full"
          style={{ background: C.paperSunk }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${ratio}%`,
              background: C.accent,
              transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
      </header>

      <section aria-labelledby="certificaten">
        <h2 id="certificaten" className="mb-2 text-[15px] font-medium" style={{ color: C.ink }}>
          Certificaten
        </h2>
        <ul>
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const isOpen = open === c.naam;
            return (
              <li key={c.naam}>
                {i > 0 && <Hairline className="opacity-70" />}
                <div>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : c.naam)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 rounded-lg py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f6b57] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5f4ef]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: t.soft, color: t.base }}
                      aria-hidden="true"
                    >
                      <t.Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[16px] font-medium"
                        style={{ color: C.ink }}
                      >
                        {c.naam}
                      </span>
                      <span
                        className="mt-0.5 block truncate text-[12.5px]"
                        style={{ color: C.inkMute }}
                      >
                        {c.detail}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex">
                      <StatusChip {...t} />
                    </span>
                    <span
                      className="text-[18px] transition-transform motion-reduce:transition-none"
                      style={{ color: C.inkFaint, transform: isOpen ? "rotate(45deg)" : "none" }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-500 motion-reduce:transition-none"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-6 sm:pl-14">
                        <span className="mb-3 inline-flex sm:hidden">
                          <StatusChip {...t} />
                        </span>
                        <p
                          className="max-w-xl text-[13.5px] leading-relaxed"
                          style={{ color: C.inkSoft }}
                        >
                          {c.detail}. Het document wordt versleuteld bewaard en uitsluitend na jouw
                          toestemming gedeeld met een opdrachtgever.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <Btn size="sm" variant="solid">
                            {c.status === "EXPIRING"
                              ? "Vernieuwen"
                              : c.status === "REJECTED"
                                ? "Opnieuw indienen"
                                : "Bekijken"}
                          </Btn>
                          <Btn size="sm" variant="quiet">
                            Historie
                          </Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="documentenkast">
        <h2 id="documentenkast" className="mb-5 text-[15px] font-medium" style={{ color: C.ink }}>
          Documentenkast
        </h2>
        <ul className="space-y-4">
          {DOCUMENTEN.map((d) => {
            const t = credTone(d.status);
            return (
              <li
                key={d.naam}
                className="flex items-center gap-4 rounded-xl px-5 py-4"
                style={{ background: C.paperRaised, border: `1px solid ${C.lineSoft}` }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: C.paperSunk, color: C.inkSoft }}
                  aria-hidden="true"
                >
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium" style={{ color: C.ink }}>
                    {d.naam}
                  </span>
                  <span className="block text-[11.5px]" style={{ color: C.inkMute, ...num }}>
                    {d.type} · {d.grootte} · bijgewerkt {d.bijgewerkt}
                  </span>
                </span>
                <StatusChip {...t} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// —————————————————————————————————— Acties ——————————————————————————————————
function Acties({ onMarkt }: { onMarkt: () => void }) {
  return (
    <div className="space-y-10">
      <header>
        <Kicker>Agenda</Kicker>
        <h1
          className="mt-4 text-[32px] font-normal leading-tight tracking-[-0.01em] sm:text-[42px]"
          style={{ ...serif, color: C.ink }}
        >
          Wat vandaag je aandacht vraagt
        </h1>
        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Op volgorde van urgentie. Werk rustig van boven naar beneden — één ding tegelijk.
        </p>
      </header>

      <ol>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.expiring : C.submitted;
          const goMarkt = a.cta.toLowerCase().includes("match");
          return (
            <li key={a.titel}>
              {i > 0 && <Hairline className="opacity-70" />}
              <div className="flex items-start gap-5 py-7">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-normal"
                  style={{ border: `1px solid ${C.line}`, color: C.inkMute, ...serif }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em]"
                    style={{ color: tone }}
                  >
                    {warn ? (
                      <TriangleAlert size={12} aria-hidden="true" />
                    ) : (
                      <Clock size={12} aria-hidden="true" />
                    )}
                    {warn ? "Urgent" : "Aanbevolen"}
                  </span>
                  <h2
                    className="mt-2 text-[19px] font-normal leading-snug"
                    style={{ ...serif, color: C.ink }}
                  >
                    {a.titel}
                  </h2>
                  <p
                    className="mt-2 max-w-lg text-[14px] leading-relaxed"
                    style={{ color: C.inkSoft }}
                  >
                    {a.detail}
                  </p>
                  <div className="mt-4">
                    <Btn
                      variant={warn ? "solid" : "outline"}
                      size="sm"
                      onClick={goMarkt ? onMarkt : undefined}
                    >
                      {a.cta} <ArrowRight size={14} aria-hidden="true" />
                    </Btn>
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

// —————————————————————————————————— Facturen ——————————————————————————————————
function factuurTone(status: string): { base: string; label: string } {
  if (status === "Betaald") return { base: C.verified, label: status };
  if (status === "Openstaand") return { base: C.expiring, label: status };
  if (status === "Concept") return { base: C.submitted, label: status };
  return { base: C.rejected, label: status };
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

  const totalen = [
    { l: "Betaald", v: "€ 5.552", sub: "2 facturen", tone: C.verified },
    { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", tone: C.expiring },
    { l: "Concept", v: "€ 880", sub: "klaar om te versturen", tone: C.submitted },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Grootboek</Kicker>
          <h1
            className="mt-4 text-[32px] font-normal leading-tight tracking-[-0.01em] sm:text-[42px]"
            style={{ ...serif, color: C.ink }}
          >
            Je facturen
          </h1>
        </div>
        <Btn variant="solid">
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </Btn>
      </header>

      <section className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
        {totalen.map((s) => (
          <div key={s.l}>
            <p className="flex items-center gap-2 text-[12px]" style={{ color: C.inkMute }}>
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s.tone }}
                aria-hidden="true"
              />
              {s.l}
            </p>
            <p className="mt-2 text-[28px] font-normal" style={{ ...serif, color: C.ink }}>
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.inkMute }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2" role="group" aria-label="Facturen sorteren">
        {(["datum", "bedrag"] as const).map((s) => (
          <Btn
            key={s}
            size="sm"
            variant={sort === s ? "solid" : "outline"}
            onClick={() => setSort(s)}
          >
            {s === "datum" ? "Op datum" : "Op bedrag"}
          </Btn>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: 560 }}>
          <caption className="sr-only">Overzicht van facturen</caption>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {["Nummer", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-2 py-3 text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: C.inkFaint }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const t = factuurTone(f.status);
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#fbfaf6]"
                  style={{ borderBottom: `1px solid ${C.lineSoft}` }}
                >
                  <td className="px-2 py-4 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
                    {f.nr}
                  </td>
                  <td className="px-2 py-4 text-[14px] font-medium" style={{ color: C.ink }}>
                    {f.klant}
                  </td>
                  <td className="px-2 py-4 text-[12.5px]" style={{ color: C.inkMute, ...num }}>
                    {f.datum}
                  </td>
                  <td
                    className="px-2 py-4 text-[15px] font-normal"
                    style={{ ...serif, color: C.ink, fontVariantNumeric: "tabular-nums" }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium"
                      style={{ color: t.base }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: t.base }}
                        aria-hidden="true"
                      />
                      {t.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
