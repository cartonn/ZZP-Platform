import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getCourseDetail } from "@/lib/academy-data";
import { COURSE_STATUS_LABEL, COURSE_STATUS_VARIANT } from "@/lib/academy";
import { COURSE_TRANSITIONS, type CourseStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/plural";
import { setCourseStatus, deleteLesson } from "../actions";

export const metadata: Metadata = { title: "Cursus · Academie" };

const STATUS_ACTION_LABEL: Record<CourseStatus, string> = {
  DRAFT: "Terug naar concept",
  PUBLISHED: "Publiceren",
  ARCHIVED: "Archiveren",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: slug } = await params;
  const actor = await requireActor();
  const course = await getCourseDetail(actor, slug);
  if (!course) notFound();

  const isAdmin = actor.role === "ADMIN";
  const firstOpen = course.lessons.find((l) => !l.completed) ?? course.lessons[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/academie">
          <ArrowLeft className="size-4" aria-hidden /> Academie
        </Link>
      </Button>

      <PageHeader
        title={course.title}
        description={course.summary}
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Badge variant={COURSE_STATUS_VARIANT[course.status]}>
                {COURSE_STATUS_LABEL[course.status]}
              </Badge>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/academie/${course.slug}/bewerken`}>
                  <Pencil className="size-3.5" aria-hidden /> Bewerken
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="space-y-2 p-5">
          <Progress value={course.progress.pct} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs tabular-nums text-muted-foreground">
              {course.progress.done}/{course.progress.total}{" "}
              {plural(course.progress.total, "les", "lessen")} · {course.progress.pct}%
            </p>
            {firstOpen && (
              <Button asChild size="sm">
                <Link href={`/academie/${course.slug}/${firstOpen.id}`}>
                  {course.progress.done > 0 ? "Verdergaan" : "Beginnen"}{" "}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {course.lessons.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Nog geen lessen"
            description={
              isAdmin
                ? "Voeg hieronder de eerste les toe."
                : "Deze cursus heeft nog geen lessen. Kom binnenkort terug."
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {course.lessons.map((l, i) => (
            <div key={l.id} className="flex items-center gap-3 p-4">
              {l.completed ? (
                <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <Link
                href={`/academie/${course.slug}/${l.id}`}
                className="min-w-0 flex-1 font-medium hover:underline"
              >
                {i + 1}. {l.title}
              </Link>
              {l.estimatedMinutes != null && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden /> {l.estimatedMinutes} min
                </span>
              )}
              {isAdmin && (
                <span className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="xs" aria-label="Les bewerken">
                    <Link href={`/academie/${course.slug}/${l.id}/bewerken`}>
                      <Pencil className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <ConfirmButton
                    action={deleteLesson.bind(null, l.id)}
                    title="Les verwijderen?"
                    description="De les en de voltooiingen worden permanent verwijderd."
                    confirmLabel="Verwijderen"
                    size="xs"
                    aria-label="Les verwijderen"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </ConfirmButton>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/academie/${course.slug}/lessen/nieuw`}>
                <Plus className="size-3.5" aria-hidden /> Nieuwe les
              </Link>
            </Button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            {COURSE_TRANSITIONS[course.status].map((next) =>
              // Vanuit PUBLISHED ontneemt elke overgang (DRAFT/ARCHIVED) lopende cursisten direct
              // toegang — dat hoort een bevestiging te vragen, net als een verwijdering. Publiceren
              // (toegang geven) is veilig en blijft een gewone knop.
              course.status === "PUBLISHED" ? (
                <ConfirmButton
                  key={next}
                  action={setCourseStatus.bind(null, course.id, next)}
                  title={next === "ARCHIVED" ? "Cursus archiveren?" : "Cursus terug naar concept?"}
                  description="Lopende cursisten verliezen direct toegang tot deze cursus. Hun voltooiingen blijven bewaard; publiceer opnieuw om de toegang te herstellen."
                  confirmLabel={STATUS_ACTION_LABEL[next]}
                  triggerVariant="secondary"
                  size="sm"
                >
                  {STATUS_ACTION_LABEL[next]}
                </ConfirmButton>
              ) : (
                <form key={next} action={setCourseStatus.bind(null, course.id)}>
                  <input type="hidden" name="status" value={next} />
                  <Button type="submit" size="sm" variant="secondary">
                    {STATUS_ACTION_LABEL[next]}
                  </Button>
                </form>
              ),
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
