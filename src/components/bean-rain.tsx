import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT, usePointerFine } from './motion-primitives'

/* ------------------------------------------------------------------ *
 * BeanRain — coffee beans rain down INSIDE a headline, only in a soft
 * cloud around the cursor.
 *
 * The visible headline is real DOM text (accessible, SSR'd). Over it a
 * canvas runs a small physics sim: bean-shaped particles (an "O" — a
 * capsule with a punched hole, drawn in a single even-odd fill) fall
 * under gravity and tumble. The canvas is clipped to the glyph shapes
 * (a mask redrawn from the same text) and to a radial cloud at the
 * cursor.
 *
 * Performance: the sim only animates while hovered (rAF stops when
 * idle), the font size is cached (no per-frame getComputedStyle), and —
 * the big one — every per-frame composite (bean draws, glyph mask,
 * cursor gradient) is confined to a small box around the pointer instead
 * of the whole (possibly huge) headline canvas. Disabled for
 * reduced-motion / coarse pointers.
 * ------------------------------------------------------------------ */

type Line = string | { text: string; accent?: boolean }

const AMBER = '#e0913d'
const AMBERDEEP = '#c2722a'

type Bean = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
  len: number
  deep: boolean
}

export function BeanRain({
  lines,
  className,
  whole = false,
}: {
  lines: Line[]
  className?: string
  /** reveal the whole text on hover instead of a cursor cloud-column
      (used for single glyphs like the tilted hero O) */
  whole?: boolean
}) {
  const reduce = useReducedMotion()
  const fine = usePointerFine()
  const enabled = fine && !reduce

  const hostRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const linesKey = lines
    .map((l) => (typeof l === 'string' ? l : l.text))
    .join('|')

  useEffect(() => {
    if (!enabled) return
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let width = 0
    let height = 0
    let fs = 48 // cached font size (px) — refreshed on resize/enter, never per-frame
    let beans: Bean[] = []
    let mask: HTMLCanvasElement | null = null
    const pointer = { x: -9999 }
    let hovering = false
    let raf = 0
    let lastT = 0

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    // Bean dimensions/speeds are clamped in absolute px so a 480px hero glyph
    // doesn't get 80px beans screaming down the screen — they stay bean-sized
    // and gently paced at every headline scale.
    const beanLen = () =>
      Math.max(12, Math.min(46, fs * 0.12)) * rand(0.8, 1.18)
    // Gentle gravity + a low terminal velocity → a calm, steady fall.
    const gravity = () => Math.min(680, Math.max(260, fs * 0.85))
    const TERMINAL = 230

    function resetBean(b: Bean, atTop: boolean, i: number) {
      b.len = beanLen()
      b.x = Math.random() * width
      b.y = atTop ? -b.len - Math.random() * height * 0.5 : Math.random() * height
      // Falls essentially straight down — like rain from a showerhead — with
      // only a whisper of drift/turn so it isn't mechanically identical.
      b.vx = rand(-3, 3)
      b.vy = rand(16, 50)
      b.rot = Math.random() * Math.PI * 2
      b.vrot = rand(-0.45, 0.45)
      b.deep = i % 3 === 0
    }

    function seed() {
      const count = Math.max(26, Math.min(220, Math.round(width / 11)))
      beans = Array.from({ length: count }, (_, i) => {
        const b: Bean = {
          x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0, len: 10, deep: false,
        }
        resetBean(b, false, i)
        return b
      })
    }

    // Each bean is the actual font "O" (so it matches the headline glyphs
    // exactly), drawn rotated. Anton's cap height ≈ 0.72·font-size, so we
    // size the font up to land a glyph of visual height ~len.
    function drawBean(b: Bean) {
      ctx!.save()
      ctx!.translate(b.x, b.y)
      ctx!.rotate(b.rot)
      ctx!.fillStyle = b.deep ? AMBERDEEP : AMBER
      ctx!.font = `${(b.len * 1.4).toFixed(1)}px "Anton", "Arial Narrow", sans-serif`
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      ctx!.fillText('O', 0, 0)
      ctx!.restore()
    }

    function buildMask() {
      if (width <= 0 || height <= 0) return
      const m = document.createElement('canvas')
      m.width = Math.round(width * dpr)
      m.height = Math.round(height * dpr)
      const mc = m.getContext('2d')
      if (!mc) return
      mc.scale(dpr, dpr)
      mc.fillStyle = '#fff'
      mc.textBaseline = 'alphabetic'
      host.querySelectorAll('[data-bean-line]').forEach((node) => {
        const el = node as HTMLElement
        const cs = getComputedStyle(el)
        mc.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
        try {
          ;(mc as any).letterSpacing = cs.letterSpacing
        } catch {
          /* older browsers: ignore */
        }
        const text = el.textContent || ''
        const size = parseFloat(cs.fontSize) || 48
        const mt = mc.measureText(text)
        const ascent = mt.fontBoundingBoxAscent ?? size * 0.8
        const descent = mt.fontBoundingBoxDescent ?? size * 0.2
        // offset* is the pre-transform LAYOUT box (relative to the positioned
        // host), so the canvas, mask, and glyph stay aligned even when the
        // whole field is rotated by a parent (the tilted hero O).
        const baseline = (el.offsetHeight - (ascent + descent)) / 2 + ascent
        mc.fillText(text, el.offsetLeft, el.offsetTop + baseline)
      })
      mask = m
    }

    function resize() {
      width = host.clientWidth
      height = host.clientHeight
      fs = parseFloat(getComputedStyle(host).fontSize) || 48
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      seed()
      buildMask()
    }

    function frame(t: number) {
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0)
      lastT = t

      const g = gravity()
      let onScreen = false
      for (let i = 0; i < beans.length; i++) {
        const b = beans[i]
        b.vy = Math.min(TERMINAL, b.vy + g * dt)
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.rot += b.vrot * dt
        if (b.y - b.len > height) {
          // Respawn ONLY while hovering. On mouse-leave we just stop spawning;
          // the beans already in flight keep falling and drain out the bottom.
          if (hovering) resetBean(b, true, i)
        }
        if (b.y - b.len <= height) onScreen = true
      }

      // Clear is cheap (memset).
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.clearRect(0, 0, canvas.width, canvas.height)

      if (mask) {
        if (whole) {
          // Reveal the entire glyph (single letters like the tilted hero O).
          ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
          for (let i = 0; i < beans.length; i++) drawBean(beans[i])
          ctx!.setTransform(1, 0, 0, 1, 0, 0)
          ctx!.globalCompositeOperation = 'destination-in'
          ctx!.drawImage(mask, 0, 0)
          ctx!.globalCompositeOperation = 'source-over'
        } else {
          // A thin "cloud" overhead at the cursor's x: rain falls straight
          // down a vertical column, clipped to the glyphs — into the letter
          // you're over, not the whole word.
          const bandHalf = Math.max(24, fs * 0.24)
          const bx = Math.max(0, Math.floor((pointer.x - bandHalf) * dpr))
          const bw = Math.min(canvas.width - bx, Math.ceil(bandHalf * 2 * dpr))
          if (bw > 0) {
            ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
            for (let i = 0; i < beans.length; i++) {
              const b = beans[i]
              if (Math.abs(b.x - pointer.x) > bandHalf + b.len) continue
              drawBean(b)
            }
            ctx!.setTransform(1, 0, 0, 1, 0, 0)
            ctx!.globalCompositeOperation = 'destination-in'
            ctx!.drawImage(mask, bx, 0, bw, canvas.height, bx, 0, bw, canvas.height)
            const gx0 = (pointer.x - bandHalf) * dpr
            const gx1 = (pointer.x + bandHalf) * dpr
            const grad = ctx!.createLinearGradient(gx0, 0, gx1, 0)
            grad.addColorStop(0, 'rgba(0,0,0,0)')
            grad.addColorStop(0.3, 'rgba(0,0,0,1)')
            grad.addColorStop(0.7, 'rgba(0,0,0,1)')
            grad.addColorStop(1, 'rgba(0,0,0,0)')
            ctx!.fillStyle = grad
            ctx!.fillRect(bx, 0, bw, canvas.height)
            ctx!.globalCompositeOperation = 'source-over'
          }
        }
      }

      // Keep animating while spawning (hover) or while drops are still draining.
      if (hovering || onScreen) {
        raf = requestAnimationFrame(frame)
      } else {
        raf = 0
      }
    }

    function onMove(e: MouseEvent) {
      pointer.x = e.clientX - host.getBoundingClientRect().left
    }
    function onEnter(e: MouseEvent) {
      hovering = true
      fs = parseFloat(getComputedStyle(host).fontSize) || 48
      onMove(e)
      seed() // refill (in case a prior drain emptied the field)
      buildMask()
      if (!raf) {
        lastT = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }
    function onLeave() {
      hovering = false
    }

    const ro = new ResizeObserver(() => resize())
    ro.observe(host)
    resize()
    host.addEventListener('mousemove', onMove)
    host.addEventListener('mouseenter', onEnter)
    host.addEventListener('mouseleave', onLeave)

    return () => {
      ro.disconnect()
      host.removeEventListener('mousemove', onMove)
      host.removeEventListener('mouseenter', onEnter)
      host.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled, linesKey, whole])

  return (
    <span ref={hostRef} className={'relative inline-block ' + (className ?? '')}>
      {lines.map((l, i) => {
        const text = typeof l === 'string' ? l : l.text
        const accent = typeof l === 'object' && l.accent
        return (
          <motion.span
            key={i}
            data-bean-line
            className={'block ' + (accent ? 'text-amber' : '')}
            initial={reduce ? false : { opacity: 0, y: '0.18em' }}
            whileInView={reduce ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.9,
              ease: EASE_OUT,
              delay: reduce ? 0 : i * 0.12,
            }}
          >
            {text}
          </motion.span>
        )
      })}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </span>
  )
}
