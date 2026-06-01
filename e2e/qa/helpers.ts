import type { Page } from "@playwright/test";
import path from "node:path";

export const SHOTS = path.join("e2e", "qa", "screenshots");

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });

export const uniq = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", "demo1234");
  await page.getByRole("button", { name: "Inloggen" }).click();
  await page.waitForURL("**/dashboard");
}

export const ACCOUNTS = {
  admin: "admin@zzp-platform.local",
  freelancer: "zzp@zzp-platform.local",
  client: "opdrachtgever@zzp-platform.local",
  daan: "daan@zzp-platform.local",
  lisa: "lisa@zzp-platform.local",
  peter: "peter@zzp-platform.local",
} as const;
