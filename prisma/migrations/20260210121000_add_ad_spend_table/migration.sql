-- Create AdSpend table for tracking ad spend per UTM source.
-- Matches the AdSpend model in schema.prisma.

CREATE TABLE IF NOT EXISTS "AdSpend" (
  "id"          TEXT                     NOT NULL,
  "utmSource"   TEXT                     NOT NULL,
  "utmMedium"   TEXT,
  "utmCampaign" TEXT,
  "amount"      DECIMAL(10, 2)           NOT NULL,
  "spendDate"   TIMESTAMP(3)             NOT NULL,
  "createdAt"   TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdSpend_pkey" PRIMARY KEY ("id")
);

-- Indexes as defined in schema.prisma
CREATE INDEX IF NOT EXISTS "AdSpend_spendDate_idx" ON "AdSpend"("spendDate");
CREATE INDEX IF NOT EXISTS "AdSpend_utmSource_idx" ON "AdSpend"("utmSource");

