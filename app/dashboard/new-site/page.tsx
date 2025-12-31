"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Layout, 
  Maximize2, 
  Layers, 
  Box, 
  Settings2,
  Trash2,
  Plus,
  Eye,
  Camera,
  Map as MapIcon,
  Building2,
  Move,
  MousePointer2,
  Hand,
  Sofa,
  Bed,
  Table as TableIcon,
  Armchair
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Neighborhood, Building, Road, Floor, Room, FurnitureItem, TowerCCTV, CCTV, Furniture } from "@/app/floorplan/model"
import { Vec2 } from "@/app/floorplan/types"
import { SceneSettingsProvider } from "@/app/floorplan/context"
import Scene3D from "@/app/scene"
import { neighborhoodTo3D } from "@/app/floorplan/3d"

// --- Types ---

type WizardStep = 1 | 2 | 3;
type Tool = 'building' | 'road' | 'tower-cctv' | 'room' | 'furniture' | 'cctv' | 'select' | 'move' | 'hand';

interface Selection {
  type: 'building' | 'road' | 'tower-cctv' | 'floor' | 'room' | 'furniture' | 'cctv';
  id: string;
  parentId?: string;
  grandParentId?: string;
}

// --- Defaults ---

const DEFAULT_NEIGHBORHOOD: Neighborhood = {
  name: "New Neighborhood",
  buildings: [],
  roads: [],
  towerCctvs: []
};

// --- Wizard Component ---

