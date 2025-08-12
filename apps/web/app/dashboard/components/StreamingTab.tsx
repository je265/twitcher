"use client";
import { useState, useEffect } from "react";
import BitrateGraph from "./BitrateGraph";

interface TwitchAccount {
  id: string;
  displayName: string;
  channelId: string;
  ingestServer: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  s3Key: string;
  durationSec?: number;
  width?: number;
  height?: number;
}

interface StreamConfig {
  videoId: string;
  twitchAccountIds: string[];
  title: string;
  category: string;
  tags: string[];
  fps: number;
  videoBitrateK: number;
  audioBitrateK: number;
  loop: boolean;
}

interface ActiveStream {
  id: string;
  title: string;
  status: string;
  twitchAccount: {
    displayName: string;
  };
  video: {
    title: string;
  };
  startedAt?: string;
}

export default function StreamingTab() {
  const [twitchAccounts, setTwitchAccounts] = useState<TwitchAccount[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamingLoading, setStreamingLoading] = useState(false);
  
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    videoId: "",
    twitchAccountIds: [],
    title: "",
    category: "Just Chatting",
    tags: [],
    fps: 30,
    videoBitrateK: 2500,
    audioBitrateK: 160,
    loop: false,
  });

  const categories = [
    "Just Chatting", "Games + Demos", "Music", "Art", "Makers & Crafting",
    "Science & Technology", "Sports", "Travel & Outdoors", "Food & Drink",
    "Beauty & Body Art", "ASMR", "Talk Shows & Podcasts"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, videosRes, streamsRes] = await Promise.all([
        fetch("/api/twitch/link"),
        fetch("/api/videos"),
        fetch("/api/streams/status")
      ]);

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setTwitchAccounts(accountsData.accounts || []);
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);
      }

      if (streamsRes.ok) {
        const streamsData = await streamsRes.json();
        setActiveStreams(streamsData.streams || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setStreamConfig(prev => ({
      ...prev,
      twitchAccountIds: prev.twitchAccountIds.includes(accountId)
        ? prev.twitchAccountIds.filter(id => id !== accountId)
        : [...prev.twitchAccountIds, accountId]
    }));
  };

  const handleStartStreaming = async () => {
    if (!streamConfig.videoId || streamConfig.twitchAccountIds.length === 0) {
      alert("Please select a video and at least one Twitch account");
      return;
    }

    setStreamingLoading(true);
    try {
      const response = await fetch("/api/streams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(streamConfig),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully started streaming to ${data.streams.length} account(s)!`);
        fetchData(); // Refresh data
        // Reset form
        setStreamConfig({
          videoId: "",
          twitchAccountIds: [],
          title: "",
          category: "Just Chatting",
          tags: [],
          fps: 30,
          videoBitrateK: 2500,
          audioBitrateK: 160,
          loop: false,
        });
      } else {
        alert(data.message || "Failed to start streaming");
      }
    } catch (error) {
      alert("Failed to start streaming");
    } finally {
      setStreamingLoading(false);
    }
  };

  const handleStopStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/stop`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (data.success) {
        alert("Stream stopped successfully");
        fetchData(); // Refresh data
      } else {
        alert(`Failed to stop stream: ${data.message}`);
      }
    } catch (error) {
      alert("Failed to stop stream");
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
      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-4">Active Streams ({activeStreams.length})</h3>
            <div className="space-y-6">
              {activeStreams.map((stream) => (
                <div key={stream.id} className="bg-gray-700 p-4 rounded-lg">
                  {/* Stream Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-white font-medium">{stream.title}</span>
                        <span className="text-sm text-gray-400">→ {stream.twitchAccount.displayName}</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Video: {stream.video.title} • Status: {stream.status}
                        {stream.startedAt && ` • Started: ${new Date(stream.startedAt).toLocaleTimeString()}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStopStream(stream.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      ⏹️ Stop Stream
                    </button>
                  </div>
                  
                  {/* Bitrate Graph */}
                  {stream.status === 'RUNNING' && (
                    <BitrateGraph 
                      streamId={stream.id}
                      targetBitrate={2500} // You can get this from stream settings
                      refreshInterval={15000} // Refresh every 15 seconds
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Start New Stream */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Start Multi-Account Stream</h3>
        <p className="text-gray-400 mb-6">
          Stream the same video to multiple Twitch accounts simultaneously with different titles and settings.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Video & Account Selection */}
          <div className="space-y-6">
            {/* Video Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Video <span className="text-red-400">*</span>
              </label>
              <select
                value={streamConfig.videoId}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, videoId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Choose a video...</option>
                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title} {video.durationSec && `(${Math.floor(video.durationSec / 60)}m)`}
                  </option>
                ))}
              </select>
              {videos.length === 0 && (
                <p className="text-sm text-yellow-400 mt-1">
                  No videos available. Upload videos first in the Videos tab.
                </p>
              )}
            </div>

            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Twitch Accounts <span className="text-red-400">*</span>
              </label>
              {twitchAccounts.length === 0 ? (
                <div className="bg-yellow-900/20 border border-yellow-800 p-4 rounded-lg">
                  <p className="text-yellow-400">
                    No Twitch accounts connected. Connect accounts first in the Accounts tab.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-700 rounded-lg p-3">
                  {twitchAccounts.map((account) => (
                    <label key={account.id} className="flex items-center gap-3 p-2 hover:bg-gray-600 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={streamConfig.twitchAccountIds.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-white font-medium">{account.displayName}</span>
                        <span className="text-sm text-gray-400 ml-2">({account.channelId})</span>
                      </div>
                      <span className="text-xs text-gray-500">{account.ingestServer}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Selected: {streamConfig.twitchAccountIds.length} account(s)
              </p>
            </div>
          </div>

          {/* Right Column - Stream Settings */}
          <div className="space-y-6">
            {/* Stream Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stream Title
              </label>
              <input
                type="text"
                value={streamConfig.title}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="Will use video title if empty"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={streamConfig.category}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">FPS</label>
                <select
                  value={streamConfig.fps}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, fps: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value={24}>24 FPS</option>
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Video Bitrate</label>
                <select
                  value={streamConfig.videoBitrateK}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, videoBitrateK: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value={1000}>1000 kbps</option>
                  <option value={2500}>2500 kbps</option>
                  <option value={4000}>4000 kbps</option>
                  <option value={6000}>6000 kbps</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Audio Bitrate</label>
                <select
                  value={streamConfig.audioBitrateK}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, audioBitrateK: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value={128}>128 kbps</option>
                  <option value={160}>160 kbps</option>
                  <option value={192}>192 kbps</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={streamConfig.loop}
                    onChange={(e) => setStreamConfig(prev => ({ ...prev, loop: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-300">Loop video</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {streamConfig.videoId && streamConfig.twitchAccountIds.length > 0 && (
                <span>
                  Ready to stream to {streamConfig.twitchAccountIds.length} account(s)
                </span>
              )}
            </div>
            <button
              onClick={handleStartStreaming}
              disabled={streamingLoading || !streamConfig.videoId || streamConfig.twitchAccountIds.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              {streamingLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Starting Stream...
                </>
              ) : (
                <>
                  🔴 Start Multi-Stream
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/videos'}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center"
          >
            <div className="text-lg font-medium">📹 Upload Videos</div>
            <div className="text-sm opacity-80">Add new content to stream</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/accounts'}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center"
          >
            <div className="text-lg font-medium">👥 Manage Accounts</div>
            <div className="text-sm opacity-80">Connect more Twitch accounts</div>
          </button>
          
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/streams/stop', { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stopAll: true })
                });
                const data = await response.json();
                if (data.success) {
                  alert(data.message);
                  fetchData();
                } else {
                  alert(`Failed to stop streams: ${data.message}`);
                }
              } catch (error) {
                alert('Failed to stop streams');
              }
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg text-center"
          >
            <div className="text-lg font-medium">⏹️ Stop All Streams</div>
            <div className="text-sm opacity-80">Emergency stop all active streams</div>
          </button>
        </div>
      </div>
    </div>
  );
}
