-- CreateTable
CREATE TABLE "GuestUsage" (
    "guestId" TEXT NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestUsage_pkey" PRIMARY KEY ("guestId")
);
