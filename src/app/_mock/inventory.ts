// src/app/_mock/inventory.ts

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  brand: "Tata Power" | "Waaree" | "Havells" | "Growatt" | "Adani";
  type: "Panel" | "Inverter" | "Battery" | "Structure";
  spec: string; // e.g., "550W Mono Perc" or "5kW Hybrid"
  price: number; // Purchase price in INR
  stock: number;
};

export const INVENTORY: InventoryItem[] = [
  // SOLAR PANELS
  {
    id: "p1",
    sku: "TATA-550-GOLD",
    name: "Tata Power Gold Series",
    brand: "Tata Power",
    type: "Panel",
    spec: "550W Mono Perc",
    price: 14500,
    stock: 120,
  },
  {
    id: "p2",
    sku: "WAAREE-540-BIF",
    name: "Waaree Bi-Facial Elite",
    brand: "Waaree",
    type: "Panel",
    spec: "540W Bi-Facial",
    price: 15200,
    stock: 85,
  },
  {
    id: "p3",
    sku: "ADANI-450-POLY",
    name: "Adani Solar Poly",
    brand: "Adani",
    type: "Panel",
    spec: "450W Polycrystalline",
    price: 11000,
    stock: 200,
  },

  // INVERTERS
  {
    id: "i1",
    sku: "HAVELLS-5KW",
    name: "Havells Enviro GT",
    brand: "Havells",
    type: "Inverter",
    spec: "5kW Grid Tie",
    price: 45000,
    stock: 15,
  },
  {
    id: "i2",
    sku: "GROWATT-5KW-HYB",
    name: "Growatt Hybrid SPA",
    brand: "Growatt",
    type: "Inverter",
    spec: "5kW Hybrid",
    price: 62000,
    stock: 8,
  },
];