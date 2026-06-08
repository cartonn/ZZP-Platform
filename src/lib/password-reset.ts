import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 uur

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export interface ResetTokenRecord {
  usedAt: Date | null;
  expiresAt: Date;
}

/** Pure check: is dit token-record nog geldig? */
export function isResetTokenValid(record: ResetTokenRecord, now: Date): boolean {
  if (record.usedAt !== null) return false;
  if (record.expiresAt <= now) return false;
  return true;
}

/**
 * Maakt een nieuw reset-token aan voor de gegeven gebruiker.
 * Verwijdert eventueel eerdere ongebruikte tokens (één per gebruiker).
 * Geeft de raw token terug (alleen in de e-mail te gebruiken; nooit opslaan/loggen).
 */
export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(raw);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
  ]);

  return raw;
}

/**
 * Valideert een raw token. Geeft userId + tokenId terug als het token geldig is,
 * of null als het onbekend, verlopen of al gebruikt is.
 */
export async function validateResetToken(
  raw: string,
): Promise<{ userId: string; tokenId: string } | null> {
  const tokenHash = hashResetToken(raw);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) return null;
  if (!isResetTokenValid(record, new Date())) return null;

  return { userId: record.userId, tokenId: record.id };
}

/**
 * Claimt een token atomair als "gebruikt" (eenmalig gebruik, race-proof). De conditionele
 * `updateMany` op `usedAt: null` is de bron van waarheid: bij twee gelijktijdige resets matcht maar
 * één request → die krijgt `true`, de ander `false`. Geeft `true` als deze aanroep de claim won.
 */
export async function consumeResetToken(tokenId: string): Promise<boolean> {
  const res = await prisma.passwordResetToken.updateMany({
    where: { id: tokenId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return res.count === 1;
}
