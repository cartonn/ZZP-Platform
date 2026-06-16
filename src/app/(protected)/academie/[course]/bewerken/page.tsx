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
import { CourseForm } from "../../course-form";
import { updateCourse, deleteCourse } from "../../actions";

export const metadata: Metadata = { title: "Cursus bewerken · Academie" };

export default async function CursusBewerkenPage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: slug } = await params;
  await requireRole("ADMIN");
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true, summary: true, audience: true, level: true, order: true },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/academie/${slug}`}>
          <ArrowLeft className="size-4" aria-hidden /> Terug naar cursus
        </Link>
      </Button>
      <PageHeader title="Cursus bewerken" description={course.title} />
      <Card>
        <CardContent className="p-5">
          <CourseForm
            action={updateCourse.bind(null, course.id)}
            submitLabel="Opslaan"
            initial={{
              title: course.title,
              summary: course.summary,
              audience: course.audience,
              level: course.level ?? "",
              order: String(course.order),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Cursus verwijderen</p>
            <p className="text-xs text-muted-foreground">
              Verwijdert de cursus, alle lessen en de voortgang. Kan niet ongedaan worden gemaakt.
            </p>
          </div>
          <ConfirmButton
            action={deleteCourse.bind(null, course.id)}
            title="Cursus verwijderen?"
            description="De cursus, alle lessen en de voortgang worden permanent verwijderd."
            confirmLabel="Verwijderen"
          >
            <Trash2 className="size-3.5" aria-hidden /> Verwijderen
          </ConfirmButton>
        </CardContent>
      </Card>
    </div>
  );
}
