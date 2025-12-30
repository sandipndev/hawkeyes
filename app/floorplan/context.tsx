"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { neighborhoodTo3D, getAllCctvs, type Neighborhood3D, type CCTV3D, type TowerCCTV3D } from "./3d";
import { type Neighborhood } from "./model";

interface SceneSettings {
  showCctvFrustums: boolean;
  setShowCctvFrustums: (show: boolean) => void;
  activeCameraId: string | null;
  setActiveCameraId: (id: string | null) => void;
  neighborhood3D: Neighborhood3D;
  allCctvs: (CCTV3D | TowerCCTV3D)[];
}

const SceneSettingsContext = createContext<SceneSettings | undefined>(undefined);

export function SceneSettingsProvider({ 
  neighborhood, 
  children 
}: { 
  neighborhood: Neighborhood; 
  children: ReactNode 
}) {
  const [showCctvFrustums, setShowCctvFrustums] = useState(true);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

  const neighborhood3D = useMemo(() => neighborhoodTo3D(neighborhood), [neighborhood]);
  const allCctvs = useMemo(() => getAllCctvs(neighborhood3D), [neighborhood3D]);

  return (
    <SceneSettingsContext.Provider 
      value={{ 
        showCctvFrustums, 
        setShowCctvFrustums,
        activeCameraId,
        setActiveCameraId,
        neighborhood3D,
        allCctvs
      }}
    >
      {children}
    </SceneSettingsContext.Provider>
  );
}

export function useSceneSettings() {
  const context = useContext(SceneSettingsContext);
  if (context === undefined) {
    throw new Error("useSceneSettings must be used within a SceneSettingsProvider");
  }
  return context;
}

