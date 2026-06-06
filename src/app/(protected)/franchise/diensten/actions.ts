"use server";

import { revalidatePath } from "next/cache";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { hasTenant } from "@/lib/tenancy";
import { createFranchiseDienst } from "@/lib/franchise/dienst";

export type DienstState =
  | { ok: true; title: string }
  | { error: string; fieldErrors?: Record<string, string> }
  | undefined;

/** Franchiser zet een dienst (opdracht) uit namens een opdrachtgever, gekoppeld aan een afdeling. */
export async function createDienst(_prev: DienstState, formData: FormData): Promise<DienstState> {
  let actor;
  try {
    actor = await requireRole("FRANCHISER");
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: e.message };
    throw e;
  }
  if (!hasTenant(actor)) return { error: "Geen franchise gekoppeld." };

  const departmentId = String(formData.get("departmentId") ?? "");
  if (!departmentId) {
    return { error: "Controleer de ingevoerde gegevens.", fieldErrors: { departmentId: "Kies een afdeling." } }; // prettier-ignore
  }

  const res = await createFranchiseDienst({ actor, departmentId, formData });
  if ("error" in res) return res;

  revalidatePath("/franchise/diensten");
  revalidatePath(`/franchise/opdrachtgevers/${res.companyId}`);
  return { ok: true, title: res.title };
}
