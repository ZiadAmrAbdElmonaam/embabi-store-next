-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('PAID', 'UNPAID');
CREATE TYPE "TaxType" AS ENUM ('FIXED', 'PERCENTAGE');

-- Drop ProductStorageVariant (old structure)
DROP TABLE IF EXISTS "ProductStorageVariant";

-- AlterTable ProductStorage: remove stock column
ALTER TABLE "ProductStorage" DROP COLUMN IF EXISTS "stock";

-- CreateTable ProductStorageUnit
CREATE TABLE "ProductStorageUnit" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "taxStatus" "TaxStatus" NOT NULL DEFAULT 'UNPAID',
    "taxType" "TaxType" NOT NULL DEFAULT 'FIXED',
    "taxAmount" DECIMAL(10,2),
    "taxPercentage" DECIMAL(5,2),

    CONSTRAINT "ProductStorageUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductStorageUnit_storageId_idx" ON "ProductStorageUnit"("storageId");
CREATE UNIQUE INDEX "ProductStorageUnit_storageId_color_taxStatus_key" ON "ProductStorageUnit"("storageId", "color", "taxStatus");

-- AddForeignKey
ALTER TABLE "ProductStorageUnit" ADD CONSTRAINT "ProductStorageUnit_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "ProductStorage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable CartItem: add unitId
ALTER TABLE "CartItem" ADD COLUMN "unitId" TEXT;

-- AlterTable AnonymousCartItem: add unitId
ALTER TABLE "AnonymousCartItem" ADD COLUMN "unitId" TEXT;

-- AlterTable OrderItem: add unitId
ALTER TABLE "OrderItem" ADD COLUMN "unitId" TEXT;
