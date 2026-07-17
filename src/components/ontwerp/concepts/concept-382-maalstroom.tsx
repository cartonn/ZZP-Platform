"use client";

// Concept 382 — "Maalstroom" · Kleurrijk & kinetisch, radiale energie.
// Lichte crème basis met levendige radiale/conische verlopen en een draaikolk-motief in de
// decoratie; ronde vormen, energieke maar beheerste kleuren, speelse micro-interacties.
// Speels maar strak — geen templategevoel: kleur is doelgericht (status, match, urgentie), nooit rommel.
// Palet: crème/wit (#fbf7f0), accent-trio koraal (#ff5a5f), indigo (#4f46e5), citroen (#f5b100), beheerst ingezet.
// Fonts: Bricolage Grotesque (koppen) + Space Grotesk (UI).

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  MapPin,
  Wallet,
  CalendarClock,
  Gauge,
  Sparkle,
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

// — Palet: crème basis met levendig accent-trio —
const C = {
  cream: "#fbf7f0",
  creamAlt: "#f4eee2",
  card: "#ffffff",
  ink: "#221a2e",
  inkSoft: "#4a4157",
  muted: "#736c81",
  faint: "#a09aad",
  line: "rgba(34,26,46,0.10)",
  lineSoft: "rgba(34,26,46,0.06)",
  coral: "#ff5a5f",
  coralSoft: "#ffe1e0",
  indigo: "#4f46e5",
  indigoSoft: "#e5e3fb",
  lemon: "#f5b100",
  lemonSoft: "#fdefc7",
  mint: "#12b886",
  mintSoft: "#d6f5ea",
};

const head = { fontFamily: "var(--font-lab-bricolage), system-ui, sans-serif" };
const body = { fontFamily: "var(--font-lab-space), system-ui, sans-serif" };

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  tone: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return {
        label: "Geverifieerd",
        Icon: ShieldCheck,
        alarm: false,
        tone: C.mint,
        soft: C.mintSoft,
      };
    case "SUBMITTED":
      return {
        label: "In beoordeling",
        Icon: Clock,
        alarm: false,
        tone: C.indigo,
        soft: C.indigoSoft,
      };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        tone: C.lemon,
        soft: C.lemonSoft,
      };
    case "REJECTED":
      return { label: "Afgewezen", Icon: XCircle, alarm: true, tone: C.coral, soft: C.coralSoft };
  }
}

// — Draaikolk-motief: conische ringen die naar het centrum spiralen —
function Whirl({ size = 120, className = "" }: { size?: number; className?: string }) {
  const rings = [
    { r: 46, tone: C.coral, w: 7, dash: "10 14" },
    { r: 34, tone: C.indigo, w: 6, dash: "8 12" },
    { r: 23, tone: C.lemon, w: 5, dash: "6 10" },
    { r: 13, tone: C.mint, w: 4, dash: "4 8" },
  ];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`motion-safe:animate-[spin_28s_linear_infinite] ${className}`}
    >
      {rings.map((ring, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={ring.r}
          fill="none"
          stroke={ring.tone}
          strokeWidth={ring.w}
          strokeLinecap="round"
          strokeDasharray={ring.dash}
          opacity={0.9 - i * 0.12}
        />
      ))}
      <circle cx="50" cy="50" r="4" fill={C.ink} />
    </svg>
  );
}

// — Radiale energie-achtergrond —
function RadialField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -left-[8%] -top-[12%] h-[440px] w-[440px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(255,90,95,0.16), transparent 70%)" }}
      />
      <div
        className="absolute right-[-6%] top-[18%] h-[380px] w-[380px] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(79,70,229,0.14), transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-14%] left-[36%] h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(245,177,0,0.12), transparent 72%)" }}
      />
    </div>
  );
}

function Card({
  children,
  className = "",
  tint,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: string;
}) {
  return (
    <div
      className={`relative rounded-[26px] ${className}`}
      style={{
        background: tint ?? C.card,
        border: `1px solid ${C.line}`,
        boxShadow: "0 22px 48px -34px rgba(34,26,46,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function Overline({ children, tone = C.coral }: { children: React.ReactNode; tone?: string }) {
  return (
    <p
      className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
      style={{ color: tone, ...body }}
    >
      {children}
    </p>
  );
}

function Pill({
  children,
  tone = C.inkSoft,
  soft = C.creamAlt,
  solid = false,
}: {
  children: React.ReactNode;
  tone?: string;
  soft?: string;
  solid?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ color: solid ? "#fff" : tone, background: solid ? tone : soft, ...body }}
    >
      {children}
    </span>
  );
}

// — Speelse sparkline: bolletjes langs een golf —
function DotSpark({ data, tone }: { data: number[]; tone: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 120;
  const h = 34;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 8) - 4;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={line}
        fill="none"
        stroke={tone}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.4 : 1.8} fill={tone} />
      ))}
    </svg>
  );
}

