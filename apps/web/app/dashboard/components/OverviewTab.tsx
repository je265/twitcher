"use client";
import { useState, useEffect } from "react";

interface OverviewStats {
  totalStreams: number;
  activeStreams: number;
  totalVideos: number;
  connectedAccounts: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function OverviewTab() {
  const [stats, setStats] = useState<OverviewStats>({
    totalStreams: 0,
    activeStreams: 0,
    totalVideos: 0,
    connectedAccounts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple APIs in parallel
      const [streamsRes, videosRes, accountsRes] = await Promise.all([
        fetch("/api/streams/status"),
        fetch("/api/videos"),
        fetch("/api/twitch/link")
      ]);

      let totalStreams = 0;
      let activeStreams = 0;
      let totalVideos = 0;
      let connectedAccounts = 0;
      const activities: RecentActivity[] = [];

      // Process streams data
      if (streamsRes.ok) {
        const streamsData = await streamsRes.json();
        const streams = streamsData.streams || [];
        totalStreams = streams.length;
        activeStreams = streams.filter((s: any) => s.status === "RUNNING" || s.status === "QUEUED").length;
        
        // Add recent stream activities
        streams.slice(0, 3).forEach((stream: any) => {
          activities.push({
            id: `stream-${stream.id}`,
            type: "stream",
            message: `Stream "${stream.title}" to ${stream.twitchAccount?.displayName || 'Unknown'} - ${stream.status}`,
            timestamp: stream.createdAt || stream.startedAt || new Date().toISOString()
          });
        });
      }

      // Process videos data
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        totalVideos = videosData.videos?.length || 0;
        
        // Add recent video activities
        const videos = videosData.videos || [];
        videos.slice(0, 2).forEach((video: any) => {
          activities.push({
            id: `video-${video.id}`,
            type: "video",
            message: `Video "${video.title}" uploaded`,
            timestamp: video.createdAt || new Date().toISOString()
          });
        });
      }

      // Process accounts data
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        connectedAccounts = accountsData.accounts?.length || 0;
        
        // Add recent account activities
        const accounts = accountsData.accounts || [];
        accounts.slice(0, 2).forEach((account: any) => {
          activities.push({
            id: `account-${account.id}`,
            type: "account",
            message: `Twitch account "${account.displayName}" connected`,
            timestamp: account.createdAt || new Date().toISOString()
          });
        });
      }

      // Sort activities by timestamp (newest first)
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      setStats({
        totalStreams,
        activeStreams,
        totalVideos,
        connectedAccounts
      });
      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error("Failed to fetch overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "stream": return "🔴";
      case "video": return "📹";
      case "account": return "👥";
      default: return "📋";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-medium text-white mb-2">Total Streams</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.totalStreams}</p>
          <p className="text-sm text-gray-400 mt-1">All time</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-white mb-2">Active Streams</h3>
          <p className="text-3xl font-bold text-green-400">{stats.activeStreams}</p>
          <p className="text-sm text-gray-400 mt-1">Currently running</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-white mb-2">Videos</h3>
          <p className="text-3xl font-bold text-blue-400">{stats.totalVideos}</p>
          <p className="text-sm text-gray-400 mt-1">Ready to stream</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-medium text-white mb-2">Connected Accounts</h3>
          <p className="text-3xl font-bold text-yellow-400">{stats.connectedAccounts}</p>
          <p className="text-sm text-gray-400 mt-1">Twitch channels</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.href = '/dashboard/streaming'}
          className="bg-red-600 hover:bg-red-700 p-6 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-2">🔴</div>
          <div className="text-lg font-medium text-white">Start Streaming</div>
          <div className="text-sm text-red-200">Begin multi-account broadcast</div>
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard/videos'}
          className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-2">📹</div>
          <div className="text-lg font-medium text-white">Upload Video</div>
          <div className="text-sm text-blue-200">Add content to stream</div>
        </button>
        
        <button
          onClick={() => window.location.href = '/dashboard/accounts'}
          className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg text-center transition-colors"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-lg font-medium text-white">Connect Account</div>
          <div className="text-sm text-purple-200">Add Twitch channels</div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Recent Activity</h3>
          <button
            onClick={fetchOverviewData}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            🔄 Refresh
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🚀</div>
            <p className="text-gray-400 mb-2">No recent activity</p>
            <p className="text-sm text-gray-500">Start by uploading a video or connecting a Twitch account</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.message}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
