-- ============================================================
-- v7_misc_fixes.sql — Tsab Bot Dashboard v7 Misc Fixes
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- 1. Add metadata column to messages (stores source, campaign_id, etc.)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add attachments column to ticket_messages
ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 3. FAQ suggestions view: top repeated incoming questions not yet in FAQ
CREATE OR REPLACE VIEW faq_suggestions AS
SELECT
  lower(trim(
    CASE
      WHEN jsonb_typeof(content) = 'object' THEN content->>'text'
      ELSE content::text
    END
  )) AS question_text,
  count(*) AS frequency,
  max(created_at) AS last_seen
FROM messages
WHERE
  direction = 'incoming'
  AND type = 'text'
  AND (metadata->>'source') IS DISTINCT FROM 'faq'
  AND lower(trim(
        CASE
          WHEN jsonb_typeof(content) = 'object' THEN content->>'text'
          ELSE content::text
        END
      )) NOT IN (
        SELECT lower(trim(trigger_text)) FROM faqs
        UNION ALL
        SELECT lower(trim(unnest(keywords))) FROM faqs
      )
  AND char_length(
        CASE
          WHEN jsonb_typeof(content) = 'object' THEN content->>'text'
          ELSE content::text
        END
      ) BETWEEN 3 AND 200
GROUP BY 1
HAVING count(*) >= 2
ORDER BY frequency DESC, last_seen DESC
LIMIT 100;

-- Grant read access to authenticated users
GRANT SELECT ON faq_suggestions TO authenticated;

-- 4. Index on messages.metadata for source-based filtering
CREATE INDEX IF NOT EXISTS idx_messages_metadata_source
  ON messages ((metadata->>'source'));

-- 5. Index on messages.created_at for date-range queries (used in home stats)
CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages (created_at DESC);

-- ============================================================
-- MANUAL SUPABASE SETUP (do once in Supabase Dashboard)
-- ============================================================
--
-- A) Email Confirmations (Settings → Auth → Email):
--    • Enable "Confirm email" toggle
--    • Set "Redirect URLs" to include: https://yourdomain.com/auth/callback
--
-- B) Custom SMTP via Resend (Settings → Auth → SMTP):
--    • Host: smtp.resend.com
--    • Port: 465
--    • Username: resend
--    • Password: re_xxxxxxxxxxxx  (your Resend API key)
--    • Sender: noreply@yourdomain.com
--
-- C) Storage bucket "media" (Storage → New bucket):
--    • Name: media
--    • Public: YES
--    • File size limit: 52428800  (50 MB)
--    • Allowed MIME types: image/*, video/*, application/pdf, application/msword,
--      application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- D) Storage RLS policy for "media" bucket:
--    INSERT policy: (auth.uid()::text = (storage.foldername(name))[1])
--    SELECT policy: true  (public read)
--    DELETE policy: (auth.uid()::text = (storage.foldername(name))[1])
--
-- ============================================================
