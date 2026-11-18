/*
  Warnings:

  - You are about to drop the column `tierCode` on the `PricingTier` table. All the data in the column will be lost.
  - You are about to drop the `CustomerProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DriverProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ManagerProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[loginId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CustomerProfile" DROP CONSTRAINT "CustomerProfile_pricingTierId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerProfile" DROP CONSTRAINT "CustomerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "DriverProfile" DROP CONSTRAINT "DriverProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ManagerProfile" DROP CONSTRAINT "ManagerProfile_userId_fkey";

-- DropIndex
DROP INDEX "PricingTier_tierCode_idx";

-- DropIndex
DROP INDEX "PricingTier_tierCode_key";

-- AlterTable
ALTER TABLE "PricingTier" DROP COLUMN "tierCode",
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDistance" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "surchargeRate" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
ADD COLUMN     "weightUnit" INTEGER NOT NULL DEFAULT 800;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customBasePrice" DECIMAL(10,2),
ADD COLUMN     "customVatRate" DECIMAL(5,2) DEFAULT 20.00,
ADD COLUMN     "depotAddress" TEXT,
ADD COLUMN     "loginId" TEXT,
ADD COLUMN     "pricingTierId" INTEGER;

-- DropTable
DROP TABLE "CustomerProfile";

-- DropTable
DROP TABLE "DriverProfile";

-- DropTable
DROP TABLE "ManagerProfile";

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessToken_token_key" ON "AccessToken"("token");

-- CreateIndex
CREATE INDEX "AccessToken_token_idx" ON "AccessToken"("token");

-- CreateIndex
CREATE INDEX "AccessToken_userId_idx" ON "AccessToken"("userId");

-- CreateIndex
CREATE INDEX "PricingTier_name_idx" ON "PricingTier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "User"("loginId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
