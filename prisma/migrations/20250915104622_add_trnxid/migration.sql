-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trnxId" TEXT;

-- CreateIndex
CREATE INDEX "Order_trnxId_idx" ON "Order"("trnxId");
