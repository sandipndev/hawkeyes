"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import { NeighborhoodComponent } from "./floorplan/3d";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";
import { type Neighborhood } from "./floorplan/model";
// @ts-ignore
import * as THREE from "three";

const DEFAULT_CAMERA_POS: [number, number, number] = [30, 20, 30];

function Scene() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { neighborhood3D, allCctvs, activeCameraId, isPaused } = useSceneSettings();
  
  const activeCctv = useMemo(() => allCctvs.find(c => c.id === activeCameraId), [allCctvs, activeCameraId]);

  // Handle Camera Switching and Animation
  useFrame((state) => {
    if (isPaused) return;

    if (activeCctv) {
      const { x, y, z } = activeCctv.worldPosition;
      state.camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
      
      const dir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(activeCctv.pitch, activeCctv.yaw, 0, 'YXZ'));
      const target = new THREE.Vector3(x, y, z).add(dir);
      state.camera.lookAt(target);
      
      if ('fov' in state.camera) {
        const pCam = state.camera as THREE.PerspectiveCamera;
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, activeCctv.fov, 0.1);
        pCam.updateProjectionMatrix();
      }
      
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
        if ('fov' in state.camera) {
          const pCam = state.camera as THREE.PerspectiveCamera;
          pCam.fov = THREE.MathUtils.lerp(pCam.fov, 45, 0.1);
          pCam.updateProjectionMatrix();
        }
      }
    }
  });

  // Reset camera when switching to Orbit View
  useEffect(() => {
    if (!activeCameraId && controlsRef.current) {
      camera.position.set(...DEFAULT_CAMERA_POS);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [activeCameraId, camera]);

  return (
    <>
      <NeighborhoodComponent neighborhood3D={neighborhood3D} />
      <OrbitControls
        ref={controlsRef}
        autoRotate={!activeCameraId}
        autoRotateSpeed={0.5}
        enableZoom={true}
        enablePan={true}
        minDistance={5}
        maxDistance={300}
      />
    </>
  );
}

function SceneControls() {
  const { showCctvFrustums, setShowCctvFrustums, activeCameraId, setActiveCameraId, allCctvs } = useSceneSettings();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { 
        timeZone: 'UTC', 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const EyeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  const CameraIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
  );

  const ClockIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );

  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col items-start gap-4 pointer-events-auto select-none">
      <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 shadow-xl flex items-center gap-1.5">
        {/* Toggle Frustums */}
        <button 
          onClick={() => setShowCctvFrustums(!showCctvFrustums)}
          className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center group ${showCctvFrustums ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
          title={showCctvFrustums ? "Hide CCTV Frustums" : "Show CCTV Frustums"}
        >
          {EyeIcon}
        </button>

        <div className="w-[1px] h-6 bg-slate-200" />

        {/* Camera Selector */}
        <div className="relative flex items-center h-10 px-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
          <div className="text-slate-400 mr-2 group-hover:text-red-500 transition-colors">
            {CameraIcon}
          </div>
          <select 
            value={activeCameraId || ""} 
            onChange={(e) => setActiveCameraId(e.target.value || null)}
            className="bg-transparent border-none p-0 pr-6 text-[11px] font-bold text-slate-600 focus:ring-0 cursor-pointer appearance-none uppercase tracking-tight"
          >
            <option value="">Orbit View</option>
            {allCctvs.map(cctv => (
              <option key={cctv.id} value={cctv.id}>
                {cctv.name}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <div className="w-[1px] h-6 bg-slate-200" />

        {/* UTC Clock */}
        <div className="h-10 px-4 bg-slate-900 rounded-xl flex items-center gap-2.5 shadow-inner">
          <div className="text-indigo-400">
            {ClockIcon}
          </div>
          <div className="flex flex-col -space-y-1">
            <span className="text-[10px] font-black text-white font-mono tracking-wider">{time}</span>
            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em]">UTC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Scene3D() {
  const { setIsPaused, isPaused } = useSceneSettings();
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };

    const handleBlur = () => setIsPaused(true);

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setIsPaused]);

  const handleMouseEnter = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    setIsPaused(false);
  };

  const handleMouseLeave = () => {
    // Add a small delay before pausing to make it less aggressive
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
      pauseTimeoutRef.current = null;
    }, 1500); // 1.5 second delay
  };

  return (
    <div 
      className="relative w-full h-full select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SceneControls />
      <Canvas 
        camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
        gl={{ localClippingEnabled: true }}
      >
        <Scene />
      </Canvas>
      
      {isPaused && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none transition-all duration-500">
          <div className="px-6 py-3 rounded-2xl bg-black/60 border border-white/10 shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">System Paused</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Hover to Resume Feed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
