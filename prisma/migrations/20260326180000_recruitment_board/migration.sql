-- AlterTable: add position to recruitment_pipeline
ALTER TABLE "recruitment_pipeline" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: recruitment_events (timeline)
CREATE TABLE "recruitment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pipeline_id" UUID NOT NULL,
    "from_stage" "RecruitmentStage",
    "to_stage" "RecruitmentStage" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recruitment_events_pipeline_id_idx" ON "recruitment_events"("pipeline_id");

-- AddForeignKey
ALTER TABLE "recruitment_events" ADD CONSTRAINT "recruitment_events_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "recruitment_pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
