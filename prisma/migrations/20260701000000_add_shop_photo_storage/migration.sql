-- Add stable shop identity.
ALTER TABLE "Shop" ADD COLUMN "shopUid" TEXT;
UPDATE "Shop" SET "shopUid" = "id" WHERE "shopUid" IS NULL OR "shopUid" = '';
ALTER TABLE "Shop" ALTER COLUMN "shopUid" SET NOT NULL;
CREATE UNIQUE INDEX "Shop_shopUid_key" ON "Shop"("shopUid");

-- Store one primary photo per shop identity.
CREATE TABLE "ShopPhoto" (
    "id" TEXT NOT NULL,
    "shopUid" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "publishedStaticPath" TEXT,
    "publishedSha256" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopPhoto_shopUid_key" ON "ShopPhoto"("shopUid");
ALTER TABLE "ShopPhoto" ADD CONSTRAINT "ShopPhoto_shopUid_fkey" FOREIGN KEY ("shopUid") REFERENCES "Shop"("shopUid") ON DELETE CASCADE ON UPDATE CASCADE;

-- Track static publish status separately from database save success.
CREATE TABLE "StaticPublishStatus" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "error" TEXT,
    "requestedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticPublishStatus_pkey" PRIMARY KEY ("id")
);