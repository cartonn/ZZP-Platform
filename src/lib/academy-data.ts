// Data-access voor de Academie. Server-side waarheid: niet-beheerders zien alleen GEPUBLICEERDE
// cursussen voor hun doelgroep; de voortgang wordt afgeleid uit LessonCompletion (geen denormalisatie).

import { prisma } from "@/lib/db";
import { type Actor } from "@/lib/authz";
import { type CourseStatus, type CourseAudience, type UserRole } from "@/lib/enums";
import { visibleAudiencesForRole, courseProgress, type CourseProgress } from "@/lib/academy";

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  audience: CourseAudience;
  level: string | null;
  progress: CourseProgress;
}

function isAdmin(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/** Cursussen zichtbaar voor de actor, met diens voortgang. ADMIN ziet alle statussen. */
export async function listCourses(actor: Actor): Promise<CourseListItem[]> {
  const where = isAdmin(actor)
    ? {}
    : {
        status: "PUBLISHED",
        audience: { in: visibleAudiencesForRole(actor.role as UserRole) },
      };

  const courses = await prisma.course.findMany({
    where,
    orderBy: [{ order: "asc" }, { title: "asc" }],
    include: {
      lessons: {
        select: {
          id: true,
          completions: { where: { userId: actor.id }, select: { userId: true } },
        },
      },
    },
  });

  return courses.map((c) => {
    const total = c.lessons.length;
    const done = c.lessons.filter((l) => l.completions.length > 0).length;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      status: c.status as CourseStatus,
      audience: c.audience as CourseAudience,
      level: c.level,
      progress: courseProgress(done, total),
    };
  });
}

export interface CourseLesson {
  id: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
  completed: boolean;
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: CourseStatus;
  audience: CourseAudience;
  level: string | null;
  lessons: CourseLesson[];
  progress: CourseProgress;
}

/** Toegang: een niet-beheerder mag alleen een gepubliceerde cursus voor zijn doelgroep zien. */
function canView(actor: Actor, course: { status: string; audience: string }): boolean {
  if (isAdmin(actor)) return true;
  return (
    course.status === "PUBLISHED" &&
    visibleAudiencesForRole(actor.role as UserRole).includes(course.audience as CourseAudience)
  );
}

export async function getCourseDetail(actor: Actor, slug: string): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: [{ order: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          order: true,
          estimatedMinutes: true,
          completions: { where: { userId: actor.id }, select: { userId: true } },
        },
      },
    },
  });
  if (!course || !canView(actor, course)) return null;

  const lessons: CourseLesson[] = course.lessons.map((l) => ({
    id: l.id,
    title: l.title,
    order: l.order,
    estimatedMinutes: l.estimatedMinutes,
    completed: l.completions.length > 0,
  }));
  const done = lessons.filter((l) => l.completed).length;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    status: course.status as CourseStatus,
    audience: course.audience as CourseAudience,
    level: course.level,
    lessons,
    progress: courseProgress(done, lessons.length),
  };
}

export interface LessonView {
  courseSlug: string;
  courseTitle: string;
  id: string;
  title: string;
  body: string;
  estimatedMinutes: number | null;
  completed: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

export async function getLessonView(
  actor: Actor,
  slug: string,
  lessonId: string,
): Promise<LessonView | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: [{ order: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          body: true,
          estimatedMinutes: true,
          completions: { where: { userId: actor.id }, select: { userId: true } },
        },
      },
    },
  });
  if (!course || !canView(actor, course)) return null;

  const idx = course.lessons.findIndex((l) => l.id === lessonId);
  if (idx === -1) return null;
  const lesson = course.lessons[idx]!;

  return {
    courseSlug: course.slug,
    courseTitle: course.title,
    id: lesson.id,
    title: lesson.title,
    body: lesson.body,
    estimatedMinutes: lesson.estimatedMinutes,
    completed: lesson.completions.length > 0,
    prevLessonId: idx > 0 ? course.lessons[idx - 1]!.id : null,
    nextLessonId: idx < course.lessons.length - 1 ? course.lessons[idx + 1]!.id : null,
  };
}
