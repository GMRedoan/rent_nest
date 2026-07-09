/*
  Warnings:

  - You are about to drop the column `txId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "payments_txId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "txId";
