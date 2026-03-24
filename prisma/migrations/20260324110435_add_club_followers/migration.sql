-- CreateTable
CREATE TABLE "club_followers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_followers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_followers_club_id_idx" ON "club_followers"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_followers_user_id_club_id_key" ON "club_followers"("user_id", "club_id");

-- AddForeignKey
ALTER TABLE "club_followers" ADD CONSTRAINT "club_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_followers" ADD CONSTRAINT "club_followers_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
