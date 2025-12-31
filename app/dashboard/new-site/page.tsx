"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { 
  Neighborhood, 
  Building, 
  Road, 
  TowerCCTV, 
  Floor, 
  Room, 
  Furniture, 
  FurnitureItem,
  CCTV
} from "../../floorplan/model";
import Scene3D from "../../scene";
import { SceneSettingsProvider, useSceneSettings } from "../../floorplan/context";
import { 
  Plus, 
  Trash2, 
  Save, 
  Box, 
  Map as MapIcon, 
  Camera, 
  Layers, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  MousePointer2,
  Activity,
  Home,
  Monitor,
  Eye,
  Settings,
  X,
  Square
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

type WizardStep = "NEIGHBORHOOD" | "BUILDING_DETAILS" | "FINALIZE";

export default function NewSiteWizard() {
  const [neighborhood, setNeighborhood] = useState<Neighborhood>({
    name: "New Site Plan",
    buildings: [],
    roads: [],
    towerCctvs: []
  });

  return (
    <SceneSettingsProvider neighborhood={neighborhood}>
      <NewSiteWizardContent neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
    </SceneSettingsProvider>
  );
}

function NewSiteWizardContent({ 
  neighborhood, 
  setNeighborhood 
}: { 
  neighborhood: Neighborhood, 
  setNeighborhood: React.Dispatch<React.SetStateAction<Neighborhood>> 
}) {
  const { activeCameraId, setActiveCameraId } = useSceneSettings();
  const [step, setStep] = useState<WizardStep>("NEIGHBORHOOD");
  
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"ROAD" | "BUILDING" | "TOWER_CAM" | "SELECT">("BUILDING");
  const [activeInteriorTool, setActiveInteriorTool] = useState<"ROOM" | "FURNITURE" | "CCTV">("ROOM");
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<Furniture>(Furniture.Table);
  
  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{x: number, y: number} | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{x: number, y: number} | null>(null);

  const currentBuilding = useMemo(() => 
    neighborhood.buildings.find(b => b.id === selectedBuildingId),
    [neighborhood.buildings, selectedBuildingId]
  );

  const currentFloor = useMemo(() => 
    currentBuilding?.floors.find(f => f.id === selectedFloorId),
    [currentBuilding, selectedFloorId]
  );

  const currentBuildingCenter = useMemo(() => {
    if (!currentBuilding) return { x: 0, y: 0 };
    const dim = currentBuilding.floors[0]?.dimensions || { x: 20, y: 20 };
    return {
      x: currentBuilding.position.x + dim.x / 2,
      y: currentBuilding.position.y + dim.y / 2
    };
  }, [currentBuilding]);

  const selectedCamera = useMemo(() => {
    if (!activeCameraId) return null;
    // Check tower cams
    const towerCam = neighborhood.towerCctvs?.find(c => c.id === activeCameraId);
    if (towerCam) return { ...towerCam, type: 'TOWER' };
    
    // Check indoor cams
    for (const b of neighborhood.buildings) {
      for (const f of b.floors) {
        for (const r of f.rooms) {
          const cam = r.sensors?.cctvs?.find(c => c.id === activeCameraId);
          if (cam) return { ...cam, type: 'INDOOR', buildingId: b.id, floorId: f.id, roomId: r.id };
        }
      }
    }
    return null;
  }, [neighborhood, activeCameraId]);

  // Canvas coordinates to world coordinates (centered, 1 unit = 5px)
  const scale = step === "NEIGHBORHOOD" ? 5 : 20; // Zoom in for building details
  
  const toWorld = (px: number, py: number, canvas: HTMLCanvasElement) => {
    if (step === "NEIGHBORHOOD") {
      return {
        x: (px - canvas.width / 2) / scale,
        y: (py - canvas.height / 2) / scale
      };
    } else {
      // Offset by building center when in building details
      const bPos = currentBuilding?.position || {x: 0, y: 0};
      const bDim = currentBuilding?.floors[0]?.dimensions || {x: 0, y: 0};
      return {
        x: (px - canvas.width / 2) / scale + bPos.x + bDim.x / 2,
        y: (py - canvas.height / 2) / scale + bPos.y + bDim.y / 2
      };
    }
  };

  const fromWorld = (x: number, y: number, canvas: HTMLCanvasElement) => {
    if (step === "NEIGHBORHOOD") {
      return {
        x: x * scale + canvas.width / 2,
        y: y * scale + canvas.height / 2
      };
    } else {
      const bPos = currentBuilding?.position || {x: 0, y: 0};
      const bDim = currentBuilding?.floors[0]?.dimensions || {x: 0, y: 0};
      return {
        x: (x - (bPos.x + bDim.x / 2)) * scale + canvas.width / 2,
        y: (y - (bPos.y + bDim.y / 2)) * scale + canvas.height / 2
      };
    }
  };

  const updateCamera = (id: string, updates: Partial<CCTV | TowerCCTV>) => {
    setNeighborhood(prev => {
      // Update tower cams
      if (prev.towerCctvs?.find(c => c.id === id)) {
        return {
          ...prev,
          towerCctvs: prev.towerCctvs.map(c => c.id === id ? { ...c, ...updates } as TowerCCTV : c)
        };
      }
      
      // Update indoor cams
      return {
        ...prev,
        buildings: prev.buildings.map(b => ({
          ...b,
          floors: b.floors.map(f => ({
            ...f,
            rooms: f.rooms.map(r => ({
              ...r,
              sensors: {
                ...r.sensors,
                cctvs: r.sensors?.cctvs?.map(c => c.id === id ? { ...c, ...updates } : c)
              }
            }))
          }))
        }))
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to parent
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      const gridSize = 20;
      
      if (step === "NEIGHBORHOOD") {
        // Absolute grid for Neighborhood
        const startY = (canvas.height / 2) % gridSize;
        for(let y = startY; y < canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        const startX = (canvas.width / 2) % gridSize;
        for(let x = startX; x < canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Origin lines at world center
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, canvas.height/2); ctx.lineTo(canvas.width, canvas.height/2); ctx.stroke();

        // Draw Roads
        neighborhood.roads.forEach(road => {
          const start = fromWorld(road.start.x, road.start.y, canvas);
          const end = fromWorld(road.end.x, road.end.y, canvas);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = road.width * scale;
          ctx.lineCap = 'square';
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        });

        // Draw Buildings
        neighborhood.buildings.forEach(b => {
          const pos = fromWorld(b.position.x, b.position.y, canvas);
          const dim = b.floors[0]?.dimensions || {x: 10, y: 10};
          const isSelected = selectedBuildingId === b.id;
          ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)';
          ctx.fillRect(pos.x, pos.y, dim.x * scale, dim.y * scale);
          ctx.strokeStyle = isSelected ? '#3b82f6' : '#334155';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.strokeRect(pos.x, pos.y, dim.x * scale, dim.y * scale);
        });

        // Draw Tower CCTVs
        neighborhood.towerCctvs?.forEach(cam => {
          const pos = fromWorld(cam.position.x, cam.position.y, canvas);
          const isSelected = activeCameraId === cam.id;
          
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate((cam.yaw || 0) * Math.PI / 180);
          
          // Calculate cone size based on pitch (smaller as it points down more)
          const coneSize = 60 * Math.cos((cam.pitch || 0) * Math.PI / 180);
          
          ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.15)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const fovRad = (cam.fov * Math.PI) / 180;
          ctx.arc(0, 0, coneSize, -fovRad/2 - Math.PI/2, fovRad/2 - Math.PI/2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          
          ctx.fillStyle = '#ef4444';
          ctx.beginPath(); ctx.arc(pos.x, pos.y, isSelected ? 6 : 4, 0, Math.PI * 2); ctx.fill();
          if (isSelected) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      } else if (step === "BUILDING_DETAILS" && currentBuilding) {
        const bDim = currentBuilding.floors[0]?.dimensions || {x: 20, y: 20};
        const bPos2D = fromWorld(currentBuilding.position.x, currentBuilding.position.y, canvas);
        const bCenter2D = fromWorld(currentBuildingCenter.x, currentBuildingCenter.y, canvas);

        // Grid aligned to building center
        const startY = bCenter2D.y % gridSize;
        for(let y = startY; y < canvas.height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        const startX = bCenter2D.x % gridSize;
        for(let x = startX; x < canvas.width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Origin lines at building center (the "0,0" point for rooms)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bCenter2D.x, 0); ctx.lineTo(bCenter2D.x, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, bCenter2D.y); ctx.lineTo(canvas.width, bCenter2D.y); ctx.stroke();

        // Draw building background (more visible)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(bPos2D.x, bPos2D.y, bDim.x * scale, bDim.y * scale);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(bPos2D.x, bPos2D.y, bDim.x * scale, bDim.y * scale);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(currentBuilding.name.toUpperCase(), bPos2D.x + 10, bPos2D.y + 25);

        // Draw Rooms in current floor
        currentFloor?.rooms.forEach(room => {
          const bPos = currentBuilding.position;
          const rPos = fromWorld(bPos.x + room.position.x, bPos.y + room.position.y, canvas);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(rPos.x, rPos.y, room.dimensions.x * scale, room.dimensions.y * scale);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(rPos.x, rPos.y, room.dimensions.x * scale, room.dimensions.y * scale);
          
          ctx.fillStyle = '#3b82f6';
          ctx.font = 'bold 9px Inter';
          ctx.fillText(room.name.toUpperCase(), rPos.x + 5, rPos.y + 12);

          // Draw furniture in room
          room.furniture.forEach(item => {
             const fPos = fromWorld(bPos.x + room.position.x + item.position.x, bPos.y + room.position.y + item.position.y, canvas);
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.fillRect(fPos.x - 5, fPos.y - 5, 10, 10);
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 1;
             ctx.strokeRect(fPos.x - 5, fPos.y - 5, 10, 10);
          });

          // Draw CCTVs in room
          room.sensors?.cctvs?.forEach(cam => {
             const cPos = fromWorld(bPos.x + room.position.x + cam.position.x, bPos.y + room.position.y + cam.position.y, canvas);
             const isSelected = activeCameraId === cam.id;
             
             ctx.save();
             ctx.translate(cPos.x, cPos.y);
             ctx.rotate((cam.yaw || 0) * Math.PI / 180);
             
             const coneSize = 40 * Math.cos((cam.pitch || 0) * Math.PI / 180);
             
             ctx.fillStyle = isSelected ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)';
             ctx.beginPath();
             ctx.moveTo(0, 0);
             const fovRad = (cam.fov * Math.PI) / 180;
             ctx.arc(0, 0, coneSize, -fovRad/2 - Math.PI/2, fovRad/2 - Math.PI/2);
             ctx.closePath();
             ctx.fill();
             ctx.restore();
             
             ctx.fillStyle = '#ef4444';
             ctx.beginPath(); ctx.arc(cPos.x, cPos.y, isSelected ? 5 : 3, 0, Math.PI * 2); ctx.fill();
             if (isSelected) {
               ctx.strokeStyle = '#fff';
               ctx.lineWidth = 2;
               ctx.stroke();
             }
          });
        });
      }

      // Draw Active Preview
      if (isDrawing && drawStart && currentMousePos) {
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        
        const tool = step === "NEIGHBORHOOD" ? activeTool : activeInteriorTool;
        
        if (tool === "ROAD" || tool === "ROOM") {
          if (tool === "ROAD") {
            ctx.beginPath();
            ctx.moveTo(drawStart.x, drawStart.y);
            ctx.lineTo(currentMousePos.x, currentMousePos.y);
            ctx.stroke();
          } else {
            ctx.strokeRect(
              drawStart.x, 
              drawStart.y, 
              currentMousePos.x - drawStart.x, 
              currentMousePos.y - drawStart.y
            );
          }
        } else if (tool === "BUILDING") {
          ctx.strokeRect(
            drawStart.x, 
            drawStart.y, 
            currentMousePos.x - drawStart.x, 
            currentMousePos.y - drawStart.y
          );
        } else if (tool === "TOWER_CAM" || tool === "CCTV") {
          ctx.beginPath();
          ctx.arc(currentMousePos.x, currentMousePos.y, 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [neighborhood, isDrawing, drawStart, currentMousePos, activeTool, activeInteriorTool, selectedBuildingId, step, selectedFloorId, currentBuilding, currentFloor]);

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tool = step === "NEIGHBORHOOD" ? activeTool : activeInteriorTool;
    const worldPos = toWorld(x, y, canvas);

    // 1. Always try camera selection first (priority interaction)
    const clickedTowerCam = neighborhood.towerCctvs?.find(c => {
      const pos = fromWorld(c.position.x, c.position.y, canvas);
      return Math.hypot(x - pos.x, y - pos.y) < 15; // Slightly larger hit area for easier selection
    });

    if (clickedTowerCam) {
      setActiveCameraId(clickedTowerCam.id);
      setSelectedBuildingId(null);
      return;
    }

    if (step === "BUILDING_DETAILS" && currentBuilding) {
      for (const r of currentFloor?.rooms || []) {
        const clickedCam = r.sensors?.cctvs?.find(c => {
          const bPos = currentBuilding.position;
          const cPos = fromWorld(bPos.x + r.position.x + c.position.x, bPos.y + r.position.y + c.position.y, canvas);
          return Math.hypot(x - cPos.x, y - cPos.y) < 12;
        });
        if (clickedCam) {
          setActiveCameraId(clickedCam.id);
          return;
        }
      }
    }

    // 2. If no camera clicked, try selecting building/room
    if (step === "NEIGHBORHOOD") {
      const clickedBuilding = neighborhood.buildings.find(b => {
        const dim = b.floors[0]?.dimensions || {x: 10, y: 10};
        return worldPos.x >= b.position.x && worldPos.x <= b.position.x + dim.x &&
               worldPos.y >= b.position.y && worldPos.y <= b.position.y + dim.y;
      });
      
      if (clickedBuilding) {
        setSelectedBuildingId(clickedBuilding.id);
        setActiveCameraId(null);
        setSelectedFloorId(clickedBuilding.floors[0]?.id || null);
        return; // Don't start drawing if we just selected a building
      }
    } else if (step === "BUILDING_DETAILS" && currentBuilding) {
      const clickedRoom = currentFloor?.rooms.find(r => {
        const bPos = currentBuilding.position;
        const rx = bPos.x + r.position.x;
        const ry = bPos.y + r.position.y;
        return worldPos.x >= rx && worldPos.x <= rx + r.dimensions.x &&
               worldPos.y >= ry && worldPos.y <= ry + r.dimensions.y;
      });
      
      if (clickedRoom) {
        // Room selected, but we don't have room-specific settings yet
        // Clear camera selection
        setActiveCameraId(null);
        // If tool is FURNITURE or CCTV, we want to allow drawing inside the room, 
        // so we don't return here.
      } else {
        setActiveCameraId(null);
      }
    }

    // 3. Fallback to drawing if no priority selection happened
    setIsDrawing(true);
    setDrawStart({x, y});
    setCurrentMousePos({x, y});
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCurrentMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || !currentMousePos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startWorld = toWorld(drawStart.x, drawStart.y, canvas);
    const endWorld = toWorld(currentMousePos.x, currentMousePos.y, canvas);

    if (step === "NEIGHBORHOOD") {
      if (activeTool === "ROAD") {
        const newRoad: Road = {
          id: `road-${Date.now()}`,
          start: startWorld,
          end: endWorld,
          width: 4
        };
        setNeighborhood(prev => ({ ...prev, roads: [...prev.roads, newRoad] }));
      } else if (activeTool === "BUILDING") {
        const width = Math.abs(endWorld.x - startWorld.x);
        const height = Math.abs(endWorld.y - startWorld.y);
        if (width > 2 && height > 2) {
          const newBuilding: Building = {
            id: `building-${Date.now()}`,
            name: `Building ${neighborhood.buildings.length + 1}`,
            position: { x: Math.min(startWorld.x, endWorld.x), y: Math.min(startWorld.y, endWorld.y) },
            floors: [
              {
                id: `floor-${Date.now()}`,
                level: 0,
                height: 3,
                dimensions: { x: width, y: height },
                rooms: []
              }
            ]
          };
          setNeighborhood(prev => ({ ...prev, buildings: [...prev.buildings, newBuilding] }));
          setSelectedBuildingId(newBuilding.id);
          setSelectedFloorId(newBuilding.floors[0].id);
        }
      } else if (activeTool === "TOWER_CAM") {
        const newCam: TowerCCTV = {
          id: `tower-cam-${Date.now()}`,
          name: `Tower Cam ${(neighborhood.towerCctvs?.length || 0) + 1}`,
          position: endWorld,
          height: 2,
          towerHeight: 12,
          fov: 90,
          yaw: 0,
          pitch: 45
        };
        setNeighborhood(prev => ({ ...prev, towerCctvs: [...(prev.towerCctvs || []), newCam] }));
      }
    } else if (step === "BUILDING_DETAILS" && selectedBuildingId && selectedFloorId) {
      const bPos = currentBuilding?.position || {x: 0, y: 0};
      
      if (activeInteriorTool === "ROOM") {
        const width = Math.abs(endWorld.x - startWorld.x);
        const height = Math.abs(endWorld.y - startWorld.y);
        const newRoom: Room = {
          id: `room-${Date.now()}`,
          name: `Room ${currentFloor?.rooms.length || 0 + 1}`,
          dimensions: { x: width, y: height },
          position: { 
            x: Math.min(startWorld.x, endWorld.x) - bPos.x, 
            y: Math.min(startWorld.y, endWorld.y) - bPos.y 
          },
          furniture: [],
          sensors: { cctvs: [] }
        };
        
        setNeighborhood(prev => ({
          ...prev,
          buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
            ...b,
            floors: b.floors.map(f => f.id === selectedFloorId ? {
              ...f,
              rooms: [...f.rooms, newRoom]
            } : f)
          } : b)
        }));
      } else if (activeInteriorTool === "FURNITURE") {
        // Find which room we are in
        const room = currentFloor?.rooms.find(r => {
          const rx = r.position.x + bPos.x;
          const ry = r.position.y + bPos.y;
          return endWorld.x >= rx && endWorld.x <= rx + r.dimensions.x &&
                 endWorld.y >= ry && endWorld.y <= ry + r.dimensions.y;
        });
        
        if (room) {
          const newFurniture: FurnitureItem = {
            type: selectedFurnitureType,
            position: { 
              x: endWorld.x - bPos.x - room.position.x, 
              y: endWorld.y - bPos.y - room.position.y 
            },
            rotation: 0
          };
          
          setNeighborhood(prev => ({
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
        }
      } else if (activeInteriorTool === "CCTV") {
        const room = currentFloor?.rooms.find(r => {
          const rx = r.position.x + bPos.x;
          const ry = r.position.y + bPos.y;
          return endWorld.x >= rx && endWorld.x <= rx + r.dimensions.x &&
                 endWorld.y >= ry && endWorld.y <= ry + r.dimensions.y;
        });

        if (room) {
          const newCam: CCTV = {
            id: `cam-${Date.now()}`,
            name: `Cam ${ (room.sensors?.cctvs?.length || 0) + 1}`,
            fov: 90,
            position: { 
              x: endWorld.x - bPos.x - room.position.x, 
              y: endWorld.y - bPos.y - room.position.y 
            },
            height: 2.5,
            yaw: 0,
            pitch: 30
          };
          
          setNeighborhood(prev => ({
            ...prev,
            buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
              ...b,
              floors: b.floors.map(f => f.id === selectedFloorId ? {
                ...f,
                rooms: f.rooms.map(r => r.id === room.id ? {
                  ...r,
                  sensors: {
                    ...r.sensors,
                    cctvs: [...(r.sensors?.cctvs || []), newCam]
                  }
                } : r)
              } : f)
            } : b)
          }));
        }
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentMousePos(null);
  };

  const handleNext = () => {
    if (step === "NEIGHBORHOOD") setStep("BUILDING_DETAILS");
    else if (step === "BUILDING_DETAILS") setStep("FINALIZE");
  };

  const handleBack = () => {
    if (step === "BUILDING_DETAILS") setStep("NEIGHBORHOOD");
    else if (step === "FINALIZE") setStep("BUILDING_DETAILS");
  };

  const deleteBuilding = (id: string) => {
    setNeighborhood(prev => ({
      ...prev,
      buildings: prev.buildings.filter(b => b.id !== id)
    }));
    if (selectedBuildingId === id) setSelectedBuildingId(null);
  };

  const deleteRoad = (id: string) => {
    setNeighborhood(prev => ({
      ...prev,
      roads: prev.roads.filter(r => r.id !== id)
    }));
  };

  const deleteCam = (id: string) => {
    setNeighborhood(prev => ({
      ...prev,
      towerCctvs: prev.towerCctvs?.filter(c => c.id !== id)
    }));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      {/* Left Sidebar - Controls */}
      <div className="w-80 border-r border-white/10 bg-black flex flex-col z-20 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Wizard</h1>
              <p className="text-lg font-black tracking-tight uppercase tracking-tighter">New Site Plan</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === "NEIGHBORHOOD" ? "bg-primary shadow-[0_0_10px_rgba(0,210,255,0.5)]" : "bg-white/10")} />
            <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === "BUILDING_DETAILS" ? "bg-primary shadow-[0_0_10px_rgba(0,210,255,0.5)]" : "bg-white/10")} />
            <div className={cn("h-1 flex-1 rounded-full transition-all duration-500", step === "FINALIZE" ? "bg-primary shadow-[0_0_10px_rgba(0,210,255,0.5)]" : "bg-white/10")} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {step === "NEIGHBORHOOD" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              {selectedCamera && (
                <section className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-2">
                      <Camera className="w-3 h-3" /> Camera Settings
                    </h3>
                    <button onClick={() => setActiveCameraId(null)} className="text-red-400/40 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                        <span>Yaw</span>
                        <span className="text-red-400">{selectedCamera.yaw}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360" 
                        value={selectedCamera.yaw || 0}
                        onChange={(e) => updateCamera(activeCameraId!, { yaw: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                        <span>Pitch</span>
                        <span className="text-red-400">{selectedCamera.pitch}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="90" 
                        value={selectedCamera.pitch || 0}
                        onChange={(e) => updateCamera(activeCameraId!, { pitch: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Drawing Tools</h3>
                <div className="grid grid-cols-2 gap-2">
                  <ToolButton 
                    active={activeTool === "ROAD"} 
                    onClick={() => setActiveTool("ROAD")} 
                    icon={<Activity className="w-4 h-4" />} 
                    label="Road" 
                  />
                  <ToolButton 
                    active={activeTool === "BUILDING"} 
                    onClick={() => setActiveTool("BUILDING")} 
                    icon={<Home className="w-4 h-4" />} 
                    label="Building" 
                  />
                  <ToolButton 
                    active={activeTool === "TOWER_CAM"} 
                    onClick={() => setActiveTool("TOWER_CAM")} 
                    icon={<Camera className="w-4 h-4" />} 
                    label="Tower Cam" 
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Layers</h3>
                  <Badge variant="outline" className="text-[9px] bg-white/5 border-white/10 text-white/40">{neighborhood.buildings.length + neighborhood.roads.length + (neighborhood.towerCctvs?.length || 0)} Total</Badge>
                </div>
                <div className="space-y-1">
                  {neighborhood.buildings.length === 0 && neighborhood.roads.length === 0 && neighborhood.towerCctvs?.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                      <p className="text-[10px] text-white/20 uppercase tracking-widest">Canvas is empty</p>
                    </div>
                  )}
                  {neighborhood.buildings.map(b => (
                    <div key={b.id} className={cn("group flex flex-col p-3 rounded-xl border transition-all", selectedBuildingId === b.id ? "bg-primary/10 border-primary/40" : "bg-white/5 border-white/5 hover:border-white/10")}>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedBuildingId(b.id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Home className={cn("w-4 h-4", selectedBuildingId === b.id ? "text-primary" : "text-white/20")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", selectedBuildingId === b.id ? "text-white" : "text-white/40")}>{b.name}</span>
                        </button>
                        <button 
                          onClick={() => deleteBuilding(b.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {selectedBuildingId === b.id && (
                        <div className="mt-3 pt-3 border-t border-primary/20">
                          <Input 
                            value={b.name} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newName = e.target.value;
                              setNeighborhood(prev => ({
                                ...prev,
                                buildings: prev.buildings.map(build => build.id === b.id ? { ...build, name: newName } : build)
                              }));
                            }}
                            className="h-7 text-[10px] bg-black/40 border-white/10 focus:border-primary text-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {neighborhood.roads.map(r => (
                    <div key={r.id} className={cn("group flex flex-col p-3 rounded-xl border transition-all", selectedBuildingId === null && activeCameraId === null ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-white/5 border-white/5 hover:border-white/10")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Activity className="w-4 h-4 text-white/20" />
                          <Input 
                            value={r.name || `Road ${r.id.split('-')[1].slice(-4)}`}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newName = e.target.value;
                              setNeighborhood(prev => ({
                                ...prev,
                                roads: prev.roads.map(road => road.id === r.id ? { ...road, name: newName } : road)
                              }));
                            }}
                            className="h-6 flex-1 text-[10px] bg-transparent border-none focus:ring-0 p-0 font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                          />
                        </div>
                        <button 
                          onClick={() => deleteRoad(r.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {neighborhood.towerCctvs?.map(c => (
                    <div key={c.id} className={cn("group flex flex-col p-3 rounded-xl border transition-all", activeCameraId === c.id ? "bg-red-500/10 border-red-500/40" : "bg-white/5 border-white/5 hover:border-white/10")}>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => {
                            setActiveCameraId(c.id);
                            setSelectedBuildingId(null);
                          }}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <Camera className={cn("w-4 h-4", activeCameraId === c.id ? "text-red-500" : "text-white/20")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", activeCameraId === c.id ? "text-white" : "text-white/40")}>{c.name}</span>
                        </button>
                        <button 
                          onClick={() => deleteCam(c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {activeCameraId === c.id && (
                        <div className="mt-3 pt-3 border-t border-red-500/20">
                          <Input 
                            value={c.name} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newName = e.target.value;
                              setNeighborhood(prev => ({
                                ...prev,
                                towerCctvs: prev.towerCctvs?.map(cam => cam.id === c.id ? { ...cam, name: newName } : cam)
                              }));
                            }}
                            className="h-7 text-[10px] bg-black/40 border-white/10 focus:border-red-500 text-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === "BUILDING_DETAILS" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
               {selectedCamera && (
                <section className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-2">
                      <Camera className="w-3 h-3" /> Camera Settings
                    </h3>
                    <button onClick={() => setActiveCameraId(null)} className="text-red-400/40 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                        <span>Yaw</span>
                        <span className="text-red-400">{selectedCamera.yaw}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="360" 
                        value={selectedCamera.yaw || 0}
                        onChange={(e) => updateCamera(activeCameraId!, { yaw: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                        <span>Pitch</span>
                        <span className="text-red-400">{selectedCamera.pitch}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="90" 
                        value={selectedCamera.pitch || 0}
                        onChange={(e) => updateCamera(activeCameraId!, { pitch: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>
                </section>
              )}

               <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Select Building</h3>
                <div className="space-y-2">
                  {neighborhood.buildings.map(b => (
                    <button 
                      key={b.id}
                      onClick={() => {
                        setSelectedBuildingId(b.id);
                        setSelectedFloorId(b.floors[0]?.id || null);
                      }}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between",
                        selectedBuildingId === b.id ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(0,210,255,0.1)]" : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Home className={cn("w-4 h-4", selectedBuildingId === b.id ? "text-primary" : "text-white/20")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{b.name}</span>
                      </div>
                      {selectedBuildingId === b.id && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                  {neighborhood.buildings.length === 0 && (
                    <p className="text-[10px] text-white/20 uppercase tracking-widest italic">No buildings available. Go back to draw.</p>
                  )}
                </div>
              </section>

              {currentBuilding && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Floors</h3>
                    <button 
                      onClick={() => {
                        const newLevel = currentBuilding.floors.length;
                        const newFloor: Floor = {
                          id: `floor-${Date.now()}`,
                          level: newLevel,
                          height: 3,
                          dimensions: currentBuilding.floors[0].dimensions,
                          rooms: []
                        };
                        setNeighborhood(prev => ({
                          ...prev,
                          buildings: prev.buildings.map(b => b.id === selectedBuildingId ? { ...b, floors: [...b.floors, newFloor] } : b)
                        }));
                        setSelectedFloorId(newFloor.id);
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >
                      + Add Floor
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentBuilding.floors.map(f => (
                      <button 
                        key={f.id}
                        onClick={() => setSelectedFloorId(f.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          selectedFloorId === f.id ? "bg-primary border-primary text-white shadow-[0_0_10px_rgba(0,210,255,0.3)]" : "bg-white/5 border-white/5 text-white/40"
                        )}
                      >
                        Level {f.level}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Interior Elements</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <ToolButton 
                        active={activeInteriorTool === "ROOM"} 
                        onClick={() => setActiveInteriorTool("ROOM")} 
                        icon={<Square className="w-4 h-4" />} 
                        label="Room" 
                      />
                      <ToolButton 
                        active={activeInteriorTool === "FURNITURE"} 
                        onClick={() => setActiveInteriorTool("FURNITURE")} 
                        icon={<Box className="w-4 h-4" />} 
                        label="Furniture" 
                      />
                      <ToolButton 
                        active={activeInteriorTool === "CCTV"} 
                        onClick={() => setActiveInteriorTool("CCTV")} 
                        icon={<Camera className="w-4 h-4" />} 
                        label="CCTV" 
                      />
                    </div>
                    
                    {activeInteriorTool === "FURNITURE" && (
                      <div className="p-3 bg-white/5 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                         <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">Select Type</h4>
                         <div className="grid grid-cols-2 gap-1">
                            {Object.values(Furniture).map(f => (
                              <button 
                                key={f}
                                onClick={() => setSelectedFurnitureType(f)}
                                className={cn(
                                  "px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all",
                                  selectedFurnitureType === f ? "bg-primary border-primary text-white" : "bg-black/20 border-white/5 text-white/40 hover:border-white/10"
                                )}
                              >
                                {f}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Floor Summary</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                       {currentFloor?.rooms.map(room => (
                         <div key={room.id} className="space-y-1">
                           <div className="p-3 bg-white/5 rounded-xl space-y-2 group border border-transparent hover:border-white/5 transition-all">
                              <div className="flex items-center justify-between">
                                <Input 
                                  value={room.name} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const newName = e.target.value;
                                    setNeighborhood(prev => ({
                                      ...prev,
                                      buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                                        ...b,
                                        floors: b.floors.map(f => f.id === selectedFloorId ? {
                                          ...f,
                                          rooms: f.rooms.map(r => r.id === room.id ? { ...r, name: newName } : r)
                                        } : f)
                                      } : b)
                                    }));
                                  }}
                                  className="h-6 w-32 text-[10px] bg-transparent border-none focus:ring-0 p-0 font-bold text-white/60 hover:text-white"
                                />
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[8px] h-4 bg-white/5 text-white/30 border-none">{room.furniture.length} F</Badge>
                                  <Badge variant="outline" className="text-[8px] h-4 bg-red-500/10 text-red-400/60 border-none">{room.sensors?.cctvs?.length || 0} C</Badge>
                                  <button 
                                    onClick={() => {
                                      setNeighborhood(prev => ({
                                        ...prev,
                                        buildings: prev.buildings.map(b => b.id === selectedBuildingId ? {
                                          ...b,
                                          floors: b.floors.map(f => f.id === selectedFloorId ? {
                                            ...f,
                                            rooms: f.rooms.filter(r => r.id !== room.id)
                                          } : f)
                                        } : b)
                                      }));
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                                  >
                                     <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                           </div>
                           {/* Indoor Camera List for this room */}
                           <div className="pl-4 space-y-1">
                             {room.sensors?.cctvs?.map(cam => (
                               <button 
                                 key={cam.id}
                                 onClick={() => setActiveCameraId(cam.id)}
                                 className={cn(
                                   "w-full flex items-center justify-between p-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                   activeCameraId === cam.id ? "bg-red-500/20 text-white border border-red-500/30" : "bg-white/5 text-white/30 hover:bg-white/10"
                                 )}
                               >
                                 <div className="flex items-center gap-2">
                                   <Camera className={cn("w-3 h-3", activeCameraId === cam.id ? "text-red-500" : "text-white/20")} />
                                   <span>{cam.name}</span>
                                 </div>
                                 {activeCameraId === cam.id && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                               </button>
                             ))}
                           </div>
                         </div>
                       ))}
                       {(!currentFloor?.rooms || currentFloor.rooms.length === 0) && (
                         <p className="text-[9px] text-white/10 italic text-center py-4">No rooms defined for this floor</p>
                       )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {step === "FINALIZE" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <section className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Plan Name</Label>
                <Input 
                  value={neighborhood.name} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNeighborhood({...neighborhood, name: e.target.value})}
                  className="bg-white/5 border-white/10 focus:border-primary text-white font-black uppercase tracking-widest h-12 rounded-xl"
                  placeholder="ENTER SITE NAME..."
                />
              </section>
              
              <div className="grid grid-cols-2 gap-2">
                <SummaryCard label="Buildings" value={neighborhood.buildings.length} icon={<Home className="w-4 h-4" />} />
                <SummaryCard label="Roads" value={neighborhood.roads.length} icon={<Activity className="w-4 h-4" />} />
                <SummaryCard label="Cameras" value={(neighborhood.towerCctvs?.length || 0)} icon={<Camera className="w-4 h-4" />} />
                <SummaryCard label="Floors" value={neighborhood.buildings.reduce((acc, b) => acc + b.floors.length, 0)} icon={<Layers className="w-4 h-4" />} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/50 space-y-3">
          {step !== "FINALIZE" ? (
            <Button 
              onClick={handleNext} 
              variant="default" 
              className="w-full py-7 text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl"
              disabled={step === "NEIGHBORHOOD" && neighborhood.buildings.length === 0}
            >
              Continue <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button variant="default" className="w-full py-7 text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl">
              <Save className="mr-2 w-4 h-4" /> Finalize Site
            </Button>
          )}
          {step !== "NEIGHBORHOOD" && (
            <button onClick={handleBack} className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">
              Return to Previous
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Floating Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            <div className="px-5 py-2.5 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,210,255,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Interactive Blueprint</span>
            </div>
          </div>
          
          <div className="px-2 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-1 pointer-events-auto shadow-2xl">
             <button className="px-4 py-2 flex items-center gap-2 text-primary">
                <Eye className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">3D Preview Active</span>
             </button>
          </div>
        </div>

        {/* The Viewport Content */}
        <div className="flex-1 flex flex-row overflow-hidden bg-[#050505]">
           {/* 2D Canvas Area - The Blueprint */}
           <div className="flex-[2] bg-[#0a0a0a] relative overflow-hidden group border-r border-white/10 shadow-2xl">
              <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-blue-500/10 backdrop-blur-xl rounded-xl border border-blue-500/20 shadow-2xl pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Interactive Blueprint (2D)</span>
                </div>
              </div>

              <canvas 
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10" 
              />
              
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 pointer-events-none transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 z-20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                  {activeTool === "SELECT" ? "Click to select objects" : `Drag on grid to create ${activeTool.toLowerCase()}`}
                </p>
              </div>
           </div>

           {/* 3D Preview Panel - The Projection */}
           <div className="flex-1 min-w-[350px] bg-[#080808] relative group flex flex-col shadow-2xl overflow-hidden border-l border-white/5">
              <SceneSettingsProvider neighborhood={neighborhood}>
                <div className="flex-1 relative">
                  <Scene3D />
                </div>
              </SceneSettingsProvider>
           </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all active:scale-95",
        active 
          ? "bg-primary/15 border-primary text-primary shadow-[inset_0_0_20px_rgba(0,210,255,0.05)]" 
          : "bg-white/5 border-white/5 text-white/30 hover:border-white/10 hover:text-white"
      )}
    >
      <div className={cn("transition-transform duration-300", active && "scale-110")}>{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SummaryCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-white/30">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black tracking-tighter text-white">{value}</p>
    </div>
  );
}


