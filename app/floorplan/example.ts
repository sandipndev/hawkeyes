import { Furniture, type Floor, type Building, type Neighborhood } from "./model";

// Example Floor
const floor1: Floor = {
  id: "f1",
  level: 0,
  height: 3,
  dimensions: { x: 8, y: 6 },
  rooms: [
    {
      id: "f1-r1",
      name: "Bedroom 1",
      dimensions: { x: 4, y: 6 },
      position: { x: -4, y: -3 },
      furniture: [
        { type: Furniture.Bed, position: { x: -2, y: 0 }, rotation: 0 },
        { type: Furniture.Table, position: { x: -0.5, y: 2 } },
        { type: Furniture.Chair, position: { x: -0.5, y: 1 }, rotation: 180 },
      ],
      sensors: {
        cctvs: [
          { 
            id: "cam-1", 
            name: "Bed View",
            fov: 60, 
            position: { x: -3.8, y: -2.8 }, 
            height: 2.8,
            yaw: 45,
            pitch: 30 
          }
        ]
      }
    },
    {
      id: "f1-r2",
      name: "Bedroom 2",
      dimensions: { x: 4, y: 6 },
      position: { x: 0, y: -3 },
      furniture: [
        { type: Furniture.Bed, position: { x: 2, y: 0 }, rotation: 0 },
        { type: Furniture.Table, position: { x: 0.5, y: 2 } },
      ],
      sensors: {
        cctvs: [
          { 
            id: "cam-2", 
            fov: 70, 
            position: { x: 3.8, y: 2.8 }, 
            height: 2.5,
            yaw: 225, // Pointing towards top-left of this room
            pitch: 20 
          }
        ]
      }
    },
  ],
};

const floor2: Floor = {
  id: "f2",
  level: 1,
  height: 3,
  dimensions: { x: 8, y: 6 },
  rooms: [
    {
      id: "f2-r1",
      name: "Office",
      dimensions: { x: 8, y: 6 },
      position: { x: -4, y: -3 },
      furniture: [{ type: Furniture.Table, position: { x: 0, y: 0 } }],
    },
  ],
};

// Example Building
const building1: Building = {
  id: "b1",
  name: "Main Residence",
  position: { x: -10, y: -5 },
  floors: [floor1, floor2],
};

const building2: Building = {
  id: "b2",
  name: "Guest House",
  position: { x: 10, y: -5 },
  floors: [floor1],
};

// Example Neighborhood
export const neighborhood: Neighborhood = {
  name: "Sunset Valley",
  buildings: [building1, building2],
  roads: [
    { id: "road-1", name: "Main St", start: { x: -30, y: 5 }, end: { x: 30, y: 5 }, width: 4 },
    { id: "road-2", name: "Oak Ave", start: { x: 0, y: -20 }, end: { x: 0, y: 20 }, width: 4 },
  ],
  towerCctvs: [
    {
      id: "tower-cam-1",
      name: "North Entrance",
      fov: 90,
      position: { x: -3, y: 0 },
      towerHeight: 8,
      height: 0.5,
      yaw: 10,
      pitch: 45,
    },
    // {
    //   id: "tower-cam-2",
    //   fov: 90,
    //   position: { x: 15, y: 15 },
    //   towerHeight: 12,
    //   height: 0.5,
    //   yaw: 225,
    //   pitch: 30,
    // },
    // {
    //   id: "tower-cam-3",
    //   fov: 120,
    //   position: { x: -20, y: -15 },
    //   towerHeight: 15,
    //   height: 0.5,
    //   yaw: 45,
    //   pitch: 40,
    // }
  ],
};
