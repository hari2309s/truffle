'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

export default function FinalCTA() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-truffle-amber/30 bg-truffle-card px-8 py-16 text-center"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-truffle-amber/[0.05]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-truffle-amber/10 blur-3xl rounded-full animate-glow-pulse" />
          {/* Corner accent orbs */}
          <div className="absolute top-0 left-0 w-[200px] h-[150px] bg-truffle-amber/[0.06] blur-2xl rounded-full" />
          <div className="absolute bottom-0 right-0 w-[200px] h-[150px] bg-truffle-amber/[0.06] blur-2xl rounded-full" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ y: [0, -10, 0], scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              >
                <Image src="/icons/truffle.png" alt="Truffle" width={56} height={56} />
              </motion.div>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
              Your finances are waiting <br className="hidden sm:block" />
              <span className="text-truffle-amber">to be unearthed</span>
            </h2>

            <p className="text-truffle-text-secondary text-lg leading-relaxed mb-10 max-w-lg mx-auto">
              Stop guessing where your money went. Start asking. Truffle is free to try — no card,
              no bank link, no catch.
            </p>

            <motion.a
              href={APP_URL}
              whileHover={{ scale: 1.05, boxShadow: '0 0 32px -4px rgba(232,168,78,0.45)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2.5 bg-truffle-amber text-truffle-bg font-black px-9 py-4 rounded-2xl hover:bg-truffle-amber-light transition-colors duration-150 text-lg"
            >
              Get Started Free
              <ArrowRightIcon />
            </motion.a>

            <p className="mt-6 text-sm text-truffle-muted">
              Free forever · No credit card · Takes 30 seconds
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}
