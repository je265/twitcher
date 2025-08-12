import { NextRequest, NextResponse } from "next/server";
// Exchange code -> access_token (if you want to call Twitch APIs for titles/categories).
// Store channel id + display name to TwitchAccount; stream key itself is entered by user.

export async function GET(req: NextRequest) {
  // Handle ?code=... and ?state=...
  return NextResponse.redirect(new URL("/settings/twitch", req.url));
}
