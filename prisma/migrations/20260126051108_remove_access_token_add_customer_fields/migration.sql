/*
  Warnings:

  - You are about to drop the `AccessToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccessToken" DROP CONSTRAINT "AccessToken_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessScope" TEXT,
ADD COLUMN     "storeName" TEXT;

-- DropTable
DROP TABLE "AccessToken";
