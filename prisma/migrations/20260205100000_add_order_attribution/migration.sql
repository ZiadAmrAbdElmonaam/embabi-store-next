-- AlterTable Order: add attribution columns (UTM + click ids) for media buying
ALTER TABLE "Order" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "Order" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "Order" ADD COLUMN "fbclid" TEXT;
ALTER TABLE "Order" ADD COLUMN "gclid" TEXT;
