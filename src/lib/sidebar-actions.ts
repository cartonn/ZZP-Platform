"use server";

import { cookies } from "next/headers";
import { SIDEBAR_COOKIE, SIDEBAR_COOKIE_MAX_AGE, type SidebarState } from "@/lib/sidebar";

/**
 * Onthoudt de zijbalk-voorkeur (uitgeklapt/ingeklapt) in een cookie (1 jaar). Server-side de
 * waarheid; de eerstvolgende render leest de cookie en zet meteen de juiste breedte (geen flits).
 */
export async function setSidebarState(state: SidebarState): Promise<void> {
  const value: SidebarState = state === "collapsed" ? "collapsed" : "expanded";
  (await cookies()).set(SIDEBAR_COOKIE, value, {
    path: "/",
    maxAge: SIDEBAR_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
