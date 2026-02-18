/*
  Warnings:

  - A unique constraint covering the columns `[licenciaUrl]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cedulaUrl]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vehiclePlate]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_licenciaUrl_key" ON "driver_documents"("licenciaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_cedulaUrl_key" ON "driver_documents"("cedulaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_vehiclePlate_key" ON "driver_documents"("vehiclePlate");
