/**
 * Counterparties imported from the "MINING PEOPLE" lead sheets (Sheet1–3 CSVs).
 *
 * Values are as recorded in the sheets. Coordinates are the stated city; when
 * the sheet gives only a state or country, the point sits at that area's
 * centre and `city` names the area rather than inventing a town. Where the
 * location was inferred (e.g. from a phone country code) the description says so.
 */
import type { OfferSeed, SupplierSeed } from "./suppliers";

const SHEET_1 = "MINING PEOPLE lead sheet 1 (sourcing calls)";
const SHEET_2 = "MINING PEOPLE lead sheet 2 (aluminium buyers & sellers)";
const SHEET_3 = "MINING PEOPLE lead sheet 3 (aluminium & steel drum directory)";
const ENTERED = "2026-09-29";

type Quote = NonNullable<OfferSeed["price"]>;
const perTon = (amount: number, currency: Quote["currency"], rest: Partial<Quote> = {}): Quote => ({
  amount,
  currency,
  unit: "METRIC_TON",
  availability: "ON_REQUEST",
  quotedOn: ENTERED,
  ...rest,
});

// ── Sheet 1 — sourcing calls (iron ore, copper) ────────────────────────────
const sheet1: SupplierSeed[] = [
  {
    name: "Unidentified broker (+225 0161107130)",
    country: "CI",
    city: "Côte d'Ivoire",
    lat: 7.54,
    lng: -5.55,
    phone: "+225 0161107130",
    description:
      "Unnamed caller offering iron ore lumps from a forwarded Venezuelan (Ferrominera) spec sheet. " +
      "Location inferred from the Ivorian phone number. Price not given; demanded an LOI first.",
    verified: false,
    role: "BROKER",
    riskLevel: "SCAM",
    assessment:
      'High-risk scam: Ivory Coast number forwarding copy-pasted Venezuelan mining specs (Ferrominera lump ore); ' +
      'impossible fit for 1,000 MT/month Nagpur delivery; asked for "city of dispatch".',
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore lumps (Fe 64.19%, FLO specs)",
        specifications: 'Stated MOQ "much higher than 1,000 MT". Venezuelan spec sheet forwarded.',
      },
    ],
  },
  {
    name: "Yogesh Dewangan",
    country: "IN",
    region: "Chhattisgarh",
    city: "Chhattisgarh",
    lat: 21.28,
    lng: 81.87,
    phone: "+91 88897 86714",
    contactName: "Yogesh Dewangan",
    description:
      "Intermediary for iron ore lumps from Chhattisgarh with delivery to Nagpur. Agreed to share a quote and " +
      "check compliance documents (EC, dealer licence, Form K).",
    verified: false,
    role: "BROKER",
    riskLevel: "MODERATE",
    assessment: "Unresponsive: stopped answering calls and messages; no quotation sent.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore lumps 5–18 mm",
        specifications: "Enquiry for 3,000 MT/month, delivered Nagpur. Price pending (asked for raw vs. billed rates).",
      },
    ],
  },
  {
    name: "Bhishma Pradhan",
    country: "IN",
    region: "Odisha",
    city: "Odisha",
    lat: 20.94,
    lng: 84.8,
    phone: "+91 79785 82130",
    contactName: "Bhishma Pradhan",
    description:
      "Odisha iron ore trader; also offered fines and enquired about Australian cake. Asked for the buyer's GST " +
      "number to issue an offer letter.",
    verified: false,
    role: "TRADER",
    riskLevel: "MODERATE",
    assessment:
      "Unresponsive: promised an official written offer with freight, repeatedly stalled and stopped answering calls.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore lumps Fe 63%+, 5–18 mm; fines also offered",
        specifications: "Enquiry for 3,000 MT/month.",
        price: perTon(4200, "INR", { priceNote: "+ GST + freight; commission included" }),
      },
    ],
  },
  {
    name: "African Unity Mining & Logistics Ltd",
    country: "CD",
    region: "Haut-Katanga",
    city: "Kambove",
    lat: -10.87,
    lng: 26.6,
    contactName: "Bornita",
    description:
      "Trades on WhatsApp as Nova link Enterprise. Claims 5,200 MT of copper stock in a Kambove mines " +
      "warehouse (DRC) and Zambian supply.",
    verified: false,
    role: "BROKER",
    riskLevel: "SCAM",
    assessment:
      "High-risk scam: unrealistic LME −20% pricing; demands direct upfront cash transfer before contract execution.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Copper",
        productName: "Copper cathodes 99.97–99.99%; copper concentrate +38%",
        availableQuantity: 5200,
        price: perTon(11400, "USD", {
          priceNote: "Cathode at LME −20% (≈ $11,400); concentrate at LME −55%",
          paymentTerms: "Demands direct upfront cash transfer before contract execution.",
          minimumOrderQuantity: 1000,
        }),
      },
    ],
  },
  {
    name: "Sutruma Metals & Agro Co. Ltd",
    country: "TZ",
    region: "Dar es Salaam",
    city: "Dar es Salaam",
    lat: -6.79,
    lng: 39.21,
    phone: "+255 789 530 689",
    contactName: "Mr. James Simon",
    description: "Copper cathode seller in Dar es Salaam.",
    verified: false,
    role: "BROKER",
    riskLevel: "SCAM",
    assessment:
      "High-risk scam: business card is a generic mock-up with a fake EMV chip/Visa logo; $7,500/MT is well below " +
      "scrap/spot copper value.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Copper",
        productName: "Copper cathode",
        price: perTon(7500, "USD", { minimumOrderQuantity: 500, priceNote: "MOQ negotiable" }),
      },
    ],
  },
  {
    name: "Odisha iron ore supplier (via Roomies chat)",
    country: "IN",
    region: "Odisha",
    city: "Odisha",
    lat: 20.94,
    lng: 84.8,
    description:
      "Unnamed domestic supplier/middleman reached through the Roomies chat. Claims ready dispatch from Odisha " +
      "with T1/T2 transit permits.",
    verified: false,
    role: "TRADER",
    riskLevel: "MODERATE",
    assessment: "Contact unspecified; confirm identity, mine/crusher papers and permits before dealing.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore",
        price: perTon(6500, "INR", {
          availability: "AVAILABLE",
          priceNote: "+ GST (5% on mine paper, 18% on crusher paper)",
        }),
      },
    ],
  },
  {
    name: "Unidentified broker (+94 77 482 4853)",
    country: "IN",
    region: "Odisha",
    city: "Odisha / Karnataka (claimed)",
    lat: 20.94,
    lng: 84.8,
    phone: "+94 77 482 4853",
    description:
      "Unnamed caller with a Sri Lankan number claiming iron ore supply from Odisha / Karnataka, delivered " +
      "FOR Nagpur. Placed at the claimed origin.",
    verified: false,
    role: "BROKER",
    riskLevel: "HIGH",
    assessment:
      'Suspect broker: Sri Lankan calling code (+94) offering domestic Indian delivery; asked basic questions like ' +
      '"INR or USD" and "per MT or per kg".',
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore lumps Fe 63%+, 5–18 mm",
        price: perTon(11500, "INR", { priceNote: "FOR Nagpur (delivered)" }),
      },
    ],
  },
  {
    name: "Ashok",
    country: "IN",
    region: "Maharashtra",
    city: "Nagpur",
    lat: 21.15,
    lng: 79.09,
    phone: "+91 99679 60855",
    contactName: "Ashok",
    description:
      "Plant-side buyer mandate for iron ore lumps delivered FOR Nagpur. Seeking a direct crusher/mine owner; " +
      "requested a formal ICPO on review of the SCO. Price: SCO / market price pending.",
    verified: false,
    role: "BUYER",
    riskLevel: "MODERATE",
    assessment: "Buyer-side mandate, not the end user; confirm the plant and mandate letter.",
    source: SHEET_1,
    offers: [
      {
        mineral: "Iron Ore",
        productName: "Iron ore lumps Fe 63%+, 5–18 mm (wanted)",
        monthlyCapacity: { min: 1000, max: 1000 },
      },
    ],
  },
  {
    name: "Global Partnership & Cooperation (GPARCO)",
    country: "RU",
    region: "Moscow",
    city: "Moscow",
    lat: 55.76,
    lng: 37.62,
    phone: "+7 993 277-00-91 / +90 531 662 9288",
    contactName: "Ms. Guzel Shaiakhmetova",
    description:
      'Shell intermediary with vague origin ("Africa / Asia as seller\'s choice"). Placed in Russia from the +7 ' +
      "phone number; also uses a Turkish (+90) number.",
    verified: false,
    role: "BROKER",
    riskLevel: "SCAM",
    assessment:
      "Phishing / ghost broker: demands corporate LOI upfront; impossible discounts; contradictory payment clauses " +
      "(MT700 vs TT at loading port).",
    source: SHEET_1,
    offers: [
      {
        mineral: "Copper",
        productName: "Copper cathode, copper wire scrap, copper concentrate",
        specifications: "Cathode at LME −8%; scrap at LME −10%. Trial 500–3,000 MT.",
        monthlyCapacity: { min: 1000, max: 25000 },
      },
      {
        mineral: "Aluminium",
        productName: "Aluminium A7",
        specifications: "A7 at LME −8%. Trial 500–3,000 MT.",
        monthlyCapacity: { min: 1000, max: 25000 },
      },
    ],
  },
];

