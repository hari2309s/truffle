'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

export default function Footer() {
  const { t } = useLanguage()
  const { product, legal } = t.footer.groups
  const textRef = useRef<SVGTextElement>(null)
  const [textW, setTextW] = useState(720)

  useEffect(() => {
    if (textRef.current) {
      setTextW(textRef.current.getBBox().width)
    }
  }, [])

  return (
    <footer className="border-t border-truffle-border/60 bg-truffle-surface/20">
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-0">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/icons/truffle.png" alt="Truffle" width={26} height={26} />
              <span className="font-black text-lg text-truffle-text tracking-tight">truffle</span>
            </a>
            <p className="text-sm text-truffle-text-secondary leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
            <a
              href={APP_URL}
              className="inline-block mt-6 text-sm font-bold bg-truffle-amber text-truffle-bg px-5 py-2.5 rounded-xl hover:bg-truffle-amber-light active:scale-95 transition-all duration-150"
            >
              {t.footer.getStartedFree}
            </a>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-truffle-muted mb-4">
              {product.label}
            </p>
            <ul className="space-y-2.5">
              {product.links.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-truffle-text-secondary hover:text-truffle-text transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-truffle-muted mb-4">
              {legal.label}
            </p>
            <ul className="space-y-2.5">
              {legal.links.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-truffle-text-secondary hover:text-truffle-text transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-truffle-border/40" />
      </div>

      <div className="overflow-hidden w-full" style={{ marginBottom: '-4px' }} aria-hidden="true">
        <svg
          viewBox={`0 0 ${textW} 180`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          className="select-none block mx-auto"
          style={{ maxWidth: '1100px', overflow: 'visible' }}
        >
          <style>{`
            @keyframes truffle-dash {
              from { stroke-dashoffset: 600; }
              to   { stroke-dashoffset: 0; }
            }
            .footer-glow-text { animation: truffle-dash 12s linear infinite; }

            .footer-ghost { stroke: rgba(232,168,78,0.35); }
            .footer-glow-text { stroke: rgba(232,168,78,1); }

            :root.light .footer-ghost { stroke: rgba(120,70,0,0.4); }
            :root.light .footer-glow-text { stroke: rgba(140,80,0,0.95); }

            @media (prefers-color-scheme: light) {
              :root:not(.dark) .footer-ghost { stroke: rgba(120,70,0,0.4); }
              :root:not(.dark) .footer-glow-text { stroke: rgba(140,80,0,0.95); }
            }
          `}</style>

          {/* Invisible measuring text */}
          <text
            ref={textRef}
            x="0"
            y="168"
            fontFamily="'Inter', system-ui, sans-serif"
            fontWeight="100"
            fontSize="170"
            letterSpacing="-5"
            fill="transparent"
            stroke="none"
            opacity="0"
          >
            truffle
          </text>

          {/* Ghost outline */}
          <text
            x="0"
            y="168"
            fontFamily="'Inter', system-ui, sans-serif"
            fontWeight="100"
            fontSize="170"
            letterSpacing="-5"
            fill="transparent"
            strokeWidth="0.8"
            className="footer-ghost"
          >
            truffle
          </text>

          {/* Traveling glow dash */}
          <text
            x="0"
            y="168"
            fontFamily="'Inter', system-ui, sans-serif"
            fontWeight="100"
            fontSize="170"
            letterSpacing="-5"
            fill="transparent"
            strokeWidth="0.8"
            strokeDasharray="120 480"
            strokeDashoffset="600"
            className="footer-glow-text"
            style={{
              filter: 'drop-shadow(0 0 3px currentColor) drop-shadow(0 0 10px currentColor)',
            }}
          >
            truffle
          </text>
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-truffle-muted">
          © {new Date().getFullYear()} Truffle. Built by{' '}
          <a
            href="https://github.com/hari2309s"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-truffle-text-secondary transition-colors"
          >
            Hariharan Selvaraj
          </a>
          .
        </p>
        <p className="text-xs text-truffle-muted">
          Made with ♥ in Berlin &nbsp;·&nbsp; {t.footer.bottomTagline}
        </p>
      </div>
    </footer>
  )
}
