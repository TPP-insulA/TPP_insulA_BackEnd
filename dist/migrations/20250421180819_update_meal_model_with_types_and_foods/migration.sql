/*
  Warnings:

  - You are about to drop the column `calories` on the `Meal` table. All the data in the column will be lost.
  - You are about to drop the column `carbs` on the `Meal` table. All the data in the column will be lost.
  - You are about to drop the column `fat` on the `Meal` table. All the data in the column will be lost.
  - You are about to drop the column `protein` on the `Meal` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Meal` table. All the data in the column will be lost.
  - Added the required column `totalCalories` to the `Meal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCarbs` to the `Meal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalFat` to the `Meal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalProtein` to the `Meal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Meal" DROP COLUMN "calories",
DROP COLUMN "carbs",
DROP COLUMN "fat",
DROP COLUMN "protein",
DROP COLUMN "quantity",
ADD COLUMN     "totalCalories" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalCarbs" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalFat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalProtein" DOUBLE PRECISION NOT NULL;
