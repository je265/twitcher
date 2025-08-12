import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { decryptKey } from "@repo/shared";

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
    const { twitchAccountId } = body;

    if (!twitchAccountId) {
      return NextResponse.json(
        { success: false, message: "Twitch account ID is required" },
        { status: 400 }
      );
    }

    // Get the Twitch account and decrypt stream key
    const twitchAccount = await prisma.twitchAccount.findFirst({
      where: {
        id: twitchAccountId,
        userId: user.userId,
      },
    });

    if (!twitchAccount) {
      return NextResponse.json(
        { success: false, message: "Twitch account not found" },
        { status: 404 }
      );
    }

    // Decrypt stream key
    const streamKey = decryptKey(
      twitchAccount.streamKeyCipher,
      twitchAccount.streamKeyNonce,
      twitchAccount.streamKeyTag
    );

    // Return RTMP connection details for testing
    return NextResponse.json({
      success: true,
      rtmpTest: {
        ingestServer: twitchAccount.ingestServer,
        streamKey: streamKey,
        rtmpUrl: `rtmp://${twitchAccount.ingestServer}/${streamKey}`,
        testCommand: [
          "ffmpeg",
          "-f", "lavfi",
          "-i", "testsrc2=size=1280x720:rate=30",
          "-f", "lavfi",
          "-i", "sine=frequency=1000",
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-b:v", "2500k",
          "-c:a", "aac",
          "-b:a", "160k",
          "-t", "10",
          "-f", "flv",
          `rtmp://${twitchAccount.ingestServer}/${streamKey}`
        ].join(" "),
        channelUrl: `https://twitch.tv/${twitchAccount.displayName}`,
        instructions: [
          "1. Install FFmpeg if not already installed",
          "2. Run the test command above in terminal",
          "3. Check your Twitch channel for the test stream",
          "4. Stream should show a test pattern with tone"
        ]
      },
    });
  } catch (error) {
    console.error("RTMP test error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate RTMP test" },
      { status: 500 }
    );
  }
}
