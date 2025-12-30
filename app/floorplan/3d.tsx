import { useMemo } from "react";
// @ts-ignore
import * as THREE from "three";
import { Furniture, type Vec2, type Vec3, type FurnitureItem, type Room, type Floor, type Building, type Neighborhood, type Road } from "./model";

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
  color?: string;
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

const roomTo3D = (room: Room, currentY: number, floorHeight: number): Room3D => ({
  id: room.id,
  name: room.name,
  walls: createWalls(room, currentY, floorHeight),
  furniture: room.furniture.map(f => furnitureTo3D(f, currentY)),
  color: room.color,
});

export const floorTo3D = (floor: Floor, currentY: number): Floor3D => {
  return {
    id: floor.id,
    position: { x: 0, y: currentY, z: 0 },
    dimensions: { x: floor.dimensions.x, y: FLOOR_THICKNESS, z: floor.dimensions.y },
    rooms: floor.rooms.map(r => roomTo3D(r, currentY, floor.height)),
  };
};

export const buildingTo3D = (building: Building): Building3D => {
  let currentY = 0;
  const floors3D: Floor3D[] = [];
  
  for (const floor of building.floors) {
    floors3D.push(floorTo3D(floor, currentY));
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
});

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
      <mesh>
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
      {showLines && <Line geometry={edges} color="#3b82f6" opacity={0.4} />}
    </group>
  );
}

export function Line({ 
  geometry, 
  position = { x: 0, y: 0, z: 0 }, 
  color = "#3b82f6", 
  opacity = 1, 
  linewidth = 5 
}: { 
  geometry: THREE.BufferGeometry; 
  position?: Vec3; 
  color?: string; 
  opacity?: number; 
  linewidth?: number 
}) {
  return (
    <lineSegments position={toVec3Array(position)} geometry={geometry}>
      <lineBasicMaterial color={color} opacity={opacity} transparent={opacity < 1} linewidth={linewidth} />
    </lineSegments>
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
        />
      ))}
      {room.furniture.map((item, i) => (
        <FurnitureItemComponent key={`${room.id}-furniture-${i}`} item={item} />
      ))}
    </group>
  );
}

export function FloorComponent({ floor }: { floor: Floor3D }) {
  return (
    <group>
      <Surface position={floor.position} dimensions={floor.dimensions} depthWrite={true} />
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
      <Line geometry={buildingEdges} position={{ x: 0, y: building3D.dimensions.y / 2, z: 0 }} color="#3b82f6" opacity={0.3} />
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

export function NeighborhoodComponent({ neighborhood3D }: { neighborhood3D: Neighborhood3D }) {
  return (
    <group>
      {neighborhood3D.roads.map((road, i) => (
        <RoadComponent key={road.id} road={road} index={i} />
      ))}
      {neighborhood3D.buildings.map((building) => (
        <BuildingComponent key={building.id} building3D={building} />
      ))}
    </group>
  );
}
