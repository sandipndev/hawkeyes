"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { neighborhood as exampleNeighborhood, TOWER_CAM_2 } from "./floorplan/example";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";
import InfiniteHero from "@/components/ui/infinite-hero";
import { BentoGridShowcase } from "@/components/ui/bento-product-features";
import { cn } from "@/lib/utils";

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
                  : 'bg-white/5 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                : 'bg-white/5 border-white/5 opacity-40'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? (isThreat ? 'bg-red-500 animate-pulse' : 'bg-primary animate-pulse shadow-[0_0_8px_rgba(0,210,255,0.8)]') : 'bg-slate-600'}`} />
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${
                  isActive 
                    ? isThreat ? 'text-red-400' : 'text-primary'
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
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {event.type === 'room' ? 'Sector 02' : 'Access Road'}
              </p>
            </div>

            <div className="flex gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-lg border transition-colors ${
                isActive 
                  ? isThreat ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,210,255,0.1)]' 
                  : 'bg-white/5 border-white/5 text-slate-600'
              }`}>
                ID-{event.personId.split('-')[0].toUpperCase()}
              </span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-lg border transition-colors ${
                isActive 
                  ? isThreat ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-secondary/20 border-secondary/30 text-secondary shadow-[0_0_10px_rgba(0,255,135,0.1)]' 
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
  const hasTowerCam2 = neighborhood?.towerCctvs?.some(c => c.id === "tower-cam-2");

  const toggleTowerCam = () => {
    if (hasTowerCam2) {
      setNeighborhood(prev => ({
        ...prev,
        towerCctvs: prev.towerCctvs?.filter(c => c.id !== "tower-cam-2") || []
      }));
    } else {
      setNeighborhood(prev => ({
        ...prev,
        towerCctvs: [...(prev.towerCctvs || []), TOWER_CAM_2]
      }));
    }
  };

  return (
    <SceneSettingsProvider neighborhood={neighborhood}>
      <main>
        <header className="border-b border-border backdrop-blur-sm fixed top-0 w-full z-50 bg-black/50">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-[0_0_15px_rgba(0,210,255,0.5)] border border-white/20" />
            <span className="font-black text-xl tracking-tighter uppercase text-white">Hawkeyes</span>
          </div>
          <Link href="/login" className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            Get Started
          </Link>
        </nav>
      </header>

      <InfiniteHero 
        title={
          <>
            Real-Time Intelligence for
            <span className="bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent italic"> Physical Spaces</span>
          </>
        }
        description="Hawkeyes is the foundational engine that lets AI understand and reason about real-world spaces—so humans can act faster, with total confidence."
        primaryCtaText="Get Started Now"
        secondaryCtaText="View Demo"
      />

      <section className="px-6 pb-24 -mt-32 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 pt-8 text-left">
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-primary/30 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 text-2xl shadow-[0_0_20px_rgba(0,210,255,0.2)] group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">Spatial Intel</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Buildings, floors, rooms, and cameras as a living environment</p>
            </div>
            
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-secondary/30 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-secondary/10 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center mb-6 text-2xl shadow-[0_0_20px_rgba(0,255,135,0.2)] group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-secondary transition-colors">Live Detect</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Detect and verify unusual situations as they unfold in real-time</p>
            </div>
            
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-accent/30 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-accent/10 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center mb-6 text-2xl shadow-[0_0_20px_rgba(255,184,0,0.2)] group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-accent transition-colors">Privacy First</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Focuses on behavior and location, not personal identity</p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl w-full mb-16 relative z-10">
          <div className="flex flex-col space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black tracking-[0.2em] uppercase w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Live Monitoring System
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-[0.9]">
                Autonomous <br />
                <span className="text-slate-400">Threat Detection</span>
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
                <Scene3D />
                
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
              <div className="bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col h-full overflow-hidden backdrop-blur-md">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white leading-none mb-1.5 uppercase tracking-tighter">Event Feed</h3>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Real-time Intel</p>
                    </div>
                  </div>

                  <button 
                    onClick={toggleTowerCam}
                    className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_rgb(0,0,0,0.2),0_1px_2px_rgba(255,255,255,0.1)_inset] active:translate-y-[2px] active:shadow-none border border-white/10 ${
                      hasTowerCam2 
                        ? 'bg-gradient-to-b from-red-400 to-red-600 text-white' 
                        : 'bg-gradient-to-b from-primary to-blue-600 text-white shadow-primary/20'
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

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-6 shadow-[0_0_15px_rgba(0,210,255,0.1)]">
              Workflow
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
              The Intelligence <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Pipeline</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              How Hawkeyes turns raw environment data into sub-second actionable security intelligence.
            </p>
          </div>

          <BentoGridShowcase
            integration={
              <div className="h-full p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex flex-col justify-center text-center">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8 text-4xl shadow-[0_0_30px_rgba(0,210,255,0.2)] group-hover:scale-110 transition-transform">🗺️</div>
                  <h3 className="font-black text-3xl mb-4 uppercase tracking-tight text-white group-hover:text-primary transition-colors">Spatial Foundation</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    We turn your site plans into a precise digital layout so the system understands where things actually are.
                  </p>
                </div>
              </div>
            }
            trackers={
              <div className="h-full p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-xl shadow-inner shadow-secondary/20">📹</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-secondary transition-colors leading-tight">Edge Intel</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Live camera feeds are processed on-site, enabling real-time detection without cloud latency.
                </p>
              </div>
            }
            statistic={
              <div className="h-full p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl shadow-inner shadow-accent/20">🧠</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-accent transition-colors leading-tight">Neural Fusion</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Signals from all sensors are combined to identify behavioral patterns that single cameras miss.
                </p>
              </div>
            }
            focus={
              <div className="h-full p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xl shadow-inner shadow-primary/20">✨</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-primary transition-colors leading-tight">AI Analysis</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Only verified events are analyzed to understand context and intent, not just motion.
                </p>
              </div>
            }
            productivity={
              <div className="h-full p-6 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-400/20 border border-slate-400/30 flex items-center justify-center text-xl shadow-inner shadow-white/10">⚡</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-white transition-colors leading-tight">Real-time Intel</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Sub-second actionable security intelligence at scale across your entire environment.
                </p>
              </div>
            }
            shortcuts={
              <div className="h-full p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-3xl shadow-inner shadow-secondary/20 group-hover:scale-110 transition-transform flex-shrink-0">🔔</div>
                <div className="flex-1">
                  <h3 className="font-black text-2xl mb-2 uppercase tracking-tight text-white group-hover:text-secondary transition-colors">Smart Alerting</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xl">
                    Confirmed incidents trigger immediate, actionable alerts—clear, relevant, and noise-free.
                  </p>
                </div>
              </div>
            }
          />
        </div>
      </section>

      <footer className="bg-black border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded shadow-[0_0_10px_rgba(0,210,255,0.3)]" />
            <span className="font-black tracking-tighter uppercase text-white">Hawkeyes</span>
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
