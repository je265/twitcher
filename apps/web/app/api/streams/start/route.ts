import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { decryptKey } from "@repo/shared";
import { streamQueue } from "@/lib/queue";
import { getSignedUrlForVideo } from "@/lib/storage";

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
    const { videoId, twitchAccountIds, title, category, tags, fps, videoBitrateK, audioBitrateK, loop } = body;

    if (!videoId || !twitchAccountIds || twitchAccountIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Video ID and at least one Twitch account are required" },
        { status: 400 }
      );
    }

    // Verify video ownership
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        uploaderId: user.userId,
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, message: "Video not found or access denied" },
        { status: 404 }
      );
    }

    // Verify Twitch account ownership and get encrypted stream keys
    const twitchAccounts = await prisma.twitchAccount.findMany({
      where: {
        id: { in: twitchAccountIds },
        userId: user.userId,
      },
    });

    if (twitchAccounts.length !== twitchAccountIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more Twitch accounts not found or access denied" },
        { status: 404 }
      );
    }

    // Create stream records for each account
    const streams = await Promise.all(
      twitchAccounts.map(async (account) => {
        // Decrypt stream key for RTMP
        const streamKey = decryptKey(
          account.streamKeyCipher,
          account.streamKeyNonce,
          account.streamKeyTag
        );

        const stream = await prisma.stream.create({
          data: {
            creatorId: user.userId,
            twitchAccountId: account.id,
            videoId: video.id,
            title: title || video.title,
            category: category || "Just Chatting",
            tags: tags || [],
            fps: fps || 30,
            videoBitrateK: videoBitrateK || 2500,
            audioBitrateK: audioBitrateK || 160,
            loop: loop || false,
            status: "QUEUED",
            scheduledAt: new Date(),
          },
        });

        // Get presigned URL for video
        const s3Url = await getSignedUrlForVideo(video.s3Key);
        
        // Create BullMQ job for FFmpeg worker
        const queueJob = await streamQueue.add(`stream-${stream.id}`, {
          streamId: stream.id,
          jobId: `job_${stream.id}_${Date.now()}`,
          s3Url: s3Url,
          s3Key: video.s3Key,  // Add S3 key for fallback access
          ingest: account.ingestServer,
          streamKey: streamKey,
          fps: stream.fps,
          vb: stream.videoBitrateK,
          ab: stream.audioBitrateK,
          loop: stream.loop,
          title: stream.title,
          category: stream.category,
        });

        // Create job record in database
        const job = await prisma.job.create({
          data: {
            streamId: stream.id,
            queueId: queueJob.id || `stream_${stream.id}_${Date.now()}`,
            status: "WAITING",
          },
        });

        console.log(`🚀 RTMP stream queued for ${account.displayName}:`, {
          streamId: stream.id,
          jobId: queueJob.id,
          ingestServer: account.ingestServer,
          title: stream.title,
          settings: `${stream.fps}fps, ${stream.videoBitrateK}k video, ${stream.audioBitrateK}k audio`,
          loop: stream.loop,
        });

        return {
          stream,
          job,
          account: {
            id: account.id,
            displayName: account.displayName,
            channelId: account.channelId,
            ingestServer: account.ingestServer,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: `Started streaming to ${streams.length} account(s)`,
      streams: streams.map(({ stream, account }) => ({
        id: stream.id,
        title: stream.title,
        status: "RUNNING",
        account: {
          id: account.id,
          displayName: account.displayName,
          channelId: account.channelId,
        },
        settings: {
          fps: stream.fps,
          videoBitrate: stream.videoBitrateK,
          audioBitrate: stream.audioBitrateK,
          loop: stream.loop,
        },
        startedAt: stream.startedAt,
      })),
    });
  } catch (error) {
    console.error("Start stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to start streams" },
      { status: 500 }
    );
  }
}