// ── Sheet 2 — aluminium buyers and sellers ─────────────────────────────────
const sheet2: SupplierSeed[] = [
  {
    name: "Jindal Aluminium Ltd.",
    country: "IN",
    region: "Karnataka",
    city: "Bengaluru",
    lat: 12.97,
    lng: 77.59,
    phone: "080-23715555",
    email: "info@jindalaluminium.com",
    description:
      "Direct industrial buyer, Bengaluru & Dabaspet (Karnataka). Terms: factory delivery; weighbridge clearance; " +
      "standard 15–30 day credit or RTGS.",
    verified: true,
    role: "BUYER",
    riskLevel: "LOW",
    assessment: "Verified end-user: contact the Raw Material Purchase Desk. Top off-take priority.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "6063 clean extrusion scrap, billets & primary ingots (wanted)" }],
  },
  {
    name: "Bhoruka Extrusions Pvt. Ltd.",
    country: "IN",
    region: "Karnataka",
    city: "Mysuru",
    lat: 12.34,
    lng: 76.62,
    phone: "0821-4286100",
    email: "enquiries@bhorukaextrusions.com",
    address: "Metagalli Industrial Area, Mysuru, Karnataka",
    description:
      "Direct industrial buyer. Terms: direct plant intake; zero iron/rubber contamination; vendor empanelment " +
      "required.",
    verified: true,
    role: "BUYER",
    riskLevel: "LOW",
    assessment: "Verified end-user: contact the Factory Purchase Manager at Mysuru Works.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "6060 / 6063 extrusion billets & clean cut scrap (wanted)" }],
  },
  {
    name: "CMR Green Technologies Ltd.",
    country: "IN",
    region: "Haryana",
    city: "Palwal",
    lat: 28.15,
    lng: 77.33,
    phone: "0129-4223050",
    email: "info@cmr.co.in",
    description:
      "Direct secondary smelter with multiple plants (Palwal, Chennai, Pune, Gujarat); shown at Palwal. Continuous " +
      "bulk buying; accepts domestic FOR yard delivery and CIF container imports.",
    verified: true,
    role: "BUYER",
    riskLevel: "LOW",
    assessment: "Verified end-user: India's largest non-ferrous recycler. Pitch to Scrap Procurement.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "6063 extrusion scrap, Tense, TT, dross (wanted)" }],
  },
  {
    name: "Century Extrusions Ltd.",
    country: "IN",
    region: "West Bengal",
    city: "Kharagpur",
    lat: 22.35,
    lng: 87.23,
    phone: "033-22291012",
    email: "enquiry@centuryextrusions.com",
    description:
      "Direct industrial buyer; plant at Kharagpur, head office Kolkata. Terms: plant-gate delivery; test report " +
      "verification; payment on weighbridge clearance.",
    verified: true,
    role: "BUYER",
    riskLevel: "LOW",
    assessment: "Verified end-user: approach the Central Commercial Purchase Division in Kolkata.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "Aluminium extrusion scrap 6063 & remelt ingots (wanted)" }],
  },
  {
    name: "Maan Aluminium Ltd.",
    country: "IN",
    region: "Madhya Pradesh",
    city: "Pithampur",
    lat: 22.61,
    lng: 75.68,
    phone: "07292-253618",
    email: "info@maanaluminium.in",
    address: "Pithampur Industrial Area, Dhar/Indore, Madhya Pradesh",
    description:
      "Direct industrial buyer. Requires regular monthly consignments (truckloads) on standard commercial terms.",
    verified: true,
    role: "BUYER",
    riskLevel: "LOW",
    assessment: "Verified end-user: contact Inbound Metal Stores / Purchase Dept at Pithampur.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "6063 scrap, billet castings & A7/A8 ingots (wanted)" }],
  },
  {
    name: "Dhanush Mnp",
    country: "IN",
    region: "Karnataka",
    city: "Bengaluru",
    lat: 12.97,
    lng: 77.59,
    phone: "+91 70109 29635",
    description:
      "Domestic buyer lead for delivery to Bangalore / Tamil Nadu; regular bulk-volume orders.",
    verified: false,
    role: "BUYER",
    riskLevel: "MODERATE",
    assessment: "Actionable domestic lead: screen immediately — request company name and GSTIN first.",
    source: SHEET_2,
    offers: [
      { mineral: "Aluminium", productName: "Aluminium 6063 / 7075 (wanted)" },
      { mineral: "Copper", productName: "Copper and brass (wanted)" },
    ],
  },
  {
    name: "Prolific Commodities Exporters",
    country: "MY",
    city: "Malaysia",
    lat: 4.2,
    lng: 101.98,
    phone: "+60 16-502 6943",
    description:
      "Overseas supplier of aluminium 6063 bales/scrap, CIF export from Malaysia. MOQ 1 container (~20–25 MT); " +
      "payment 100% sight LC.",
    verified: false,
    role: "TRADER",
    riskLevel: "MODERATE",
    assessment: "Moderate risk (viable structure): 1-container MOQ via sight LC is standard. Require PSIC.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "Aluminium 6063 bales / scrap", specifications: "MOQ 1 container (~20–25 MT). Payment: 100% sight LC." }],
  },
  {
    name: "Samar Madian",
    country: "EG",
    city: "Egypt",
    lat: 26.8,
    lng: 30.8,
    phone: "+20 11 56491212",
    contactName: "Samar Madian",
    description: "Overseas buyer enquiry for seaborne imports into Egypt; large container volumes, regular requirement.",
    verified: false,
    role: "BUYER",
    riskLevel: "MODERATE",
    assessment: "Moderate risk: buyer enquiry. Only viable with export yard documentation.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "Aluminium scrap 6060 / 6063 (wanted)" }],
  },
  {
    name: "Solman Afzal",
    country: "AE",
    city: "UAE (claimed)",
    lat: 24.3,
    lng: 54.4,
    phone: "+971 52 135 7698 / +971 55 462 7618",
    contactName: "Solman Afzal",
    description: "Paper broker claiming UAE base. Unspecified MOQ; terms listed as TT/LC/DLC at sight.",
    verified: false,
    role: "BROKER",
    riskLevel: "HIGH",
    assessment: "High risk: rotating numbers with recycled stock photos; no trade licence.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "ADC12, A7, A8 and 6063 ingots" }],
  },
  {
    name: "Saima Qamar Syma",
    country: "PK",
    city: "Pakistan",
    lat: 30.4,
    lng: 69.3,
    phone: "+92 317 5906927",
    contactName: "Saima Qamar Syma",
    description: "Individual WhatsApp broker in Pakistan offering 6063 scrap of claimed Kazakh origin.",
    verified: false,
    role: "BROKER",
    riskLevel: "SCAM",
    assessment: "Unviable / discard: fictitious volume (5,000–200,000 MT/month); individual WhatsApp broker.",
    source: SHEET_2,
    offers: [
      {
        mineral: "Aluminium",
        productName: "6063 scrap (claimed Kazakhstan origin)",
        monthlyCapacity: { min: 5000, max: 200000 },
        price: perTon(1800, "USD", { incoterm: "CIF", priceNote: "Net; gross $1,850" }),
      },
    ],
  },
  {
    name: "Kevin Nyamboki / William",
    country: "US",
    region: "New York",
    city: "New York (VoIP number)",
    lat: 40.71,
    lng: -74.01,
    phone: "+1 (929) 789-3276",
    email: "dynamicmetalgroup@gmail.com",
    contactName: "Kevin Nyamboki / William",
    description: "Claims US/global base; CIF terms with monthly container shipments.",
    verified: false,
    role: "BROKER",
    riskLevel: "HIGH",
    assessment: "High risk: mismatched profile, free Gmail address, VoIP NYC area code. Avoid.",
    source: SHEET_2,
    offers: [{ mineral: "Aluminium", productName: "Extrusion 6063 scrap & mixed scrap", specifications: "CIF; monthly container shipments." }],
  },
];

