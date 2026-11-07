-- Add per-user lifetime free-unit cap to BOGO campaigns.
-- Run on gb_production (dev databases get the column via synchronize).
-- Existing campaigns keep unlimited per-user grants (0 = unlimited).
ALTER TABLE "bogo_campaign"
  ADD COLUMN IF NOT EXISTS "maxFreePerUser" integer NOT NULL DEFAULT 0;