// — Match-donut met conisch verloop —
function MatchDonut({ value, size = 58 }: { value: number; size?: number }) {
  const strong = value >= 90;
  const tone = strong ? C.coral : C.indigo;
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${tone} ${value * 3.6}deg, ${C.lineSoft} 0deg)` }}
        aria-hidden="true"
      />
      <span
        className="absolute rounded-full"
        style={{ inset: 5, background: C.card }}
        aria-hidden="true"
      />
      <span
        className="relative text-[13px] font-bold tabular-nums"
        style={{ color: tone, ...head }}
      >
        {value}
      </span>
    </span>
  );
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf7f0]";

export function Concept382() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="relative min-h-[720px] w-full overflow-hidden antialiased"
      style={{ ...body, color: C.ink, background: C.cream }}
    >
      <RadialField />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
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
    <header className="flex items-center justify-between pt-6">
      <div className="flex items-center gap-3.5">
        <span className="relative h-12 w-12" aria-hidden="true">
          <Whirl size={48} />
        </span>
        <div>
          <p className="text-[22px] font-extrabold leading-none tracking-[-0.02em]" style={head}>
            Maalstroom
          </p>
          <p
            className="mt-1 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em]"
            style={{ color: C.faint }}
          >
            Alles in beweging · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold sm:inline-flex"
          style={{ color: C.mint, background: C.mintSoft }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-bold" style={{ color: C.ink }}>
            {PROFIEL.naam}
          </span>
          <span className="block text-[10.5px]" style={{ color: C.faint }}>
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
          style={{
            background: "conic-gradient(from 210deg, #ff5a5f, #4f46e5, #f5b100, #ff5a5f)",
            ...head,
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
    <nav className="mt-6" aria-label="Hoofdnavigatie">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SCREENS.map((s) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all motion-reduce:transition-none ${focusRing}`}
              style={{
                color: on ? "#fff" : C.inkSoft,
                background: on ? C.ink : C.card,
                border: `1px solid ${on ? C.ink : C.line}`,
                boxShadow: on ? "0 10px 22px -12px rgba(34,26,46,0.6)" : "none",
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
  const ongelezen = BERICHTEN.filter((b) => b.ongelezen).length;
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Vandaag</Overline>
          <h1
            className="mt-3 text-[42px] font-extrabold leading-[0.98] tracking-[-0.03em] md:text-[56px]"
            style={head}
          >
            Goedemorgen,{" "}
            <span
              style={{
                background: "linear-gradient(100deg, #ff5a5f, #4f46e5)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {PROFIEL.naam.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
            De stroom draait op volle kracht: drie opdrachten trekken je vandaag naar het centrum.
            Zet eerst de acties in beweging die aandacht vragen.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onActies}
              className={`group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.ink }}
            >
              Volgende actie
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold"
              style={{ color: C.inkSoft, background: C.card, border: `1px solid ${C.line}` }}
            >
              <Zap size={14} aria-hidden="true" style={{ color: C.lemon }} />
              {ongelezen} nieuwe berichten
            </span>
          </div>
        </div>

        <Card tint={C.coralSoft} className="overflow-hidden p-6">
          <span
            className="pointer-events-none absolute -right-6 -top-6 opacity-40"
            aria-hidden="true"
          >
            <Whirl size={120} />
          </span>
          <div className="relative">
            <Overline tone={C.coral}>Vraagt aandacht</Overline>
            <h2 className="mt-3 text-[23px] font-extrabold leading-snug" style={head}>
              {primair.titel}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <button
              onClick={onActies}
              className={`group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.coral }}
            >
              {primair.cta}
              <ArrowRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </button>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline tone={C.indigo}>Kerncijfers · deze maand</Overline>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: C.faint }}
          >
            live
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => {
            const tones = [C.coral, C.indigo, C.mint, C.lemon];
            const softs = [C.coralSoft, C.indigoSoft, C.mintSoft, C.lemonSoft];
            const tone = tones[i % 4] ?? C.coral;
            const soft = softs[i % 4] ?? C.coralSoft;
            return (
              <Card key={k.label} className="p-5">
                <div className="flex items-start justify-between">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: C.muted }}
                  >
                    {k.label}
                  </p>
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{ color: tone, background: soft }}
                  >
                    {k.up ? (
                      <ArrowUpRight size={12} aria-hidden="true" />
                    ) : (
                      <ArrowDownRight size={12} aria-hidden="true" />
                    )}
                    {k.trend.replace(/^[+-]/, "")}
                  </span>
                </div>
                <p
                  className="mt-3 text-[30px] font-extrabold leading-none tracking-[-0.02em]"
                  style={head}
                >
                  {k.value}
                </p>
                <div className="mt-4">
                  <DotSpark data={k.spark} tone={tone} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <Overline tone={C.mint}>Open opdrachten</Overline>
          <button
            onClick={onOpen}
            className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors hover:text-[#4f46e5] ${focusRing}`}
            style={{ color: C.indigo }}
          >
            Naar marktplaats
          </button>
        </div>
        <ul className="space-y-3">
          {OPDRACHTEN.map((o) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[22px] p-4 text-left transition-all hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${focusRing}`}
                style={{ background: C.card, border: `1px solid ${C.line}` }}
              >
                <MatchDonut value={o.match} />
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-extrabold" style={head}>
                    {o.titel}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px]" style={{ color: C.muted }}>
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  style={{ color: C.faint }}
                />
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
      <div>
        <Overline>De marktplaats</Overline>
        <h1
          className="mt-3 text-[36px] font-extrabold leading-none tracking-[-0.02em]"
          style={head}
        >
          Open opdrachten
        </h1>
        <p className="mt-3 max-w-lg text-[14px]" style={{ color: C.muted }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} opdrachten binnen je bereik en
          verificatieniveau.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 rounded-full px-4 py-2.5"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.faint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#a09aad]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div
          className="flex items-center gap-1 rounded-full p-1"
          role="group"
          aria-label="Sorteren"
          style={{ background: C.card, border: `1px solid ${C.line}` }}
        >
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-all motion-reduce:transition-none ${focusRing}`}
                style={{
                  color: on ? "#fff" : C.inkSoft,
                  background: on ? C.indigo : "transparent",
                }}
              >
                {s === "match" ? "Op match" : "Op tarief"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="opacity-70" aria-hidden="true">
              <Whirl size={96} />
            </span>
            <p className="mt-5 text-[24px] font-extrabold" style={head}>
              Geen opdracht in de stroom
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Niets past bij {q ? `“${q}”` : "je zoekterm"}. Verruim de zoekterm of wis het filter.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.ink }}
            >
              Zoekterm wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Card>
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id}>
              <OpdrachtKaart opdracht={o} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtKaart({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
        <MatchDonut value={opdracht.match} size={64} />
        <div className="min-w-0">
          <h3 className="text-[19px] font-extrabold leading-snug" style={head}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t, i) => {
              const softs = [C.coralSoft, C.indigoSoft, C.lemonSoft];
              const tones = [C.coral, C.indigo, C.lemon];
              return (
                <Pill key={t} tone={tones[i % 3]} soft={softs[i % 3]}>
                  {t}
                </Pill>
              );
            })}
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[18px] font-extrabold" style={head}>
            {opdracht.tarief.replace(" / uur", "")}
          </span>
          <span className="text-[11px]" style={{ color: C.faint }}>
            per uur
          </span>
        </div>
      </div>
      <div
        className="mt-4 flex items-center gap-4 border-t pt-3"
        style={{ borderColor: C.lineSoft }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-bold transition-colors ${focusRing}`}
          style={{ color: C.muted }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Waarom deze match
        </button>
        <button
          onClick={onOpen}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-bold transition-colors hover:text-[#ff5a5f] ${focusRing}`}
          style={{ color: C.coral }}
        >
          Bekijk opdracht <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: C.mintSoft }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.mint }}
              >
                Pluspunten
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
                      style={{ color: C.mint }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-4" style={{ background: C.lemonSoft }}>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.16em]"
                style={{ color: "#b07d00" }}
              >
                Aandachtspunten
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[13px]"
                    style={{ color: C.inkSoft }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: "#b07d00" }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const meta = [
    { l: "Tarief", v: opdracht.tarief, Icon: Wallet, tone: C.coral, soft: C.coralSoft },
    { l: "Omvang", v: opdracht.uren, Icon: Gauge, tone: C.indigo, soft: C.indigoSoft },
    { l: "Start", v: opdracht.start, Icon: CalendarClock, tone: C.mint, soft: C.mintSoft },
    { l: "Match", v: `${opdracht.match}%`, Icon: MapPin, tone: C.lemon, soft: C.lemonSoft },
  ];
  return (
    <div className="space-y-7">
      <button
        onClick={onBack}
        className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:text-[#4f46e5] ${focusRing}`}
        style={{ color: C.muted }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar marktplaats
      </button>

      <Card className="overflow-hidden p-7 md:p-10" tint={C.ink}>
        <span
          className="pointer-events-none absolute -right-8 -top-8 opacity-30"
          aria-hidden="true"
        >
          <Whirl size={160} />
        </span>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-[11px] font-semibold tracking-[0.1em]"
              style={{ color: "#c9c3d6" }}
            >
              {opdracht.id}
            </span>
            <Pill tone={C.coral} solid>
              <ShieldCheck size={12} aria-hidden="true" /> {opdracht.match}% match
            </Pill>
          </div>
          <h1
            className="mt-4 max-w-2xl text-[34px] font-extrabold leading-[1.03] tracking-[-0.02em] text-white md:text-[46px]"
            style={head}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-3 text-[15px]" style={{ color: "#c9c3d6" }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
              style={{ background: C.coral }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.24)",
              }}
            >
              Bewaar
            </button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {meta.map((m) => (
          <Card key={m.l} className="p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: m.soft }}
              aria-hidden="true"
            >
              <m.Icon size={16} style={{ color: m.tone }} />
            </span>
            <p
              className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.faint }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[20px] font-extrabold tracking-[-0.01em]" style={head}>
              {m.v}
            </p>
          </Card>
        ))}
      </section>

      <section>
        <Overline>Waarom deze match</Overline>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: C.muted }}>
          Transparant onderbouwd op je geverifieerde profiel — wat er vóór pleit én waar je op moet
          letten, zonder verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-5" tint={C.mintSoft}>
            <Overline tone={C.mint}>Pluspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px] first:border-t-0 first:pt-0"
                  style={{ borderColor: "rgba(18,184,134,0.2)", color: C.inkSoft }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.mint }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5" tint={C.lemonSoft}>
            <Overline tone="#b07d00">Aandachtspunten</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px] first:border-t-0 first:pt-0"
                  style={{ borderColor: "rgba(245,177,0,0.24)", color: C.inkSoft }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: "#b07d00" }}
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

  return (
    <div className="space-y-7">
      <Card className="overflow-hidden p-6 md:p-8">
        <span
          className="pointer-events-none absolute -right-6 -top-6 opacity-30"
          aria-hidden="true"
        >
          <Whirl size={140} />
        </span>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-md">
            <Overline>Verificatie · vertrouwensniveau</Overline>
            <h1
              className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
              style={head}
            >
              Certificaten
            </h1>
            <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: C.muted }}>
              <span className="font-bold" style={{ color: C.ink }}>
                {PROFIEL.trust}.
              </span>{" "}
              {verified} van {CREDENTIALS.length} certificaten zijn geverifieerd. Eén verloopt
              binnenkort en vraagt om vernieuwing.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="relative inline-flex h-[92px] w-[92px] items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${C.mint} ${ratio * 3.6}deg, ${C.lineSoft} 0deg)`,
                }}
                aria-hidden="true"
              />
              <span
                className="absolute rounded-full"
                style={{ inset: 8, background: C.card }}
                aria-hidden="true"
              />
              <span
                className="relative text-[24px] font-extrabold tabular-nums"
                style={{ color: C.mint, ...head }}
              >
                {ratio}
                <span className="text-[13px]">%</span>
              </span>
            </span>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                style={{ color: C.faint }}
              >
                Geverifieerd
              </p>
              <p className="text-[14px]" style={{ color: C.muted }}>
                {verified}/{CREDENTIALS.length} documenten
              </p>
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
                  className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 text-left ${focusRing}`}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: st.soft }}
                    aria-hidden="true"
                  >
                    <st.Icon size={17} style={{ color: st.tone }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-extrabold" style={head}>
                      {c.naam}
                    </span>
                    <span className="mt-0.5 block text-[12.5px]" style={{ color: C.muted }}>
                      {c.detail}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Pill tone={st.tone} soft={st.soft} solid={st.alarm}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                    </Pill>
                    <span
                      className="transition-transform motion-reduce:transition-none"
                      style={{ color: C.faint, transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
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
                    <div className="mt-3 border-t pl-14 pt-3" style={{ borderColor: C.lineSoft }}>
                      <p
                        className="max-w-xl text-[13.5px] leading-relaxed"
                        style={{ color: C.muted }}
                      >
                        {c.detail}. Documenten worden versleuteld bewaard en pas na je expliciete
                        toestemming gedeeld met een opdrachtgever.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={`rounded-full px-4 py-2 text-[12.5px] font-bold text-white transition-all ${focusRing}`}
                          style={{ background: st.alarm ? st.tone : C.ink }}
                        >
                          {c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}
                        </button>
                        <button
                          className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition-all ${focusRing}`}
                          style={{ color: C.inkSoft, background: C.creamAlt }}
                        >
                          Historie
                        </button>
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
        <h1
          className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
          style={head}
        >
          Acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Op volgorde van urgentie. Zet het bovenste als eerste in beweging.
        </p>
      </div>

      <ol className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const tone = warn ? C.coral : C.indigo;
          const soft = warn ? C.coralSoft : C.indigoSoft;
          return (
            <li key={a.titel}>
              <Card className="p-5">
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-[15px] font-extrabold tabular-nums"
                    style={{ background: soft, color: tone, ...head }}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: tone }} />
                      ) : (
                        <Sparkle size={15} aria-hidden="true" style={{ color: tone }} />
                      )}
                      <h2 className="text-[17px] font-extrabold leading-snug" style={head}>
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
                    className={`justify-self-start rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-all motion-reduce:transition-none sm:justify-self-end ${focusRing}`}
                    style={{ background: tone }}
                  >
                    {a.cta}
                  </button>
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
  const sums = [
    {
      l: "Betaald (mnd)",
      v: totaalBetaald,
      sub: "3 voldaan",
      tone: C.mint,
      soft: C.mintSoft,
      alarm: false,
    },
    {
      l: "Openstaand",
      v: "€ 1.350",
      sub: "1 factuur · 9 dagen",
      tone: C.coral,
      soft: C.coralSoft,
      alarm: true,
    },
    {
      l: "Concept",
      v: "€ 880",
      sub: "klaar om te versturen",
      tone: C.indigo,
      soft: C.indigoSoft,
      alarm: false,
    },
  ];
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Grootboek</Overline>
          <h1
            className="mt-3 text-[32px] font-extrabold leading-none tracking-[-0.02em]"
            style={head}
          >
            Facturen
          </h1>
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-bold text-white transition-all motion-reduce:transition-none ${focusRing}`}
          style={{ background: C.ink }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sums.map((s) => (
          <Card key={s.l} className="p-5" tint={s.alarm ? s.soft : undefined}>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: C.muted }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[28px] font-extrabold tracking-[-0.02em]"
              style={{ color: s.alarm ? s.tone : C.ink, ...head }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Card>
        ))}
      </section>

      <Card className="p-5">
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_9rem_6rem] gap-4 border-b pb-3 sm:grid"
          style={{ borderColor: C.line }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint }}
            >
              {h}
            </span>
          ))}
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const acc = factuurAlarm(f.status);
            const st =
              f.status === "Betaald"
                ? { tone: C.mint, soft: C.mintSoft }
                : acc
                  ? { tone: C.coral, soft: C.coralSoft }
                  : { tone: C.indigo, soft: C.indigoSoft };
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors last:border-b-0 hover:bg-[#f4eee2] sm:grid-cols-[8rem_1fr_5rem_9rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span className="order-1 text-[12px] tabular-nums" style={{ color: C.faint }}>
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[15px] font-extrabold sm:order-2"
                  style={head}
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
                  <Pill tone={st.tone} soft={st.soft} solid={acc}>
                    {acc ? (
                      <AlertTriangle size={11} aria-hidden="true" />
                    ) : (
                      <Check size={11} aria-hidden="true" />
                    )}
                    {f.status}
                  </Pill>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-extrabold tabular-nums sm:order-5"
                  style={{ color: acc ? C.coral : C.ink }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-baseline justify-between border-t pt-5"
          style={{ borderColor: C.line }}
        >
          <span
            className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
            style={{ color: C.faint }}
          >
            Totaal betaald
          </span>
          <span
            className="text-[24px] font-extrabold tabular-nums"
            style={{ ...head, color: C.mint }}
          >
            {totaalBetaald}
          </span>
        </div>
      </Card>
    </div>
  );
}
