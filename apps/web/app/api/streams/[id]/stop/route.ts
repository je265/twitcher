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

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const streamId = params.id;

    // Check if stream exists and belongs to user
    const stream = await prisma.stream.findFirst({
      where: {
        id: streamId,
        creatorId: user.userId,
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, message: "Stream not found" },
        { status: 404 }
      );
    }

    // Update stream status to CANCELED (this will remove it from active streams)
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        status: "CANCELED",
        endedAt: new Date(),
      },
    });

    // Also update any associated jobs
    await prisma.job.updateMany({
      where: { streamId: streamId },
      data: {
        status: "CANCELED",
        updatedAt: new Date(),
      },
    });

    console.log(`🛑 Stream ${streamId} stopped by user`);

    return NextResponse.json({
      success: true,
      message: "Stream stopped successfully",
    });
  } catch (error) {
    console.error("Stop stream error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to stop stream" },
      { status: 500 }
    );
  }
}
