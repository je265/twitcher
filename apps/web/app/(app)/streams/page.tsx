import Link from "next/link";

export default function StreamsPage() {
  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Streams</h1>
            <p className="text-gray-400">Manage and monitor your streaming jobs</p>
          </div>
          <Link href="/streams/new" className="btn-primary">
            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            New Stream
          </Link>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-sm"></div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Streams Yet</h3>
            <p className="text-gray-400 mb-6">Create your first stream to get started</p>
            <Link href="/streams/new" className="btn-primary">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              Create Stream
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
