"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SceneSettings {
  showCctvFrustums: boolean;
  setShowCctvFrustums: (show: boolean) => void;
}

const SceneSettingsContext = createContext<SceneSettings | undefined>(undefined);

export function SceneSettingsProvider({ children }: { children: ReactNode }) {
  const [showCctvFrustums, setShowCctvFrustums] = useState(true);

  return (
    <SceneSettingsContext.Provider value={{ showCctvFrustums, setShowCctvFrustums }}>
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

