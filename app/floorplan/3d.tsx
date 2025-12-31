import { useMemo, useState, useRef, useEffect } from "react";
// @ts-ignore
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Furniture, type FurnitureItem, type Room, type Floor, type Building, type Neighborhood, type Road } from "./model";
import { type Vec2, type Vec3 } from "./types";
import { type CCTV, type TowerCCTV } from "./sensors";
import { useSceneSettings } from "./context";

// --- 3D Types ---

export type WallSegment = {
  position: Vec3;
  dimensions: Vec3;
};

export type Room3D = {
  id: string;
  name: string;
  walls: WallSegment[];
  furniture: FurnitureProps[];
  sensors: {
    cctvs: CCTV3D[];
  };
  bounds: {
    min: Vec3;
    max: Vec3;
  };
  color?: string;
};

export type CCTV3D = {
  id: string;
  name: string;
  fov: number;
  position: Vec3;
  worldPosition: Vec3;
  yaw: number; // radians
  pitch: number; // radians
  roomBounds?: {
    min: Vec3;
    max: Vec3;
  };
};

export type FurnitureProps = {
  type: Furniture;
  position: Vec3;
  rotation: number;
  scale?: number;
};

export type Floor3D = {
  id: string;
  position: Vec3;
  dimensions: Vec3;
  rooms: Room3D[];
};

export type Building3D = {
  id: string;
  name: string;
  position: Vec3;
  dimensions: Vec3;
  floors: Floor3D[];
};

export type Road3D = {
  id: string;
  position: Vec3;
  dimensions: { width: number; length: number };
  rotation: number; // Y-axis rotation
};

export type Neighborhood3D = {
  name: string;
  buildings: Building3D[];
  roads: Road3D[];
  towerCctvs: TowerCCTV3D[];
};

export type TowerCCTV3D = {
  id: string;
  name: string;
  fov: number;
  position: Vec3;
  worldPosition: Vec3;
  yaw: number; // radians
  pitch: number; // radians
  towerHeight: number;
};

// --- Helpers ---
const toVec3Array = (v: Vec3): [number, number, number] => [v.x, v.y, v.z];

// --- Conversion Logic ---

const FLOOR_THICKNESS = 0.1;
const WALL_THICKNESS = 0.1;

const furnitureTo3D = (item: FurnitureItem, currentY: number): FurnitureProps => ({
  type: item.type,
  position: { x: item.position.x, y: currentY, z: item.position.y },
  rotation: (item.rotation || 0) * Math.PI / 180,
  scale: item.scale,
});

const createWalls = (room: Room, currentY: number, floorHeight: number): WallSegment[] => {
  const { position, dimensions } = room;
  const walls: WallSegment[] = [];
  const wallHeight = floorHeight - FLOOR_THICKNESS;
  const wallY = currentY + wallHeight / 2;

  // Left wall
  walls.push({
    position: { x: position.x, y: wallY, z: position.y + dimensions.y / 2 },
    dimensions: { x: WALL_THICKNESS, y: wallHeight, z: dimensions.y },
  });
  // Right wall
  walls.push({
    position: { x: position.x + dimensions.x, y: wallY, z: position.y + dimensions.y / 2 },
    dimensions: { x: WALL_THICKNESS, y: wallHeight, z: dimensions.y },
  });
  // Top wall
  walls.push({
    position: { x: position.x + dimensions.x / 2, y: wallY, z: position.y },
    dimensions: { x: dimensions.x, y: wallHeight, z: WALL_THICKNESS },
  });
  // Bottom wall
  walls.push({
    position: { x: position.x + dimensions.x / 2, y: wallY, z: position.y + dimensions.y },
    dimensions: { x: dimensions.x, y: wallHeight, z: WALL_THICKNESS },
  });

  return walls;
};

