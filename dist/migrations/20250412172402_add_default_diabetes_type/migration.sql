-- AlterTable
ALTER TABLE "User" ADD COLUMN     "diabetesType" TEXT NOT NULL DEFAULT 'type1',
ADD COLUMN     "diagnosisDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "treatingDoctor" TEXT;
