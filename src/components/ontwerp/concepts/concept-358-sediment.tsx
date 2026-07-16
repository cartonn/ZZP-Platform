"use client";

// Concept 358 — "Sediment" · Geologische lagen / stratigrafie als informatie-architectuur.
// Horizontale aardetint-banden (zand, oker, klei, leisteen) dragen de structuur; elk scherm is
// gelaagd opgebouwd met stratigrafie-koppen en diepte-labels. Warme, tactiele, rustgevende
// datataal — meetwaarden in mono, koppen in serif. Navigatie is een verticale boorkern.
// Fonts: Fraunces (display), Newsreader (tekst/serif), JetBrains Mono (meetwaarden).

import { useState } from "react";
import {
  Layers,
  Search,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  MapPin,
  Wallet,
  ShieldCheck,
  Plus,
  Compass,
  Gauge,
  Mountain,
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
  type ScreenKey,
  type CredStatus,
  type Opdracht,
} from "./mock";

// ---- Aardetint-palet -----------------------------------------------------------------------
const STRATA = {
  sand: "#d8c9a8",
  ochre: "#b98b46",
  clay: "#a86b4c",
  slate: "#52606b",
  moss: "#5c6b4a",
  rust: "#a3492f",
};

const BG = "#f3ecdd"; // warm perkament
const PANEL = "#faf5ea";
const PANEL2 = "#f0e7d5";
const INK = "#332d25";
const MUTED = "#6f6553";
const FAINT = "#9b8f78";
const HAIR = "rgba(51,45,37,0.12)";
const HAIR2 = "rgba(51,45,37,0.07)";

const display = { fontFamily: "var(--font-lab-fraunces)" };
const serif = { fontFamily: "var(--font-lab-newsreader)" };
const mono = { fontFamily: "var(--font-lab-mono)" };

// Elke laag/scherm krijgt een tint + dieptebereik (metafoor: hoe dieper, hoe fundamenteler).
type Laag = { tint: string; diepte: string; Icon: LucideIcon };
const LAGEN: Record<ScreenKey, Laag> = {
  dashboard: { tint: STRATA.sand, diepte: "0–4 m", Icon: Layers },
  marktplaats: { tint: STRATA.ochre, diepte: "4–9 m", Icon: Compass },
  opdracht: { tint: STRATA.clay, diepte: "9–15 m", Icon: Mountain },
  verificatie: { tint: STRATA.slate, diepte: "15–22 m", Icon: ShieldCheck },
  acties: { tint: STRATA.moss, diepte: "22–28 m", Icon: Gauge },
  facturen: { tint: STRATA.rust, diepte: "28–35 m", Icon: Wallet },
  documenten: { tint: STRATA.sand, diepte: "—", Icon: Layers },
  berichten: { tint: STRATA.clay, diepte: "—", Icon: Layers },
};

function statusMeta(s: CredStatus): { label: string; Icon: LucideIcon; tint: string } {
  switch (s) {
    case "VERIFIED":
      return { label: "Geverifieerd", Icon: Check, tint: STRATA.moss };
    case "SUBMITTED":
      return { label: "In beoordeling", Icon: Clock, tint: STRATA.slate };
    case "EXPIRING":
      return { label: "Verloopt binnenkort", Icon: AlertTriangle, tint: STRATA.ochre };
    case "REJECTED":
      return { label: "Afgewezen", Icon: AlertTriangle, tint: STRATA.rust };
  }
}

// ---- Bouwstenen ----------------------------------------------------------------------------
function StratumHead({
  index,
  eyebrow,
  titel,
  diepte,
  tint,
}: {
  index: string;
  eyebrow: string;
  titel: string;
  diepte: string;
  tint: string;
}) {
  return (
    <div className="flex items-end gap-3 border-b pb-3" style={{ borderColor: HAIR }}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-[12px] font-bold tabular-nums text-white"
        style={{ ...mono, background: tint }}
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10.5px] font-medium uppercase tracking-[0.28em]"
          style={{ color: FAINT }}
        >
          {eyebrow}
        </p>
        <h2 className="mt-0.5 text-[19px] leading-tight" style={{ ...display, color: INK }}>
          {titel}
        </h2>
      </div>
      <span
        className="shrink-0 text-[11px] tabular-nums"
        style={{ ...mono, color: MUTED }}
        aria-hidden="true"
      >
        {diepte}
      </span>
    </div>
  );
}

