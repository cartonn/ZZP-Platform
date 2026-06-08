"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireActor, requireRole, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { courseStatusSchema, type CourseAudience, type UserRole } from "@/lib/enums";
import { canCourseTransition, visibleAudiencesForRole } from "@/lib/academy";

/**
 * Markeer een les als voltooid, of maak het ongedaan (toggle). Idempotent en race-tolerant op de
 * compound-PK (lessonId,userId) — spiegelt het toggleVote-patroon. Alleen lessen uit een voor de
 * gebruiker zichtbare cursus.
 */
export async function toggleLessonComplete(lessonId: string): Promise<void> {
  const actor = await requireActor();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, course: { select: { status: true, audience: true } } },
  });
  if (!lesson) return;
  // Toegang: niet-beheerder mag alleen een gepubliceerde cursus voor zijn doelgroep afvinken.
  if (actor.role !== "ADMIN") {
    const ok =
      lesson.course.status === "PUBLISHED" &&
      visibleAudiencesForRole(actor.role as UserRole).includes(
        lesson.course.audience as CourseAudience,
      );
    if (!ok) return;
  }

  const removed = await prisma.lessonCompletion.deleteMany({
    where: { lessonId, userId: actor.id },
  });
  if (removed.count === 0) {
    try {
      await prisma.lessonCompletion.create({ data: { lessonId, userId: actor.id } });
      await audit({
        actorId: actor.id,
        action: "LESSON_COMPLETED",
        entityType: "Lesson",
        entityId: lessonId,
        metadata: { courseId: lesson.courseId },
      });
    } catch (e) {
      // Race op de compound-PK negeren; al het andere doorgooien.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }

  revalidatePath("/academie");
}

/** Beheerder zet de cursusstatus (publiceren/archiveren) via de expliciete overgangsmap. */
export async function setCourseStatus(courseId: string, formData: FormData): Promise<void> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return;
    throw e;
  }
  const parsed = courseStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;
  const next = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { status: true, slug: true },
  });
  if (!course) return;
  const current = course.status as typeof next;
  if (current === next || !canCourseTransition(current, next)) return;

  await prisma.course.update({ where: { id: courseId }, data: { status: next } });
  await audit({
    actorId: actor.id,
    action: "COURSE_STATUS_SET",
    entityType: "Course",
    entityId: courseId,
    metadata: { from: current, to: next },
  });

  revalidatePath("/academie");
  revalidatePath(`/academie/${course.slug}`);
}
