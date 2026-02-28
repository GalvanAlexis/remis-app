-- AlterTable
ALTER TABLE "driver_documents" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumUntil" TIMESTAMP(3);
