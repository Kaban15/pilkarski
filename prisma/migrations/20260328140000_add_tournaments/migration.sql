-- CreateEnums
CREATE TYPE "TournamentFormat" AS ENUM ('GROUP_STAGE', 'KNOCKOUT', 'GROUP_AND_KNOCKOUT');
CREATE TYPE "TournamentStatus" AS ENUM ('REGISTRATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "TournamentTeamStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
CREATE TYPE "TournamentMatchPhase" AS ENUM ('GROUP', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'TOURNAMENT_SCORE_SUBMITTED';

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_user_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ,
    "location" VARCHAR(300),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "region_id" INT,
    "format" "TournamentFormat" NOT NULL,
    "max_teams" INT NOT NULL,
    "group_count" INT NOT NULL DEFAULT 1,
    "advancing_per_group" INT NOT NULL DEFAULT 2,
    "status" "TournamentStatus" NOT NULL DEFAULT 'REGISTRATION',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "club_id" UUID,
    "user_id" UUID NOT NULL,
    "team_name" VARCHAR(200) NOT NULL,
    "status" "TournamentTeamStatus" NOT NULL DEFAULT 'PENDING',
    "group_label" VARCHAR(2),
    "seed" INT,
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_teams_tournament_id_user_id_key" UNIQUE ("tournament_id", "user_id")
);

CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "home_team_id" UUID NOT NULL,
    "away_team_id" UUID NOT NULL,
    "phase" "TournamentMatchPhase" NOT NULL,
    "group_label" VARCHAR(2),
    "round" INT,
    "match_order" INT NOT NULL DEFAULT 0,
    "match_date" TIMESTAMPTZ,
    "location" VARCHAR(300),
    "home_score" INT,
    "away_score" INT,
    "penalty_home" INT,
    "penalty_away" INT,
    "score_submitted_by" UUID,
    "score_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "scorer_user_id" UUID NOT NULL,
    "minute" INT,
    "own_goal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tournament_standings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "group_label" VARCHAR(2) NOT NULL,
    "played" INT NOT NULL DEFAULT 0,
    "won" INT NOT NULL DEFAULT 0,
    "drawn" INT NOT NULL DEFAULT 0,
    "lost" INT NOT NULL DEFAULT 0,
    "goals_for" INT NOT NULL DEFAULT 0,
    "goals_against" INT NOT NULL DEFAULT 0,
    "points" INT NOT NULL DEFAULT 0,
    CONSTRAINT "tournament_standings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_standings_tournament_id_team_id_key" UNIQUE ("tournament_id", "team_id")
);

-- CreateIndexes
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");
CREATE INDEX "tournaments_region_id_idx" ON "tournaments"("region_id");
CREATE INDEX "tournament_teams_tournament_id_idx" ON "tournament_teams"("tournament_id");
CREATE INDEX "tournament_matches_tournament_id_idx" ON "tournament_matches"("tournament_id");
CREATE INDEX "tournament_goals_match_id_idx" ON "tournament_goals"("match_id");
CREATE INDEX "tournament_standings_tournament_id_group_label_idx" ON "tournament_standings"("tournament_id", "group_label");

-- AddForeignKeys
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "tournament_teams"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "tournament_teams"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_goals" ADD CONSTRAINT "tournament_goals_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tournament_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_goals" ADD CONSTRAINT "tournament_goals_scorer_user_id_fkey" FOREIGN KEY ("scorer_user_id") REFERENCES "users"("id") ON UPDATE CASCADE;
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_standings" ADD CONSTRAINT "tournament_standings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
