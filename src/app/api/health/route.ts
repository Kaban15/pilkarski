import { NextResponse } from "next/server";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

// Lightweight health check that also warms the Supabase Session Pooler.
// Designed for external uptime pings (cron-job.org, UptimeRobot) at ~5 min
// intervals to prevent cold-start latency on user-visible routes.
// Returns 200 on DB reachable, 503 otherwise.
export async function GET() {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: "up", ms: Date.now() - start },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: "down", error: (err as Error).message, ms: Date.now() - start },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
