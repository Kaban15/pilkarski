-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('OPEN_TRAINING', 'RECRUITMENT');

-- CreateEnum
CREATE TYPE "public"."FootPreference" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SPARING_APPLICATION', 'SPARING_ACCEPTED', 'SPARING_REJECTED', 'EVENT_APPLICATION', 'EVENT_ACCEPTED', 'EVENT_REJECTED', 'NEW_MESSAGE');

-- CreateEnum
CREATE TYPE "public"."PlayerPosition" AS ENUM ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST');

-- CreateEnum
CREATE TYPE "public"."SparingStatus" AS ENUM ('OPEN', 'MATCHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CLUB', 'PLAYER');

-- CreateTable
CREATE TABLE "public"."career_entries" (
    "id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "club_name" VARCHAR(200) NOT NULL,
    "season" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clubs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "logo_url" VARCHAR(500),
    "description" TEXT,
    "city" VARCHAR(100),
    "region_id" INTEGER,
    "league_group_id" INTEGER,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "website" VARCHAR(300),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_applications" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "message" TEXT,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "type" "public"."EventType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "location" VARCHAR(300),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "max_participants" INTEGER,
    "region_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."league_groups" (
    "id" SERIAL NOT NULL,
    "league_level_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "league_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."league_levels" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,

    CONSTRAINT "league_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "message" VARCHAR(500),
    "link" VARCHAR(500),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."players" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "photo_url" VARCHAR(500),
    "city" VARCHAR(100),
    "region_id" INTEGER,
    "height_cm" INTEGER,
    "weight_kg" INTEGER,
    "preferred_foot" "public"."FootPreference",
    "primary_position" "public"."PlayerPosition",
    "secondary_position" "public"."PlayerPosition",
    "bio" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sparing_applications" (
    "id" UUID NOT NULL,
    "sparing_offer_id" UUID NOT NULL,
    "applicant_club_id" UUID NOT NULL,
    "message" TEXT,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sparing_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sparing_offers" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "match_date" TIMESTAMPTZ(6) NOT NULL,
    "location" VARCHAR(300),
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "cost_split_info" VARCHAR(500),
    "status" "public"."SparingStatus" NOT NULL DEFAULT 'OPEN',
    "region_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sparing_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_user_id_key" ON "public"."clubs"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "event_applications_event_id_player_id_key" ON "public"."event_applications"("event_id" ASC, "player_id" ASC);

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "public"."events"("event_date" ASC);

-- CreateIndex
CREATE INDEX "events_region_id_type_idx" ON "public"."events"("region_id" ASC, "type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "league_groups_league_level_id_name_key" ON "public"."league_groups"("league_level_id" ASC, "name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "league_levels_region_id_name_key" ON "public"."league_levels"("region_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "public"."messages"("conversation_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "public"."messages"("sender_id" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "public"."notifications"("user_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "public"."notifications"("user_id" ASC, "read" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "players_user_id_key" ON "public"."players"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "public"."regions"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "public"."regions"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sparing_applications_sparing_offer_id_applicant_club_id_key" ON "public"."sparing_applications"("sparing_offer_id" ASC, "applicant_club_id" ASC);

-- CreateIndex
CREATE INDEX "sparing_offers_match_date_idx" ON "public"."sparing_offers"("match_date" ASC);

-- CreateIndex
CREATE INDEX "sparing_offers_region_id_status_idx" ON "public"."sparing_offers"("region_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."career_entries" ADD CONSTRAINT "career_entries_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_league_group_id_fkey" FOREIGN KEY ("league_group_id") REFERENCES "public"."league_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_applications" ADD CONSTRAINT "event_applications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_applications" ADD CONSTRAINT "event_applications_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."league_groups" ADD CONSTRAINT "league_groups_league_level_id_fkey" FOREIGN KEY ("league_level_id") REFERENCES "public"."league_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."league_levels" ADD CONSTRAINT "league_levels_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."players" ADD CONSTRAINT "players_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."players" ADD CONSTRAINT "players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sparing_applications" ADD CONSTRAINT "sparing_applications_applicant_club_id_fkey" FOREIGN KEY ("applicant_club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sparing_applications" ADD CONSTRAINT "sparing_applications_sparing_offer_id_fkey" FOREIGN KEY ("sparing_offer_id") REFERENCES "public"."sparing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sparing_offers" ADD CONSTRAINT "sparing_offers_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sparing_offers" ADD CONSTRAINT "sparing_offers_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
