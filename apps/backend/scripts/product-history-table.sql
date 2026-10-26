-- product_history: dedicated audit table for product lifecycle events
-- (created / updated / activated / deactivated / deleted).
--
-- Prod DB has no synchronize/migrations (see CLAUDE.md workflow), so run
-- this manually once on gb_production before deploying the feature.
-- Dev DBs get the table automatically via synchronize.

CREATE TYPE "product_history_action_enum" AS ENUM
  ('created', 'updated', 'activated', 'deactivated', 'deleted');

CREATE TABLE "product_history" (
  "id" SERIAL NOT NULL,
  "productId" integer,                    -- no FK on purpose: history survives product deletion
  "productName" character varying NOT NULL,
  "action" "product_history_action_enum" NOT NULL,
  "changes" jsonb,                        -- { field: { from, to } } for updates
  "snapshot" jsonb,                       -- full field snapshot for created/deleted
  "userId" integer,
  "userName" character varying,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "PK_product_history" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_product_history_productId_createdAt"
  ON "product_history" ("productId", "createdAt");
CREATE INDEX "IDX_product_history_createdAt"
  ON "product_history" ("createdAt");
