"use client";

// Concept 340 — "Galerie" · museumzaal in de geest van een white-cube-expositie (light).
// Museale rust: heel veel witruimte, elk datapunt "opgehangen" als een werk met een klein
// expositielabel (titel + technisch bijschrift in kleine caps), dunne passe-partout-kaders en
// serif-titeltypografie. Ceremonieel-premium, maar minimalistisch — curatie en rust, geen drukte.
// Onderscheidend van een veilinghuis: hier geen prijzenslag, wel museale ordening en stilte.
// Statuschips: altijd label + icoon. Fonts: --font-lab-instrument-serif (titels) +
// --font-lab-franklin (lopende tekst) + --font-lab-mono (expositielabels/bijschriften).

import { useEffect, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Check,
  MapPin,
  RotateCcw,
  CircleAlert,
  Frame,
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

/* ---------- Palet (white-cube, museale rust) ---------- */

const C = {
  canvas: "#f4f2ee", // warme galerie-vloer
  wall: "#fbfaf7", // white-cube-muur
  surface: "#ffffff",
  ink: "#1c1a17",
  inkSoft: "#3f3b35",
  sub: "#6d675d",
  faint: "#a49c8f",
  line: "#e6e2d9",
  lineSoft: "#efece4",
  frame: "#d8d2c6", // passe-partout-kader
  accent: "#7a2e2a", // museaal bordeaux — spaarzaam
  accentSoft: "#f3e9e7",
  gold: "#8a6d34",
  ok: "#2f6a3f",
  okSoft: "#e6f0e7",
  info: "#3a5a86",
  infoSoft: "#e8eef6",
  warn: "#93641c",
  warnSoft: "#f5ecd7",
  alert: "#a33734",
  alertSoft: "#f6e6e4",
};

const serif = { fontFamily: "var(--font-lab-instrument-serif), Georgia, serif" };
const body = { fontFamily: "var(--font-lab-franklin), system-ui, sans-serif" };
const label = { fontFamily: "var(--font-lab-mono), ui-monospace, monospace" };

const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a2e2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbfaf7]";

/* ---------- Status → betekenis ---------- */

type Tone = { label: string; fg: string; soft: string; Icon: LucideIcon };

function credTone(s: CredStatus): Tone {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", fg: C.ok, soft: C.okSoft, Icon: BadgeCheck };
    case "SUBMITTED":
      return { label: "In beoordeling", fg: C.info, soft: C.infoSoft, Icon: Clock };
    case "EXPIRING":
      return { label: "Verloopt", fg: C.warn, soft: C.warnSoft, Icon: AlertTriangle };
    case "REJECTED":
      return { label: "Afgewezen", fg: C.alert, soft: C.alertSoft, Icon: XCircle };
  }
}

function factuurTone(status: string): Tone {
  if (status === "Betaald") return { label: "Betaald", fg: C.ok, soft: C.okSoft, Icon: Check };
  if (status === "Openstaand")
    return { label: "Openstaand", fg: C.warn, soft: C.warnSoft, Icon: Clock };
  return { label: "Concept", fg: C.faint, soft: C.lineSoft, Icon: FileText };
}

