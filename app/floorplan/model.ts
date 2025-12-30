import { type Vec2, type Vec3 } from "./types";
import { type CCTV, type TowerCCTV } from "./sensors";

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
  sensors?: {
    cctvs?: CCTV[];
  };
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
  towerCctvs?: TowerCCTV[];
};

