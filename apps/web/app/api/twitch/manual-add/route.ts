import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptKey } from "@repo/shared";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName, userId, streamKey, ingestServer } = await req.json();

    // Validate required fields
    if (!displayName || !userId || !streamKey) {
      return NextResponse.json(
        { error: "Missing required fields: displayName, userId, streamKey" },
        { status: 400 }
      );
    }

    // Validate userId is numeric
    if (!/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: "User ID must be numeric" },
        { status: 400 }
      );
    }

    // Check if account already exists
    const existingAccount = await prisma.twitchAccount.findFirst({
      where: {
        OR: [
          { channelId: userId },
          { displayName: displayName }
        ]
      }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Account with this User ID or Display Name already exists" },
        { status: 409 }
      );
    }

    // Encrypt the stream key
    const { cipher, nonce, tag } = encryptKey(streamKey);

    // Create the Twitch account
    const twitchAccount = await prisma.twitchAccount.create({
      data: {
        userId: user.userId,
        channelId: userId,
        displayName: displayName,
        ingestServer: ingestServer || "live.twitch.tv/app",
        streamKeyCipher: cipher,
        streamKeyNonce: nonce,
        streamKeyTag: tag,
      },
    });

    console.log(`✅ Manually added Twitch account: ${displayName} (${userId})`);

    return NextResponse.json({
      success: true,
      account: {
        id: twitchAccount.id,
        displayName: twitchAccount.displayName,
        channelId: twitchAccount.channelId,
        ingestServer: twitchAccount.ingestServer,
      }
    });

  } catch (error) {
    console.error("Manual Twitch account addition error:", error);
    return NextResponse.json(
      { error: "Failed to add account" },
      { status: 500 }
    );
  }
}
