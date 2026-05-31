import { NextResponse } from "next/server";
import { requireActor } from "@/lib/authz";
import { getDienstenForFreelancer, exportDienstenCsv } from "@/lib/diensten";

export async function GET() {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") {
    return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });
  }

  const diensten = await getDienstenForFreelancer(actor.id);
  const csv = exportDienstenCsv(diensten);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diensten-${date}.csv"`,
    },
  });
}
