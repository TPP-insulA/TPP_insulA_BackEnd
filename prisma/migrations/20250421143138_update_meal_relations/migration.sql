/*
  Warnings:

  - The values [BREAKFAST,LUNCH,SNACK,DINNER] on the enum `MealType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MealType_new" AS ENUM ('breakfast', 'lunch', 'snack', 'dinner');
ALTER TABLE "Meal" ALTER COLUMN "type" TYPE "MealType_new" USING ("type"::text::"MealType_new");
ALTER TYPE "MealType" RENAME TO "MealType_old";
ALTER TYPE "MealType_new" RENAME TO "MealType";
DROP TYPE "MealType_old";
COMMIT;
