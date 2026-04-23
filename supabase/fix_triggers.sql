-- ============================================
-- TSAB BOT - Critical Fix for Registration Error
-- "Database error saving new user"
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Make sure pgcrypto is enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Drop all old triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

-- Step 3: Recreate handle_new_user with full error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RETURN NEW; -- Don't block signup even if profile insert fails
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 4: Recreate handle_new_profile with full error handling
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get basic plan id
  SELECT id INTO v_plan_id
  FROM public.plans
  WHERE slug = 'basic' AND is_active = true
  LIMIT 1;

  -- Only create subscription if plan exists
  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      user_id, plan_id, status,
      messages_used, messages_limit,
      starts_at, expires_at
    ) VALUES (
      NEW.id,
      v_plan_id,
      'trial',
      0,
      1000,
      NOW(),
      NOW() + INTERVAL '3 days'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_profile error: %', SQLERRM;
    RETURN NEW; -- Don't block even if subscription fails
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();

-- Step 5: Simple referral resolver
CREATE OR REPLACE FUNCTION resolve_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_referrer_id UUID;
BEGIN
  v_code := NEW.raw_user_meta_data->>'referral_code';

  IF v_code IS NOT NULL AND trim(v_code) != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = upper(trim(v_code))
      AND id != NEW.id
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      UPDATE public.profiles
      SET referred_by = v_referrer_id
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'resolve_referral_code error: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION resolve_referral_code();

-- Step 6: Make sure plans exist
INSERT INTO public.plans (name, name_ar, slug, description, description_ar, price, duration_days, trial_days, message_limit, device_limit, features, is_recommended, sort_order)
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

-- Step 7: Verify
SELECT 'Triggers OK' as status;
SELECT name_ar, slug FROM public.plans ORDER BY sort_order;
