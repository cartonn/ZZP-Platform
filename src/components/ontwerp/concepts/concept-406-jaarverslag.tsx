"use client";

// Concept 406 — "Jaarverslag" · Corporate annual-report editorial (licht).
// Een premium jaarverslag: serif-koppen, reuze tabulaire cijfers als held, financiële tabellen
// met hairline-regels, kolom-editorial, ingetogen bosgroen accent en gedrukte rust. De facturen/
// omzet-schermen schitteren. Palet: bg #fbfaf7, fg #14181a, accent diep bosgroen #0b5d3b, warm
// papier + zwarte hairlines. Fonts: Fraunces + Inter-gevoel.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ShieldCheck,
  ChevronRight,
  Bell,
  BookOpen,
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

// — Palet: warm papier, zwarte hairlines, ingetogen bosgroen —
const C = {
  paper: "#fbfaf7",
  paperAlt: "#f4f2ec",
  paperHi: "#ffffff",
  ink: "#14181a",
  inkSoft: "#3d4448",
  inkMute: "#6f767a",
  inkFaint: "#9aa0a2",
  hair: "#14181a",
  hairSoft: "rgba(20,24,26,0.14)",
  hairFaint: "rgba(20,24,26,0.08)",
  green: "#0b5d3b",
  greenSoft: "#e5efe9",
  greenMute: "#3d7a5c",
  ok: "#0b5d3b",
  okSoft: "#e5efe9",
  warn: "#8a5a12",
  warnSoft: "#f4ecdc",
  info: "#26506e",
  infoSoft: "#e3ecf2",
  bad: "#8a2f28",
  badSoft: "#f3e2e0",
  gold: "#9a7b2e",
};

const serif = {
  fontFamily: "'Fraunces', 'Playfair Display', Georgia, 'Times New Roman', serif",
};
const body = {
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};
const num = {
  fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif",
  fontVariantNumeric: "tabular-nums" as const,
};

function statusMeta(s: CredStatus): {
  label: string;
  Icon: LucideIcon;
  alarm: boolean;
  ink: string;
  soft: string;
} {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: ShieldCheck, alarm: false, ink: C.ok, soft: C.okSoft };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, alarm: false, ink: C.info, soft: C.infoSoft };
    case "EXPIRING":
      return {
        label: "Verloopt binnenkort",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.warn,
        soft: C.warnSoft,
      };
    case "REJECTED":
      return {
        label: "Afgewezen",
        Icon: AlertTriangle,
        alarm: true,
        ink: C.bad,
        soft: C.badSoft,
      };
  }
}

// — Sectiekop met romeins nummer, editorial —
function SectieKop({ nr, children }: { nr: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3" style={{ borderBottom: `1.5px solid ${C.hair}` }}>
      <span
        className="pb-2 text-[11px] font-semibold tabular-nums"
        style={{ color: C.green, ...num }}
      >
        {nr}
      </span>
      <h2
        className="pb-2 text-[13px] font-semibold uppercase tracking-[0.24em]"
        style={{ color: C.ink, ...body }}
      >
        {children}
      </h2>
    </div>
  );
}

function Rule() {
  return (
    <span className="block" style={{ borderTop: `1px solid ${C.hairSoft}` }} aria-hidden="true" />
  );
}

// — Papiervlak met hairline-rand —
function Sheet({
  children,
  className = "",
  as: Comp = "div",
  hi = false,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
  hi?: boolean;
}) {
  return (
    <Comp
      className={`relative ${className}`}
      style={{ background: hi ? C.paperHi : C.paper, border: `1px solid ${C.hairSoft}` }}
    >
      {children}
    </Comp>
  );
}

