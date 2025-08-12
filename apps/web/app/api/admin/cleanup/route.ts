import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { s3Client } from "@/lib/storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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

    const body = await req.json();
    const { action, videoId, olderThanDays } = body;

    if (action === "delete-video" && videoId) {
      // Delete a specific video
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          _count: {
            select: {
              streams: true
            }
          }
        }
      });

      if (!video) {
        return NextResponse.json(
          { success: false, message: "Video not found" },
          { status: 404 }
        );
      }

      // Check if video is being used by streams
      if (video._count.streams > 0) {
        return NextResponse.json({
          success: false,
          message: `Cannot delete video "${video.title}" because it's being used by ${video._count.streams} stream(s). Please delete the streams first.`,
          videoInUse: true,
          streamCount: video._count.streams
        }, { status: 400 });
      }

      // Delete from S3
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME || "twitcher-videos",
          Key: video.s3Key
        }));
        console.log(`🗑️ Deleted video from S3: ${video.s3Key}`);
      } catch (s3Error) {
        console.error(`❌ Failed to delete from S3: ${video.s3Key}`, s3Error);
      }

      // Delete from database
      await prisma.video.delete({
        where: { id: videoId }
      });

      return NextResponse.json({
        success: true,
        message: "Video deleted successfully",
        deletedVideo: video
      });

    } else if (action === "cleanup-old" && olderThanDays) {
      // Clean up videos older than X days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldVideos = await prisma.video.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        },
        include: {
          _count: {
            select: {
              streams: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      let deletedCount = 0;
      let errors = [];
      let skippedCount = 0;

      for (const video of oldVideos) {
        try {
          // Skip videos that are being used by streams
          if (video._count.streams > 0) {
            skippedCount++;
            console.log(`⏭️ Skipped video "${video.title}" - used by ${video._count.streams} stream(s)`);
            continue;
          }

          // Delete from S3
          await s3Client.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || "twitcher-videos",
            Key: video.s3Key
          }));
          
          // Delete from database
          await prisma.video.delete({
            where: { id: video.id }
          });
          
          deletedCount++;
          console.log(`🗑️ Deleted old video: ${video.title} (${video.s3Key})`);
        } catch (error: any) {
          errors.push({
            videoId: video.id,
            title: video.title,
            error: error.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleanup completed. Deleted ${deletedCount} videos, skipped ${skippedCount} videos in use.`,
        deletedCount,
        skippedCount,
        errors
      });

    } else if (action === "list-videos") {
      // List all videos with their sizes
      const videos = await prisma.video.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          s3Key: true,
          createdAt: true,
          processingStatus: true
        }
      });

      return NextResponse.json({
        success: true,
        videos,
        totalCount: videos.length
      });

    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action or missing parameters" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { success: false, message: "Cleanup failed", error: error.message },
      { status: 500 }
    );
  }
}
