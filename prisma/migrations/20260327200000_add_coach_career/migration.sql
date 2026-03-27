-- CreateTable
CREATE TABLE "coach_career_entries" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "club_name" VARCHAR(200) NOT NULL,
    "season" VARCHAR(20) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "level" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_career_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "coach_career_entries" ADD CONSTRAINT "coach_career_entries_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
