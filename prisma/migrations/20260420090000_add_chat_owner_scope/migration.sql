-- AlterTable
ALTER TABLE "Chat"
ADD COLUMN     "guestId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Chat_guestId_updatedAt_idx" ON "Chat"("guestId", "updatedAt");

-- CreateIndex
CREATE INDEX "Chat_userId_updatedAt_idx" ON "Chat"("userId", "updatedAt");
