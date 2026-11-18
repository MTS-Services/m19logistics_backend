-- AlterEnum
ALTER TYPE "PayType" ADD VALUE 'RATE_ON_JOB';

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN "collectionPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "contractorRate" DECIMAL(10,2);
