"use client";
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold text-white">TWITCHER PRO</span>
        </div>
        <div className="flex gap-4">
          <button 
            className="btn-secondary"
            onClick={() => window.location.href = '/auth'}
          >
            Sign In
          </button>
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/auth'}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-8 py-20 text-center">
        <div className="mb-8">
          <span className="inline-block bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">
            Industry-Leading Streaming Solutions
          </span>
        </div>
        
        <h1 className="text-6xl font-bold text-white mb-6">
          High-Quality Streaming
        </h1>
        <h2 className="text-4xl font-bold mb-8">
          for <span className="highlight">Every Need</span>
        </h2>
        
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
          Access to millions of videos, automated scheduling, and professional streaming tools with superior performance and reliability.
        </p>
        
        <div className="flex gap-6 justify-center">
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/auth'}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            Get Started
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.location.href = '/auth'}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-8 pb-20">
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <h3 className="text-white font-semibold mb-2">Millions of Videos</h3>
            <p className="text-gray-400 text-sm">Worldwide content library</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <h3 className="text-white font-semibold mb-2">Advanced Scheduling</h3>
            <p className="text-gray-400 text-sm">Smart automation technology</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <h3 className="text-white font-semibold mb-2">High Success Rates</h3>
            <p className="text-gray-400 text-sm">Reliable streaming performance</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <h3 className="text-white font-semibold mb-2">24/7 Support</h3>
            <p className="text-gray-400 text-sm">Always here to help</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="text-center pb-8">
        <p className="text-gray-500 text-sm mb-2">Scroll to explore</p>
        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </main>
  )
}
