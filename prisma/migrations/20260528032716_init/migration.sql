-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "pos" TEXT NOT NULL,
    "transfer" BOOLEAN NOT NULL DEFAULT false,
    "transferLine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "shortNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "tenant" TEXT,
    "contact" TEXT,
    "openDate" TEXT,
    "status" TEXT NOT NULL,
    "remark" TEXT,
    "stationId" TEXT NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalStats" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "statsDate" TEXT NOT NULL,
    "totalShops" INTEGER NOT NULL,
    "rentedShops" INTEGER NOT NULL,
    "vacantShops" INTEGER NOT NULL,
    "rentRate" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "color" TEXT NOT NULL,

    CONSTRAINT "GradeInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
