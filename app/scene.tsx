"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { neighborhoodTo3D, NeighborhoodComponent } from "./floorplan/3d";
import { neighborhood as exampleNeighborhoodData } from "./floorplan/example";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";

function Scene() {
  const controlsRef = useRef<any>(null);
  const neighborhood3D = useMemo(() => neighborhoodTo3D(exampleNeighborhoodData), []);
  const { showCctvFrustums } = useSceneSettings();
  
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={1.0} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <NeighborhoodComponent neighborhood3D={neighborhood3D} />
      <OrbitControls
        ref={controlsRef}
        autoRotate
        autoRotateSpeed={0.5}
        enableZoom={true}
        enablePan={true}
        screenSpacePanning={true}
        minDistance={5}
        maxDistance={300}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </>
  );
}

function SceneControls() {
  const { showCctvFrustums, setShowCctvFrustums } = useSceneSettings();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-black/10 shadow-lg">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">View Controls</h4>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={showCctvFrustums}
              onChange={(e) => setShowCctvFrustums(e.target.checked)}
            />
            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-black transition-colors">
            CCTV Frustums
          </span>
        </label>
      </div>
    </div>
  );
}

export default function Scene3D() {
  return (
    <SceneSettingsProvider>
      <div className="relative w-full h-full">
        <SceneControls />
        <Canvas 
          camera={{ position: [12, 6, 12], fov: 45 }}
          gl={{ localClippingEnabled: true }}
        >
          <Scene />
        </Canvas>
      </div>
    </SceneSettingsProvider>
  );
}
