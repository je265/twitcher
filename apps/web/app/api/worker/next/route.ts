import { NextRequest, NextResponse } from "next/server";
import { streamQueue, videoProcessingQueue } from "@/lib/queue";
import { connection } from "@/lib/queue";

function auth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.WORKER_TOKEN}`;
}

export async function GET(req: NextRequest) {
  // Check environment variables first
  if (!process.env.WORKER_TOKEN) {
    console.error("❌ WORKER_TOKEN environment variable is missing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (!process.env.REDIS_URL) {
    console.error("❌ REDIS_URL environment variable is missing");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (!auth(req)) {
    console.log("❌ Worker authentication failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ Worker authenticated successfully");

  try {
    // Check Redis connection first
    try {
      const redisStatus = connection.status;
      console.log("🔍 Redis status:", redisStatus);
      
      if (redisStatus !== 'ready') {
        console.warn("⚠️ Redis not ready, attempting to connect...");
        await connection.connect();
        console.log("✅ Redis connected");
      }
    } catch (redisError) {
      console.error("❌ Redis connection failed:", redisError);
      return NextResponse.json({ error: "Redis connection failed" }, { status: 503 });
    }

    console.log("🔍 Checking for video processing jobs...");
    // First check for video processing jobs (higher priority)
    let waitingJobs = await videoProcessingQueue.getWaiting(0, 1);
    let job = waitingJobs.length > 0 ? waitingJobs[0] : null;
    
    if (job) {
      console.log("📹 Found video processing job:", job.id);
      
      // Remove the job from the queue to prevent duplicate processing
      try {
        await job.remove();
        console.log("✅ Removed video processing job from queue");
      } catch (removeError) {
        console.warn("⚠️ Failed to remove video processing job from queue:", removeError);
        // Continue anyway, the job will be processed
      }
      
      // Return video processing job data
      return NextResponse.json({
        type: "video_process",
        jobId: job.data.jobId,
        videoId: job.data.videoId,
        inputS3Key: job.data.inputS3Key,
        outputS3Key: job.data.outputS3Key,
      });
    }
    
    console.log("🔍 No video processing jobs, checking for streaming jobs...");
    // If no video processing jobs, check for streaming jobs
    waitingJobs = await streamQueue.getWaiting(0, 1);
    job = waitingJobs.length > 0 ? waitingJobs[0] : null;
    
    if (!job) {
      console.log("📭 No jobs available");
      // No jobs available
      return new NextResponse(null, { status: 204 });
    }

    console.log("🎥 Found streaming job:", job.id);
    
    // Remove the job from the queue to prevent duplicate processing
    try {
      await job.remove();
      console.log("✅ Removed streaming job from queue");
    } catch (removeError) {
      console.warn("⚠️ Failed to remove streaming job from queue:", removeError);
      // Continue anyway, the job will be processed
    }
    
    // Return streaming job data
    return NextResponse.json({
      type: "stream",
      streamId: job.data.streamId,
      jobId: job.data.jobId,
      s3Url: job.data.s3Url,
      s3Key: job.data.s3Key,  // Add S3 key for worker fallback access
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
    console.error("❌ Worker next job error:", error);
    return NextResponse.json({ error: "Failed to get next job" }, { status: 500 });
  }
}