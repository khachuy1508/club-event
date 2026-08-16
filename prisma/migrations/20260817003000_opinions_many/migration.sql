DROP INDEX "Opinion_studentId_key";

CREATE INDEX "Opinion_studentId_idx" ON "Opinion"("studentId");
