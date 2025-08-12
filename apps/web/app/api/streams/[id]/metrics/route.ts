import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const streamId = params.id;
    const { searchParams } = new URL(req.url);
    const minutes = parseInt(searchParams.get('minutes') || '30');

    // Get metrics for the last N minutes
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const metrics = await prisma.streamMetrics.findMany({
      where: {
        streamId: streamId,
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        bitrate: true,
        timestamp: true,
        worker: true,
      },
    });

    // Calculate statistics
    const bitrates = metrics.map(m => m.bitrate);
    const avgBitrate = bitrates.length > 0 ? bitrates.reduce((a, b) => a + b, 0) / bitrates.length : 0;
    const maxBitrate = bitrates.length > 0 ? Math.max(...bitrates) : 0;
    const minBitrate = bitrates.length > 0 ? Math.min(...bitrates) : 0;

    return NextResponse.json({
      success: true,
      metrics: metrics,
      stats: {
        average: Math.round(avgBitrate * 100) / 100,
        maximum: Math.round(maxBitrate * 100) / 100,
        minimum: Math.round(minBitrate * 100) / 100,
        dataPoints: metrics.length,
        timeRange: minutes,
      },
    });
  } catch (error) {
    console.error("Stream metrics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stream metrics" },
      { status: 500 }
    );
  }
}