export default function NewSiteWizard() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [neighborhood, setNeighborhood] = useState<Neighborhood>(DEFAULT_NEIGHBORHOOD)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [is3DPanelOpen, setIs3DPanelOpen] = useState(true)
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<Furniture>(Furniture.Table)
  const [panelWidth, setPanelWidth] = useState(400) // px
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const isResizing = useRef(false)

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = window.innerWidth - e.clientX
      setPanelWidth(Math.max(200, Math.min(window.innerWidth * 0.6, newWidth)))
    }
    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = 'default'
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Derived 3D data for the preview
  const neighborhood3D = useMemo(() => neighborhoodTo3D(neighborhood), [neighborhood]);

  const handleNext = () => {
    if (step === 1) {
      // Auto-select building if we're moving to Step 2
      if (selection?.type === 'building') {
        setSelectedBuildingId(selection.id);
        const b = neighborhood.buildings.find(b => b.id === selection.id);
        if (b && b.floors.length > 0) {
          setSelectedFloorId(b.floors[0].id);
        }
      } else if (!selectedBuildingId && neighborhood.buildings.length > 0) {
        // Fallback to first building
        setSelectedBuildingId(neighborhood.buildings[0].id);
        setSelectedFloorId(neighborhood.buildings[0].floors[0].id);
      }
      setStep(2)
    }
    else if (step === 2) setStep(3)
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/siteplans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: neighborhood.name,
          data: neighborhood,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to save site plan")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const currentBuilding = neighborhood.buildings.find(b => b.id === selectedBuildingId);
  const currentFloor = currentBuilding?.floors.find(f => f.id === selectedFloorId);

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Site Wizard</h1>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black tracking-tight uppercase truncate max-w-[150px]">{neighborhood.name}</h2>
              {step === 2 && currentBuilding && (
                <>
                  <ChevronRight className="w-3 h-3 text-neutral-700" />
                  <div className="flex items-center gap-2 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20 group relative">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    <select 
                      value={selectedBuildingId || ""}
                      onChange={(e) => {
                        const bId = e.target.value;
                        setSelectedBuildingId(bId);
                        const b = neighborhood.buildings.find(b => b.id === bId);
                        if (b && b.floors.length > 0) {
                          setSelectedFloorId(b.floors[0].id);
                        }
                        setSelection(null);
                      }}
                      className="bg-transparent border-none text-sm font-black tracking-tight uppercase text-blue-400 focus:outline-none cursor-pointer hover:text-blue-300 transition-colors pr-1"
                    >
                      {neighborhood.buildings.map(b => (
                        <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="flex gap-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                step === s ? "bg-blue-600 border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" : 
                step > s ? "bg-emerald-600 border-emerald-500" : "bg-neutral-800 border-neutral-700 text-neutral-500"
              )}>
                {step > s ? "✓" : s}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                step === s ? "text-white" : "text-neutral-500"
              )}>
                {s === 1 ? "Site Layout" : s === 2 ? "Building Details" : "Finalize"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-neutral-400 hover:text-white">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button size="sm" onClick={handleNext} className="bg-blue-600 hover:bg-blue-500 px-6 font-bold uppercase tracking-widest text-[10px]">
              Next Step <ChevronRight className="ml-1 w-3 h-3" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 px-6 font-bold uppercase tracking-widest text-[10px]">
              {isLoading ? "Saving..." : <><Save className="mr-1 w-3 h-3" /> Save Plan</>}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        {step < 3 && (
          <aside className="w-16 border-r border-neutral-800 bg-neutral-900 flex flex-col items-center py-4 gap-4 z-20">
            <ToolbarButton 
              active={tool === 'select'} 
              onClick={() => setTool('select')} 
              icon={<MousePointer2 className="w-5 h-5" />} 
              label="Select" 
            />
            <ToolbarButton 
              active={tool === 'move'} 
              onClick={() => setTool('move')} 
              icon={<Move className="w-5 h-5" />} 
              label="Move" 
            />
            <ToolbarButton 
              active={tool === 'hand'} 
              onClick={() => setTool('hand')} 
              icon={<Hand className="w-5 h-5" />} 
              label="Pan" 
            />
            <div className="w-8 h-[1px] bg-neutral-800 my-2" />
            
            {step === 1 && (
              <>
                <ToolbarButton 
                  active={tool === 'building'} 
                  onClick={() => setTool('building')} 
                  icon={<Building2 className="w-5 h-5" />} 
                  label="Building" 
                />
                <ToolbarButton 
                  active={tool === 'road'} 
                  onClick={() => setTool('road')} 
                  icon={<MapIcon className="w-5 h-5" />} 
                  label="Road" 
                />
                <ToolbarButton 
                  active={tool === 'tower-cctv'} 
                  onClick={() => setTool('tower-cctv')} 
                  icon={<Camera className="w-5 h-5" />} 
                  label="Tower CCTV" 
                />
              </>
            )}

            {step === 2 && (
              <>
                <ToolbarButton 
                  active={tool === 'room'} 
                  onClick={() => setTool('room')} 
                  icon={<Box className="w-5 h-5" />} 
                  label="Room" 
                />
                <div className="w-8 h-[1px] bg-neutral-800 my-1" />
                <ToolbarButton 
                  active={tool === 'furniture' && selectedFurnitureType === Furniture.Table} 
                  onClick={() => { setTool('furniture'); setSelectedFurnitureType(Furniture.Table); }} 
                  icon={<TableIcon className="w-5 h-5" />} 
                  label="Table" 
                />
                <ToolbarButton 
                  active={tool === 'furniture' && selectedFurnitureType === Furniture.Bed} 
                  onClick={() => { setTool('furniture'); setSelectedFurnitureType(Furniture.Bed); }} 
                  icon={<Bed className="w-5 h-5" />} 
                  label="Bed" 
                />
                <ToolbarButton 
                  active={tool === 'furniture' && selectedFurnitureType === Furniture.Sofa} 
                  onClick={() => { setTool('furniture'); setSelectedFurnitureType(Furniture.Sofa); }} 
                  icon={<Sofa className="w-5 h-5" />} 
                  label="Sofa" 
                />
                <ToolbarButton 
                  active={tool === 'furniture' && selectedFurnitureType === Furniture.Chair} 
                  onClick={() => { setTool('furniture'); setSelectedFurnitureType(Furniture.Chair); }} 
                  icon={<Armchair className="w-5 h-5" />} 
                  label="Chair" 
                />
                <div className="w-8 h-[1px] bg-neutral-800 my-1" />
                <ToolbarButton 
                  active={tool === 'cctv'} 
                  onClick={() => setTool('cctv')} 
                  icon={<Camera className="w-5 h-5" />} 
                  label="Internal CCTV" 
                />
              </>
            )}
          </aside>
        )}

        {/* Canvas Area */}
        <div className="flex-1 bg-neutral-950 overflow-hidden relative">
          <AnimatePresence>
            {step === 2 && currentBuilding && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute top-6 left-6 z-10 pointer-events-none"
              >
                <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 leading-none mb-1">Editing Building</div>
                    <div className="text-lg font-black uppercase tracking-tight text-white leading-none">{currentBuilding.name}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step < 3 ? (
            <SitePlanCanvas 
              step={step}
              tool={tool}
              selectedFurnitureType={selectedFurnitureType}
              neighborhood={neighborhood}
              setNeighborhood={setNeighborhood}
              selectedBuildingId={selectedBuildingId}
              setSelectedBuildingId={setSelectedBuildingId}
              selectedFloorId={selectedFloorId}
              setSelectedFloorId={setSelectedFloorId}
              selection={selection}
              setSelection={setSelection}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white">
               <SceneSettingsProvider neighborhood={neighborhood}>
                <Scene3D />
              </SceneSettingsProvider>
            </div>
          )}

          {/* Layers Pane (Overlay on Canvas) */}
          {step < 3 && (
            <div className="absolute right-6 top-6 bottom-6 w-64 pointer-events-none flex flex-col gap-4">
               {/* Properties Panel (Top Right) */}
               <AnimatePresence>
                {selection && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl p-4 overflow-hidden"
                  >
                    <PropertiesPanel 
                      selection={selection} 
                      neighborhood={neighborhood} 
                      setNeighborhood={setNeighborhood} 
                    />
                  </motion.div>
                )}
               </AnimatePresence>

               {/* Layers Pane */}
               <div className="pointer-events-auto flex-1 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Layers</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                   <LayersList 
                    step={step}
                    neighborhood={neighborhood}
                    setNeighborhood={setNeighborhood}
                    selection={selection}
                    setSelection={setSelection}
                    selectedBuildingId={selectedBuildingId}
                    setSelectedBuildingId={setSelectedBuildingId}
                    selectedFloorId={selectedFloorId}
                    setSelectedFloorId={setSelectedFloorId}
                   />
                </div>
               </div>
            </div>
          )}
        </div>

        {/* Right 3D Preview Panel (Step 1 & 2) */}
        {step < 3 && is3DPanelOpen && (
          <div 
            style={{ width: panelWidth }}
            className="border-l border-neutral-800 bg-white relative flex-shrink-0"
          >
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                <Eye className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Live 3D View</span>
              </div>
            </div>
            <div className="w-full h-full">
               <SceneSettingsProvider neighborhood={neighborhood}>
                <Scene3D />
              </SceneSettingsProvider>
            </div>
            
            {/* Resize handle */}
            <div 
              onMouseDown={(e) => {
                isResizing.current = true;
                document.body.style.cursor = 'col-resize';
              }}
              className="absolute inset-y-0 -left-1 w-2 cursor-col-resize hover:bg-blue-500/50 transition-colors z-50" 
            />
          </div>
        )}
      </main>
    </div>
  )
}

// --- Sub-components ---

function ToolbarButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all",
        active ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
      )}
      title={label}
    >
      {icon}
      <div className="absolute left-14 bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-neutral-700 z-50">
        {label}
      </div>
    </button>
  )
}

// --- SitePlanCanvas (The most complex part) ---

