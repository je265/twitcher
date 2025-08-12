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

async function getTwitchUserStats(channelId: string, accessToken?: string) {
  try {
    if (!accessToken) {
      return {
        followers: "N/A",
        views: "N/A",
        status: "offline",
        error: "No access token",
      };
    }

    // Get user info
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?id=${channelId}`, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID || "",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await userResponse.json();
    const user = userData.data[0];

    // Get follower count
    const followersResponse = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channelId}`, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID || "",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    let followerCount = "N/A";
    if (followersResponse.ok) {
      const followersData = await followersResponse.json();
      followerCount = followersData.total?.toString() || "0";
    }

    // Check if live
    const streamResponse = await fetch(`https://api.twitch.tv/helix/streams?user_id=${channelId}`, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID || "",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    let isLive = false;
    if (streamResponse.ok) {
      const streamData = await streamResponse.json();
      isLive = streamData.data && streamData.data.length > 0;
    }

    return {
      followers: followerCount,
      views: user?.view_count?.toString() || "N/A",
      status: isLive ? "live" : "offline",
      profileImage: user?.profile_image_url,
      description: user?.description,
    };
  } catch (error) {
    console.error("Twitch API error:", error);
    return {
      followers: "Error",
      views: "Error", 
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
    const twitchAccountId = searchParams.get("accountId");

    if (twitchAccountId) {
      // Get stats for specific account
      const twitchAccount = await prisma.twitchAccount.findFirst({
        where: {
          id: twitchAccountId,
          userId: user.userId,
        },
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  provider: "twitch",
                },
              },
            },
          },
        },
      });

      if (!twitchAccount) {
        return NextResponse.json(
          { success: false, message: "Twitch account not found" },
          { status: 404 }
        );
      }

      const accessToken = twitchAccount.user.accounts[0]?.access_token || undefined;
      const stats = await getTwitchUserStats(twitchAccount.channelId, accessToken);

      return NextResponse.json({
        success: true,
        account: {
          id: twitchAccount.id,
          displayName: twitchAccount.displayName,
          channelId: twitchAccount.channelId,
          ...stats,
        },
      });
    } else {
      // Get stats for all accounts
      const twitchAccounts = await prisma.twitchAccount.findMany({
        where: { userId: user.userId },
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  provider: "twitch",
                },
              },
            },
          },
        },
      });

      const accountsWithStats = await Promise.all(
        twitchAccounts.map(async (account) => {
          const accessToken = account.user.accounts[0]?.access_token || undefined;
          const stats = await getTwitchUserStats(account.channelId, accessToken);
          
          return {
            id: account.id,
            displayName: account.displayName,
            channelId: account.channelId,
            createdAt: account.createdAt,
            ...stats,
          };
        })
      );

      return NextResponse.json({
        success: true,
        accounts: accountsWithStats,
      });
    }
  } catch (error) {
    console.error("Get Twitch stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch Twitch stats" },
      { status: 500 }
    );
  }
}
