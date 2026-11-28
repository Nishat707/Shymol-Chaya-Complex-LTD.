-- Run after applying the Prisma contract:
-- psql "$DIRECT_URL" -f prisma/additional-features.sql

DO $$ BEGIN CREATE TYPE "NoticeCategory" AS ENUM ('GENERAL','MAINTENANCE','EMERGENCY','PAYMENT_REMINDER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SuggestionCategory" AS ENUM ('MAINTENANCE','SECURITY','CLEANLINESS','MANAGEMENT','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SuggestionStatus" AS ENUM ('SUBMITTED','UNDER_REVIEW','IN_PROGRESS','RESOLVED','CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING','ELECTRICAL','ELEVATOR','CLEANING','SECURITY','COMMON_AREA','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RequestStatus" AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','REJECTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('NOTICE','PAYMENT','CHARGE','SUGGESTION','MAINTENANCE','SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "FlatResident" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "FlatResident" ADD COLUMN IF NOT EXISTS "photoUrl" text;
ALTER TABLE "Notice" ADD COLUMN IF NOT EXISTS "category" "NoticeCategory" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "Notice" ADD COLUMN IF NOT EXISTS "pinned" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ResidentSuggestion" (
  "id" text PRIMARY KEY,
  "flatId" text NOT NULL,
  "residentId" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" "SuggestionCategory" NOT NULL DEFAULT 'OTHER',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "status" "SuggestionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "adminResponse" text,
  "submittedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "ResidentSuggestion_flatId_idx" ON "ResidentSuggestion"("flatId");
CREATE INDEX IF NOT EXISTS "ResidentSuggestion_residentId_idx" ON "ResidentSuggestion"("residentId");
CREATE INDEX IF NOT EXISTS "ResidentSuggestion_status_idx" ON "ResidentSuggestion"("status");

CREATE TABLE IF NOT EXISTS "MaintenanceRequest" (
  "id" text PRIMARY KEY,
  "flatId" text NOT NULL,
  "residentId" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "category" "MaintenanceCategory" NOT NULL DEFAULT 'OTHER',
  "photoUrl" text,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminComment" text,
  "submittedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_flatId_idx" ON "MaintenanceRequest"("flatId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_residentId_idx" ON "MaintenanceRequest"("residentId");
CREATE INDEX IF NOT EXISTS "MaintenanceRequest_status_idx" ON "MaintenanceRequest"("status");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" text PRIMARY KEY,
  "recipientEmail" text NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "href" text,
  "readAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Notification_recipientEmail_idx" ON "Notification"("recipientEmail");
CREATE INDEX IF NOT EXISTS "Notification_recipientEmail_readAt_idx" ON "Notification"("recipientEmail","readAt");