function SitePlanCanvas({ 
  step, 
  tool, 
  selectedFurnitureType,
  neighborhood, 
  setNeighborhood,
  selectedBuildingId,
  setSelectedBuildingId,
  selectedFloorId,
  setSelectedFloorId,
  selection,
  setSelection
}: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(40) // px per unit
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null)
  const [mousePos, setMousePos] = useState<Vec2 | null>(null)
  const [dragStart, setDragStart] = useState<Vec2 | null>(null)

  const moveObject = (sel: Selection, dx: number, dy: number) => {
    setNeighborhood((prev: Neighborhood) => {
        const updated = JSON.parse(JSON.stringify(prev));
        if (sel.type === 'building') {
            const b = updated.buildings.find((b: Building) => b.id === sel.id);
            if (b) { b.position.x += dx; b.position.y += dy; }
        } else if (sel.type === 'road') {
            const r = updated.roads.find((r: Road) => r.id === sel.id);
            if (r) {
                r.start.x += dx; r.start.y += dy;
                r.end.x += dx; r.end.y += dy;
            }
        } else if (sel.type === 'tower-cctv') {
            const t = updated.towerCctvs?.find((t: TowerCCTV) => t.id === sel.id);
            if (t) { t.position.x += dx; t.position.y += dy; }
        } else if (sel.type === 'room') {
            const b = updated.buildings.find((b: Building) => b.id === sel.grandParentId);
            const f = b?.floors.find((f: Floor) => f.id === sel.parentId);
            const r = f?.rooms.find((r: Room) => r.id === sel.id);
            if (r) { r.position.x += dx; r.position.y += dy; }
        } else if (sel.type === 'cctv') {
            for (const b of updated.buildings) {
                for (const f of b.floors) {
                    for (const r of f.rooms) {
                        const c = r.sensors?.cctvs?.find((c: CCTV) => c.id === sel.id);
                        if (c) { c.position.x += dx; c.position.y += dy; return updated; }
                    }
                }
            }
        } else if (sel.type === 'furniture') {
            for (const b of updated.buildings) {
                for (const f of b.floors) {
                    for (const r of f.rooms) {
                        const fur = r.furniture.find((fur: any) => fur.id === sel.id);
                        if (fur) { fur.position.x += dx; fur.position.y += dy; return updated; }
                    }
                }
            }
        }
        return updated;
    });
  };

  // Canvas coordinate transform
  const screenToWorld = (x: number, y: number): Vec2 => {
    return {
      x: (x - offset.x) / zoom,
      y: (y - offset.y) / zoom
    }
  }

  const worldToScreen = (x: number, y: number): Vec2 => {
    return {
      x: x * zoom + offset.x,
      y: y * zoom + offset.y
    }
  }

  // Effect to center building in Step 2
  useEffect(() => {
    if (step === 2 && selectedBuildingId) {
      const building = neighborhood.buildings.find((b: Building) => b.id === selectedBuildingId);
      if (building && canvasRef.current) {
        const { width, height } = canvasRef.current;
        setOffset({
          x: width / 2 - building.position.x * zoom,
          y: height / 2 - building.position.y * zoom
        })
      }
    } else if (step === 1 && canvasRef.current) {
        // Initial center
        const { width, height } = canvasRef.current;
        setOffset({ x: width / 2, y: height / 2 });
    }
  }, [step, selectedBuildingId]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = parent.clientHeight;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid
      drawGrid(ctx, canvas.width, canvas.height, offset, zoom);

      if (step === 1) {
        // Draw Roads
        neighborhood.roads.forEach((road: Road) => drawRoad(ctx, road, worldToScreen));
        // Draw Buildings
        neighborhood.buildings.forEach((building: Building) => drawBuilding(ctx, building, worldToScreen, selection?.id === building.id));
        // Draw Tower CCTVs
        neighborhood.towerCctvs.forEach((cctv: TowerCCTV) => drawTowerCCTV(ctx, cctv, worldToScreen, selection?.id === cctv.id));
      } else if (step === 2) {
        // Draw Roads for context
        neighborhood.roads.forEach((road: Road) => drawRoad(ctx, road, worldToScreen));
        // Draw Tower CCTVs for context
        neighborhood.towerCctvs.forEach((cctv: TowerCCTV) => drawTowerCCTV(ctx, cctv, worldToScreen, selection?.id === cctv.id));

        // Draw Buildings
        neighborhood.buildings.forEach((building: Building) => {
          const isSelected = selectedBuildingId === building.id;
          const currentFloor = isSelected && selectedFloorId 
            ? building.floors.find((f: Floor) => f.id === selectedFloorId) 
            : building.floors[0];

          drawBuilding(ctx, building, worldToScreen, isSelected || selection?.id === building.id, isSelected, currentFloor);

          if (isSelected && selectedFloorId) {
            const floor = building.floors.find((f: Floor) => f.id === selectedFloorId);
            if (floor) {
              // Draw Rooms
              floor.rooms.forEach((room: Room) => drawRoom(ctx, room, building.position, worldToScreen, selection?.id === room.id));
              
              // Internal CCTVs
              floor.rooms.forEach((room: Room) => {
                room.sensors?.cctvs?.forEach((cctv: CCTV) => {
                  drawInternalCCTV(ctx, cctv, room.position, building.position, worldToScreen, selection?.id === cctv.id);
                });
              });

              // Furniture
              floor.rooms.forEach((room: Room) => {
                room.furniture.forEach((f: FurnitureItem) => {
                   drawFurniture(ctx, f, room.position, building.position, worldToScreen, selection?.id === f.id);
                });
              });
            }
          }
        });
      }

      // Draw Preview if drawing
      if (isDrawing && drawStart && mousePos) {
        drawPreview(ctx, tool, drawStart, mousePos, worldToScreen);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [neighborhood, offset, zoom, isDrawing, drawStart, mousePos, selection, step, tool, selectedBuildingId, selectedFloorId]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);

    if (e.button === 1 || (e.button === 0 && tool === 'hand')) {
      // Pan start
      setDragStart({ x, y });
      return;
    }

    if (e.button === 0 && (tool === 'select' || tool === 'move')) {
      // Try to select something
      const hit = findHitObject(worldPos, step, neighborhood, selectedBuildingId, selectedFloorId);
      if (hit) {
        setSelection(hit);
        if (tool === 'move') {
          setDragStart({ x, y });
        }
        return;
      } else if (tool === 'select') {
        setSelection(null);
      }
    }

    if (tool !== 'select' && tool !== 'move' && tool !== 'hand') {
      setIsDrawing(true);
      setDrawStart(worldPos);
      setMousePos(worldPos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);

    if (dragStart) {
      if (tool === 'hand' || e.button === 1) {
        setOffset(prev => ({
          x: prev.x + (x - dragStart.x),
          y: prev.y + (y - dragStart.y)
        }));
      } else if (tool === 'move' && selection) {
        // Move object
        const dx = (x - dragStart.x) / zoom;
        const dy = (y - dragStart.y) / zoom;
        moveObject(selection, dx, dy);
      }
      setDragStart({ x, y });
      return;
    }

    if (isDrawing) {
      if (e.shiftKey && tool === 'road' && drawStart) {
        // Snap to horizontal or vertical
        const dx = Math.abs(worldPos.x - drawStart.x);
        const dy = Math.abs(worldPos.y - drawStart.y);
        if (dx > dy) {
          setMousePos({ x: worldPos.x, y: drawStart.y });
        } else {
          setMousePos({ x: drawStart.x, y: worldPos.y });
        }
      } else {
        setMousePos(worldPos);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart) {
      setDragStart(null);
      return;
    }

    if (isDrawing && drawStart && mousePos) {
      finishDrawing(drawStart, mousePos);
    }
    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    const newZoom = Math.max(5, Math.min(100, zoom * delta));
    
    // Zoom around mouse
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldPos = screenToWorld(mouseX, mouseY);
    
    setZoom(newZoom);
    setOffset({
      x: mouseX - worldPos.x * newZoom,
      y: mouseY - worldPos.y * newZoom
    });
  };

  const finishDrawing = (start: Vec2, end: Vec2) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    if (step === 1) {
      if (tool === 'building') {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(start.x - end.x);
        const h = Math.abs(start.y - end.y);
        if (w < 1 || h < 1) return;

        const newBuilding: Building = {
          id,
          name: `Building ${neighborhood.buildings.length + 1}`,
          position: { x: x + w/2, y: y + h/2 },
          floors: [{
            id: Math.random().toString(36).substr(2, 9),
            level: 0,
            height: 4,
            dimensions: { x: w, y: h },
            rooms: []
          }]
        };
        setNeighborhood((prev: Neighborhood) => ({
          ...prev,
          buildings: [...prev.buildings, newBuilding]
        }));
        setSelection({ type: 'building', id });
      } else if (tool === 'road') {
        const newRoad: Road = {
          id,
          name: `Road ${neighborhood.roads.length + 1}`,
          start,
          end,
          width: 4
        };
        setNeighborhood((prev: Neighborhood) => ({
          ...prev,
          roads: [...prev.roads, newRoad]
        }));
      } else if (tool === 'tower-cctv') {
        const newTower: TowerCCTV = {
          id,
          name: `Tower ${neighborhood.towerCctvs?.length || 0 + 1}`,
          position: start,
          height: 1.5,
          towerHeight: 10,
          fov: 90,
          yaw: 0,
          pitch: -45
        };
        setNeighborhood((prev: Neighborhood) => ({
          ...prev,
          towerCctvs: [...(prev.towerCctvs || []), newTower]
        }));
        setSelection({ type: 'tower-cctv', id });
      }
    } else if (step === 2 && selectedBuildingId && selectedFloorId) {
        const building = neighborhood.buildings.find((b: Building) => b.id === selectedBuildingId);
        if (!building) return;

        // Relative to building center
        const relStart = { x: start.x - building.position.x, y: start.y - building.position.y };
        const relEnd = { x: end.x - building.position.x, y: end.y - building.position.y };

        if (tool === 'room') {
            const x = Math.min(relStart.x, relEnd.x);
            const y = Math.min(relStart.y, relEnd.y);
            const w = Math.abs(relStart.x - relEnd.x);
            const h = Math.abs(relStart.y - relEnd.y);
            if (w < 0.5 || h < 0.5) return;

            const newRoom: Room = {
                id,
                name: `Room ${building.floors.find((f: Floor) => f.id === selectedFloorId)?.rooms.length || 0 + 1}`,
                dimensions: { x: w, y: h },
                position: { x, y },
                furniture: []
            };

            setNeighborhood((prev: Neighborhood) => ({
                ...prev,
                buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                    ...b,
                    floors: b.floors.map(f => f.id === selectedFloorId ? {
                        ...f,
                        rooms: [...f.rooms, newRoom]
                    } : f)
                } : b)
            }));
            setSelection({ type: 'room', id, parentId: selectedFloorId, grandParentId: selectedBuildingId });
        } else if (tool === 'cctv') {
            // Find room under click
            const floor = building.floors.find((f: Floor) => f.id === selectedFloorId);
            const room = floor?.rooms.find((r: Room) => 
                relStart.x >= r.position.x && relStart.x <= r.position.x + r.dimensions.x &&
                relStart.y >= r.position.y && relStart.y <= r.position.y + r.dimensions.y
            );

            if (room) {
                const newCCTV: CCTV = {
                    id,
                    name: `CCTV ${room.sensors?.cctvs?.length || 0 + 1}`,
                    position: { x: relStart.x - room.position.x, y: relStart.y - room.position.y },
                    height: 2.5,
                    fov: 90,
                    yaw: 0,
                    pitch: -30
                };

                setNeighborhood((prev: Neighborhood) => ({
                    ...prev,
                    buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                        ...b,
                        floors: b.floors.map(f => f.id === selectedFloorId ? {
                            ...f,
                            rooms: f.rooms.map(r => r.id === room.id ? {
                                ...r,
                                sensors: { ...r.sensors, cctvs: [...(r.sensors?.cctvs || []), newCCTV] }
                            } : r)
                        } : f)
                    } : b)
                }));
                setSelection({ type: 'cctv', id, parentId: room.id, grandParentId: selectedFloorId });
            }
        } else if (tool === 'furniture') {
             // Find room under click
             const floor = building.floors.find((f: Floor) => f.id === selectedFloorId);
             const room = floor?.rooms.find((r: Room) => 
                 relStart.x >= r.position.x && relStart.x <= r.position.x + r.dimensions.x &&
                 relStart.y >= r.position.y && relStart.y <= r.position.y + r.dimensions.y
             );
 
             if (room) {
                 const newFurniture: FurnitureItem = {
                     id,
                     type: selectedFurnitureType || Furniture.Table,
                     position: { x: relStart.x - room.position.x, y: relStart.y - room.position.y },
                     rotation: 0,
                     scale: 1
                 };

                 setNeighborhood((prev: Neighborhood) => ({
                     ...prev,
                     buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                         ...b,
                         floors: b.floors.map(f => f.id === selectedFloorId ? {
                             ...f,
                             rooms: f.rooms.map(r => r.id === room.id ? {
                                 ...r,
                                 furniture: [...r.furniture, newFurniture]
                             } : r)
                         } : f)
                     } : b)
                 }));
                 setSelection({ type: 'furniture', id, parentId: room.id, grandParentId: selectedFloorId });
             }
        }
    }
  };

  return (
    <canvas 
      ref={canvasRef}
      className={cn(
        "w-full h-full",
        tool === 'hand' ? "cursor-grab active:cursor-grabbing" : 
        tool === 'move' ? "cursor-move" : 
        tool === 'select' ? "cursor-default" : "cursor-crosshair"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}

// --- Drawing Helpers ---

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, offset: { x: number, y: number }, zoom: number) {
  const startX = Math.floor(-offset.x / zoom);
  const endX = Math.ceil((width - offset.x) / zoom);
  const startY = Math.floor(-offset.y / zoom);
  const endY = Math.ceil((height - offset.y) / zoom);

  // Sub-grid (every 1 unit)
  ctx.strokeStyle = '#171717';
  ctx.lineWidth = 0.5;
  for (let x = startX; x <= endX; x++) {
    if (x % 5 === 0) continue;
    ctx.beginPath();
    ctx.moveTo(x * zoom + offset.x, 0);
    ctx.lineTo(x * zoom + offset.x, height);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y++) {
    if (y % 5 === 0) continue;
    ctx.beginPath();
    ctx.moveTo(0, y * zoom + offset.y);
    ctx.lineTo(width, y * zoom + offset.y);
    ctx.stroke();
  }

  // Main grid (every 5 units)
  ctx.strokeStyle = '#262626';
  ctx.lineWidth = 1.5;
  for (let x = startX; x <= endX; x++) {
    if (x % 5 !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(x * zoom + offset.x, 0);
    ctx.lineTo(x * zoom + offset.x, height);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#525252';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(x.toString(), x * zoom + offset.x + 4, 12);
  }

  for (let y = startY; y <= endY; y++) {
    if (y % 5 !== 0) continue;
    ctx.beginPath();
    ctx.moveTo(0, y * zoom + offset.y);
    ctx.lineTo(width, y * zoom + offset.y);
    ctx.stroke();

    ctx.fillStyle = '#525252';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(y.toString(), 4, y * zoom + offset.y - 4);
  }
}

function drawBuilding(ctx: CanvasRenderingContext2D, building: Building, toScreen: any, selected: boolean, outlineOnly = false, currentFloor?: Floor) {
  // Use current floor dimensions or first floor
  const floor = currentFloor || building.floors[0];
  const w = floor.dimensions.x;
  const h = floor.dimensions.y;
  const pos = toScreen(building.position.x - w/2, building.position.y - h/2);

  if (!outlineOnly) {
    ctx.fillStyle = selected ? 'rgba(37, 99, 235, 0.4)' : 'rgba(38, 38, 38, 0.6)';
    ctx.fillRect(pos.x, pos.y, w * (toScreen(1,0).x - toScreen(0,0).x), h * (toScreen(0,1).y - toScreen(0,0).y));
  }
  
  ctx.strokeStyle = selected ? '#3b82f6' : '#525252';
  ctx.lineWidth = selected ? 2 : 1;
  ctx.setLineDash(outlineOnly ? [5, 5] : []);
  ctx.strokeRect(pos.x, pos.y, w * (toScreen(1,0).x - toScreen(0,0).x), h * (toScreen(0,1).y - toScreen(0,0).y));
  ctx.setLineDash([]);

  if (!outlineOnly) {
    ctx.fillStyle = '#a3a3a3';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(building.name, pos.x + (w * (toScreen(1,0).x - toScreen(0,0).x)) / 2, pos.y - 5);
  }
}

function drawRoad(ctx: CanvasRenderingContext2D, road: Road, toScreen: any) {
  const start = toScreen(road.start.x, road.start.y);
  const end = toScreen(road.end.x, road.end.y);

  ctx.strokeStyle = '#404040';
  ctx.lineWidth = road.width * (toScreen(1,0).x - toScreen(0,0).x);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Dashed center line
  ctx.strokeStyle = '#737373';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTowerCCTV(ctx: CanvasRenderingContext2D, cctv: TowerCCTV, toScreen: any, selected: boolean) {
  const pos = toScreen(cctv.position.x, cctv.position.y);
  
  // Base
  ctx.fillStyle = selected ? '#3b82f6' : '#f43f5e';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // FOV cone
  const fovRad = (cctv.fov * Math.PI) / 180;
  const yawRad = ((cctv.yaw || 0) * Math.PI) / 180;
  
  ctx.fillStyle = selected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.1)';
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.arc(pos.x, pos.y, 40, yawRad - fovRad/2, yawRad + fovRad/2);
  ctx.closePath();
  ctx.fill();
}

function drawRoom(ctx: CanvasRenderingContext2D, room: Room, bPos: Vec2, toScreen: any, selected: boolean) {
    const pos = toScreen(bPos.x + room.position.x, bPos.y + room.position.y);
    const w = room.dimensions.x * (toScreen(1,0).x - toScreen(0,0).x);
    const h = room.dimensions.y * (toScreen(0,1).y - toScreen(0,0).y);

    ctx.fillStyle = selected ? 'rgba(37, 99, 235, 0.2)' : (room.color || 'rgba(64, 64, 64, 0.3)');
    ctx.fillRect(pos.x, pos.y, w, h);
    
    ctx.strokeStyle = selected ? '#3b82f6' : '#525252';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(pos.x, pos.y, w, h);

    ctx.fillStyle = '#a3a3a3';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, pos.x + w/2, pos.y + h/2);
}

function drawInternalCCTV(ctx: CanvasRenderingContext2D, cctv: CCTV, rPos: Vec2, bPos: Vec2, toScreen: any, selected: boolean) {
    const pos = toScreen(bPos.x + rPos.x + cctv.position.x, bPos.y + rPos.y + cctv.position.y);
    
    ctx.fillStyle = selected ? '#3b82f6' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
    ctx.fill();

    const fovRad = (cctv.fov * Math.PI) / 180;
    const yawRad = ((cctv.yaw || 0) * Math.PI) / 180;
    
    ctx.fillStyle = selected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 63, 94, 0.1)';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.arc(pos.x, pos.y, 25, yawRad - fovRad/2, yawRad + fovRad/2);
    ctx.closePath();
    ctx.fill();
}

