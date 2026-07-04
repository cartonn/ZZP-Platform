"use client";

// Concept 68 — "Pictogram" · ISOTYPE / pictogram-first informatietaal.
// Bold, zelf-getekende geometrische pictogrammen zijn de PRIMAIRE taal: statussen, rollen, acties
// én data. KPI's worden verteld met herhaalde pictogram-eenheden (ISOTYPE: 9 van 10 figuurtjes),
// niet met kale cijfers. Signaletiek/wayfinding-helderheid, hoog contrast, altijd een tekstlabel
// naast elk pictogram (toegankelijk). Onderscheidend van reis-/tijdlijn-concepten: hier is het
// pictogram zélf de datataal, geen route.
// Palet: bg #fafafa, ink #111111, signaal-oranje #ff6a00, blauw #1746d6.
// Fonts: --font-lab-space (display) + --font-lab-geist-mono (labels).

import { useEffect, useState } from "react";
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

/* ---------- Palet & typografie ---------- */

const C = {
  bg: "#fafafa",
  surface: "#ffffff",
  ink: "#111111",
  muted: "#5c5c5c",
  faint: "#9a9a9a",
  line: "#e4e4e4",
  hair: "#efefef",
  orange: "#ff6a00",
  orangeSoft: "#fff1e8",
  blue: "#1746d6",
  blueSoft: "#e8edfc",
  red: "#d21f3c",
  redSoft: "#fdeaed",
};

const display = { fontFamily: "var(--font-lab-space)" };
const mono = { fontFamily: "var(--font-lab-geist-mono)" };

/* ---------- Pictogram-systeem (zelf getekend, bold geometrisch) ---------- */

type PictoName =
  | "grid"
  | "pin"
  | "doc"
  | "shield"
  | "bolt"
  | "euro"
  | "clock"
  | "person"
  | "check"
  | "cross"
  | "warn"
  | "search"
  | "arrow"
  | "mail"
  | "calendar";

