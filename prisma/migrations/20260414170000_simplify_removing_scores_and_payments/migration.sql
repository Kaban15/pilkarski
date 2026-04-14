-- DropTable: match_goals
DROP TABLE IF EXISTS "match_goals" CASCADE;

-- DropTable: tournament_goals
DROP TABLE IF EXISTS "tournament_goals" CASCADE;

-- AlterTable: sparing_offers — remove score and cost-paid fields
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "home_score";
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "away_score";
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "score_submitted_by";
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "score_confirmed";
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "cost_paid_home";
ALTER TABLE "sparing_offers" DROP COLUMN IF EXISTS "cost_paid_away";

-- AlterTable: tournament_teams — remove cost_paid
ALTER TABLE "tournament_teams" DROP COLUMN IF EXISTS "cost_paid";

-- Remove notification types related to scores/goals
-- Note: We cannot simply remove enum values in PostgreSQL easily,
-- but we need to handle existing rows first
DELETE FROM "notifications" WHERE "type" IN ('SCORE_SUBMITTED', 'SCORE_CONFIRMED', 'SCORE_REJECTED', 'GOAL_ADDED', 'TOURNAMENT_SCORE_SUBMITTED');

-- Recreate NotificationType enum without removed values
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
CREATE TYPE "NotificationType" AS ENUM (
  'SPARING_APPLICATION',
  'SPARING_ACCEPTED',
  'SPARING_REJECTED',
  'EVENT_APPLICATION',
  'EVENT_ACCEPTED',
  'EVENT_REJECTED',
  'NEW_MESSAGE',
  'NEW_REVIEW',
  'RECRUITMENT_NEW',
  'RECRUITMENT_MATCH',
  'REMINDER',
  'SPARING_INVITATION',
  'MEMBERSHIP_REQUEST',
  'MEMBERSHIP_ACCEPTED',
  'CLUB_INVITATION',
  'TOURNAMENT_APPLICATION',
  'TOURNAMENT_ACCEPTED',
  'TOURNAMENT_REJECTED',
  'TOURNAMENT_STARTED'
);
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType" USING ("type"::text::"NotificationType");
DROP TYPE "NotificationType_old";
