/**
 * Lightweight in-memory job queue with retry + backoff.
 * Drop-in for Bull — no Redis needed for single-instance Railway deployment.
 * To upgrade to Bull: set REDIS_URL env var and uncomment the Bull section below.
 */

class JobQueue {
  constructor(name) {
    this.name = name
    this.handlers = new Map()  // event -> [fn]
    this._queue = []
    this._running = false
    this._concurrency = 1
  }

  // Register a processor (mirrors Bull API)
  process(concurrencyOrFn, fn) {
    if (typeof concurrencyOrFn === 'function') {
      this._processor = concurrencyOrFn
      this._concurrency = 1
    } else {
      this._concurrency = concurrencyOrFn
      this._processor = fn
    }
    this._run()
  }

  // Add a job (mirrors Bull .add())
  async add(name, data, opts = {}) {
    const job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      data,
      opts,
      attempts: 0,
      maxAttempts: opts.attempts || 1,
      progress: 0,
      _progressFn: (pct) => { job.progress = pct },
    }

    if (opts.delay && opts.delay > 0) {
      setTimeout(() => this._enqueue(job), opts.delay)
    } else {
      this._enqueue(job)
    }

    return job
  }

  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event).push(fn)
    return this
  }

  _emit(event, ...args) {
    for (const fn of (this.handlers.get(event) || [])) {
      try { fn(...args) } catch {}
    }
  }

  _enqueue(job) {
    this._queue.push(job)
    if (!this._running) this._run()
  }

  async _run() {
    if (this._running || !this._processor) return
    this._running = true

    while (this._queue.length > 0) {
      const job = this._queue.shift()
      job.attempts++

      try {
        // Pass a job-like object with a .progress() method
        await this._processor({ ...job, progress: job._progressFn })
        this._emit('completed', job)
      } catch (err) {
        if (job.attempts < job.maxAttempts) {
          const delay = this._backoffDelay(job)
          console.warn(`[Queue:${this.name}] job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}), retry in ${delay}ms: ${err.message}`)
          await new Promise(r => setTimeout(r, delay))
          this._queue.unshift(job) // re-queue at front
        } else {
          console.error(`[Queue:${this.name}] job ${job.id} permanently failed after ${job.attempts} attempts: ${err.message}`)
          this._emit('failed', job, err)
        }
      }
    }

    this._running = false
  }

  _backoffDelay(job) {
    const backoff = job.opts.backoff
    if (!backoff) return 1000
    if (backoff.type === 'exponential') {
      return Math.min(backoff.delay * Math.pow(2, job.attempts - 1), 30000)
    }
    return backoff.delay || 1000
  }
}

// Singleton queues shared across the WA server process
const messageQueue  = new JobQueue('messages')
const campaignQueue = new JobQueue('campaigns')

module.exports = { messageQueue, campaignQueue }