function Picto({
  name,
  size = 24,
  color = C.ink,
  accent = C.orange,
}: {
  name: PictoName;
  size?: number;
  color?: string;
  accent?: string;
}) {
  const sw = 2.1;
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      {name === "grid" && (
        <>
          <rect x={3.5} y={3.5} width={7} height={7} rx={1.5} {...common} />
          <rect
            x={13.5}
            y={3.5}
            width={7}
            height={7}
            rx={1.5}
            {...common}
            fill={accent}
            stroke={accent}
          />
          <rect x={3.5} y={13.5} width={7} height={7} rx={1.5} {...common} />
          <rect x={13.5} y={13.5} width={7} height={7} rx={1.5} {...common} />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M12 21c4-4.5 6-7.6 6-10.5A6 6 0 0 0 6 10.5C6 13.4 8 16.5 12 21z" {...common} />
          <circle cx={12} cy={10.2} r={2.3} fill={accent} stroke={accent} />
        </>
      )}
      {name === "doc" && (
        <>
          <path d="M6.5 3.5h7l4 4v13h-11z" {...common} />
          <path d="M13.5 3.5v4h4" {...common} />
          <path d="M9 12h6M9 15.5h6" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === "shield" && (
        <>
          <path d="M12 3l7 2.5v5c0 5-3.2 8.3-7 9.9-3.8-1.6-7-4.9-7-9.9v-5z" {...common} />
          <path
            d="M8.8 11.8l2.3 2.3 4-4.6"
            stroke={accent}
            strokeWidth={sw + 0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {name === "bolt" && (
        <path
          d="M13 2.5L5 13h5l-1 8.5L18 10h-5z"
          fill={accent}
          stroke={accent}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      )}
      {name === "euro" && (
        <>
          <circle cx={12} cy={12} r={9} {...common} />
          <path
            d="M15 8.5a4.5 4.5 0 1 0 0 7"
            stroke={accent}
            strokeWidth={sw}
            strokeLinecap="round"
            fill="none"
          />
          <path d="M7 10.7h6M7 13.3h6" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx={12} cy={12} r={9} {...common} />
          <path
            d="M12 7v5.2l3.4 2"
            stroke={accent}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {name === "person" && (
        <>
          <circle cx={12} cy={8} r={3.6} {...common} />
          <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" {...common} />
        </>
      )}
      {name === "check" && (
        <path
          d="M4 12.5l4.8 4.8L20 6"
          stroke={accent}
          strokeWidth={sw + 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      )}
      {name === "cross" && (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke={accent}
          strokeWidth={sw + 0.4}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {name === "warn" && (
        <>
          <path d="M12 3.5l9.2 16.5H2.8z" {...common} stroke={accent} />
          <path d="M12 9.5v5" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
          <circle cx={12} cy={17.4} r={1.15} fill={accent} />
        </>
      )}
      {name === "search" && (
        <>
          <circle cx={10.5} cy={10.5} r={6.5} {...common} />
          <path d="M15.5 15.5L20 20" stroke={accent} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
      {name === "arrow" && <path d="M4 12h15m-6-6l6 6-6 6" {...common} />}
      {name === "mail" && (
        <>
          <rect x={3.5} y={5.5} width={17} height={13} rx={1.5} {...common} />
          <path
            d="M4 7l8 6 8-6"
            stroke={accent}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x={3.5} y={5} width={17} height={15.5} rx={2} {...common} />
          <path d="M3.5 9.5h17M8 3.5v3.5M16 3.5v3.5" {...common} />
          <circle cx={8.5} cy={14} r={1.2} fill={accent} />
          <circle cx={12} cy={14} r={1.2} fill={accent} />
        </>
      )}
    </svg>
  );
}

/* ---------- ISOTYPE-eenheid (solide silhouet, herhaald voor dataweergave) ---------- */

type UnitKind = "person" | "coin" | "mail" | "doc";

function Unit({ kind, on, size = 18 }: { kind: UnitKind; on: boolean; size?: number }) {
  const fill = on ? C.orange : C.line;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      {kind === "person" && (
        <>
          <circle cx={12} cy={7} r={4} fill={fill} />
          <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5z" fill={fill} />
        </>
      )}
      {kind === "coin" && (
        <>
          <circle cx={12} cy={12} r={9.5} fill={fill} />
          <path
            d="M15 8.5a4.5 4.5 0 1 0 0 7M7 10.7h6M7 13.3h6"
            stroke={on ? "#fff" : C.faint}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      {kind === "mail" && <rect x={2.5} y={5} width={19} height={14} rx={2} fill={fill} />}
      {kind === "doc" && <path d="M5 2.5h9l5 5v14H5z" fill={fill} />}
    </svg>
  );
}

function Isotype({ kind, filled, total = 10 }: { kind: UnitKind; filled: number; total?: number }) {
  return (
    <div className="flex flex-wrap gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <Unit key={i} kind={kind} on={i < filled} size={16} />
      ))}
    </div>
  );
}

/* ---------- Status → pictogram + label (nooit kleur-alleen) ---------- */

const CRED_META: Record<
  CredStatus,
  { label: string; picto: PictoName; color: string; soft: string }
> = {
  VERIFIED: { label: "Geverifieerd", picto: "shield", color: C.blue, soft: C.blueSoft },
  EXPIRING: { label: "Verloopt bijna", picto: "warn", color: C.orange, soft: C.orangeSoft },
  SUBMITTED: { label: "In beoordeling", picto: "clock", color: C.ink, soft: C.hair },
  REJECTED: { label: "Afgewezen", picto: "cross", color: C.red, soft: C.redSoft },
};

function digits(v: string): number {
  const only = v.replace(/[^\d]/g, "");
  return only ? parseInt(only, 10) : 0;
}

/* ---------- Kleine bouwstenen ---------- */

function StatusTag({ status }: { status: CredStatus }) {
  const m = CRED_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
      style={{ ...mono, borderColor: m.color, color: m.color, background: m.soft }}
    >
      <Picto name={m.picto} size={14} color={m.color} accent={m.color} />
      {m.label}
    </span>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.2em]"
      style={{ ...mono, color: C.orange }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="mt-1.5 text-[26px] font-bold leading-[1.05] tracking-tight sm:text-[32px]"
      style={{ ...display, color: C.ink }}
    >
      {children}
    </h1>
  );
}

function MatchMeter({ pct }: { pct: number }) {
  const filled = Math.round(pct / 10);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-[5px]"
            style={{ background: i < filled ? (pct >= 90 ? C.blue : C.orange) : C.line }}
          />
        ))}
      </div>
      <span className="text-[13px] font-bold tabular-nums" style={{ ...mono, color: C.ink }}>
        {pct}%
      </span>
    </div>
  );
}

/* ---------- Hoofdcomponent ---------- */

const NAV_PICTO: Record<ScreenKey, PictoName> = {
  dashboard: "grid",
  marktplaats: "pin",
  opdracht: "doc",
  verificatie: "shield",
  acties: "bolt",
  facturen: "euro",
  documenten: "doc",
  berichten: "mail",
};

export function Concept68() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [activeId, setActiveId] = useState<string>(OPDRACHTEN[0]?.id ?? "");
  const active = OPDRACHTEN.find((o) => o.id === activeId) ?? (OPDRACHTEN[0] as Opdracht);

  const open = (id?: string) => {
    if (id) setActiveId(id);
    setScreen("opdracht");
  };

  return (
    <div
      className="min-h-[680px] w-full antialiased"
      style={{ ...display, background: C.bg, color: C.ink }}
    >
      {/* Header — signaletiek */}
      <header className="border-b" style={{ borderColor: C.ink, background: C.surface }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center"
              style={{ background: C.ink }}
              aria-hidden="true"
            >
              <Picto name="grid" size={20} color="#fff" accent={C.orange} />
            </span>
            <div className="leading-none">
              <div className="text-[15px] font-bold tracking-tight" style={display}>
                PICTOGRAM
              </div>
              <div
                className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em]"
                style={{ ...mono, color: C.faint }}
              >
                ZZP · signaletiek
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] sm:inline-flex"
              style={{ ...mono, borderColor: C.blue, color: C.blue, background: C.blueSoft }}
            >
              <Picto name="shield" size={13} color={C.blue} accent={C.blue} />
              {PROFIEL.trust}
            </span>
            <span
              className="flex h-9 w-9 items-center justify-center border"
              style={{ borderColor: C.ink }}
              aria-hidden="true"
            >
              <Picto name="person" size={20} color={C.ink} accent={C.orange} />
            </span>
            <div className="hidden leading-tight sm:block">
              <div className="text-[12.5px] font-bold" style={display}>
                {PROFIEL.naam}
              </div>
              <div className="text-[10px]" style={{ ...mono, color: C.faint }}>
                {PROFIEL.plaats}
              </div>
            </div>
          </div>
        </div>

        {/* Pictogram-navigatie */}
        <nav
          className="mx-auto flex max-w-6xl gap-0 overflow-x-auto px-5"
          aria-label="Hoofdnavigatie"
        >
          {SCREENS.map((s) => {
            const on = s.key === screen;
            return (
              <button
                key={s.key}
                onClick={() => setScreen(s.key)}
                aria-current={on ? "page" : undefined}
                className="flex shrink-0 items-center gap-2 border-b-[3px] px-3.5 py-3 text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff6a00]"
                style={{
                  borderColor: on ? C.orange : "transparent",
                  color: on ? C.ink : C.muted,
                }}
              >
                <Picto
                  name={NAV_PICTO[s.key]}
                  size={18}
                  color={on ? C.ink : C.muted}
                  accent={on ? C.orange : C.faint}
                />
                <span style={mono}>{s.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7">
        {screen === "dashboard" && <Dashboard onOpen={open} onGo={setScreen} />}
        {screen === "marktplaats" && (
          <Marktplaats activeId={activeId} onSelect={setActiveId} onOpen={open} />
        )}
        {screen === "opdracht" && <OpdrachtDetail opdracht={active} />}
        {screen === "verificatie" && <Verificatie />}
        {screen === "acties" && <Acties />}
        {screen === "facturen" && <Facturen />}
      </main>
    </div>
  );
}

/* ---------- Dashboard ---------- */

const KPI_ISO: { kind: UnitKind; filled: number; note: string }[] = [
  { kind: "person", filled: 9, note: "9 van 10 profielmatch" },
  { kind: "mail", filled: 7, note: "7 open reacties" },
  { kind: "coin", filled: 8, note: "€ 8k van € 10k doel" },
  { kind: "doc", filled: 2, note: "2 facturen openstaand" },
];

function Dashboard({
  onOpen,
  onGo,
}: {
  onOpen: (id?: string) => void;
  onGo: (k: ScreenKey) => void;
}) {
  const [sync, setSync] = useState<"error" | "loading" | "ok">("error");
  useEffect(() => {
    if (sync !== "loading") return;
    const t = window.setTimeout(() => setSync("ok"), 900);
    return () => window.clearTimeout(t);
  }, [sync]);

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Overzicht</Kicker>
        <Title>Goedendag, {PROFIEL.naam.split(" ")[0]}</Title>
        <p className="mt-2 text-[13.5px]" style={{ ...mono, color: C.muted }}>
          {PROFIEL.rol}
        </p>
      </div>

      {/* KPI's als ISOTYPE-pictogramrijen */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k, i) => {
          const iso = KPI_ISO[i]!;
          return (
            <div
              key={k.label}
              className="border p-4"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <p
                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...mono, color: C.faint }}
              >
                {k.label}
              </p>
              <p className="mt-1.5 text-[26px] font-bold tabular-nums leading-none" style={display}>
                {k.value}
              </p>
              <div className="mt-3">
                <Isotype kind={iso.kind} filled={iso.filled} />
              </div>
              <p
                className="mt-2 text-[10.5px]"
                style={{ ...mono, color: k.up ? C.blue : C.orange }}
              >
                {k.up ? "▲" : "▼"} {k.trend} · {iso.note}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Matches met sync-status (error / loading / ok) */}
        <section
          className="border lg:col-span-2"
          style={{ borderColor: C.line, background: C.surface }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-3.5"
            style={{ borderColor: C.line }}
          >
            <h3 className="flex items-center gap-2 text-[13.5px] font-bold" style={display}>
              <Picto name="pin" size={17} color={C.ink} accent={C.orange} /> Beste matches
            </h3>
            <button
              onClick={() => onGo("marktplaats")}
              className="inline-flex items-center gap-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
              style={{ ...mono, color: C.blue }}
            >
              Alles <Picto name="arrow" size={14} color={C.blue} accent={C.blue} />
            </button>
          </div>

          {sync === "error" && (
            <div
              className="m-4 flex items-center gap-3 border p-4"
              style={{ borderColor: C.red, background: C.redSoft }}
              role="alert"
            >
              <Picto name="warn" size={26} color={C.red} accent={C.red} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold" style={{ ...display, color: C.ink }}>
                  Matches niet geladen
                </p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                  De verbinding is verbroken.
                </p>
              </div>
              <button
                onClick={() => setSync("loading")}
                className="shrink-0 border px-3 py-1.5 text-[11.5px] font-bold uppercase text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d21f3c]"
                style={{ ...mono, background: C.red, borderColor: C.red }}
              >
                Opnieuw
              </button>
            </div>
          )}

          {sync === "loading" && (
            <div className="space-y-2 p-4" role="status" aria-live="polite">
              <span className="sr-only">Matches worden geladen…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border p-3"
                  style={{ borderColor: C.line }}
                >
                  <span
                    className="h-10 w-10 shrink-0 animate-pulse"
                    style={{ background: C.hair }}
                  />
                  <div className="flex-1 space-y-2">
                    <span
                      className="block h-3 w-2/3 animate-pulse"
                      style={{ background: C.hair }}
                    />
                    <span
                      className="block h-2.5 w-1/2 animate-pulse"
                      style={{ background: C.hair }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {sync === "ok" && (
            <ul>
              {OPDRACHTEN.map((o, i) => (
                <li key={o.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <button
                    onClick={() => onOpen(o.id)}
                    className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff6a00]"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center border"
                      style={{ borderColor: C.ink }}
                      aria-hidden="true"
                    >
                      <Picto name="doc" size={20} color={C.ink} accent={C.orange} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{o.titel}</span>
                      <span
                        className="block truncate text-[11.5px]"
                        style={{ ...mono, color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.tarief}
                      </span>
                    </span>
                    <MatchMeter pct={o.match} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Certificaten */}
        <section className="border" style={{ borderColor: C.line, background: C.surface }}>
          <div className="border-b px-5 py-3.5" style={{ borderColor: C.line }}>
            <h3 className="flex items-center gap-2 text-[13.5px] font-bold" style={display}>
              <Picto name="shield" size={17} color={C.ink} accent={C.blue} /> Certificaten
            </h3>
          </div>
          <ul>
            {CREDENTIALS.map((c, i) => {
              const m = CRED_META[c.status];
              return (
                <li
                  key={c.naam}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
                >
                  <Picto name={m.picto} size={18} color={m.color} accent={m.color} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {c.naam}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="p-4">
            <button
              onClick={() => onGo("verificatie")}
              className="w-full border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
              style={{ ...mono, background: C.ink, borderColor: C.ink }}
            >
              Naar verificatie
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Marktplaats ---------- */

function Marktplaats({
  activeId,
  onSelect,
  onOpen,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onOpen: (id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = OPDRACHTEN.filter(
    (o) =>
      o.titel.toLowerCase().includes(q.toLowerCase()) ||
      o.plaats.toLowerCase().includes(q.toLowerCase()) ||
      o.opdrachtgever.toLowerCase().includes(q.toLowerCase()),
  );
  const sel = filtered.find((o) => o.id === activeId) ?? filtered[0];

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Marktplaats</Kicker>
        <Title>Open opdrachten</Title>
      </div>

      <div
        className="flex items-center gap-3 border px-4 py-2.5"
        style={{ borderColor: C.ink, background: C.surface }}
      >
        <Picto name="search" size={17} color={C.ink} accent={C.orange} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op titel, plaats of opdrachtgever…"
          aria-label="Opdrachten zoeken"
          className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-[#9a9a9a]"
          style={{ ...mono, color: C.ink }}
        />
        <span
          className="shrink-0 text-[11.5px] font-semibold tabular-nums"
          style={{ ...mono, color: C.faint }}
        >
          {filtered.length}/{OPDRACHTEN.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="border p-12 text-center"
          style={{ borderColor: C.line, background: C.surface }}
          role="status"
        >
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center border"
            style={{ borderColor: C.ink }}
            aria-hidden="true"
          >
            <Picto name="search" size={30} color={C.ink} accent={C.orange} />
          </span>
          <p className="mt-4 text-[17px] font-bold" style={display}>
            Niets gevonden
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[12.5px]" style={{ ...mono, color: C.muted }}>
            Geen opdracht past bij &quot;{q}&quot;. Verbreed je zoekopdracht.
          </p>
          <button
            onClick={() => setQ("")}
            className="mt-5 border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
            style={{ ...mono, background: C.orange, borderColor: C.orange }}
          >
            Zoekopdracht wissen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {filtered.map((o) => {
              const on = sel?.id === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  aria-pressed={on}
                  className="w-full border p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                  style={{
                    borderColor: on ? C.orange : C.line,
                    background: C.surface,
                    borderWidth: on ? 2 : 1,
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center border"
                      style={{ borderColor: C.ink }}
                      aria-hidden="true"
                    >
                      <Picto name="doc" size={22} color={C.ink} accent={C.orange} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                        style={{ ...mono, color: C.faint }}
                      >
                        {o.id}
                      </span>
                      <p className="truncate text-[15px] font-bold">{o.titel}</p>
                      <p
                        className="mt-0.5 truncate text-[11.5px]"
                        style={{ ...mono, color: C.muted }}
                      >
                        {o.opdrachtgever} · {o.plaats} · {o.uren}
                      </p>
                      <div className="mt-2.5">
                        <MatchMeter pct={o.match} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {o.tags.map((t) => (
                          <span
                            key={t}
                            className="border px-2 py-0.5 text-[10.5px] font-semibold"
                            style={{ ...mono, borderColor: C.line, color: C.muted }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {sel && (
            <aside
              className="h-fit border lg:sticky lg:top-4"
              style={{ borderColor: C.ink, background: C.surface }}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: C.ink, background: C.ink }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white"
                  style={mono}
                >
                  {sel.id}
                </span>
                <Picto name="doc" size={18} color="#fff" accent={C.orange} />
              </div>
              <div className="p-4">
                <p className="text-[16px] font-bold leading-snug" style={display}>
                  {sel.titel}
                </p>
                <p className="mt-1 text-[12px]" style={{ ...mono, color: C.muted }}>
                  {sel.opdrachtgever} · {sel.plaats}
                </p>
                <div className="mt-3">
                  <MatchMeter pct={sel.match} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-px" style={{ background: C.line }}>
                  {[
                    { l: "Tarief", v: sel.tarief, p: "euro" as PictoName },
                    { l: "Omvang", v: sel.uren, p: "clock" as PictoName },
                    { l: "Start", v: sel.start, p: "calendar" as PictoName },
                    { l: "Plaats", v: sel.plaats, p: "pin" as PictoName },
                  ].map((m) => (
                    <div key={m.l} className="p-2.5" style={{ background: C.surface }}>
                      <div className="flex items-center gap-1.5">
                        <Picto name={m.p} size={14} color={C.muted} accent={C.orange} />
                        <dt
                          className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                          style={{ ...mono, color: C.faint }}
                        >
                          {m.l}
                        </dt>
                      </div>
                      <dd className="mt-1 text-[13px] font-bold tabular-nums" style={display}>
                        {m.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <button
                  onClick={() => onOpen(sel.id)}
                  className="mt-4 w-full border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                  style={{ ...mono, background: C.ink, borderColor: C.ink }}
                >
                  Open opdracht
                </button>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Opdracht-detail ---------- */

function OpdrachtDetail({ opdracht }: { opdracht: Opdracht }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const react = () => {
    if (state !== "idle") return;
    setState("sending");
    window.setTimeout(() => setState("sent"), 850);
  };

  return (
    <div className="space-y-5">
      <section className="border p-6" style={{ borderColor: C.ink, background: C.surface }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Kicker>{opdracht.id}</Kicker>
            <Title>{opdracht.titel}</Title>
            <p className="mt-2 text-[12.5px]" style={{ ...mono, color: C.muted }}>
              {opdracht.opdrachtgever} · {opdracht.plaats}
            </p>
            <div className="mt-3">
              <MatchMeter pct={opdracht.match} />
            </div>
          </div>
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center border-2"
            style={{ borderColor: C.orange }}
            aria-hidden="true"
          >
            <Picto name="doc" size={30} color={C.ink} accent={C.orange} />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: C.line }}>
          {[
            { l: "Tarief", v: opdracht.tarief, p: "euro" as PictoName },
            { l: "Omvang", v: opdracht.uren, p: "clock" as PictoName },
            { l: "Start", v: opdracht.start, p: "calendar" as PictoName },
            { l: "Match", v: `${opdracht.match}%`, p: "check" as PictoName },
          ].map((m) => (
            <div key={m.l} className="p-3.5" style={{ background: C.surface }}>
              <div className="flex items-center gap-1.5">
                <Picto name={m.p} size={15} color={C.muted} accent={C.orange} />
                <p
                  className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ ...mono, color: C.faint }}
                >
                  {m.l}
                </p>
              </div>
              <p className="mt-1.5 text-[15px] font-bold tabular-nums" style={display}>
                {m.v}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={react}
          disabled={state !== "idle"}
          aria-live="polite"
          className="mt-5 flex w-full items-center justify-center gap-2 border px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00] disabled:translate-y-0"
          style={{
            ...mono,
            background: state === "sent" ? C.blue : C.orange,
            borderColor: state === "sent" ? C.blue : C.orange,
          }}
        >
          {state === "idle" && (
            <>
              <Picto name="arrow" size={16} color="#fff" accent="#fff" /> Reageer op opdracht
            </>
          )}
          {state === "sending" && "Versturen…"}
          {state === "sent" && (
            <>
              <Picto name="check" size={16} color="#fff" accent="#fff" /> Reactie verstuurd
            </>
          )}
        </button>
      </section>

      {/* Verklaarbare matching */}
      <section className="border" style={{ borderColor: C.line, background: C.surface }}>
        <div className="border-b px-5 py-3.5" style={{ borderColor: C.line }}>
          <h3 className="text-[13.5px] font-bold" style={display}>
            Waarom deze match
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
          <div className="p-5 sm:border-r" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.blue }}
            >
              <Picto name="check" size={16} color={C.blue} accent={C.blue} /> Pluspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.plus.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] font-medium">
                  <Picto name="check" size={16} color={C.blue} accent={C.blue} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t p-5 sm:border-t-0" style={{ borderColor: C.line }}>
            <p
              className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
              style={{ ...mono, color: C.orange }}
            >
              <Picto name="warn" size={16} color={C.orange} accent={C.orange} /> Aandachtspunten
            </p>
            <ul className="mt-3 space-y-2.5">
              {opdracht.redenen.min.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2.5 text-[13px] font-medium"
                  style={{ color: C.muted }}
                >
                  <Picto name="warn" size={16} color={C.orange} accent={C.orange} />
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

/* ---------- Verificatie ---------- */

function Verificatie() {
  const verified = CREDENTIALS.filter((c) => c.status === "VERIFIED").length;
  const summary: { label: string; count: number; picto: PictoName; color: string; soft: string }[] =
    [
      { label: "Geverifieerd", count: verified, picto: "shield", color: C.blue, soft: C.blueSoft },
      {
        label: "Verloopt bijna",
        count: CREDENTIALS.filter((c) => c.status === "EXPIRING").length,
        picto: "warn",
        color: C.orange,
        soft: C.orangeSoft,
      },
      {
        label: "In beoordeling",
        count: CREDENTIALS.filter((c) => c.status === "SUBMITTED").length,
        picto: "clock",
        color: C.ink,
        soft: C.hair,
      },
    ];

  return (
    <div className="space-y-6">
      <div>
        <Kicker>Verificatie</Kicker>
        <Title>Certificaten</Title>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 border p-4"
            style={{ borderColor: C.line, background: C.surface }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ background: s.soft }}
              aria-hidden="true"
            >
              <Picto name={s.picto} size={24} color={s.color} accent={s.color} />
            </span>
            <div>
              <p
                className="text-[26px] font-bold tabular-nums leading-none"
                style={{ ...display, color: C.ink }}
              >
                {s.count}
              </p>
              <p
                className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ ...mono, color: C.muted }}
              >
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border" style={{ borderColor: C.line, background: C.surface }}>
        {CREDENTIALS.map((c, i) => {
          const m = CRED_META[c.status];
          return (
            <div
              key={c.naam}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center border"
                style={{ borderColor: m.color, background: m.soft }}
                aria-hidden="true"
              >
                <Picto name={m.picto} size={22} color={m.color} accent={m.color} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{c.naam}</p>
                <p className="text-[11.5px]" style={{ ...mono, color: C.muted }}>
                  {c.detail}
                </p>
              </div>
              <StatusTag status={c.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Acties ---------- */

function Acties() {
  return (
    <div className="space-y-6">
      <div>
        <Kicker>Prioriteiten</Kicker>
        <Title>Volgende acties</Title>
        <p className="mt-2 text-[13px]" style={{ ...mono, color: C.muted }}>
          Op volgorde van urgentie — begin bovenaan.
        </p>
      </div>

      <div className="space-y-3">
        {ACTIES.map((a, i) => {
          const warn = a.urgentie === "warning";
          const accent = warn ? C.orange : C.blue;
          const soft = warn ? C.orangeSoft : C.blueSoft;
          return (
            <div
              key={a.titel}
              className="flex items-stretch border"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <div
                className="flex w-16 shrink-0 flex-col items-center justify-center gap-1.5"
                style={{ background: soft }}
              >
                <Picto name={warn ? "warn" : "bolt"} size={24} color={accent} accent={accent} />
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ ...mono, color: accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ ...mono, color: accent }}
                >
                  {warn ? "Waarschuwing" : "Melding"}
                </span>
                <p className="mt-1 text-[14.5px] font-bold">{a.titel}</p>
                <p className="mt-0.5 text-[12.5px]" style={{ ...mono, color: C.muted }}>
                  {a.detail}
                </p>
              </div>
              <button
                className="m-3 shrink-0 self-center border px-4 py-2 text-[11.5px] font-bold uppercase tracking-[0.04em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
                style={{ ...mono, borderColor: C.ink, color: C.ink }}
              >
                {a.cta}
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-3 border p-4"
        style={{ borderColor: C.blue, background: C.blueSoft }}
      >
        <Picto name="check" size={22} color={C.blue} accent={C.blue} />
        <p className="text-[12.5px] font-medium" style={{ ...mono, color: C.ink }}>
          Verder is alles bijgewerkt. Nieuwe acties verschijnen automatisch op deze plek.
        </p>
      </div>
    </div>
  );
}

/* ---------- Facturen ---------- */

function Facturen() {
  const statusMeta: Record<string, { picto: PictoName; color: string; soft: string }> = {
    Betaald: { picto: "check", color: C.blue, soft: C.blueSoft },
    Openstaand: { picto: "clock", color: C.orange, soft: C.orangeSoft },
    Concept: { picto: "doc", color: C.faint, soft: C.hair },
  };
  const betaald = FACTUREN.filter((f) => f.status === "Betaald").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );
  const open = FACTUREN.filter((f) => f.status === "Openstaand").reduce(
    (s, f) => s + digits(f.bedrag),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>Financiën</Kicker>
          <Title>Facturen</Title>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6a00]"
          style={{ ...mono, background: C.ink, borderColor: C.ink }}
        >
          <Picto name="doc" size={15} color="#fff" accent={C.orange} /> Nieuwe factuur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="border p-5" style={{ borderColor: C.blue, background: C.blueSoft }}>
          <div className="flex items-center gap-2">
            <Picto name="euro" size={18} color={C.blue} accent={C.blue} />
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.blue }}
            >
              Ontvangen
            </p>
          </div>
          <p
            className="mt-2 text-[24px] font-bold tabular-nums"
            style={{ ...display, color: C.ink }}
          >
            € {betaald.toLocaleString("nl-NL")}
          </p>
          <div className="mt-2">
            <Isotype kind="coin" filled={Math.min(10, Math.round(betaald / 1000))} />
          </div>
        </div>
        <div className="border p-5" style={{ borderColor: C.orange, background: C.orangeSoft }}>
          <div className="flex items-center gap-2">
            <Picto name="clock" size={18} color={C.orange} accent={C.orange} />
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.orange }}
            >
              Openstaand
            </p>
          </div>
          <p
            className="mt-2 text-[24px] font-bold tabular-nums"
            style={{ ...display, color: C.ink }}
          >
            € {open.toLocaleString("nl-NL")}
          </p>
          <div className="mt-2">
            <Isotype kind="coin" filled={Math.min(10, Math.round(open / 1000))} />
          </div>
        </div>
      </div>

      <div
        className="overflow-x-auto border"
        style={{ borderColor: C.line, background: C.surface }}
      >
        <table className="w-full text-left">
          <thead>
            <tr
              className="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...mono, color: C.faint }}
            >
              <th className="border-b px-5 py-3.5" style={{ borderColor: C.line }}>
                Nummer
              </th>
              <th className="border-b px-5 py-3.5" style={{ borderColor: C.line }}>
                Klant
              </th>
              <th
                className="hidden border-b px-5 py-3.5 sm:table-cell"
                style={{ borderColor: C.line }}
              >
                Datum
              </th>
              <th className="border-b px-5 py-3.5 text-right" style={{ borderColor: C.line }}>
                Bedrag
              </th>
              <th className="border-b px-5 py-3.5 text-right" style={{ borderColor: C.line }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FACTUREN.map((f, i) => {
              const m = statusMeta[f.status] ?? statusMeta.Concept!;
              return (
                <tr key={f.nr} style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <td className="px-5 py-3.5 text-[12px] font-bold tabular-nums" style={mono}>
                    {f.nr}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold">{f.klant}</td>
                  <td
                    className="hidden px-5 py-3.5 text-[12px] tabular-nums sm:table-cell"
                    style={{ ...mono, color: C.muted }}
                  >
                    {f.datum}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-bold tabular-nums"
                    style={display}
                  >
                    {f.bedrag}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <span
                        className="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]"
                        style={{
                          ...mono,
                          borderColor: m.color,
                          color: m.color,
                          background: m.soft,
                        }}
                      >
                        <Picto name={m.picto} size={13} color={m.color} accent={m.color} />
                        {f.status}
                      </span>
                    </div>
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