// ── Sheet 3 — aluminium A7 / primary and steel drum directory ───────────────
type DirectoryRow = Pick<
  SupplierSeed,
  "name" | "country" | "region" | "city" | "lat" | "lng" | "phone" | "email" | "website" | "address" | "role" | "riskLevel"
> & { type: string; grade: string; assessment: string; notes?: string };

const directory = (mineral: string, rows: DirectoryRow[]): SupplierSeed[] =>
  rows.map(({ type, grade, assessment, notes, ...row }) => ({
    ...row,
    description: [type, notes].filter(Boolean).join(". ") + ".",
    verified: false,
    assessment,
    source: SHEET_3,
    offers: [{ mineral, productName: grade }],
  }));

const aluminiumDirectory = directory("Aluminium", [
  {
    name: "NALCO (National Aluminium Co. Ltd.)",
    country: "IN", region: "Odisha", city: "Bhubaneswar", lat: 20.3, lng: 85.82,
    phone: "0674-2301988", email: "marketing@nalcoindia.co.in",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct smelter / PSU producer",
    notes: "Plant contact: edsnp@nalcoindia.co.in",
    grade: "P1020A / primary aluminium (LME registered)",
    assessment: "Tier-1 direct smelter: 460k MT/year; official tenders / direct institutional booking; zero broker risk.",
  },
  {
    name: "Vedanta Aluminium / BALCO",
    country: "IN", region: "Odisha", city: "Jharsuguda", lat: 21.86, lng: 84.01,
    phone: "+91 22 6646 1000", email: "domesticmarketing@vedanta.co.in",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct smelter producer (Odisha / Chhattisgarh)",
    notes: "Exports: aluminiumexports@vedanta.co.in",
    grade: "P1020 (≥99.7%) primary aluminium",
    assessment: "Tier-1 direct producer: ~2.42M MT/year; published monthly benchmark pricing; direct commercial sales desk.",
  },
  {
    name: "Hindalco Industries Ltd.",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    website: "https://www.hindalco.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct smelter producer with multiple Indian plants (shown at Mumbai HQ)",
    notes: "Contact the Central Sales Desk",
    grade: "P1020 (99.70%+) primary aluminium",
    assessment: "Tier-1 direct producer: ~1.34M MT/year; direct institutional booking; LME-linked pricing.",
  },
  {
    name: "Emirates Global Aluminium (EGA)",
    country: "AE", region: "Dubai", city: "Jebel Ali", lat: 24.99, lng: 55.06,
    phone: "+971 4 884 6666", email: "customer@ega.ae",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter (Dubai / Abu Dhabi)",
    grade: "Primary aluminium / P1020 / value-added products",
    assessment: "Tier-1 Gulf smelter: ~2.8M MT/year; direct contract desk for Middle East / export off-take.",
  },
  {
    name: "Aluminium Bahrain (Alba)",
    country: "BH", city: "Askar", lat: 26.07, lng: 50.6,
    phone: "+973 1783 0000", email: "sales@albasmelter.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter",
    grade: "Primary aluminium (99.7%+)",
    assessment: "Tier-1 Gulf smelter: ~1.54M MT/year; high-volume direct sales desk; LC/term contracts.",
  },
  {
    name: "Ma'aden Aluminium",
    country: "SA", region: "Eastern Province", city: "Ras Al-Khair", lat: 27.55, lng: 49.2,
    phone: "+966 11 874 8000", email: "info@maaden.com.sa",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter",
    grade: "Primary aluminium P1020",
    assessment: "Tier-1 Gulf smelter: ~740k MT/year; direct institutional regional supplier.",
  },
  {
    name: "RUSAL",
    country: "RU", region: "Moscow", city: "Moscow", lat: 55.76, lng: 37.62,
    phone: "+7 495 720 51 70", email: "sales@rusal.com",
    role: "PRODUCER", riskLevel: "MODERATE", type: "Direct primary smelter",
    notes: "Documents: documents@rusal.com",
    grade: "A7E / primary aluminium",
    assessment: "Tier-1 global producer: major Russian smelters; strict compliance/OFAC checks required before booking.",
  },
  {
    name: "Kazakhstan Electrolysis Plant (ERG/KAS)",
    country: "KZ", region: "Pavlodar", city: "Pavlodar", lat: 52.29, lng: 76.97,
    phone: "+7 7182 74 33 35", email: "kas@erg.kz",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter",
    grade: "A7E / primary aluminium",
    assessment: "Tier-1 CIS smelter: direct state/conglomerate producer; requires direct KYC and LC lines.",
  },
  {
    name: "Rio Tinto Aluminium",
    country: "CA", region: "Quebec", city: "Montreal", lat: 45.5, lng: -73.57,
    website: "https://www.riotinto.com", email: "aluminium@riotinto.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Multinational miner/smelter (Australia / Canada; shown at Montreal HQ)",
    grade: "P1020 / primary aluminium",
    assessment: "Tier-1 global major: Tomago/Kitimat smelters; direct multinational procurement channels.",
  },
  {
    name: "Hydro Aluminium",
    country: "NO", region: "Oslo", city: "Oslo", lat: 59.91, lng: 10.75,
    phone: "+47 22 53 81 00", email: "aluminium.sales@hydro.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Multinational smelter",
    grade: "Primary aluminium P1020 / low-carbon",
    assessment: "Tier-1 global major: direct European smelter desk; contractual off-take only.",
  },
  {
    name: "Alcoa",
    country: "US", region: "Pennsylvania", city: "Pittsburgh", lat: 40.44, lng: -80.0,
    phone: "+1 412 315 2900", website: "https://www.alcoa.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Multinational smelter (USA / global)",
    grade: "Primary aluminium (99.7%+)",
    assessment: "Tier-1 global major: direct corporate sales; standard global trading terms.",
  },
  {
    name: "China Hongqiao Group",
    country: "CN", region: "Shandong", city: "Zouping", lat: 36.86, lng: 117.74,
    phone: "+86 543 216 1735", email: "ir@hongqiaochina.com",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter",
    grade: "Primary aluminium / A7",
    assessment: "Tier-1 Chinese major: world's largest aluminium producer (>6M MT/year); FOB/CIF booking.",
  },
  {
    name: "Mozal Aluminium",
    country: "MZ", region: "Maputo", city: "Beluluane", lat: -25.93, lng: 32.47,
    website: "https://www.mozal.com", email: "mozalsales@bma.co.mz",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter (South32 joint venture)",
    grade: "Primary aluminium P1020",
    assessment: "Tier-1 African smelter: ~560k MT/year; direct commercial desk.",
  },
  {
    name: "Boyne Smelters Ltd. (BSL)",
    country: "AU", region: "Queensland", city: "Boyne Island", lat: -23.94, lng: 151.35,
    phone: "+61 7 4973 9000", email: "sales@boynesmelters.com.au",
    role: "PRODUCER", riskLevel: "LOW", type: "Direct primary smelter",
    grade: "Primary aluminium (99.7%+)",
    assessment: "Tier-1 smelter: >500k MT/year capacity; direct long-term export contracts.",
  },
  {
    name: "SVM Global Metals India Pvt Ltd",
    country: "IN", region: "Telangana", city: "Hyderabad", lat: 17.4, lng: 78.44,
    phone: "040-40206283 / WA +91 99663 44985", email: "info@smvimpexpvtltd.in",
    address: "Mehdipatnam, Hyderabad",
    role: "TRADER", riskLevel: "MODERATE", type: "Stockist / impex trader",
    grade: "Primary A7 / imported ingots",
    assessment: "Domestic stockist: verify stock in yard before any advance.",
  },
  {
    name: "Phoolchand BhagatSingh",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.84,
    phone: "+91 81049 19115", email: "info@phoolchand.com", address: "Santacruz, Mumbai",
    role: "TRADER", riskLevel: "MODERATE", type: "Domestic metal merchant",
    grade: "A7 / primary metals & scrap",
    assessment: "Domestic merchant: verify godown stock in Bhiwandi/Taloja.",
  },
  {
    name: "King Metals and Alloys Madras Ltd",
    country: "IN", region: "Tamil Nadu", city: "Chennai", lat: 13.1, lng: 80.16,
    phone: "044-26880633 / +91 98840 60999", email: "chettiar888@gmail.com",
    address: "Ambattur Industrial Estate, Chennai",
    role: "MANUFACTURER", riskLevel: "MODERATE", type: "Alloy manufacturer / trader",
    grade: "A7 ingots / foundry alloys",
    assessment: "Regional processor: verify actual stock via physical inspection.",
  },
  {
    name: "Phoenix Industries",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    phone: "022-40441111 / +91 70692 33643", email: "sales@phoenixalloys.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Aluminium processor / trader",
    grade: "P1020 / 99.7% ingots",
    assessment: "Domestic supplier: established Mumbai office/plant; standard domestic payment terms.",
  },
  {
    name: "Arkline International",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    phone: "+91 88989 81378", website: "https://arklineinternational.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading house",
    grade: "A7 / P1020 aluminium",
    assessment: "Domestic trader: intermediary/trader desk; inspect material prior to signing.",
  },
  {
    name: "Aritra Trading Corporation",
    country: "IN", region: "West Bengal", city: "Kolkata", lat: 22.57, lng: 88.36,
    phone: "033-66036289",
    role: "TRADER", riskLevel: "MODERATE", type: "Regional metal merchant",
    grade: "A7 aluminium ingot (99.70%)",
    assessment: "Domestic merchant: local Kolkata trading house; require weighbridge delivery terms.",
  },
  {
    name: "Millennium Multi Trade Pvt Ltd",
    country: "IN", region: "West Bengal", city: "Kolkata", lat: 22.57, lng: 88.36,
    phone: "+91 81001 08283",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading house",
    grade: "A7 aluminium ingot",
    assessment: "Domestic trader: third-party supplier; verify GSTIN and physical yard before transacting.",
  },
  {
    name: "J3N Solutions Pvt Ltd",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    phone: "+91 99203 87944",
    role: "BROKER", riskLevel: "MODERATE", type: "Trading company",
    grade: "A7 aluminium ingot",
    assessment: "Domestic intermediary: local Mumbai broker/trader; trade only on physical delivery.",
  },
  {
    name: "Crypton Exports LLP",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    phone: "+91 77385 14619", email: "info@cryptonexports.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Export / import trader",
    grade: "P1020 primary aluminium",
    assessment: "Trading firm: verify physical stock vs. brokerage indent.",
  },
  {
    name: "Tanzila Exports",
    country: "IN", region: "Gujarat", city: "Gujarat", lat: 22.26, lng: 71.19,
    phone: "+91 98989 59963", email: "jonty@tanzilaexport.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Merchant exporter",
    grade: "P1020 / equivalent 99.7%",
    assessment: "Merchant trader: sourcing broker/trader; requires full verification.",
  },
  {
    name: "Bluemint Metal / Cromor Mining",
    country: "TR", region: "Ankara", city: "Ankara", lat: 39.93, lng: 32.86,
    phone: "+90 535 540 1148", email: "export@bluemintmetal.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading house (Ankara / Izmir)",
    grade: "A7 (99.70%+) ingots",
    assessment: "International trader: Turkish commercial trader; mandate DLC MT700 at discharge port only.",
  },
  {
    name: "Crescent Metals",
    country: "US", region: "California", city: "Orange County", lat: 33.84, lng: -117.91,
    phone: "+1 714 270 7635", email: "ahmed@crescent-metals.com",
    role: "BROKER", riskLevel: "MODERATE", type: "Non-ferrous broker",
    grade: "Primary & secondary ingot",
    assessment: "Overseas trader: intermediary broker in California; confirm physical yard ownership.",
  },
  {
    name: "Shandong Hengcai Steel Co. Ltd.",
    country: "CN", region: "Shandong", city: "Shandong", lat: 36.35, lng: 118.0,
    phone: "WA +86 133 7053 2608", email: "info@sdhengcaisteel.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading company",
    grade: "A7 ingot (~1,000 MT/month)",
    assessment: "Chinese trader: standard trading entity; accept only 100% sight LC (no cash advance).",
  },
  {
    name: "Zhongxi Metal Technology",
    country: "CN", region: "Shandong", city: "Shandong", lat: 36.35, lng: 118.0,
    phone: "WA +86 153 1570 4781", email: "sales01@zhongximetal.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading company",
    grade: "A7 / AL99.70 ingots",
    assessment: "Chinese trader: export merchant; strict DLC terms required.",
  },
  {
    name: "Hubei Ruichuang Metal",
    country: "CN", region: "Hubei", city: "Hubei", lat: 30.98, lng: 112.27,
    phone: "WA +86 134 0719 4056", email: "admin@ruichuangmetal.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Processor / trader",
    grade: "A7 aluminium 99.7%",
    assessment: "Chinese exporter: intermediary seller; payment via standard LC only.",
  },
  {
    name: "Tianjin JNS Steel",
    country: "CN", region: "Tianjin", city: "Tianjin", lat: 39.34, lng: 117.36,
    phone: "+86 136 4213 1571", email: "sales@tjjnssteel.com",
    role: "TRADER", riskLevel: "MODERATE", type: "Trading firm",
    grade: "A7 / AL99.70 ingots",
    assessment: "Chinese trader: require CCIC pre-shipment inspection.",
  },
  {
    name: "AWF Global Trading",
    country: "CN", region: "Hong Kong", city: "Hong Kong", lat: 22.32, lng: 114.17,
    phone: "WA +852 6266 1443", email: "contact@awftraders.com",
    role: "TRADER", riskLevel: "HIGH", type: "Trading house",
    grade: "A7 aluminium ingot",
    assessment: "HK shell/trader: offshore trader; verify smelter allocation before engagement.",
  },
  {
    name: "Nautica Metal Scrap",
    country: "NL", city: "Netherlands", lat: 52.13, lng: 5.29,
    phone: "WA +31 970 102 294 26", email: "info@nauticametalscrap.com",
    role: "BROKER", riskLevel: "HIGH", type: "Scrap / ingot broker",
    grade: "A7 99.7% (quotes 20,000 MT/month)",
    assessment: "High risk / paper trader: 20k MT/month quote is typical paper-broker tonnage; requires strict vetting.",
  },
  {
    name: "Tech Aluminum",
    country: "EG", city: "Egypt", lat: 26.8, lng: 30.8,
    website: "https://techaluminum.com", email: "noel@techaluminum.com",
    role: "MANUFACTURER", riskLevel: "MODERATE", type: "Regional extruder / trader",
    notes: "MOQ 20 MT",
    grade: "A7 / P1020A (MOQ 20 MT)",
    assessment: "Regional processor: Egyptian local producer; viable for a 1-container trial on LC terms.",
  },
  {
    name: "Anubhav Aluminium Work Pvt Ltd",
    country: "IN", region: "Chhattisgarh", city: "Bhilai", lat: 21.19, lng: 81.35,
    phone: "0788-2281983 / IndiaMart 08048274619",
    role: "MANUFACTURER", riskLevel: "MODERATE", type: "Fabricator / foundry",
    grade: "A7 aluminium ingot",
    assessment: "Domestic regional unit: website inactive; verify Bhilai/Nehru Nagar works directly before trade.",
  },
  {
    name: "Cam Rural Mines Corp",
    country: "CM", city: "Cameroon", lat: 7.37, lng: 12.35,
    role: "BROKER", riskLevel: "SCAM", type: "Artisanal / broker entity",
    notes: "No valid physical address or phone on its site",
    grade: "A7 ingots / ore",
    assessment:
      "High risk / advance-fee trap: Cameroon spot ingot leads without a verified physical plant are fraudulent. Discard.",
  },
]);

