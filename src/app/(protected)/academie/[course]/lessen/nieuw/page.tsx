import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonForm } from "../../../lesson-form";
import { createLesson } from "../../../actions";

export const metadata: Metadata = { title: "Nieuwe les · Academie" };

export default async function NieuweLesPage({ params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  await requireRole("ADMIN");
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/academie/${slug}`}>
          <ArrowLeft className="size-4" aria-hidden /> Terug naar cursus
        </Link>
      </Button>
      <PageHeader title="Nieuwe les" description={course.title} />
      <Card>
        <CardContent className="p-5">
          <LessonForm action={createLesson.bind(null, course.id)} submitLabel="Les toevoegen" />
        </CardContent>
      </Card>
    </div>
  );
}
