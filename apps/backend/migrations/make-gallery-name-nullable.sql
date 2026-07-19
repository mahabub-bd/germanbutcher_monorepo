-- Migration: Make galleries.name column nullable
-- Run this SQL command to update the database schema

ALTER TABLE "galleries" ALTER COLUMN "name" DROP NOT NULL;
