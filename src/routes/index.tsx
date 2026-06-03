import { createFileRoute, Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { MENU } from '../lib/menu'
import {
  AnimatedPrice,
  EASE_OUT,
  MagneticButton,
  Marquee,
  MaskedLines,
  Reveal,
  ScrollProgress,
  UnderlineLink,
  useParallaxY,
  usePointerFine,
  useScrolled,
} from '../components/motion-primitives'

export const Route = createFileRoute('/')({ component: Home })

const NAV: Array<[string, string]> = [
  ['Menu', '#menu'],
  ['Story', '#story'],
  ['Roastery', '#story'],
  ['Visit', '#visit'],
]

const DETAILS = [
  { h: 'Address', lines: ['Kubelíkova 22', '130 00 Praha 3', 'Žižkov'] },
  { h: 'Hours', lines: ['Mon–Fri  7:00–19:00', 'Sat–Sun  8:00–18:00'] },
  { h: 'Contact', lines: ['+420 212 345 678', 'ahoj@zrno.cz', '@zrnocoffee'] },
]

const MARQUEE = [
  'SLOW-ROASTED IN SMALL BATCHES',
  'SINGLE-ESTATE GREEN BEANS',
  'ROASTED WEEKLY IN ŽIŽKOV',
  'BOLD · DARK · UNMISTAKABLY OURS',
  'SPECIALTY COFFEE · PRAGUE',
]

function Home() {
  const [subEmail, setSubEmail] = useState('')
  const [subState, setSubState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [subMsg, setSubMsg] = useState('')

  const reduce = useReducedMotion()
  const fine = usePointerFine()
  const scrolled = useScrolled(28)

  // Hero parallax: photo drifts up + slowly scales as the hero scrolls away.
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroBgY = useTransform(heroProgress, [0, 1], ['0%', '24%'])
  const heroBgScale = useTransform(heroProgress, [0, 1], [1.06, 1.16])
  const heroContentY = useTransform(heroProgress, [0, 1], ['0%', '14%'])
  const heroFade = useTransform(heroProgress, [0, 0.85], [1, 0])

  // Photo-panel parallax (story + visit).
  const roastRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const roastY = useParallaxY(roastRef, 48)
  const barY = useParallaxY(barRef, 56)

  async function subscribe(e: React.FormEvent) {
    e.preventDefault()
    setSubState('busy')
    setSubMsg('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Subscription failed.')
      setSubState('done')
      setSubMsg('You’re on the list — check your inbox.')
      setSubEmail('')
    } catch (err: any) {
      setSubState('error')
      setSubMsg(err.message || 'Something went wrong.')
    }
  }

  return (
    <div className="font-body bg-espresso text-cream">
      <ScrollProgress />

      {/* NAV — condenses + intensifies its backdrop on scroll */}
      <motion.header
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-14 border-b hairline"
        initial={false}
        animate={{
          paddingTop: scrolled ? 12 : 20,
          paddingBottom: scrolled ? 12 : 20,
          backgroundColor: scrolled ? 'rgba(11,9,8,0.92)' : 'rgba(11,9,8,0.80)',
        }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        style={{
          backdropFilter: scrolled ? 'blur(14px)' : 'blur(8px)',
          WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'blur(8px)',
        }}
      >
        <motion.a
          href="#top"
          className="font-display text-2xl tracking-wider"
          animate={{ scale: scrolled ? 0.92 : 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          style={{ transformOrigin: 'left center' }}
        >
          ZRNO
        </motion.a>
        <nav className="hidden md:flex gap-9 font-mono text-[11px] tracking-[0.18em] text-taupe">
          {NAV.map(([label, href], i) => (
            <UnderlineLink key={i} href={href}>
              {label.toUpperCase()}
            </UnderlineLink>
          ))}
        </nav>
        <MagneticButton strength={0.28} radius={80}>
          <Link
            to="/order"
            className="zrno-cta inline-block bg-amber text-espresso font-mono text-[11px] tracking-[0.18em] px-5 py-3 hover:bg-amberdeep transition-[background-color,letter-spacing] duration-300 hover:tracking-[0.24em]"
          >
            ORDER ONLINE
          </Link>
        </MagneticButton>
      </motion.header>

      {/* HERO */}
      <section
        id="top"
        ref={heroRef}
        className="relative overflow-hidden bg-espresso"
      >
        {/* Parallax photo layer (transform/opacity only) */}
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/hero.jpg)',
            y: reduce ? 0 : heroBgY,
            scale: reduce ? 1.06 : heroBgScale,
            willChange: 'transform',
          }}
        />
        {/* Gradient scrim (kept as its own layer so the photo can move under it) */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(11,9,8,0.80) 0%, rgba(11,9,8,0.42) 45%, rgba(11,9,8,0.96) 100%)',
          }}
        />
        <motion.div
          className="relative z-10 flex min-h-[86vh] flex-col justify-between pt-16"
          style={{ y: reduce ? 0 : heroContentY, opacity: reduce ? 1 : heroFade }}
        >
          <motion.div
            className="flex justify-between px-6 md:px-14 font-mono text-[11px] md:text-xs tracking-[0.2em] text-taupe"
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}
          >
            <span>SPECIALTY COFFEE ROASTERS</span>
            <span>PRAGUE · EST. 2014</span>
          </motion.div>
          <div>
            <motion.p
              className="px-6 md:px-14 max-w-xl text-lg md:text-xl leading-relaxed text-cream/90 mb-4"
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.35 }}
            >
              Slow-roasted in small batches in the heart of Prague. Bold, dark,
              unmistakably ours.
            </motion.p>
            <h1 className="font-display t-hero px-4 md:px-10 -mb-[1.5vw] select-none">
              <MaskedLines
                lines={['ZRNO']}
                trigger="mount"
                delay={0.5}
                duration={1.1}
              />
            </h1>
          </div>
        </motion.div>
      </section>

      {/* STATEMENT */}
      <section className="px-6 md:px-14 py-28 md:py-44">
        <Reveal as="div" className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-taupe">
          <motion.span
            className="text-amber text-base leading-none"
            animate={reduce ? {} : { opacity: [1, 0.35, 1] }}
            transition={
              reduce ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            ●
          </motion.span>{' '}
          OUR PHILOSOPHY
        </Reveal>
        <h2 className="font-display t-xl mt-10">
          <MaskedLines
            lines={['BREWED FOR', <span className="text-amber">THE BOLD.</span>]}
            stagger={0.14}
          />
        </h2>
      </section>

      {/* Slow marquee strip between philosophy and menu */}
      <Marquee items={MARQUEE} speed={42} />

      {/* MENU */}
      <section id="menu" className="bg-surface px-6 md:px-14 py-24 md:py-32">
        <Reveal as="div" className="flex items-end justify-between flex-wrap gap-6" stagger>
          <div>
            <div className="font-mono text-xs tracking-[0.2em] text-amber">
              WHAT WE POUR
            </div>
            <h2 className="font-display t-lg mt-4">THE MENU</h2>
          </div>
          <div className="font-mono text-xs tracking-wide text-taupe">
            PRICES IN Kč · TAP TO ORDER
          </div>
        </Reveal>

        <div className="mt-12 md:mt-16">
          {MENU.map((it, i) => (
            <motion.div
              key={it.id}
              className="border-t hairline"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={reduce ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: Math.min(i * 0.05, 0.3) }}
            >
              <Link
                to="/order"
                search={{ add: it.id }}
                aria-label={`Add ${it.name} to your order`}
                className="menu-row group flex items-end justify-between gap-6 py-6 md:py-7 cursor-pointer"
              >
                <div className="flex items-end gap-5 flex-wrap">
                  <span className="relative font-display menu-name text-3xl md:text-5xl leading-none">
                    {/* amber underline marker wipes in on hover (desktop) */}
                    <span
                      aria-hidden
                      className="menu-marker absolute -bottom-1 left-0 right-0 h-[2px] bg-amber"
                    />
                    {it.name.toUpperCase()}
                  </span>
                  <span className="text-sm text-taupe mb-1 max-w-xs">
                    {it.desc}
                  </span>
                </div>
                <div className="flex items-end gap-4 shrink-0">
                  <span className="hidden md:inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] text-amber opacity-0 -translate-x-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
                    ADD
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <span className="menu-price font-display text-2xl md:text-4xl text-amber leading-none whitespace-nowrap">
                    <AnimatedPrice value={it.price} suffix="" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
          <div className="border-t hairline" />
        </div>
      </section>

      {/* STORY */}
      <section id="story" className="px-6 md:px-14 py-28 md:py-40">
        <div className="grid md:grid-cols-[1fr_2fr_1fr] gap-10 md:gap-12 items-start">
          <Reveal as="div" className="font-mono text-xs leading-relaxed" delay={0.05}>
            <div className="text-amber tracking-[0.15em]">(01) — THE ROASTERY</div>
            <div className="text-muted mt-3">Roasted weekly in Žižkov, Prague 3.</div>
          </Reveal>
          <div className="flex flex-col items-center gap-8">
            <p className="font-body text-2xl md:text-3xl font-medium leading-snug text-center text-cream">
              <MaskedLines
                duration={0.85}
                stagger={0.08}
                lines={[
                  'We source green beans from single estates, then roast them dark and',
                  'slow in a converted workshop. No shortcuts, no compromise — only the',
                  'deep, caramelised character Prague has come to know us for.',
                ]}
              />
            </p>
            <Reveal
              as="div"
              className="font-mono text-[11px] tracking-[0.2em] text-taupe"
              delay={0.2}
            >
              — TOMÁŠ &amp; LENKA, FOUNDERS
            </Reveal>
          </div>
          <Reveal
            as="div"
            className="font-mono text-xs tracking-[0.15em] text-cream md:text-right"
            delay={0.1}
          >
            <Link to="/journal" className="zrno-underline relative">
              READ THE JOURNAL →
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 md:mt-24 md:pl-[18%]">
          <Reveal as="div" y={36} className="max-w-2xl">
            <div
              ref={roastRef}
              className="relative h-64 md:h-80 overflow-hidden flex items-end p-6"
            >
              <motion.div
                aria-hidden
                className="absolute inset-[-12%] bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/roastery.jpg)',
                  y: reduce ? 0 : roastY,
                  willChange: 'transform',
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(0deg, rgba(11,9,8,0.72) 0%, rgba(11,9,8,0.08) 55%)',
                }}
              />
              <span className="relative z-10 font-mono text-[11px] tracking-[0.2em] text-cream/70">
                ROASTERY · ŽIŽKOV
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VISIT */}
      <section id="visit" className="bg-surface grid md:grid-cols-2">
        <div
          ref={barRef}
          className="relative min-h-[320px] md:min-h-[560px] overflow-hidden flex items-end p-8"
        >
          <motion.div
            aria-hidden
            className="absolute inset-[-10%] bg-cover bg-center"
            style={{
              backgroundImage: 'url(/bar.jpg)',
              y: reduce ? 0 : barY,
              willChange: 'transform',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(0deg, rgba(11,9,8,0.78) 0%, rgba(11,9,8,0.12) 60%)',
            }}
          />
          <span className="relative z-10 font-mono text-[11px] tracking-[0.2em] text-cream/70">
            THE BAR · KUBELÍKOVA
          </span>
        </div>
        <div className="flex flex-col justify-between gap-12 p-8 md:p-16">
          <Reveal as="div">
            <div className="font-mono text-xs tracking-[0.2em] text-amber">FIND US</div>
            <h2 className="font-display t-md mt-4">
              <MaskedLines lines={['VISIT THE BAR']} duration={0.85} />
            </h2>
          </Reveal>
          <Reveal
            as="div"
            className="grid grid-cols-2 md:grid-cols-3 gap-8"
            stagger
            staggerAmount={0.12}
          >
            {DETAILS.map((c) => (
              <div key={c.h}>
                <div className="font-mono text-[11px] tracking-[0.2em] text-muted">
                  {c.h.toUpperCase()}
                </div>
                <div className="mt-3 space-y-1.5">
                  {c.lines.map((ln) => (
                    <div key={ln} className="text-base">
                      {ln}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-14 pt-28 md:pt-40 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <h2 className="font-display t-xl">
            <MaskedLines lines={['STAY', 'CAFFEINATED.']} stagger={0.14} />
          </h2>
          <Reveal as="div" className="max-w-md w-full" delay={0.1}>
            <p className="text-taupe leading-relaxed">
              Join the list for new single-origin drops, brewing notes and events
              at the bar.
            </p>
            <AnimatePresence mode="wait" initial={false}>
              {subState === 'done' ? (
                <motion.div
                  key="sub-done"
                  initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                  className="mt-5 flex items-center gap-4 bg-elevated p-4 pl-5 border-l-2 border-amber"
                >
                  <motion.span
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.06 }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber text-espresso"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <motion.path
                        d="M20 6 9 17l-5-5"
                        initial={reduce ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.18, ease: 'easeOut' }}
                      />
                    </svg>
                  </motion.span>
                  <div>
                    <div className="font-mono text-[11px] tracking-[0.18em] text-amber">
                      YOU’RE ON THE LIST
                    </div>
                    <div className="text-sm text-taupe mt-0.5">
                      Welcome email sent — check your inbox.
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="sub-form"
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  className="mt-5 flex items-center bg-elevated p-2 pl-5"
                  onSubmit={subscribe}
                >
                  <input
                    type="email"
                    required
                    value={subEmail}
                    onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="your@email.cz"
                    className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted text-cream"
                  />
                  <motion.button
                    type="submit"
                    disabled={subState === 'busy'}
                    className="zrno-cta bg-amber text-espresso font-mono text-[11px] tracking-[0.15em] px-5 py-3 hover:bg-amberdeep transition-[background-color,letter-spacing] duration-300 hover:tracking-[0.22em] disabled:opacity-60"
                    whileHover={fine && !reduce ? { scale: 1.04 } : undefined}
                    whileTap={fine && !reduce ? { scale: 0.96 } : undefined}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  >
                    {subState === 'busy' ? 'SENDING…' : 'SUBSCRIBE'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
            {subState === 'error' && subMsg && (
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="mt-3 text-sm text-red-400"
              >
                {subMsg}
              </motion.p>
            )}
          </Reveal>
        </div>

        <div className="border-t hairline mt-16 pt-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-[11px] tracking-wide text-muted">
          <span className="font-display text-xl tracking-wider text-cream">ZRNO</span>
          <span>© 2026 ZRNO COFFEE — PRAGUE</span>
          <UnderlineLink href="#top" className="text-taupe">
            BACK TO TOP ↑
          </UnderlineLink>
        </div>
      </footer>
    </div>
  )
}
