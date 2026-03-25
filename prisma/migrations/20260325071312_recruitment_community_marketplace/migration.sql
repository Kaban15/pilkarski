-- CreateEnum
CREATE TYPE "RecruitmentStage" AS ENUM ('WATCHING', 'INVITED_TO_TRYOUT', 'AFTER_TRYOUT', 'OFFER_SENT', 'SIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClubPostCategory" AS ENUM ('LOOKING_FOR_GOALKEEPER', 'LOOKING_FOR_SPARRING', 'LOOKING_FOR_COACH', 'GENERAL_NEWS', 'MATCH_RESULT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'TRYOUT';
ALTER TYPE "EventType" ADD VALUE 'CAMP';
ALTER TYPE "EventType" ADD VALUE 'CONTINUOUS_RECRUITMENT';
ALTER TYPE "EventType" ADD VALUE 'INDIVIDUAL_TRAINING';
ALTER TYPE "EventType" ADD VALUE 'GROUP_TRAINING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'RECRUITMENT_NEW';
ALTER TYPE "NotificationType" ADD VALUE 'RECRUITMENT_MATCH';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "price_info" VARCHAR(200),
ADD COLUMN     "target_age_max" INTEGER,
ADD COLUMN     "target_age_min" INTEGER,
ADD COLUMN     "target_level" "SparingLevel",
ADD COLUMN     "target_position" "PlayerPosition";

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "available_from" DATE,
ADD COLUMN     "preferred_level" "SparingLevel";

-- CreateTable
CREATE TABLE "recruitment_pipeline" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "stage" "RecruitmentStage" NOT NULL DEFAULT 'WATCHING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recruitment_pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_posts" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "category" "ClubPostCategory" NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "content" TEXT,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "club_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recruitment_pipeline_club_id_stage_idx" ON "recruitment_pipeline"("club_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_pipeline_club_id_transfer_id_key" ON "recruitment_pipeline"("club_id", "transfer_id");

-- CreateIndex
CREATE INDEX "club_posts_club_id_created_at_idx" ON "club_posts"("club_id", "created_at");

-- CreateIndex
CREATE INDEX "club_posts_category_idx" ON "club_posts"("category");

-- AddForeignKey
ALTER TABLE "recruitment_pipeline" ADD CONSTRAINT "recruitment_pipeline_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_pipeline" ADD CONSTRAINT "recruitment_pipeline_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_posts" ADD CONSTRAINT "club_posts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
