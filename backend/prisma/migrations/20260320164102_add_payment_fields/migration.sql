/*
  Warnings:

  - A unique constraint covering the columns `[mercadopagoPreferenceId]` on the table `ride_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "ride_requests" ADD COLUMN     "mercadopagoPreferenceId" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "ride_requests_mercadopagoPreferenceId_key" ON "ride_requests"("mercadopagoPreferenceId");
