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
  Video
} from "lucide-react"
import Link from "next/link"
import { Neighborhood } from "@/app/floorplan/model"
import { SceneSettingsProvider } from "@/app/floorplan/context"
import Scene3D from "@/app/scene"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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

type Tab = "home" | "settings" | "alerts"

export default function SitePlanView({ sitePlan }: SitePlanViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [cameras, setCameras] = useState<Camera[]>(sitePlan.cameras)
  const [isSaving, setIsSaving] = useState(false)

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
    try {
      const response = await fetch(`/api/siteplans/${sitePlan.id}/cameras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameras }),
      })
      if (response.ok) {
        router.refresh()
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
                cameras.map((camera) => (
                  <div key={camera.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-end gap-6 group">
                    <div className="flex-1 space-y-4">
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
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => removeCamera(camera.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {cameras.length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={saveSettings} 
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 px-8"
                >
                  {isSaving ? "Saving..." : "Save Configuration"}
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

