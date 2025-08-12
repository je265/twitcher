import { NextRequest, NextResponse } from "next/server";
import { ensureBucketExists } from "@/lib/storage";

export async function GET(req: NextRequest) {
  try {
    console.log("🧪 Testing S3 configuration...");
    
    // Log environment variables (without sensitive data)
    console.log("🔧 Environment check:", {
      S3_ENDPOINT: process.env.S3_ENDPOINT ? "SET" : "NOT SET",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ? "SET" : "NOT SET", 
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ? "SET" : "NOT SET",
      S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "NOT SET",
      S3_REGION: process.env.S3_REGION || "NOT SET"
    });
    
    // Test bucket connection
    await ensureBucketExists();
    
    return NextResponse.json({
      success: true,
      message: "S3 configuration is working",
      config: {
        endpoint: process.env.S3_ENDPOINT ? "CONFIGURED" : "MISSING",
        bucket: process.env.S3_BUCKET_NAME || "MISSING",
        region: process.env.S3_REGION || "MISSING"
      }
    });
  } catch (error: any) {
    console.error("❌ S3 test failed:", error);
    return NextResponse.json({
      success: false,
      message: "S3 configuration test failed",
      error: error.message,
      details: {
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      }
    }, { status: 500 });
  }
}
