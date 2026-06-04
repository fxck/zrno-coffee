import { useId } from 'react'

/* ------------------------------------------------------------------ *
 * BeanO — the actual Anton "O", tipped to the right so it reads as a
 * roasted bean. Because it's the real font glyph, it's exactly the same
 * size and weight as the surrounding caps (no SVG/viewBox shrinkage).
 * This is the logo mark used on its own in the app bars.
 * ------------------------------------------------------------------ */
export function BeanO({
  className,
  angle = 18,
}: {
  className?: string
  angle?: number
}) {
  return (
    <span
      aria-hidden
      className={'inline-block font-display ' + (className ?? '')}
      style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50% 55%' }}
    >
      O
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Wordmark — "ZRN" + the angled "O" bean, all real font glyphs at one
 * size. Used where the full brand is spelled out (hero, footer, ticket).
 * ------------------------------------------------------------------ */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        'inline-flex items-baseline font-display tracking-wider ' +
        (className ?? '')
      }
      aria-label="ZRNO"
    >
      <span aria-hidden>ZRN</span>
      <BeanO className="ml-[0.02em]" />
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * BeanMark — a small SVG bean (capsule with a punched hole), used as the
 * decorative accent inside the menu ADD pill where a tiny font glyph
 * would render too lightly.
 * ------------------------------------------------------------------ */
export function BeanMark({
  className,
  angle = 18,
}: {
  className?: string
  angle?: number
}) {
  const maskId = 'beanmask-' + useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden>
      <defs>
        <mask id={maskId}>
          <rect width="120" height="160" fill="black" />
          <g transform={`rotate(${angle} 60 80)`}>
            <rect x="25" y="11" width="70" height="138" rx="35" fill="white" />
            <rect x="51" y="46" width="18" height="68" rx="9" fill="black" />
          </g>
        </mask>
      </defs>
      <rect width="120" height="160" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}
