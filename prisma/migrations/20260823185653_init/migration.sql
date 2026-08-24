-- DropIndex
DROP INDEX "payments_bkashTrxId_key";

-- DropIndex
DROP INDEX "payments_merchantInvoiceNumber_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bkashPaymentId" TEXT,
ALTER COLUMN "merchantInvoiceNumber" DROP NOT NULL;
