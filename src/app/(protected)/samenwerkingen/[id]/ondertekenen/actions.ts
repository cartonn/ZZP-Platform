"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/authz";
import { signContract } from "@/lib/cascade/contract-commands";
import { toSafeActionError } from "@/lib/safe-action-error";
import { type SigningFormState } from "@/components/contracts/signing-form";

export async function signAgreement(
  id: string,
  _previous: SigningFormState,
  formData: FormData,
): Promise<SigningFormState> {
  try {
    await signContract(await requireActor(), id, formData);
  } catch (error) {
    return { error: toSafeActionError(error) };
  }
  for (const path of [
    `/samenwerkingen/${id}/ondertekenen`,
    `/samenwerkingen/${id}`,
    "/samenwerkingen",
    "/acties",
    "/dashboard",
  ])
    revalidatePath(path);
  return { ok: true };
}
