-- Product Reviews & Ratings — production schema
-- Run on: gb_production (144.79.249.74)
-- Matches apps/backend/src/product-review/entities/product-review.entity.ts
-- and the BusinessSetting.adminNotificationEmail column added 2026-10-10.

-- 1. Reviews table
CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" serial PRIMARY KEY,
  "rating" integer NOT NULL,
  "title" character varying(150),
  "comment" text NOT NULL,
  "isApproved" boolean NOT NULL DEFAULT false,
  "isRejected" boolean NOT NULL DEFAULT false,
  "orderId" integer,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "userId" integer NOT NULL,
  "productId" integer NOT NULL,
  "attachment_id" integer
);

-- 2. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "PK_67c1501aea1b0633ec441b00bd5"
  ON public.product_reviews USING btree (id);
CREATE INDEX IF NOT EXISTS "IDX_2ccb3b923ab454a614047f9442"
  ON public.product_reviews USING btree ("isApproved");
CREATE INDEX IF NOT EXISTS "IDX_519bb5889cda6fa50a74edd8d8"
  ON public.product_reviews USING btree ("isRejected");
CREATE INDEX IF NOT EXISTS "IDX_bc3a62f45b3759c250d50391e2"
  ON public.product_reviews USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "IDX_product_review_product_approved"
  ON public.product_reviews USING btree ("productId", "isApproved");
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_review_user_product"
  ON public.product_reviews USING btree ("userId", "productId");

-- 3. Foreign keys (match the exact table/case used in production)
ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "FK_964f13abf796aca25d7e5849c64";
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "FK_964f13abf796aca25d7e5849c64"
  FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "FK_32edd80d91dff1bc19e79c8f16d";
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "FK_32edd80d91dff1bc19e79c8f16d"
  FOREIGN KEY ("productId") REFERENCES product(id) ON DELETE CASCADE;

ALTER TABLE "product_reviews" DROP CONSTRAINT IF EXISTS "FK_b2761b54195861d14ff7819ee87";
ALTER TABLE "product_reviews"
  ADD CONSTRAINT "FK_b2761b54195861d14ff7819ee87"
  FOREIGN KEY ("attachment_id") REFERENCES attachment(id) ON DELETE SET NULL;

-- 4. Business Settings: admin notification recipients (comma-separated emails)
ALTER TABLE "business_setting"
  ADD COLUMN IF NOT EXISTS "adminNotificationEmail" character varying;
