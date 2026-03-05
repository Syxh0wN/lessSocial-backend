CREATE TYPE "MentionSource" AS ENUM ('postCaption', 'commentContent', 'profileBio');

CREATE TABLE "MentionNotification" (
  "id" TEXT NOT NULL,
  "mentionedUserId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "sourceType" "MentionSource" NOT NULL,
  "postId" TEXT,
  "commentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MentionNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MentionNotification_mentionedUserId_createdAt_idx"
ON "MentionNotification"("mentionedUserId", "createdAt");

ALTER TABLE "MentionNotification"
ADD CONSTRAINT "MentionNotification_mentionedUserId_fkey"
FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentionNotification"
ADD CONSTRAINT "MentionNotification_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentionNotification"
ADD CONSTRAINT "MentionNotification_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentionNotification"
ADD CONSTRAINT "MentionNotification_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "Comment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