function Meting({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="min-w-0">
      <p
        className="truncate text-[10.5px] font-medium uppercase tracking-[0.18em]"
        style={{ color: FAINT }}
      >
        {label}
      </p>
      <p className="mt-1 text-[18px] tabular-nums" style={{ ...mono, color: tint ?? INK }}>
        {value}
      </p>
    </div>
  );
}

function Chip({ children, tint }: { children: React.ReactNode; tint: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: tint, color: tint, background: `${tint}14` }}
    >
      {children}
    </span>
  );
}

// Dunne staafmeting (spark) in aardetinten — als een boorkern-kolom.
function CoreColumn({ data, tint }: { data: number[]; tint: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {data.map((v, i) => {
        const h = 22 + ((v - min) / span) * 78;
        return (
          <span
            key={i}
            className="w-full rounded-[1px]"
            style={{ height: `${h}%`, background: tint, opacity: 0.35 + (i / data.length) * 0.65 }}
          />
        );
      })}
    </div>
  );
}

// ============================================================================================
export function Concept358() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const laag = LAGEN[screen];
  const active = OPDRACHTEN[0] as Opdracht;

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...serif, background: BG, color: INK }}
    >
      <div className="mx-auto flex min-h-[680px] max-w-6xl flex-col md:flex-row">
        {/* Boorkern-navigatie: verticale gestapelde lagen */}
        <aside
          className="shrink-0 border-b md:w-60 md:border-b-0 md:border-r"
          style={{ borderColor: HAIR, background: PANEL }}
        >
          <div className="flex items-center gap-2.5 px-5 py-5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-sm text-white"
              style={{ background: STRATA.clay }}
              aria-hidden="true"
            >
              <Layers size={17} />
            </span>
            <div className="leading-tight">
              <p className="text-[17px]" style={{ ...display, color: INK }}>
                Sediment
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: FAINT }}>
                Boorprofiel
              </p>
            </div>
          </div>

          <nav
            className="flex gap-px overflow-x-auto px-3 pb-3 md:flex-col md:px-0 md:pb-0"
            aria-label="Hoofdnavigatie"
          >
            {SCREENS.map((s, i) => {
              const on = s.key === screen;
              const l = LAGEN[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => setScreen(s.key)}
                  aria-current={on ? "page" : undefined}
                  className="group relative flex shrink-0 items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset md:w-full"
                  style={{ background: on ? PANEL2 : "transparent" }}
                >
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full transition-all group-hover:h-10 motion-reduce:group-hover:h-9"
                    style={{ background: l.tint, opacity: on ? 1 : 0.5 }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-[13.5px] leading-tight"
                      style={{ ...serif, color: on ? INK : MUTED, fontWeight: on ? 600 : 400 }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="block text-[10px] tabular-nums"
                      style={{ ...mono, color: FAINT }}
                    >
                      laag {String(i + 1).padStart(2, "0")} · {l.diepte}
                    </span>
                  </span>
                  <l.Icon
                    size={15}
                    style={{ color: on ? l.tint : FAINT }}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                </button>
              );
            })}
          </nav>

          <div className="hidden border-t px-5 py-4 md:block" style={{ borderColor: HAIR2 }}>
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-sm text-[11px] font-bold text-white"
                style={{ ...mono, background: STRATA.slate }}
                aria-hidden="true"
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[12.5px]" style={{ color: INK }}>
                  {PROFIEL.naam}
                </p>
                <p className="truncate text-[10.5px]" style={{ color: FAINT }}>
                  {PROFIEL.rol}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Hoofdvenster */}
        <main className="min-w-0 flex-1 px-5 py-7 md:px-9 md:py-9">
          <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-8 rounded-sm"
                style={{ background: laag.tint }}
                aria-hidden="true"
              />
              <span
                className="text-[11px] uppercase tabular-nums tracking-[0.2em]"
                style={{ ...mono, color: MUTED }}
              >
                diepte {laag.diepte}
              </span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11.5px]"
              style={{
                borderColor: STRATA.moss,
                color: STRATA.moss,
                background: `${STRATA.moss}12`,
              }}
            >
              <ShieldCheck size={13} aria-hidden="true" />
              {PROFIEL.trust}
            </span>
          </header>

          {screen === "dashboard" && (
            <Dashboard onOpen={() => setScreen("opdracht")} onGo={setScreen} />
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

// ---- Dashboard -----------------------------------------------------------------------------
function Dashboard({ onOpen, onGo }: { onOpen: () => void; onGo: (s: ScreenKey) => void }) {
  return (
    <div className="space-y-9">
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.28em]" style={{ color: FAINT }}>
          Bovenlaag · vandaag
        </p>
        <h1
          className="mt-2 text-[34px] leading-tight sm:text-[40px]"
          style={{ ...display, color: INK }}
        >
          Goedemorgen, {PROFIEL.naam.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed" style={{ color: MUTED }}>
          Je profiel ligt stevig verankerd. In de lagen hieronder liggen drie nieuwe matches en één
          certificaat dat binnenkort aan de oppervlakte komt.
        </p>
      </section>

      {/* KPI-laag als kernmonsters */}
      <section>
        <StratumHead
          index="01"
          eyebrow="Kernmonster"
          titel="Kerncijfers"
          diepte="0–1 m"
          tint={STRATA.sand}
        />
        <div
          className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-sm border lg:grid-cols-4"
          style={{ borderColor: HAIR, background: HAIR }}
        >
          {KPIS.map((k, i) => {
            const tints = [STRATA.sand, STRATA.ochre, STRATA.moss, STRATA.clay];
            const tint = tints[i] as string;
            return (
              <div key={k.label} className="p-4" style={{ background: PANEL }}>
                <p className="text-[11px]" style={{ color: MUTED }}>
                  {k.label}
                </p>
                <p className="mt-1 text-[24px] tabular-nums" style={{ ...display, color: INK }}>
                  {k.value}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className="text-[11px] tabular-nums"
                    style={{ ...mono, color: k.up ? STRATA.moss : STRATA.rust }}
                  >
                    {k.up ? "▲" : "▼"} {k.trend}
                  </span>
                  <div className="w-16">
                    <CoreColumn data={k.spark} tint={tint} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <StratumHead
            index="02"
            eyebrow="Afzetting"
            titel="Matches voor jou"
            diepte="1–3 m"
            tint={STRATA.ochre}
          />
          <ul className="mt-4 space-y-2.5">
            {OPDRACHTEN.map((o) => (
              <li key={o.id}>
                <OpdrachtRij opdracht={o} onOpen={onOpen} />
              </li>
            ))}
          </ul>
          <button
            onClick={() => onGo("marktplaats")}
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ color: STRATA.clay }}
          >
            Naar de volledige marktplaats <ArrowRight size={14} aria-hidden="true" />
          </button>
        </section>

        <section className="lg:col-span-2">
          <StratumHead
            index="03"
            eyebrow="Kernboor"
            titel="Vraagt actie"
            diepte="3–4 m"
            tint={STRATA.rust}
          />
          <ul className="mt-4 space-y-2.5">
            {ACTIES.map((a) => {
              const tint = a.urgentie === "warning" ? STRATA.ochre : STRATA.slate;
              return (
                <li
                  key={a.titel}
                  className="rounded-sm border p-3.5"
                  style={{ borderColor: HAIR, background: PANEL, borderLeft: `3px solid ${tint}` }}
                >
                  <p className="text-[13.5px] leading-snug" style={{ ...serif, fontWeight: 600 }}>
                    {a.titel}
                  </p>
                  <button
                    onClick={() => onGo("acties")}
                    className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ color: tint }}
                  >
                    {a.cta} <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function OpdrachtRij({ opdracht, onOpen }: { opdracht: Opdracht; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-sm border p-3.5 text-left transition-colors hover:bg-[#f0e7d5] focus-visible:outline-none focus-visible:ring-2"
      style={{ borderColor: HAIR, background: PANEL }}
    >
      <span
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-sm text-white"
        style={{ background: STRATA.clay }}
        aria-hidden="true"
      >
        <span className="text-[14px] font-bold tabular-nums leading-none" style={mono}>
          {opdracht.match}
        </span>
        <span className="text-[8px] uppercase tracking-wider">match</span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[15px] leading-snug"
          style={{ ...serif, fontWeight: 600 }}
        >
          {opdracht.titel}
        </span>
        <span
          className="mt-0.5 flex items-center gap-1.5 truncate text-[12px]"
          style={{ color: MUTED }}
        >
          <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
        </span>
      </span>
      <span
        className="hidden shrink-0 text-[12.5px] tabular-nums sm:block"
        style={{ ...mono, color: STRATA.clay }}
      >
        {opdracht.tarief}
      </span>
      <ArrowRight size={16} style={{ color: FAINT }} aria-hidden="true" />
    </button>
  );
}

// ---- Marktplaats ---------------------------------------------------------------------------
function Marktplaats({ onOpen }: { onOpen: () => void }) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter((o) => {
    const hay = `${o.titel} ${o.plaats} ${o.opdrachtgever} ${o.tags.join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return (
    <div className="space-y-6">
      <StratumHead
        index="04"
        eyebrow="Afzettingsgebied"
        titel="Marktplaats"
        diepte="4–9 m"
        tint={STRATA.ochre}
      />

      <div
        className="flex items-center gap-2.5 rounded-sm border px-4 py-2.5"
        style={{ borderColor: HAIR, background: PANEL }}
      >
        <Search size={16} style={{ color: STRATA.ochre }} aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Doorzoek de lagen op titel, plaats of vaardigheid…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9b8f78]"
          style={{ ...serif, color: INK }}
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Zoekopdracht wissen"
            className="rounded-sm p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ color: MUTED }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-sm border py-16 text-center"
          style={{ borderColor: HAIR, background: PANEL }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm text-white"
            style={{ background: STRATA.ochre }}
            aria-hidden="true"
          >
            <Compass size={24} />
          </span>
          <p className="mt-4 text-[19px]" style={{ ...display, color: INK }}>
            Geen afzetting gevonden
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: MUTED }}>
            Geen opdracht past bij deze boring. Verruim je zoektermen om diepere lagen te bereiken.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm border px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ borderColor: STRATA.ochre, color: STRATA.ochre }}
          >
            Zoekopdracht wissen <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((o, i) => (
            <li key={o.id}>
              <MarktLaag opdracht={o} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MarktLaag({
  opdracht,
  index,
  onOpen,
}: {
  opdracht: Opdracht;
  index: number;
  onOpen: () => void;
}) {
  const tints = [STRATA.sand, STRATA.ochre, STRATA.clay, STRATA.slate, STRATA.moss];
  const tint = tints[index % tints.length] as string;
  return (
    <div
      className="overflow-hidden rounded-sm border transition-shadow hover:shadow-sm"
      style={{ borderColor: HAIR, background: PANEL, borderLeft: `4px solid ${tint}` }}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] tabular-nums" style={{ ...mono, color: FAINT }}>
              {opdracht.id}
            </span>
            <span className="text-[10.5px] tabular-nums" style={{ ...mono, color: tint }}>
              {opdracht.match}% match
            </span>
          </div>
          <h3 className="mt-1 text-[17px] leading-snug" style={{ ...display, color: INK }}>
            {opdracht.titel}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: MUTED }}>
            <MapPin size={12} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {opdracht.tags.map((t) => (
              <Chip key={t} tint={tint}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-left sm:text-right">
            <p className="text-[16px] tabular-nums" style={{ ...mono, color: INK }}>
              {opdracht.tarief}
            </p>
            <p className="text-[11px]" style={{ color: FAINT }}>
              {opdracht.uren}
            </p>
          </div>
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
            style={{ ...serif, background: tint }}
          >
            Openen <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Opdracht-detail -----------------------------------------------------------------------
function OpdrachtDetail({ opdracht, onBack }: { opdracht: Opdracht; onBack: () => void }) {
  const tint = STRATA.clay;
  const [tab, setTab] = useState<"match" | "profiel">("match");
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: MUTED }}
      >
        <ArrowRight size={14} className="rotate-180" aria-hidden="true" /> Terug naar marktplaats
      </button>

      <section
        className="overflow-hidden rounded-sm border"
        style={{ borderColor: HAIR, borderLeft: `5px solid ${tint}`, background: PANEL }}
      >
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tabular-nums" style={{ ...mono, color: tint }}>
              {opdracht.id}
            </span>
            <span className="text-[11px] tabular-nums" style={{ ...mono, color: FAINT }}>
              diepte 9–15 m
            </span>
          </div>
          <h1
            className="mt-2 max-w-xl text-[28px] leading-tight"
            style={{ ...display, color: INK }}
          >
            {opdracht.titel}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-[14px]" style={{ color: MUTED }}>
            <MapPin size={14} aria-hidden="true" /> {opdracht.opdrachtgever} · {opdracht.plaats}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-sm px-5 py-2.5 text-[13.5px] font-medium text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
              style={{ ...serif, background: tint }}
            >
              Reageer op opdracht <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-sm border px-5 py-2.5 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ ...serif, borderColor: HAIR, color: INK, background: PANEL }}
            >
              Bewaren
            </button>
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-y-4 border-t px-6 py-4 sm:grid-cols-4"
          style={{ borderColor: HAIR2, background: PANEL2 }}
        >
          <Meting label="Tarief" value={opdracht.tarief} tint={tint} />
          <Meting label="Omvang" value={opdracht.uren} />
          <Meting label="Start" value={opdracht.start} />
          <Meting label="Match" value={`${opdracht.match}%`} tint={STRATA.moss} />
        </div>
      </section>

      <section>
        <div className="flex gap-2" role="tablist" aria-label="Opdrachtlagen">
          {(["match", "profiel"] as const).map((t) => {
            const on = tab === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t)}
                className="rounded-sm border px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  ...serif,
                  borderColor: on ? tint : HAIR,
                  color: on ? "#fff" : MUTED,
                  background: on ? tint : PANEL,
                }}
              >
                {t === "match" ? "Waarom deze match" : "Omschrijving"}
              </button>
            );
          })}
        </div>

        {tab === "match" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              className="rounded-sm border p-5"
              style={{
                borderColor: HAIR,
                background: PANEL,
                borderLeft: `3px solid ${STRATA.moss}`,
              }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.2em]"
                style={{ color: STRATA.moss }}
              >
                Wat past
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.plus.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[14px]">
                    <Check
                      size={16}
                      style={{ color: STRATA.moss, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-sm border p-5"
              style={{
                borderColor: HAIR,
                background: PANEL,
                borderLeft: `3px solid ${STRATA.ochre}`,
              }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-[0.2em]"
                style={{ color: STRATA.ochre }}
              >
                Aandacht
              </p>
              <ul className="mt-3 space-y-2.5">
                {opdracht.redenen.min.map((r) => (
                  <li
                    key={r}
                    className="flex items-start gap-2.5 text-[14px]"
                    style={{ color: MUTED }}
                  >
                    <AlertTriangle
                      size={15}
                      style={{ color: STRATA.ochre, marginTop: 2 }}
                      aria-hidden="true"
                    />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="mt-4 rounded-sm border p-5 text-[14.5px] leading-relaxed"
            style={{ borderColor: HAIR, background: PANEL, color: INK }}
          >
            <p>
              {opdracht.opdrachtgever} zoekt een {opdracht.titel.toLowerCase()} in {opdracht.plaats}
              . De inzet is {opdracht.uren.toLowerCase()}, met startdatum{" "}
              {opdracht.start.toLowerCase()}. De onderstaande vereisten vormen de dragende laag van
              deze opdracht.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {opdracht.tags.map((t) => (
                <Chip key={t} tint={tint}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ---- Verificatie ---------------------------------------------------------------------------
function Verificatie() {
  const [open, setOpen] = useState<string | null>(CREDENTIALS[0]?.naam ?? null);
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const pct = Math.round((verified / CREDENTIALS.length) * 100);
  return (
    <div className="space-y-6">
      <StratumHead
        index="05"
        eyebrow="Fundering"
        titel="Verificatie"
        diepte="15–22 m"
        tint={STRATA.slate}
      />

      <section
        className="rounded-sm border p-5"
        style={{ borderColor: HAIR, background: PANEL, borderLeft: `4px solid ${STRATA.slate}` }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[15px]" style={{ ...serif }}>
              <span style={{ color: STRATA.moss, fontWeight: 600 }}>{PROFIEL.trust}.</span>{" "}
              <span style={{ color: MUTED }}>
                {verified} van {CREDENTIALS.length} credentials verankerd.
              </span>
            </p>
          </div>
          <span className="text-[28px] tabular-nums" style={{ ...display, color: STRATA.slate }}>
            {pct}%
          </span>
        </div>
        {/* Gestapelde laagbalk */}
        <div
          className="mt-4 flex h-3 w-full overflow-hidden rounded-sm"
          style={{ background: PANEL2 }}
          aria-hidden="true"
        >
          {CREDENTIALS.map((c) => (
            <span
              key={c.naam}
              className="h-full flex-1 border-r-2"
              style={{ background: statusMeta(c.status).tint, borderColor: PANEL, opacity: 0.85 }}
            />
          ))}
        </div>
      </section>

      <ul className="space-y-2.5">
        {CREDENTIALS.map((c, i) => {
          const st = statusMeta(c.status);
          const isOpen = open === c.naam;
          return (
            <li
              key={c.naam}
              className="overflow-hidden rounded-sm border"
              style={{ borderColor: HAIR, background: PANEL, borderLeft: `4px solid ${st.tint}` }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : c.naam)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
              >
                <span
                  className="text-[10.5px] tabular-nums"
                  style={{ ...mono, color: FAINT }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <st.Icon size={17} style={{ color: st.tint }} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-[15px]" style={{ ...serif, fontWeight: 600 }}>
                  {c.naam}
                </span>
                <Chip tint={st.tint}>
                  <st.Icon size={11} aria-hidden="true" />
                  {st.label}
                </Chip>
              </button>
              <div
                className="grid transition-all duration-300 motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pl-[62px] text-[13px]" style={{ color: MUTED }}>
                    {c.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Acties --------------------------------------------------------------------------------
function Acties() {
  const [done, setDone] = useState<string[]>([]);
  const toggle = (t: string) =>
    setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));
  const openCount = ACTIES.length - done.length;
  return (
    <div className="space-y-6">
      <StratumHead
        index="06"
        eyebrow="Sondering"
        titel="Volgende acties"
        diepte="22–28 m"
        tint={STRATA.moss}
      />

      <p className="text-[14px]" style={{ color: MUTED }}>
        {openCount === 0
          ? "Alle lagen zijn doorgemeten — er staat niets meer open."
          : `${openCount} ${openCount === 1 ? "actie ligt" : "acties liggen"} nog aan de oppervlakte.`}
      </p>

      {openCount === 0 && (
        <div
          className="rounded-sm border py-12 text-center"
          style={{ borderColor: HAIR, background: PANEL, borderLeft: `4px solid ${STRATA.moss}` }}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm text-white"
            style={{ background: STRATA.moss }}
            aria-hidden="true"
          >
            <Check size={26} />
          </span>
          <p className="mt-4 text-[19px]" style={{ ...display, color: INK }}>
            Alles afgehandeld
          </p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px]" style={{ color: MUTED }}>
            De sondering is compleet. Er zijn geen openstaande acties in dit boorprofiel.
          </p>
        </div>
      )}

      <ol className="space-y-2.5">
        {ACTIES.map((a, i) => {
          const tint = a.urgentie === "warning" ? STRATA.ochre : STRATA.slate;
          const isDone = done.includes(a.titel);
          return (
            <li
              key={a.titel}
              className="flex items-start gap-4 rounded-sm border p-4"
              style={{
                borderColor: HAIR,
                background: PANEL,
                borderLeft: `4px solid ${isDone ? STRATA.moss : tint}`,
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <button
                onClick={() => toggle(a.titel)}
                aria-pressed={isDone}
                aria-label={isDone ? "Markeer als open" : "Markeer als afgerond"}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  borderColor: isDone ? STRATA.moss : tint,
                  background: isDone ? STRATA.moss : "transparent",
                  color: isDone ? "#fff" : tint,
                }}
              >
                {isDone ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <span className="text-[12px] tabular-nums" style={mono} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <h3
                  className={`text-[15.5px] leading-snug ${isDone ? "line-through" : ""}`}
                  style={{ ...serif, fontWeight: 600 }}
                >
                  {a.titel}
                </h3>
                <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
                  {a.detail}
                </p>
              </div>
              {!isDone && (
                <button
                  className="shrink-0 self-center rounded-sm px-4 py-2 text-[12.5px] font-medium text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:scale-100"
                  style={{ ...serif, background: tint }}
                >
                  {a.cta}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Facturen ------------------------------------------------------------------------------
function Facturen() {
  const tint = STRATA.rust;
  const statusTint = (s: string): string => {
    if (s === "Betaald") return STRATA.moss;
    if (s === "Openstaand") return STRATA.ochre;
    return STRATA.slate;
  };
  const open = FACTUREN.filter((f) => f.status === "Openstaand");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <StratumHead index="07" eyebrow="Grondlaag" titel="Facturen" diepte="28–35 m" tint={tint} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px]" style={{ color: MUTED }}>
          {FACTUREN.length} facturen · {open.length} openstaand
        </p>
        <button
          className="inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-[13px] font-medium text-white transition-transform hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:gap-1.5"
          style={{ ...serif, background: tint }}
        >
          <Plus size={15} aria-hidden="true" /> Nieuwe factuur
        </button>
      </div>

      <section
        className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border"
        style={{ borderColor: HAIR, background: HAIR }}
      >
        {[
          { l: "Betaald", v: "€ 8.622", t: STRATA.moss },
          { l: "Openstaand", v: "€ 1.350", t: STRATA.ochre },
          { l: "Concept", v: "€ 880", t: STRATA.slate },
        ].map((s) => (
          <div
            key={s.l}
            className="p-4"
            style={{ background: PANEL, borderTop: `3px solid ${s.t}` }}
          >
            <p className="text-[11px]" style={{ color: MUTED }}>
              {s.l}
            </p>
            <p className="mt-1 text-[18px] tabular-nums" style={{ ...display, color: INK }}>
              {s.v}
            </p>
          </div>
        ))}
      </section>

      <section
        className="overflow-hidden rounded-sm border"
        style={{ borderColor: HAIR, background: PANEL }}
      >
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.18em] sm:grid-cols-[110px_1fr_auto_120px]"
          style={{ background: PANEL2, color: FAINT }}
        >
          <span className="hidden sm:block">Nummer</span>
          <span>Klant</span>
          <span className="text-right">Bedrag</span>
          <span className="hidden text-right sm:block">Status</span>
        </div>
        <ul>
          {FACTUREN.map((f) => {
            const t = statusTint(f.status);
            return (
              <li
                key={f.nr}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-t px-5 py-3.5 transition-colors hover:bg-[#f0e7d5] sm:grid-cols-[110px_1fr_auto_120px]"
                style={{ borderColor: HAIR2 }}
              >
                <span
                  className="hidden text-[12px] tabular-nums sm:block"
                  style={{ ...mono, color: FAINT }}
                >
                  {f.nr}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[14px]"
                    style={{ ...serif, fontWeight: 600 }}
                  >
                    {f.klant}
                  </span>
                  <span
                    className="block text-[11px] tabular-nums"
                    style={{ ...mono, color: FAINT }}
                  >
                    {f.datum}
                  </span>
                </span>
                <span
                  className="text-right text-[14.5px] tabular-nums"
                  style={{ ...mono, color: INK }}
                >
                  {f.bedrag}
                </span>
                <span className="hidden justify-self-end sm:block">
                  <Chip tint={t}>{f.status}</Chip>
                </span>
              </li>
            );
          })}
        </ul>
        <div
          className="flex items-center justify-between border-t px-5 py-4"
          style={{ borderColor: HAIR, background: PANEL2 }}
        >
          <span
            className="text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: MUTED }}
          >
            Totaal betaald
          </span>
          <span className="text-[20px] tabular-nums" style={{ ...display, color: tint }}>
            € 8.622
          </span>
        </div>
      </section>
    </div>
  );
}
