-- CreateEnum
CREATE TYPE "CounterpartyRole" AS ENUM ('PRODUCER', 'MANUFACTURER', 'TRADER', 'BROKER', 'BUYER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'SCAM');

-- AlterEnum
ALTER TYPE "MineralCategory" ADD VALUE 'PACKAGING';

-- AlterTable
ALTER TABLE "MineralPrice" ADD COLUMN     "priceNote" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "assessment" TEXT,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "role" "CounterpartyRole" NOT NULL DEFAULT 'TRADER',
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Supplier_role_idx" ON "Supplier"("role");

-- CreateIndex
CREATE INDEX "Supplier_riskLevel_idx" ON "Supplier"("riskLevel");
