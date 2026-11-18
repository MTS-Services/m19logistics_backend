-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
