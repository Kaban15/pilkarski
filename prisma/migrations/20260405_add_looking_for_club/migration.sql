-- AlterTable
ALTER TABLE "players" ADD COLUMN "looking_for_club" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "coaches" ADD COLUMN "looking_for_club" BOOLEAN NOT NULL DEFAULT false;
