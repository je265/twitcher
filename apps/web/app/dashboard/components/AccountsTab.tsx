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
    <div className="space-y-6">
      {/* Connected Accounts Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-4">Connected Twitch Accounts</h3>
        <p className="text-gray-400 mb-4">No connected accounts yet. Connect your Twitch accounts to start streaming.</p>
        
        <div className="flex gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
            Connect via OAuth
          </button>
          
          <button 
            onClick={() => setShowManualForm(!showManualForm)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            {showManualForm ? "Cancel Manual Entry" : "Add Manually"}
          </button>
        </div>
      </div>

      {/* Manual Account Entry Form */}
      {showManualForm && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-4">Add Account Manually</h3>
          <p className="text-gray-400 mb-6">
            Enter your Twitch account details manually. You can find your stream key in your Twitch Creator Dashboard.
          </p>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Name / Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={manualForm.displayName}
                onChange={(e) => setManualForm({...manualForm, displayName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g. 123456789"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="live_123456789_abcdefghijklmnopqrstuvwxyz"
              />
              <p className="text-xs text-gray-500 mt-1">
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
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
              <p className="text-xs text-gray-500 mt-1">
                Choose the server closest to your location for best performance
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
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
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-2">💡 Need Help?</h4>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• <strong>Stream Key:</strong> Found in Twitch Creator Dashboard → Settings → Stream</li>
          <li>• <strong>User ID:</strong> Use online converters or Twitch API to find your numeric user ID</li>
          <li>• <strong>Ingest Server:</strong> Choose the server closest to your location for best streaming quality</li>
        </ul>
      </div>
    </div>
  );
}
