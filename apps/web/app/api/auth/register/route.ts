import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    // Create a new user with auto-generated UUID
    const user = await prisma.user.create({
      data: {
        name: name || "Anonymous User",
      },
    });

    return NextResponse.json({
      success: true,
      uuid: user.uuid,
      message: "Account created! Please save your UUID - you'll need it to log in.",
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create account" },
      { status: 500 }
    );
  }
}