function euros(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

// Zaal-nummering, museaal.
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/* ---------- Kleine bouwstenen ---------- */

// Expositielabel: klein bijschrift in kleine caps, zoals naast een museaal werk.
function ExhibitLabel({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return (
    <div className="inline-block">
      {kicker && (
        <p
          className="text-[9.5px] uppercase tracking-[0.28em]"
          style={{ ...label, color: C.faint }}
        >
          {kicker}
        </p>
      )}
      <p
        className="mt-0.5 text-[10.5px] uppercase tracking-[0.16em]"
        style={{ ...label, color: C.sub }}
      >
        {children}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: CredStatus }) {
  const t = credTone(status);
  const Icon = t.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
      style={{ ...label, color: t.fg, borderColor: t.fg + "44", background: t.soft }}
    >
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {t.label}
    </span>
  );
}

// Passe-partout: dun museaal kader met binnen-witmarge.
function Passepartout({
  children,
  className = "",
  onClick,
  as = "div",
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "button";
  ariaLabel?: string;
}) {
  const style: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.frame}`,
    boxShadow: "0 1px 0 rgba(28,26,23,0.02)",
  };
  if (as === "button") {
    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`block w-full text-left transition-colors hover:border-[#7a2e2a55] ${RING} ${className}`}
        style={style}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full" style={{ background: C.line }} aria-hidden="true" />;
}

/* ---------- Zaal-kop (museale paginatitel) ---------- */

function GalleryHead({
  zaal,
  kicker,
  title,
  sub,
  right,
}: {
  zaal: string;
  kicker: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b px-8 pb-8 pt-10" style={{ borderColor: C.line }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ ...label, color: C.accent }}
          >
            Zaal {zaal} · {kicker}
          </p>
          <h1
            className="mt-3 text-[38px] font-normal leading-[1.05] tracking-tight sm:text-[46px]"
            style={{ ...serif, color: C.ink }}
          >
            {title}
          </h1>
          {sub && (
            <p
              className="mt-3 max-w-xl text-[13.5px] leading-relaxed"
              style={{ ...body, color: C.sub }}
            >
              {sub}
            </p>
          )}
        </div>
        {right}
      </div>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

export function Concept340() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const openOpdracht = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 340);
    return () => window.clearTimeout(t);
  }, [screen]);

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...body, background: C.canvas, color: C.ink }}
    >
      <style>{`@keyframes ga-fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ga-pulse{0%,100%{opacity:.5}50%{opacity:.85}}`}</style>

      {/* Museale kop-band */}
      <header className="border-b" style={{ borderColor: C.line, background: C.wall }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center border text-[15px]"
              style={{ ...serif, borderColor: C.ink, color: C.ink }}
              aria-hidden="true"
            >
              Z
            </span>
            <div className="leading-none">
              <p className="text-[16px] tracking-tight" style={{ ...serif, color: C.ink }}>
                Galerie
              </p>
              <p
                className="mt-1 text-[8.5px] uppercase tracking-[0.34em]"
                style={{ ...label, color: C.faint }}
              >
                Collectie ZZP
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button
              aria-label="Zoeken in de collectie"
              className={`border p-2 transition-colors hover:bg-[#f4f2ee] ${RING}`}
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Search size={15} aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center border text-[11px] uppercase tracking-wider"
                style={{ ...label, borderColor: C.ink, color: C.ink }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-[13px]" style={{ ...serif, color: C.ink }}>
                  {PROFIEL.naam}
                </p>
                <p
                  className="mt-0.5 flex items-center gap-1 text-[9px] uppercase tracking-[0.16em]"
                  style={{ ...label, color: C.ok }}
                >
                  <ShieldCheck size={10} aria-hidden="true" /> {PROFIEL.trust}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Zaal-plattegrond (navigatie als tentoonstellingsroute) */}
        <nav
          className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6 pb-3"
          aria-label="Tentoonstellingsroute"
        >
          {SCREENS.map((s, i) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-2 pb-1 ${RING}`}
                style={{ borderBottom: `2px solid ${on ? C.accent : "transparent"}` }}
              >
                <span
                  className="text-[9px] uppercase tracking-[0.2em]"
                  style={{ ...label, color: on ? C.accent : C.faint }}
                >
                  {ROMAN[i]}
                </span>
                <span className="text-[13px]" style={{ ...serif, color: on ? C.ink : C.sub }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Zaal (content) */}
      <div key={screen} style={{ animation: "ga-fade 0.34s ease" }}>
        {!ready ? (
          <GallerySkeleton />
        ) : (
          <>
            {screen === "dashboard" && <Dashboard onOpen={openOpdracht} onGo={setScreen} />}
            {screen === "marktplaats" && <Marktplaats onOpen={openOpdracht} />}
            {screen === "opdracht" && (
              <OpdrachtDetail opdracht={active} onBack={() => setScreen("marktplaats")} />
            )}
            {screen === "verificatie" && <Verificatie onGo={setScreen} />}
            {screen === "acties" && <Acties onGo={setScreen} />}
            {screen === "facturen" && <Facturen />}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Skeleton ---------- */

function GallerySkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-16" role="status" aria-live="polite">
      <span className="sr-only">De zaal wordt ingericht…</span>
      <div
        className="mx-auto h-10 w-64"
        style={{ background: C.wall, animation: "ga-pulse 1.3s infinite" }}
      />
      <div className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="h-40 w-full"
              style={{
                background: C.surface,
                border: `1px solid ${C.frame}`,
                animation: "ga-pulse 1.3s infinite",
              }}
            />
            <div
              className="mt-4 h-3 w-24"
              style={{ background: C.wall, animation: "ga-pulse 1.3s infinite" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Dashboard (hoofdzaal) ---------- */

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const warn = ACTIES[0];

  return (
    <div>
      <GalleryHead
        zaal="I"
        kicker="Overzicht"
        title={`Welkom, ${PROFIEL.naam.split(" ")[0]}`}
        sub="Uw praktijk, gecureerd als een expositie. Elk getal hangt als een werk aan de muur — met rust, ruimte en een klein bijschrift dat vertelt wat het betekent."
      />

      <div className="mx-auto max-w-5xl px-8 py-14">
        {/* KPI's als opgehangen werken met expositielabels */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k, i) => (
            <figure key={k.label} className="flex flex-col items-center text-center">
              <div
                className="flex h-32 w-full items-center justify-center px-4"
                style={{ background: C.surface, border: `1px solid ${C.frame}` }}
              >
                <span
                  className="text-[34px] tabular-nums leading-none"
                  style={{ ...serif, color: C.ink }}
                >
                  {k.value}
                </span>
              </div>
              <figcaption className="mt-4">
                <ExhibitLabel kicker={`Nr. ${ROMAN[i]}`}>{k.label}</ExhibitLabel>
                <p
                  className="mt-1.5 text-[10px] uppercase tracking-[0.14em]"
                  style={{ ...label, color: k.up ? C.ok : C.warn }}
                >
                  {k.up ? "▲" : "▽"} {k.trend}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="my-16">
          <Divider />
        </div>

        {/* Aanbevolen werken (top-matches) */}
        <div className="mb-8 text-center">
          <p
            className="text-[10px] uppercase tracking-[0.34em]"
            style={{ ...label, color: C.accent }}
          >
            Aanbevolen selectie
          </p>
          <h2 className="mt-2 text-[26px]" style={{ ...serif, color: C.ink }}>
            Werken die bij u passen
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {OPDRACHTEN.map((o, i) => (
            <MatchWork key={o.id} opdracht={o} index={i} onOpen={() => onOpen(o.id)} />
          ))}
        </div>

        {/* Curator-notitie (volgende actie) */}
        {warn && (
          <div className="mt-16">
            <div
              className="mx-auto max-w-2xl px-8 py-8 text-center"
              style={{ background: C.wall, border: `1px solid ${C.line}` }}
              role="status"
            >
              <p
                className="text-[9.5px] uppercase tracking-[0.34em]"
                style={{ ...label, color: C.accent }}
              >
                Curatornotitie
              </p>
              <h3 className="mt-3 text-[22px] leading-snug" style={{ ...serif, color: C.ink }}>
                {warn.titel}
              </h3>
              <p
                className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed"
                style={{ ...body, color: C.sub }}
              >
                {warn.detail}
              </p>
              <button
                onClick={() => onGo("verificatie")}
                className={`mt-5 inline-flex items-center gap-2 border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-[#7a2e2a] hover:text-white ${RING}`}
                style={{ ...label, borderColor: C.accent, color: C.accent }}
              >
                {warn.cta} <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Een top-match als opgehangen werk met expositielabel.
function MatchWork({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  return (
    <figure className="flex flex-col">
      <Passepartout as="button" onClick={onOpen} ariaLabel={`Bekijk ${opdracht.titel}`}>
        <div className="p-6" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
          <div className="flex items-start justify-between">
            <span
              className="text-[9px] uppercase tracking-[0.24em]"
              style={{ ...label, color: C.faint }}
            >
              {opdracht.id}
            </span>
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full border text-[13px] tabular-nums"
              style={{ ...serif, borderColor: C.frame, color: C.accent }}
              aria-label={`Match ${opdracht.match} procent`}
            >
              {opdracht.match}
            </span>
          </div>
          <h3 className="mt-4 text-[19px] leading-tight" style={{ ...serif, color: C.ink }}>
            {opdracht.titel}
          </h3>
          <p
            className="mt-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em]"
            style={{ ...label, color: C.sub }}
          >
            <MapPin size={11} aria-hidden="true" /> {opdracht.plaats}
          </p>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5">
          <span className="text-[13px]" style={{ ...serif, color: C.ink }}>
            {opdracht.tarief}
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ ...label, color: C.faint }}
          >
            {opdracht.uren}
          </span>
        </div>
      </Passepartout>
      <figcaption className="mt-3 px-1">
        <ExhibitLabel kicker={`Werk ${ROMAN[index]}`}>{opdracht.opdrachtgever}</ExhibitLabel>
      </figcaption>
    </figure>
  );
}

/* ---------- Marktplaats (grote zaal) ---------- */

function Marktplaats({ onOpen }: { onOpen: (id?: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <GalleryHead
        zaal="II"
        kicker="Collectie"
        title="De marktplaats"
        sub="Alle beschikbare opdrachten, opgehangen als een lopende expositie. Neem de tijd; loop de zaal rond."
        right={
          <div
            className="flex items-center gap-2 border px-3 py-2"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <Search size={14} style={{ color: C.faint }} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Zoek in de collectie…"
              aria-label="Opdrachten zoeken"
              className="w-40 bg-transparent text-[12px] outline-none sm:w-52"
              style={{ ...body, color: C.ink }}
            />
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-8 py-14">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center border"
              style={{ borderColor: C.frame, background: C.surface }}
              aria-hidden="true"
            >
              <Frame size={22} style={{ color: C.faint }} />
            </span>
            <h3 className="mt-5 text-[24px]" style={{ ...serif, color: C.ink }}>
              De zaal is leeg
            </h3>
            <p
              className="mt-2 max-w-xs text-[13px] leading-relaxed"
              style={{ ...body, color: C.sub }}
            >
              Geen enkel werk komt overeen met “{q}”. Verruim uw blik en zoek opnieuw.
            </p>
            <button
              onClick={() => setQ("")}
              className={`mt-5 inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] ${RING}`}
              style={{ ...label, borderColor: C.line, color: C.ink }}
            >
              <RotateCcw size={12} aria-hidden="true" /> Zoekopdracht wissen
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {filtered.map((o, i) => (
              <article
                key={o.id}
                className="grid grid-cols-1 items-start gap-8 sm:grid-cols-[1fr,auto]"
              >
                <div>
                  <ExhibitLabel kicker={`Zaal II · Werk ${ROMAN[i]}`}>{o.id}</ExhibitLabel>
                  <h3 className="mt-3 text-[27px] leading-tight" style={{ ...serif, color: C.ink }}>
                    {o.titel}
                  </h3>
                  <p className="mt-2 text-[13px]" style={{ ...body, color: C.sub }}>
                    {o.opdrachtgever} · {o.plaats}
                  </p>
                  {/* Technisch bijschrift, museaal */}
                  <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-2">
                    {[
                      { l: "Techniek", v: o.tags.join(", ") },
                      { l: "Tarief", v: o.tarief },
                      { l: "Omvang", v: o.uren },
                      { l: "Aanvang", v: o.start },
                    ].map((m) => (
                      <div key={m.l}>
                        <dt
                          className="text-[9px] uppercase tracking-[0.2em]"
                          style={{ ...label, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                        <dd className="mt-0.5 text-[12.5px]" style={{ ...body, color: C.ink }}>
                          {m.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex flex-col items-start gap-4 sm:items-end">
                  <span
                    className="flex h-16 w-16 flex-col items-center justify-center rounded-full border"
                    style={{ borderColor: C.frame }}
                    aria-label={`Match ${o.match} procent`}
                  >
                    <span
                      className="text-[18px] tabular-nums leading-none"
                      style={{ ...serif, color: C.accent }}
                    >
                      {o.match}
                    </span>
                    <span
                      className="mt-0.5 text-[7.5px] uppercase tracking-[0.18em]"
                      style={{ ...label, color: C.faint }}
                    >
                      match
                    </span>
                  </span>
                  <button
                    onClick={() => onOpen(o.id)}
                    className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-[#1c1a17] hover:text-white ${RING}`}
                    style={{ ...label, borderColor: C.ink, color: C.ink }}
                  >
                    Bekijk <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
            {filtered.map((o, i) =>
              i < filtered.length - 1 ? <Divider key={`d-${o.id}`} /> : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Opdracht-detail (zaal-solo) ---------- */

function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 820);
  };

  return (
    <div>
      <div className="border-b px-8 py-4" style={{ borderColor: C.line, background: C.wall }}>
        <div className="mx-auto max-w-5xl">
          <button
            onClick={onBack}
            className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] ${RING}`}
            style={{ ...label, color: C.sub }}
          >
            <ArrowLeft size={13} aria-hidden="true" /> Terug naar de collectie
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8 py-14">
        {/* Solo-presentatie */}
        <div className="text-center">
          <ExhibitLabel kicker={`Zaal III · ${opdracht.id}`}>
            {opdracht.opdrachtgever} · {opdracht.plaats}
          </ExhibitLabel>
          <h1
            className="mx-auto mt-4 max-w-2xl text-[40px] leading-[1.08]"
            style={{ ...serif, color: C.ink }}
          >
            {opdracht.titel}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-4">
            <span
              className="flex h-20 w-20 flex-col items-center justify-center rounded-full border"
              style={{ borderColor: C.accent }}
              aria-label={`Match ${opdracht.match} procent`}
            >
              <span
                className="text-[24px] tabular-nums leading-none"
                style={{ ...serif, color: C.accent }}
              >
                {opdracht.match}
              </span>
              <span
                className="mt-0.5 text-[8px] uppercase tracking-[0.2em]"
                style={{ ...label, color: C.faint }}
              >
                match
              </span>
            </span>
          </div>
          <button
            onClick={react}
            disabled={state !== "idle"}
            className={`mt-8 inline-flex items-center gap-2 px-7 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-90 ${RING}`}
            style={{
              ...label,
              background: state === "sent" ? C.ok : C.ink,
              color: "#fff",
            }}
          >
            {state === "idle" && (
              <>
                Reageer op deze opdracht <ArrowRight size={13} aria-hidden="true" />
              </>
            )}
            {state === "sending" && "Versturen…"}
            {state === "sent" && (
              <>
                <Check size={13} strokeWidth={3} aria-hidden="true" /> Verstuurd
              </>
            )}
          </button>
        </div>

        <div className="my-14">
          <Divider />
        </div>

        {/* Technisch bijschrift + herkomst */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr,1fr]">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ ...label, color: C.accent }}
            >
              Bijschrift
            </p>
            <dl className="mt-5 divide-y" style={{ borderColor: C.line }}>
              {[
                { l: "Tarief", v: opdracht.tarief },
                { l: "Omvang", v: opdracht.uren },
                { l: "Aanvang", v: opdracht.start },
                { l: "Techniek", v: opdracht.tags.join(" · ") },
              ].map((m) => (
                <div
                  key={m.l}
                  className="flex items-baseline justify-between py-3"
                  style={{ borderColor: C.line }}
                >
                  <dt
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ ...label, color: C.faint }}
                  >
                    {m.l}
                  </dt>
                  <dd className="text-[14px]" style={{ ...serif, color: C.ink }}>
                    {m.v}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Herkomst / verklaarbare match */}
            <div className="mt-10">
              <p
                className="text-[10px] uppercase tracking-[0.28em]"
                style={{ ...label, color: C.accent }}
              >
                Herkomst van de match
              </p>
              <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div>
                  <p
                    className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em]"
                    style={{ ...label, color: C.ok }}
                  >
                    <Check size={12} strokeWidth={3} aria-hidden="true" /> Pluspunten
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {opdracht.redenen.plus.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2.5 text-[13px] leading-snug"
                        style={{ ...body, color: C.ink }}
                      >
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                          style={{ background: C.ok }}
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p
                    className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em]"
                    style={{ ...label, color: C.warn }}
                  >
                    <AlertTriangle size={12} aria-hidden="true" /> Aandachtspunten
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {opdracht.redenen.min.map((r) => (
                      <li
                        key={r}
                        className="flex items-start gap-2.5 text-[13px] leading-snug"
                        style={{ ...body, color: C.sub }}
                      >
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                          style={{ background: C.warn }}
                          aria-hidden="true"
                        />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance als certificaat-plaquette */}
          <aside>
            <div
              className="px-6 py-7"
              style={{ background: C.wall, border: `1px solid ${C.line}` }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.24em]"
                style={{ ...label, color: C.accent }}
              >
                Vereiste bewijsstukken
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ ...body, color: C.sub }}>
                Voor toelating tot deze opdracht. U voldoet aan de kern-eisen.
              </p>
              <ul className="mt-5 space-y-4">
                {CREDENTIALS.slice(0, 3).map((c) => (
                  <li key={c.naam}>
                    <p className="text-[13px]" style={{ ...serif, color: C.ink }}>
                      {c.naam}
                    </p>
                    <div className="mt-1.5">
                      <StatusChip status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ---------- Verificatie (certificatenkabinet) ---------- */

function Verificatie({ onGo }: { onGo: (k: ScreenKey) => void }) {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const total = CREDENTIALS.length;
  const expiring = CREDENTIALS.find((c) => c.status === "EXPIRING");

  return (
    <div>
      <GalleryHead
        zaal="IV"
        kicker="Kabinet"
        title="Verificatie"
        sub="Uw bewijsstukken, gecureerd en geplaquetteerd. Elk geverifieerd stuk verhoogt het vertrouwen dat opdrachtgevers in uw werk stellen."
        right={
          <div className="text-right">
            <p className="text-[46px] tabular-nums leading-none" style={{ ...serif, color: C.ink }}>
              {verified}
              <span className="text-[22px]" style={{ color: C.faint }}>
                /{total}
              </span>
            </p>
            <p
              className="mt-1 text-[9px] uppercase tracking-[0.2em]"
              style={{ ...label, color: C.sub }}
            >
              Geverifieerd
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-8 py-14">
        {expiring && (
          <div
            className="mb-12 flex flex-wrap items-center gap-4 px-6 py-4"
            style={{ background: C.warnSoft, border: `1px solid ${C.warn}44` }}
            role="alert"
          >
            <AlertTriangle
              size={18}
              style={{ color: C.warn }}
              className="shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-[200px] flex-1">
              <p className="text-[14px]" style={{ ...serif, color: C.ink }}>
                {expiring.naam} verloopt binnenkort
              </p>
              <p className="mt-0.5 text-[12px]" style={{ ...body, color: C.sub }}>
                {expiring.detail}. Vernieuw tijdig om uw vertrouwensniveau te behouden.
              </p>
            </div>
            <button
              onClick={() => onGo("acties")}
              className={`inline-flex items-center gap-2 border px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] ${RING}`}
              style={{ ...label, borderColor: C.warn, color: C.warn }}
            >
              Vernieuwen <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Plaquettes */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
          {CREDENTIALS.map((c, i) => {
            const t = credTone(c.status);
            const Icon = t.Icon;
            return (
              <figure key={c.naam} className="flex gap-5">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center border"
                  style={{ borderColor: C.frame, background: C.surface }}
                  aria-hidden="true"
                >
                  <Icon size={24} style={{ color: t.fg }} />
                </div>
                <figcaption
                  className="min-w-0 flex-1 border-l pl-5"
                  style={{ borderColor: C.line }}
                >
                  <p
                    className="text-[9px] uppercase tracking-[0.24em]"
                    style={{ ...label, color: C.faint }}
                  >
                    Bewijsstuk {ROMAN[i]}
                  </p>
                  <h3
                    className="mt-1.5 text-[19px] leading-tight"
                    style={{ ...serif, color: C.ink }}
                  >
                    {c.naam}
                  </h3>
                  <p className="mt-1.5 text-[12px]" style={{ ...body, color: C.sub }}>
                    {c.detail}
                  </p>
                  <div className="mt-3">
                    <StatusChip status={c.status} />
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Acties (curator-agenda) ---------- */

function Acties({ onGo }: { onGo: (k: ScreenKey) => void }) {
  return (
    <div>
      <GalleryHead
        zaal="V"
        kicker="Agenda"
        title="Volgende acties"
        sub="De curatoragenda: wat vraagt nu uw aandacht, op volgorde van belang. Rustig afgewerkt, ceremonieel bijgehouden."
      />

      <div className="mx-auto max-w-4xl px-8 py-14">
        <ol className="space-y-0">
          {ACTIES.map((a, i) => {
            const warn = a.urgentie === "warning";
            const fg = warn ? C.warn : C.info;
            return (
              <li
                key={a.titel}
                className="grid grid-cols-[auto,1fr] items-start gap-6 py-8"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full border text-[16px] tabular-nums"
                  style={{ ...serif, borderColor: C.frame, color: C.ink }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[200px] flex-1">
                    <p
                      className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.2em]"
                      style={{ ...label, color: fg }}
                    >
                      {warn ? (
                        <AlertTriangle size={11} aria-hidden="true" />
                      ) : (
                        <Frame size={11} aria-hidden="true" />
                      )}
                      {warn ? "Waarschuwing" : "Gelegenheid"}
                    </p>
                    <h3
                      className="mt-2 text-[21px] leading-snug"
                      style={{ ...serif, color: C.ink }}
                    >
                      {a.titel}
                    </h3>
                    <p
                      className="mt-1.5 max-w-lg text-[13px] leading-relaxed"
                      style={{ ...body, color: C.sub }}
                    >
                      {a.detail}
                    </p>
                  </div>
                  <button
                    onClick={() => onGo(warn ? "verificatie" : "marktplaats")}
                    className={`inline-flex items-center gap-2 border px-4 py-2 text-[10.5px] uppercase tracking-[0.16em] transition-colors hover:bg-[#1c1a17] hover:text-white ${RING}`}
                    style={{ ...label, borderColor: C.ink, color: C.ink }}
                  >
                    {a.cta} <ArrowRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className="mt-8 px-6 py-5 text-center"
          style={{ background: C.wall, border: `1px solid ${C.line}` }}
        >
          <p className="text-[12.5px]" style={{ ...body, color: C.sub }}>
            Verder is de zaal in orde. Nieuwe gelegenheden worden hier vanzelf opgehangen.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Facturen (financieel register) ---------- */

function Facturen() {
  const [errored, setErrored] = useState(false);
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + euros(f.bedrag),
    0,
  );

  return (
    <div>
      <GalleryHead
        zaal="VI"
        kicker="Register"
        title="Facturen"
        sub="Het financiële register van de collectie: wat is ontvangen en wat nog onderweg is, ceremonieel bijgehouden."
        right={
          <div className="flex gap-10">
            <div className="text-right">
              <p
                className="text-[28px] tabular-nums leading-none"
                style={{ ...serif, color: C.ok }}
              >
                € {betaald.toLocaleString("nl-NL")}
              </p>
              <p
                className="mt-1 text-[9px] uppercase tracking-[0.2em]"
                style={{ ...label, color: C.sub }}
              >
                Ontvangen
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[28px] tabular-nums leading-none"
                style={{ ...serif, color: C.warn }}
              >
                € {open.toLocaleString("nl-NL")}
              </p>
              <p
                className="mt-1 text-[9px] uppercase tracking-[0.2em]"
                style={{ ...label, color: C.sub }}
              >
                Openstaand
              </p>
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-5xl px-8 py-14">
        <div className="mb-6 flex items-center justify-between">
          <ExhibitLabel kicker="Zaal VI">Financieel register</ExhibitLabel>
          <button
            onClick={() => setErrored((v) => !v)}
            className={`text-[10px] uppercase tracking-[0.16em] ${RING}`}
            style={{ ...label, color: C.faint }}
          >
            {errored ? "Herstel weergave" : "Ververs"}
          </button>
        </div>

        {errored ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
            <CircleAlert size={24} style={{ color: C.alert }} aria-hidden="true" />
            <h3 className="mt-3 text-[22px]" style={{ ...serif, color: C.ink }}>
              Register niet beschikbaar
            </h3>
            <p
              className="mt-2 max-w-xs text-[13px] leading-relaxed"
              style={{ ...body, color: C.sub }}
            >
              Het register kon niet worden geladen. Probeer de weergave te herstellen.
            </p>
            <button
              onClick={() => setErrored(false)}
              className={`mt-5 inline-flex items-center gap-2 border px-4 py-2 text-[11px] uppercase tracking-[0.16em] ${RING}`}
              style={{ ...label, borderColor: C.line, color: C.ink }}
            >
              <RotateCcw size={12} aria-hidden="true" /> Herstellen
            </button>
          </div>
        ) : (
          <div style={{ borderTop: `1px solid ${C.ink}` }}>
            {FACTUREN.map((f) => {
              const t = factuurTone(f.status);
              return (
                <div
                  key={f.nr}
                  className="grid grid-cols-[auto,1fr,auto] items-center gap-6 py-5"
                  style={{ borderBottom: `1px solid ${C.line}` }}
                >
                  <span
                    className="w-28 text-[10px] uppercase tabular-nums tracking-[0.14em]"
                    style={{ ...label, color: C.faint }}
                  >
                    {f.nr}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px]" style={{ ...serif, color: C.ink }}>
                      {f.klant}
                    </p>
                    <p
                      className="mt-0.5 text-[10px] uppercase tracking-[0.14em]"
                      style={{ ...label, color: C.faint }}
                    >
                      {f.datum}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[16px] tabular-nums" style={{ ...serif, color: C.ink }}>
                      {f.bedrag}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
                      style={{
                        ...label,
                        color: t.fg,
                        borderColor: t.fg + "44",
                        background: t.soft,
                      }}
                    >
                      <t.Icon size={11} aria-hidden="true" />
                      {t.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
