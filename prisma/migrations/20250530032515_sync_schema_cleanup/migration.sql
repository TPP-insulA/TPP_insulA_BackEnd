/*
  Warnings:

  - You are about to drop the `GlucoseTarget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InsulinCalculation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InsulinDose` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InsulinSettings` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `Activity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('glucose', 'meal', 'insulin');

-- DropForeignKey
ALTER TABLE "GlucoseTarget" DROP CONSTRAINT "GlucoseTarget_userId_fkey";

-- DropForeignKey
ALTER TABLE "InsulinCalculation" DROP CONSTRAINT "InsulinCalculation_userId_fkey";

-- DropForeignKey
ALTER TABLE "InsulinDose" DROP CONSTRAINT "InsulinDose_userId_fkey";

-- DropForeignKey
ALTER TABLE "InsulinSettings" DROP CONSTRAINT "InsulinSettings_userId_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "sourceId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ActivityType" NOT NULL;

-- DropTable
DROP TABLE "GlucoseTarget";

-- DropTable
DROP TABLE "InsulinCalculation";

-- DropTable
DROP TABLE "InsulinDose";

-- DropTable
DROP TABLE "InsulinSettings";
