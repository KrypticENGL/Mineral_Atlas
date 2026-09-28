/**
 * Reference data: countries and the mineral catalogue. Factual, supplier-
 * independent records. Suppliers and their quotes live in ./suppliers.ts.
 */
import type { Continent, MineralCategory } from "../lib/generated/prisma/enums";

export interface CountrySeed {
  code: string;
  isoNumeric: string;
  name: string;
  continent: Continent;
  latitude: number;
  longitude: number;
}

export const countries: CountrySeed[] = [
  { code: "AU", isoNumeric: "036", name: "Australia", continent: "OCEANIA", latitude: -25.3, longitude: 133.8 },
  { code: "CL", isoNumeric: "152", name: "Chile", continent: "SOUTH_AMERICA", latitude: -30.0, longitude: -71.0 },
  { code: "BR", isoNumeric: "076", name: "Brazil", continent: "SOUTH_AMERICA", latitude: -12.0, longitude: -51.9 },
  { code: "CA", isoNumeric: "124", name: "Canada", continent: "NORTH_AMERICA", latitude: 56.1, longitude: -106.3 },
  { code: "US", isoNumeric: "840", name: "United States", continent: "NORTH_AMERICA", latitude: 39.8, longitude: -98.6 },
  { code: "CN", isoNumeric: "156", name: "China", continent: "ASIA", latitude: 35.9, longitude: 104.2 },
  { code: "IN", isoNumeric: "356", name: "India", continent: "ASIA", latitude: 21.0, longitude: 78.9 },
  { code: "ID", isoNumeric: "360", name: "Indonesia", continent: "ASIA", latitude: -2.5, longitude: 118.0 },
  { code: "ZA", isoNumeric: "710", name: "South Africa", continent: "AFRICA", latitude: -29.0, longitude: 24.7 },
  { code: "PE", isoNumeric: "604", name: "Peru", continent: "SOUTH_AMERICA", latitude: -9.2, longitude: -75.0 },
  { code: "AR", isoNumeric: "032", name: "Argentina", continent: "SOUTH_AMERICA", latitude: -34.0, longitude: -64.0 },
  { code: "MX", isoNumeric: "484", name: "Mexico", continent: "NORTH_AMERICA", latitude: 23.6, longitude: -102.5 },
  { code: "DE", isoNumeric: "276", name: "Germany", continent: "EUROPE", latitude: 51.2, longitude: 10.4 },
  { code: "NO", isoNumeric: "578", name: "Norway", continent: "EUROPE", latitude: 64.5, longitude: 12.0 },
  { code: "TR", isoNumeric: "792", name: "Turkey", continent: "MIDDLE_EAST", latitude: 39.0, longitude: 35.2 },
  { code: "KZ", isoNumeric: "398", name: "Kazakhstan", continent: "ASIA", latitude: 48.0, longitude: 67.0 },
  { code: "CD", isoNumeric: "180", name: "DR Congo", continent: "AFRICA", latitude: -4.0, longitude: 23.0 },
  { code: "GH", isoNumeric: "288", name: "Ghana", continent: "AFRICA", latitude: 7.9, longitude: -1.0 },
  { code: "SA", isoNumeric: "682", name: "Saudi Arabia", continent: "MIDDLE_EAST", latitude: 24.0, longitude: 45.0 },
  { code: "AE", isoNumeric: "784", name: "United Arab Emirates", continent: "MIDDLE_EAST", latitude: 24.3, longitude: 54.4 },
  { code: "GB", isoNumeric: "826", name: "United Kingdom", continent: "EUROPE", latitude: 53.0, longitude: -2.0 },
  { code: "JP", isoNumeric: "392", name: "Japan", continent: "ASIA", latitude: 36.2, longitude: 138.3 },
  { code: "ZM", isoNumeric: "894", name: "Zambia", continent: "AFRICA", latitude: -13.1, longitude: 27.8 },
  { code: "PH", isoNumeric: "608", name: "Philippines", continent: "ASIA", latitude: 12.9, longitude: 121.8 },
  { code: "GN", isoNumeric: "324", name: "Guinea", continent: "AFRICA", latitude: 10.4, longitude: -10.9 },
  { code: "MA", isoNumeric: "504", name: "Morocco", continent: "AFRICA", latitude: 31.8, longitude: -7.1 },
  { code: "BO", isoNumeric: "068", name: "Bolivia", continent: "SOUTH_AMERICA", latitude: -16.3, longitude: -63.6 },
  { code: "SE", isoNumeric: "752", name: "Sweden", continent: "EUROPE", latitude: 62.0, longitude: 15.0 },
  { code: "NA", isoNumeric: "516", name: "Namibia", continent: "AFRICA", latitude: -22.9, longitude: 18.5 },
  { code: "BW", isoNumeric: "072", name: "Botswana", continent: "AFRICA", latitude: -22.3, longitude: 24.7 },
  { code: "CI", isoNumeric: "384", name: "Côte d'Ivoire", continent: "AFRICA", latitude: 7.5, longitude: -5.5 },
  { code: "TZ", isoNumeric: "834", name: "Tanzania", continent: "AFRICA", latitude: -6.4, longitude: 34.9 },
  { code: "RU", isoNumeric: "643", name: "Russia", continent: "EUROPE", latitude: 61.5, longitude: 105.3 },
  { code: "MY", isoNumeric: "458", name: "Malaysia", continent: "ASIA", latitude: 4.2, longitude: 102.0 },
  { code: "EG", isoNumeric: "818", name: "Egypt", continent: "AFRICA", latitude: 26.8, longitude: 30.8 },
  { code: "PK", isoNumeric: "586", name: "Pakistan", continent: "ASIA", latitude: 30.4, longitude: 69.3 },
  { code: "BH", isoNumeric: "048", name: "Bahrain", continent: "MIDDLE_EAST", latitude: 26.07, longitude: 50.55 },
  { code: "MZ", isoNumeric: "508", name: "Mozambique", continent: "AFRICA", latitude: -18.7, longitude: 35.5 },
  { code: "NL", isoNumeric: "528", name: "Netherlands", continent: "EUROPE", latitude: 52.1, longitude: 5.3 },
  { code: "CM", isoNumeric: "120", name: "Cameroon", continent: "AFRICA", latitude: 7.4, longitude: 12.4 },
];

