import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import {
  Children,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react'

/* ------------------------------------------------------------------ *
 * Shared motion language
 *
 * One easing vocabulary used everywhere so the whole site moves with
 * the same confident, editorial hand. "béchamel-smooth": long, low-
 * acceleration curves — never bouncy.
 * ------------------------------------------------------------------ */

// Custom cubic-beziers (authored, not the framework defaults).
export const EASE_OUT = [0.16, 1, 0.3, 1] as const // expo-out: arrives slow & sure
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const // symmetric, for parallax mapping
export const EASE_SOFT = [0.25, 1, 0.5, 1] as const // gentle settle

export const REVEAL_DURATION = 0.8
export const REVEAL_STAGGER = 0.09

// Spring tuned for low bounce — used by magnetic CTA & scroll progress.
export const SOFT_SPRING = { stiffness: 140, damping: 26, mass: 0.9 } as const

// One viewport config so every scroll reveal fires once, slightly early.
const VIEWPORT = { once: true, amount: 0.35, margin: '0px 0px -8% 0px' } as const

/* ------------------------------------------------------------------ *
 * Reveal — fade + rise as it enters the viewport.
 *
 * SSR-safe: motion's whileInView no-ops on the server and animates on
 * mount in the client. Reduced motion → instant opacity-only.
 * ------------------------------------------------------------------ */
type RevealProps<T extends ElementType> = {
  as?: T
  children: ReactNode
  delay?: number
  /** travel distance in px (default 26) */
  y?: number
  /** if true, children animate with a gentle stagger */
  stagger?: boolean
  staggerAmount?: number
} & Omit<ComponentPropsWithoutRef<T>, 'children'>

export function Reveal<T extends ElementType = 'div'>({
  as,
  children,
  delay = 0,
  y = 26,
  stagger = false,
  staggerAmount = REVEAL_STAGGER,
  ...rest
}: RevealProps<T>) {
  const reduce = useReducedMotion()
  const Tag = motion[(as ?? 'div') as 'div'] as typeof motion.div

  if (reduce) {
    const StaticTag = (as ?? 'div') as ElementType
    return <StaticTag {...(rest as any)}>{children}</StaticTag>
  }

  if (stagger) {
    return (
      <Tag
        {...(rest as any)}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: staggerAmount, delayChildren: delay } },
        }}
      >
        {Children.map(children, (child, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: REVEAL_DURATION, ease: EASE_OUT },
              },
            }}
          >
            {child}
          </motion.div>
        ))}
      </Tag>
    )
  }

  return (
    <Tag
      {...(rest as any)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: REVEAL_DURATION, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ *
 * MaskedLines — title-sequence headline reveal.
 *
 * Each line sits in an overflow-hidden track and rises out from under
 * its own mask with a slight stagger. Pass an array of ReactNodes
 * (one per visual line) so <br/>, <span className="text-amber"> etc.
 * are preserved exactly.
 * ------------------------------------------------------------------ */
export function MaskedLines({
  lines,
  className,
  delay = 0,
  stagger = 0.12,
  duration = 0.9,
  /** reveal on scroll-in (default) or immediately on mount (hero) */
  trigger = 'inView',
}: {
  lines: ReactNode[]
  className?: string
  delay?: number
  stagger?: number
  duration?: number
  trigger?: 'inView' | 'mount'
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <span className={className}>
        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>
            {line}
          </span>
        ))}
      </span>
    )
  }

  const animateProps =
    trigger === 'mount'
      ? { animate: 'show' as const }
      : { whileInView: 'show' as const, viewport: VIEWPORT }

  return (
    <motion.span
      className={className}
      initial="hidden"
      {...animateProps}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      // a touch more bottom room so descenders/tight line-height never clip the mask
      style={{ display: 'block' }}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.08em' }}
        >
          <motion.span
            style={{ display: 'block', willChange: 'transform' }}
            variants={{
              hidden: { y: '115%' },
              show: { y: '0%', transition: { duration, ease: EASE_OUT } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ *
 * usePointerFine — true only on devices with a precise pointer.
 *
 * Gates hover/magnetic micro-interactions to desktop. SSR-safe:
 * starts false, resolves in an effect on the client.
 * ------------------------------------------------------------------ */
export function usePointerFine(): boolean {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFine(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return fine
}

/* ------------------------------------------------------------------ *
 * MagneticButton — primary CTA gently leans toward the cursor.
 *
 * Desktop-only & reduced-motion-aware. Renders a plain element when
 * effects are off, so the wrapped Link/button keeps working untouched.
 * ------------------------------------------------------------------ */
export function MagneticButton({
  children,
  className,
  strength = 0.32,
  radius = 90,
}: {
  children: ReactNode
  className?: string
  strength?: number
  radius?: number
}) {
  const reduce = useReducedMotion()
  const fine = usePointerFine()
  const ref = useRef<HTMLSpanElement>(null)
  const x = useSpring(0, SOFT_SPRING)
  const y = useSpring(0, SOFT_SPRING)

  const enabled = fine && !reduce

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    const falloff = Math.min(1, radius / Math.max(dist, 1))
    x.set(dx * strength * falloff)
    y.set(dy * strength * falloff)
  }

  function reset() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y, display: 'inline-block', willChange: 'transform' }}
      className={className}
      whileHover={enabled ? { scale: 1.03 } : undefined}
      whileTap={enabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', ...SOFT_SPRING }}
    >
      {children}
    </motion.span>
  )
}

/* ------------------------------------------------------------------ *
 * ScrollProgress — slim amber bar pinned to the top of the viewport.
 * ------------------------------------------------------------------ */
export function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.6 })

  if (reduce) return null

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-amber"
      style={{ scaleX }}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Marquee — slow infinite strip of phrases between sections.
 *
 * CSS-driven (transform only) so it costs nothing on the main thread.
 * Pauses for reduced-motion (renders a static, centered strip).
 * ------------------------------------------------------------------ */
