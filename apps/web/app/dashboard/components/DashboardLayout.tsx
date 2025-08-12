"use client";
import { ReactNode, useState } from "react";
import Link from "next/link";

type TabType = "overview" | "accounts" | "videos" | "streaming";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: TabType;
}

export default function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      setIsLoggingOut(true);
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
        });
        
        if (response.ok) {
          window.location.href = "/auth";
        } else {
          alert("Failed to log out. Please try again.");
        }
      } catch (error) {
        alert("Failed to log out. Please try again.");
      } finally {
        setIsLoggingOut(false);
      }
    }
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
            <div className="h-6 w-px bg-white/10" />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                  Logging out...
                </>
              ) : (
                <>
                  🚪 Logout
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-8">
        {/* Header with Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your streaming platform and monitor performance</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "Overview", emoji: "📊" },
              { id: "accounts", label: "Accounts", emoji: "👥" },
              { id: "videos", label: "Videos", emoji: "📹" },
              { id: "streaming", label: "Streaming", emoji: "🔴" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={`/dashboard/${tab.id}`}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400 bg-purple-500/10 rounded-t-lg"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300 hover:bg-white/5 rounded-t-lg"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
