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
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Upload New Video</h3>
        <p className="text-gray-400 mb-4">
          Upload MP4, MOV, AVI, or other video files to stream to your Twitch accounts.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium cursor-pointer flex items-center gap-2">
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
                <div className="bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>• Maximum file size: 500MB</p>
            <p>• Supported formats: MP4, MOV, AVI, MKV, and more</p>
            <p>• Videos will be processed and optimized for streaming</p>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Your Videos ({videos.length})</h3>
          <button
            onClick={fetchVideos}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            🔄 Refresh
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h4 className="text-xl font-medium text-white mb-2">No videos yet</h4>
            <p className="text-gray-400 mb-4">Upload your first video to start streaming to multiple Twitch accounts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-700 rounded-lg overflow-hidden">
                {/* Video thumbnail placeholder */}
                <div className="h-40 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🎬</div>
                    <div className="text-sm">
                      {video.width && video.height && `${video.width}×${video.height}`}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-white mb-2 truncate" title={video.title}>
                    {video.title}
                  </h4>
                  
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2" title={video.description}>
                    {video.description}
                  </p>
                  
                  <div className="space-y-1 text-xs text-gray-500">
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
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => window.location.href = '/dashboard/streaming'}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                    >
                      🔴 Stream This
                    </button>
                    
                    <button className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm">
                      ⋯
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-2">💡 Storage & Processing</h4>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Videos are stored securely in S3-compatible storage</li>
          <li>• Processing happens automatically after upload</li>
          <li>• All formats are optimized for streaming performance</li>
          <li>• Videos can be streamed to multiple accounts simultaneously</li>
        </ul>
      </div>
    </div>
  );
}
