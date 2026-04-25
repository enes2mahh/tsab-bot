-- ============================================================
-- TSAB BOT - V5 Notifications + OTP + Messenger + Stories
-- Run AFTER complete_setup.sql + v2 + v3 + v4
-- Safe to re-run.
-- ============================================================

-- 1) ADMIN NOTIFICATIONS (bell icon + browser push)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('new_user', 'new_subscription', 'new_inquiry', 'new_ticket', 'new_withdrawal', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_notifs_admin_only" ON admin_notifications;
CREATE POLICY "admin_notifs_admin_only" ON admin_notifications FOR ALL USING (is_admin());

-- Auto-trigger on new user signup
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, body, link, metadata)
  VALUES (
    'new_user',
    'مستخدم جديد سجّل',
    COALESCE(NEW.name, NEW.email),
    '/admin/users',
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email, 'name', NEW.name)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_user_notify ON profiles;
CREATE TRIGGER on_new_user_notify
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_new_user();

-- Auto-trigger on new active subscription (after trial converts or paid plan)
CREATE OR REPLACE FUNCTION notify_new_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_plan_name TEXT;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT email INTO v_user_email FROM profiles WHERE id = NEW.user_id;
    SELECT name_ar INTO v_plan_name FROM plans WHERE id = NEW.plan_id;

    INSERT INTO admin_notifications (type, title, body, link, metadata)
    VALUES (
      'new_subscription',
      'اشتراك مدفوع جديد 💰',
      v_user_email || ' → ' || COALESCE(v_plan_name, 'خطة'),
      '/admin/users',
      jsonb_build_object('user_id', NEW.user_id, 'plan_id', NEW.plan_id, 'subscription_id', NEW.id)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_subscription_notify ON subscriptions;
CREATE TRIGGER on_new_subscription_notify
  AFTER INSERT ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION notify_new_subscription();

-- Auto-trigger on new inquiry (contact, career, partner forms)
CREATE OR REPLACE FUNCTION notify_new_inquiry()
RETURNS TRIGGER AS $$
DECLARE
  v_type_label TEXT;
BEGIN
  v_type_label := CASE NEW.type
    WHEN 'contact' THEN 'تواصل'
    WHEN 'career' THEN 'توظيف'
    WHEN 'partner' THEN 'شراكة'
    WHEN 'help' THEN 'مساعدة'
    ELSE 'استفسار'
  END;

  INSERT INTO admin_notifications (type, title, body, link, metadata)
  VALUES (
    'new_inquiry',
    'طلب جديد: ' || v_type_label,
    NEW.name || ' — ' || COALESCE(NEW.subject, LEFT(NEW.message, 80)),
    '/admin/inquiries',
    jsonb_build_object('inquiry_id', NEW.id, 'type', NEW.type)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_inquiry_notify ON inquiries;
CREATE TRIGGER on_new_inquiry_notify
  AFTER INSERT ON inquiries
  FOR EACH ROW EXECUTE FUNCTION notify_new_inquiry();

-- Auto-trigger on new ticket
CREATE OR REPLACE FUNCTION notify_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email FROM profiles WHERE id = NEW.user_id;

  INSERT INTO admin_notifications (type, title, body, link, metadata)
  VALUES (
    'new_ticket',
    'تذكرة دعم جديدة 🎫',
    v_user_email || ' — ' || NEW.subject,
    '/admin/tickets',
    jsonb_build_object('ticket_id', NEW.id, 'priority', NEW.priority)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_ticket_notify ON tickets;
CREATE TRIGGER on_new_ticket_notify
  AFTER INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION notify_new_ticket();

-- Auto-trigger on new withdrawal
CREATE OR REPLACE FUNCTION notify_new_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT email INTO v_user_email FROM profiles WHERE id = NEW.user_id;

    INSERT INTO admin_notifications (type, title, body, link, metadata)
    VALUES (
      'new_withdrawal',
      'طلب سحب جديد 💸',
      v_user_email || ' → ' || NEW.amount || ' ر.س',
      '/admin/referrals',
      jsonb_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_withdrawal_notify ON withdrawals;
CREATE TRIGGER on_new_withdrawal_notify
  AFTER INSERT ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION notify_new_withdrawal();


-- 2) PHONE OTP for account verification
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT false,
  purpose TEXT DEFAULT 'register' CHECK (purpose IN ('register', 'reset', 'login_2fa')),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);

ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
-- Only service role accesses (no public RLS policies = locked down)


-- 3) PROFILE verification flags
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;


-- 4) PASSWORD RESET HISTORY (for audit + admin transparency)
CREATE TABLE IF NOT EXISTS password_reset_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reset_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- which admin did it
  reset_type TEXT CHECK (reset_type IN ('admin_reset', 'self_reset', 'forgot_password')),
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_log_user ON password_reset_log(user_id, created_at DESC);

ALTER TABLE password_reset_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "password_log_admin" ON password_reset_log;
CREATE POLICY "password_log_admin" ON password_reset_log FOR ALL USING (is_admin());


-- 5) WA STORIES SCHEDULER
CREATE TABLE IF NOT EXISTS scheduled_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
  caption TEXT,
  text_color TEXT DEFAULT '#FFFFFF',
  background_color TEXT DEFAULT '#7C3AED',
  media_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_pending ON scheduled_stories(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_stories_user ON scheduled_stories(user_id, created_at DESC);

ALTER TABLE scheduled_stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stories_own" ON scheduled_stories;
CREATE POLICY "stories_own" ON scheduled_stories FOR ALL USING (auth.uid() = user_id OR is_admin());


-- 6) Verify
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='admin_notifications') AS has_notifications,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='phone_otps') AS has_otps,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name='scheduled_stories') AS has_stories,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone_verified') AS has_phone_verified,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname IN ('on_new_user_notify', 'on_new_inquiry_notify', 'on_new_ticket_notify')) AS triggers_count;
