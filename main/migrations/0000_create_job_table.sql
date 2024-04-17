-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "binding" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" TEXT NOT NULL,
    "params" TEXT,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "completedAt" DATETIME,
    "processingTime" INTEGER
);

-- CreateIndex
CREATE INDEX "Job_binding_idx" ON "Job"("binding");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_startedAt_idx" ON "Job"("startedAt");

-- CreateIndex
CREATE INDEX "Job_finishedAt_idx" ON "Job"("finishedAt");

-- CreateIndex
CREATE INDEX "Job_completedAt_idx" ON "Job"("completedAt");

-- CreateIndex
CREATE INDEX "Job_attempts_idx" ON "Job"("attempts");

-- CreateIndex
CREATE INDEX "Job_processingTime_idx" ON "Job"("processingTime");
