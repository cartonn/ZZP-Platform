"use client";

// Concept 05 — "Cockpit" · Data-dicht pro, financiële cockpit (licht).
// Bloomberg ontmoet Stripe in het licht: dichte KPI-rail, smalle tabelrijen (~32px), inline
// sparklines en mini-bars overal, tabular-nums, multi-paneel layout (nav · datagrid · inspector).

import { useState } from "react";
import {
  LayoutGrid,
  Search,
  Briefcase,
  ShieldCheck,
  ListChecks,
  Receipt,
  TrendingUp,
  TrendingDown,
  Circle,
  ChevronRight,
  AlertTriangle,
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
} from "./mock";

const C = {
  canvas: "#fbfbfa",
  panel: "#ffffff",
  ink: "#14161b",
  hair: "#e4e6ea",
  muted: "#646773",
  accent: "#2563eb",
  green: "#16a34a",
  amber: "#d97706",
  red: "#dc2626",
};

const fUI = { fontFamily: "var(--font-lab-inter)" };
const fMono = { fontFamily: "var(--font-lab-mono)", fontVariantNumeric: "tabular-nums" as const };

const NAV: { key: ScreenKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "marktplaats", label: "Marktplaats", icon: Search },
  { key: "opdracht", label: "Opdracht", icon: Briefcase },
  { key: "verificatie", label: "Verificatie", icon: ShieldCheck },
  { key: "acties", label: "Acties", icon: ListChecks },
  { key: "facturen", label: "Facturen", icon: Receipt },
];

