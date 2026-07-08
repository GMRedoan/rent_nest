/*
  Warnings:

  - Changed the type of `propertyType` on the `properties` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'ROOM', 'STUDIO', 'COMMERCIAL');

-- AlterTable
ALTER TABLE "properties" DROP COLUMN "propertyType",
ADD COLUMN     "propertyType" "PropertyType" NOT NULL;

-- CreateIndex
CREATE INDEX "properties_price_propertyType_idx" ON "properties"("price", "propertyType");
