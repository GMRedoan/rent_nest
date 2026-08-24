CREATE UNIQUE INDEX "payments_bkashTrxId_key"
ON "payments"("bkashTrxId");

CREATE UNIQUE INDEX "payments_merchantInvoiceNumber_key"
ON "payments"("merchantInvoiceNumber");
