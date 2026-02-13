-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_driver_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "licenciaUrl" TEXT,
    "cedulaUrl" TEXT,
    "habilitacionUrl" TEXT,
    "maxPassengers" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    CONSTRAINT "driver_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_driver_documents" ("cedulaUrl", "habilitacionUrl", "id", "isVerified", "licenciaUrl", "maxPassengers", "userId", "verifiedAt") SELECT "cedulaUrl", "habilitacionUrl", "id", "isVerified", "licenciaUrl", "maxPassengers", "userId", "verifiedAt" FROM "driver_documents";
DROP TABLE "driver_documents";
ALTER TABLE "new_driver_documents" RENAME TO "driver_documents";
CREATE UNIQUE INDEX "driver_documents_userId_key" ON "driver_documents"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
