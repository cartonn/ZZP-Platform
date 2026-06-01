import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.COMMIT_SHA ?? "dev";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: true,
      commit: commitSha.slice(0, 7),
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        db: false,
        commit: commitSha.slice(0, 7),
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
