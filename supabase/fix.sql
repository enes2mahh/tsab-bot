-- ============================================
-- TSAB BOT - Supplementary Fix SQL
-- Run this if registration fails
-- ============================================

-- 1. Make sure plans exist
INSERT INTO plans (name, name_ar, slug, description, description_ar, price, duration_days, trial_days, message_limit, device_limit, features, is_recommended, sort_order)
VALUES
  ('Basic', 'الأساسية', 'basic', 'Perfect for starters', 'مثالية للبداية', 39.00, 30, 3, 1000, 1,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":false,"bulk_send":false,"scheduling":false,"chatflow":false,"file_manager":true,"phonebook":true,"number_filter":false}',
   false, 1),
  ('Professional', 'الاحترافية', 'professional', 'For growing businesses', 'للأعمال المتنامية', 79.00, 30, 7, 10000, 3,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"chatflow":true,"warmer":true,"file_manager":true,"phonebook":true,"number_filter":true}',
   true, 2),
  ('Business', 'الأعمال', 'business', 'Full power for enterprises', 'القوة الكاملة للمؤسسات', 99.00, 30, 0, 100000, 10,
   '{"auto_reply":true,"send_message":true,"send_media":true,"api":true,"webhook":true,"ai":true,"bulk_send":true,"scheduling":true,"chatflow":true,"warmer":true,"live_chat":true,"team":true,"advanced_analytics":true,"file_manager":true,"phonebook":true,"number_filter":true}',
   false, 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. Make sure system_settings exist
INSERT INTO system_settings (id, settings)
VALUES ('global', '{
  "platform_name": "Tsab Bot",
  "gemini_api_key": "",
  "default_system_prompt": "أنت مساعد ذكي ومفيد. أجب باللغة التي يكتب بها المستخدم.",
  "maintenance_mode": false,
  "global_announcement": "",
  "commission_rate": 10,
  "min_withdrawal": 25,
  "referral_hold_days": 14
}')
ON CONFLICT (id) DO NOTHING;

-- 3. Re-create the handle_new_user trigger (safe)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Re-create the handle_new_profile trigger (auto trial subscription)
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM plans WHERE slug = 'basic' AND is_active = true LIMIT 1;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (
      user_id, plan_id, status,
      messages_used, messages_limit,
      starts_at, expires_at
    ) VALUES (
      NEW.id, v_plan_id, 'trial',
      0, 1000,
      NOW(), NOW() + INTERVAL '3 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- 5. Verify plans exist
SELECT name_ar, slug, price, message_limit, device_limit FROM plans ORDER BY sort_order;
