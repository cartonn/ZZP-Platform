import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { LessonForm } from "../../../lesson-form";
import { updateLesson, deleteLesson } from "../../../actions";

export const metadata: Metadata = { title: "Les bewerken · Academie" };

export default async function LesBewerkenPage({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: slug, lesson: lessonId } = await params;
  await requireRole("ADMIN");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      body: true,
      estimatedMinutes: true,
      order: true,
      course: { select: { slug: true } },
    },
  });
  if (!lesson || lesson.course.slug !== slug) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/academie/${slug}`}>
          <ArrowLeft className="size-4" aria-hidden /> Terug naar cursus
        </Link>
      </Button>
      <PageHeader title="Les bewerken" description={lesson.title} />
      <Card>
        <CardContent className="p-5">
          <LessonForm
            action={updateLesson.bind(null, lesson.id)}
            submitLabel="Opslaan"
            initial={{
              title: lesson.title,
              body: lesson.body,
              estimatedMinutes:
                lesson.estimatedMinutes != null ? String(lesson.estimatedMinutes) : "",
              order: String(lesson.order),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Les verwijderen</p>
            <p className="text-xs text-muted-foreground">
              Verwijdert de les en de voltooiingen ervan.
            </p>
          </div>
          <ConfirmButton
            action={deleteLesson.bind(null, lesson.id)}
            title="Les verwijderen?"
            description="De les en de voltooiingen worden permanent verwijderd."
            confirmLabel="Verwijderen"
          >
            <Trash2 className="size-3.5" aria-hidden /> Verwijderen
          </ConfirmButton>
        </CardContent>
      </Card>
    </div>
  );
}
