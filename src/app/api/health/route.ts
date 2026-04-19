import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

// Lightweight health check that also warms the Supabase Session Pooler.
// Designed for external uptime pings (cron-job.org, UptimeRobot) at ~5 min
// intervals to prevent cold-start latency on user-visible routes.
export async function GET() {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: "up", ms: Date.now() - start },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    // Prisma errors can embed connection strings/credentials — log server-side
    // only, return generic body to the public endpoint.
    console.error("[/api/health] db ping failed", err);
    return NextResponse.json(
      { ok: false, db: "down", ms: Date.now() - start },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
