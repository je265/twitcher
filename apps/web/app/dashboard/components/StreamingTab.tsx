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
    <div className="space-y-8">
      {/* Active Streams */}
      {activeStreams.length > 0 && (
        <div className="space-y-8">
          <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                 style={{
                   background: `linear-gradient(135deg, transparent 40%, rgba(239, 68, 68, 0.05) 100%)`
                 }} />
            
            <div className="relative">
              <h3 className="text-xl font-medium text-white mb-6">Active Streams ({activeStreams.length})</h3>
              <div className="space-y-6">
                {activeStreams.map((stream) => (
                  <div key={stream.id} className="group/stream relative bg-white/[0.02] border border-white/5 p-6 rounded-xl hover:bg-white/[0.05] transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover/stream:opacity-100 transition-opacity rounded-xl"
                         style={{
                           background: `linear-gradient(135deg, transparent 40%, rgba(239, 68, 68, 0.05) 100%)`
                         }} />
                    
                    {/* Stream Header */}
                    <div className="relative flex items-center justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                          <span className="text-white font-medium text-lg">{stream.title}</span>
                          <span className="text-sm text-gray-400">→ {stream.twitchAccount.displayName}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Video: {stream.video.title} • Status: {stream.status}
                          {stream.startedAt && ` • Started: ${new Date(stream.startedAt).toLocaleTimeString()}`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStopStream(stream.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200"
                      >
                        ⏹️ Stop Stream
                      </button>
                    </div>
                    
                    {/* Bitrate Graph */}
                    {stream.status === 'RUNNING' && (
                      <div className="relative">
                        <BitrateGraph 
                          streamId={stream.id}
                          targetBitrate={2500} // You can get this from stream settings
                          refreshInterval={15000} // Refresh every 15 seconds
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity" />
          </div>
        </div>
      )}

      {/* Start New Stream */}
      <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h3 className="text-xl font-medium text-white mb-4">Start Multi-Account Stream</h3>
          <p className="text-gray-400 mb-8">
            Stream the same video to multiple Twitch accounts simultaneously with different titles and settings.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Video & Account Selection */}
            <div className="space-y-6">
              {/* Video Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Video <span className="text-red-400">*</span>
                </label>
                <select
                  value={streamConfig.videoId}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, videoId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  <option value="">Choose a video...</option>
                  {videos.map((video) => (
                    <option key={video.id} value={video.id}>
                      {video.title} {video.durationSec && `(${Math.floor(video.durationSec / 60)}m)`}
                    </option>
                  ))}
                </select>
                {videos.length === 0 && (
                  <p className="text-sm text-yellow-400 mt-2">
                    No videos available. Upload videos first in the Videos tab.
                  </p>
                )}
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Twitch Accounts <span className="text-red-400">*</span>
                </label>
                {twitchAccounts.length === 0 ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                    <p className="text-yellow-400">
                      No Twitch accounts connected. Connect accounts first in the Accounts tab.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-white/[0.05] border border-white/10 rounded-lg p-4">
                    {twitchAccounts.map((account) => (
                      <label key={account.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.05] rounded-lg cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={streamConfig.twitchAccountIds.includes(account.id)}
                          onChange={() => handleAccountToggle(account.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500/50"
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
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {streamConfig.twitchAccountIds.length} account(s)
                </p>
              </div>
            </div>

            {/* Right Column - Stream Settings */}
            <div className="space-y-6">
              {/* Stream Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Stream Title
                </label>
                <input
                  type="text"
                  value={streamConfig.title}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="Will use video title if empty"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Category
                </label>
                <select
                  value={streamConfig.category}
                  onChange={(e) => setStreamConfig(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                    className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500/50"
                    />
                    <span className="text-sm text-gray-300">Loop video</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-8 pt-6 border-t border-white/10">
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
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg disabled:shadow-none"
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
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Quick Actions */}
      <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h3 className="text-xl font-medium text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => window.location.href = '/dashboard/videos'}
              className="group/action relative bg-white/[0.02] border border-white/5 p-6 rounded-xl text-center hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover/action:opacity-100 transition-opacity rounded-xl"
                   style={{
                     background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
                   }} />
              
              <div className="relative">
                <div className="text-lg font-medium text-white mb-2">📹 Upload Videos</div>
                <div className="text-sm text-gray-400">Add new content to stream</div>
              </div>
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard/accounts'}
              className="group/action relative bg-white/[0.02] border border-white/5 p-6 rounded-xl text-center hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover/action:opacity-100 transition-opacity rounded-xl"
                   style={{
                     background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
                   }} />
              
              <div className="relative">
                <div className="text-lg font-medium text-white mb-2">👥 Manage Accounts</div>
                <div className="text-sm text-gray-400">Connect more Twitch accounts</div>
              </div>
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
              className="group/action relative bg-white/[0.02] border border-white/5 p-6 rounded-xl text-center hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover/action:opacity-100 transition-opacity rounded-xl"
                   style={{
                     background: `linear-gradient(135deg, transparent 40%, rgba(239, 68, 68, 0.05) 100%)`
                   }} />
              
              <div className="relative">
                <div className="text-lg font-medium text-white mb-2">⏹️ Stop All Streams</div>
                <div className="text-sm text-gray-400">Emergency stop all active streams</div>
              </div>
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    </div>
  );
}
