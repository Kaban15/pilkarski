-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SPARING_INVITATION';

-- CreateTable
CREATE TABLE "sparing_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sparing_offer_id" UUID NOT NULL,
    "from_club_id" UUID NOT NULL,
    "to_club_id" UUID NOT NULL,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sparing_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sparing_invitations_sparing_offer_id_to_club_id_key" ON "sparing_invitations"("sparing_offer_id", "to_club_id");

-- CreateIndex
CREATE INDEX "sparing_invitations_to_club_id_status_idx" ON "sparing_invitations"("to_club_id", "status");

-- AddForeignKey
ALTER TABLE "sparing_invitations" ADD CONSTRAINT "sparing_invitations_sparing_offer_id_fkey" FOREIGN KEY ("sparing_offer_id") REFERENCES "sparing_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sparing_invitations" ADD CONSTRAINT "sparing_invitations_from_club_id_fkey" FOREIGN KEY ("from_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sparing_invitations" ADD CONSTRAINT "sparing_invitations_to_club_id_fkey" FOREIGN KEY ("to_club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
