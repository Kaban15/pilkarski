-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'COUNTER_PROPOSED';

-- AlterTable
ALTER TABLE "sparing_applications" ADD COLUMN     "counter_proposed_date" TIMESTAMPTZ;
