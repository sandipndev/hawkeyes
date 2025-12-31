"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useRef } from "react";
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
            className={`p-6 rounded-[2rem] border transition-all duration-500 group/card ${
              isActive 
                ? isThreat 
                  ? 'bg-red-500/[0.08] border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]' 
                  : 'bg-white/[0.03] border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.02)] hover:bg-white/[0.05] hover:border-white/20'
                : 'bg-white/[0.02] border-white/5 opacity-30 hover:opacity-50'
            }`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isActive 
                    ? (isThreat ? 'bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-primary animate-pulse shadow-[0_0_12px_rgba(0,210,255,0.8)]') 
                    : 'bg-slate-600'
                }`} />
                <span className={`text-[10px] font-black tracking-[0.25em] uppercase ${
                  isActive 
                    ? isThreat ? 'text-red-400' : 'text-primary'
                    : 'text-slate-500'
                }`}>
                  {isActive ? isThreat ? 'Threat Alert' : 'Active Track' : 'Lost Signal'}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold tracking-tight ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                {new Date(event.timestamp * 1000).toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <h4 className={`text-lg font-black leading-tight tracking-tight transition-colors ${isActive ? 'text-white group-hover/card:text-primary/90' : 'text-slate-500'}`}>
                {isThreat 
                  ? 'Threat Detected'
                  : 'Person Detected'
                }
              </h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-2 font-black uppercase tracking-[0.15em]">
                <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                {event.type === 'room' ? 'Sector 02' : 'Access Road'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [neighborhood, setNeighborhood] = useState(exampleNeighborhood);
  const demoSectionRef = useRef<HTMLElement>(null);
  const hasTowerCam2 = neighborhood?.towerCctvs?.some(c => c.id === "tower-cam-2");

  const scrollToDemo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
        <header className="border-b border-white/5 backdrop-blur-md fixed top-0 w-full z-50 bg-black/20">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.5)] border border-white/20">
              <Image src="/logo.png" alt="Hawkeyes Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-white">Hawkeyes</span>
          </div>
          <Link href="/login" className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-medium hover:bg-white/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
            Get Started
          </Link>
        </nav>
      </header>

      <InfiniteHero 
        title={
          <div className="relative inline-block">
            <div className="absolute -inset-x-20 -inset-y-10 bg-primary/20 blur-[100px] rounded-full opacity-50" />
            <div className="relative z-10">
              Real-Time Intelligence for
              <span className="bg-gradient-to-r from-primary via-white to-secondary bg-clip-text text-transparent italic"> Physical Spaces</span>
            </div>
          </div>
        }
        description="Hawkeyes is the foundational engine that lets AI understand and reason about real-world spaces—so humans can act faster, with total confidence."
        primaryCtaText="Get Started Now"
        secondaryCtaText="View Demo"
        onSecondaryCtaClick={scrollToDemo}
      />

      <section className="px-6 pb-24 -mt-32 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 pt-8 text-left">
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-primary/50 hover:shadow-primary/20 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-6 text-2xl shadow-primary/30 group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-primary transition-colors">Spatial Intel</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Buildings, floors, rooms, and cameras as a living environment</p>
            </div>
            
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-secondary/50 hover:shadow-secondary/20 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-secondary/20 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 border border-secondary/40 flex items-center justify-center mb-6 text-2xl shadow-secondary/30 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-secondary transition-colors">Live Detect</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Detect and verify unusual situations as they unfold in real-time</p>
            </div>
            
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl hover:bg-white/[0.05] hover:border-accent/50 hover:shadow-accent/20 transition-all group overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-24 h-24 bg-accent/20 blur-2xl rounded-full" />
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center mb-6 text-2xl shadow-accent/30 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="font-black text-xl mb-3 uppercase tracking-tight group-hover:text-accent transition-colors">Privacy First</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Focuses on behavior and location, not personal identity</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={demoSectionRef} className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="max-w-7xl w-full mb-16 relative z-10">
          <div className="flex flex-col space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase w-fit shadow-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-primary" />
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
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(0,210,255,0.3)] border border-white/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white leading-none mb-1.5 uppercase tracking-tighter italic">Event Feed</h3>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Real-time Intel</p>
                    </div>
                  </div>

                  <button 
                    onClick={toggleTowerCam}
                    className={`flex items-center gap-2.5 px-6 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_6px_0_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.2)_inset] active:translate-y-[2px] active:shadow-none border border-white/20 group/btn ${
                      hasTowerCam2 
                        ? 'bg-gradient-to-b from-red-400 to-red-600 text-white' 
                        : 'bg-gradient-to-b from-primary to-blue-700 text-white shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                    }`}
                  >
                    {hasTowerCam2 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:rotate-90 transition-transform"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        <span className="hidden sm:inline">Remove Cam</span>
                        <span className="sm:hidden">Remove</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:rotate-90 transition-transform"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        <span className="hidden sm:inline">Deploy Cam</span>
                        <span className="sm:hidden">Deploy</span>
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
                  <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8 text-4xl shadow-primary/20 group-hover:scale-110 transition-transform">🗺️</div>
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
                  <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-xl shadow-secondary/20">📹</div>
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
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl shadow-accent/20">🧠</div>
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
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-xl shadow-primary/20">✨</div>
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
                  <div className="w-10 h-10 rounded-xl bg-slate-400/20 border border-slate-400/30 flex items-center justify-center text-xl shadow-white/10">⚡</div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-white group-hover:text-white transition-colors leading-tight">Real-time Intel</h3>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Sub-second actionable security intelligence at scale across your entire environment.
                </p>
              </div>
            }
            shortcuts={
              <div className="h-full p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.05] transition-all group overflow-hidden relative flex items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-3xl shadow-secondary/20 group-hover:scale-110 transition-transform flex-shrink-0">🔔</div>
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
            <div className="w-6 h-6 relative rounded overflow-hidden shadow-[0_0_10px_rgba(var(--primary),0.3)]">
              <Image src="/logo.png" alt="Hawkeyes Logo" fill className="object-cover" />
            </div>
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
