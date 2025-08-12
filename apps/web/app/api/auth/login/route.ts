import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uuid } = body;

    if (!uuid) {
      return NextResponse.json(
        { success: false, message: "UUID is required" },
        { status: 400 }
      );
    }

    // Find user by UUID
    const user = await prisma.user.findUnique({
      where: { uuid },
      include: {
        twitchAccounts: {
          select: {
            id: true,
            displayName: true,
            channelId: true,
            createdAt: true,
          },
        },
        videos: {
          select: {
            id: true,
            title: true,
            s3Key: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            streams: true,
            videos: true,
            twitchAccounts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid UUID" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      { userId: user.id, uuid: user.uuid },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        createdAt: user.createdAt,
        twitchAccounts: user.twitchAccounts,
        videos: user.videos,
        stats: user._count,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
