import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf6f0' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0d0c' },
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
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('truffle-theme')||'dark';document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
