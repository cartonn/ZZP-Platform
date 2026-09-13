import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [] as {
    id: string;
    collaborationId: string;
    description: string;
    collaboration: { job: { title: string } };
  }[],
}));
vi.mock("@/lib/data/admin-performance-escalations", () => ({
  getAdminPerformanceEscalations: vi.fn(async () => state.rows),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    user: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    noShowReport: {
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0),
      groupBy: vi.fn(async () => []),
    },
    supportTicket: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    shiftHandoff: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
  },
}));
import { pendingTasks, pendingTaskCount } from "./pending-tasks";
import { navBadges, withActionCenterBadge } from "@/lib/signals";
import { selectDashboardTasks } from "./tasks";
import { getAdminPerformanceEscalations } from "@/lib/data/admin-performance-escalations";

beforeEach(() => {
  vi.clearAllMocks();
  state.rows = ["p1", "p2"].map((id) => ({
    id,
    collaborationId: "same-collaboration",
    description: id === "p1" ? "Week 37" : "  ",
    collaboration: { job: { title: "Wijkzorg" } },
  }));
});

describe("persistent administrator performance follow-up", () => {
  it("keeps both performances visible in tasks, dashboard and badges without a notification", async () => {
    const tasks = await pendingTasks({ id: "admin", role: "ADMIN" } as never);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      kind: "admin-performance-followup",
      id: "admin-performance-followup:p1",
      resolver: "link",
      href: "/samenwerkingen/same-collaboration#uren",
      tone: "attention",
      subtitle: "Wijkzorg · Week 37",
    });
    expect(tasks[1]?.subtitle).toBe("Wijkzorg · Ingediende prestatie");
    expect(selectDashboardTasks(tasks)).toHaveLength(2);
    const count = await pendingTaskCount("admin", "ADMIN");
    const badges = withActionCenterBadge(await navBadges("ADMIN", "admin"), count);
    expect(badges["/acties"]?.count).toBe(2);
    expect(badges["/admin/samenwerkingen"]).toEqual({ count: 2, tone: "attention" });
  });

  it("removes the follow-up and its badges when the current server queue is empty", async () => {
    state.rows = [];
    expect(await pendingTasks({ id: "admin", role: "ADMIN" } as never)).toEqual([]);
    const badges = withActionCenterBadge(
      await navBadges("ADMIN", "admin"),
      await pendingTaskCount("admin", "ADMIN"),
    );
    expect(badges["/acties"]).toBeUndefined();
    expect(badges["/admin/samenwerkingen"]).toBeUndefined();
  });

  it("does not expose the administrator queue through an unknown role", async () => {
    expect(await pendingTaskCount("other", "UNKNOWN")).toBe(0);
    expect(getAdminPerformanceEscalations).not.toHaveBeenCalled();
  });
});