const roomTo3D = (room: Room, currentY: number, floorHeight: number, buildingPosition: Vec3): Room3D => {
  const worldMin = { 
    x: room.position.x + buildingPosition.x, 
    y: currentY + buildingPosition.y, 
    z: room.position.y + buildingPosition.z 
  };
  const worldMax = { 
    x: worldMin.x + room.dimensions.x, 
    y: worldMin.y + floorHeight, 
    z: worldMin.z + room.dimensions.y 
  };

  return {
    id: room.id,
    name: room.name,
    walls: createWalls(room, currentY, floorHeight),
    furniture: room.furniture.map(f => furnitureTo3D(f, currentY)),
    sensors: {
      cctvs: (room.sensors?.cctvs || []).map((c, idx) => ({
        id: c.id,
        name: c.name || `${room.name} CAM ${idx + 1}`,
        fov: c.fov,
        position: { x: c.position.x, y: currentY + c.height, z: c.position.y },
        worldPosition: { 
          x: c.position.x + buildingPosition.x, 
          y: currentY + buildingPosition.y + c.height, 
          z: c.position.y + buildingPosition.z 
        },
        yaw: (c.yaw || 0) * Math.PI / 180,
        pitch: (c.pitch || 0) * Math.PI / 180,
        roomBounds: { min: worldMin, max: worldMax },
      })),
    },
    bounds: { min: worldMin, max: worldMax },
    color: room.color,
  };
};

export const floorTo3D = (floor: Floor, currentY: number, buildingPosition: Vec3): Floor3D => {
  return {
    id: floor.id,
    position: { x: 0, y: currentY, z: 0 },
    dimensions: { x: floor.dimensions.x, y: FLOOR_THICKNESS, z: floor.dimensions.y },
    rooms: floor.rooms.map(r => roomTo3D(r, currentY, floor.height, buildingPosition)),
  };
};

export const buildingTo3D = (building: Building): Building3D => {
  let currentY = 0;
  const floors3D: Floor3D[] = [];
  const buildingPosition = { x: building.position.x, y: 0, z: building.position.y };
  
  for (const floor of building.floors) {
    floors3D.push(floorTo3D(floor, currentY, buildingPosition));
    currentY += floor.height;
  }

  const maxDimensions = building.floors.reduce(
    (max, f) => ({
      x: Math.max(max.x, f.dimensions.x),
      y: Math.max(max.y, f.dimensions.y),
    }),
    { x: 0, y: 0 }
  );

  return {
    id: building.id,
    name: building.name,
    position: { x: building.position.x, y: 0, z: building.position.y },
    dimensions: { x: maxDimensions.x, y: currentY, z: maxDimensions.y },
    floors: floors3D,
  };
};

const roadTo3D = (road: Road): Road3D => {
  const dx = road.end.x - road.start.x;
  const dz = road.end.y - road.start.y;
  const length = Math.sqrt(dx * dx + dz * dz);
  return {
    id: road.id,
    position: { x: (road.start.x + road.end.x) / 2, y: 0, z: (road.start.y + road.end.y) / 2 },
    dimensions: { width: road.width, length },
    rotation: Math.atan2(dx, dz),
  };
};

export const neighborhoodTo3D = (neighborhood: Neighborhood): Neighborhood3D => ({
  name: neighborhood.name,
  buildings: neighborhood.buildings.map(buildingTo3D),
  roads: neighborhood.roads.map(roadTo3D),
  towerCctvs: (neighborhood.towerCctvs || []).map((t, idx) => {
    const pos = { x: t.position.x, y: t.towerHeight + t.height, z: t.position.y };
    return {
      id: t.id,
      name: t.name || `Tower CAM ${idx + 1}`,
      fov: t.fov,
      position: pos,
      worldPosition: pos,
      yaw: (t.yaw || 0) * Math.PI / 180,
      pitch: (t.pitch || 0) * Math.PI / 180,
      towerHeight: t.towerHeight,
    };
  }),
});

export const getAllCctvs = (neighborhood3D: Neighborhood3D) => {
  const cctvs: (CCTV3D | TowerCCTV3D)[] = [];
  neighborhood3D.buildings.forEach(b => {
    b.floors.forEach(f => {
      f.rooms.forEach(r => {
        cctvs.push(...(r.sensors?.cctvs || []));
      });
    });
  });
  cctvs.push(...(neighborhood3D.towerCctvs || []));
  return cctvs;
};

// --- React Rendering Components ---

export function Surface({ 
  position, 
  dimensions, 
  color = "#e0f2fe", 
  opacity = 0.3,
  showLines = true,
  depthWrite = false
}: { 
  position: Vec3; 
  dimensions: Vec3; 
  color?: string; 
  opacity?: number;
  showLines?: boolean;
  depthWrite?: boolean;
}) {
  const dimArray = useMemo(() => toVec3Array(dimensions), [dimensions]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...dimArray)), [dimArray]);
  
  return (
    <group position={toVec3Array(position)}>
      <mesh userData={{ isSurface: true }}>
        <boxGeometry args={dimArray} />
        <meshPhysicalMaterial 
          color={color} 
          transparent 
          opacity={opacity} 
          roughness={0.2} 
          metalness={0.1} 
          transmission={0.5} 
          thickness={0.2} 
          side={THREE.DoubleSide} 
          depthWrite={depthWrite} 
        />
      </mesh>
      {showLines && <Line geometry={edges} color="#3b82f6" opacity={0.8} thickness={0.01} />}
    </group>
  );
}

