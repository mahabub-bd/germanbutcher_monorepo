-- Flash Sale Campaigns: production schema (gb_production)
-- Dev (gb_test) gets these tables via TypeORM synchronize; production does
-- NOT (NODE_ENV=production), so apply this file manually:
--   psql -h <host> -U <user> -d gb_production -f sql/2026-10-13-flash-sale-campaigns-production.sql

CREATE TABLE IF NOT EXISTS flash_sale_campaign (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMPTZ,
  "validUntil" TIMESTAMPTZ,
  "discountType" VARCHAR NOT NULL,
  "discountValue" NUMERIC(10, 2) NOT NULL,
  "maxUsage" INTEGER NOT NULL DEFAULT 0,
  "timesUsed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flash_sale_campaign_products (
  "campaignId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  CONSTRAINT FK_flash_sale_campaign_products_campaign
    FOREIGN KEY ("campaignId") REFERENCES flash_sale_campaign (id)
    ON DELETE CASCADE,
  CONSTRAINT FK_flash_sale_campaign_products_product
    FOREIGN KEY ("productId") REFERENCES product (id)
    ON DELETE CASCADE,
  CONSTRAINT PK_flash_sale_campaign_products
    PRIMARY KEY ("campaignId", "productId")
);

CREATE TABLE IF NOT EXISTS flash_sale_campaign_categories (
  "campaignId" INTEGER NOT NULL,
  "categoryId" INTEGER NOT NULL,
  CONSTRAINT FK_flash_sale_campaign_categories_campaign
    FOREIGN KEY ("campaignId") REFERENCES flash_sale_campaign (id)
    ON DELETE CASCADE,
  CONSTRAINT FK_flash_sale_campaign_categories_category
    FOREIGN KEY ("categoryId") REFERENCES category (id)
    ON DELETE CASCADE,
  CONSTRAINT PK_flash_sale_campaign_categories
    PRIMARY KEY ("campaignId", "categoryId")
);

CREATE INDEX IF NOT EXISTS IDX_flash_sale_campaign_is_active
  ON flash_sale_campaign ("isActive");
