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
    const { streamId, stopAll } = body;

    if (stopAll) {
      // Stop all active streams for this user
      const activeStreams = await prisma.stream.findMany({
        where: {
          creatorId: user.userId,
          status: { in: ["QUEUED", "RUNNING"] }
        }
      });

      if (activeStreams.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No active streams to stop",
          stoppedCount: 0,
        });
      }

      // Update all active streams
      await prisma.stream.updateMany({
        where: {
          creatorId: user.userId,
          status: { in: ["QUEUED", "RUNNING"] }
        },
        data: {
          status: "CANCELED",
          endedAt: new Date(),
        },
      });

      // Update all associated jobs
      await prisma.job.updateMany({
        where: {
          streamId: { in: activeStreams.map(s => s.id) }
        },
        data: {
          status: "CANCELED",
          updatedAt: new Date(),
        },
      });

      console.log(`🛑 Stopped ${activeStreams.length} active streams for user ${user.userId}`);

      return NextResponse.json({
        success: true,
        message: `Stopped ${activeStreams.length} active stream(s)`,
        stoppedCount: activeStreams.length,
      });
    }

    if (!streamId) {
      return NextResponse.json(
        { success: false, message: "Stream ID is required" },
        { status: 400 }
      );
    }

    // Verify stream ownership and get current status
    const stream = await prisma.stream.findFirst({
      where: {
        id: streamId,
        creatorId: user.userId,
      },
      include: {
        twitchAccount: {
          select: {
            displayName: true,
            channelId: true,
          },
        },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, message: "Stream not found or access denied" },
        { status: 404 }
      );
    }

    if (stream.status === "FINISHED" || stream.status === "CANCELED" || stream.status === "FAILED") {
      return NextResponse.json(
        { success: false, message: "Stream is already stopped" },
        { status: 400 }
      );
    }

    // Update stream status
    const updatedStream = await prisma.stream.update({
      where: { id: streamId },
      data: {
        status: "CANCELED",
        endedAt: new Date(),
      },
    });

    // Update job status if exists
    if (stream.jobs.length > 0) {
      await prisma.job.update({
        where: { id: stream.jobs[0].id },
        data: { status: "CANCELED" },
      });
    }

    // In production, this would signal the worker to stop the FFmpeg process
    console.log(`Stopping RTMP stream ${streamId} for account ${stream.twitchAccount.displayName}`);

    return NextResponse.json({
      success: true,
      message: `Stream to ${stream.twitchAccount.displayName} stopped successfully`,
      streamId: streamId,
      status: "CANCELED",
    });
  } catch (error) {
    console.error("Stop stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to stop stream" },
      { status: 500 }
    );
  }
}
