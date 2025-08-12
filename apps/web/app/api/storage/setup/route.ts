import { NextRequest, NextResponse } from "next/server";
import { ensureBucketExists } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    console.log("🔧 Setting up MinIO storage...");
    await ensureBucketExists();
    
    return NextResponse.json({
      success: true,
      message: "Storage setup completed successfully",
    });
  } catch (error) {
    console.error("❌ Storage setup failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to setup storage",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Just check if bucket exists without creating it
    await ensureBucketExists();
    
    return NextResponse.json({
      success: true,
      message: "Storage is properly configured",
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Storage configuration issue",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
