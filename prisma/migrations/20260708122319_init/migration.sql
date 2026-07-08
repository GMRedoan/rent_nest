/*
  Warnings:

  - You are about to drop the column `propertiesId` on the `rental_requests` table. All the data in the column will be lost.
  - Added the required column `propertyId` to the `rental_requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "rental_requests" DROP CONSTRAINT "rental_requests_propertiesId_fkey";

-- AlterTable
ALTER TABLE "rental_requests" DROP COLUMN "propertiesId",
ADD COLUMN     "propertyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "rental_requests" ADD CONSTRAINT "rental_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
