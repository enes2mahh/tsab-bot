-- v8: user_stats view لتقليل N+1 queries في صفحة admin/users
-- بدلاً من 10 queries منفصلة لكل مستخدم، نستخدم view واحد مجمّع

CREATE OR REPLACE VIEW user_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT d.id) AS device_count,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'connected') AS connected_devices,
  COUNT(DISTINCT m.id) AS message_count,
  COUNT(DISTINCT c.id) AS campaign_count,
  COUNT(DISTINCT ct.id) AS contact_count,
  COUNT(DISTINCT t.id) AS ticket_count
FROM profiles p
LEFT JOIN devices d ON d.user_id = p.id
LEFT JOIN messages m ON m.user_id = p.id
LEFT JOIN campaigns c ON c.user_id = p.id
LEFT JOIN contacts ct ON ct.user_id = p.id
LEFT JOIN tickets t ON t.user_id = p.id
GROUP BY p.id;

-- RLS: الأدمن فقط يمكنه الاطلاع
ALTER VIEW user_stats OWNER TO postgres;

-- Grant to authenticated role (service_role يرثها تلقائياً)
GRANT SELECT ON user_stats TO service_role;
