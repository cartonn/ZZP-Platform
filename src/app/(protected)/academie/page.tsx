import { type Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { listCourses } from "@/lib/academy-data";
import { COURSE_STATUS_LABEL, COURSE_STATUS_VARIANT } from "@/lib/academy";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Academie · ZZP Platform" };

export default async function AcademiePage() {
  const actor = await requireActor();
  const courses = await listCourses(actor);
  const isAdmin = actor.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academie"
        description="Korte cursussen over je vak, compliance en administratie — leer in je eigen tempo."
        action={
          isAdmin ? (
            <Button asChild>
              <Link href="/academie/nieuw">
                <Plus className="size-4" aria-hidden /> Nieuwe cursus
              </Link>
            </Button>
          ) : undefined
        }
      />

      {courses.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title="Nog geen cursussen"
            description={
              isAdmin
                ? "Maak hierboven je eerste cursus aan."
                : "Zodra er cursussen gepubliceerd zijn, verschijnen ze hier."
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/academie/${c.slug}`} className="block">
              <Card className="card-interactive">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{c.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{c.summary}</p>
                    </div>
                    {isAdmin && (
                      <Badge variant={COURSE_STATUS_VARIANT[c.status]}>
                        {COURSE_STATUS_LABEL[c.status]}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Progress value={c.progress.pct} />
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {c.progress.completed
                        ? "Voltooid"
                        : `${c.progress.done}/${c.progress.total} ${plural(c.progress.total, "les", "lessen")} · ${c.progress.pct}%`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
