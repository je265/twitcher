import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string }}) {
  // Mock data for development without database
  const mockStream = {
    id: params.id,
    title: "Sample Stream",
    status: "DRAFT",
    fps: 30,
    videoBitrateK: 2500,
    audioBitrateK: 160,
    loop: false,
    video: { title: "Sample Video", s3Key: "sample-video.mp4" },
    twitchAccount: { displayName: "Sample Channel", ingestServer: "live.twitch.tv/app" },
    jobs: []
  };
  
  return NextResponse.json(mockStream);
}
