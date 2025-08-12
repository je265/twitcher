"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [uuid, setUuid] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatedUuid, setGeneratedUuid] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedUuid(data.uuid);
        setMessage(data.message);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (error) {
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push("/dashboard");
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage("UUID copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="mt-2 text-gray-400">
            {mode === "login" 
              ? "Enter your UUID to access your account" 
              : "Get started with multi-account RTMP streaming"
            }
          </p>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
          {mode === "register" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
              </div>
              
              {generatedUuid && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Save Your UUID!</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="bg-gray-900 px-2 py-1 rounded text-green-400 flex-1 text-sm">
                      {generatedUuid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedUuid)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-yellow-300 text-sm">
                    This is your login ID. Save it somewhere safe - you can't recover it!
                  </p>
                </div>
              )}
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your UUID
                </label>
                <input
                  type="text"
                  value={uuid}
                  onChange={(e) => setUuid(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your UUID"
                />
              </div>
              
              <button
                onClick={handleLogin}
                disabled={loading || !uuid.trim()}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md font-medium"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>
          )}

          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes("success") || message.includes("copied") 
                ? "bg-green-900/20 border border-green-700 text-green-400" 
                : "bg-red-900/20 border border-red-700 text-red-400"
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
                setGeneratedUuid("");
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {mode === "login" 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
