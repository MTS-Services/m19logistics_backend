-- CreateEnum
CREATE TYPE "DriverType" AS ENUM ('EMPLOYEE', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'FOUR_WEEKLY');

-- CreateEnum
CREATE TYPE "ContractorInvoiceStatus" AS ENUM ('DRAFT', 'OUTSTANDING', 'PAID');

-- AlterTable DriverProfile
ALTER TABLE "DriverProfile"
ADD COLUMN "driverType" "DriverType" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN "tradingName" TEXT,
ADD COLUMN "contactName" TEXT,
ADD COLUMN "tradingAddress" TEXT,
ADD COLUMN "isVatRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "vatNumber" TEXT,
ADD COLUMN "vehicleMake" TEXT,
ADD COLUMN "vehicleModel" TEXT,
ADD COLUMN "motExpiry" DATE,
ADD COLUMN "insuranceExpiry" DATE,
ADD COLUMN "goodsInTransitExpiry" DATE,
ADD COLUMN "publicLiabilityExpiry" DATE,
ADD COLUMN "bankName" TEXT,
ADD COLUMN "accountName" TEXT,
ADD COLUMN "sortCode" TEXT,
ADD COLUMN "accountNumber" TEXT,
ADD COLUMN "bankReference" TEXT,
ADD COLUMN "payType" "PayType",
ADD COLUMN "rate" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "DriverProfile_driverType_idx" ON "DriverProfile"("driverType");

-- CreateTable
CREATE TABLE "ContractorInvoice" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "contractorId" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "jobCount" INTEGER NOT NULL DEFAULT 0,
    "rate" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "ContractorInvoiceStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorInvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "spoNumber" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractorInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractorInvoice_invoiceNumber_key" ON "ContractorInvoice"("invoiceNumber");
CREATE INDEX "ContractorInvoice_contractorId_idx" ON "ContractorInvoice"("contractorId");
CREATE INDEX "ContractorInvoice_invoiceNumber_idx" ON "ContractorInvoice"("invoiceNumber");
CREATE INDEX "ContractorInvoice_periodStart_idx" ON "ContractorInvoice"("periodStart");
CREATE INDEX "ContractorInvoice_status_idx" ON "ContractorInvoice"("status");

CREATE UNIQUE INDEX "ContractorInvoiceItem_deliveryId_key" ON "ContractorInvoiceItem"("deliveryId");
CREATE INDEX "ContractorInvoiceItem_invoiceId_idx" ON "ContractorInvoiceItem"("invoiceId");
CREATE INDEX "ContractorInvoiceItem_deliveryId_idx" ON "ContractorInvoiceItem"("deliveryId");

-- AddForeignKey
ALTER TABLE "ContractorInvoice" ADD CONSTRAINT "ContractorInvoice_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ContractorInvoiceItem" ADD CONSTRAINT "ContractorInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ContractorInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractorInvoiceItem" ADD CONSTRAINT "ContractorInvoiceItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
