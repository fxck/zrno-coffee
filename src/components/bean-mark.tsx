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
