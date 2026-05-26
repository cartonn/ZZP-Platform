// Documenttoegang. Documenten zijn standaard privé (CLAUDE.md regel 4): alleen de
// eigenaar en admin mogen een document downloaden. Server-side afgedwongen.

import { type Actor } from "@/lib/authz";
import { type CredentialType, type DocumentKind } from "@/lib/enums";

/** Mag `viewer` dit document downloaden? Alleen eigenaar of admin. */
export function canAccessDocument(viewer: Actor | null | undefined, ownerId: string): boolean {
  if (!viewer) return false;
  return viewer.id === ownerId || viewer.role === "ADMIN";
}

/** Het passende DocumentKind voor een credential-type (voor nette categorisering). */
export function documentKindForCredential(type: CredentialType): DocumentKind {
  switch (type) {
    case "VOG":
      return "VOG";
    case "INSURANCE":
      return "INSURANCE";
    default:
      return "CREDENTIAL";
  }
}
