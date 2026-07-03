"use client";

// Concept 27 — "Courant" · Krant / broadsheet (redactioneel-journalistiek).
// Een kwaliteitskrant die software werd: masthead met dubbele scheidingsregel, dateline,
// meerkoloms tekstopmaak (CSS columns), drop caps, hairline kolomregels, kicker-labels in
// klein-kapitaal en koersnoteringen-tabellen. Zwart-wit op krantenpapier met één spot-rood.
// Dicht, tijdloos, gezaghebbend. Distinct van glossy-mode-editorial (02): dit is journalistiek.
// Palet: papier #f7f4ec, ink #1a1a17, muted #57534a, hairline #d8d2c4, spot-rood #a11d1d,
// warm vlak #efe9db. Fonts: Fraunces (masthead/koppen) + Libre Franklin (body/UI).

import { useState } from "react";
import {
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Clock,
  AlertTriangle,
  Minus,
  MapPin,
  FileText,
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
  NAV,
  BERICHTEN,
  DOCUMENTEN,
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

const C = {
  ink: "#1a1a17",
  inkSoft: "#3a382f",
  muted: "#57534a",
  faint: "#8a8272",
  paper: "#f7f4ec",
  paperWarm: "#efe9db",
  paperCard: "#fbf9f2",
  line: "#d8d2c4",
  lineSoft: "#e5ded0",
  rule: "#1a1a17",
  red: "#a11d1d",
  redSoft: "#f0e0dc",
};

const display = { fontFamily: "var(--font-lab-fraunces)" };
const bodyFont = { fontFamily: "var(--font-lab-franklin)" };

// Editie-metadata voor de masthead.
const EDITIE = {
  krant: "De Courant",
  ondertitel: "Onafhankelijk vakblad voor zelfstandige zorgprofessionals",
  dateline: "UTRECHT — donderdag 3 juli 2026",
  jaargang: "Jaargang XII · Nº 2041",
  oplage: "Editie voor Sanne de Vries",
};

// Sectie-nummering, krant-stijl.
const SECTIE: Record<ScreenKey, { katern: string; pagina: string }> = {
  dashboard: { katern: "Voorpagina", pagina: "1" },
  marktplaats: { katern: "Marktplaats", pagina: "2" },
  opdracht: { katern: "Dossier", pagina: "3" },
  verificatie: { katern: "Verificatie", pagina: "4" },
  acties: { katern: "Agenda", pagina: "5" },
  facturen: { katern: "Financieel", pagina: "6" },
  documenten: { katern: "Archief", pagina: "7" },
  berichten: { katern: "Redactie", pagina: "8" },
};

function statusStyle(s: CredStatus): { label: string; Icon: LucideIcon; red?: boolean } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt bijna", Icon: AlertTriangle, red: true };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, red: true };
  }
}

// Dunne dubbele scheidingsregel — het handelsmerk van de masthead.
function DoubleRule({ className = "" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div style={{ height: 2, background: C.rule }} />
      <div style={{ height: 1, background: C.rule, marginTop: 2 }} />
    </div>
  );
}

function Kicker({ children, red = false }: { children: React.ReactNode; red?: boolean }) {
  return (
    <span
      className="text-[10.5px] font-bold uppercase"
      style={{ letterSpacing: "0.16em", color: red ? C.red : C.muted, ...bodyFont }}
    >
      {children}
    </span>
  );
}

// Kop met flankerende hairlines — sectiekop-regel ("MARKTPLAATS · pagina 2").
function SectionHead({
  katern,
  pagina,
  title,
  sub,
}: {
  katern: string;
  pagina: string;
  title: string;
  sub?: string;
}) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <Kicker red>{katern}</Kicker>
        <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: C.faint }}>
          · pagina {pagina}
        </span>
        <div className="h-px flex-1" style={{ background: C.line }} />
      </div>
      <h1
        className="mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.01em] sm:text-[42px]"
        style={{ ...display, color: C.ink }}
      >
        {title}
      </h1>
      {sub && (
        <p className="mt-1.5 max-w-xl text-[13px] italic leading-snug" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </header>
  );
}

