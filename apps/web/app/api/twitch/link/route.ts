import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { encryptKey } from "@repo/shared";

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
    const { displayName, channelId, streamKey, ingestServer } = body;

    if (!displayName || !channelId || !streamKey) {
      return NextResponse.json(
        { success: false, message: "Display name, channel ID, and stream key are required" },
        { status: 400 }
      );
    }

    // Check if channel is already linked
    const existingAccount = await prisma.twitchAccount.findUnique({
      where: { channelId },
    });

    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: "This Twitch channel is already linked to an account" },
        { status: 409 }
      );
    }

    // Encrypt the stream key
    const { cipher, nonce, tag } = encryptKey(streamKey);

    // Create the Twitch account
    const twitchAccount = await prisma.twitchAccount.create({
      data: {
        userId: user.userId,
        displayName,
        channelId,
        streamKeyCipher: cipher,
        streamKeyNonce: nonce,
        streamKeyTag: tag,
        ingestServer: ingestServer || "live.twitch.tv/app",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Twitch account linked successfully",
      account: {
        id: twitchAccount.id,
        displayName: twitchAccount.displayName,
        channelId: twitchAccount.channelId,
        ingestServer: twitchAccount.ingestServer,
        createdAt: twitchAccount.createdAt,
      },
    });
  } catch (error) {
    console.error("Link Twitch account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to link Twitch account" },
      { status: 500 }
    );
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

    const twitchAccounts = await prisma.twitchAccount.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        displayName: true,
        channelId: true,
        ingestServer: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            streams: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      accounts: twitchAccounts,
    });
  } catch (error) {
    console.error("Get Twitch accounts error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch Twitch accounts" },
      { status: 500 }
    );
  }
}