function Spark({ data, color }: { data: number[]; color: string }) {
  const w = 72;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 3) - 1.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function MiniBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden="true" style={{ height: 16 }}>
      {data.map((v, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: Math.max(2, (v / max) * 16),
            background: color,
            opacity: 0.35 + (i / data.length) * 0.65,
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return <Circle size={8} fill={color} stroke="none" aria-hidden="true" />;
}

function credColor(s: CredStatus) {
  if (s === "VERIFIED") return C.green;
  if (s === "EXPIRING") return C.amber;
  if (s === "REJECTED") return C.red;
  return C.muted;
}
function credLabel(s: CredStatus) {
  return s === "VERIFIED"
    ? "Geverifieerd"
    : s === "EXPIRING"
      ? "Verloopt"
      : s === "REJECTED"
        ? "Afgewezen"
        : "In review";
}

export function Concept05() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [sel, setSel] = useState(OPDRACHTEN[0]!.id);
  const cur = OPDRACHTEN.find((o) => o.id === sel) ?? OPDRACHTEN[0]!;

  return (
    <div
      className="min-h-[640px] w-full antialiased"
      style={{ ...fUI, background: C.canvas, color: C.ink }}
    >
      <div className="flex min-h-[640px]">
        {/* Left nav */}
        <aside
          className="hidden w-52 shrink-0 flex-col border-r p-3 lg:flex"
          style={{ borderColor: C.hair, background: C.panel }}
        >
          <div className="mb-4 flex items-center gap-2 px-2 py-1">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
              style={{ background: C.accent, ...fMono }}
            >
              ZP
            </span>
            <span className="text-sm font-semibold tracking-tight">Cockpit</span>
          </div>
          {NAV.map((n) => {
            const on = screen === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setScreen(n.key)}
                aria-current={on ? "page" : undefined}
                className="mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: on ? "#eff4ff" : "transparent",
                  color: on ? C.accent : C.muted,
                }}
              >
                <n.icon size={15} aria-hidden="true" /> {n.label}
              </button>
            );
          })}
          <div className="mt-auto rounded-md border p-2.5" style={{ borderColor: C.hair }}>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ background: C.ink, ...fMono }}
              >
                {PROFIEL.initialen}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold leading-tight">{PROFIEL.naam}</p>
                <p className="truncate text-[10px]" style={{ color: C.muted }}>
                  {PROFIEL.rol}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Center column */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Topbar + KPI rail */}
          <header className="border-b" style={{ borderColor: C.hair, background: C.panel }}>
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
                <span className="font-semibold" style={{ color: C.ink }}>
                  {SCREENS.find((s) => s.key === screen)?.label}
                </span>
                <ChevronRight size={13} aria-hidden="true" />
                <span style={fMono}>realtime</span>
              </div>
              <div className="flex gap-1 lg:hidden">
                {NAV.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => setScreen(n.key)}
                    aria-label={n.label}
                    className="flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
                    style={{
                      background: screen === n.key ? "#eff4ff" : "transparent",
                      color: screen === n.key ? C.accent : C.muted,
                    }}
                  >
                    <n.icon size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <div
              className="grid grid-cols-2 divide-x border-t md:grid-cols-4"
              style={{ borderColor: C.hair }}
            >
              {KPIS.map((k) => (
                <div key={k.label} className="px-4 py-2.5" style={{ borderColor: C.hair }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: C.muted }}>
                    {k.label}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="text-[17px] font-semibold leading-none" style={fMono}>
                      {k.value}
                    </span>
                    <Spark data={k.spark} color={k.up ? C.green : C.amber} />
                  </div>
                  <span
                    className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold"
                    style={{ ...fMono, color: k.up ? C.green : C.amber }}
                  >
                    {k.up ? (
                      <TrendingUp size={11} aria-hidden="true" />
                    ) : (
                      <TrendingDown size={11} aria-hidden="true" />
                    )}
                    {k.trend}
                  </span>
                </div>
              ))}
            </div>
          </header>

          {/* Body: grid + inspector */}
          <div className="flex min-h-0 flex-1">
            <section className="min-w-0 flex-1 overflow-auto p-4">
              {screen === "dashboard" && (
                <div className="space-y-4">
                  <DataTable
                    title="Top-matches"
                    cols={["#", "Opdracht", "Plaats", "Tarief", "Match", ""]}
                    rows={OPDRACHTEN.map((o) => ({
                      key: o.id,
                      active: o.id === sel,
                      onClick: () => setSel(o.id),
                      cells: [
                        <span key="i" style={{ ...fMono, color: C.muted }}>
                          {o.id.replace("OPD-", "")}
                        </span>,
                        <span key="t" className="font-medium">
                          {o.titel}
                        </span>,
                        <span key="p" style={{ color: C.muted }}>
                          {o.plaats}
                        </span>,
                        <span key="r" style={fMono}>
                          {o.tarief.replace(" / uur", "")}
                        </span>,
                        <MatchCell key="m" value={o.match} />,
                        <ChevronRight
                          key="c"
                          size={14}
                          style={{ color: C.muted }}
                          aria-hidden="true"
                        />,
                      ],
                    }))}
                  />
                  <DataTable
                    title="Facturen — cashflow"
                    cols={["Nr", "Klant", "Bedrag", "Status", "Datum"]}
                    rows={FACTUREN.map((f) => ({
                      key: f.nr,
                      cells: [
                        <span key="n" style={{ ...fMono, color: C.muted }}>
                          {f.nr.replace("FAC-2025-", "")}
                        </span>,
                        <span key="k" className="font-medium">
                          {f.klant}
                        </span>,
                        <span key="b" style={fMono}>
                          {f.bedrag}
                        </span>,
                        <StatusCell key="s" status={f.status} />,
                        <span key="d" style={{ ...fMono, color: C.muted }}>
                          {f.datum}
                        </span>,
                      ],
                    }))}
                  />
                </div>
              )}

              {screen === "marktplaats" && (
                <DataTable
                  title="Marktplaats — alle opdrachten"
                  cols={["#", "Opdracht", "Opdrachtgever", "Plaats", "Uren", "Tarief", "Match"]}
                  rows={OPDRACHTEN.map((o) => ({
                    key: o.id,
                    active: o.id === sel,
                    onClick: () => {
                      setSel(o.id);
                      setScreen("opdracht");
                    },
                    cells: [
                      <span key="i" style={{ ...fMono, color: C.muted }}>
                        {o.id.replace("OPD-", "")}
                      </span>,
                      <span key="t" className="font-medium">
                        {o.titel}
                      </span>,
                      <span key="g" style={{ color: C.muted }}>
                        {o.opdrachtgever}
                      </span>,
                      <span key="p" style={{ color: C.muted }}>
                        {o.plaats}
                      </span>,
                      <span key="u" style={fMono}>
                        {o.uren}
                      </span>,
                      <span key="r" style={fMono}>
                        {o.tarief.replace(" / uur", "")}
                      </span>,
                      <MatchCell key="m" value={o.match} />,
                    ],
                  }))}
                />
              )}

              {screen === "opdracht" && (
                <div
                  className="rounded-lg border p-5"
                  style={{ borderColor: C.hair, background: C.panel }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px]" style={{ ...fMono, color: C.muted }}>
                        {cur.id}
                      </span>
                      <h2 className="text-[17px] font-semibold tracking-tight">{cur.titel}</h2>
                      <p className="text-[12px]" style={{ color: C.muted }}>
                        {cur.opdrachtgever} · {cur.plaats}
                      </p>
                    </div>
                    <MatchCell value={cur.match} big />
                  </div>
                  <div
                    className="mt-4 grid grid-cols-3 divide-x rounded-md border"
                    style={{ borderColor: C.hair }}
                  >
                    {[
                      ["Tarief", cur.tarief],
                      ["Uren", cur.uren],
                      ["Start", cur.start],
                    ].map(([l, v]) => (
                      <div key={l} className="px-3 py-2">
                        <p className="text-[10px] uppercase" style={{ color: C.muted }}>
                          {l}
                        </p>
                        <p className="text-[13px] font-semibold" style={fMono}>
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <ReasonList title="Voordelen" items={cur.redenen.plus} color={C.green} />
                    <ReasonList title="Aandachtspunten" items={cur.redenen.min} color={C.amber} />
                  </div>
                </div>
              )}

              {screen === "verificatie" && (
                <DataTable
                  title="Verificatie — credentials"
                  cols={["", "Credential", "Detail", "Status"]}
                  rows={CREDENTIALS.map((c) => ({
                    key: c.naam,
                    cells: [
                      <Dot key="d" color={credColor(c.status)} />,
                      <span key="n" className="font-medium">
                        {c.naam}
                      </span>,
                      <span key="x" style={{ color: C.muted }}>
                        {c.detail}
                      </span>,
                      <span
                        key="s"
                        className="text-[11px] font-semibold"
                        style={{ color: credColor(c.status) }}
                      >
                        {credLabel(c.status)}
                      </span>,
                    ],
                  }))}
                />
              )}

              {screen === "acties" && (
                <div className="space-y-2">
                  {ACTIES.map((a) => {
                    const warn = a.urgentie === "warning";
                    return (
                      <div
                        key={a.titel}
                        className="flex items-center gap-3 rounded-md border px-3.5 py-2.5 transition-colors hover:bg-[#f6f7f9]"
                        style={{ borderColor: C.hair, background: C.panel }}
                      >
                        <Dot color={warn ? C.amber : C.accent} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium">{a.titel}</p>
                          <p className="text-[11px]" style={{ color: C.muted }}>
                            {a.detail}
                          </p>
                        </div>
                        <button
                          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2"
                          style={{ background: warn ? C.amber : C.accent }}
                        >
                          {a.cta}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {screen === "facturen" && (
                <DataTable
                  title="Facturen — debiteuren"
                  cols={["Nr", "Klant", "Bedrag", "Status", "Datum"]}
                  rows={FACTUREN.map((f) => ({
                    key: f.nr,
                    cells: [
                      <span key="n" style={{ ...fMono, color: C.muted }}>
                        {f.nr}
                      </span>,
                      <span key="k" className="font-medium">
                        {f.klant}
                      </span>,
                      <span key="b" style={fMono}>
                        {f.bedrag}
                      </span>,
                      <StatusCell key="s" status={f.status} />,
                      <span key="d" style={{ ...fMono, color: C.muted }}>
                        {f.datum}
                      </span>,
                    ],
                  }))}
                />
              )}
            </section>

            {/* Inspector panel */}
            <aside
              className="hidden w-72 shrink-0 overflow-auto border-l p-4 xl:block"
              style={{ borderColor: C.hair, background: C.panel }}
            >
              <p className="mb-2 text-[10px] uppercase tracking-wide" style={{ color: C.muted }}>
                Inspector
              </p>
              <h3 className="text-[14px] font-semibold leading-snug">{cur.titel}</h3>
              <p className="text-[12px]" style={{ color: C.muted }}>
                {cur.opdrachtgever}
              </p>
              <div className="my-3 h-px" style={{ background: C.hair }} />
              <dl className="space-y-1.5 text-[12px]">
                {[
                  ["Tarief", cur.tarief],
                  ["Uren", cur.uren],
                  ["Start", cur.start],
                  ["Plaats", cur.plaats],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt style={{ color: C.muted }}>{k}</dt>
                    <dd className="font-medium" style={fMono}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="my-3 h-px" style={{ background: C.hair }} />
              <p className="mb-1.5 text-[11px] font-semibold">Compliance</p>
              <div className="space-y-1">
                {CREDENTIALS.map((c) => (
                  <div key={c.naam} className="flex items-center gap-2 text-[11px]">
                    <Dot color={credColor(c.status)} />
                    <span className="flex-1 truncate">{c.naam}</span>
                    <MiniBars
                      data={c.status === "VERIFIED" ? [3, 5, 6, 8] : [2, 3, 2, 4]}
                      color={credColor(c.status)}
                    />
                  </div>
                ))}
              </div>
              <div className="my-3 h-px" style={{ background: C.hair }} />
              <p className="mb-1.5 text-[11px] font-semibold">Documenten</p>
              <div className="space-y-1">
                {DOCUMENTEN.slice(0, 3).map((d) => (
                  <div key={d.naam} className="flex items-center justify-between text-[11px]">
                    <span className="truncate" style={{ color: C.muted }}>
                      {d.naam}
                    </span>
                    <span style={fMono}>{d.grootte}</span>
                  </div>
                ))}
              </div>
              <div
                className="mt-3 flex items-start gap-2 rounded-md p-2.5 text-[11px]"
                style={{ background: "#fef6ec", color: C.amber }}
              >
                <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                VOG verloopt over 23 dagen — vernieuw tijdig.
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );

  function MatchCell({ value, big }: { value: number; big?: boolean }) {
    const color = value >= 90 ? C.green : value >= 80 ? C.accent : C.amber;
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={big ? "text-2xl font-bold" : "font-semibold"} style={{ ...fMono, color }}>
          {value}
          <span className="text-[10px]">%</span>
        </span>
        <span
          className="inline-block h-1.5 rounded-full"
          style={{ width: big ? 56 : 28, background: C.hair }}
          aria-hidden="true"
        >
          <span
            className="block h-1.5 rounded-full"
            style={{ width: `${value}%`, background: color }}
          />
        </span>
      </span>
    );
  }
}

function StatusCell({ status }: { status: string }) {
  const map: Record<string, string> = {
    Betaald: C.green,
    Openstaand: C.amber,
    Concept: C.muted,
  };
  const color = map[status] ?? C.muted;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color }}>
      <Dot color={color} /> {status}
    </span>
  );
}

function ReasonList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-1.5 text-[12px]">
            <Dot color={color} />
            <span className="-mt-0.5">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Row = {
  key: string;
  active?: boolean;
  onClick?: () => void;
  cells: React.ReactNode[];
};

function DataTable({ title, cols, rows }: { title: string; cols: string[]; rows: Row[] }) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: C.hair, background: C.panel }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2"
        style={{ background: "#f6f7f9" }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: C.muted }}
        >
          {title}
        </span>
        <span className="text-[10px]" style={{ ...fMono, color: C.muted }}>
          {rows.length} rijen
        </span>
      </div>
      <table className="w-full text-left text-[12px]">
        <thead className="sticky top-0" style={{ background: C.panel }}>
          <tr style={{ color: C.muted }}>
            {cols.map((c, i) => (
              <th
                key={c || i}
                className="border-b px-3.5 py-1.5 text-[10px] font-medium uppercase tracking-wide"
                style={{ borderColor: C.hair }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              onClick={r.onClick}
              className="border-b transition-colors last:border-0 hover:bg-[#f6f7f9]"
              style={{
                borderColor: C.hair,
                cursor: r.onClick ? "pointer" : "default",
                background: r.active ? "#eff4ff" : "transparent",
                height: 32,
              }}
            >
              {r.cells.map((cell, i) => (
                <td key={i} className="whitespace-nowrap px-3.5 py-1.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
