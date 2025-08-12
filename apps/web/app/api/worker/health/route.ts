import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  return req.headers.get("authorization") === `Bearer ${process.env.WORKER_TOKEN}`;
}

export async function GET(req: NextRequest) {
  // Check environment variables first
  if (!process.env.WORKER_TOKEN) {
    console.error("❌ WORKER_TOKEN environment variable is missing");
    return NextResponse.json({ 
      status: "error", 
      message: "WORKER_TOKEN environment variable is missing",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  if (!process.env.REDIS_URL) {
    console.error("❌ REDIS_URL environment variable is missing");
    return NextResponse.json({ 
      status: "error", 
      message: "REDIS_URL environment variable is missing",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  if (!auth(req)) {
    console.log("❌ Worker authentication failed");
    return NextResponse.json({ 
      status: "error", 
      message: "Unauthorized",
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }

  console.log("✅ Worker health check - authenticated successfully");

  return NextResponse.json({
    status: "healthy",
    message: "Worker endpoint is working correctly",
    timestamp: new Date().toISOString(),
    environment: {
      hasWorkerToken: !!process.env.WORKER_TOKEN,
      hasRedisUrl: !!process.env.REDIS_URL,
      hasS3Bucket: !!process.env.S3_BUCKET_NAME,
      hasS3Endpoint: !!process.env.S3_ENDPOINT,
      hasS3AccessKey: !!process.env.S3_ACCESS_KEY,
      hasS3SecretKey: !!process.env.S3_SECRET_KEY,
    }
  });
}
