"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cdefs%3E%3Cpattern id=&quot;grid&quot; width=&quot;60&quot; height=&quot;60&quot; patternUnits=&quot;userSpaceOnUse&quot;%3E%3Cpath d=&quot;M 60 0 L 0 0 0 60&quot; fill=&quot;none&quot; stroke=&quot;rgba(255,255,255,0.03)&quot; stroke-width=&quot;1&quot;/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=&quot;100%25&quot; height=&quot;100%25&quot; fill=&quot;url(%23grid)&quot;/%3E%3C/svg%3E')]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl blur-xl opacity-50" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">twitcher.lol</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Home
            </Link>
            <Link href="/features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      {/* Auth Section */}
      <section className="relative z-10 px-8 pt-20 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Authentication</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl font-bold text-white mb-4">
              {mode === "login" ? "Sign In to" : "Join"}
              <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {mode === "login" ? "twitcher.lol" : "twitcher.lol"}
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              {mode === "login" 
                ? "Enter your UUID to access your streaming dashboard" 
                : "Get started with multi-account RTMP streaming"
              }
            </p>
          </div>

          {/* Auth Form */}
          <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity rounded-2xl"
                 style={{
                   background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
                 }} />
            
            <div className="relative">
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
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  {generatedUuid && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                      <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        Save Your UUID!
                      </h3>
                      <div className="flex items-center gap-3 mb-3">
                        <code className="bg-black/50 px-3 py-2 rounded-lg text-green-400 flex-1 text-sm font-mono border border-white/10">
                          {generatedUuid}
                        </code>
                        <button
                          onClick={() => copyToClipboard(generatedUuid)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
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
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-xl disabled:shadow-none"
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
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="Enter your UUID"
                    />
                  </div>
                  
                  <button
                    onClick={handleLogin}
                    disabled={loading || !uuid.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all duration-200 hover:shadow-xl disabled:shadow-none"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
              )}

              {message && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  message.includes("success") || message.includes("copied") 
                    ? "bg-green-500/10 border-green-500/20 text-green-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {message}
                </div>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setMessage("");
                    setGeneratedUuid("");
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
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
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <span className="text-sm text-gray-400">© 2024 twitcher.lol. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
