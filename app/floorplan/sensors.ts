import { type Vec2 } from "./types";

export type CCTV = {
  id: string;
  name?: string;
  fov: number; // degrees
  position: Vec2;
  height: number; // height from the floor
  yaw?: number; // degrees, rotation around Y axis
  pitch?: number; // degrees, rotation around X axis (pointing down)
};

export type TowerCCTV = CCTV & {
  towerHeight: number;
};

