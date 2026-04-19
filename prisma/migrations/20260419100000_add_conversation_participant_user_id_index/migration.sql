-- CreateIndex
-- Adds secondary index on (user_id) for fast lookup of user's conversations.
-- Primary key is (conversation_id, user_id) — PostgreSQL can't use it for
-- queries filtering only on user_id without a prefix match.
-- Unblocks message.unreadCount (was doing full table scan → 7.27s cold).
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants"("user_id");
