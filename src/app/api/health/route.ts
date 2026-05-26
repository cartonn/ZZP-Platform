import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Health-check voor load balancers/uptime-monitoring. Geen auth; lekt geen gevoelige data.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: true, time: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "degraded", db: false, time: new Date().toISOString() }, { status: 503 });
  }
}
