import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { uploadVideoToS3, ensureBucketExists } from "@/lib/storage";

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

    // Generate unique S3 key
    const timestamp = Date.now();
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileExtension = file.name.split(".").pop();
    const s3Key = `videos/${user.userId}/${timestamp}_${sanitizedTitle}.${fileExtension}`;

    // Ensure bucket exists and upload to S3/MinIO
    console.log(`📤 Uploading video to S3: ${s3Key}`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Ensure bucket exists before uploading
      await ensureBucketExists();
      
      // Upload the file
      await uploadVideoToS3(s3Key, buffer, file.type);
      console.log(`✅ Successfully uploaded ${buffer.length} bytes to ${s3Key}`);
    } catch (uploadError) {
      console.error("❌ Failed to upload video to S3:", uploadError);
      return NextResponse.json(
        { success: false, message: "Failed to upload video file" },
        { status: 500 }
      );
    }

    // Store video metadata in database
    const video = await prisma.video.create({
      data: {
        uploaderId: user.userId,
        title,
        description,
        s3Key,
        // We'd normally get these from video analysis
        durationSec: null,
        width: null,
        height: null,
        codecVideo: null,
        codecAudio: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        s3Key: video.s3Key,
        fileSize: buffer.length,
        contentType: file.type,
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
