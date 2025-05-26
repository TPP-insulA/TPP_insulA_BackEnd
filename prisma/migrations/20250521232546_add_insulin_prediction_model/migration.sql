-- CreateTable
CREATE TABLE "InsulinPrediction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "cgmPrev" DOUBLE PRECISION[],
    "glucoseObjective" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "insulinOnBoard" DOUBLE PRECISION NOT NULL,
    "sleepLevel" DOUBLE PRECISION NOT NULL,
    "workLevel" DOUBLE PRECISION NOT NULL,
    "activityLevel" DOUBLE PRECISION NOT NULL,
    "recommendedDose" DOUBLE PRECISION NOT NULL,
    "applyDose" DOUBLE PRECISION,
    "cgmPost" DOUBLE PRECISION[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsulinPrediction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InsulinPrediction" ADD CONSTRAINT "InsulinPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