export function Line({ 
  geometry, 
  position = { x: 0, y: 0, z: 0 }, 
  color = "#3b82f6", 
  opacity = 1, 
  thickness = 0.02 
}: { 
  geometry: THREE.BufferGeometry; 
  position?: Vec3; 
  color?: string; 
  opacity?: number; 
  thickness?: number 
}) {
  const segments = useMemo(() => {
    const posAttr = geometry.getAttribute("position");
    if (!posAttr) return [];
    const pts = [];
    for (let i = 0; i < posAttr.count; i += 2) {
      const start = new THREE.Vector3().fromBufferAttribute(posAttr, i);
      const end = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
      
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      if (length < 0.001) continue;

      const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      const orientation = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0);
      const target = direction.clone().normalize();
      
      if (Math.abs(up.dot(target)) > 0.999) {
        orientation.lookAt(start, end, new THREE.Vector3(1, 0, 0));
      } else {
        orientation.lookAt(start, end, up);
      }
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
      
      pts.push({ 
        position: [center.x, center.y, center.z] as [number, number, number], 
        rotation: new THREE.Euler().setFromRotationMatrix(orientation), 
        length 
      });
    }
    return pts;
  }, [geometry]);

  return (
    <group position={toVec3Array(position)}>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.position} rotation={seg.rotation}>
          <cylinderGeometry args={[thickness, thickness, seg.length, 8]} />
          <meshStandardMaterial 
            color={color} 
            transparent={opacity < 1} 
            opacity={opacity} 
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Table({ position, width = 1.2, depth = 0.6, height = 0.8, scale = 1, rotation = 0 }: { position: Vec3; width?: number; depth?: number; height?: number; scale?: number; rotation?: number }) {
  const tableTopThickness = 0.05;
  const legThickness = 0.05;
  const legHeight = height - tableTopThickness;
  
  return (
    <group position={toVec3Array(position)} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <Surface position={{ x: 0, y: height - tableTopThickness / 2, z: 0 }} dimensions={{ x: width, y: tableTopThickness, z: depth }} opacity={0.2} showLines={false} />
      <Surface position={{ x: width / 2 - legThickness / 2, y: legHeight / 2, z: depth / 2 - legThickness / 2 }} dimensions={{ x: legThickness, y: legHeight, z: legThickness }} opacity={0.2} showLines={false} />
      <Surface position={{ x: -width / 2 + legThickness / 2, y: legHeight / 2, z: depth / 2 - legThickness / 2 }} dimensions={{ x: legThickness, y: legHeight, z: legThickness }} opacity={0.2} showLines={false} />
      <Surface position={{ x: width / 2 - legThickness / 2, y: legHeight / 2, z: -depth / 2 + legThickness / 2 }} dimensions={{ x: legThickness, y: legHeight, z: legThickness }} opacity={0.2} showLines={false} />
      <Surface position={{ x: -width / 2 + legThickness / 2, y: legHeight / 2, z: -depth / 2 + legThickness / 2 }} dimensions={{ x: legThickness, y: legHeight, z: legThickness }} opacity={0.2} showLines={false} />
    </group>
  );
}

export function Sofa({ position, rotation = 0, scale = 1 }: { position: Vec3; rotation?: number; scale?: number }) {
  const sofaWidth = 1.5, sofaDepth = 0.7, seatHeight = 0.4, backHeight = 0.5, armWidth = 0.1;
  return (
    <group position={toVec3Array(position)} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <Surface position={{ x: 0, y: seatHeight / 2, z: 0 }} dimensions={{ x: sofaWidth, y: seatHeight, z: sofaDepth }} opacity={0.2} showLines={false} />
      <Surface position={{ x: 0, y: seatHeight + backHeight / 2, z: -sofaDepth / 2 + 0.05 }} dimensions={{ x: sofaWidth, y: backHeight, z: 0.1 }} opacity={0.2} showLines={false} />
      <Surface position={{ x: -sofaWidth / 2 + armWidth / 2, y: seatHeight + backHeight / 2, z: 0 }} dimensions={{ x: armWidth, y: backHeight, z: sofaDepth }} opacity={0.2} showLines={false} />
      <Surface position={{ x: sofaWidth / 2 - armWidth / 2, y: seatHeight + backHeight / 2, z: 0 }} dimensions={{ x: armWidth, y: backHeight, z: sofaDepth }} opacity={0.2} showLines={false} />
    </group>
  );
}

