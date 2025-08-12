"use client";
import { ReactNode, useState } from "react";

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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Title and Logout */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Twitcher Pro Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging out...
              </>
            ) : (
              <>
                🚪 Logout
              </>
            )}
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "overview", label: "📊 Overview", emoji: "📊" },
              { id: "accounts", label: "👥 Accounts", emoji: "👥" },
              { id: "videos", label: "📹 Videos", emoji: "📹" },
              { id: "streaming", label: "🔴 Streaming", emoji: "🔴" },
            ].map((tab) => (
              <a
                key={tab.id}
                href={`/dashboard/${tab.id}`}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-400 bg-purple-500/10"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300 hover:bg-gray-800/50"
                } rounded-t-lg`}
              >
                <span>{tab.emoji}</span>
                {tab.label.replace(tab.emoji + " ", "")}
              </a>
            ))}
          </nav>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
