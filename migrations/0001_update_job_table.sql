-- Add a new column to the Job table
ALTER TABLE "Job" ADD COLUMN "retriedCount" INTEGER NOT NULL DEFAULT 0;