const drumDirectory = directory("Steel Drums", [
  {
    name: "Balmer Lawrie & Co. Ltd. (IPD)",
    country: "IN", region: "West Bengal", city: "Kolkata", lat: 22.57, lng: 88.35,
    phone: "033-22225300 / Taloja 022-27412361", email: "ipd@balmerlawrie.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct PSU manufacturer (Kolkata / Taloja / Silvassa)",
    grade: "209 L tight-head steel drums (UN rated)",
    assessment:
      "Tier-1 direct manufacturer: India's largest barrel producer; fully automated lines; handles containerised export to Iraq.",
  },
  {
    name: "Balmer Lawrie (UAE) LLC",
    country: "AE", region: "Dubai", city: "Dubai", lat: 25.2, lng: 55.27,
    phone: "+971 4 347 2888", email: "info@balmerlawrie.ae",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct manufacturer, Gulf (Dubai / RAK)",
    grade: "209 L (55 gal) tight-head UN drums",
    assessment:
      "Tier-1 Gulf manufacturer: Balmer Lawrie JV in UAE; closest direct feeder plant for sea/overland shipping to Iraq.",
  },
  {
    name: "Greif Middle East",
    country: "AE", region: "Dubai", city: "Jebel Ali", lat: 25.01, lng: 55.06,
    phone: "+971 4 883 5544", website: "https://www.greif.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct global manufacturer (Jebel Ali, UAE / Jubail, Saudi Arabia)",
    grade: "209 L tight-head drums + Drum360 screen print",
    assessment: "Tier-1 global major: world packaging leader; JAFZA plant supplies Middle East refineries including Iraq corridors.",
  },
  {
    name: "Time Technoplast Ltd.",
    country: "IN", region: "Maharashtra", city: "Mumbai", lat: 19.08, lng: 72.88,
    phone: "022-71119999", email: "tt@timetechnoplast.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct manufacturer (India / UAE)",
    grade: "209 L / 210 L tight-head steel barrels",
    assessment: "Tier-1 manufacturer: multi-plant industrial packaging conglomerate; production hubs across India and GCC.",
  },
  {
    name: "Pyramid Technoplast Ltd.",
    country: "IN", region: "Gujarat", city: "Dahej", lat: 21.69, lng: 72.57,
    phone: "022-42761500 / Dahej 02642-248666", email: "sales@pyramidtechnoplast.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct manufacturer (Bharuch / Dahej, Gujarat)",
    grade: "209 L MS tight-head cold-rolled steel drums",
    assessment: "Tier-1 manufacturer: automated barrel lines in Dahej near Kandla/Mundra ports; regular container exporter.",
  },
  {
    name: "Gulf Star Steel Drums LLC",
    country: "AE", region: "Dubai", city: "Dubai Investment Park", lat: 24.99, lng: 55.16,
    phone: "+971 4 335 9664", email: "info@gulfstarsteeldrums.com",
    role: "MANUFACTURER", riskLevel: "LOW", type: "Direct manufacturer",
    grade: "209 L tight-head cold-rolled liquid drums",
    assessment:
      "Tier-1 regional manufacturer: automated European lines with full electrostatic painting and silk-screening.",
  },
]);

export const miningPeople: SupplierSeed[] = [...sheet1, ...sheet2, ...aluminiumDirectory, ...drumDirectory];

/**
 * Rows with no location at all (no city, country or phone country code), so
 * they cannot be placed on the globe. Kept here so nothing from the sheets is lost.
 */
export const unlocated = [
  { name: "Dubila Austin", sheet: SHEET_1, commodity: "Copper cathode", note: "Shared lead; inactive, not answering calls." },
  {
    name: "Sunita Kangale",
    sheet: SHEET_2,
    commodity: "Extrusion 6063 painted & coated scrap, quotes $2,400 CIF",
    note:
      "Facebook Messenger only. Demands 30% upfront cash advance and refuses past performance — extreme scam risk; discard.",
  },
  {
    name: "USSLT Global",
    sheet: SHEET_3,
    commodity: "A7 99.70% (FOB/CIF) — usslt.com, info@usslt.com",
    note: "Online intermediary / virtual trading desk; confirm physical smelter allocation.",
  },
];