function Sparkline({ data, red = false }: { data: number[]; red?: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const w = 88;
  const h = 26;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={red ? C.red : C.ink}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Kaart met hairline-rand — geen schaduw, puur drukwerk.
function Card({
  children,
  className = "",
  warm = false,
}: {
  children: React.ReactNode;
  className?: string;
  warm?: boolean;
}) {
  return (
    <div
      className={className}
      style={{ background: warm ? C.paperWarm : C.paperCard, border: `1px solid ${C.line}` }}
    >
      {children}
    </div>
  );
}

export function Concept27() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const active = OPDRACHTEN[0] as Opdracht;
  const sec = SECTIE[screen];

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{
        ...bodyFont,
        color: C.ink,
        background: C.paper,
      }}
    >
      {/* Krantenkop / masthead */}
      <div className="px-5 pt-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em]">
            <span style={{ color: C.muted }}>{EDITIE.jaargang}</span>
            <span className="hidden sm:inline" style={{ color: C.muted }}>
              {EDITIE.oplage}
            </span>
            <span style={{ color: C.red }}>Prijs · gratis voor leden</span>
          </div>
          <DoubleRule className="mt-2" />
          <div className="py-4 text-center">
            <h1
              className="text-[44px] font-black leading-none tracking-[-0.02em] sm:text-[64px]"
              style={{ ...display, color: C.ink }}
            >
              {EDITIE.krant}
            </h1>
            <p
              className="mt-1.5 text-[11px] uppercase tracking-[0.28em]"
              style={{ color: C.muted }}
            >
              {EDITIE.ondertitel}
            </p>
          </div>
          <DoubleRule />
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-[11px]">
            <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: C.ink }}>
              {EDITIE.dateline}
            </span>
            <span className="italic" style={{ color: C.muted }}>
              {PROFIEL.rol} · {PROFIEL.plaats}
            </span>
          </div>
        </div>
      </div>

      {/* Navigatie — katern-balk */}
      <nav className="px-5 sm:px-8 lg:px-12">
        <div
          className="mx-auto max-w-6xl"
          style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}
        >
          <div className="flex items-stretch overflow-x-auto">
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative shrink-0 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{
                    color: on ? C.paper : C.ink,
                    background: on ? C.ink : "transparent",
                    borderLeft: i === 0 ? "none" : `1px solid ${C.line}`,
                  }}
                >
                  {s.label}
                  {on && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-[3px]"
                      style={{ background: C.red }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
            <div className="ml-auto flex shrink-0 items-center gap-2 px-4">
              <Search size={13} aria-hidden="true" style={{ color: C.faint }} />
              <span className="hidden text-[11px] italic sm:inline" style={{ color: C.faint }}>
                Doorzoek editie
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="px-5 pb-10 pt-7 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Broodkruimel katern */}
          <div className="mb-5 flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
            <span className="uppercase tracking-[0.1em]">{EDITIE.krant}</span>
            <ChevronRight size={12} aria-hidden="true" style={{ color: C.faint }} />
            <span className="font-semibold uppercase tracking-[0.1em]" style={{ color: C.red }}>
              {sec.katern}
            </span>
            <span style={{ color: C.faint }}>· pagina {sec.pagina}</span>
          </div>

          {screen === "dashboard" && <Dashboard onOpen={() => setScreen("opdracht")} />}
          {screen === "marktplaats" && <Marktplaats onOpen={() => setScreen("opdracht")} />}
          {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
          {screen === "verificatie" && <Verificatie />}
          {screen === "acties" && <Acties />}
          {screen === "facturen" && <Facturen />}
        </div>
      </div>

      {/* Voettekst — colofon */}
      <div className="px-5 pb-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <DoubleRule className="mb-2" />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em]">
            <span style={{ color: C.muted }}>
              {EDITIE.krant} · Redactie {NAV.slice(0, 3).join(" · ")}
            </span>
            <span style={{ color: C.faint }}>Zetwerk & druk · ZZP Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Dashboard ---------------------------------- */

function Dashboard({ onOpen }: { onOpen: () => void }) {
  const primair = ACTIES[0] as (typeof ACTIES)[number];
  const lead = OPDRACHTEN[0] as Opdracht;
  const onread = BERICHTEN.filter((b) => b.ongelezen).length;

  return (
    <div>
      {/* Koersnoteringen-strook (KPI's) */}
      <div
        className="mb-7 grid grid-cols-2 lg:grid-cols-4"
        style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}
      >
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="px-4 py-3.5"
            style={{
              borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}`,
              borderTop: i >= 2 ? `1px solid ${C.line}` : "none",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: C.muted }}
              >
                {k.label}
              </span>
              <span
                className="inline-flex items-center gap-0.5 text-[10.5px] font-bold tabular-nums"
                style={{ color: k.up ? C.ink : C.red }}
              >
                {k.up ? (
                  <ArrowUpRight size={11} aria-hidden="true" />
                ) : (
                  <ArrowDownRight size={11} aria-hidden="true" />
                )}
                {k.trend}
              </span>
            </div>
            <div className="mt-1.5 flex items-end justify-between">
              <span
                className="text-[26px] font-black tabular-nums leading-none tracking-tight"
                style={{ ...display, color: C.ink }}
              >
                {k.value}
              </span>
              <Sparkline data={k.spark} red={!k.up} />
            </div>
          </div>
        ))}
      </div>

      {/* Lead-artikel + zijkolom */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Hoofdkolom */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Kicker red>Hoofdartikel · Beste match vandaag</Kicker>
            <div className="h-px flex-1" style={{ background: C.line }} />
          </div>
          <button
            onClick={onOpen}
            className="mt-2 block w-full text-left transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <h2
              className="text-[30px] font-black leading-[1.02] tracking-[-0.01em] sm:text-[38px]"
              style={{ ...display, color: C.ink }}
            >
              {lead.titel}
            </h2>
          </button>
          <p
            className="mt-2 flex items-center gap-1.5 text-[12px] italic"
            style={{ color: C.muted }}
          >
            <MapPin size={12} aria-hidden="true" /> Van onze correspondent · {lead.opdrachtgever},{" "}
            {lead.plaats}
          </p>

          {/* Meerkoloms body met drop cap */}
          <div
            className="mt-4 text-[13.5px] leading-[1.62]"
            style={{ color: C.inkSoft, columnGap: "1.75rem" }}
          >
            <div className="sm:[column-count:2]">
              <p className="mb-3">
                <span
                  className="float-left mr-2 mt-1 font-black leading-[0.7]"
                  style={{ ...display, color: C.red, fontSize: "56px" }}
                  aria-hidden="true"
                >
                  {lead.titel.charAt(0)}
                </span>
                Een opvallend sterke match dient zich aan voor deze editie. Met een score van{" "}
                {lead.match}% behoort deze opdracht tot de best passende die het systeem deze week
                registreerde. De opdracht loopt {lead.uren}, met een aanvang{" "}
                {lead.start.toLowerCase()}.
              </p>
              <p className="mb-3">
                Het geboden tarief bedraagt {lead.tarief} en ligt boven de door u ingestelde
                ondergrens. De reistijd is kort, en uw kernregistraties zijn geverifieerd — factoren
                die zwaar meewegen in de rangschikking.
              </p>
              <p>
                Redenen om te reageren en aandachtspunten leest u in het volledige dossier.{" "}
                <button
                  onClick={onOpen}
                  className="font-bold underline decoration-1 underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: C.red }}
                >
                  Vervolg op pagina 3 →
                </button>
              </p>
            </div>
          </div>

          {/* Tags als bijschrift */}
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: C.line }}>
            {lead.tags.map((t) => (
              <span
                key={t}
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: C.muted }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Overige matches — kort nieuws */}
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <Kicker>Ook in de markt</Kicker>
              <div className="h-px flex-1" style={{ background: C.line }} />
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: C.line }}>
              {OPDRACHTEN.slice(1).map((o) => (
                <button
                  key={o.id}
                  onClick={onOpen}
                  className="flex w-full items-baseline gap-3 py-3 text-left transition-colors hover:bg-[#efe9db] focus-visible:outline-none focus-visible:ring-2"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="w-9 shrink-0 text-[15px] font-black tabular-nums"
                    style={{ ...display, color: C.red }}
                  >
                    {o.match}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold leading-tight" style={display}>
                      {o.titel}
                    </span>
                    <span className="text-[11.5px] italic" style={{ color: C.muted }}>
                      {o.opdrachtgever} · {o.plaats} · {o.tarief}
                    </span>
                  </span>
                  <ChevronRight size={15} aria-hidden="true" style={{ color: C.faint }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Zijkolom */}
        <div className="space-y-6 lg:border-l lg:pl-8" style={{ borderColor: C.line }}>
          {/* Redactioneel: volgende beste stap */}
          <Card warm className="p-5">
            <Kicker red>Van de redactie · advies</Kicker>
            <h3
              className="mt-2 text-[19px] font-black leading-tight"
              style={{ ...display, color: C.ink }}
            >
              {primair.titel}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: C.inkSoft }}>
              {primair.detail}
            </p>
            <button
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ color: C.paper, background: C.red, padding: "8px 14px" }}
            >
              {primair.cta}
              <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          </Card>

          {/* Certificaten — noteringen */}
          <div>
            <div className="flex items-center gap-3">
              <Kicker>Register · certificaten</Kicker>
              <div className="h-px flex-1" style={{ background: C.line }} />
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: C.lineSoft }}>
              {CREDENTIALS.map((c) => {
                const st = statusStyle(c.status);
                return (
                  <div key={c.naam} className="flex items-start gap-2.5 py-2.5">
                    <st.Icon
                      size={14}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      style={{ color: st.red ? C.red : C.ink }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold leading-tight">{c.naam}</p>
                      <p className="text-[11px]" style={{ color: C.muted }}>
                        {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ingezonden — berichten */}
          <div>
            <div className="flex items-center gap-3">
              <Kicker>Ingezonden · {onread} ongelezen</Kicker>
              <div className="h-px flex-1" style={{ background: C.line }} />
            </div>
            <div className="mt-2 space-y-2.5">
              {BERICHTEN.map((b) => (
                <div key={b.van} className="flex items-baseline gap-2">
                  {b.ongelezen ? (
                    <Circle
                      size={7}
                      aria-hidden="true"
                      className="mt-1.5 shrink-0"
                      fill={C.red}
                      style={{ color: C.red }}
                    />
                  ) : (
                    <Circle
                      size={7}
                      aria-hidden="true"
                      className="mt-1.5 shrink-0"
                      style={{ color: C.faint }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] font-bold">{b.van}</span>
                      <span
                        className="shrink-0 text-[10px] tabular-nums"
                        style={{ color: C.faint }}
                      >
                        {b.tijd}
                      </span>
                    </div>
                    <p className="truncate text-[11.5px] italic" style={{ color: C.muted }}>
                      “{b.preview}”
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Marktplaats --------------------------------- */

function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <SectionHead
        katern={SECTIE.marktplaats.katern}
        pagina={SECTIE.marktplaats.pagina}
        title="Open opdrachten"
        sub="Advertenties en aanbestedingen, gerangschikt naar aansluiting op uw profiel."
      />

      {/* Zoekregel */}
      <div
        className="mb-6 flex items-center gap-3 px-4 py-3"
        style={{ background: C.paperCard, border: `1px solid ${C.ink}` }}
      >
        <Search size={15} aria-hidden="true" style={{ color: C.muted }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek in advertenties op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13px] outline-none placeholder:italic"
          style={{ color: C.ink }}
        />
        <span className="shrink-0 text-[11px] tabular-nums" style={{ color: C.faint }}>
          {filtered.length} / {OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.red }}>
            Geen resultaat
          </p>
          <p
            className="mx-auto mt-2 max-w-md text-[22px] font-black leading-tight"
            style={{ ...display, color: C.ink }}
          >
            Geen advertentie gevonden voor “{q}”
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] italic" style={{ color: C.muted }}>
            Pas uw zoekterm aan of verbreed uw beschikbaarheid. Nieuwe advertenties verschijnen in
            de eerstvolgende editie.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-4 text-[12px] font-bold uppercase tracking-[0.08em] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: C.red }}
          >
            Toon alle advertenties
          </button>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2"
          style={{ borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.line}` }}
        >
          {filtered.map((o, i) => (
            <button
              key={o.id}
              onClick={onOpen}
              className="group flex flex-col p-5 text-left transition-colors hover:bg-[#efe9db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
              style={{
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                borderTop: i >= 2 ? "none" : "none",
              }}
            >
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.12em]"
                  style={{ color: C.faint }}
                >
                  {o.id}
                </span>
                <span
                  className="text-[13px] font-black tabular-nums"
                  style={{ ...display, color: C.red }}
                >
                  {o.match}% match
                </span>
              </div>
              <h3
                className="mt-2 text-[21px] font-black leading-[1.05]"
                style={{ ...display, color: C.ink }}
              >
                {o.titel}
              </h3>
              <p
                className="mt-1.5 flex items-center gap-1.5 text-[12px] italic"
                style={{ color: C.muted }}
              >
                <MapPin size={12} aria-hidden="true" /> {o.opdrachtgever} · {o.plaats}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: C.inkSoft }}
                  >
                    · {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-auto flex items-baseline justify-between border-t pt-3 text-[12.5px]"
                style={{ borderColor: C.line, marginTop: "1rem" }}
              >
                <span className="font-black tabular-nums" style={{ ...display, color: C.ink }}>
                  {o.tarief}
                </span>
                <span className="italic tabular-nums" style={{ color: C.muted }}>
                  {o.uren} · {o.start}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Opdrachtdossier ------------------------------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  return (
    <div>
      <SectionHead
        katern={SECTIE.opdracht.katern}
        pagina={SECTIE.opdracht.pagina}
        title={opdracht.titel}
        sub={`${opdracht.opdrachtgever} · ${opdracht.plaats} — volledige aanbesteding en onderbouwing`}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] italic" style={{ color: C.muted }}>
          Dossiernummer {opdracht.id} · bijgewerkt in deze editie
        </p>
        <button
          className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ color: C.paper, background: C.red, padding: "10px 18px" }}
        >
          Reageer op deze opdracht
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Kerncijfers — noteringstabel */}
      <div
        className="mb-7 grid grid-cols-2 sm:grid-cols-4"
        style={{ borderTop: `1px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}` }}
      >
        {[
          { l: "Tarief", v: opdracht.tarief },
          { l: "Omvang", v: opdracht.uren },
          { l: "Aanvang", v: opdracht.start },
          { l: "Match", v: `${opdracht.match}%` },
        ].map((m, i) => (
          <div
            key={m.l}
            className="px-4 py-4"
            style={{ borderLeft: i % 4 === 0 ? "none" : `1px solid ${C.line}` }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: C.muted }}
            >
              {m.l}
            </p>
            <p
              className="mt-1 text-[20px] font-black tabular-nums leading-none"
              style={{ ...display, color: C.ink }}
            >
              {m.v}
            </p>
          </div>
        ))}
      </div>

      {/* Waarom deze match — twee redactionele kolommen */}
      <div className="flex items-center gap-3">
        <Kicker red>Analyse · Waarom deze match</Kicker>
        <div className="h-px flex-1" style={{ background: C.line }} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h3 className="text-[16px] font-black" style={{ ...display, color: C.ink }}>
            Pleit vóór
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.plus.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-[13px] leading-snug">
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
        <div className="sm:border-l sm:pl-8" style={{ borderColor: C.line }}>
          <h3 className="text-[16px] font-black" style={{ ...display, color: C.red }}>
            Kanttekeningen
          </h3>
          <ul className="mt-3 space-y-2.5">
            {opdracht.redenen.min.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2.5 text-[13px] leading-snug"
                style={{ color: C.inkSoft }}
              >
                <Minus
                  size={15}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  style={{ color: C.red }}
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Slotalinea */}
      <div className="mt-7 border-t pt-4" style={{ borderColor: C.line }}>
        <p
          className="text-[13.5px] leading-[1.62] sm:[column-count:2]"
          style={{ color: C.inkSoft, columnGap: "1.75rem" }}
        >
          Het systeem weegt geverifieerde registraties, reistijd, beschikbaarheid en tarief. Deze
          aanbesteding scoort hoog omdat uw kernregistraties zijn bevestigd en het tarief boven uw
          ondergrens ligt. De genoemde kanttekeningen wijzigen de rangschikking niet wezenlijk, maar
          zijn het vermelden waard vóór u reageert. Reageren kost één handeling; de opdrachtgever
          ontvangt uw profiel met alle geverifieerde stukken.
        </p>
      </div>
    </div>
  );
}

