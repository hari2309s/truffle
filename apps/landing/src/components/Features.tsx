'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: <MicIcon />,
    title: 'Voice-First Chat',
    desc: "Ask 'How much did I spend on food this week?' out loud. Truffle understands natural language and remembers your context.",
  },
  {
    icon: <CameraIcon />,
    title: 'Receipt Scanner',
    desc: 'Snap a receipt or upload a PDF. Truffle extracts every line and categorizes it automatically — no manual entry needed.',
  },
  {
    icon: <ChartIcon />,
    title: 'AI Spending Insights',
    desc: 'Anomalies, trends, and month-end forecasts — surfaced automatically. Know where your money goes before you run out.',
  },
  {
    icon: <TargetIcon />,
    title: 'Savings Goals',
    desc: 'Set a goal with a deadline. Get nudged when you fall behind. Get celebrated when you hit milestones.',
  },
  {
    icon: <RepeatIcon />,
    title: 'Smart Habits',
    desc: 'Build weekly saving streaks. Truffle tracks every contribution and rewards consistency with milestone celebrations.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Privacy First',
    desc: 'No bank linking. Ever. You enter your data — Truffle analyzes it. Nothing is sold, shared, or synced without you.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const

const card = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
} as const

export default function Features() {
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label mb-4">Features</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
            Everything you need, <span className="text-truffle-amber">nothing you don't</span>
          </h2>
          <p className="text-lg text-truffle-text-secondary max-w-xl mx-auto leading-relaxed">
            Truffle is built for people who hate managing money — so it does the heavy lifting for
            you.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={card}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group relative bg-truffle-card border border-truffle-border rounded-2xl p-6 overflow-hidden cursor-default"
            >
              {/* Top edge accent line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-truffle-amber/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Hover glow */}
              <div className="absolute inset-0 bg-truffle-amber/0 group-hover:bg-truffle-amber/[0.03] transition-colors duration-300 rounded-2xl" />

              {/* Icon */}
              <div className="relative w-11 h-11 rounded-xl bg-truffle-amber/10 border border-truffle-amber/20 flex items-center justify-center mb-5 text-truffle-amber group-hover:bg-truffle-amber/20 transition-colors duration-300">
                {f.icon}
              </div>

              {/* Text */}
              <h3 className="relative font-bold text-truffle-text text-lg mb-2">{f.title}</h3>
              <p className="relative text-sm text-truffle-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function MicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