export function Bed({ position, rotation = 0, scale = 1 }: { position: Vec3; rotation?: number; scale?: number }) {
  const bedWidth = 1.6, bedLength = 2.0, bedHeight = 0.5, headboardHeight = 0.8;
  return (
    <group position={toVec3Array(position)} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <Surface position={{ x: 0, y: bedHeight / 2, z: 0 }} dimensions={{ x: bedWidth, y: bedHeight, z: bedLength }} opacity={0.2} showLines={false} />
      <Surface position={{ x: 0, y: bedHeight + headboardHeight / 2, z: -bedLength / 2 + 0.05 }} dimensions={{ x: bedWidth, y: headboardHeight, z: 0.1 }} opacity={0.2} showLines={false} />
    </group>
  );
}

export function Chair({ position, rotation = 0, scale = 1 }: { position: Vec3; rotation?: number; scale?: number }) {
  const chairWidth = 0.5, chairDepth = 0.5, seatHeight = 0.45, backHeight = 0.45;
  return (
    <group position={toVec3Array(position)} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
      <Surface position={{ x: 0, y: seatHeight / 2, z: 0 }} dimensions={{ x: chairWidth, y: seatHeight, z: chairDepth }} opacity={0.2} showLines={false} />
      <Surface position={{ x: 0, y: seatHeight + backHeight / 2, z: -chairDepth / 2 + 0.025 }} dimensions={{ x: chairWidth, y: backHeight, z: 0.05 }} opacity={0.2} showLines={false} />
    </group>
  );
}

export function FurnitureItemComponent({ item }: { item: FurnitureProps }) {
  switch (item.type) {
    case Furniture.Bed: return <Bed position={item.position} rotation={item.rotation} scale={item.scale} />;
    case Furniture.Sofa: return <Sofa position={item.position} rotation={item.rotation} scale={item.scale} />;
    case Furniture.Table: return <Table position={item.position} rotation={item.rotation} scale={item.scale} />;
    case Furniture.Chair: return <Chair position={item.position} rotation={item.rotation} scale={item.scale} />;
    default: return null;
  }
}

