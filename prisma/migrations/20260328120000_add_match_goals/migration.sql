-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'GOAL_ADDED';

-- CreateTable
CREATE TABLE "match_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sparing_offer_id" UUID NOT NULL,
    "scorer_user_id" UUID NOT NULL,
    "minute" INTEGER,
    "own_goal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_goals_sparing_offer_id_idx" ON "match_goals"("sparing_offer_id");

-- AddForeignKey
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_sparing_offer_id_fkey" FOREIGN KEY ("sparing_offer_id") REFERENCES "sparing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_goals" ADD CONSTRAINT "match_goals_scorer_user_id_fkey" FOREIGN KEY ("scorer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
