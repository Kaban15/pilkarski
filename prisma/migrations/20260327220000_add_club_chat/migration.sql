ALTER TABLE "conversations" ADD COLUMN "club_id" UUID;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_club_id_key" UNIQUE ("club_id");
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
