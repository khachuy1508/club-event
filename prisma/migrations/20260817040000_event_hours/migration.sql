ALTER TABLE "CheckIn" ADD COLUMN "slotName" TEXT;

CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL,
    "morningName" TEXT NOT NULL,
    "morningStart" TEXT NOT NULL,
    "morningEnd" TEXT NOT NULL,
    "afternoonName" TEXT NOT NULL,
    "afternoonStart" TEXT NOT NULL,
    "afternoonEnd" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);
