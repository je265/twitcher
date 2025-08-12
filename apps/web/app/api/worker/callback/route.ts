import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamQueue } from "@/lib/queue";

function auth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.WORKER_TOKEN}`;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { streamId, jobId, status, startedAt, endedAt, worker, bitrate, timestamp } = body;

    console.log(`📡 Worker callback for stream ${streamId}:`, { status, worker, bitrate });

    // Update stream status
    if (status === "ACTIVE") {
      await prisma.stream.update({
        where: { id: streamId },
        data: {
          status: "RUNNING",
          startedAt: startedAt ? new Date(startedAt) : new Date(),
        },
      });
    } else if (status === "PROGRESS" && bitrate && timestamp) {
      // Store bitrate metrics for performance monitoring
      await prisma.streamMetrics.create({
        data: {
          streamId: streamId,
          bitrate: bitrate,
          timestamp: new Date(timestamp),
          worker: worker,
        },
      });
    } else if (status === "COMPLETED" || status === "FAILED") {
      await prisma.stream.update({
        where: { id: streamId },
        data: {
          status: status === "COMPLETED" ? "FINISHED" : "FAILED",
          endedAt: endedAt ? new Date(endedAt) : new Date(),
        },
      });
    }

    // Update job status (but not for PROGRESS updates - those are just metrics)
    if (jobId && status !== "PROGRESS") {
      await prisma.job.updateMany({
        where: { queueId: jobId },
        data: {
          status: status,
          worker: worker,
          updatedAt: new Date(),
        },
      });

      // Note: Jobs are already removed from queue when fetched by worker
      // BullMQ job lifecycle is handled by the custom getNextJob implementation
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Worker callback error:", error);
    return NextResponse.json({ error: "Failed to process callback" }, { status: 500 });
  }
}