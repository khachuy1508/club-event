-- AlterTable
DROP INDEX IF EXISTS "ClubStaff_clubId_key";

-- CreateIndex
CREATE INDEX "ClubStaff_clubId_idx" ON "ClubStaff"("clubId");
