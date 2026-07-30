import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeCompanyCompleteness } from "@/lib/profile";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { CompanyForm } from "../company-form";

export const metadata: Metadata = { title: "Bedrijfsprofiel bewerken · Handslag" };

export default async function BedrijfBewerkenPage() {
  const actor = await requireRole("CLIENT");

  const [company, industries] = await Promise.all([
    prisma.company.findUnique({ where: { userId: actor.id } }),
    // unbounded-allow: kleine referentietabel industries
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!company) {
    return (
      <div>
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Building2}
              title="Geen bedrijfsprofiel gevonden"
              description="Er is nog geen bedrijfsprofiel gekoppeld aan dit account."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { score, missing } = computeCompanyCompleteness({
    description: company.description,
    location: company.location,
    website: company.website,
    hasIndustry: !!company.industryId,
    hasLogo: !!company.logoKey,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
            Bedrijfsprofiel bewerken
          </h1>
          <p className="text-sm text-muted-foreground">
            Een compleet profiel wekt vertrouwen bij ZZP&apos;ers die op je opdrachten reageren.
          </p>
        </div>
        <Link
          href="/bedrijf"
          className="focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Terug naar bedrijfsprofiel
        </Link>
      </header>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profiel-compleetheid</span>
            <span className="text-sm tabular-nums text-muted-foreground">{score}%</span>
          </div>
          <Progress value={score} />
          {missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Nog aan te vullen: {missing.map((m) => m.label).join(", ")}.
            </p>
          ) : (
            <p className="text-xs text-success">Je bedrijfsprofiel is compleet.</p>
          )}
        </CardContent>
      </Card>

      <CompanyForm
        initial={{
          name: company.name,
          description: company.description ?? "",
          website: company.website ?? "",
          location: company.location ?? "",
          industryId: company.industryId ?? "",
          logoKey: company.logoKey,
        }}
        industries={industries}
      />
    </div>
  );
}
