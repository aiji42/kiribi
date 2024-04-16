-- Rename column name from "retriedCount" to "attempts" on the Job table
ALTER TABLE "Job" RENAME COLUMN "retriedCount" TO "attempts";
-- Rename column name from "type" to "binding" on the Job table
ALTER TABLE "Job" RENAME COLUMN "type" TO "binding";
