'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  color: string
}

const COLORS = ['#7C3AED', '#2563EB', '#10B981', '#A78BFA', '#60A5FA']

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars: Star[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.7 + 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))

    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle =
          star.color +
          Math.floor(star.opacity * 255)
            .toString(16)
            .padStart(2, '0')
        ctx.fill()

        // Twinkle
        star.opacity += (Math.random() - 0.5) * 0.02
        star.opacity = Math.max(0.1, Math.min(1, star.opacity))

        // Move
        star.y -= star.speed
        if (star.y < -5) {
          star.y = canvas.height + 5
          star.x = Math.random() * canvas.width
        }
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="stars-canvas"
      style={{ opacity: 0.6 }}
    />
  )
}
