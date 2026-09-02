import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { CONCEPTS, BUILT } from "@/components/ontwerp/concepts/registry";
import { requireRole } from "@/lib/authz";
import { isDesignLabEnabled } from "@/lib/design-lab";

export const metadata: Metadata = {
  title: "Ontwerp-lab — redesign-concepten",
  robots: { index: false, follow: false },
};

// De omgevingsvlag wordt per request gelezen; prerenderen zou 'm op bouwtijd vastzetten.
export const dynamic = "force-dynamic";

export default async function OntwerpIndexPage() {
  if (!isDesignLabEnabled(process.env.DESIGN_LAB_ENABLED)) notFound();
  await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-[1180px] px-6 py-14">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">
            Handslag · design lab
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {CONCEPTS.length} richtingen voor de herontwerp
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
            Elk concept toont dezelfde kernschermen — dashboard, marktplaats, opdracht, verificatie,
            acties en facturen — in een eigen, onderscheidende designtaal. Klik een concept om de
            volledige uitwerking te bekijken. Kies de richting die het platform wereldklasse maakt.
          </p>
          <p className="mt-3 font-mono text-xs text-neutral-400">
            {BUILT.length} van {CONCEPTS.length} uitgewerkt
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPTS.map((c) => {
            const inner = (
              <>
                <div
                  className="relative flex h-40 items-end overflow-hidden p-4"
                  style={{ backgroundColor: c.bg, color: c.fg }}
                >
                  <span
                    className="absolute right-4 top-4 font-mono text-5xl font-bold tabular-nums opacity-10"
                    aria-hidden
                  >
                    {c.id}
                  </span>
                  {/* Mini-preview: drie balken + accent-zegel, gekleurd naar de richting. */}
                  <div className="w-full space-y-2">
                    <div
                      className="h-2 w-1/3 rounded-full"
                      style={{ backgroundColor: c.fg, opacity: 0.18 }}
                    />
                    <div
                      className="h-2 w-2/3 rounded-full"
                      style={{ backgroundColor: c.fg, opacity: 0.12 }}
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className="flex h-7 items-center rounded-full px-3 font-mono text-xs font-semibold"
                        style={{ backgroundColor: c.accent, color: c.bg }}
                      >
                        94% match
                      </span>
                      <span
                        className="h-7 w-7 rounded-full ring-2"
                        style={{ backgroundColor: c.accent, opacity: 0.25 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold tracking-tight">{c.name}</h2>
                    {c.available ? (
                      <ArrowRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                    ) : (
                      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                        <Lock className="size-3" /> binnenkort
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-neutral-400">
                    {c.direction}
                  </p>
                  <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">{c.rationale}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.trends.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 font-mono text-[11px] text-neutral-400">{c.fonts}</p>
                </div>
              </>
            );

            const base =
              "group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white";
            return (
              <li key={c.id}>
                {c.available ? (
                  <Link
                    href={`/ontwerp/${c.id}`}
                    className={`${base} transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900`}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className={`${base} opacity-60`} aria-disabled>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <footer className="mt-16 border-t border-neutral-200 pt-6 font-mono text-xs text-neutral-400">
          Intern ontwerp-lab · niet geïndexeerd · mock-content, geen echte gegevens
        </footer>
      </div>
    </div>
  );
}
