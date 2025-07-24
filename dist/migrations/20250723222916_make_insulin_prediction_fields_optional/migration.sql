-- AlterTable
ALTER TABLE "InsulinPrediction" ALTER COLUMN "glucoseObjective" DROP NOT NULL,
ALTER COLUMN "insulinOnBoard" DROP NOT NULL,
ALTER COLUMN "sleepLevel" DROP NOT NULL,
ALTER COLUMN "workLevel" DROP NOT NULL,
ALTER COLUMN "activityLevel" DROP NOT NULL;
