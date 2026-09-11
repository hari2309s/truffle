// Single source of truth for the app's dark/light background colors, mirrored
// from `--t-bg` in globals.css. Drives the `theme-color` meta tag that tints
// the browser tab / PWA title bar (see layout.tsx + hooks/useTheme.ts).
//
// `public/manifest.json`'s `theme_color`/`background_color` mirror the dark
// value too — a static Web App Manifest can't import this module, so keep it
// in sync by hand if these ever change.
export const THEME_COLORS = {
  dark: '#0e0d0c',
  light: '#faf6f0',
} as const
