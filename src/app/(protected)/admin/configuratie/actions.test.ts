import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  audit: vi.fn(),
  role: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/platform-config", () => ({
  getDbaThresholds: async () => ({
    durationSignalMonths: 6,
    durationStrongSignalMonths: 12,
    revenueConcentrationPct: 80,
  }),
  saveDbaThresholds: mocks.save,
}));
vi.mock("@/lib/audit", () => ({ audit: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { updateDbaThresholds } from "./actions";
const form = (first: number, strong: number) => {
  const data = new FormData();
  data.set("durationSignalMonths", String(first));
  data.set("durationStrongSignalMonths", String(strong));
  data.set("revenueConcentrationPct", "80");
  return data;
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockResolvedValue({ id: "synthetic-admin" });
});
it("rejects inverted thresholds without writes or audit", async () => {
  const result = await updateDbaThresholds(undefined, form(12, 6));
  expect(result?.fieldErrors?.durationStrongSignalMonths).toBeTruthy();
  expect(mocks.save).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
  expect(mocks.revalidate).not.toHaveBeenCalled();
});
it.each([
  [3, 9],
  [6, 6],
])("accepts ordered or equal thresholds %i/%i", async (first, strong) => {
  expect(await updateDbaThresholds(undefined, form(first, strong))).toEqual({ success: true });
  expect(mocks.role).toHaveBeenCalledWith("ADMIN");
  expect(mocks.save).toHaveBeenCalledWith(
    {
      durationSignalMonths: first,
      durationStrongSignalMonths: strong,
      revenueConcentrationPct: 80,
    },
    "synthetic-admin",
  );
  expect(mocks.audit).toHaveBeenCalledOnce();
  expect(mocks.revalidate).toHaveBeenCalledWith("/admin/configuratie");
});
