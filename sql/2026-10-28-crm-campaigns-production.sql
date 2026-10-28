-- CRM campaigns (SMS/email blasts to customer segments)
-- Test DB (gb_test): created automatically via TEMP_DB_SYNC=true.
-- Production (gb_production): run this file manually — synchronize is OFF there.
-- Mirrors src/crm/entities/crm-campaign.entity.ts and crm-campaign-recipient.entity.ts.

-- Enum types (names match what TypeORM generates)
CREATE TYPE IF NOT EXISTS crm_campaign_channel_enum AS ENUM ('sms', 'email');
CREATE TYPE IF NOT EXISTS crm_campaign_status_enum AS ENUM ('draft', 'sending', 'sent', 'failed');
CREATE TYPE IF NOT EXISTS crm_campaign_segment_enum AS ENUM ('vip', 'loyal', 'at_risk', 'new', 'inactive');
CREATE TYPE IF NOT EXISTS crm_campaign_recipient_status_enum AS ENUM ('pending', 'sent', 'failed', 'skipped');

CREATE TABLE IF NOT EXISTS crm_campaign (
  "id" SERIAL PRIMARY KEY,
  "name" varchar(150) NOT NULL,
  "channel" crm_campaign_channel_enum NOT NULL,
  "segment" crm_campaign_segment_enum,
  "subject" varchar(200),
  "message" text NOT NULL,
  "status" crm_campaign_status_enum NOT NULL DEFAULT 'draft',
  "totalRecipients" integer NOT NULL DEFAULT 0,
  "sentCount" integer NOT NULL DEFAULT 0,
  "failedCount" integer NOT NULL DEFAULT 0,
  "createdBy" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "sentAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_crm_campaign_status" ON "crm_campaign" ("status");

CREATE TABLE IF NOT EXISTS crm_campaign_recipient (
  "id" SERIAL PRIMARY KEY,
  "campaignId" integer NOT NULL REFERENCES "crm_campaign"("id") ON DELETE CASCADE,
  "userId" integer REFERENCES "user"("id") ON DELETE SET NULL,
  "name" varchar(150),
  "phone" varchar(30),
  "email" varchar(150),
  "status" crm_campaign_recipient_status_enum NOT NULL DEFAULT 'pending',
  "error" text,
  "sentAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "IDX_crm_campaign_recipient_campaign_user" ON "crm_campaign_recipient" ("campaignId", "userId");
CREATE INDEX IF NOT EXISTS "IDX_crm_campaign_recipient_status" ON "crm_campaign_recipient" ("status");

-- Sidebar menu entry: CRM Campaign (parent) — needs its own menu_permission
-- rows (canView) for admin roles or the sidebar hides it.
-- (Menu rows are inserted separately — menu ids are DB-specific.)

-- ── Configurable CRM segment rules ─────────────────────────────────────
-- Business Settings fields (nullable — backend falls back to code defaults
-- when unset: 20000 / 10 / 90 / 30).
ALTER TABLE "business_setting" ADD COLUMN IF NOT EXISTS "vipMinSpent" integer;
ALTER TABLE "business_setting" ADD COLUMN IF NOT EXISTS "vipMinOrders" integer;
ALTER TABLE "business_setting" ADD COLUMN IF NOT EXISTS "atRiskDays" integer;
ALTER TABLE "business_setting" ADD COLUMN IF NOT EXISTS "newDays" integer;
