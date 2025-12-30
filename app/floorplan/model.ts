// Core position and dimension types
export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

// Furniture
export enum Furniture {
  Bed = "Bed",
  Sofa = "Sofa",
  Table = "Table",
  Chair = "Chair",
}

export type FurnitureItem = {
  type: Furniture;
  position: Vec2;
  rotation?: number; // degrees
  scale?: number;
};

// Room in a floor
export type Room = {
  id: string;
  name: string;
  dimensions: Vec2;
  position: Vec2;
  furniture: FurnitureItem[];
  color?: string; // Optional room-specific color
};

// Floor
export type Floor = {
  id: string;
  level: number;
  height: number;
  dimensions: Vec2;
  rooms: Room[];
};

// Building
export type Building = {
  id: string;
  name: string;
  position: Vec2;
  floors: Floor[];
};

// Road
export type Road = {
  id: string;
  name?: string;
  start: Vec2;
  end: Vec2;
  width: number;
};

// Neighborhood
export type Neighborhood = {
  name: string;
  buildings: Building[];
  roads: Road[];
};

