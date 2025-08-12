"use client";
import useSWR from "swr";

export default function StreamDetail({ params }: { params: { id: string }}) {
  const { data, mutate } = useSWR(`/api/streams/${params.id}`, (u)=>fetch(u).then(r=>r.json()));
  if (!data) return (
    <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-sm animate-pulse"></div>
        </div>
        <p className="text-white text-lg">Loading stream details...</p>
      </div>
    </div>
  );

  const start = async () => {
    await fetch(`/api/streams/${params.id}/start`, { method: "POST" });
    mutate();
  };
  const stop = async () => {
    await fetch(`/api/streams/${params.id}/stop`, { method: "POST" });
    mutate();
  };

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{data.title}</h1>
          <p className="text-gray-400">Stream ID: {params.id}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stream Info */}
          <div className="lg:col-span-2">
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Stream Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <p className="text-white">{data.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">FPS</label>
                  <p className="text-white">{data.fps}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Video Bitrate</label>
                  <p className="text-white">{data.videoBitrateK} Kbps</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Audio Bitrate</label>
                  <p className="text-white">{data.audioBitrateK} Kbps</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Video Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-400">Title</label>
                  <p className="text-white">{data.video?.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">S3 Key</label>
                  <p className="text-gray-300 font-mono text-sm">{data.video?.s3Key}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  className="w-full btn-primary" 
                  onClick={start} 
                  disabled={data.status!=="DRAFT" && data.status!=="FAILED"}
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                  Start Stream
                </button>
                <button 
                  className="w-full btn-secondary" 
                  onClick={stop} 
                  disabled={data.status!=="RUNNING"}
                >
                  Stop Stream
                </button>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Twitch Account</h3>
              <div className="space-y-2">
                <p className="text-white">{data.twitchAccount?.displayName}</p>
                <p className="text-gray-400 text-sm">{data.twitchAccount?.ingestServer}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Live Logs */}
        <div className="mt-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Live Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto border border-gray-700" id="logbox">
              <div className="text-gray-500">Waiting for stream to start...</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
