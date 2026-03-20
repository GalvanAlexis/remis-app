/*
  Warnings:

  - A unique constraint covering the columns `[rideId,fromUserId]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ratings_rideId_key";

-- CreateIndex
CREATE UNIQUE INDEX "ratings_rideId_fromUserId_key" ON "ratings"("rideId", "fromUserId");
