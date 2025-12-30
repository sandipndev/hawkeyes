"use client";

import dynamic from "next/dynamic";

const Scene3D = dynamic(() => import("./scene"), { ssr: false });

export default function Home() {
  return (
    <main>
      <header className="border-b border-border backdrop-blur-sm fixed top-0 w-full z-50 bg-black/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded" />
            <span className="font-semibold text-xl">Hawkeyes</span>
          </div>
          <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors">
            Sign In with Google
          </button>
        </nav>
      </header>

      <section className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Real-Time Intelligence for
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Physical Spaces</span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Hawkeyes is the foundational engine that lets AI understand and reason about real-world spaces—so humans can act faster, with confidence.
          </p>

          <div className="grid md:grid-cols-3 gap-6 pt-8 text-left">
            <div className="p-6 rounded-xl border border-border bg-surface backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-2xl">🏢</div>
              <h3 className="font-semibold mb-2">Spatial Understanding</h3>
              <p className="text-sm text-white/60">Buildings, floors, rooms, and cameras as a living environment</p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-surface backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 text-2xl">⚡</div>
              <h3 className="font-semibold mb-2">Real-Time Detection</h3>
              <p className="text-sm text-white/60">Detect and verify unusual situations as they unfold</p>
            </div>
            
            <div className="p-6 rounded-xl border border-border bg-surface backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-2xl">🔒</div>
              <h3 className="font-semibold mb-2">Privacy-Aware</h3>
              <p className="text-sm text-white/60">Focuses on behavior and location, not personal identity</p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-7xl w-full space-y-6 mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center">See Threats in Real-Time</h2>
          <p className="text-xl text-black/60 text-center max-w-2xl mx-auto">
            Watch how Hawkeyes tracks movement across floors and identifies threats as they emerge
          </p>
        </div>
        <div className="w-full max-w-7xl flex gap-6">
          <div className="flex-1 h-[700px] rounded-2xl overflow-hidden border border-black/10 bg-white">
            <Scene3D />
          </div>
          <div className="w-96 h-[700px] rounded-2xl border border-black/10 bg-gradient-to-br from-slate-50 to-white p-6 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Active Threats
            </h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-red-900">THREAT DETECTED</span>
                  <span className="text-xs text-red-600">12:34:56</span>
                </div>
                <p className="text-sm text-red-800 mb-2">Unauthorized access detected on Floor 1</p>
                <div className="flex gap-2 text-xs text-red-700">
                  <span className="px-2 py-1 bg-red-100 rounded">Floor 1</span>
                  <span className="px-2 py-1 bg-red-100 rounded">Camera 2</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-red-900">THREAT DETECTED</span>
                  <span className="text-xs text-red-600">12:34:48</span>
                </div>
                <p className="text-sm text-red-800 mb-2">Suspicious movement on Ground Floor</p>
                <div className="flex gap-2 text-xs text-red-700">
                  <span className="px-2 py-1 bg-red-100 rounded">Ground Floor</span>
                  <span className="px-2 py-1 bg-red-100 rounded">Camera 1</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">NORMAL</span>
                  <span className="text-xs text-slate-500">12:34:22</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">Regular movement pattern</p>
                <div className="flex gap-2 text-xs text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded">Floor 1</span>
                  <span className="px-2 py-1 bg-slate-100 rounded">Camera 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded" />
            <span className="font-semibold">Hawkeyes</span>
          </div>
          <div className="flex gap-8 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-sm text-white/40">© 2025 Hawkeyes. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
