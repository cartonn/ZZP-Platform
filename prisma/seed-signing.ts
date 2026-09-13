import { type Actor } from "@/lib/authz";
import { signContract } from "@/lib/cascade/contract-commands";
import { loadSigningView } from "@/lib/signing-service";
import { computeCompliance } from "@/lib/matching";
import { complianceBlocksPlacement } from "@/lib/collaborations";
import { type CredentialStatus, type CredentialType } from "@/lib/enums";

/** Synthetic demo accounts traverse the same password, consent and immutable-evidence path.
 * Only the expected missing-credential scenario remains proposed; all other errors abort seed. */
export async function signSeedContract(
  client: Actor,
  freelancer: Actor,
  collaborationId: string,
  demoPassword: string,
): Promise<boolean> {
  if (process.env.SEED_DEMO !== "true") throw new Error("Demo-ondertekening is uitgeschakeld.");
  const initial = await loadSigningView(client, collaborationId);
  if (!initial) throw new Error("Demo-overeenkomst niet gevonden.");
  const compliance = computeCompliance(
    initial.col.job.credentialRequirements.map((r) => r.credentialType as CredentialType),
    initial.col.freelancer.credentials.map((c) => ({
      type: c.type as CredentialType,
      status: c.status as CredentialStatus,
      expiresAt: c.expiresAt,
    })),
  );
  if (complianceBlocksPlacement(compliance.status)) return false;
  for (const actor of [freelancer, client]) {
    const view = await loadSigningView(actor, collaborationId);
    if (!view?.party) throw new Error("Demo-ondertekenaar hoort niet bij deze overeenkomst.");
    const form = new FormData();
    form.set("documentHash", view.documentHash);
    form.set(
      "signerName",
      view.party === "FREELANCER" ? view.document.freelancer.name : view.document.client.name,
    );
    form.set("password", demoPassword);
    for (const confirmation of ["reviewed", "consent", "authority"]) form.set(confirmation, "on");
    await signContract(actor, collaborationId, form);
  }
  return true;
}
