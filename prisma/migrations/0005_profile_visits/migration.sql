CREATE TABLE "ProfileVisit" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "visitedUserId" TEXT NOT NULL,
  "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileVisit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProfileVisit_visitorId_visitedUserId_key" ON "ProfileVisit"("visitorId", "visitedUserId");
CREATE INDEX "ProfileVisit_visitedUserId_visitedAt_idx" ON "ProfileVisit"("visitedUserId", "visitedAt");

ALTER TABLE "ProfileVisit"
ADD CONSTRAINT "ProfileVisit_visitorId_fkey"
FOREIGN KEY ("visitorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileVisit"
ADD CONSTRAINT "ProfileVisit_visitedUserId_fkey"
FOREIGN KEY ("visitedUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
