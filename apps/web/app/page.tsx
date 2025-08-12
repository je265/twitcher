"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl blur-xl opacity-50" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">twitcher.lol</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Documentation
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <Link 
              href="/auth"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
            <Link 
              href="/auth"
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
              <button className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:shadow-xl transition-all">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Live Streaming Platform</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 
                className="text-7xl md:text-8xl font-black text-white leading-none tracking-tight"
                style={{ transform: `translateY(${scrollY * 0.2}px)` }}
              >
                Stream to
                <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Multiple Accounts
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Professional RTMP streaming to unlimited Twitch accounts. 
                <span className="text-white font-medium"> One video. Multiple streams. Zero hassle.</span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/auth" className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <button className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transition-all flex items-center gap-3">
                  Start Streaming Now
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
              <button className="relative bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all backdrop-blur-sm">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-16">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-white">10K+</div>
                <div className="text-sm text-gray-500">Active Streamers</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-500">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-8 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built for Professional Streamers</h2>
            <p className="text-gray-400 text-lg">Everything you need to manage multi-account streaming</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🚀",
                title: "Instant Setup",
                description: "Connect your Twitch accounts and start streaming in seconds. No complex configuration required.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: "🔄",
                title: "Auto-Scheduling",
                description: "Schedule streams across multiple accounts with intelligent time management.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                description: "Monitor bitrate, viewer count, and stream health across all your channels.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: "🎬",
                title: "Video Library",
                description: "Upload once, stream everywhere. Manage your content library with ease.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: "⚡",
                title: "High Performance",
                description: "Optimized RTMP delivery with adaptive bitrate and minimal latency.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                description: "Military-grade encryption for your stream keys and account data.",
                gradient: "from-gray-600 to-gray-400"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                     style={{
                       background: `linear-gradient(135deg, transparent 40%, rgba(168, 85, 247, 0.05) 100%)`
                     }} />
                
                <div className="relative">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-50 transition-opacity`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="relative z-10 px-8 py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Simple API. Powerful Results.</h2>
              <p className="text-gray-400 text-lg mb-8">
                Integrate with our platform using our simple REST API or use our web dashboard for quick setup.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-gray-300">RESTful API with comprehensive documentation</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-gray-300">WebSocket support for real-time updates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-gray-300">SDKs for popular programming languages</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-gray-500 text-xs">api.twitcher.lol</span>
                </div>
                <pre className="text-gray-300 overflow-x-auto">
<span className="text-purple-400">POST</span> <span className="text-green-400">/api/streams/start</span>

<span className="text-gray-500">{`{`}</span>
  <span className="text-blue-400">"videoId"</span>: <span className="text-yellow-400">"vid_123"</span>,
  <span className="text-blue-400">"accounts"</span>: [
    <span className="text-yellow-400">"acc_twitch_1"</span>,
    <span className="text-yellow-400">"acc_twitch_2"</span>
  ],
  <span className="text-blue-400">"settings"</span>: <span className="text-gray-500">{`{`}</span>
    <span className="text-blue-400">"bitrate"</span>: <span className="text-orange-400">2500</span>,
    <span className="text-blue-400">"fps"</span>: <span className="text-orange-400">30</span>,
    <span className="text-blue-400">"loop"</span>: <span className="text-orange-400">true</span>
  <span className="text-gray-500">{`}`}</span>
<span className="text-gray-500">{`}`}</span>

<span className="text-gray-500 italic"># Response</span>
<span className="text-gray-500">{`{`}</span>
  <span className="text-blue-400">"success"</span>: <span className="text-orange-400">true</span>,
  <span className="text-blue-400">"streams"</span>: [...]
<span className="text-gray-500">{`}`}</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to scale your streaming?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of streamers who trust Rapid Launch for their multi-account streaming needs.
          </p>
          <Link href="/auth" className="group relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <button className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-5 rounded-xl text-xl font-semibold hover:shadow-2xl transition-all">
              Start Free Trial
            </button>
          </Link>
          <p className="text-sm text-gray-500 mt-6">No credit card required • 14-day free trial</p>
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