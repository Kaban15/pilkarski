-- Add score fields to sparing_offers
ALTER TABLE "sparing_offers" ADD COLUMN "home_score" INTEGER;
ALTER TABLE "sparing_offers" ADD COLUMN "away_score" INTEGER;
ALTER TABLE "sparing_offers" ADD COLUMN "score_submitted_by" UUID;
ALTER TABLE "sparing_offers" ADD COLUMN "score_confirmed" BOOLEAN NOT NULL DEFAULT false;
