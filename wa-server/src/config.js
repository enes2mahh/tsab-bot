require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || 8080,
  WA_SECRET: process.env.WA_SECRET || 'your-secret-32-chars-minimum-here!',
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
}
