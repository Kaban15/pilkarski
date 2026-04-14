-- AlterTable: players — add is_discreet
ALTER TABLE "players" ADD COLUMN "is_discreet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: transfers — add is_discreet
ALTER TABLE "transfers" ADD COLUMN "is_discreet" BOOLEAN NOT NULL DEFAULT false;
