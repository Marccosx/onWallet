ALTER TABLE "transaction" ADD COLUMN "balanceApplied" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "transaction" ADD COLUMN "paidAt" TIMESTAMP(3);
