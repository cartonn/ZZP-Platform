import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Diensten importeren · ZZP Platform" };

export default async function ImporteerPage() {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") redirect("/diensten");

  const collaborations = await prisma.collaboration.findMany({
    where: {
      status: "ACTIVE",
      freelancer: { userId: actor.id },
    },
    include: {
      job: { select: { title: true } },
      company: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const options = collaborations.map((c) => ({
    id: c.id,
    label: `${c.job.title} — ${c.company.name}`,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/diensten"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Terug naar diensten
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold">Diensten importeren</h1>
        <p className="text-sm text-muted-foreground">
          Importeer bestaande diensten vanuit een CSV-bestand of geplakt tekst. Elke regel wordt
          een afzonderlijke urenstaat die de opdrachtgever kan goedkeuren.
        </p>
      </header>

      {options.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Je hebt geen actieve samenwerkingen. Diensten kunnen alleen worden geïmporteerd in een
          actieve samenwerking (contract getekend).{" "}
          <Link href="/samenwerkingen" className="underline underline-offset-2 hover:text-foreground">
            Bekijk je samenwerkingen →
          </Link>
        </div>
      ) : (
        <ImportForm collaborationOptions={options} />
      )}

      <section className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
        <p className="font-medium">CSV-formaat</p>
        <p className="mt-1 text-muted-foreground">
          Semikolon-gescheiden, één dienst per regel. De kolom <code>omschrijving</code> is optioneel.
          Een kopregels-regel wordt automatisch overgeslagen.
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-background p-3 text-xs leading-relaxed">
          {`start;eind;omschrijving
2024-01-15T22:00;2024-01-16T06:00;Nachtdienst week 3
2024-01-17T08:00;2024-01-17T16:00;Dagdienst
2024-01-20T06:00;2024-01-20T14:00;Vroege dienst`}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Tijdstempels: ISO-8601 of met spatie als scheidingsteken (bv. &ldquo;2024-01-15 22:00&rdquo;).
          Avond/nacht/weekend/feestdagen worden automatisch afgeleid aan de hand van het ORT-profiel
          van de samenwerking.
        </p>
      </section>
    </div>
  );
}
