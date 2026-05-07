import Image from 'next/image'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '#'

const links = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-truffle-border/60 bg-truffle-surface/20">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/icons/truffle.png" alt="Truffle" width={26} height={26} />
              <span className="font-black text-lg text-truffle-text tracking-tight">truffle</span>
            </a>
            <p className="text-sm text-truffle-text-secondary leading-relaxed max-w-xs">
              Your finances, unearthed. A voice-first personal finance assistant that talks with you, not at you.
            </p>
            <a
              href={APP_URL}
              className="inline-block mt-6 text-sm font-bold bg-truffle-amber text-truffle-bg px-5 py-2.5 rounded-xl hover:bg-truffle-amber-light active:scale-95 transition-all duration-150"
            >
              Get started free →
            </a>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-truffle-muted mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
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
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-truffle-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            No bank linking. No spreadsheets. Just talk.
          </p>
        </div>
      </div>
    </footer>
  )
}
