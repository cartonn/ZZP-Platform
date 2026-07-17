"use client";

// Concept 369 — "Passe-partout" · Museale omlijsting / galerie-passe-partout.
// Elk scherm als ingelijst werk: royale mat-marges, museum-labels (klein kapitaal + herkomst),
// fijne dubbele kaderlijn, gedempte galerie-neutralen. Museumwit/kalk (#f3f1ec) met houtskool
// (#26241f) en één ingetogen oker-accent (#9a7b3f). Fonts: Cormorant (labels/koppen, elegant serif),
// Geist Mono (herkomst-metadata). Rust, hiërarchie via omlijsting en witruimte.

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  Landmark,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// — Palet: gedempte galerie-neutralen, houtskool op kalk, oker-accent —
const C = {
  wall: "#e9e6df",
  mat: "#f3f1ec",
  card: "#faf9f5",
  ink: "#26241f",
  inkSoft: "#454239",
  muted: "#6e6a5f",
  faint: "#9c988c",
  line: "rgba(38,36,31,0.16)",
  lineSoft: "rgba(38,36,31,0.08)",
  ochre: "#9a7b3f",
  ochreSoft: "#e7dcc4",
};

const serif = { fontFamily: "var(--font-lab-cormorant), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-geist), system-ui, sans-serif" };
const mono = { fontFamily: "var(--font-lab-geist-mono), ui-monospace, monospace" };

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; alarm: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geauthenticeerd", Icon: Check, alarm: false };
    case "SUBMITTED":
      return { label: "In taxatie", Icon: Clock, alarm: false };
    case "EXPIRING":
      return { label: "Herkomst verloopt", Icon: AlertTriangle, alarm: true };
    case "REJECTED":
      return { label: "Niet erkend", Icon: AlertTriangle, alarm: true };
  }
}

// — Museum-label: klein kapitaal-label + herkomst-metadata —
function Label({ kind, herkomst }: { kind: string; herkomst?: string }) {
  return (
    <div className="mt-3 border-t pt-2" style={{ borderColor: C.line }}>
      <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: C.ochre, ...mono }}>
        {kind}
      </p>
      {herkomst && (
        <p className="mt-1 text-[11px] tracking-[0.02em]" style={{ color: C.faint, ...mono }}>
          {herkomst}
        </p>
      )}
    </div>
  );
}

// — Ingelijst werk: royale passe-partout-marge + fijne dubbele kaderlijn —
function Werk({
  children,
  className = "",
  tint = false,
}: {
  children: React.ReactNode;
  className?: string;
  tint?: boolean;
}) {
  return (
    <div className={`p-[3px] ${className}`} style={{ border: `1px solid ${C.line}` }}>
      <div style={{ border: `1px solid ${C.line}`, background: tint ? C.mat : C.card }}>
        <div className="p-6 sm:p-7">{children}</div>
      </div>
    </div>
  );
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase tracking-[0.32em]" style={{ color: C.ochre, ...mono }}>
      {children}
    </p>
  );
}

function Tag({ children, alarm }: { children: React.ReactNode; alarm?: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.14em]"
      style={{
        color: alarm ? C.ochre : C.muted,
        border: `1px solid ${alarm ? C.ochre : C.line}`,
        ...mono,
      }}
    >
      {children}
    </span>
  );
}

