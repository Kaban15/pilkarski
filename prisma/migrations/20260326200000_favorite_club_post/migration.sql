-- AlterTable: add club_post_id to favorites
ALTER TABLE "favorites" ADD COLUMN "club_post_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_club_post_id_key" ON "favorites"("user_id", "club_post_id");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_club_post_id_fkey" FOREIGN KEY ("club_post_id") REFERENCES "club_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
