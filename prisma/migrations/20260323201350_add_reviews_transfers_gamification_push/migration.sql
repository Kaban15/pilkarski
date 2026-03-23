-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('LOOKING_FOR_CLUB', 'LOOKING_FOR_PLAYER', 'FREE_AGENT');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_REVIEW';

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "p256dh" VARCHAR(200) NOT NULL,
    "auth" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_points" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "action" VARCHAR(50) NOT NULL,
    "ref_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge" VARCHAR(50) NOT NULL,
    "awarded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TransferType" NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "position" "PlayerPosition",
    "region_id" INTEGER,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "sparing_offer_id" UUID NOT NULL,
    "reviewer_club_id" UUID NOT NULL,
    "reviewed_club_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE INDEX "user_points_user_id_idx" ON "user_points"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_key" ON "user_badges"("user_id", "badge");

-- CreateIndex
CREATE INDEX "transfers_type_status_idx" ON "transfers"("type", "status");

-- CreateIndex
CREATE INDEX "transfers_region_id_idx" ON "transfers"("region_id");

-- CreateIndex
CREATE INDEX "transfers_position_idx" ON "transfers"("position");

-- CreateIndex
CREATE INDEX "reviews_reviewed_club_id_idx" ON "reviews"("reviewed_club_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_sparing_offer_id_reviewer_club_id_key" ON "reviews"("sparing_offer_id", "reviewer_club_id");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_sparing_offer_id_fkey" FOREIGN KEY ("sparing_offer_id") REFERENCES "sparing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_club_id_fkey" FOREIGN KEY ("reviewer_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_club_id_fkey" FOREIGN KEY ("reviewed_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
