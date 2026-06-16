import { type Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CourseForm } from "../course-form";
import { createCourse } from "../actions";

export const metadata: Metadata = { title: "Nieuwe cursus · Academie" };

export default async function NieuweCursusPage() {
  await requireRole("ADMIN");
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/academie">
          <ArrowLeft className="size-4" aria-hidden /> Academie
        </Link>
      </Button>
      <PageHeader
        title="Nieuwe cursus"
        description="De cursus start als concept; publiceer 'm zodra de lessen klaar zijn."
      />
      <Card>
        <CardContent className="p-5">
          <CourseForm action={createCourse} submitLabel="Cursus aanmaken" />
        </CardContent>
      </Card>
    </div>
  );
}
