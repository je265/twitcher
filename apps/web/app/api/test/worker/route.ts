import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Worker API is running",
    workerToken: process.env.WORKER_TOKEN ? "set" : "missing",
    redisUrl: process.env.REDIS_URL || "missing",
    timestamp: new Date().toISOString(),
  });
}
