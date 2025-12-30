"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { neighborhoodTo3D, NeighborhoodComponent } from "./floorplan/3d";
import { neighborhood as exampleNeighborhoodData } from "./floorplan/example";

function Scene() {
  const controlsRef = useRef<any>(null);
  const neighborhood3D = useMemo(() => neighborhoodTo3D(exampleNeighborhoodData), []);
  
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

export default function Scene3D() {
  return (
    <Canvas camera={{ position: [12, 6, 12], fov: 45 }}>
      <Scene />
    </Canvas>
  );
}