function drawFurniture(ctx: CanvasRenderingContext2D, item: FurnitureItem, rPos: Vec2, bPos: Vec2, toScreen: any, selected: boolean) {
    const pos = toScreen(bPos.x + rPos.x + item.position.x, bPos.y + rPos.y + item.position.y);
    const size = 10 * (item.scale || 1);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((item.rotation || 0) * Math.PI / 180);
    
    ctx.fillStyle = selected ? 'rgba(37, 99, 235, 0.5)' : '#404040';
    ctx.strokeStyle = selected ? '#3b82f6' : '#737373';
    ctx.lineWidth = selected ? 2 : 1;
    
    if (item.type === Furniture.Table) {
        ctx.strokeRect(-size, -size/2, size*2, size);
        ctx.beginPath();
        ctx.moveTo(-size * 0.7, -size/2); ctx.lineTo(-size * 0.7, size/2);
        ctx.moveTo(size * 0.7, -size/2); ctx.lineTo(size * 0.7, size/2);
        ctx.stroke();
    } else if (item.type === Furniture.Bed) {
        ctx.strokeRect(-size, -size*1.3, size*2, size*2.6);
        // Pillows
        ctx.strokeRect(-size * 0.8, -size * 1.2, size * 0.6, size * 0.4);
        ctx.strokeRect(size * 0.2, -size * 1.2, size * 0.6, size * 0.4);
        // Blanket line
        ctx.beginPath();
        ctx.moveTo(-size, size * 0.2);
        ctx.lineTo(size, size * 0.2);
        ctx.stroke();
    } else if (item.type === Furniture.Sofa) {
        ctx.strokeRect(-size * 1.5, -size * 0.5, size * 3, size);
        // Arms
        ctx.strokeRect(-size * 1.5, -size * 0.5, size * 0.3, size);
        ctx.strokeRect(size * 1.2, -size * 0.5, size * 0.3, size);
        // Back rest
        ctx.strokeRect(-size * 1.5, -size * 0.5, size * 3, size * 0.3);
    } else if (item.type === Furniture.Chair) {
        ctx.strokeRect(-size * 0.5, -size * 0.5, size, size);
        // Back rest
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, -size * 0.5);
        ctx.lineTo(size * 0.5, -size * 0.5);
        ctx.stroke();
        // Arms (optional)
        ctx.strokeRect(-size * 0.5, -size * 0.5, size * 0.15, size);
        ctx.strokeRect(size * 0.35, -size * 0.5, size * 0.15, size);
    } else {
        ctx.strokeRect(-size/2, -size/2, size, size);
    }
    
    ctx.restore();
}

