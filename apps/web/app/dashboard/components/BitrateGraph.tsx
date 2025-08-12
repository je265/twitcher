"use client";
import { useState, useEffect, useRef } from "react";

interface BitrateMetric {
  bitrate: number;
  timestamp: string;
  worker?: string;
}

interface BitrateStats {
  average: number;
  maximum: number;
  minimum: number;
  dataPoints: number;
  timeRange: number;
}

interface BitrateGraphProps {
  streamId: string;
  targetBitrate?: number;
  refreshInterval?: number;
}

export default function BitrateGraph({ 
  streamId, 
  targetBitrate = 2500, 
  refreshInterval = 10000 
}: BitrateGraphProps) {
  const [metrics, setMetrics] = useState<BitrateMetric[]>([]);
  const [stats, setStats] = useState<BitrateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [streamId, refreshInterval]);

  useEffect(() => {
    if (metrics.length > 0) {
      drawGraph();
    }
  }, [metrics, targetBitrate]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/metrics?minutes=30`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch bitrate metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Clear canvas with glass-morphism background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, width, height);

    // Find min/max for scaling
    const bitrates = metrics.map(m => m.bitrate);
    const maxBitrate = Math.max(...bitrates, targetBitrate * 1.2);
    const minBitrate = Math.max(0, Math.min(...bitrates) * 0.8);
    const range = maxBitrate - minBitrate;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (bitrate levels)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * graphHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Bitrate labels
      const bitrate = maxBitrate - (i / 5) * range;
      ctx.fillStyle = 'rgba(156, 163, 175, 0.8)'; // gray-400 with opacity
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(bitrate)}k`, padding - 5, y + 4);
    }

    // Vertical grid lines (time)
    const timeSteps = Math.min(6, metrics.length);
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (i / timeSteps) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw target bitrate line
    if (targetBitrate) {
      const targetY = padding + ((maxBitrate - targetBitrate) / range) * graphHeight;
      ctx.strokeStyle = '#fbbf24'; // yellow-400
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, targetY);
      ctx.lineTo(width - padding, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Target label
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.fillText(`Target: ${targetBitrate}k`, padding + 5, targetY - 5);
    }

    // Draw bitrate line
    if (metrics.length > 1) {
      ctx.strokeStyle = '#10b981'; // green-500
      ctx.lineWidth = 3;
      ctx.beginPath();

      metrics.forEach((metric, index) => {
        const x = padding + (index / (metrics.length - 1)) * graphWidth;
        const y = padding + ((maxBitrate - metric.bitrate) / range) * graphHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw data points
      ctx.fillStyle = '#10b981';
      metrics.forEach((metric, index) => {
        const x = padding + (index / (metrics.length - 1)) * graphWidth;
        const y = padding + ((maxBitrate - metric.bitrate) / range) * graphHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw time labels
    ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    if (metrics.length > 0) {
      // First timestamp
      const firstTime = new Date(metrics[0].timestamp).toLocaleTimeString([], { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      ctx.fillText(firstTime, padding, height - 5);
      
      // Last timestamp
      const lastTime = new Date(metrics[metrics.length - 1].timestamp).toLocaleTimeString([], { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      ctx.fillText(lastTime, width - padding, height - 5);
    }
  };

  const getHealthColor = () => {
    if (!stats || stats.dataPoints === 0) return 'text-gray-400';
    const efficiency = stats.average / targetBitrate;
    if (efficiency >= 0.9 && efficiency <= 1.1) return 'text-green-400';
    if (efficiency >= 0.7 && efficiency <= 1.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl">
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-white font-medium text-lg">Bitrate Performance</h4>
        <div className="flex items-center gap-4">
          {stats && (
            <div className="flex gap-6 text-sm">
              <span className={`${getHealthColor()} font-medium`}>
                Avg: {stats.average.toFixed(1)}k
              </span>
              <span className="text-gray-400">
                Max: {stats.maximum.toFixed(1)}k
              </span>
              <span className="text-gray-400">
                Min: {stats.minimum.toFixed(1)}k
              </span>
            </div>
          )}
        </div>
      </div>
      
      {metrics.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <div className="text-3xl mb-3">📊</div>
            <p className="text-lg mb-2">No bitrate data yet</p>
            <p className="text-sm text-gray-500">Data will appear once streaming starts</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <canvas 
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full h-48 rounded-lg"
            style={{ maxWidth: '100%', height: '200px' }}
          />
          
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <span>Last {stats?.timeRange || 30} minutes</span>
            <span>{stats?.dataPoints || 0} data points</span>
          </div>
        </div>
      )}
    </div>
  );
}
