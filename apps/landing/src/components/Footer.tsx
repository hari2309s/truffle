'use client'

import Image from 'next/image'
import LanguageDropdown from './LanguageDropdown'
import { APP_URL, TRUFFLE_ICON } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

const linkClass = 'min-h-10 flex items-center text-sm hover:underline underline-offset-4'

export default function Footer() {
  const { t } = useLanguage()
  const { product, legal } = t.footer.groups

  return (
    <footer className="border-t border-dashed border-truffle-border bg-truffle-surface pt-[clamp(40px,5cqi,64px)] px-[clamp(16px,5.5cqi,80px)] pb-7">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-10">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-8">
          <div className="flex flex-col gap-3">
            <a href="/" className="flex items-center gap-2.5">
              <Image src={TRUFFLE_ICON} alt="" width={32} height={32} />
              <span className="text-[15px] font-bold tracking-[.16em] uppercase">Truffle</span>
            </a>
            <span className="font-grotesk text-base text-truffle-text2">{t.footer.tagline}</span>
            <div className="self-start">
              <LanguageDropdown variant="name" align="left" />
            </div>
          </div>

          <nav aria-label={product.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold tracking-[.14em] uppercase text-truffle-text2 pb-1.5">
              {product.label}
            </span>
            {product.links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
            <a href={APP_URL} className={linkClass}>
              {t.footer.demo}
            </a>
          </nav>

          <nav aria-label={legal.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold tracking-[.14em] uppercase text-truffle-text2 pb-1.5">
              {legal.label}
            </span>
            {legal.links.map((link) => (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-dashed border-truffle-border pt-4 text-[11px] tracking-[.08em] uppercase text-truffle-text2">
          <span>
            {t.footer.copyright(new Date().getFullYear())} ·{' '}
            <a
              href="https://github.com/hari2309s"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-truffle-text underline-offset-4 hover:underline"
            >
              {t.footer.builtBy}
            </a>
          </span>
          <span>{t.footer.bottomTagline}</span>
        </div>
      </div>
    </footer>
  )
}
