-- Align AnalyticsEvent table with current Prisma schema
-- Adds UTM and geography columns used for admin analytics attribution.

ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "AnalyticsEvent" ADD COLUMN IF NOT EXISTS "region" TEXT;

-- Indexes matching @@index definitions in schema.prisma
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_utmSource_idx" ON "AnalyticsEvent"("utmSource");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_country_idx" ON "AnalyticsEvent"("country");

