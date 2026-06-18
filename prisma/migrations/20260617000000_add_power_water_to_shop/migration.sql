-- Add power and water fields to Shop table
ALTER TABLE "Shop" ADD COLUMN "power" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Shop" ADD COLUMN "water" TEXT NOT NULL DEFAULT '/';
