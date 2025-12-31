"use client"

import { useState } from "react"
import { 
  Home, 
  Settings, 
  Bell, 
  ChevronLeft,
  Camera as CameraIcon,
  Plus,
  Trash2,
  Video,
  Check
} from "lucide-react"
import Link from "next/link"
import { Neighborhood, CCTV, TowerCCTV } from "@/app/floorplan/model"
import { SceneSettingsProvider } from "@/app/floorplan/context"
import Scene3D from "@/app/scene"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

interface Camera {
  id: string
  name: string
  rtspFeed: string
}

interface SitePlanViewProps {
  sitePlan: {
    id: string
    name: string
    data: any
    cameras: Camera[]
  }
}

function extractCamerasFromData(data: Neighborhood): { id: string, name: string }[] {
  const extracted: { id: string, name: string }[] = [];
  
  if (data.towerCctvs) {
    data.towerCctvs.forEach(c => {
      extracted.push({ id: c.id, name: c.name || `Tower Camera ${c.id}` });
    });
  }
  
  data.buildings?.forEach(b => {
    b.floors?.forEach(f => {
      f.rooms?.forEach(r => {
        r.sensors?.cctvs?.forEach(c => {
          extracted.push({ id: c.id, name: c.name || `Room Camera ${c.id}` });
        });
      });
    });
  });
  
  return extracted;
}

type Tab = "home" | "settings" | "alerts"

export default function SitePlanView({ sitePlan }: SitePlanViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("home")
  
  const extractedCameras = useMemo(() => extractCamerasFromData(sitePlan.data as Neighborhood), [sitePlan.data]);
  
  const [cameras, setCameras] = useState<Camera[]>(() => {
    const dbCameras = sitePlan.cameras;
    const merged = extractedCameras.map(ec => {
      const existing = dbCameras.find(dbc => dbc.id === ec.id);
      return {
        id: ec.id,
        name: existing?.name || ec.name,
        rtspFeed: existing?.rtspFeed || ""
      };
    });
    
    const notInData = dbCameras.filter(dbc => !extractedCameras.some(ec => ec.id === dbc.id));
    return [...merged, ...notInData];
  });

  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const neighborhood = sitePlan.data as Neighborhood

  const addCamera = () => {
    setCameras([
      ...cameras,
      { id: Math.random().toString(36).substr(2, 9), name: "New Camera", rtspFeed: "" }
    ])
  }

  const removeCamera = (id: string) => {
    setCameras(cameras.filter(c => c.id !== id))
  }

  const updateCamera = (id: string, field: keyof Camera, value: string) => {
    setCameras(cameras.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    setShowSaved(false)
    try {
      const response = await fetch(`/api/siteplans/${sitePlan.id}/cameras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameras }),
      })
      if (response.ok) {
        setShowSaved(true)
        router.refresh()
        setTimeout(() => setShowSaved(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save cameras", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Site Plan</h1>
            <h2 className="text-sm font-black tracking-tight uppercase truncate max-w-[200px]">{sitePlan.name}</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800">
          <button
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "home" ? "bg-blue-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "settings" ? "bg-blue-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === "alerts" ? "bg-blue-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
          </button>
        </div>

        <div className="w-[100px]" /> {/* Spacer for symmetry */}
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === "home" && (
          <div className="w-full h-full bg-white">
            <SceneSettingsProvider neighborhood={neighborhood}>
              <Scene3D />
            </SceneSettingsProvider>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold">Camera Settings</h3>
                <p className="text-neutral-400">Configure CCTV camera names and RTSP feeds for this site.</p>
              </div>
              <Button onClick={addCamera} className="bg-blue-600 hover:bg-blue-500">
                <Plus className="w-4 h-4 mr-2" /> Add Camera
              </Button>
            </div>

            <div className="space-y-4">
              {cameras.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-12 text-center">
                  <CameraIcon className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <p className="text-neutral-500">No cameras configured yet.</p>
                </div>
              ) : (
                cameras.map((camera) => {
                  const isFromSitePlan = extractedCameras.some(ec => ec.id === camera.id);
                  return (
                    <div key={camera.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-end gap-6 group">
                      <div className="flex-1 space-y-4">
                        {isFromSitePlan && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-600/30">
                              Map-Configured Camera
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-neutral-500">Camera Name</Label>
                            <Input 
                              value={camera.name}
                              onChange={(e) => updateCamera(camera.id, "name", e.target.value)}
                              placeholder="e.g. Front Entrance"
                              className="bg-neutral-950 border-neutral-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-widest text-neutral-500">RTSP Feed URL</Label>
                            <div className="relative">
                              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                              <Input 
                                value={camera.rtspFeed}
                                onChange={(e) => updateCamera(camera.id, "rtspFeed", e.target.value)}
                                placeholder="rtsp://admin:password@ip:port/stream"
                                className="bg-neutral-950 border-neutral-800 pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isFromSitePlan && (
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => removeCamera(camera.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {cameras.length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving || showSaved}
                  className={cn(
                    "px-8 transition-all duration-300",
                    showSaved ? "bg-emerald-500 hover:bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : showSaved ? (
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Saved Successfully
                    </span>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="max-w-4xl mx-auto p-8 h-full">
            <h3 className="text-2xl font-bold mb-4">Alerts</h3>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
              <Bell className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">No active alerts at this time.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

