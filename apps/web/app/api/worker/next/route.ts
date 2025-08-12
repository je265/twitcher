import { NextRequest, NextResponse } from "next/server";
import { streamQueue } from "@/lib/queue";

function auth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.WORKER_TOKEN}`;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get next job from queue
    const job = await streamQueue.getNextJob("stream-worker");
    
    if (!job) {
      // No jobs available
      return new NextResponse(null, { status: 204 });
    }

    // Return job data for worker
    return NextResponse.json({
      streamId: job.data.streamId,
      jobId: job.data.jobId,
      s3Url: job.data.s3Url,
      ingest: job.data.ingest,
      streamKey: job.data.streamKey,
      fps: job.data.fps,
      vb: job.data.vb,
      ab: job.data.ab,
      loop: job.data.loop,
      title: job.data.title,
      category: job.data.category,
    });
  } catch (error) {
    console.error("Worker next job error:", error);
    return NextResponse.json({ error: "Failed to get next job" }, { status: 500 });
  }
}