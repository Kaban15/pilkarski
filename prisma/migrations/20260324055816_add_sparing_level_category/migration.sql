-- CreateEnum
CREATE TYPE "SparingLevel" AS ENUM ('YOUTH', 'AMATEUR', 'SEMI_PRO', 'PRO');

-- CreateEnum
CREATE TYPE "AgeCategory" AS ENUM ('JUNIOR_E', 'JUNIOR_D', 'JUNIOR_C', 'JUNIOR_B', 'JUNIOR_A', 'SENIOR_JR', 'SENIOR', 'VETERAN');

-- AlterTable
ALTER TABLE "sparing_offers" ADD COLUMN     "age_category" "AgeCategory",
ADD COLUMN     "level" "SparingLevel",
ADD COLUMN     "preferred_time" VARCHAR(100);