function InkButton({
  children,
  onClick,
  className = "",
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "solid" | "outline";
}) {
  const solid = variant === "solid";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] motion-reduce:transition-none ${className}`}
      style={{
        color: solid ? C.paper : C.ink,
        background: solid ? C.green : "transparent",
        border: `1.5px solid ${solid ? C.green : C.hair}`,
        ...body,
      }}
    >
      {children}
    </button>
  );
}

function Tag({ children, ink, soft }: { children: React.ReactNode; ink: string; soft: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
      style={{ color: ink, background: soft, border: `1px solid ${ink}44`, ...body }}
    >
      {children}
    </span>
  );
}

// — Editorial staafgrafiek: hairline-kolommen, jaarverslag-stijl —
function BarSeries({ data, id }: { data: number[]; id: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-9 items-end gap-[3px]" aria-hidden="true">
      {data.map((d, i) => (
        <span
          key={`${id}-${i}`}
          className="flex-1"
          style={{
            height: `${Math.max(12, (d / max) * 100)}%`,
            background: i === data.length - 1 ? C.green : C.hairSoft,
          }}
        />
      ))}
    </div>
  );
}

export function Concept406() {
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
            <Dashboard
              onOpen={() => setScreen("opdracht")}
              onFacturen={() => setScreen("facturen")}
            />
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
      className="flex items-center justify-between gap-4 pb-5 pt-8"
      style={{ borderBottom: `2px solid ${C.hair}` }}
    >
      <div className="flex items-center gap-3.5">
        <span
          className="inline-flex h-11 w-11 items-center justify-center"
          style={{ background: C.green, color: C.paper }}
          aria-hidden="true"
        >
          <BookOpen size={19} />
        </span>
        <div>
          <p
            className="text-[21px] font-semibold leading-none tracking-[-0.01em]"
            style={{ color: C.ink, ...serif }}
          >
            Jaarverslag
          </p>
          <p
            className="mt-1.5 text-[10.5px] font-semibold uppercase leading-none tracking-[0.2em]"
            style={{ color: C.inkMute, ...body }}
          >
            Boekjaar MMXXVI · {PROFIEL.plaats}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="hidden items-center gap-1.5 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] sm:inline-flex"
          style={{
            color: C.green,
            border: `1px solid ${C.green}55`,
            background: C.greenSoft,
            ...body,
          }}
        >
          <ShieldCheck size={12} aria-hidden="true" />
          {PROFIEL.trust}
        </span>
        <span
          className="relative inline-flex h-10 w-10 items-center justify-center"
          style={{ border: `1px solid ${C.hairSoft}`, color: C.inkSoft }}
          aria-label={`${ongelezen} ongelezen berichten`}
        >
          <Bell size={16} aria-hidden="true" />
          {ongelezen > 0 && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: C.green, color: C.paper, ...body }}
              aria-hidden="true"
            >
              {ongelezen}
            </span>
          )}
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-[13px] font-semibold" style={{ color: C.ink, ...serif }}>
            {PROFIEL.naam}
          </span>
          <span
            className="block text-[10px] uppercase tracking-[0.12em]"
            style={{ color: C.inkMute, ...body }}
          >
            {PROFIEL.rol}
          </span>
        </span>
        <span
          className="inline-flex h-11 w-11 items-center justify-center text-[13px] font-semibold"
          style={{ border: `1.5px solid ${C.hair}`, color: C.ink, ...serif }}
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
    <nav aria-label="Hoofdnavigatie" className="mt-1">
      <div
        className="flex items-center gap-0 overflow-x-auto"
        style={{ borderBottom: `1px solid ${C.hairSoft}` }}
      >
        {SCREENS.map((s, i) => {
          const on = s.key === screen;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setScreen(s.key)}
              aria-current={on ? "page" : undefined}
              className="relative shrink-0 px-4 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b5d3b] motion-reduce:transition-none"
              style={{ color: on ? C.ink : C.inkMute, ...body }}
            >
              <span
                className="mr-2 text-[10px] tabular-nums"
                style={{ color: on ? C.green : C.inkFaint, ...num }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
              {on && (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5"
                  style={{ background: C.green }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({ onOpen, onFacturen }: { onOpen: () => void; onFacturen: () => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: C.green, ...body }}
          >
            Directieverslag
          </p>
          <h1
            className="mt-4 text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[52px]"
            style={{ color: C.ink, ...serif }}
          >
            Een sterk
            <br />
            halfjaar voor
            <br />
            <span style={{ color: C.green }}>{PROFIEL.naam.split(" ")[0]}.</span>
          </h1>
          <p className="mt-6 max-w-md text-[14.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            De praktijk groeit gestaag: hogere matchkwaliteit, stijgende omzet en een compleet
            geverifieerd dossier. Hieronder de kerncijfers, netjes op een rij.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <InkButton onClick={onFacturen}>
              Naar het grootboek
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </InkButton>
            <InkButton onClick={onOpen} variant="outline">
              Bekijk opdrachten
            </InkButton>
          </div>
        </div>

        <Sheet className="p-6" hi>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.warn, ...body }}
          >
            Bestuursnotitie
          </p>
          <h3
            className="mt-3 text-[20px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {primair.titel}
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.inkSoft }}>
            {primair.detail}
          </p>
          <div className="mt-5">
            <InkButton onClick={onFacturen} className="w-full">
              {primair.cta}
              <ArrowRight size={14} aria-hidden="true" />
            </InkButton>
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.hairSoft}` }}>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  Geverifieerd
                </dt>
                <dd className="mt-1 text-[22px] font-semibold" style={{ color: C.green, ...num }}>
                  {verified}/{CREDENTIALS.length}
                </dd>
              </div>
              <div>
                <dt
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: C.inkMute, ...body }}
                >
                  Open reacties
                </dt>
                <dd className="mt-1 text-[22px] font-semibold" style={{ color: C.ink, ...num }}>
                  07
                </dd>
              </div>
            </dl>
          </div>
        </Sheet>
      </section>

      <section>
        <SectieKop nr="I">Kerncijfers</SectieKop>
        <div
          className="mt-5 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: C.hairSoft }}
        >
          {KPIS.map((k, i) => (
            <div key={k.label} className="p-5" style={{ background: C.paper }}>
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: C.inkMute, ...body }}
              >
                {k.label}
              </p>
              <p
                className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.01em]"
                style={{ color: C.ink, ...num }}
              >
                {k.value}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: k.up ? C.green : C.warn, ...body }}
                >
                  {k.up ? "▲" : "▼"} {k.trend.replace(/^\+/, "")}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: C.inkFaint, ...body }}
                >
                  t.o.v. vorige maand
                </span>
              </div>
              <div className="mt-3">
                <BarSeries data={k.spark} id={`kpi-${i}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectieKop nr="II">Opdrachtenregister</SectieKop>
          <div className="mt-4">
            {OPDRACHTEN.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={onOpen}
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-4 text-left transition-colors hover:bg-[#f4f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b5d3b] motion-reduce:transition-none"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
              >
                <span
                  className="text-[26px] font-semibold leading-none"
                  style={{ color: o.match >= 90 ? C.green : C.inkMute, ...num }}
                >
                  {o.match}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[15.5px] font-semibold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {o.titel}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[12px]"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {o.opdrachtgever} · {o.plaats} · {o.tarief}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  style={{ color: C.inkMute }}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectieKop nr="III">Dossier</SectieKop>
          <ul className="mt-4">
            {CREDENTIALS.map((c, i) => {
              const st = statusMeta(c.status);
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.hairSoft}` }}
                >
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center"
                    style={{ color: st.ink, background: st.soft, border: `1px solid ${st.ink}33` }}
                    aria-hidden="true"
                  >
                    <st.Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13px] font-semibold"
                      style={{ color: C.ink, ...body }}
                    >
                      {c.naam}
                    </span>
                    <span className="block truncate text-[11px]" style={{ color: st.ink, ...body }}>
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
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
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.green, ...body }}
        >
          Bijlage A
        </p>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em] md:text-[40px]"
          style={{ color: C.ink, ...serif }}
        >
          Openstaande opdrachten
        </h1>
        <p className="mt-3 text-[12.5px] tabular-nums" style={{ color: C.inkMute, ...body }}>
          {String(filtered.length).padStart(2, "0")} van{" "}
          {String(OPDRACHTEN.length).padStart(2, "0")} posten getoond
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 px-3.5 py-3"
          style={{ background: C.paperHi, border: `1px solid ${C.hairSoft}` }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.inkMute }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0a2]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className="px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7] motion-reduce:transition-none"
              style={{
                color: sort === s ? C.paper : C.ink,
                background: sort === s ? C.ink : "transparent",
                border: `1.5px solid ${C.hair}`,
                ...body,
              }}
            >
              {s === "match" ? "Match" : "Tarief"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Sheet className="px-6 py-16 text-center" hi>
          <span
            className="mx-auto inline-flex h-14 w-14 items-center justify-center"
            style={{ border: `1.5px solid ${C.hair}`, color: C.inkMute }}
            aria-hidden="true"
          >
            <Search size={22} />
          </span>
          <p className="mt-5 text-[20px] font-semibold" style={{ color: C.ink, ...serif }}>
            Geen posten gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[13px]" style={{ color: C.inkSoft, ...body }}>
            Geen opdracht komt overeen met {q ? `“${q}”` : "de zoekterm"}. Verruim de zoekterm om
            meer resultaten te tonen.
          </p>
          <div className="mt-6">
            <InkButton onClick={() => setQ("")} variant="outline">
              Zoekterm wissen
            </InkButton>
          </div>
        </Sheet>
      ) : (
        <div style={{ borderTop: `1.5px solid ${C.hair}` }}>
          {filtered.map((o) => (
            <MarktRegel key={o.id} opdracht={o} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

function MarktRegel({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const strong = opdracht.match >= 90;
  return (
    <article className="py-5" style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: C.inkMute, ...body }}
            >
              {opdracht.id}
            </span>
            <Tag ink={strong ? C.green : C.info} soft={strong ? C.greenSoft : C.infoSoft}>
              {opdracht.match}% match
            </Tag>
          </div>
          <h3
            className="mt-2 text-[19px] font-semibold leading-snug"
            style={{ color: C.ink, ...serif }}
          >
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[12.5px]" style={{ color: C.inkMute, ...body }}>
            {opdracht.opdrachtgever} · {opdracht.plaats} · {opdracht.uren}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {opdracht.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: C.inkSoft, ...body }}
              >
                · {t}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[30px] font-semibold leading-none" style={{ color: C.ink, ...num }}>
            {opdracht.tarief.replace(" / uur", "")}
          </p>
          <p
            className="mt-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: C.inkFaint, ...body }}
          >
            per uur
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7]"
          style={{ color: C.green, ...body }}
        >
          {open ? "Verberg toelichting" : "Toelichting"}
          <ChevronRight
            size={13}
            aria-hidden="true"
            className="transition-transform motion-reduce:transition-none"
            style={{ transform: open ? "rotate(90deg)" : "none" }}
          />
        </button>
        <div className="ml-auto">
          <InkButton onClick={onOpen}>
            Reageer <ArrowRight size={13} aria-hidden="true" />
          </InkButton>
        </div>
      </div>
      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-4 grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2"
            style={{ borderTop: `1px solid ${C.hairSoft}` }}
          >
            <RedenKolom
              titel="Voordelen"
              ink={C.green}
              Icon={Check}
              items={opdracht.redenen.plus}
            />
            <RedenKolom
              titel="Aandachtspunten"
              ink={C.warn}
              Icon={AlertTriangle}
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
  ink,
  Icon,
  items,
}: {
  titel: string;
  ink: string;
  Icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: ink, ...body }}
      >
        <Icon size={12} aria-hidden="true" />
        {titel}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((r) => (
          <li
            key={r}
            className="flex items-start gap-2 text-[13px] leading-relaxed"
            style={{ color: C.inkSoft, ...body }}
          >
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
              style={{ background: ink }}
              aria-hidden="true"
            />
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
    <div className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5d3b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7]"
        style={{ color: C.inkSoft, ...body }}
      >
        <ArrowLeft size={14} aria-hidden="true" /> Terug naar bijlage A
      </button>

      <div className="pb-6" style={{ borderBottom: `2px solid ${C.hair}` }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{ color: C.inkMute, ...body }}
          >
            {opdracht.id}
          </span>
          <Tag ink={strong ? C.green : C.info} soft={strong ? C.greenSoft : C.infoSoft}>
            {opdracht.match}% match
          </Tag>
        </div>
        <h1
          className="mt-4 max-w-3xl text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[46px]"
          style={{ color: C.ink, ...serif }}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[14.5px]" style={{ color: C.inkSoft, ...body }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <InkButton>
            Reageer op opdracht <ArrowRight size={14} aria-hidden="true" />
          </InkButton>
          <InkButton variant="outline">Bewaren</InkButton>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: C.hairSoft }}>
        {[
          { l: "Tarief", v: opdracht.tarief.replace(" / uur", "") },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <div key={m.l} className="p-5" style={{ background: C.paper }}>
            <dt
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: C.inkMute, ...body }}
            >
              {m.l}
            </dt>
            <dd
              className="mt-2 text-[24px] font-semibold leading-none"
              style={{ color: C.ink, ...num }}
            >
              {m.v}
            </dd>
          </div>
        ))}
      </dl>

      <section>
        <SectieKop nr="§">Toelichting op de match</SectieKop>
        <p
          className="mt-4 max-w-2xl text-[14px] leading-relaxed"
          style={{ color: C.inkSoft, ...body }}
        >
          Transparant afgeleid uit uw geverifieerde profiel — welke posten in uw voordeel wegen én
          waar aandacht geboden is, zonder verborgen weging.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p
              className="flex items-center gap-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.green, borderBottom: `1px solid ${C.hairSoft}`, ...body }}
            >
              <Check size={14} aria-hidden="true" /> In uw voordeel
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-relaxed"
                  style={{ color: C.inkSoft, ...body }}
                >
                  <Check
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.green }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="flex items-center gap-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.warn, borderBottom: `1px solid ${C.hairSoft}`, ...body }}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Aandachtspunten
            </p>
            <ul className="mt-4 space-y-3.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 text-[14px] leading-relaxed"
                  style={{ color: C.inkSoft, ...body }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.warn }}
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
      <section
        className="grid grid-cols-1 gap-8 pb-6 lg:grid-cols-[1.5fr_1fr]"
        style={{ borderBottom: `2px solid ${C.hair}` }}
      >
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: C.green, ...body }}
          >
            Accountantsverklaring
          </p>
          <h1
            className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.02em] md:text-[42px]"
            style={{ color: C.ink, ...serif }}
          >
            Verificatie van het dossier
          </h1>
          <p
            className="mt-4 max-w-md text-[14px] leading-relaxed"
            style={{ color: C.inkSoft, ...body }}
          >
            <span className="font-semibold" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} bewijsstukken zijn geverifieerd. Eén stuk nadert de
            vervaldatum en vraagt om vernieuwing.
          </p>
        </div>
        <div className="flex items-center justify-start lg:justify-end">
          <div className="text-right">
            <p
              className="text-[64px] font-semibold leading-none"
              style={{ color: C.green, ...num }}
            >
              {ratio}%
            </p>
            <p
              className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: C.inkMute, ...body }}
            >
              geverifieerd dossier
            </p>
          </div>
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${C.hairSoft}` }}>
        {CREDENTIALS.map((c) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <div key={c.naam} style={{ borderBottom: `1px solid ${C.hairSoft}` }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 py-4 text-left transition-colors hover:bg-[#f4f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b5d3b] motion-reduce:transition-none"
              >
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center"
                  style={{ color: st.ink, background: st.soft, border: `1px solid ${st.ink}33` }}
                  aria-hidden="true"
                >
                  <st.Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[15px] font-semibold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {c.naam}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[12px]"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {c.detail}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="hidden sm:inline">
                    <Tag ink={st.ink} soft={st.soft}>
                      <st.Icon size={11} aria-hidden="true" />
                      {st.label}
                      {st.alarm && <span className="sr-only"> (let op)</span>}
                    </Tag>
                  </span>
                  <ChevronRight
                    size={17}
                    aria-hidden="true"
                    className="transition-transform motion-reduce:transition-none"
                    style={{ color: C.inkMute, transform: isOpen ? "rotate(90deg)" : "none" }}
                  />
                </span>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="pb-5 sm:pl-14">
                    <p
                      className="max-w-2xl text-[13.5px] leading-relaxed"
                      style={{ color: C.inkSoft, ...body }}
                    >
                      {c.detail}. Bewijsstukken worden versleuteld bewaard en uitsluitend na
                      uitdrukkelijke toestemming gedeeld met een opdrachtgever.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <InkButton>{c.status === "EXPIRING" ? "Vernieuwen" : "Bekijken"}</InkButton>
                      <InkButton variant="outline">Historie</InkButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Acties() {
  return (
    <div className="space-y-7">
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: C.green, ...body }}
        >
          Actiepunten
        </p>
        <h1
          className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em] md:text-[40px]"
          style={{ color: C.ink, ...serif }}
        >
          Aanbevelingen van het bestuur
        </h1>
        <p className="mt-3 max-w-md text-[13.5px]" style={{ color: C.inkMute, ...body }}>
          Op volgorde van prioriteit — werk deze af om verifieerbaar en betaald te blijven.
        </p>
      </div>

      <ol style={{ borderTop: `1.5px solid ${C.hair}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li
              key={a.titel}
              className="grid grid-cols-[auto_1fr] items-start gap-5 py-6 sm:grid-cols-[auto_1fr_auto]"
              style={{ borderBottom: `1px solid ${C.hairSoft}` }}
            >
              <span
                className="text-[30px] font-semibold leading-none"
                style={{ color: warn ? C.warn : C.inkFaint, ...num }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <Tag ink={warn ? C.warn : C.info} soft={warn ? C.warnSoft : C.infoSoft}>
                  {warn ? (
                    <AlertTriangle size={11} aria-hidden="true" />
                  ) : (
                    <Check size={11} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Kans"}
                </Tag>
                <h2
                  className="mt-2.5 text-[18px] font-semibold leading-snug"
                  style={{ color: C.ink, ...serif }}
                >
                  {a.titel}
                </h2>
                <p
                  className="mt-1.5 max-w-lg text-[13.5px] leading-relaxed"
                  style={{ color: C.inkSoft, ...body }}
                >
                  {a.detail}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 sm:self-center">
                <InkButton>
                  {a.cta}
                  <ArrowRight size={13} aria-hidden="true" />
                </InkButton>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function factuurMeta(status: string): { ink: string; soft: string; Icon: LucideIcon } {
  if (status === "Openstaand") return { ink: C.warn, soft: C.warnSoft, Icon: Clock };
  if (status === "Betaald") return { ink: C.green, soft: C.greenSoft, Icon: Check };
  return { ink: C.info, soft: C.infoSoft, Icon: AlertTriangle };
}

function Facturen() {
  const totaalBetaald = "€ 8.622";
  return (
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 pb-5"
        style={{ borderBottom: `2px solid ${C.hair}` }}
      >
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: C.green, ...body }}
          >
            Financiële verantwoording
          </p>
          <h1
            className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.02em] md:text-[42px]"
            style={{ color: C.ink, ...serif }}
          >
            Grootboek & omzet
          </h1>
        </div>
        <InkButton>
          <Plus size={14} aria-hidden="true" /> Nieuwe factuur
        </InkButton>
      </div>

      <section
        className="grid grid-cols-1 gap-px sm:grid-cols-3"
        style={{ background: C.hairSoft }}
      >
        {[
          {
            l: "Betaald (mnd)",
            v: totaalBetaald,
            sub: "3 posten voldaan",
            ink: C.green,
            alarm: false,
          },
          { l: "Openstaand", v: "€ 1.350", sub: "1 post · 9 dagen", ink: C.warn, alarm: true },
          { l: "Concept", v: "€ 880", sub: "gereed voor verzending", ink: C.info, alarm: false },
        ].map((s) => (
          <div key={s.l} className="p-6" style={{ background: C.paper }}>
            <div className="flex items-center justify-between">
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.inkMute, ...body }}
              >
                {s.l}
              </p>
              {s.alarm && <AlertTriangle size={15} aria-hidden="true" style={{ color: C.warn }} />}
            </div>
            <p
              className="mt-3 text-[38px] font-semibold leading-none"
              style={{ color: s.ink, ...num }}
            >
              {s.v}
            </p>
            <p className="mt-2 text-[11.5px]" style={{ color: C.inkMute, ...body }}>
              {s.sub}
            </p>
          </div>
        ))}
      </section>

      <section>
        <SectieKop nr="IV">Openstaande & betaalde posten</SectieKop>
        <table className="mt-4 w-full border-collapse text-left">
          <caption className="sr-only">Overzicht van facturen met status en bedrag</caption>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.hair}` }}>
              {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={`pb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${i === 4 ? "text-right" : ""} ${i === 2 ? "hidden sm:table-cell" : ""}`}
                  style={{ color: C.inkMute, ...body }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const ft = factuurMeta(f.status);
              const acc = f.status === "Openstaand";
              return (
                <tr
                  key={f.nr}
                  className="transition-colors hover:bg-[#f4f2ec]"
                  style={{ borderBottom: `1px solid ${C.hairSoft}` }}
                >
                  <td
                    className="py-3.5 text-[12px] font-semibold tabular-nums"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {f.nr}
                  </td>
                  <td
                    className="py-3.5 pr-3 text-[14px] font-semibold"
                    style={{ color: C.ink, ...serif }}
                  >
                    {f.klant}
                  </td>
                  <td
                    className="hidden py-3.5 text-[12px] tabular-nums sm:table-cell"
                    style={{ color: C.inkMute, ...body }}
                  >
                    {f.datum}
                  </td>
                  <td className="py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ color: ft.ink, ...body }}
                    >
                      <ft.Icon size={12} aria-hidden="true" />
                      {f.status}
                    </span>
                  </td>
                  <td
                    className="py-3.5 text-right text-[16px] font-semibold tabular-nums"
                    style={{ color: acc ? C.warn : C.ink, ...num }}
                  >
                    {f.bedrag}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1.5px solid ${C.hair}` }}>
              <td
                className="pt-3.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: C.gold, ...body }}
                colSpan={4}
              >
                Totaal betaald (boekjaar)
              </td>
              <td
                className="pt-3.5 text-right text-[22px] font-semibold tabular-nums"
                style={{ color: C.ink, ...num }}
              >
                {totaalBetaald}
              </td>
            </tr>
          </tfoot>
        </table>
        <div className="mt-6">
          <Rule />
        </div>
      </section>
    </div>
  );
}
