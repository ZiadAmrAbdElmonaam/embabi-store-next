-- CreateTable
CREATE TABLE "HeroThumbnail" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroThumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroThumbnail_order_key" ON "HeroThumbnail"("order");

-- CreateIndex
CREATE INDEX "HeroThumbnail_order_idx" ON "HeroThumbnail"("order");
