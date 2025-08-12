import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

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

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // RUNNING, QUEUED, etc.

    const whereClause: any = {
      creatorId: user.userId,
    };

    if (status) {
      whereClause.status = status;
    } else {
      // By default, only show active streams (exclude ended/canceled streams)
      whereClause.status = {
        in: ["QUEUED", "RUNNING"]
      };
    }

    const streams = await prisma.stream.findMany({
      where: whereClause,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            s3Key: true,
            durationSec: true,
          },
        },
        twitchAccount: {
          select: {
            id: true,
            displayName: true,
            channelId: true,
            ingestServer: true,
          },
        },
        jobs: {
          select: {
            id: true,
            queueId: true,
            status: true,
            worker: true,
            logS3Key: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const streamsWithStats = streams.map(stream => ({
      id: stream.id,
      title: stream.title,
      category: stream.category,
      tags: stream.tags,
      status: stream.status,
      fps: stream.fps,
      videoBitrateK: stream.videoBitrateK,
      audioBitrateK: stream.audioBitrateK,
      loop: stream.loop,
      scheduledAt: stream.scheduledAt,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      createdAt: stream.createdAt,
      updatedAt: stream.updatedAt,
      video: stream.video,
      twitchAccount: stream.twitchAccount,
      job: stream.jobs[0] || null,
    }));

    // Group by status for summary
    const statusSummary = streams.reduce((acc, stream) => {
      acc[stream.status] = (acc[stream.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      streams: streamsWithStats,
      summary: {
        total: streams.length,
        byStatus: statusSummary,
        active: streams.filter(s => s.status === "RUNNING").length,
        queued: streams.filter(s => s.status === "QUEUED").length,
        completed: streams.filter(s => s.status === "FINISHED").length,
        failed: streams.filter(s => s.status === "FAILED").length,
      },
    });
  } catch (error) {
    console.error("Get stream status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stream status" },
      { status: 500 }
    );
  }
}
