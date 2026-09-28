-- CreateEnum
CREATE TYPE "Continent" AS ENUM ('AFRICA', 'ASIA', 'EUROPE', 'MIDDLE_EAST', 'NORTH_AMERICA', 'SOUTH_AMERICA', 'OCEANIA');

-- CreateEnum
CREATE TYPE "MineralCategory" AS ENUM ('METALLIC', 'INDUSTRIAL', 'PRECIOUS', 'ENERGY', 'GEMSTONE');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'INR', 'CNY', 'AUD', 'CAD', 'JPY');

-- CreateEnum
CREATE TYPE "PriceUnit" AS ENUM ('METRIC_TON', 'KILOGRAM', 'GRAM', 'POUND', 'OUNCE', 'CUBIC_METER', 'CARAT');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'LIMITED', 'ON_REQUEST', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" CHAR(2) NOT NULL,
    "isoNumeric" CHAR(3) NOT NULL,
    "continent" "Continent" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "regionId" TEXT,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "description" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mineral" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "MineralCategory" NOT NULL,
    "chemicalFormula" TEXT,
    "description" TEXT NOT NULL,
    "uses" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mineral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMineral" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "mineralId" TEXT NOT NULL,
    "availableQuantity" DECIMAL(16,3),
    "quantityUnit" "PriceUnit",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierMineral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MineralPrice" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "mineralId" TEXT NOT NULL,
    "price" DECIMAL(16,4) NOT NULL,
    "currency" "Currency" NOT NULL,
    "unit" "PriceUnit" NOT NULL,
    "minimumOrderQuantity" DECIMAL(16,3),
    "availability" "Availability" NOT NULL DEFAULT 'AVAILABLE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'demo-seed',
    "externalRef" TEXT,

    CONSTRAINT "MineralPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoNumeric_key" ON "Country"("isoNumeric");

-- CreateIndex
CREATE INDEX "Country_continent_idx" ON "Country"("continent");

-- CreateIndex
CREATE INDEX "Region_countryId_idx" ON "Region"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryId_name_key" ON "Region"("countryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

-- CreateIndex
CREATE INDEX "Supplier_countryId_idx" ON "Supplier"("countryId");

-- CreateIndex
CREATE INDEX "Supplier_regionId_idx" ON "Supplier"("regionId");

-- CreateIndex
CREATE INDEX "Supplier_latitude_longitude_idx" ON "Supplier"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_verified_idx" ON "Supplier"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "Mineral_name_key" ON "Mineral"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mineral_slug_key" ON "Mineral"("slug");

-- CreateIndex
CREATE INDEX "Mineral_category_idx" ON "Mineral"("category");

-- CreateIndex
CREATE INDEX "SupplierMineral_mineralId_idx" ON "SupplierMineral"("mineralId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierMineral_supplierId_mineralId_key" ON "SupplierMineral"("supplierId", "mineralId");

-- CreateIndex
CREATE INDEX "MineralPrice_supplierId_validUntil_idx" ON "MineralPrice"("supplierId", "validUntil");

-- CreateIndex
CREATE INDEX "MineralPrice_mineralId_validUntil_idx" ON "MineralPrice"("mineralId", "validUntil");

-- CreateIndex
CREATE INDEX "MineralPrice_lastUpdated_idx" ON "MineralPrice"("lastUpdated");

-- CreateIndex
CREATE INDEX "MineralPrice_mineralId_currency_price_idx" ON "MineralPrice"("mineralId", "currency", "price");

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMineral" ADD CONSTRAINT "SupplierMineral_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMineral" ADD CONSTRAINT "SupplierMineral_mineralId_fkey" FOREIGN KEY ("mineralId") REFERENCES "Mineral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MineralPrice" ADD CONSTRAINT "MineralPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MineralPrice" ADD CONSTRAINT "MineralPrice_mineralId_fkey" FOREIGN KEY ("mineralId") REFERENCES "Mineral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MineralPrice" ADD CONSTRAINT "MineralPrice_supplierId_mineralId_fkey" FOREIGN KEY ("supplierId", "mineralId") REFERENCES "SupplierMineral"("supplierId", "mineralId") ON DELETE CASCADE ON UPDATE CASCADE;
