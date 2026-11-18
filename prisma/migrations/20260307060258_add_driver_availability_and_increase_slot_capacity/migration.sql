-- AlterTable
ALTER TABLE "SlotAvailability" ALTER COLUMN "maxCapacity" SET DEFAULT 10;

-- CreateTable
CREATE TABLE "DriverAvailability" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "timeSlot" "TimeSlot" NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverAvailability_driverId_idx" ON "DriverAvailability"("driverId");

-- CreateIndex
CREATE INDEX "DriverAvailability_date_idx" ON "DriverAvailability"("date");

-- CreateIndex
CREATE INDEX "DriverAvailability_driverId_date_idx" ON "DriverAvailability"("driverId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DriverAvailability_driverId_date_timeSlot_key" ON "DriverAvailability"("driverId", "date", "timeSlot");

-- AddForeignKey
ALTER TABLE "DriverAvailability" ADD CONSTRAINT "DriverAvailability_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
