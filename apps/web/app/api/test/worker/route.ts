import { NextRequest, NextResponse } from "next/server";
import { videoProcessingQueue } from "@/lib/queue";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Testing worker configuration...");
    
    // Check Redis connection
    const redisStatus = videoProcessingQueue.client.status;
    console.log("🔌 Redis status:", redisStatus);
    
    // Check queue info
    const waitingJobs = await videoProcessingQueue.getWaiting(0, 0);
    const activeJobs = await videoProcessingQueue.getActive(0, 0);
    
    console.log("📊 Queue status:", {
      waiting: waitingJobs.length,
      active: activeJobs.length
    });
    
    return NextResponse.json({
      success: true,
      message: "Worker configuration is working",
      redis: redisStatus,
      queue: {
        waiting: waitingJobs.length,
        active: activeJobs.length
      }
    });
  } catch (error: any) {
    console.error("❌ Worker test failed:", error);
    return NextResponse.json({
      success: false,
      message: "Worker configuration test failed",
      error: error.message
    }, { status: 500 });
  }
}