function Spark({ data, alarm }: { data: number[]; alarm?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const w = 140;
  const h = 32;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={alarm ? C.ochre : C.inkSoft}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Concept369() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[720px] w-full antialiased"
      style={{ ...body, background: C.wall, color: C.ink }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-10 md:py-10">
        {/* De galerie-lijst: alles binnen één royale passe-partout */}
        <div className="p-[4px]" style={{ border: `1px solid ${C.line}`, background: C.mat }}>
          <div style={{ border: `1px solid ${C.line}` }}>
            <div className="px-5 md:px-10">
              <TopBar />
              <NavBar screen={screen} setScreen={setScreen} />
            </div>
            <main className="px-5 pb-16 pt-10 md:px-10">
              {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
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
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b py-7"
      style={{ borderColor: C.ink }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 items-center justify-center"
          style={{ border: `1px solid ${C.ink}` }}
          aria-hidden="true"
        >
          <Landmark size={19} color={C.ink} />
        </span>
        <div>
          <p className="text-[24px] font-medium leading-none tracking-[0.01em]" style={serif}>
            Passe-partout
          </p>
          <p
            className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.3em]"
            style={{ color: C.faint, ...mono }}
          >
            Collectie · zelfstandig werk
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="hidden items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] sm:inline-flex"
          style={{ color: C.muted, ...mono }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: C.ochre }}
            aria-hidden="true"
          />
          {PROFIEL.trust}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center text-[13px]"
          style={{ border: `1px solid ${C.ink}`, color: C.ink, ...serif }}
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
    <nav
      className="flex items-center gap-0 overflow-x-auto border-b"
      style={{ borderColor: C.line }}
      aria-label="Hoofdnavigatie"
    >
      {SCREENS.map((s, i) => {
        const on = s.key === screen;
        return (
          <button
            key={s.key}
            onClick={() => setScreen(s.key)}
            aria-current={on ? "page" : undefined}
            className="relative shrink-0 px-4 py-4 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: on ? C.ink : C.muted, ...serif }}
          >
            <span
              className="mr-2 text-[10px] tracking-[0.1em]"
              style={{ color: on ? C.ochre : C.faint, ...mono }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {s.label}
            {on && (
              <span
                className="absolute inset-x-3 -bottom-px h-0.5"
                style={{ background: C.ochre }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="self-center">
          <Overline>Zaal I · Vandaag</Overline>
          <h1
            className="mt-5 text-[46px] font-medium leading-[1.02] tracking-[-0.01em] md:text-[62px]"
            style={serif}
          >
            Goedemorgen,
            <br />
            {PROFIEL.naam.split(" ")[0]}.
          </h1>
          <p className="mt-6 max-w-md text-[15.5px] leading-relaxed" style={{ color: C.muted }}>
            Uw collectie hangt in balans. Eén werk vraagt vandaag om aandacht — de zaal blijft
            rustig zolang u dat afhandelt.
          </p>
        </div>

        <Werk tint>
          <Overline>Uitgelicht werk</Overline>
          <h2 className="mt-3 text-[24px] font-medium leading-snug" style={serif}>
            {primair.titel}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
            {primair.detail}
          </p>
          <button
            onClick={onOpen}
            className="group mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.mat, ...serif }}
          >
            {primair.cta}
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
          <Label kind="Herkomst · next-action" herkomst="Verworven · vandaag · prioriteit hoog" />
        </Werk>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Zaal II · In cijfers</Overline>
          <span
            className="text-[10.5px] uppercase tracking-[0.16em]"
            style={{ color: C.faint, ...mono }}
          >
            Vier werken
          </span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <Werk key={k.label}>
              <div className="flex items-baseline justify-between">
                <p className="text-[12px]" style={{ color: C.muted, ...body }}>
                  {k.label}
                </p>
                <span
                  className="text-[11px] tabular-nums"
                  style={{ color: k.up ? C.inkSoft : C.ochre, ...mono }}
                >
                  {k.up ? "+" : "−"}
                  {k.trend.replace(/^[+-]/, "")}
                </span>
              </div>
              <p
                className="mt-2 text-[34px] font-medium tabular-nums leading-none tracking-[-0.01em]"
                style={serif}
              >
                {k.value}
              </p>
              <div className="mt-3">
                <Spark data={k.spark} alarm={!k.up} />
              </div>
            </Werk>
          ))}
        </div>
      </section>

      <section>
        <div
          className="mb-5 flex items-baseline justify-between border-b pb-2"
          style={{ borderColor: C.line }}
        >
          <Overline>Zaal III · Werken voor u</Overline>
          <button
            onClick={onOpen}
            className="text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ochre, ...mono }}
          >
            Volledige zaal
          </button>
        </div>
        <ul className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {OPDRACHTEN.map((o, i) => (
            <li key={o.id}>
              <button
                onClick={onOpen}
                className="group block w-full text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <Werk>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                      cat. {String(i + 1).padStart(3, "0")}
                    </span>
                    <MatchMeter value={o.match} />
                  </div>
                  <h3 className="mt-3 text-[20px] font-medium leading-snug" style={serif}>
                    {o.titel}
                  </h3>
                  <Label kind={o.opdrachtgever} herkomst={`${o.plaats} · ${o.tarief}`} />
                </Werk>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MatchMeter({ value }: { value: number }) {
  const strong = value >= 90;
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      <span
        className="text-[13px] font-medium tabular-nums"
        style={{ color: strong ? C.ochre : C.inkSoft, ...mono }}
      >
        {value}%
      </span>
    </span>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Tentoonstelling</Overline>
          <h1
            className="mt-3 text-[40px] font-medium leading-none tracking-[-0.01em]"
            style={serif}
          >
            Open opdrachten
          </h1>
        </div>
        <span
          className="text-[10.5px] uppercase tracking-[0.16em]"
          style={{ color: C.faint, ...mono }}
        >
          {String(filtered.length).padStart(2, "0")} / {String(OPDRACHTEN.length).padStart(2, "0")}{" "}
          werken
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="flex flex-1 items-center gap-2.5 border-b px-1 py-2.5"
          style={{ borderColor: C.ink }}
        >
          <Search size={16} aria-hidden="true" style={{ color: C.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek in de collectie op titel, plaats of opdrachtgever…"
            aria-label="Opdrachten zoeken"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9c988c]"
            style={{ color: C.ink, ...body }}
          />
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Sorteren">
          {(["match", "tarief"] as const).map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                onClick={() => setSort(s)}
                aria-pressed={on}
                className="px-4 py-2 text-[12px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={
                  on
                    ? { background: C.ink, color: C.mat, ...mono }
                    : { color: C.muted, border: `1px solid ${C.line}`, ...mono }
                }
              >
                {s === "match" ? "Match" : "Waardering"}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Werk tint>
          <div className="flex flex-col items-center py-14 text-center">
            <Landmark size={38} aria-hidden="true" style={{ color: C.faint }} />
            <p className="mt-5 text-[26px] font-medium" style={serif}>
              Lege zaal
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px]" style={{ color: C.muted }}>
              Geen werk past bij {q ? `“${q}”` : "uw zoekterm"}. Verruim de zoekterm om de collectie
              opnieuw te tonen.
            </p>
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: C.ink, color: C.mat, ...serif }}
            >
              Zoekopdracht wissen <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </Werk>
      ) : (
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <OpdrachtWerk opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpdrachtWerk({
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
    <Werk>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
            cat. {String(index + 1).padStart(3, "0")}
          </span>
          <h3 className="mt-2 text-[22px] font-medium leading-snug" style={serif}>
            {opdracht.titel}
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
        </div>
        <span
          className="text-[18px] font-medium tabular-nums"
          style={{ color: opdracht.match >= 90 ? C.ochre : C.inkSoft, ...mono }}
        >
          {opdracht.match}%
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-3 gap-4 border-y py-3"
        style={{ borderColor: C.lineSoft }}
      >
        {[
          { l: "Waardering", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
        ].map((m) => (
          <div key={m.l}>
            <p
              className="text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-1 text-[13.5px] tabular-nums" style={{ color: C.ink, ...mono }}>
              {m.v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {opdracht.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.muted, ...mono }}
        >
          {open ? <Minus size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          Herkomst
        </button>
        <button
          onClick={onOpen}
          className="ml-auto inline-flex items-center gap-1.5 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.ochre, ...serif }}
        >
          Bekijk werk <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <div
        className="grid transition-all duration-300 motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-3 grid grid-cols-1 gap-4 border-t pt-3 sm:grid-cols-2"
            style={{ borderColor: C.line }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.faint, ...mono }}
              >
                Wat past
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.plus.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
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
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: C.ochre, ...mono }}
              >
                Aandacht
              </p>
              <ul className="mt-2 space-y-1.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2 text-[12.5px]"
                    style={{ color: C.muted }}
                  >
                    <AlertTriangle
                      size={12}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: C.ochre }}
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Werk>
  );
}

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: C.muted, ...mono }}
      >
        <ArrowRight size={14} aria-hidden="true" className="rotate-180" /> Terug naar de zaal
      </button>

      <Werk tint>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tracking-[0.1em]" style={{ color: C.ochre, ...mono }}>
            {opdracht.id}
          </span>
          <Tag alarm>{opdracht.match}% match</Tag>
        </div>
        <h1
          className="mt-4 max-w-2xl text-[42px] font-medium leading-[1.04] tracking-[-0.01em] md:text-[52px]"
          style={serif}
        >
          {opdracht.titel}
        </h1>
        <p className="mt-3 text-[15px]" style={{ color: C.muted }}>
          {opdracht.opdrachtgever} · {opdracht.plaats}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: C.mat, ...serif }}
          >
            Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
          </button>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: C.ink, border: `1px solid ${C.ink}`, ...serif }}
          >
            Bewaar in collectie
          </button>
        </div>
        <Label
          kind="Zaal-inrichting"
          herkomst={`${opdracht.uren} · aanvang ${opdracht.start} · ${opdracht.tarief}`}
        />
      </Werk>

      <section className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {[
          { l: "Waardering", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m) => (
          <Werk key={m.l}>
            <p
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: C.faint, ...mono }}
            >
              {m.l}
            </p>
            <p className="mt-2 text-[26px] font-medium tabular-nums" style={serif}>
              {m.v}
            </p>
          </Werk>
        ))}
      </section>

      <section>
        <div className="border-b pb-3" style={{ borderColor: C.line }}>
          <Overline>Zaaltekst · waarom deze match</Overline>
        </div>
        <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed" style={{ color: C.inkSoft }}>
          Transparant onderbouwd op uw geverifieerde profiel — de pluspunten én de aandacht, zonder
          verborgen score.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Werk>
            <Overline>Wat past</Overline>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.plus.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.inkSoft }}
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
          </Werk>
          <Werk>
            <p
              className="text-[10.5px] uppercase tracking-[0.32em]"
              style={{ color: C.ochre, ...mono }}
            >
              Aandacht
            </p>
            <ul className="mt-4 space-y-3">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-3 border-t pt-3 text-[14px]"
                  style={{ borderColor: C.lineSoft, color: C.muted }}
                >
                  <AlertTriangle
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    style={{ color: C.ochre }}
                  />
                  {r}
                </li>
              ))}
            </ul>
          </Werk>
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
        className="flex flex-wrap items-end justify-between gap-6 border-b pb-8"
        style={{ borderColor: C.ink }}
      >
        <div className="max-w-md">
          <Overline>Authenticiteit</Overline>
          <h1
            className="mt-3 text-[40px] font-medium leading-none tracking-[-0.01em]"
            style={serif}
          >
            Certificaten
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.muted }}>
            <span className="font-medium" style={{ color: C.ink }}>
              {PROFIEL.trust}.
            </span>{" "}
            {verified} van {CREDENTIALS.length} werken volledig geauthenticeerd. Eén vraagt
            binnenkort om herbevestiging van herkomst.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <p
            className="text-[52px] font-medium tabular-nums leading-none tracking-[-0.02em]"
            style={serif}
          >
            {ratio}
            <span className="text-[24px]" style={{ color: C.muted }}>
              %
            </span>
          </p>
          <p
            className="pb-2 text-[10.5px] uppercase tracking-[0.18em]"
            style={{ color: C.faint, ...mono }}
          >
            geauthenticeerd
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li key={c.naam}>
              <Werk tint={st.alarm}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.naam)}
                  aria-expanded={isOpen}
                  className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] tabular-nums" style={{ color: C.faint, ...mono }}>
                      inv. {String(i + 1).padStart(3, "0")}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: st.alarm ? C.ochre : C.inkSoft }}
                    >
                      <st.Icon size={14} aria-hidden="true" />
                      <span className="text-[10.5px] uppercase tracking-[0.12em]" style={mono}>
                        {st.label}
                      </span>
                    </span>
                  </div>
                  <h3 className="mt-3 text-[21px] font-medium leading-snug" style={serif}>
                    {c.naam}
                  </h3>
                  <Label kind="Herkomst" herkomst={c.detail} />
                </button>
                <div
                  className="grid transition-all duration-300 motion-reduce:transition-none"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="mt-3 text-[13px] leading-relaxed" style={{ color: C.inkSoft }}>
                      Dit document wordt versleuteld bewaard en alleen na uw expliciete toestemming
                      getoond aan een opdrachtgever — als een bruikleen onder museale voorwaarden.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="px-4 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ background: C.ink, color: C.mat, ...serif }}
                      >
                        {c.status === "EXPIRING" ? "Herkomst vernieuwen" : "Certificaat bekijken"}
                      </button>
                      <button
                        className="px-4 py-2 text-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{ color: C.inkSoft, border: `1px solid ${C.line}`, ...mono }}
                      >
                        Logboek
                      </button>
                    </div>
                  </div>
                </div>
              </Werk>
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
      <div className="border-b pb-6" style={{ borderColor: C.ink }}>
        <Overline>Restauratie-agenda</Overline>
        <h1 className="mt-3 text-[40px] font-medium leading-none tracking-[-0.01em]" style={serif}>
          Volgende acties
        </h1>
        <p className="mt-3 max-w-md text-[14.5px]" style={{ color: C.muted }}>
          Handel deze werken op volgorde af — elk afgerond punt houdt uw collectie in topconditie.
        </p>
      </div>

      <ol className="space-y-5">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <li key={a.titel}>
              <Werk tint={warn}>
                <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
                  <span
                    className="flex h-12 w-12 items-center justify-center text-[17px] tabular-nums"
                    style={
                      warn
                        ? { background: C.ochre, color: C.card, ...serif }
                        : { border: `1px solid ${C.ink}`, color: C.ink, ...serif }
                    }
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {warn ? (
                        <AlertTriangle size={15} aria-hidden="true" style={{ color: C.ochre }} />
                      ) : (
                        <Clock size={14} aria-hidden="true" style={{ color: C.ink }} />
                      )}
                      <h2 className="text-[20px] font-medium leading-snug" style={serif}>
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
                    className="justify-self-start px-5 py-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:justify-self-end"
                    style={
                      warn
                        ? { background: C.ochre, color: C.card, ...serif }
                        : { border: `1px solid ${C.ink}`, color: C.ink, ...serif }
                    }
                  >
                    {a.cta}
                  </button>
                </div>
              </Werk>
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
    <div className="space-y-8">
      <div
        className="flex flex-wrap items-end justify-between gap-4 border-b pb-6"
        style={{ borderColor: C.ink }}
      >
        <div>
          <Overline>Aankoopadministratie</Overline>
          <h1
            className="mt-3 text-[40px] font-medium leading-none tracking-[-0.01em]"
            style={serif}
          >
            Facturen
          </h1>
        </div>
        <button
          className="inline-flex items-center gap-2 px-5 py-3 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: C.ink, color: C.mat, ...serif }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { l: "Betaald (mnd)", v: totaalBetaald, sub: "3 voldaan", alarm: false },
          { l: "Openstaand", v: "€ 1.350", sub: "1 factuur · 9 dagen", alarm: true },
          { l: "Concept", v: "€ 880", sub: "klaar om te versturen", alarm: false },
        ].map((s) => (
          <Werk key={s.l} tint={s.alarm}>
            <p
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: C.muted, ...mono }}
            >
              {s.l}
            </p>
            <p
              className="mt-2 text-[30px] font-medium tabular-nums tracking-[-0.01em]"
              style={{ color: s.alarm ? C.ochre : C.ink, ...serif }}
            >
              {s.v}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: C.faint }}>
              {s.sub}
            </p>
          </Werk>
        ))}
      </section>

      <Werk>
        <div
          className="hidden grid-cols-[8rem_1fr_5rem_7rem_6rem] gap-4 border-b pb-2 sm:grid"
          style={{ borderColor: C.ink }}
        >
          {["Nummer", "Klant", "Datum", "Status", "Bedrag"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] uppercase tracking-[0.16em] ${i === 4 ? "text-right" : ""}`}
              style={{ color: C.faint, ...mono }}
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
                className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-4 transition-colors hover:bg-[#f3f1ec] sm:grid-cols-[8rem_1fr_5rem_7rem_6rem] sm:gap-4"
                style={{ borderColor: C.lineSoft }}
              >
                <span
                  className="order-1 text-[12px] tabular-nums"
                  style={{ color: C.faint, ...mono }}
                >
                  {f.nr}
                </span>
                <span
                  className="order-3 min-w-0 truncate text-[16px] font-medium sm:order-2"
                  style={serif}
                >
                  {f.klant}
                </span>
                <span
                  className="order-4 hidden text-[12.5px] tabular-nums sm:order-3 sm:inline"
                  style={{ color: C.muted, ...mono }}
                >
                  {f.datum}
                </span>
                <span className="order-5 sm:order-4">
                  <Tag alarm={acc}>{f.status}</Tag>
                </span>
                <span
                  className="order-2 text-right text-[15px] font-medium tabular-nums sm:order-5"
                  style={{ color: acc ? C.ochre : C.ink, ...mono }}
                >
                  {f.bedrag}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline justify-between pt-5">
          <span
            className="text-[10.5px] uppercase tracking-[0.2em]"
            style={{ color: C.faint, ...mono }}
          >
            Totaal betaald
          </span>
          <span className="text-[26px] font-medium tabular-nums" style={serif}>
            {totaalBetaald}
          </span>
        </div>
      </Werk>
    </div>
  );
}
