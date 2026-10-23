import type { Variants, Transition } from 'framer-motion'

/** Shared easing — matches the web app's UI motion. */
export const truffleEase = [0.4, 0, 0.2, 1] as const

export const transitionBase: Transition = { duration: 0.45, ease: truffleEase }
export const transitionSnappy: Transition = { duration: 0.3, ease: truffleEase }

/** Fade-rise used by every section wrapper. */
export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: transitionBase },
}

/** Stagger container — use with `whileInView="show"` */
export const staggerContainer = (
  stagger = 0.06,
  delay = 0.08,
): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

/** Stagger child — pairs with staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: transitionSnappy },
}

/** Scale-fade for cards / slips entering viewport. */
export const slipVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: truffleEase } },
}

/** Viewport trigger defaults for whileInView. */
export const viewportOnce = { once: true, margin: '-60px' as const }
