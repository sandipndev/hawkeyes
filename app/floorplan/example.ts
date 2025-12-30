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
};
