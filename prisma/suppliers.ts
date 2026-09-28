/**
 * Supplier offers entered from documents received directly from suppliers.
 * Everything here is as-stated by the seller and unverified unless `verified`
 * is true. Add new suppliers by appending to `suppliers`; lead-sheet imports
 * live in ./mining-people.ts.
 */
import type {
  Availability,
  CounterpartyRole,
  Currency,
  Incoterm,
  PriceUnit,
  RiskLevel,
} from "../lib/generated/prisma/enums";

export interface OfferSeed {
  /** Must match a mineral name in reference-data.ts. */
  mineral: string;
  productName?: string;
  specifications?: string;
  /** Unit for capacity/stock when there is no price; defaults to the price unit or metric tons. */
  unit?: PriceUnit;
  availableQuantity?: number;
  monthlyCapacity?: { min: number; max: number };
  /** Omitted when the counterparty has not quoted a price. */
  price?: {
    amount: number;
    currency: Currency;
    unit: PriceUnit;
    incoterm?: Incoterm;
    loadingPort?: string;
    paymentTerms?: string;
    /** Qualifiers on the price, e.g. "+ GST + freight". */
    priceNote?: string;
    minimumOrderQuantity?: number;
    availability: Availability;
    /** ISO date the quote was received/entered. */
    quotedOn: string;
  };
}

export interface SupplierSeed {
  name: string;
  /** ISO alpha-2, must exist in reference-data.ts. */
  country: string;
  region?: string;
  city: string;
  lat: number;
  lng: number;
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  contactName?: string;
  description: string;
  verified: boolean;
  role: CounterpartyRole;
  riskLevel: RiskLevel;
  /** Due-diligence notes: red flags, status, how to engage. */
  assessment?: string;
  /** Where the record came from. */
  source?: string;
  offers: OfferSeed[];
}

export const suppliers: SupplierSeed[] = [
  {
    name: "Sinchi Wayra",
    country: "BO",
    region: "La Paz",
    city: "La Paz",
    lat: -16.4897,
    lng: -68.1193,
    address: "Av. Arce #2299, Ed. Multicentro Torre B, P1 y P2, La Paz, Bolivia",
    website: "https://www.sinchiwayra.com",
    email: "sanoprocompanyltd@gmail.com",
    phone: "+591 76702051",
    contactName: "Pedro Sanchez (Sales)",
    description:
      "Offers aluminium ingots of Bolivian origin, shipped from Callao (Peru). " +
      "Trading office: 11 Apex Drive, Suite 300A, PMB 1011, Marlborough, MA 01752, USA. " +
      "Stated procedure: buyer sends ICPO/LOI → seller issues FCO → buyer signs and returns FCO → " +
      "seller sends draft contract → seller issues PI → buyer opens documentary L/C → " +
      "shipment begins 15 days after the seller receives the L/C.",
    verified: false,
    role: "TRADER",
    riskLevel: "HIGH",
    assessment:
      "Uses the name of a Bolivian zinc/silver miner, but the contact email is a free Gmail address under another " +
      "name; Bolivia has no aluminium smelter; ICPO → FCO → 100% L/C procedure; inconsistent chemical table. " +
      "Confirm through the company's official channels before engaging.",
    source: "Offer received by email",
    offers: [
      {
        mineral: "Aluminium",
        productName: "Aluminium ingot A7 99.7% / A8 99.8%; aluminium alloy ingot",
        specifications: [
          "Appearance: silvery white",
          "Ingot size: 740 × 170 × 90 mm (±10%)",
          "Ingot weight: 25 kg (22–25 kg)",
          "Quality offered: Al 99.70, Al 99.50, Al 99.00",
          "Packing: 25 kg/ingot, 1,000 or 1,050 kg/bundle, or to buyer's requirement; 25 MT per 20' FCL",
          "",
          "Chemical composition (%) as supplied — Al ≥ | Si Fe Cu Ga Mg Zn Mn others sum (impurities ≤):",
          "Al99.90  99.90 | 0.50 0.07 0.005 0.02 0.01 0.025 – 0.010 0.10",
          "Al99.85  99.58 | 0.80 0.12 0.005 0.03 0.02 0.030 – 0.015 0.15",
          "Al99.70  99.70 | 0.10 0.20 0.010 0.03 0.02 0.030 – 0.030 0.30",
          "Al99.60  99.60 | 0.16 0.25 0.010 0.03 0.03 0.030 – 0.030 0.40",
          "Al99.50  99.50 | 0.22 0.30 0.020 0.03 0.05 0.050 – 0.030 0.50",
          "Al99.00  99.00 | 0.42 0.50 0.020 0.03 0.05 0.050 – 0.050 1.00",
        ].join("\n"),
        monthlyCapacity: { min: 500, max: 5000 },
        price: {
          amount: 2650,
          currency: "USD",
          unit: "METRIC_TON",
          incoterm: "CIF",
          loadingPort: "Callao, Peru",
          paymentTerms:
            "100% irrevocable, non-transferable documentary letter of credit at sight, payable against " +
            "presentation of shipping documents at the loading port.",
          minimumOrderQuantity: 100,
          availability: "AVAILABLE",
          quotedOn: "2026-09-29",
        },
      },
    ],
  },
];
