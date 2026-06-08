import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getCourseDetail } from "@/lib/academy-data";
import { COURSE_STATUS_LABEL, COURSE_STATUS_VARIANT } from "@/lib/academy";
import { COURSE_TRANSITIONS, type CourseStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { plural } from "@/lib/plural";
import { setCourseStatus } from "../actions";

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
            <Badge variant={COURSE_STATUS_VARIANT[course.status]}>
              {COURSE_STATUS_LABEL[course.status]}
            </Badge>
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

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {course.lessons.map((l, i) => (
          <Link
            key={l.id}
            href={`/academie/${course.slug}/${l.id}`}
            className="card-interactive flex items-center gap-3 p-4"
          >
            {l.completed ? (
              <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="min-w-0 flex-1">
              <span className="font-medium">
                {i + 1}. {l.title}
              </span>
            </span>
            {l.estimatedMinutes != null && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden /> {l.estimatedMinutes} min
              </span>
            )}
          </Link>
        ))}
      </div>

      {isAdmin && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-4">
            <span className="text-sm text-muted-foreground">Beheer:</span>
            {COURSE_TRANSITIONS[course.status].map((next) => (
              <form key={next} action={setCourseStatus.bind(null, course.id)}>
                <input type="hidden" name="status" value={next} />
                <Button type="submit" size="sm" variant="secondary">
                  {STATUS_ACTION_LABEL[next]}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
