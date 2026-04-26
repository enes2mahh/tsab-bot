-- ============================================================
-- v7_misc_fixes.sql — Tsab Bot Dashboard v7 Misc Fixes
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- 1. Add metadata column to messages (stores source, campaign_id, etc.)
--    schema.sql does NOT have this column — required for source badges
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. ticket_messages.attachments already exists in schema.sql — no action needed.
--    Keeping this comment so future devs know it's intentionally omitted.

-- 3. FAQ suggestions view
--    Uses faq_learning_queue which the bot already populates automatically.
--    bot_faqs     → table of confirmed FAQ answers (question_normalized, answer)
--    faq_learning_queue → tracks repeated incoming questions (count, promoted)
--    security_invoker = true → RLS from faq_learning_queue applies (filters by user's devices)
DROP VIEW IF EXISTS faq_suggestions;
CREATE OR REPLACE VIEW faq_suggestions
WITH (security_invoker = true) AS
SELECT
  lq.id,
  lq.device_id,
  lq.question_normalized  AS question_text,
  lq.last_question        AS question_original,
  lq.count                AS frequency,
  lq.last_ai_answer       AS suggested_answer,
  lq.last_seen_at         AS last_seen,
  bf.id IS NOT NULL       AS already_in_faq
FROM faq_learning_queue lq
LEFT JOIN bot_faqs bf
  ON  bf.device_id          = lq.device_id
  AND bf.question_normalized = lq.question_normalized
  AND bf.is_active           = true
WHERE
  lq.promoted = false
  AND lq.count >= 2
ORDER BY lq.count DESC, lq.last_seen_at DESC;

-- Grant read access to authenticated users (RLS on base table still applies)
GRANT SELECT ON faq_suggestions TO authenticated;

-- 4. Index on messages.metadata for source-based filtering (used in /messages page)
CREATE INDEX IF NOT EXISTS idx_messages_metadata_source
  ON messages ((metadata->>'source'));

-- 5. Index on messages.created_at DESC (used in /home "messages today" query)
CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages (created_at DESC);

-- 6. Index on messages per user + date (common filter pattern in /reports)
CREATE INDEX IF NOT EXISTS idx_messages_user_created
  ON messages (user_id, created_at DESC);

-- ============================================================
-- MANUAL SUPABASE SETUP (do once in Supabase Dashboard)
-- ============================================================
--
-- A) Email Confirmations (Settings → Auth → Email):
--    • Enable "Confirm email" toggle
--    • Set "Redirect URLs" to include:
--        https://yourdomain.com/auth/callback
--        https://yourdomain.com/auth/reset
--
-- B) Custom SMTP via Resend (Settings → Auth → SMTP):
--    1. Sign up at https://resend.com (free tier: 3,000 emails/month)
--    2. Create API Key → copy it
--    3. Add & verify your domain in Resend → Domains
--    4. In Supabase → Project Settings → Auth → SMTP Settings:
--       • Enable Custom SMTP
--       • Host:     smtp.resend.com
--       • Port:     465
--       • Username: resend
--       • Password: re_xxxxxxxxxxxx  (your Resend API key)
--       • Sender:   noreply@yourdomain.com
--
-- C) Storage bucket "media" (Storage → New bucket):
--    If not already created by v6_storage_setup.sql:
--    • Name:             media
--    • Public:           YES
--    • File size limit:  52428800  (50 MB)
--    • Allowed MIME:     image/*, video/*, application/pdf,
--                        application/msword,
--                        application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- D) Storage RLS policies for "media" bucket
--    (Storage → Policies → media bucket → New policy):
--
--    INSERT — users upload only to their own folder:
--      (auth.uid()::text = (storage.foldername(name))[1])
--
--    SELECT — public read (anyone can view uploaded files):
--      true
--
--    DELETE — users delete only their own files:
--      (auth.uid()::text = (storage.foldername(name))[1])
--
-- ============================================================