export function Marquee({
  items,
  speed = 38,
  className,
}: {
  items: string[]
  speed?: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const sep = (
    <span aria-hidden className="text-amber px-6 md:px-9 align-middle">
      ✺
    </span>
  )

  const strip = (
    <>
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center">
          <span>{it}</span>
          {sep}
        </span>
      ))}
    </>
  )

  if (reduce) {
    return (
      <div
        className={
          'border-y hairline overflow-hidden whitespace-nowrap py-4 font-mono text-[11px] tracking-[0.22em] text-taupe text-center ' +
          (className ?? '')
        }
      >
        {strip}
      </div>
    )
  }

  return (
    <div
      className={
        'group border-y hairline overflow-hidden whitespace-nowrap py-4 font-mono text-[11px] tracking-[0.22em] text-taupe select-none ' +
        (className ?? '')
      }
    >
      <div
        className="zrno-marquee-track inline-block will-change-transform group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        <span className="inline-flex items-center">{strip}</span>
        <span className="inline-flex items-center" aria-hidden>
          {strip}
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * AnimatedPrice — counts a number up to its value when scrolled into
 * view. Used for menu prices. Renders the final number on the server
 * and for reduced-motion, so content is always correct/SSR-stable.
 * ------------------------------------------------------------------ */
export function AnimatedPrice({
  value,
  suffix = ' Kč',
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (reduce || typeof window === 'undefined') return
    const node = ref.current
    if (!node) return
    // Pre-set to 0 only on the client just before animating, so SSR markup
    // and first paint show the real value (no hydration flash of 0).
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          setStarted(true)
          io.disconnect()
          const from = 0
          const to = value
          const duration = 900
          const start = performance.now()
          setDisplay(from)
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            // expo-out feel
            const eased = 1 - Math.pow(1 - t, 3)
            setDisplay(Math.round(from + (to - from) * eased))
            if (t < 1) requestAnimationFrame(tick)
            else setDisplay(to)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.6 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [reduce, value, started])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * useScrolled — true once the page has scrolled past `threshold`px.
 * Drives the nav condense / backdrop intensify. SSR-safe.
 * ------------------------------------------------------------------ */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

/* ------------------------------------------------------------------ *
 * UnderlineLink — an <a> whose amber underline wipes in from the left
 * on hover (pointer-fine only; degrades to a colour change otherwise).
 * ------------------------------------------------------------------ */
export function UnderlineLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a href={href} className={'zrno-underline relative ' + (className ?? '')}>
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ *
 * useParallaxY — maps an element's scroll progress to a translateY,
 * for the photo panels. Returns a MotionValue<string>.
 * ------------------------------------------------------------------ */
export function useParallaxY(
  targetRef: React.RefObject<HTMLElement | null>,
  distance = 60,
): MotionValue<string> {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  })
  return useTransform(scrollYProgress, [0, 1], [`-${distance}px`, `${distance}px`])
}
