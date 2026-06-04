import { useId } from 'react'

/* ------------------------------------------------------------------ *
 * BeanMark — the ZRNO "O", angled, used as the logo glyph.
 *
 * Anton's "O" is a tall capsule with a capsule cut-out — which, tipped
 * ~18°, reads as a roasted coffee bean. We rebuild it as an SVG (capsule
 * minus capsule, punched with a mask so the hole is genuinely transparent
 * over any background) so it can sit inline in the wordmark, scale to any
 * size, and tint via currentColor. One mark, the whole identity.
 * ------------------------------------------------------------------ */
export function BeanMark({
  className,
  angle = -18,
  title,
}: {
  className?: string
  angle?: number
  title?: string
}) {
  // useId → unique mask id so multiple marks on a page don't collide.
  const maskId = 'beanmask-' + useId().replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 100 150"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="150" fill="black" />
          <g transform={`rotate(${angle} 50 75)`}>
            <rect x="16" y="8" width="68" height="134" rx="34" fill="white" />
            <rect x="42" y="44" width="16" height="62" rx="8" fill="black" />
          </g>
        </mask>
      </defs>
      <rect width="100" height="150" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * Wordmark — "ZRN" + the angled bean as the O. Inherits font-size from
 * its parent so it scales with whatever type scale it sits in.
 * ------------------------------------------------------------------ */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        'inline-flex items-center font-display tracking-wider ' + (className ?? '')
      }
      aria-label="ZRNO"
    >
      <span aria-hidden>ZRN</span>
      <BeanMark className="ml-[0.05em] h-[0.8em] w-[0.56em] translate-y-[0.02em]" />
    </span>
  )
}
