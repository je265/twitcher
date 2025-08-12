import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { uploadVideoToS3, ensureBucketExists } from "@/lib/storage";
import { videoProcessingQueue } from "@/lib/queue";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

async function getUserFromToken(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; uuid: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || "";

    if (!file || !title) {
      return NextResponse.json(
        { success: false, message: "File and title are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "video/mp4",
      "video/webm", 
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv"
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Unsupported video format" },
        { status: 400 }
      );
    }

    // Generate unique S3 keys
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileExtension = file.name.split(".").pop();
    const originalS3Key = `videos/${user.userId}/original/${timestamp}_${sanitizedTitle}.${fileExtension}`;
    const processedS3Key = `videos/${user.userId}/processed/${timestamp}_${sanitizedTitle}.mp4`;

    // Ensure bucket exists and upload original file to S3
    console.log(`📤 Uploading original video to S3: ${originalS3Key}`);
    console.log(`🔧 S3 Config: endpoint=${process.env.S3_ENDPOINT}, bucket=${process.env.S3_BUCKET_NAME}, region=${process.env.S3_REGION}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Ensure bucket exists before uploading
      console.log(`🪣 Ensuring bucket exists...`);
      await ensureBucketExists();
      console.log(`✅ Bucket check completed`);
      
      // Upload the original file
      console.log(`📤 Starting S3 upload...`);
      await uploadVideoToS3(originalS3Key, buffer, file.type);
      console.log(`✅ Successfully uploaded ${buffer.length} bytes to ${originalS3Key}`);
    } catch (uploadError: any) {
      console.error("❌ Failed to upload original video to S3:", uploadError);
      console.error("❌ Error details:", {
        message: uploadError.message,
        stack: uploadError.stack,
        name: uploadError.name
      });
      return NextResponse.json(
        { success: false, message: "Failed to upload video file", error: uploadError.message },
        { status: 500 }
      );
    }

    // Store video metadata in database with PENDING status
    const video = await prisma.video.create({
      data: {
        uploaderId: user.userId,
        title,
        description,
        s3Key: originalS3Key, // Store original S3 key initially
        processingStatus: "PENDING",
        // We'll get these from video analysis after processing
        durationSec: null,
        width: null,
        height: null,
        codecVideo: null,
        codecAudio: null,
      },
    });

    // Queue video processing job
    const jobId = `video-${video.id}-${timestamp}`;
    await videoProcessingQueue.add(
      "process-video",
      {
        jobId,
        videoId: video.id,
        inputS3Key: originalS3Key,
        outputS3Key: processedS3Key,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    console.log(`🔄 Queued video processing job: ${jobId}`);

    return NextResponse.json({
      success: true,
      message: "Video uploaded and queued for processing",
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        s3Key: video.s3Key,
        fileSize: buffer.length,
        contentType: file.type,
        processingStatus: "PENDING",
        createdAt: video.createdAt,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
