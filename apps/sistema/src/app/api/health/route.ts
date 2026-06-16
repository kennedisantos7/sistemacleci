import { NextResponse } from "next/server";
import { prisma } from "@cleci/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Healthcheck para o Coolify: 200 se o app e o banco respondem.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
