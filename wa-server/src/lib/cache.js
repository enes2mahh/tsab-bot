/**
 * In-memory LRU-style cache with TTL.
 * Works without Redis (single instance). Upgrade to Redis by setting REDIS_URL env var.
 */

const store = new Map() // key -> { value, expiresAt }

function get(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

function set(key, value, ttlSeconds = 3600) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

function del(key) {
  store.delete(key)
}

function delByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

// Periodic cleanup of expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key)
  }
}, 5 * 60 * 1000)

module.exports = { get, set, del, delByPrefix }