export function CCTVComponent({ cctv, coneHeight = 100 }: { cctv: CCTV3D; coneHeight?: number }) {
  const { showCctvFrustums, activeCameraId, isPaused } = useSceneSettings();
  const fovRad = (cctv.fov * Math.PI) / 180;
  const coneRadius = Math.tan(fovRad / 2) * coneHeight;
  const isCurrentlyActive = activeCameraId === cctv.id;

  const clippingPlanes = useMemo(() => {
    const planes = [
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // Always clip at ground level
    ];
    
    if (cctv.roomBounds) {
      const { min, max } = cctv.roomBounds;
      planes.push(
        new THREE.Plane(new THREE.Vector3(1, 0, 0), -min.x),
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), max.x),
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -min.y),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), max.y),
        new THREE.Plane(new THREE.Vector3(0, 0, 1), -min.z),
        new THREE.Plane(new THREE.Vector3(0, 0, -1), max.z),
      );
    }
    return planes;
  }, [cctv.roomBounds]);

  return (
    <group position={toVec3Array(cctv.position)} renderOrder={10}>
      <group rotation={[cctv.pitch, cctv.yaw, 0, 'YXZ']}>
        {!isCurrentlyActive && (
          <>
            {/* Camera Housing */}
            <mesh>
              <boxGeometry args={[0.15, 0.15, 0.3]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Camera Lens/Front */}
            <mesh position={[0, 0, 0.15]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* Red Status Light */}
            <mesh position={[0.04, 0.04, 0.16]}>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </>
        )}

        {/* Camera Label */}
        {!isPaused && (
          <Html
            position={[0, 0.25, 0]}
            center
            distanceFactor={15}
            transform
            sprite
            pointerEvents="none"
          >
            <div className="px-1.5 py-0.5 rounded bg-slate-800/80 backdrop-blur-sm text-[8px] font-bold text-slate-200 border border-slate-700 shadow-lg whitespace-nowrap select-none pointer-events-none">
              {cctv.name}
            </div>
          </Html>
        )}

        {/* Field of View Visualization (Frustum) */}
        {showCctvFrustums && !isCurrentlyActive && (
          <group position={[0, 0, 0.15]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, coneHeight / 2]}>
              <coneGeometry args={[coneRadius, coneHeight, 32, 1, true]} />
              <meshBasicMaterial 
                color="#ef4444" 
                transparent 
                opacity={0.15} 
                side={THREE.DoubleSide} 
                depthWrite={false}
                clippingPlanes={clippingPlanes}
                clipShadows={true}
                onBeforeCompile={(shader) => {
                  shader.vertexShader = shader.vertexShader.replace(
                    '#include <common>',
                    `#include <common>
                    varying vec2 vFrustumUv;`
                  );
                  shader.vertexShader = shader.vertexShader.replace(
                    '#include <uv_vertex>',
                    `#include <uv_vertex>
                    vFrustumUv = uv;`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <common>',
                    `#include <common>
                    varying vec2 vFrustumUv;`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    'vec4 diffuseColor = vec4( diffuse, vFrustumUv.y * opacity );'
                  );
                }}
              />
            </mesh>

            {/* Vision Lines (Edges of the cone) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, coneHeight / 2]}>
              <coneGeometry args={[coneRadius, coneHeight, 4, 1, true]} />
              <meshBasicMaterial 
                color="#ef4444" 
                transparent 
                opacity={0.3} 
                wireframe 
                depthWrite={false}
                clippingPlanes={clippingPlanes}
                onBeforeCompile={(shader) => {
                  shader.vertexShader = shader.vertexShader.replace(
                    '#include <common>',
                    `#include <common>
                    varying vec2 vFrustumUv;`
                  );
                  shader.vertexShader = shader.vertexShader.replace(
                    '#include <uv_vertex>',
                    `#include <uv_vertex>
                    vFrustumUv = uv;`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <common>',
                    `#include <common>
                    varying vec2 vFrustumUv;`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    'vec4 diffuseColor = vec4( diffuse, vFrustumUv.y * opacity );'
                  );
                }}
              />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

export function TowerCCTVComponent({ cctv }: { cctv: TowerCCTV3D }) {
  const towerRadius = 0.1;
  const { activeCameraId } = useSceneSettings();
  const isCurrentlyActive = activeCameraId === cctv.id;
  
  return (
    <group position={[cctv.position.x, 0, cctv.position.z]}>
      {/* Tower Pole */}
      {!isCurrentlyActive && (
        <mesh position={[0, cctv.towerHeight / 2, 0]}>
          <cylinderGeometry args={[towerRadius, towerRadius * 1.5, cctv.towerHeight, 16]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      )}

      {/* Camera at the top */}
      <CCTVComponent 
        cctv={{
          ...cctv,
          position: { x: 0, y: cctv.position.y, z: 0 }
        }} 
        coneHeight={50} 
      />
    </group>
  );
}

export function RoomComponent({ room }: { room: Room3D }) {
  return (
    <group>
      {room.walls.map((wall, i) => (
        <Surface 
          key={`${room.id}-wall-${i}`} 
          position={wall.position} 
          dimensions={wall.dimensions} 
          color={room.color || "#e0f2fe"}
          opacity={0.15} 
          showLines={false} 
          depthWrite={false}
        />
      ))}
      {room.furniture.map((item, i) => (
        <FurnitureItemComponent key={`${room.id}-furniture-${i}`} item={item} />
      ))}
      {room.sensors.cctvs.map((cctv) => (
        <CCTVComponent key={cctv.id} cctv={cctv} />
      ))}
    </group>
  );
}

export function FloorComponent({ floor }: { floor: Floor3D }) {
  return (
    <group>
      <Surface position={floor.position} dimensions={floor.dimensions} depthWrite={false} />
      {floor.rooms.map((room) => (
        <RoomComponent key={room.id} room={room} />
      ))}
    </group>
  );
}

export function BuildingComponent({ building3D }: { building3D: Building3D }) {
  const dimArray = useMemo(() => toVec3Array(building3D.dimensions), [building3D.dimensions]);
  const buildingEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...dimArray)), [dimArray]);
  
  return (
    <group position={toVec3Array(building3D.position)}>
      <Line geometry={buildingEdges} position={{ x: 0, y: building3D.dimensions.y / 2, z: 0 }} color="#3b82f6" opacity={0.6} thickness={0.05} />
      {building3D.floors.map((floor) => (
        <FloorComponent key={floor.id} floor={floor} />
      ))}
    </group>
  );
}

