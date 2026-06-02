import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { toCsv } from "@/lib/csv";
import {
  LEGAL_BASIS_LABEL,
  PROCESSING_REGISTER,
  RETENTION_SCHEDULE,
} from "@/lib/compliance/processing-register";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "ADMIN") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const registerHeader = [
    "Verwerking",
    "Doel",
    "Rechtsgrond",
    "Betrokkenen",
    "Gegevenscategorieën",
    "Gevoelig",
    "Ontvangers",
    "Bewaartermijn",
    "Beveiliging",
  ] as const;

  const registerRows: (readonly string[])[] = PROCESSING_REGISTER.map((a) => [
    a.name,
    a.purpose,
    LEGAL_BASIS_LABEL[a.legalBasis],
    a.dataSubjects.join(" | "),
    a.dataCategories.join(" | "),
    a.sensitive ? "Ja" : "Nee",
    a.recipients.join(" | "),
    a.retention,
    a.securityMeasures.join(" | "),
  ]);

  const retentionHeader = ["Gegevenscategorie", "Bewaartermijn", "Grondslag"] as const;

  const retentionRows: (readonly string[])[] = RETENTION_SCHEDULE.map((r) => [
    r.category,
    r.period,
    r.rationale,
  ]);

  const rows: (readonly string[])[] = [
    registerHeader,
    ...registerRows,
    // Lege scheidingsrij
    ["", "", "", "", "", "", "", "", ""],
    retentionHeader,
    ...retentionRows,
  ];

  const csv = toCsv(rows);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="verwerkingsregister-${date}.csv"`,
    },
  });
}
