import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { THEME_COLORS } from '@/lib/themeColors'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Truffle — Your finances, unearthed.',
  description:
    "Talk to your money. Truffle listens, understands, and surfaces what's hiding beneath the surface of your financial life — without the dread.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Truffle',
  },
  openGraph: {
    title: 'Truffle',
    description: 'Your finances, unearthed.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // A single tag (not a media-query pair) — the in-app theme toggle can
  // diverge from the OS color scheme, and `useTheme.ts` keeps this tag's
  // `content` in sync with whichever background is actually on screen.
  // This starting value matches the anti-flash script's 'dark' default below.
  themeColor: THEME_COLORS.dark,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash on load — also seeds the tab/PWA chrome color
            (meta[name=theme-color]) to match, ahead of useTheme's effect. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              var t = localStorage.getItem('truffle-theme') || 'dark';
              if (t !== 'system') document.documentElement.classList.add(t);
              var resolved = t === 'system'
                ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : t;
              var meta = document.querySelector('meta[name="theme-color"]');
              if (meta) meta.setAttribute('content', resolved === 'light' ? '${THEME_COLORS.light}' : '${THEME_COLORS.dark}');
            })()`,
          }}
        />
      </head>
      <body className={`${inter.className} h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