export function RoadComponent({ road, index }: { road: Road3D; index: number }) {
  return (
    <mesh 
      position={[road.position.x, 0.01 + index * 0.01, road.position.z]} 
      rotation={[-Math.PI / 2, 0, road.rotation]}
    >
      <planeGeometry args={[road.dimensions.width, road.dimensions.length]} />
      <meshBasicMaterial 
        color="#64748b" 
        transparent={true} 
        opacity={0.2} 
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset={true}
        polygonOffsetFactor={-index}
        polygonOffsetUnits={-4}
      />
    </mesh>
  );
}

export type Person3D = {
  id: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  type: 'road' | 'room';
  isThreat: boolean;
  isVisible: boolean;
  threatDetectedAt?: number;
  isPanicking?: boolean;
  speed: number;
};

export function PersonComponent({ person }: { person: Person3D }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { isPaused } = useSceneSettings();
  
  useFrame((state) => {
    if (groupRef.current) {
      // Direct position update for smoother visual movement
      groupRef.current.position.copy(person.position);
    }
    
    if (person.isVisible) {
      if (person.isThreat && meshRef.current) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
        meshRef.current.scale.set(scale, scale, scale);
      } else if (person.isPanicking && meshRef.current) {
        const scale = 0.8 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
      } else if (meshRef.current) {
        meshRef.current.scale.set(1, 1, 1);
      }
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  const getPersonColor = () => {
    if (!person.isVisible) return "#94a3b8"; // Gray when not in view
    return person.isThreat ? "#ef4444" : "#3b82f6"; // Red for threat, Blue for normal when in view
  };

  const personColor = getPersonColor();

  return (
    <group ref={groupRef}>
      {/* The dot representing the person */}
      <mesh ref={meshRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={personColor} transparent={!person.isVisible} opacity={person.isVisible ? 1 : 0.6} />
      </mesh>
      
      {/* Identifier Label */}
      {!isPaused && (
        <Html 
          position={[0, 1.4, 0]} 
          center 
          distanceFactor={15} 
          transform
          sprite
          pointerEvents="none"
        >
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg whitespace-nowrap transition-all duration-300 select-none pointer-events-none ${
            !person.isVisible 
              ? 'bg-slate-400 opacity-60' 
              : person.isThreat 
                ? 'bg-red-500 animate-pulse' 
                : 'bg-blue-500'
          }${person.isVisible && !person.isThreat && person.isPanicking ? ' animate-bounce' : ''}`}>
            {person.isVisible ? (person.isThreat ? 'THREAT' : 'PERSON') : 'UNDETECTED'} #{person.id}
          </div>
        </Html>
      )}

      {/* Ring at the feet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.25, 0.3, 32]} />
        <meshBasicMaterial color={personColor} transparent opacity={person.isVisible ? 0.5 : 0.2} />
      </mesh>
    </group>
  );
}

export function AnimatedPeople({ neighborhood3D }: { neighborhood3D: Neighborhood3D }) {
  const { people, setPeople, addDetectionToLog, allCctvs, isPaused } = useSceneSettings();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const { scene } = useThree();
  const lastDetectionTimes = useRef<Record<string, number>>({});

  // Pre-calculate frustums for all CCTVs
  const cctvFrustums = useMemo(() => {
    return allCctvs.map(cctv => {
      const tempCam = new THREE.PerspectiveCamera(cctv.fov, 1, 0.1, 100);
      tempCam.position.set(cctv.worldPosition.x, cctv.worldPosition.y, cctv.worldPosition.z);
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

  useEffect(() => {
    people.forEach(p => {
      // Check if the person is currently visible and this is a new detection event
      if (p.isVisible && p.threatDetectedAt && p.threatDetectedAt !== lastDetectionTimes.current[p.id]) {
        lastDetectionTimes.current[p.id] = p.threatDetectedAt;
        addDetectionToLog({
          id: `${p.id}-${p.threatDetectedAt}`,
          personId: p.id,
          type: p.type,
          isThreat: p.isThreat,
          timestamp: p.threatDetectedAt
        });
      }
    });
  }, [people, addDetectionToLog, isPaused]);

  // Find valid spawn/target points (room centers or road points)
  const validPoints = useMemo(() => {
    const points: { pos: THREE.Vector3; floorY: number; roomId?: string; type: 'road' | 'room' }[] = [];
    
    neighborhood3D.buildings.forEach(b => {
      // Only ground floor (level 0)
      const groundFloor = b.floors.find(f => f.position.y < 0.5); // Assuming ground floor is at y=0
      if (groundFloor) {
        groundFloor.rooms.forEach(r => {
          points.push({
            pos: new THREE.Vector3(
              (r.bounds.min.x + r.bounds.max.x) / 2,
              0.1, // Ground floor height
              (r.bounds.min.z + r.bounds.max.z) / 2
            ),
            floorY: 0,
            roomId: r.id,
            type: 'room'
          });
        });
      }
    });

    neighborhood3D.roads.forEach(road => {
      // Add multiple points along the road to ensure better spreading
      const start = new THREE.Vector3(road.position.x, 0.1, road.position.z);
      points.push({
        pos: start,
        floorY: 0,
        type: 'road'
      });

      // Add more points along the road length for better distribution
      const steps = 3;
      const dx = Math.sin(road.rotation);
      const dz = Math.cos(road.rotation);
      for (let i = 1; i <= steps; i++) {
        const offset = (road.dimensions.length / 2) * (i / steps);
        points.push({
          pos: new THREE.Vector3(road.position.x + dx * offset, 0.1, road.position.z + dz * offset),
          floorY: 0,
          type: 'road'
        });
        points.push({
          pos: new THREE.Vector3(road.position.x - dx * offset, 0.1, road.position.z - dz * offset),
          floorY: 0,
          type: 'road'
        });
      }
    });

    return points;
  }, [neighborhood3D]);

  // Initialize people
  useEffect(() => {
    if (validPoints.length === 0) return;

    const initialPeople: Person3D[] = Array.from({ length: 10 }).map((_, i) => {
      // Pick unique start points to ensure spreading
      const shuffledPoints = [...validPoints].sort(() => Math.random() - 0.5);
      const startPoint = shuffledPoints[i % shuffledPoints.length];
      
      // Filter targets to be of the same type (road or room) to prevent jumping in/out
      const sameTypePoints = validPoints.filter(vp => vp.type === startPoint.type);
      const targetPoint = sameTypePoints[Math.floor(Math.random() * sameTypePoints.length)];
      
      return {
        id: (i + 1).toString().padStart(2, '0'),
        position: startPoint.pos.clone(),
        target: targetPoint.pos.clone(),
        type: startPoint.type,
        isThreat: false,
        isVisible: false,
        speed: 1 + Math.random() * 2
      };
    });
    setPeople(initialPeople);
  }, [validPoints]);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    
    setPeople(prevPeople => {
      const threats = prevPeople.filter(p => p.isThreat);
      const threatCount = threats.length;

      return prevPeople.map(p => {
        const newPos = p.position.clone();

        // 0. Visibility Check (Logic from DetectionEngine)
        const isVisible = cctvFrustums.some(({ frustum, worldPosition }) => {
          if (!frustum.containsPoint(p.position)) return false;
          const start = new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
          const target = p.position.clone().add(new THREE.Vector3(0, 0.5, 0));
          const direction = target.clone().sub(start);
          const distance = direction.length();
          direction.normalize();
          raycaster.set(start, direction);
          const intersects = raycaster.intersectObjects(scene.children, true);
          const firstSurface = intersects.find((hit: THREE.Intersection) => 
            hit.object.userData.isSurface && hit.distance < distance - 0.2
          );
          return !firstSurface;
        });

        let dir = p.target.clone().sub(p.position);
        const dist = dir.length();

        // 1. Handle Threat State Changes
        let isThreat = p.isThreat;
        let threatDetectedAt = p.threatDetectedAt;

        // Force at least one threat if none exist after 5 seconds
        if (threatCount === 0 && now > 5 && p.id === "01") {
          isThreat = true;
        }

        // Randomly become a threat even mid-walk if under limit
        if (!isThreat && threatCount < 3 && Math.random() > 0.999) {
          isThreat = true;
        }

        // Set detection time only when FIRST visible
        if (isVisible && !threatDetectedAt) {
          threatDetectedAt = now;
        } else if (!isVisible) {
          // Reset detection time when out of view, so it can be re-detected as a new event
          threatDetectedAt = undefined;
        }

        if (dist < 0.4) {
          // Reached target, pick a new one of the same type (road/room)
          const availablePoints = validPoints.filter(vp => vp.type === p.type);
          const nextTarget = availablePoints[Math.floor(Math.random() * availablePoints.length)];
          
          return {
            ...p,
            target: nextTarget.pos.clone(),
            isThreat,
            threatDetectedAt,
            isVisible
          };
        }

        // 2. Movement Logic
        dir.normalize();

        // 3. Avoidance Logic (Fear of threats)
        let isPanicking = false;
        if (!p.isThreat) {
          threats.forEach(t => {
            const distToThreat = p.position.distanceTo(t.position);
            
            // Panic reaction: Close range (within 15m), move away immediately
            if (distToThreat < 15) {
              isPanicking = true;
              const avoidDir = p.position.clone().sub(t.position).normalize();
              // When panicking, prioritize avoidance over target
              dir.lerp(avoidDir, 0.98);
            } 
            // Caution reaction: Mid range (within 22.5m) and threat detected for > 1.5s
            else if (t.threatDetectedAt && (now - t.threatDetectedAt > 1.5) && distToThreat < 22.5) {
              const avoidDir = p.position.clone().sub(t.position).normalize();
              const weight = Math.max(0, 1 - distToThreat / 22.5);
              dir.lerp(avoidDir, weight * 0.8);
            }
          });
        }

        // 3.5. Social Distancing (Avoid other people)
        prevPeople.forEach(other => {
          if (other.id === p.id) return;
          const distToOther = p.position.distanceTo(other.position);
          if (distToOther < 2) { 
            const avoidDir = p.position.clone().sub(other.position).normalize();
            // Stronger push when closer
            const strength = Math.pow(1 - distToOther / 2, 2);
            dir.lerp(avoidDir, strength * 0.4);
          }
        });

        // 4. Surface Collision Avoidance
        // We use raycasting to detect walls/surfaces in front
        raycaster.set(p.position, dir);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Only avoid objects marked as surfaces (walls, furniture) but NOT the floor/ground
        const collision = intersects.find((i: THREE.Intersection) => 
          i.distance < 0.8 && // Slightly larger distance for safer avoidance
          i.object.type === 'Mesh' && 
          i.object.userData.isSurface &&
          Math.abs(i.face?.normal.y || 0) < 0.5 // Ignore horizontal surfaces like floors
        );

        if (collision) {
          // Try to steer away. If we can't find a clear path, we'll stop moving.
          const axis = new THREE.Vector3(0, 1, 0);
          dir.applyAxisAngle(axis, Math.PI / 2);
          
          // Check again after steering
          raycaster.set(p.position, dir);
          const nextIntersects = raycaster.intersectObjects(scene.children, true);
          const nextCollision = nextIntersects.find((i: THREE.Intersection) => 
            i.distance < 0.5 && 
            i.object.type === 'Mesh' && 
            i.object.userData.isSurface &&
            Math.abs(i.face?.normal.y || 0) < 0.5
          );
          
          if (nextCollision) {
            // Still colliding after steering? Stop moving.
            return { ...p, isThreat, threatDetectedAt, isPanicking, isVisible };
          }
        }

        // Apply movement (speed up slightly if panicking)
        const moveSpeed = isPanicking ? p.speed * 1.25 : p.speed;
        const moveStep = dir.multiplyScalar(moveSpeed * delta);
        
        // Neighborhood boundaries: don't let people exit a +/- 50m box
        const nextPos = p.position.clone().add(moveStep);
        if (Math.abs(nextPos.x) > 50 || Math.abs(nextPos.z) > 50) {
           return { ...p, isThreat, threatDetectedAt, isPanicking, isVisible };
        }

        // Final sanity check: don't move if we'd literally go through a wall
        raycaster.set(p.position, moveStep.clone().normalize());
        const finalCheck = raycaster.intersectObjects(scene.children, true);
        if (finalCheck.some((i: THREE.Intersection) => i.distance < moveStep.length() + 0.2 && i.object.userData.isSurface)) {
           return { ...p, isThreat, threatDetectedAt, isPanicking, isVisible };
        }

        newPos.add(moveStep);

        return {
          ...p,
          position: newPos,
          isThreat,
          threatDetectedAt,
          isPanicking,
          isVisible
        };
      });
    });
  });

  return (
    <group>
      {people.map(p => (
        <PersonComponent key={p.id} person={p} />
      ))}
    </group>
  );
}

export function NeighborhoodComponent({ neighborhood3D }: { neighborhood3D: Neighborhood3D }) {
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
