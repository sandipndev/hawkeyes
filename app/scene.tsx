"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { 
  RoadComponent, 
  BuildingComponent, 
  TowerCCTVComponent, 
  AnimatedPeople 
} from "./floorplan/3d";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";
import { type Neighborhood } from "./floorplan/model";
import { type Neighborhood3D } from "./floorplan/3d";
// @ts-ignore
import * as THREE from "three";

const DEFAULT_CAMERA_POS: [number, number, number] = [30, 20, 30];

function LightNeighborhood({ neighborhood3D }: { neighborhood3D: Neighborhood3D }) {
  return (
    <group>
      {neighborhood3D.roads.map((road, i) => (
        <RoadComponent key={road.id} road={road} index={i} />
      ))}
      {neighborhood3D.buildings.map((building) => (
        <BuildingComponent key={building.id} building3D={building} />
      ))}
      {neighborhood3D.towerCctvs.map((cctv) => (
        <TowerCCTVComponent key={cctv.id} cctv={cctv} />
      ))}
      <AnimatedPeople neighborhood3D={neighborhood3D} />
    </group>
  );
}

function Scene() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { neighborhood3D, allCctvs, activeCameraId, isPaused } = useSceneSettings();
  
  const activeCctv = useMemo(() => allCctvs.find(c => c.id === activeCameraId), [allCctvs, activeCameraId]);

  // Handle Camera Switching and Animation
  useFrame((state) => {
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
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <LightNeighborhood neighborhood3D={neighborhood3D} />
      <OrbitControls
        ref={controlsRef}
        autoRotate={!activeCameraId && !isPaused}
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

  const EyeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  );

  const CameraIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
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
      </div>
    </div>
  );
}

export default function Scene3D() {
  const { setIsPaused, isPaused } = useSceneSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPaused(false);
  }, [setIsPaused]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full select-none"
    >
      <SceneControls />
      <Canvas 
        camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
        gl={{ localClippingEnabled: true }}
      >
        <color attach="background" args={["#ffffff"]} />
        <Scene />
      </Canvas>
    </div>
  );
}
