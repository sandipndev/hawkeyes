"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import { NeighborhoodComponent } from "./floorplan/3d";
import { SceneSettingsProvider, useSceneSettings } from "./floorplan/context";
import { type Neighborhood } from "./floorplan/model";
// @ts-ignore
import * as THREE from "three";

const DEFAULT_CAMERA_POS: [number, number, number] = [30, 20, 30];

function DetectionEngine() {
  const { allCctvs, people, setPeople } = useSceneSettings();
  const { scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  
  // Pre-calculate frustums for all CCTVs
  const cctvFrustums = useMemo(() => {
    return allCctvs.map(cctv => {
      // Create a temporary camera to helper generate the frustum
      const tempCam = new THREE.PerspectiveCamera(cctv.fov, 1, 0.1, 100);
      tempCam.position.set(cctv.worldPosition.x, cctv.worldPosition.y, cctv.worldPosition.z);
      
      // CCTV forward is positive Z
      const dir = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(cctv.pitch, cctv.yaw, 0, 'YXZ'));
      tempCam.lookAt(tempCam.position.clone().add(dir));
      tempCam.updateMatrixWorld();
      
      const frustum = new THREE.Frustum();
      const projScreenMatrix = new THREE.Matrix4();
      projScreenMatrix.multiplyMatrices(tempCam.projectionMatrix, tempCam.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      
      return { id: cctv.id, frustum, worldPosition: cctv.worldPosition };
    });
  }, [allCctvs]);

  useFrame(() => {
    if (people.length === 0) return;

    setPeople(prevPeople => {
      let hasChanges = false;
      const nextPeople = prevPeople.map(person => {
        // Check if person is within any CCTV frustum AND has clear line of sight
        const isDetected = cctvFrustums.some(({ frustum, worldPosition }) => {
          // 1. Frustum Check
          if (!frustum.containsPoint(person.position)) return false;

          // 2. Line of Sight Check (Wall/Surface Occlusion)
          const start = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
          // Target slightly above ground to avoid hitting floor
          const target = person.position.clone().add(new THREE.Vector3(0, 0.5, 0));
          const direction = target.clone().sub(start);
          const distance = direction.length();
          direction.normalize();

          raycaster.set(start, direction);
          const intersects = raycaster.intersectObjects(scene.children, true);

          // Find the first surface hit
          const firstSurface = intersects.find((hit: THREE.Intersection) => 
            hit.object.userData.isSurface && 
            hit.distance < distance - 0.2 // Buffer to avoid hitting the person itself
          );

          return !firstSurface;
        });

        if (person.isDetected !== isDetected) {
          hasChanges = true;
          return { ...person, isDetected };
        }
        return person;
      });

      return hasChanges ? nextPeople : prevPeople;
    });
  });

  return null;
}

function Scene() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { neighborhood3D, allCctvs, activeCameraId } = useSceneSettings();
  
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
      <DetectionEngine />
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

export default function Scene3D({ neighborhood }: { neighborhood: Neighborhood }) {
  return (
    <SceneSettingsProvider neighborhood={neighborhood}>
      <div className="relative w-full h-full select-none">
        <SceneControls />
        <Canvas 
          camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
          gl={{ localClippingEnabled: true }}
        >
          <Scene />
        </Canvas>
      </div>
    </SceneSettingsProvider>
  );
}
