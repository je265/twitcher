"use client";
import { useState } from "react";

interface ManualAccountForm {
  displayName: string;
  userId: string;
  streamKey: string;
  ingestServer: string;
}

export default function AccountsTab() {
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState<ManualAccountForm>({
    displayName: "",
    userId: "",
    streamKey: "",
    ingestServer: "live.twitch.tv/app"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/twitch/manual-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      
      if (response.ok) {
        alert("Account added successfully!");
        setManualForm({
          displayName: "",
          userId: "",
          streamKey: "",
          ingestServer: "live.twitch.tv/app"
        });
        setShowManualForm(false);
      } else {
        const error = await response.text();
        alert(`Failed to add account: ${error}`);
      }
    } catch (error) {
      alert("Failed to add account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Connected Accounts Section */}
      <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h3 className="text-xl font-medium text-white mb-4">Connected Twitch Accounts</h3>
          <p className="text-gray-400 mb-6">No connected accounts yet. Connect your Twitch accounts to start streaming.</p>
          
          <div className="flex gap-4">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg">
              Connect via OAuth
            </button>
            
            <button 
              onClick={() => setShowManualForm(!showManualForm)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              {showManualForm ? "Cancel Manual Entry" : "Add Manually"}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Manual Account Entry Form */}
      {showManualForm && (
        <div className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
               style={{
                 background: `linear-gradient(135deg, transparent 40%, rgba(34, 197, 94, 0.05) 100%)`
               }} />
          
          <div className="relative">
            <h3 className="text-xl font-medium text-white mb-4">Add Account Manually</h3>
            <p className="text-gray-400 mb-8">
              Enter your Twitch account details manually. You can find your stream key in your Twitch Creator Dashboard.
            </p>
            
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Name / Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.displayName}
                  onChange={(e) => setManualForm({...manualForm, displayName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="e.g. YourTwitchUsername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Twitch User ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({...manualForm, userId: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="e.g. 123456789"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Find your User ID at <a href="https://www.streamweasels.com/twitch-tools/username-to-user-id-converter/" target="_blank" className="text-purple-400 hover:underline">streamweasels.com</a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={manualForm.streamKey}
                  onChange={(e) => setManualForm({...manualForm, streamKey: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="live_123456789_abcdefghijklmnopqrstuvwxyz"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get your stream key from Twitch Creator Dashboard → Settings → Stream
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ingest Server
                </label>
                <select
                  value={manualForm.ingestServer}
                  onChange={(e) => setManualForm({...manualForm, ingestServer: e.target.value})}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                >
                  <option value="live.twitch.tv/app">Primary (live.twitch.tv/app)</option>
                  <option value="live-jfk.twitch.tv/app">New York (live-jfk.twitch.tv/app)</option>
                  <option value="live-lax.twitch.tv/app">Los Angeles (live-lax.twitch.tv/app)</option>
                  <option value="live-ord.twitch.tv/app">Chicago (live-ord.twitch.tv/app)</option>
                  <option value="live-dfw.twitch.tv/app">Dallas (live-dfw.twitch.tv/app)</option>
                  <option value="live-fra.twitch.tv/app">Frankfurt (live-fra.twitch.tv/app)</option>
                  <option value="live-ams.twitch.tv/app">Amsterdam (live-ams.twitch.tv/app)</option>
                  <option value="live-lhr.twitch.tv/app">London (live-lhr.twitch.tv/app)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Choose the server closest to your location for best performance
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    "Add Account"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
      )}

      {/* Help Section */}
      <div className="group relative bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 hover:bg-blue-500/15 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
             style={{
               background: `linear-gradient(135deg, transparent 40%, rgba(59, 130, 246, 0.05) 100%)`
             }} />
        
        <div className="relative">
          <h4 className="text-blue-400 font-medium mb-4 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Need Help?
          </h4>
          <ul className="text-sm text-blue-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>
                <strong>Stream Key:</strong> Found in Twitch Creator Dashboard → Settings → Stream
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>
                <strong>User ID:</strong> Use online converters or Twitch API to find your numeric user ID
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <div>
                <strong>Ingest Server:</strong> Choose the server closest to your location for best streaming quality
              </div>
            </li>
          </ul>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
    </div>
  );
}