function drawPreview(ctx: CanvasRenderingContext2D, tool: Tool, start: Vec2, end: Vec2, toScreen: any) {
  const s = toScreen(start.x, start.y);
  const e = toScreen(end.x, end.y);

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.setLineDash([5, 5]);

  if (tool === 'building' || tool === 'room') {
    ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
  } else if (tool === 'road') {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
  } else if (tool === 'tower-cctv' || tool === 'cctv') {
    ctx.beginPath();
    ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'furniture') {
    ctx.strokeRect(s.x - 10, s.y - 10, 20, 20);
  }

  ctx.setLineDash([]);
}

// --- Layers & Properties ---

function PropertiesPanel({ selection, neighborhood, setNeighborhood }: any) {
  const item = findItem(selection, neighborhood);
  if (!item) return null;

  const updateProp = (key: string, value: any) => {
    setNeighborhood((prev: Neighborhood) => {
        // Deep clone or strategic update... for simplicity here:
        const updated = JSON.parse(JSON.stringify(prev));
        const target = findItem(selection, updated);
        if (target) target[key] = value;
        return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Properties</h3>
        <span className="text-[9px] font-bold text-neutral-500">{selection.type}</span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[9px] uppercase text-neutral-500 font-bold">Name</Label>
          <Input 
            value={item.name || ''} 
            onChange={(e) => updateProp('name', e.target.value)}
            className="h-8 text-xs bg-neutral-950 border-neutral-800"
          />
        </div>

        {(selection.type === 'tower-cctv' || selection.type === 'cctv') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">Yaw (deg)</Label>
                <Input 
                  type="number"
                  value={item.yaw || 0} 
                  onChange={(e) => updateProp('yaw', Number(e.target.value))}
                  className="h-8 text-xs bg-neutral-950 border-neutral-800"
                />
                <Slider 
                  value={[item.yaw || 0]} 
                  min={0} 
                  max={360} 
                  step={1} 
                  onValueChange={([val]) => updateProp('yaw', val)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">Pitch (deg)</Label>
                <Input 
                  type="number"
                  value={item.pitch || 0} 
                  onChange={(e) => updateProp('pitch', Number(e.target.value))}
                  className="h-8 text-xs bg-neutral-950 border-neutral-800"
                />
                <Slider 
                  value={[item.pitch || 0]} 
                  min={-90} 
                  max={90} 
                  step={1} 
                  onValueChange={([val]) => updateProp('pitch', val)}
                />
              </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">FOV</Label>
                <Input 
                  type="number"
                  value={item.fov || 90} 
                  onChange={(e) => updateProp('fov', Number(e.target.value))}
                  className="h-8 text-xs bg-neutral-950 border-neutral-800"
                />
                <Slider 
                  value={[item.fov || 90]} 
                  min={10} 
                  max={150} 
                  step={1} 
                  onValueChange={([val]) => updateProp('fov', val)}
                />
              </div>
          </>
        )}

        {selection.type === 'furniture' && (
          <div className="space-y-3">
            <div className="space-y-1">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">Type</Label>
                <select 
                    value={item.type}
                    onChange={(e) => updateProp('type', e.target.value)}
                    className="w-full h-8 text-xs bg-neutral-950 border border-neutral-800 rounded px-2"
                >
                    {Object.values(Furniture).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">Rotation (deg)</Label>
                <Input 
                  type="number"
                  value={item.rotation || 0} 
                  onChange={(e) => updateProp('rotation', Number(e.target.value))}
                  className="h-8 text-xs bg-neutral-950 border-neutral-800"
                />
                <Slider 
                  value={[item.rotation || 0]} 
                  min={0} 
                  max={360} 
                  step={1} 
                  onValueChange={([val]) => updateProp('rotation', val)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-[9px] uppercase text-neutral-500 font-bold">Scale</Label>
                <Input 
                  type="number"
                  value={item.scale || 1} 
                  onChange={(e) => updateProp('scale', Number(e.target.value))}
                  className="h-8 text-xs bg-neutral-950 border-neutral-800"
                />
                <Slider 
                  value={[item.scale || 1]} 
                  min={0.1} 
                  max={5} 
                  step={0.1} 
                  onValueChange={([val]) => updateProp('scale', val)}
                />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayersList({ 
    step, 
    neighborhood, 
    setNeighborhood, 
    selection, 
    setSelection,
    selectedBuildingId,
    setSelectedBuildingId,
    selectedFloorId,
    setSelectedFloorId
}: any) {
    const handleDelete = (type: string, id: string, pId?: string, gpId?: string) => {
        setNeighborhood((prev: Neighborhood) => {
            const updated = JSON.parse(JSON.stringify(prev));
            if (type === 'building') {
                updated.buildings = updated.buildings.filter((b: Building) => b.id !== id);
                if (selectedBuildingId === id) setSelectedBuildingId(null);
            } else if (type === 'road') {
                updated.roads = updated.roads.filter((r: Road) => r.id !== id);
            } else if (type === 'tower-cctv') {
                updated.towerCctvs = updated.towerCctvs.filter((t: TowerCCTV) => t.id !== id);
            } else if (type === 'room') {
                const b = updated.buildings.find((b: Building) => b.id === gpId);
                const f = b.floors.find((f: Floor) => f.id === pId);
                f.rooms = f.rooms.filter((r: Room) => r.id !== id);
            } else if (type === 'cctv') {
                const b = updated.buildings.find((b: Building) => b.id === gpId); // gpId is floorId for cctv
                const f = b.floors.find((f: Floor) => f.id === gpId);
                const r = f.rooms.find((r: Room) => r.id === pId);
                r.sensors.cctvs = r.sensors.cctvs.filter((c: CCTV) => c.id !== id);
            } else if (type === 'furniture') {
                const b = updated.buildings.find((b: Building) => b.id === selectedBuildingId);
                const f = b.floors.find((f: Floor) => f.id === gpId);
                const r = f.rooms.find((r: Room) => r.id === pId);
                r.furniture = r.furniture.filter((fur: FurnitureItem) => fur.id !== id);
            }
            return updated;
        });
        setSelection(null);
    };

    if (step === 1) {
        return (
            <div className="space-y-1">
                {neighborhood.buildings.map((b: Building) => (
                    <LayerItem 
                        key={b.id} 
                        name={b.name} 
                        active={selection?.id === b.id} 
                        onClick={() => setSelection({ type: 'building', id: b.id })}
                        onDetail={() => { setSelectedBuildingId(b.id); setSelectedFloorId(b.floors[0].id); }}
                        onDelete={() => handleDelete('building', b.id)}
                    />
                ))}
                {neighborhood.roads.map((r: Road) => (
                    <LayerItem 
                        key={r.id} 
                        name={r.name || 'Unnamed Road'} 
                        active={selection?.id === r.id} 
                        onClick={() => setSelection({ type: 'road', id: r.id })}
                        onDelete={() => handleDelete('road', r.id)}
                    />
                ))}
                {neighborhood.towerCctvs?.map((t: TowerCCTV) => (
                    <LayerItem 
                        key={t.id} 
                        name={t.name || 'Tower CCTV'} 
                        active={selection?.id === t.id} 
                        onClick={() => setSelection({ type: 'tower-cctv', id: t.id })}
                        onDelete={() => handleDelete('tower-cctv', t.id)}
                    />
                ))}
            </div>
        );
    }

    if (step === 2 && selectedBuildingId) {
        const building = neighborhood.buildings.find((b: Building) => b.id === selectedBuildingId);
        const floor = building?.floors.find((f: Floor) => f.id === selectedFloorId);
        
        return (
            <div className="space-y-4">
                <div className="px-3 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl mx-2 mt-1 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <div className="min-w-0">
                        <div className="text-[8px] font-black uppercase tracking-widest text-blue-500/70 leading-none mb-1">Building</div>
                        <div className="text-xs font-bold text-white truncate">{building?.name}</div>
                    </div>
                </div>

                <div className="space-y-1">
                    <span className="text-[9px] uppercase text-neutral-600 font-bold px-2">Floors</span>
                    {building?.floors.map((f: Floor) => (
                        <div 
                            key={f.id} 
                            onClick={() => setSelectedFloorId(f.id)}
                            className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                selectedFloorId === f.id ? "bg-blue-600/20 text-blue-400" : "hover:bg-neutral-800 text-neutral-400"
                            )}
                        >
                            <span className="text-[10px] font-bold">Floor {f.level}</span>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const newLevel = building!.floors.length;
                            const newFloor: Floor = {
                                id: Math.random().toString(36).substr(2, 9),
                                level: newLevel,
                                height: 4,
                                dimensions: building!.floors[0].dimensions,
                                rooms: []
                            };
                            setNeighborhood((prev: Neighborhood) => ({
                                ...prev,
                                buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                                    ...b,
                                    floors: [...b.floors, newFloor]
                                } : b)
                            }));
                        }}
                        className="w-full p-2 border border-dashed border-neutral-800 rounded-lg text-neutral-600 hover:text-neutral-400 hover:border-neutral-600 flex items-center justify-center gap-2 transition-all"
                    >
                        <Plus className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase">Add Floor</span>
                    </button>
                </div>

                <div className="space-y-1">
                    <span className="text-[9px] uppercase text-neutral-600 font-bold px-2">Inside Floor</span>
                    {floor?.rooms.map((r: Room) => (
                        <LayerItem 
                            key={r.id} 
                            name={r.name} 
                            active={selection?.id === r.id} 
                            onClick={() => setSelection({ type: 'room', id: r.id, parentId: selectedFloorId, grandParentId: selectedBuildingId })}
                            onDelete={() => handleDelete('room', r.id, selectedFloorId, selectedBuildingId)}
                        />
                    ))}
                    {floor?.rooms.flatMap((r: Room) => r.sensors?.cctvs?.map((c: CCTV) => (
                        <LayerItem 
                            key={c.id} 
                            name={c.name} 
                            active={selection?.id === c.id} 
                            icon={<Camera className="w-3 h-3" />}
                            onClick={() => setSelection({ type: 'cctv', id: c.id, parentId: r.id, grandParentId: selectedFloorId })}
                            onDelete={() => handleDelete('cctv', c.id, r.id, selectedFloorId)}
                        />
                    )) || [])}
                    {floor?.rooms.flatMap((r: Room) => r.furniture.map((f: FurnitureItem) => (
                        <LayerItem 
                            key={f.id} 
                            name={`${f.type}`} 
                            active={selection?.id === f.id} 
                            icon={f.type === Furniture.Sofa ? <Sofa className="w-3 h-3" /> : 
                                  f.type === Furniture.Bed ? <Bed className="w-3 h-3" /> :
                                  f.type === Furniture.Table ? <TableIcon className="w-3 h-3" /> :
                                  <Armchair className="w-3 h-3" />}
                            onClick={() => setSelection({ type: 'furniture', id: f.id, parentId: r.id, grandParentId: selectedFloorId })}
                            onDelete={() => handleDelete('furniture', f.id, r.id, selectedFloorId)}
                        />
                    )))}
                </div>
            </div>
        );
    }

    return null;
}

function LayerItem({ name, active, onClick, onDetail, onDelete, icon }: any) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all",
                active ? "bg-blue-600 text-white shadow-lg" : "hover:bg-neutral-800 text-neutral-400"
            )}
        >
            <div className="flex items-center gap-2">
                {icon || <Layout className="w-3 h-3" />}
                <span className="text-[10px] font-bold truncate max-w-[120px]">{name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onDetail && (
                    <button onClick={(e) => { e.stopPropagation(); onDetail(); }} className="p-1 hover:bg-white/20 rounded">
                        <Maximize2 className="w-3 h-3" />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-red-500/20 text-red-400 rounded">
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}

// --- Logic Helpers ---

function findItem(selection: Selection, neighborhood: Neighborhood): any {
    if (selection.type === 'building') return neighborhood.buildings.find(b => b.id === selection.id);
    if (selection.type === 'road') return neighborhood.roads.find(r => r.id === selection.id);
    if (selection.type === 'tower-cctv') return neighborhood.towerCctvs?.find(t => t.id === selection.id);
    
    if (selection.type === 'room') {
        const b = neighborhood.buildings.find(b => b.id === selection.grandParentId);
        const f = b?.floors.find(f => f.id === selection.parentId);
        return f?.rooms.find(r => r.id === selection.id);
    }
    
    if (selection.type === 'cctv') {
        // Here parentId is roomId, grandParentId is floorId
        // This is getting complicated with current structure, need a better find logic
        for (const b of neighborhood.buildings) {
            for (const f of b.floors) {
                for (const r of f.rooms) {
                    const c = r.sensors?.cctvs?.find(c => c.id === selection.id);
                    if (c) return c;
                }
            }
        }
    }

    if (selection.type === 'furniture') {
        for (const b of neighborhood.buildings) {
            for (const f of b.floors) {
                for (const r of f.rooms) {
                    const fur = r.furniture.find(fur => fur.id === selection.id);
                    if (fur) return fur;
                }
            }
        }
    }

    return null;
}

function findHitObject(pos: Vec2, step: number, neighborhood: Neighborhood, buildingId: string | null, floorId: string | null): Selection | null {
    if (step === 1) {
        // Check Tower CCTVs (circles)
        for (const t of neighborhood.towerCctvs || []) {
            const dist = Math.sqrt(Math.pow(pos.x - t.position.x, 2) + Math.pow(pos.y - t.position.y, 2));
            if (dist < 0.5) return { type: 'tower-cctv', id: t.id };
        }

        // Check Buildings (rects)
        for (const b of neighborhood.buildings) {
            const w = b.floors[0].dimensions.x;
            const h = b.floors[0].dimensions.y;
            if (pos.x >= b.position.x - w/2 && pos.x <= b.position.x + w/2 &&
                pos.y >= b.position.y - h/2 && pos.y <= b.position.y + h/2) {
                return { type: 'building', id: b.id };
            }
        }

        // Check Roads (lines)
        for (const r of neighborhood.roads) {
            // Distance from point to line segment
            const L2 = Math.pow(r.end.x - r.start.x, 2) + Math.pow(r.end.y - r.start.y, 2);
            if (L2 === 0) continue;
            let t = ((pos.x - r.start.x) * (r.end.x - r.start.x) + (pos.y - r.start.y) * (r.end.y - r.start.y)) / L2;
            t = Math.max(0, Math.min(1, t));
            const projX = r.start.x + t * (r.end.x - r.start.x);
            const projY = r.start.y + t * (r.end.y - r.start.y);
            const dist = Math.sqrt(Math.pow(pos.x - projX, 2) + Math.pow(pos.y - projY, 2));
            if (dist < (r.width || 4) / 2) return { type: 'road', id: r.id };
        }
    } else if (step === 2 && buildingId && floorId) {
        const building = neighborhood.buildings.find(b => b.id === buildingId);
        const floor = building?.floors.find(f => f.id === floorId);
        if (!building || !floor) return null;

        const relPos = { x: pos.x - building.position.x, y: pos.y - building.position.y };

        // Check Furniture
        for (const r of floor.rooms) {
            for (const f of r.furniture) {
                const fPos = { x: r.position.x + f.position.x, y: r.position.y + f.position.y };
                const dist = Math.sqrt(Math.pow(relPos.x - fPos.x, 2) + Math.pow(relPos.y - fPos.y, 2));
                if (dist < 0.3) return { type: 'furniture', id: f.id, parentId: r.id, grandParentId: floorId };
            }
        }

        // Check CCTVs
        for (const r of floor.rooms) {
            for (const c of r.sensors?.cctvs || []) {
                const cPos = { x: r.position.x + c.position.x, y: r.position.y + c.position.y };
                const dist = Math.sqrt(Math.pow(relPos.x - cPos.x, 2) + Math.pow(relPos.y - cPos.y, 2));
                if (dist < 0.2) return { type: 'cctv', id: c.id, parentId: r.id, grandParentId: floorId };
            }
        }

        // Check Rooms
        for (const r of floor.rooms) {
            if (relPos.x >= r.position.x && relPos.x <= r.position.x + r.dimensions.x &&
                relPos.y >= r.position.y && relPos.y <= r.position.y + r.dimensions.y) {
                return { type: 'room', id: r.id, parentId: floorId, grandParentId: buildingId };
            }
        }
    }

    return null;
}

