import { NextResponse } from "next/server";

export async function POST() {
  // Mock response for development without database
  console.log("Scheduler tick executed at:", new Date().toISOString());
  return NextResponse.json({ queued: 0 });
}
