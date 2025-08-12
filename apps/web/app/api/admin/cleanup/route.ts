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
          },
          streams: {
            where: {
              status: {
                in: ["DRAFT", "QUEUED", "RUNNING"]
              }
            },
            select: {
              id: true,
              status: true,
              title: true
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

      // Check if video is being used by ACTIVE streams only
      const activeStreams = video.streams.filter((s: any) => 
        ["DRAFT", "QUEUED", "RUNNING"].includes(s.status)
      );
      
      if (activeStreams.length > 0) {
        const statusCounts = activeStreams.reduce((acc: Record<string, number>, stream: any) => {
          acc[stream.status] = (acc[stream.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const statusText = Object.entries(statusCounts)
          .map(([status, count]) => `${count} ${status.toLowerCase()}`)
          .join(", ");
        
        return NextResponse.json({
          success: false,
          message: `Cannot delete video "${video.title}" because it has ${activeStreams.length} active stream(s): ${statusText}. Please delete or complete these streams first.`,
          videoInUse: true,
          activeStreamCount: activeStreams.length,
          totalStreamCount: video._count.streams,
          activeStreams: activeStreams
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
          },
          streams: {
            where: {
              status: {
                in: ["DRAFT", "QUEUED", "RUNNING"]
              }
            },
            select: {
              id: true,
              status: true
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
          // Skip videos that have active streams
          const activeStreams = video.streams.filter((s: any) => 
            ["DRAFT", "QUEUED", "RUNNING"].includes(s.status)
          );
          
          if (activeStreams.length > 0) {
            skippedCount++;
            console.log(`⏭️ Skipped video "${video.title}" - has ${activeStreams.length} active stream(s) out of ${video._count.streams} total`);
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
        message: `Cleanup completed. Deleted ${deletedCount} videos, skipped ${skippedCount} videos with active streams.`,
        deletedCount,
        skippedCount,
        errors
      });

    } else if (action === "list-videos") {
      // List all videos with their stream counts
      const videos = await prisma.video.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          _count: {
            select: {
              streams: true
            }
          },
          streams: {
            where: {
              status: {
                in: ["DRAFT", "QUEUED", "RUNNING"]
              }
            },
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      // Add computed fields for better display
      const videosWithActiveCounts = videos.map((video: any) => ({
        ...video,
        activeStreamCount: video.streams.length,
        canDelete: video.streams.length === 0
      }));

      return NextResponse.json({
        success: true,
        videos: videosWithActiveCounts,
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
