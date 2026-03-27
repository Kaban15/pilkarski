-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'INTERNAL');
CREATE TYPE "AttendanceStatus" AS ENUM ('YES', 'NO', 'MAYBE');

-- Add visibility to events
ALTER TABLE "events" ADD COLUMN "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Create event_attendance table
CREATE TABLE "event_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "event_attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "event_attendance_event_id_user_id_key" ON "event_attendance"("event_id", "user_id");
CREATE INDEX "event_attendance_event_id_idx" ON "event_attendance"("event_id");
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add canManageEvents to club_memberships
ALTER TABLE "club_memberships" ADD COLUMN "can_manage_events" BOOLEAN NOT NULL DEFAULT false;
