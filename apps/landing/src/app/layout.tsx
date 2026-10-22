import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-grotesk',
})

export const viewport: Viewport = {
  // Mirrors --t-bg in globals.css for each scheme.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9e5dd' },
    { media: '(prefers-color-scheme: dark)', color: '#121211' },
  ],
}

export const metadata: Metadata = {
  title: 'Truffle — Your finances, unearthed',
  description:
    'The AI finance assistant that talks with you, not at you. Voice-first, no bank linking, no spreadsheets.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Truffle — Your finances, unearthed',
    description:
      'The AI finance assistant that talks with you, not at you. Voice-first, no bank linking.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme. 'system' means no class — the CSS
            follows the OS via prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('truffle-theme')||'dark';if(t!=='system')document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body className={`${spaceMono.variable} ${spaceGrotesk.variable} font-mono`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
