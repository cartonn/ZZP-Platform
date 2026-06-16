import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getLessonView } from "@/lib/academy-data";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleLessonComplete } from "../../actions";

export const metadata: Metadata = { title: "Les · Academie" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: slug, lesson: lessonId } = await params;
  const actor = await requireActor();
  const lesson = await getLessonView(actor, slug, lessonId);
  if (!lesson) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/academie/${lesson.courseSlug}`}>
          <ArrowLeft className="size-4" aria-hidden /> {lesson.courseTitle}
        </Link>
      </Button>

      <PageHeader
        title={lesson.title}
        action={lesson.completed ? <Badge variant="success">Voltooid</Badge> : undefined}
      />

      {lesson.estimatedMinutes != null && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden /> {lesson.estimatedMinutes} min lezen
        </p>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {lesson.body}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <form action={toggleLessonComplete.bind(null, lesson.id)}>
          <Button type="submit" variant={lesson.completed ? "secondary" : "primary"}>
            <Check className="size-4" aria-hidden />
            {lesson.completed ? "Markeer als niet voltooid" : "Markeer als voltooid"}
          </Button>
        </form>
        <div className="flex items-center gap-2">
          {lesson.prevLessonId && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/academie/${lesson.courseSlug}/${lesson.prevLessonId}`}>
                <ArrowLeft className="size-4" aria-hidden /> Vorige
              </Link>
            </Button>
          )}
          {lesson.nextLessonId && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/academie/${lesson.courseSlug}/${lesson.nextLessonId}`}>
                Volgende <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
