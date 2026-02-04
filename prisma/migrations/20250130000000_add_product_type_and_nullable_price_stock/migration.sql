-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SIMPLE', 'STORAGE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "productType" "ProductType" NOT NULL DEFAULT 'SIMPLE';

-- Backfill: Set STORAGE for products that have storage options
UPDATE "Product" SET "productType" = 'STORAGE' WHERE id IN (
  SELECT "productId" FROM "ProductStorage" GROUP BY "productId"
);

-- AlterTable: Make price and stock nullable
ALTER TABLE "Product" ALTER COLUMN "price" DROP NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "stock" DROP NOT NULL;
