import { type Metadata } from "next";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { computeCompanyCompleteness } from "@/lib/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Bedrijfsprofiel · ZZP Platform" };

export default async function BedrijfPage() {
  const actor = await requireRole("CLIENT");

  const [company, industries] = await Promise.all([
    prisma.company.findUnique({ where: { userId: actor.id } }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Geen bedrijfsprofiel gevonden voor dit account.
            </p>
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Bedrijfsprofiel</h1>
        <p className="text-sm text-muted-foreground">
          Een compleet profiel wekt vertrouwen bij ZZP&apos;ers die op je opdrachten reageren.
        </p>
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
