/*
  Warnings:

  - A unique constraint covering the columns `[merchantInvoiceNumber]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bkashTrxId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "paymentMethod" AS ENUM ('Stripe', 'Bkash');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bkashTrxId" TEXT,
ADD COLUMN     "merchantInvoiceNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paymentGateway" "paymentMethod" NOT NULL DEFAULT 'Stripe';

-- CreateIndex
CREATE UNIQUE INDEX "payments_merchantInvoiceNumber_key" ON "payments"("merchantInvoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bkashTrxId_key" ON "payments"("bkashTrxId");
