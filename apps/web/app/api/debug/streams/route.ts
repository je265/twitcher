import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamQueue, connection } from "@/lib/queue";
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

    // Get stream status from database
    const streams = await prisma.stream.findMany({
      where: { creatorId: user.userId },
      include: {
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        twitchAccount: {
          select: {
            displayName: true,
            channelId: true,
            ingestServer: true,
          },
        },
        video: {
          select: {
            title: true,
            s3Key: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get queue status
    const queueStatus = {
      waiting: await streamQueue.getWaiting(),
      active: await streamQueue.getActive(),
      completed: await streamQueue.getCompleted(),
      failed: await streamQueue.getFailed(),
    };

    // Check Redis connection
    let redisStatus = "unknown";
    try {
      await connection.ping();
      redisStatus = "connected";
    } catch (error) {
      redisStatus = "disconnected";
    }

    return NextResponse.json({
      success: true,
      debug: {
        streams: streams.map(stream => ({
          id: stream.id,
          status: stream.status,
          title: stream.title,
          account: stream.twitchAccount.displayName,
          ingestServer: stream.twitchAccount.ingestServer,
          video: stream.video.title,
          videoKey: stream.video.s3Key,
          job: stream.jobs[0] || null,
          createdAt: stream.createdAt,
          startedAt: stream.startedAt,
          endedAt: stream.endedAt,
        })),
        queue: {
          waiting: queueStatus.waiting.length,
          active: queueStatus.active.length,
          completed: queueStatus.completed.length,
          failed: queueStatus.failed.length,
          jobs: [
            ...queueStatus.waiting.map(j => ({ ...j.data, status: 'waiting', id: j.id })),
            ...queueStatus.active.map(j => ({ ...j.data, status: 'active', id: j.id })),
          ],
        },
        infrastructure: {
          redis: redisStatus,
          database: "connected", // If we got here, DB is working
        },
        environment: {
          redisUrl: process.env.REDIS_URL,
          s3Endpoint: process.env.S3_ENDPOINT,
          workerToken: process.env.WORKER_TOKEN ? "set" : "missing",
        },
      },
    });
  } catch (error) {
    console.error("Debug streams error:", error);
    return NextResponse.json(
      { success: false, message: "Debug failed", error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
