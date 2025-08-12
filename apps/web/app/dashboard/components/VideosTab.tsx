"use client";
import { useState, useEffect } from "react";

interface Video {
  id: string;
  title: string;
  description: string;
  s3Key: string;
  durationSec?: number;
  width?: number;
  height?: number;
  codecVideo?: string;
  codecAudio?: string;
  createdAt: string;
  _count: {
    streams: number;
  };
}

export default function VideosTab() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingVideo(videoId);
    
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete-video",
          videoId: videoId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove video from local state
          setVideos(videos.filter(v => v.id !== videoId));
          alert(`"${videoTitle}" has been deleted successfully.`);
        } else {
          alert(`Failed to delete video: ${data.message}`);
        }
      } else {
        alert("Failed to delete video. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video. Please try again.");
    } finally {
      setDeletingVideo(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 500MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      formData.append('description', `Uploaded video: ${file.name}`);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = function() {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            alert('Video uploaded successfully!');
            fetchVideos(); // Refresh the video list
          } else {
            alert(`Upload failed: ${response.message}`);
          }
        } else {
          alert('Upload failed. Please try again.');
        }
        setUploading(false);
        setUploadProgress(0);
        
        // Reset file input
        event.target.value = '';
      };

      xhr.onerror = function() {
        alert('Upload failed. Please try again.');
        setUploading(false);
        setUploadProgress(0);
        event.target.value = '';
      };

      xhr.open('POST', '/api/videos/upload');
      xhr.send(formData);

    } catch (error) {
      alert('Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h3 className="text-xl font-medium text-white mb-4">Upload New Video</h3>
          <p className="text-gray-400 mb-6">
            Upload MP4, MOV, AVI, or other video files to stream to your Twitch accounts.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-xl font-medium cursor-pointer flex items-center gap-2 transition-all duration-200 hover:shadow-lg disabled:shadow-none">
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    📹 Choose Video File
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              
              {uploading && (
                <div className="flex-1">
                  <div className="bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{uploadProgress}% uploaded</p>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Maximum file size: 500MB</p>
              <p>• Supported formats: MP4, MOV, AVI, MKV, and more</p>
              <p>• Videos will be processed and optimized for streaming</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Videos List */}
      <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-medium text-white">Your Videos ({videos.length})</h3>
            <button
              onClick={fetchVideos}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              Refresh
            </button>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">📹</div>
              <h4 className="text-2xl font-medium text-white mb-3">No videos yet</h4>
              <p className="text-gray-400 mb-6">Upload your first video to start streaming to multiple Twitch accounts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="group/video relative bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:bg-white/[0.05] transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover/video:opacity-100 transition-opacity"
                       style={{
                         background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
                       }} />
                  
                  {/* Video thumbnail placeholder */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-4xl mb-2">🎬</div>
                      <div className="text-sm">
                        {video.width && video.height && `${video.width}×${video.height}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative p-6">
                    <h4 className="font-medium text-white mb-3 truncate" title={video.title}>
                      {video.title}
                    </h4>
                    
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2" title={video.description}>
                      {video.description}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-6">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formatDuration(video.durationSec)}</span>
                      </div>
                      
                      {video.codecVideo && (
                        <div className="flex justify-between">
                          <span>Codec:</span>
                          <span>{video.codecVideo.toUpperCase()}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Uploaded:</span>
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Used in streams:</span>
                        <span>{video._count.streams}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.location.href = '/dashboard/streaming'}
                        className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
                      >
                        🔴 Stream This
                      </button>
                      
                      <button
                        onClick={() => handleDeleteVideo(video.id, video.title)}
                        disabled={deletingVideo === video.id}
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete video"
                      >
                        {deletingVideo === video.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          "🗑️"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Storage Info */}
      <div className="group relative bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 hover:bg-blue-500/15 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Storage & Processing
          </h4>
          <ul className="text-sm text-blue-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>Videos are stored securely in S3-compatible storage</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>Processing happens automatically after upload</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>All formats are optimized for streaming performance</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>Videos can be streamed to multiple accounts simultaneously</div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>Delete videos to free up storage space when needed</div>
            </li>
          </ul>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    </div>
  );
}
