/**
 * Rebuilds the database from the checked-in data files:
 *   reference-data.ts — countries and the mineral catalogue
 *   suppliers.ts      — supplier offers as received from suppliers
 *   mining-people.ts  — counterparties from the MINING PEOPLE lead sheets
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { countries, minerals } from "./reference-data";
import { miningPeople, unlocated } from "./mining-people";
import { suppliers as directOffers } from "./suppliers";

const suppliers = [...directOffers, ...miningPeople];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function main() {
  console.log("Clearing existing data…");
  await prisma.$transaction([
    prisma.mineralPrice.deleteMany(),
    prisma.supplierMineral.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.region.deleteMany(),
    prisma.mineral.deleteMany(),
    prisma.country.deleteMany(),
  ]);

  const countryIds = new Map<string, string>();
  for (const c of countries) {
    const row = await prisma.country.create({ data: c });
    countryIds.set(c.code, row.id);
  }

  const mineralIds = new Map<string, string>();
  for (const m of minerals) {
    const row = await prisma.mineral.create({ data: { ...m, slug: slugify(m.name) } });
    mineralIds.set(m.name, row.id);
  }

  let offers = 0;
  let prices = 0;
  const slugs = new Set<string>();
  for (const s of suppliers) {
    const countryId = countryIds.get(s.country);
    if (!countryId) throw new Error(`Unknown country ${s.country} for ${s.name}`);

    const region = s.region
      ? await prisma.region.upsert({
          where: { countryId_name: { countryId, name: s.region } },
          create: { countryId, name: s.region },
          update: {},
        })
      : null;

    const slug = slugify(s.name);
    if (slugs.has(slug)) throw new Error(`Duplicate supplier slug ${slug}`);
    slugs.add(slug);

    const supplier = await prisma.supplier.create({
      data: {
        name: s.name,
        slug,
        countryId,
        regionId: region?.id,
        city: s.city,
        latitude: s.lat,
        longitude: s.lng,
        address: s.address,
        website: s.website,
        email: s.email,
        phone: s.phone,
        contactName: s.contactName,
        description: s.description,
        verified: s.verified,
        role: s.role,
        riskLevel: s.riskLevel,
        assessment: s.assessment,
        source: s.source,
      },
    });

    for (const o of s.offers) {
      const mineralId = mineralIds.get(o.mineral);
      if (!mineralId) throw new Error(`Unknown mineral ${o.mineral} for ${s.name}`);

      await prisma.supplierMineral.create({
        data: {
          supplierId: supplier.id,
          mineralId,
          productName: o.productName,
          specifications: o.specifications,
          monthlyCapacityMin: o.monthlyCapacity?.min,
          monthlyCapacityMax: o.monthlyCapacity?.max,
          availableQuantity: o.availableQuantity,
          quantityUnit: o.price?.unit ?? o.unit ?? "METRIC_TON",
        },
      });
      offers++;
      if (!o.price) continue;

      const quotedOn = new Date(o.price.quotedOn);
      prices++;
      await prisma.mineralPrice.create({
        data: {
          supplierId: supplier.id,
          mineralId,
          price: o.price.amount,
          currency: o.price.currency,
          unit: o.price.unit,
          incoterm: o.price.incoterm,
          loadingPort: o.price.loadingPort,
          paymentTerms: o.price.paymentTerms,
          priceNote: o.price.priceNote,
          minimumOrderQuantity: o.price.minimumOrderQuantity,
          availability: o.price.availability,
          validFrom: quotedOn,
          lastUpdated: quotedOn,
          source: "supplier-offer",
        },
      });
    }
  }

  console.log(
    `Done: ${countries.length} countries, ${minerals.length} minerals, ${suppliers.length} counterparties, ` +
      `${offers} offers, ${prices} priced quotes.`,
  );
  console.log(`Not placed (no location in the source): ${unlocated.map((u) => u.name).join(", ")}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
