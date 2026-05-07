import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Truffle — Your finances, unearthed',
  description:
    'The AI finance assistant that talks with you, not at you. Voice-first, no bank linking, no spreadsheets.',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('truffle-theme')||'dark';document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
