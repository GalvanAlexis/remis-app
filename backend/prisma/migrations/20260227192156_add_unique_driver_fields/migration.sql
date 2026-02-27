/*
  Warnings:

  - A unique constraint covering the columns `[habilitacionUrl]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_habilitacionUrl_key" ON "driver_documents"("habilitacionUrl");
