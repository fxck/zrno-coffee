import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useLayoutEffect, useRef } from 'react'

import appCss from '../styles.css?url'

// useLayoutEffect warns on the server; pick the right one per environment so
// the scroll reset lands before paint on the client without the SSR noise.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ZRNO — Specialty Coffee Roasters · Prague',
      },
      {
        name: 'description',
        content:
          'ZRNO is a specialty coffee roastery in Žižkov, Prague. Slow-roasted in small batches. Bold, dark, unmistakably ours.',
      },
      {
        name: 'theme-color',
        content: '#0b0908',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Anton&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

/* ------------------------------------------------------------------ *
 * RootLayout — plain Outlet, no route-level animation.
 *
 * (An earlier opacity crossfade caused layout shift + flashing: mode="wait"
 * leaves a blank frame between unmount/mount that collapses page height, and
 * the fade fought every page's own entrance reveals. Removed. The per-page
 * mount/scroll animations already carry the motion.)
 *
 * The only thing kept is a shift-free scroll reset on SPA navigation, which
 * also honors cross-page #anchor links (e.g. /#menu from a sub-page nav).
 * ------------------------------------------------------------------ */
function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // Skip the very first mount so browser scroll restoration (refresh /
  // back-forward) and deep links are preserved; only SPA navigations reset.
  const firstRef = useRef(true)

  useIsoLayoutEffect(() => {
    if (firstRef.current) {
      firstRef.current = false
      return
    }
    const hash = window.location.hash
    if (hash.length > 1) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname])

  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
