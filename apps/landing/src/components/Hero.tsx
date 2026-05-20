'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

const words = [
  { text: 'Your', amber: false },
  { text: 'finances,', amber: false },
  { text: 'unearthed.', amber: true },
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <HeroBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-truffle-amber/40 bg-truffle-amber/10 text-truffle-amber text-xs font-semibold uppercase tracking-wider"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-truffle-amber animate-pulse-slow" />
              Voice-first · AI-powered
            </motion.div>

            {/* Headline — words clip-reveal from below */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              {words.map((w, i) => (
                <span key={w.text} className="inline-block overflow-hidden mr-[0.22em]">
                  <motion.span
                    initial={{ y: '110%' }}
                    animate={{ y: '0%' }}
                    transition={{
                      delay: 0.15 + i * 0.15,
                      duration: 0.75,
                      ease: [0.76, 0, 0.24, 1],
                    }}
                    className={`inline-block ${w.amber ? 'text-truffle-amber' : 'text-truffle-text'}`}
                  >
                    {w.text}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg sm:text-xl text-truffle-text-secondary leading-relaxed mb-10 max-w-md"
            >
              The AI finance assistant that talks{' '}
              <em className="not-italic font-semibold text-truffle-text">with</em> you, not at you.
              No spreadsheets. No bank linking. Just speak.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.78, duration: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <a href={APP_URL} className="btn-primary inline-flex items-center gap-2 text-base">
                Get Started Free
                <ArrowRightIcon />
              </a>
              <a href="#features" className="btn-outline inline-flex items-center gap-2 text-base">
                See how it works
                <ChevronDownIcon />
              </a>
            </motion.div>

            {/* Social proof nudge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-8 text-sm text-truffle-muted"
            >
              Free to start · No credit card · No bank credentials
            </motion.p>
          </div>

          {/* Right: chat mockup — desktop only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <ChatMockup />
          </motion.div>
        </div>

        {/* Chat mockup — mobile, below CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="lg:hidden mt-16"
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  )
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Primary amber radial glow — center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-truffle-amber/[0.07] blur-[120px] animate-glow-pulse" />
      {/* Secondary orb — top-right for depth */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] rounded-full bg-truffle-amber/[0.04] blur-[100px]" />
      {/* Tertiary orb — bottom-left */}
      <div className="absolute bottom-1/4 left-0 w-[360px] h-[280px] rounded-full bg-truffle-amber/[0.03] blur-[90px]" />
      {/* Subtle grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.32 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(var(--t-border) 1px, transparent 1px), linear-gradient(90deg, var(--t-border) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Vignette fade at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-truffle-bg" />
      <div className="absolute inset-0 bg-gradient-to-r from-truffle-bg/40 via-transparent to-truffle-bg/40" />
    </div>
  )
}

function ChatMockup() {
  return (
    <div className="relative max-w-sm mx-auto lg:max-w-none animate-float">
      {/* Glow */}
      <div className="absolute -inset-4 bg-truffle-amber/8 rounded-3xl blur-2xl" />

      {/* Phone card */}
      <div className="relative bg-[#181714] border border-[#38362f] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#28261f]">
          <div className="flex items-center gap-2">
            <Image src="/icons/truffle.png" alt="Truffle" width={20} height={20} />
            <span className="text-sm font-black text-[#f5ead2] tracking-tight">truffle</span>
          </div>
          <span className="text-[11px] text-[#706a5e] font-medium">AI assistant</span>
        </div>

        {/* Chat area */}
        <div className="px-4 py-5 space-y-4 min-h-[260px]">
          {/* User message */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4, duration: 0.4, ease: 'easeOut' }}
            className="flex justify-end"
          >
            <div className="bg-truffle-amber/20 border border-truffle-amber/30 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[82%]">
              <p className="text-sm text-[#f5ead2] leading-relaxed">
                How much did I spend on food this week?
              </p>
            </div>
          </motion.div>

          {/* Typing dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ delay: 2.3, duration: 1.4, times: [0, 0.1, 0.85, 1] }}
            className="flex items-center gap-1.5 bg-[#242220] border border-[#38362f] rounded-2xl rounded-tl-sm px-4 py-3 w-fit"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 0.75, delay: i * 0.18 }}
                className="block w-1.5 h-1.5 rounded-full bg-[#706a5e]"
              />
            ))}
          </motion.div>

          {/* AI response */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.7, duration: 0.5, ease: 'easeOut' }}
            className="flex justify-start"
          >
            <div className="bg-[#242220] border border-[#38362f] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%]">
              <p className="text-sm text-[#f5ead2] leading-relaxed">
                You spent <span className="font-bold text-[#e8a84e]">$284</span> on food this week —{' '}
                <span className="text-[#c4845e]">$47 over last week.</span> Most of it was DoorDash{' '}
                <span className="text-[#706a5e]">(5 orders)</span> and Whole Foods{' '}
                <span className="text-[#706a5e]">(2 visits).</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Voice input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-t border-[#28261f]">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="relative flex-shrink-0 w-10 h-10 rounded-full bg-[#e8a84e] flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-[#e8a84e]"
            />
            <MicIcon />
          </motion.div>
          <p className="text-xs text-[#706a5e]">Hold to speak</p>
        </div>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0e0d0c"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
