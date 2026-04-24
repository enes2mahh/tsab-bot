require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || 8080,
  // Accept both names for compatibility with Vercel env (WA_SERVER_SECRET) and local (WA_SECRET)
  WA_SECRET: process.env.WA_SECRET || process.env.WA_SERVER_SECRET || 'your-secret-32-chars-minimum-here!',
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
}
