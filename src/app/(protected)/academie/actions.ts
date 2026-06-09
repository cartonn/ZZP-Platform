"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireActor, requireRole, AuthorizationError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { courseStatusSchema, type CourseAudience, type UserRole } from "@/lib/enums";
import { canCourseTransition, visibleAudiencesForRole, slugify } from "@/lib/academy";
import { courseInputSchema, lessonInputSchema } from "@/lib/validation";

export type AuthorState =
  | { ok?: true; error?: string; fieldErrors?: Record<string, string> }
  | undefined;

function fieldErrorsFrom(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path[0];
    if (typeof k === "string" && !out[k]) out[k] = i.message;
  }
  return out;
}

async function requireAdminOrState(): Promise<
  { actor: Awaited<ReturnType<typeof requireRole>> } | { state: AuthorState }
> {
  try {
    return { actor: await requireRole("ADMIN") };
  } catch (e) {
    if (e instanceof AuthorizationError) return { state: { error: e.message } };
    throw e;
  }
}

/** Maak een nieuwe cursus (DRAFT). De slug wordt afgeleid van de titel en uniek gemaakt. */
export async function createCourse(_prev: AuthorState, formData: FormData): Promise<AuthorState> {
  const auth = await requireAdminOrState();
  if ("state" in auth) return auth.state;

  const parsed = courseInputSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    audience: formData.get("audience") ?? undefined,
    level: formData.get("level"),
    order: formData.get("order") ?? "",
  });
  if (!parsed.success) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: fieldErrorsFrom(parsed.error) }; // prettier-ignore
  }
  const data = parsed.data;

  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  for (let n = 2; await prisma.course.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${baseSlug}-${n}`;
  }

  // De unieke index is de bron van waarheid: bij een race op de slug (twee gelijktijdige aanmaak-
  // pogingen passeren beide de leescheck) opnieuw proberen met een suffix i.p.v. een 500.
  const courseData = {
    authorId: auth.actor.id,
    title: data.title,
    summary: data.summary,
    audience: data.audience,
    level: data.level ?? null,
    order: data.order,
    status: "DRAFT",
  };
  let course: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 5 && !course; attempt++) {
    try {
      course = await prisma.course.create({
        data: { ...courseData, slug },
        select: { id: true, slug: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        slug = `${baseSlug}-${attempt + 2}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }
      throw e;
    }
  }
  if (!course) return { error: "Aanmaken mislukt, probeer opnieuw." };
  await audit({
    actorId: auth.actor.id,
    action: "COURSE_CREATED",
    entityType: "Course",
    entityId: course.id,
    metadata: { slug },
  });

  revalidatePath("/academie");
  redirect(`/academie/${course.slug}`);
}

/** Werk de metadata van een cursus bij. */
export async function updateCourse(
  courseId: string,
  _prev: AuthorState,
  formData: FormData,
): Promise<AuthorState> {
  const auth = await requireAdminOrState();
  if ("state" in auth) return auth.state;

  const parsed = courseInputSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    audience: formData.get("audience") ?? undefined,
    level: formData.get("level"),
    order: formData.get("order") ?? "",
  });
  if (!parsed.success) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: fieldErrorsFrom(parsed.error) }; // prettier-ignore
  }
  const data = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  if (!course) return { error: "Cursus niet gevonden." };

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title,
      summary: data.summary,
      audience: data.audience,
      level: data.level ?? null,
      order: data.order,
    },
  });
  await audit({
    actorId: auth.actor.id,
    action: "COURSE_UPDATED",
    entityType: "Course",
    entityId: courseId,
  });

  revalidatePath("/academie");
  revalidatePath(`/academie/${course.slug}`);
  redirect(`/academie/${course.slug}`);
}

/** Verwijder een cursus (en daarmee de lessen + voortgang via cascade). */
export async function deleteCourse(courseId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return;
  await prisma.course.delete({ where: { id: courseId } });
  await audit({
    actorId: actor.id,
    action: "COURSE_DELETED",
    entityType: "Course",
    entityId: courseId,
  });
  revalidatePath("/academie");
  redirect("/academie");
}

/** Voeg een les toe aan een cursus. */
export async function createLesson(
  courseId: string,
  _prev: AuthorState,
  formData: FormData,
): Promise<AuthorState> {
  const auth = await requireAdminOrState();
  if ("state" in auth) return auth.state;

  const parsed = lessonInputSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    estimatedMinutes: formData.get("estimatedMinutes") ?? "",
    order: formData.get("order") ?? "",
  });
  if (!parsed.success) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: fieldErrorsFrom(parsed.error) }; // prettier-ignore
  }
  const data = parsed.data;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true, _count: { select: { lessons: true } } },
  });
  if (!course) return { error: "Cursus niet gevonden." };

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title: data.title,
      body: data.body,
      estimatedMinutes: data.estimatedMinutes ?? null,
      order: data.order ?? course._count.lessons + 1,
    },
    select: { id: true },
  });
  await audit({
    actorId: auth.actor.id,
    action: "LESSON_CREATED",
    entityType: "Lesson",
    entityId: lesson.id,
    metadata: { courseId },
  });

  revalidatePath(`/academie/${course.slug}`);
  redirect(`/academie/${course.slug}`);
}

/** Werk een les bij. */
export async function updateLesson(
  lessonId: string,
  _prev: AuthorState,
  formData: FormData,
): Promise<AuthorState> {
  const auth = await requireAdminOrState();
  if ("state" in auth) return auth.state;

  const parsed = lessonInputSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    estimatedMinutes: formData.get("estimatedMinutes") ?? "",
    order: formData.get("order") ?? "",
  });
  if (!parsed.success) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: fieldErrorsFrom(parsed.error) }; // prettier-ignore
  }
  const data = parsed.data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { course: { select: { slug: true } } },
  });
  if (!lesson) return { error: "Les niet gevonden." };

  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title,
      body: data.body,
      estimatedMinutes: data.estimatedMinutes ?? null,
      order: data.order,
    },
  });
  await audit({
    actorId: auth.actor.id,
    action: "LESSON_UPDATED",
    entityType: "Lesson",
    entityId: lessonId,
  });

  revalidatePath(`/academie/${lesson.course.slug}`);
  redirect(`/academie/${lesson.course.slug}`);
}

/** Verwijder een les (en de voltooiingen via cascade). */
export async function deleteLesson(lessonId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { course: { select: { slug: true } } },
  });
  if (!lesson) return;
  await prisma.lesson.delete({ where: { id: lessonId } });
  await audit({
    actorId: actor.id,
    action: "LESSON_DELETED",
    entityType: "Lesson",
    entityId: lessonId,
  });
  revalidatePath(`/academie/${lesson.course.slug}`);
  redirect(`/academie/${lesson.course.slug}`);
}

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
export async function setCourseStatus(
  courseId: string,
  // De status komt óf als gebonden argument (ConfirmButton-flow, geen verborgen veld mogelijk) óf
  // uit het formulierveld (plain submit). Eén actie dekt beide aanroepstijlen.
  statusArg: string | FormData,
  _formData?: FormData,
): Promise<void> {
  let actor;
  try {
    actor = await requireRole("ADMIN");
  } catch (e) {
    if (e instanceof AuthorizationError) return;
    throw e;
  }
  const rawStatus =
    typeof statusArg === "string" ? statusArg : String(statusArg.get("status") ?? "");
  const parsed = courseStatusSchema.safeParse(rawStatus);
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
