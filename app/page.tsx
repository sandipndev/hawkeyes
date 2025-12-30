"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { neighborhood as exampleNeighborhood, TOWER_CAM_2 } from "./floorplan/example";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";

const Scene3D = dynamic(() => import("./scene"), { ssr: false });

function DetectionsList() {
  const settings = useSceneSettings();
  const people = settings?.people || [];
  const detectionLog = settings?.detectionLog || [];
  
  if (!detectionLog || detectionLog.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500/50">
        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] mb-1">No Activity</p>
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Awaiting Live Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {detectionLog.slice(0, 10).map(event => {
        if (!event) return null;
        const currentPerson = people.find(p => p.id === event.personId);
        const isActive = currentPerson?.isVisible;
        const isThreat = event.isThreat;

        return (
          <div 
            key={event.id} 
            className={`p-5 rounded-[1.5rem] border transition-all duration-300 ${
              isActive 
                ? isThreat 
                  ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]' 
                  : 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]'
                : 'bg-white/5 border-white/5 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? (isThreat ? 'bg-red-500 animate-pulse' : 'bg-indigo-500 animate-pulse') : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${
                  isActive 
                    ? isThreat ? 'text-red-400' : 'text-indigo-400'
                    : 'text-slate-500'
                }`}>
                  {isActive ? isThreat ? 'Threat Alert' : 'Active Track' : 'Lost Signal'}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                {new Date(event.timestamp * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 mb-4">
              <h4 className={`text-base font-black leading-tight tracking-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {isThreat 
                  ? (event.type === 'room' ? 'Unauthorized Entry' : 'Suspicious Movement')
                  : (event.type === 'room' ? 'Interior Movement' : 'Perimeter Activity')
                }
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 font-bold uppercase tracking-wider">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500/50"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {event.type === 'room' ? 'Sector 02' : 'Access Road'}
              </p>
            </div>

            <div className="flex gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-lg border ${
                isActive 
                  ? isThreat ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' 
                  : 'bg-white/5 border-white/5 text-slate-600'
              }`}>
                ID-{event.personId.split('-')[0].toUpperCase()}
              </span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-lg border ${
                isActive 
                  ? isThreat ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' 
                  : 'bg-white/5 border-white/5 text-slate-600'
              }`}>
                LVL-{event.type === 'room' ? '02' : '01'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [neighborhood, setNeighborhood] = useState(exampleNeighborhood);
  const hasTowerCam2 = neighborhood.towerCctvs.some(c => c.id === "tower-cam-2");

  const toggleTowerCam = () => {
    if (hasTowerCam2) {
      setNeighborhood(prev => ({
        ...prev,
        towerCctvs: prev.towerCctvs.filter(c => c.id !== "tower-cam-2")
      }));
    } else {
      setNeighborhood(prev => ({
        ...prev,
        towerCctvs: [...prev.towerCctvs, TOWER_CAM_2]
      }));
    }
  };

  return (
    <SceneSettingsProvider neighborhood={neighborhood}>
      <main>
        <header className="border-b border-border backdrop-blur-sm fixed top-0 w-full z-50 bg-black/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded" />
            <span className="font-semibold text-xl">Hawkeyes</span>
          </div>
          <button className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors">
            Get Started
          </button>
        </nav>
      </header>

      <section className="min-h-[75vh] flex items-center justify-center px-6 pt-20">
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

      <section className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl w-full mb-16 relative z-10">
          <div className="flex flex-col space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black tracking-[0.2em] uppercase w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Live Monitoring System
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9]">
                Autonomous <br />
                <span className="text-indigo-500">Threat Detection</span>
              </h2>
              <p className="text-slate-400 max-w-md text-lg font-medium leading-relaxed pb-2">
                Experience the power of spatial intelligence as Hawkeyes monitors complex environments with sub-second latency.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[500px] lg:h-[750px]">
            {/* Left Column: 3D Scene - Now wider and filling container */}
            <div className="lg:w-[75%]">
              <div className="relative bg-white rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden h-full">
                <Scene3D neighborhood={exampleNeighborhood} />
                
                {/* Internal Scene UI Overlay - Top Right */}
                <div className="absolute top-6 right-6 pointer-events-none">
                  <div className="px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 shadow-xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Live Feed</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">System Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Detections - Restored to right */}
            <div className="lg:w-[25%]">
              <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col h-full overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white leading-none mb-1.5">Event Feed</h3>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Real-time Intel</p>
                    </div>
                  </div>

                  <button 
                    onClick={toggleTowerCam}
                    className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 ${
                      hasTowerCam2 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                    }`}
                  >
                    {hasTowerCam2 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        Remove Cam
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Deploy Cam
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                  <DetectionsList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 bg-black relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black tracking-[0.2em] uppercase mb-6">
              Workflow
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              The Intelligence <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pipeline</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              How Hawkeyes turns raw environment data into sub-second actionable security intelligence.
            </p>
          </div>

          <div className="space-y-12 relative">
            {/* Vertical connecting line with glow */}
            <div className="absolute left-[2.5rem] top-12 bottom-12 w-[2px] bg-gradient-to-b from-primary via-indigo-500 to-green-500 hidden md:block opacity-20" />
            <div className="absolute left-[2.45rem] top-12 bottom-12 w-[4px] bg-gradient-to-b from-primary via-indigo-500 to-green-500 hidden md:block opacity-10 blur-sm" />

            {/* Step 1 */}
            <div className="relative flex gap-8 md:gap-16 items-start group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary z-10 font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform duration-500 group-hover:scale-110">
                1
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex-1 backdrop-blur-xl hover:bg-white/[0.06] hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full group-hover:bg-primary/10 transition-colors duration-500" />
                <div className="flex items-center gap-6 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl shadow-inner">🗺️</div>
                  <h3 className="font-black text-3xl tracking-tight text-white leading-tight group-hover:text-primary transition-colors duration-500">Spatial Foundation</h3>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
                  We turn your site plans into a <span className="text-white font-semibold">precise digital layout</span> so the system understands where things <span className="text-white font-black underline decoration-primary/50 underline-offset-4">actually are</span>.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-8 md:gap-16 items-start group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary z-10 font-black text-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-transform duration-500 group-hover:scale-110">
                2
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex-1 backdrop-blur-xl hover:bg-white/[0.06] hover:border-secondary/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-secondary/5 blur-[60px] rounded-full group-hover:bg-secondary/10 transition-colors duration-500" />
                <div className="flex items-center gap-6 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-3xl shadow-inner">📹</div>
                  <h3 className="font-black text-3xl tracking-tight text-white leading-tight group-hover:text-secondary transition-colors duration-500">Edge Intelligence</h3>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
                  Live camera feeds are <span className="text-white font-bold">processed on-site</span>, enabling real-time detection and tracking <span className="text-indigo-400 font-bold tracking-tight">without cloud latency</span>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-8 md:gap-16 items-start group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 z-10 font-black text-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform duration-500 group-hover:scale-110">
                3
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex-1 backdrop-blur-xl hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-colors duration-500" />
                <div className="flex items-center gap-6 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl shadow-inner">🧠</div>
                  <h3 className="font-black text-3xl tracking-tight text-white leading-tight group-hover:text-indigo-400 transition-colors duration-500">Neural Fusion</h3>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
                  Signals from <span className="text-white font-bold">all sensors</span> are combined to identify <span className="text-indigo-400 font-bold">behavioral patterns</span> that single cameras miss.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex gap-8 md:gap-16 items-start group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 z-10 font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform duration-500 group-hover:scale-110">
                4
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex-1 backdrop-blur-xl hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-colors duration-500" />
                <div className="flex items-center gap-6 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl shadow-inner">✨</div>
                  <h3 className="font-black text-3xl tracking-tight text-white leading-tight group-hover:text-blue-400 transition-colors duration-500">AI Analysis</h3>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
                  Only <span className="text-white">verified events</span> are analyzed further to understand <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg font-bold italic">context and intent</span>, not just motion.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative flex gap-8 md:gap-16 items-start group">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 z-10 font-black text-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-transform duration-500 group-hover:scale-110">
                5
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] flex-1 backdrop-blur-xl hover:bg-white/[0.06] hover:border-green-500/30 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-green-500/5 blur-[60px] rounded-full group-hover:bg-green-500/10 transition-colors duration-500" />
                <div className="flex items-center gap-6 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl shadow-inner">🔔</div>
                  <h3 className="font-black text-3xl tracking-tight text-white leading-tight group-hover:text-green-400 transition-colors duration-500">Smart Alerting</h3>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
                  Confirmed incidents trigger <span className="text-green-400 font-black tracking-tight">immediate, actionable alerts</span>—clear, relevant, and noise-free.
                </p>
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
    </SceneSettingsProvider>
  );
}