/* --------------------------------- Verificatie --------------------------------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  return (
    <div>
      <SectionHead
        katern={SECTIE.verificatie.katern}
        pagina={SECTIE.verificatie.pagina}
        title="Register & verificatie"
        sub="De officiële noteringen van uw registraties, diploma’s en documenten."
      />

      {/* Vertrouwensbanner */}
      <div
        className="mb-7 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4"
        style={{ background: C.ink }}
      >
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: "#c9c3b4" }}
          >
            Vertrouwensniveau
          </p>
          <p className="text-[24px] font-black leading-none" style={{ ...display, color: C.paper }}>
            {PROFIEL.trust}
          </p>
        </div>
        <p className="text-[12.5px] leading-snug" style={{ color: "#d8d2c4" }}>
          <span className="font-bold tabular-nums" style={{ color: C.paper }}>
            {verified}
          </span>{" "}
          van{" "}
          <span className="font-bold tabular-nums" style={{ color: C.paper }}>
            {CREDENTIALS.length}
          </span>{" "}
          registraties geverifieerd. Eén stuk vraagt om verlenging. Alle documenten worden veilig en
          privé bewaard.
        </p>
      </div>

      {/* Register-tabel */}
      <div className="flex items-center gap-3">
        <Kicker>Registraties</Kicker>
        <div className="h-px flex-1" style={{ background: C.line }} />
      </div>
      <div
        className="mt-2 divide-y"
        style={{ borderTop: `1px solid ${C.ink}`, borderColor: C.line }}
      >
        {CREDENTIALS.map((c) => {
          const st = statusStyle(c.status);
          return (
            <div key={c.naam} className="flex items-center gap-4 py-3.5">
              <st.Icon
                size={18}
                aria-hidden="true"
                className="shrink-0"
                style={{ color: st.red ? C.red : C.ink }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold leading-tight" style={display}>
                  {c.naam}
                </p>
                <p className="text-[11.5px]" style={{ color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <span
                className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.08em]"
                style={{
                  color: st.red ? C.red : C.ink,
                  border: `1px solid ${st.red ? C.red : C.line}`,
                  padding: "3px 8px",
                }}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Archief — documenten */}
      <div className="mt-8 flex items-center gap-3">
        <Kicker>Archief · veilig bewaard</Kicker>
        <div className="h-px flex-1" style={{ background: C.line }} />
      </div>
      <div className="mt-2 overflow-x-auto" style={{ borderTop: `1px solid ${C.ink}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}
            >
              <th className="py-2.5 pr-4 font-bold">Document</th>
              <th className="py-2.5 pr-4 font-bold">Type</th>
              <th className="py-2.5 pr-4 font-bold">Grootte</th>
              <th className="py-2.5 pr-4 font-bold">Bijgewerkt</th>
              <th className="py-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {DOCUMENTEN.map((d) => {
              const st = statusStyle(d.status);
              return (
                <tr key={d.naam} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 text-[12.5px] font-semibold">
                      <FileText size={13} aria-hidden="true" style={{ color: C.muted }} />
                      {d.naam}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {d.type}
                  </td>
                  <td className="py-3 pr-4 text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {d.grootte}
                  </td>
                  <td className="py-3 pr-4 text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {d.bijgewerkt}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: st.red ? C.red : C.ink }}
                    >
                      <st.Icon size={12} aria-hidden="true" />
                      {st.label}
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

/* ----------------------------------- Acties ------------------------------------ */

function Acties() {
  return (
    <div>
      <SectionHead
        katern={SECTIE.acties.katern}
        pagina={SECTIE.acties.pagina}
        title="Agenda"
        sub="Wat vraagt vandaag om uw aandacht — één zaak tegelijk."
      />
      <div style={{ borderTop: `1px solid ${C.ink}` }}>
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          return (
            <article
              key={a.titel}
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start"
              style={{ borderBottom: `1px solid ${C.line}` }}
            >
              <div className="flex shrink-0 items-center gap-3 sm:w-32">
                <span
                  className="text-[28px] font-black tabular-nums leading-none"
                  style={{ ...display, color: warn ? C.red : C.faint }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: warn ? C.red : C.muted }}
                >
                  {warn ? (
                    <AlertTriangle size={12} aria-hidden="true" />
                  ) : (
                    <Clock size={12} aria-hidden="true" />
                  )}
                  {warn ? "Urgent" : "Ter info"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-[18px] font-black leading-tight"
                  style={{ ...display, color: C.ink }}
                >
                  {a.titel}
                </h3>
                <p className="mt-1 max-w-xl text-[13px] leading-snug" style={{ color: C.inkSoft }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="shrink-0 self-start text-[12px] font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  color: warn ? C.paper : C.ink,
                  background: warn ? C.red : "transparent",
                  border: `1px solid ${warn ? C.red : C.ink}`,
                  padding: "8px 14px",
                }}
              >
                {a.cta}
              </button>
            </article>
          );
        })}
      </div>
      <p className="mt-5 text-[12px] italic" style={{ color: C.muted }}>
        Nieuwe agendapunten verschijnen zodra ze relevant worden — u hoeft niets in de gaten te
        houden.
      </p>
    </div>
  );
}

/* ---------------------------------- Facturen ----------------------------------- */

function Facturen() {
  const totaal = "€ 4.422";
  return (
    <div>
      <SectionHead
        katern={SECTIE.facturen.katern}
        pagina={SECTIE.facturen.pagina}
        title="Financieel katern"
        sub="Uitgegeven facturen en hun status — de noteringen van deze maand."
      />

      {/* Beursstrook */}
      <div
        className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3"
        style={{ background: C.paperWarm, border: `1px solid ${C.line}` }}
      >
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.muted }}
          >
            Totaal deze maand
          </span>
          <p
            className="text-[20px] font-black tabular-nums leading-none"
            style={{ ...display, color: C.ink }}
          >
            {totaal}
          </p>
        </div>
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: C.muted }}
          >
            Openstaand
          </span>
          <p
            className="text-[20px] font-black tabular-nums leading-none"
            style={{ ...display, color: C.red }}
          >
            € 1.350
          </p>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ borderTop: `2px solid ${C.ink}` }}>
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] uppercase tracking-[0.1em]"
              style={{ color: C.muted, borderBottom: `1px solid ${C.ink}` }}
            >
              <th className="py-3 pr-4 font-bold">Nummer</th>
              <th className="py-3 pr-4 font-bold">Klant</th>
              <th className="py-3 pr-4 font-bold">Datum</th>
              <th className="py-3 pr-4 text-right font-bold">Bedrag</th>
              <th className="py-3 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f) => {
              const open = f.status === "Openstaand";
              const concept = f.status === "Concept";
              return (
                <tr key={f.nr} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                  <td className="py-3.5 pr-4 text-[12px] tabular-nums" style={{ color: C.inkSoft }}>
                    {f.nr}
                  </td>
                  <td className="py-3.5 pr-4 text-[13px] font-semibold">{f.klant}</td>
                  <td className="py-3.5 pr-4 text-[12px] tabular-nums" style={{ color: C.muted }}>
                    {f.datum}
                  </td>
                  <td
                    className="py-3.5 pr-4 text-right text-[14px] font-black tabular-nums"
                    style={{ ...display, color: C.ink }}
                  >
                    {f.bedrag}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: open ? C.red : concept ? C.faint : C.ink }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: open ? C.red : concept ? C.faint : C.ink }}
                        aria-hidden="true"
                      />
                      {f.status}
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
