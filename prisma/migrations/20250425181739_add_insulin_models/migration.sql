/*
  Warnings:

  - Added the required column `type` to the `InsulinDose` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InsulinDose" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InsulinCalculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentGlucose" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "activity" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "correctionDose" DOUBLE PRECISION NOT NULL,
    "mealDose" DOUBLE PRECISION NOT NULL,
    "activityAdjustment" DOUBLE PRECISION NOT NULL,
    "timeAdjustment" DOUBLE PRECISION NOT NULL,
    "resultingGlucose" DOUBLE PRECISION,
    "accuracy" TEXT,

    CONSTRAINT "InsulinCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsulinSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carbRatio" DOUBLE PRECISION NOT NULL,
    "correctionFactor" DOUBLE PRECISION NOT NULL,
    "targetGlucoseMin" DOUBLE PRECISION NOT NULL,
    "targetGlucoseMax" DOUBLE PRECISION NOT NULL,
    "activeInsulinDuration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "InsulinSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsulinCalculation_userId_timestamp_idx" ON "InsulinCalculation"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "InsulinSettings_userId_key" ON "InsulinSettings"("userId");

-- AddForeignKey
ALTER TABLE "InsulinCalculation" ADD CONSTRAINT "InsulinCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsulinSettings" ADD CONSTRAINT "InsulinSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
