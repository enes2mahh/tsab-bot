-- =============================================
-- v9: Security Fixes
-- 1. admin_audit_logs table
-- 2. activate_code_safe function (race-condition-safe)
-- =============================================

-- =============================================
-- 1. Admin Audit Logs
-- =============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action      TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email   TEXT,
  notes          TEXT,
  ip_address     TEXT,
  user_agent     TEXT,
  timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin      ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp  ON admin_audit_logs(timestamp DESC);

-- Admins only
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_read_audit" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- service_role can insert (server-side only)
CREATE POLICY "service_insert_audit" ON admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 2. Safe activation function (FOR UPDATE lock)
-- =============================================
CREATE OR REPLACE FUNCTION activate_code_safe(
  p_code             TEXT,
  p_user_id          UUID,
  p_plan_duration_days INTEGER DEFAULT 30
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code         activation_codes%ROWTYPE;
  v_plan         plans%ROWTYPE;
  v_duration     INTEGER;
  v_starts_at    TIMESTAMPTZ;
  v_expires_at   TIMESTAMPTZ;
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Lock row to prevent concurrent double-activations
  SELECT * INTO v_code
  FROM activation_codes
  WHERE code = p_code
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'كود غير صحيح أو منتهي الصلاحية');
  END IF;

  IF v_code.uses_count >= v_code.max_uses THEN
    RETURN jsonb_build_object('error', 'تم استخدام هذا الكود بالكامل');
  END IF;

  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < NOW() THEN
    RETURN jsonb_build_object('error', 'انتهت صلاحية هذا الكود');
  END IF;

  SELECT * INTO v_plan FROM plans WHERE id = v_code.plan_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'الخطة غير موجودة');
  END IF;

  v_duration   := COALESCE(v_code.duration_days, v_plan.duration_days, p_plan_duration_days);
  v_starts_at  := NOW();
  v_expires_at := NOW() + (v_duration || ' days')::INTERVAL;

  -- Cancel existing active/trial subscriptions
  UPDATE subscriptions
  SET status = 'cancelled'
  WHERE user_id = p_user_id
    AND status IN ('trial', 'active');

  -- Create new subscription atomically
  INSERT INTO subscriptions (
    user_id, plan_id, status, messages_used, messages_limit,
    starts_at, expires_at, activation_code, notes, created_at
  ) VALUES (
    p_user_id, v_plan.id, 'active', 0, v_plan.message_limit,
    v_starts_at, v_expires_at, v_code.code, v_code.notes, NOW()
  )
  RETURNING * INTO v_subscription;

  -- Increment uses atomically
  UPDATE activation_codes
  SET
    uses_count   = uses_count + 1,
    is_active    = CASE WHEN uses_count + 1 >= max_uses THEN false ELSE true END,
    last_used_at = NOW()
  WHERE id = v_code.id;

  -- Audit log
  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, notes, timestamp)
  VALUES (
    p_user_id, 'code_activation', p_user_id,
    'Code: ' || v_code.code || ' | Plan: ' || v_plan.name_ar || ' | Days: ' || v_duration,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription', jsonb_build_object(
      'plan_name_ar', v_plan.name_ar,
      'duration_days', v_duration,
      'expires_at',    v_expires_at
    )
  );
END;
$$;

-- Grant execute to authenticated users (RPC call from client)
GRANT EXECUTE ON FUNCTION activate_code_safe(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_code_safe(TEXT, UUID, INTEGER) TO service_role;
