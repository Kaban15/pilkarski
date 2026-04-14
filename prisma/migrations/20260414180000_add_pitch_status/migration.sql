-- CreateEnum
CREATE TYPE "PitchStatus" AS ENUM ('WE_HAVE_PITCH', 'LOOKING_FOR_PITCH', 'SPLIT_COSTS');

-- AlterTable
ALTER TABLE "sparing_offers" ADD COLUMN "pitch_status" "PitchStatus";
