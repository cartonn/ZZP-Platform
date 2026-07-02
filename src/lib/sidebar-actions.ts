"use server";

import { cookies } from "next/headers";
import { SIDEBAR_COOKIE, type SidebarState } from "@/lib/sidebar";

/**
 * Onthoudt de zijbalk-voorkeur (uitgeklapt/ingeklapt) in een cookie (1 jaar). Server-side de
 * waarheid; de eerstvolgende render leest de cookie en zet meteen de juiste breedte (geen flits).
 */
export async function setSidebarState(state: SidebarState): Promise<void> {
  const value: SidebarState = state === "collapsed" ? "collapsed" : "expanded";
  (await cookies()).set(SIDEBAR_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
