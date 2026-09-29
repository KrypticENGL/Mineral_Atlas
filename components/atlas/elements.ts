export interface Element {
  number: number;
  symbol: string;
  name: string;
  color: string;
}

/** Minerals the atlas trades in, with a tint each. */
export const ELEMENTS: Element[] = [
  { number: 3, symbol: "Li", name: "Lithium", color: "#c9a9d8" },
  { number: 29, symbol: "Cu", name: "Copper", color: "#d08a5b" },
  { number: 27, symbol: "Co", name: "Cobalt", color: "#7fa3d6" },
  { number: 79, symbol: "Au", name: "Gold", color: "#e2bd5b" },
  { number: 28, symbol: "Ni", name: "Nickel", color: "#8fc4b0" },
  { number: 26, symbol: "Fe", name: "Iron", color: "#c97b6b" },
  { number: 47, symbol: "Ag", name: "Silver", color: "#c4cbd2" },
  { number: 92, symbol: "U", name: "Uranium", color: "#a6d36b" },
  { number: 50, symbol: "Sn", name: "Tin", color: "#9aa8c9" },
  { number: 78, symbol: "Pt", name: "Platinum", color: "#b9c7cf" },
  { number: 13, symbol: "Al", name: "Aluminium", color: "#a9b8c4" },
  { number: 30, symbol: "Zn", name: "Zinc", color: "#8fb3c9" },
];
