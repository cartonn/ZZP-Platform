// Gedeelde tweede-factor-poort. Wordt gebruikt door zowel de login (`authorize-credentials.ts`) als
// de account-actie die 2FA uitschakelt (`account/tweestapsverificatie/actions.ts`), zodat er precies
// één, replay-veilige bron van waarheid is voor "bewijs dat je de tweede factor bezit". Retourneert
// alleen `true` bij een geldige TOTP-code of een ongebruikte herstelcode. Elke mislukking wordt
// geaudit (nooit de code/het geheim zelf in de metadata).

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { verifyTotpStep } from "@/lib/two-factor/totp";
import { decryptTwoFactorSecret } from "@/lib/two-factor/secret-crypto";
import { verifyRecoveryCode } from "@/lib/two-factor/recovery-codes";

/**
 * Verifieer de tweede factor van een account met 2FA ingeschakeld. Bedoeld als EXTRA horde ná een
 * geslaagde wachtwoordcheck. Geeft `true` bij een geldige, niet-hergebruikte TOTP-code of een
 * ongebruikte herstelcode; anders `false` (met een geauditeerde reden). `context` verrijkt de
 * audit-metadata zodat login- en disable-mislukkingen te onderscheiden zijn.
 */
export async function verifySecondFactor(
  user: { id: string; twoFactorSecret: string | null; twoFactorLastUsedStep: number | null },
  token: string | undefined,
  meta: { ipAddress: string | null; userAgent: string | null },
  audit_metadata: Record<string, string> = {},
): Promise<boolean> {
  const provided = token?.trim();
  if (!provided) {
    await audit({
      actorId: user.id,
      action: "TWO_FACTOR_CHALLENGE_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: { ...audit_metadata, reason: "missing" },
      ...meta,
    });
    return false;
  }

  // TOTP-pad: exact zes cijfers én een opgeslagen geheim. Decrypt-fout (bv. gemanipuleerde/roterende
  // sleutel) telt als een mislukte factor, niet als een crash.
  if (/^\d{6}$/.test(provided) && user.twoFactorSecret) {
    let step: number | null = null;
    try {
      step = verifyTotpStep(decryptTwoFactorSecret(user.twoFactorSecret), provided);
    } catch {
      step = null;
    }
    if (step !== null) {
      // Replay-preventie (RFC 6238 §5.2 / OWASP ASVS 2.8.4). Een geldige TOTP-code blijft ~30–90 s
      // geldig (±1 venster); zonder deze poort kan een afgekeken/gephishte/gerelayede code binnen dat
      // venster hergebruikt worden. We onthouden de hoogst-verbruikte step per account en accepteren
      // alleen een strikt nieuwere. De check-and-set is één atomaire, voorwaardelijke `updateMany`
      // (TOCTOU-veilig): twee parallelle challenges met dezelfde code → maar één wint (count===1); de
      // ander telt als replay.
      const claimed = await prisma.user.updateMany({
        where: {
          id: user.id,
          OR: [{ twoFactorLastUsedStep: null }, { twoFactorLastUsedStep: { lt: step } }],
        },
        data: { twoFactorLastUsedStep: step },
      });
      if (claimed.count === 1) return true;
      await audit({
        actorId: user.id,
        action: "TWO_FACTOR_CHALLENGE_FAILED",
        entityType: "User",
        entityId: user.id,
        metadata: { ...audit_metadata, reason: "replay" },
        ...meta,
      });
      return false;
    }
    await audit({
      actorId: user.id,
      action: "TWO_FACTOR_CHALLENGE_FAILED",
      entityType: "User",
      entityId: user.id,
      metadata: { ...audit_metadata, reason: "totp" },
      ...meta,
    });
    return false;
  }

  // Herstelcode-pad: vergelijk tegen elke ongebruikte hash; bij een match markeer die code als
  // verbruikt (eenmalig) en audit het gebruik.
  const codes = await prisma.twoFactorRecoveryCode.findMany({
    where: { userId: user.id, usedAt: null },
  });
  for (const code of codes) {
    if (await verifyRecoveryCode(provided, code.codeHash)) {
      await prisma.twoFactorRecoveryCode.update({
        where: { id: code.id },
        data: { usedAt: new Date() },
      });
      await audit({
        actorId: user.id,
        action: "TWO_FACTOR_RECOVERY_CODE_USED",
        entityType: "User",
        entityId: user.id,
        metadata: { ...audit_metadata },
        ...meta,
      });
      return true;
    }
  }

  await audit({
    actorId: user.id,
    action: "TWO_FACTOR_CHALLENGE_FAILED",
    entityType: "User",
    entityId: user.id,
    metadata: { ...audit_metadata, reason: "recovery" },
    ...meta,
  });
  return false;
}
