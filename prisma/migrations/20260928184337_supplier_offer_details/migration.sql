-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP');

-- AlterTable
ALTER TABLE "MineralPrice" ADD COLUMN     "incoterm" "Incoterm",
ADD COLUMN     "loadingPort" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ALTER COLUMN "source" SET DEFAULT 'supplier-offer';

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contactName" TEXT;

-- AlterTable
ALTER TABLE "SupplierMineral" ADD COLUMN     "monthlyCapacityMax" DECIMAL(16,3),
ADD COLUMN     "monthlyCapacityMin" DECIMAL(16,3),
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "specifications" TEXT;
