-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('PLAYER', 'COACH');
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'LEFT', 'REMOVED');
CREATE TYPE "LineupRole" AS ENUM ('STARTER', 'BENCH');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBERSHIP_ACCEPTED';
ALTER TYPE "ClubPostCategory" ADD VALUE 'INTERNAL';

-- CreateTable
CREATE TABLE "club_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "club_id" UUID NOT NULL,
    "member_user_id" UUID NOT NULL,
    "member_type" "MemberType" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "accepted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "club_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_lineups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "club_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "match_info" VARCHAR(500),
    "date" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "team_lineups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_lineup_players" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lineup_id" UUID NOT NULL,
    "member_user_id" UUID NOT NULL,
    "role" "LineupRole" NOT NULL DEFAULT 'STARTER',
    "position" VARCHAR(10),
    "notes" TEXT,
    CONSTRAINT "team_lineup_players_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "club_memberships_club_id_member_user_id_key" ON "club_memberships"("club_id", "member_user_id");
CREATE INDEX "club_memberships_club_id_status_idx" ON "club_memberships"("club_id", "status");
CREATE INDEX "club_memberships_member_user_id_status_idx" ON "club_memberships"("member_user_id", "status");
CREATE INDEX "team_lineups_club_id_date_idx" ON "team_lineups"("club_id", "date");
CREATE UNIQUE INDEX "team_lineup_players_lineup_id_member_user_id_key" ON "team_lineup_players"("lineup_id", "member_user_id");

-- ForeignKeys
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_memberships" ADD CONSTRAINT "club_memberships_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_lineups" ADD CONSTRAINT "team_lineups_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_lineup_players" ADD CONSTRAINT "team_lineup_players_lineup_id_fkey" FOREIGN KEY ("lineup_id") REFERENCES "team_lineups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