export interface MineralSeed {
  name: string;
  category: MineralCategory;
  chemicalFormula: string | null;
  description: string;
  uses: string[];
}

export const minerals: MineralSeed[] = [
  // Metallic
  { name: "Iron Ore", category: "METALLIC", chemicalFormula: "Fe₂O₃ / Fe₃O₄", description: "Hematite and magnetite ores, the primary feedstock for blast-furnace and direct-reduction steelmaking.", uses: ["Steelmaking", "Pellet feed", "Heavy media"] },
  { name: "Copper", category: "METALLIC", chemicalFormula: "Cu", description: "Cathode and concentrate grades of a highly conductive base metal central to electrification.", uses: ["Power cables", "Motors & transformers", "Plumbing", "Electronics"] },
  { name: "Aluminium", category: "METALLIC", chemicalFormula: "Al", description: "Primary ingot and billet smelted from alumina — light, corrosion-resistant and widely recycled.", uses: ["Transport", "Packaging", "Construction", "Power lines"] },
  { name: "Bauxite", category: "METALLIC", chemicalFormula: "Al(OH)₃ / AlO(OH)", description: "Lateritic ore rich in gibbsite and boehmite, refined into alumina via the Bayer process.", uses: ["Alumina refining", "Refractories", "Cement additive"] },
  { name: "Nickel", category: "METALLIC", chemicalFormula: "Ni", description: "Class 1 and laterite-derived nickel used in stainless steel and high-energy battery cathodes.", uses: ["Stainless steel", "Battery cathodes", "Superalloys"] },
  { name: "Zinc", category: "METALLIC", chemicalFormula: "Zn", description: "Special high grade zinc and sphalerite concentrates, chiefly used to galvanise steel.", uses: ["Galvanising", "Die casting", "Brass"] },
  { name: "Lead", category: "METALLIC", chemicalFormula: "Pb", description: "Refined lead and galena concentrates, dominated by lead–acid battery demand.", uses: ["Lead–acid batteries", "Radiation shielding", "Cable sheathing"] },
  { name: "Lithium", category: "METALLIC", chemicalFormula: "Li₂CO₃", description: "Battery-grade lithium carbonate from brine and hard-rock spodumene operations.", uses: ["Li-ion batteries", "Ceramics & glass", "Lubricating greases"] },
  { name: "Cobalt", category: "METALLIC", chemicalFormula: "Co", description: "Cobalt metal and hydroxide, largely a by-product of copper and nickel mining.", uses: ["Battery cathodes", "Superalloys", "Catalysts"] },
  { name: "Manganese", category: "METALLIC", chemicalFormula: "MnO₂", description: "High-grade manganese ore used as an essential deoxidiser and alloying agent in steel.", uses: ["Steel alloys", "Battery materials", "Fertiliser additive"] },
  { name: "Molybdenum", category: "METALLIC", chemicalFormula: "MoS₂", description: "Roasted molybdenite concentrate, mostly recovered from porphyry copper deposits.", uses: ["High-strength steel", "Catalysts", "Lubricants"] },
  { name: "Tin", category: "METALLIC", chemicalFormula: "Sn", description: "Refined tin from cassiterite, indispensable for electronics solder.", uses: ["Solder", "Tinplate", "Chemicals"] },
  { name: "Rare Earth Elements", category: "METALLIC", chemicalFormula: "NdPr oxide", description: "Separated neodymium–praseodymium oxide, the key input for permanent magnets.", uses: ["Permanent magnets", "EV motors", "Wind turbines"] },
  { name: "Chromite", category: "METALLIC", chemicalFormula: "FeCr₂O₄", description: "Metallurgical chromite ore, the sole commercial source of chromium.", uses: ["Ferrochrome", "Stainless steel", "Refractories"] },
  // Industrial
  { name: "Graphite", category: "INDUSTRIAL", chemicalFormula: "C", description: "Natural flake graphite concentrate, feedstock for battery anodes and refractories.", uses: ["Battery anodes", "Refractories", "Lubricants"] },
  { name: "Limestone", category: "INDUSTRIAL", chemicalFormula: "CaCO₃", description: "High-calcium limestone for cement, lime burning and flue-gas treatment.", uses: ["Cement", "Quicklime", "Aggregates", "Flue-gas desulphurisation"] },
  { name: "Gypsum", category: "INDUSTRIAL", chemicalFormula: "CaSO₄·2H₂O", description: "Natural gypsum rock used as a set retarder and for plaster products.", uses: ["Cement retarder", "Wallboard", "Soil conditioner"] },
  { name: "Silica Sand", category: "INDUSTRIAL", chemicalFormula: "SiO₂", description: "Washed, graded high-purity quartz sand for glass and foundry use.", uses: ["Glassmaking", "Foundry moulds", "Solar-grade silicon"] },
  { name: "Kaolin", category: "INDUSTRIAL", chemicalFormula: "Al₂Si₂O₅(OH)₄", description: "Refined china clay valued for whiteness and fine particle size.", uses: ["Paper coating", "Ceramics", "Paints", "Pharmaceuticals"] },
  { name: "Feldspar", category: "INDUSTRIAL", chemicalFormula: "KAlSi₃O₈", description: "Potassium and sodium feldspar used as a fluxing agent.", uses: ["Glass", "Ceramic glazes", "Fillers"] },
  { name: "Phosphate Rock", category: "INDUSTRIAL", chemicalFormula: "Ca₅(PO₄)₃(F,Cl,OH)", description: "Beneficiated apatite rock, the base of phosphate fertilisers.", uses: ["Fertilisers", "Animal feed", "LFP battery precursors"] },
  { name: "Potash", category: "INDUSTRIAL", chemicalFormula: "KCl", description: "Muriate of potash from evaporite deposits and brines.", uses: ["Fertilisers", "Chemical industry"] },
  { name: "Granite", category: "INDUSTRIAL", chemicalFormula: null, description: "Dimension-stone blocks of igneous rock, quarried and traded by volume.", uses: ["Architecture", "Countertops", "Monuments"] },
  // Precious
  { name: "Gold", category: "PRECIOUS", chemicalFormula: "Au", description: "Doré and refined bullion, quoted per troy ounce.", uses: ["Bullion & reserves", "Jewellery", "Electronics"] },
  { name: "Silver", category: "PRECIOUS", chemicalFormula: "Ag", description: "Refined silver bars and doré, with strong industrial demand from photovoltaics.", uses: ["Photovoltaics", "Electronics", "Jewellery", "Bullion"] },
  { name: "Platinum", category: "PRECIOUS", chemicalFormula: "Pt", description: "Platinum-group metal sponge and ingot, prized as a catalyst.", uses: ["Autocatalysts", "Hydrogen electrolysers", "Jewellery"] },
  // Energy
  { name: "Coal", category: "ENERGY", chemicalFormula: "C", description: "Thermal and metallurgical coal, graded by calorific value and ash content.", uses: ["Power generation", "Coking for steel", "Cement kilns"] },
  { name: "Uranium", category: "ENERGY", chemicalFormula: "U₃O₈", description: "Yellowcake concentrate, conventionally quoted per pound of U₃O₈.", uses: ["Nuclear fuel", "Medical isotopes"] },
  // Gemstone
  { name: "Diamonds", category: "GEMSTONE", chemicalFormula: "C", description: "Rough gem-quality diamonds sold in assorted parcels.", uses: ["Jewellery", "Investment", "Industrial abrasives"] },
  { name: "Emerald", category: "GEMSTONE", chemicalFormula: "Be₃Al₂(SiO₃)₆", description: "Rough beryl of emerald quality, graded by colour and clarity.", uses: ["Jewellery", "Collectors' stones"] },

  { name: "Steel Drums", category: "PACKAGING", chemicalFormula: null, description: "209 L (55 US gal) tight-head cold-rolled steel drums, UN-rated for liquid cargo.", uses: ["Liquid chemicals", "Lubricants & bitumen", "Export packaging"] },
];

