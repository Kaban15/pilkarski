-- AlterTable: make clubId optional, add coachId
ALTER TABLE "events" ALTER COLUMN "club_id" DROP NOT NULL;

ALTER TABLE "events" ADD COLUMN "coach_id" UUID;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum: add REMINDER to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'REMINDER';
