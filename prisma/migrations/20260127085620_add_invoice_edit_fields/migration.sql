-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_deliveryId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "customerRef" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "spoNumber" TEXT,
ALTER COLUMN "deliveryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
