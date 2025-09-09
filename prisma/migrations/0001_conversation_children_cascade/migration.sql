-- Migration: Add ON DELETE CASCADE to Conversation child relations
-- Safe to run multiple times due to IF EXISTS guards

BEGIN;

-- Message.conversationId -> Conversation.id
ALTER TABLE "Message"
  DROP CONSTRAINT IF EXISTS "Message_conversationId_fkey";
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- ThreadSummary.conversationId -> Conversation.id
ALTER TABLE "ThreadSummary"
  DROP CONSTRAINT IF EXISTS "ThreadSummary_conversationId_fkey";
ALTER TABLE "ThreadSummary"
  ADD CONSTRAINT "ThreadSummary_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- AdvisorMemory.conversationId -> Conversation.id
ALTER TABLE "AdvisorMemory"
  DROP CONSTRAINT IF EXISTS "AdvisorMemory_conversationId_fkey";
ALTER TABLE "AdvisorMemory"
  ADD CONSTRAINT "AdvisorMemory_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

COMMIT;

