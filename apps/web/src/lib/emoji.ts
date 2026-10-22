/** Matches a grapheme that renders as an emoji (pictographs, flags, keycaps). */
const EMOJI_RE = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u

/** The API stores emoji in a short text column (≤ 20 UTF-16 units). */
const MAX_LENGTH = 20

/**
 * The last emoji in `text`, as one whole grapheme (so 👩🏽‍💻, 🇮🇪 and 1️⃣ stay
 * intact), or null if there is none. "Last" so typing a new one replaces the
 * previous pick.
 */
export function lastEmoji(text: string): string | null {
  const graphemes =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
      : Array.from(text)
  for (let i = graphemes.length - 1; i >= 0; i--) {
    const g = graphemes[i]!
    if (EMOJI_RE.test(g) && g.length <= MAX_LENGTH) return g
  }
  return null
}
